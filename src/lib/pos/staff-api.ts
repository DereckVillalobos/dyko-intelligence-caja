import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ANIMAL_KEYS, parseAnimal, parseColor } from "./avatar";
import { normalizeRole, type StaffRole } from "./staff";

type Sql = Awaited<ReturnType<(typeof import("@/lib/db"))["getSql"]>>;

async function db() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

export type PublicEmployee = {
  id: number;
  name: string;
  role: StaffRole;
  bound: boolean;
  animal: string;
  color: string;
  mustSetPin: boolean;
  pinResetRequested: boolean;
};

const pinSchema = z.string().regex(/^\d{4}$/, "El PIN debe tener 4 dígitos");
const animalSchema = z.enum(ANIMAL_KEYS);
const colorSchema = z.enum([
  "peach",
  "butter",
  "mint",
  "sky",
  "lilac",
  "rose",
  "cream",
  "sage",
]);
const jobSchema = z.enum(["ventas", "gondolero"]);

async function hashPin(pin: string, salt: string) {
  const { scryptSync } = await import("node:crypto");
  return scryptSync(pin, salt, 32).toString("hex");
}

async function verifyPin(pin: string, salt: string, hash: string) {
  const { timingSafeEqual } = await import("node:crypto");
  const next = Buffer.from(await hashPin(pin, salt), "hex");
  const prev = Buffer.from(hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

type EmployeeRow = {
  id: number;
  name: string;
  role: string;
  device_token: string | null;
  avatar_animal: string | null;
  avatar_color: string | null;
  must_set_pin: boolean | null;
  pin_reset_requested: boolean | null;
};

function asPublic(row: EmployeeRow): PublicEmployee {
  return {
    id: row.id,
    name: row.name,
    role: normalizeRole(row.role),
    bound: Boolean(row.device_token),
    animal: parseAnimal(row.avatar_animal),
    color: parseColor(row.avatar_color),
    mustSetPin: Boolean(row.must_set_pin),
    pinResetRequested: Boolean(row.pin_reset_requested),
  };
}

function asSession(row: EmployeeRow) {
  return {
    employeeId: row.id,
    name: row.name,
    role: normalizeRole(row.role),
    animal: parseAnimal(row.avatar_animal),
    color: parseColor(row.avatar_color),
  };
}

export const listEmployees = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await db();
  const rows = await sql<EmployeeRow>`
    select id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
    from employees
    where active = true and role <> 'gerente'
    order by name
  `;
  return rows.map(asPublic);
});

export const listGerentes = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await db();
  const rows = await sql<EmployeeRow>`
    select id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
    from employees
    where active = true and role = 'gerente'
    order by name
  `;
  return rows.map(asPublic);
});

export const listTeam = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await db();
  const rows = await sql<EmployeeRow>`
    select id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
    from employees
    where active = true and role <> 'gerente'
    order by
      case when role = 'pendiente' then 0 else 1 end,
      name
  `;
  return rows.map(asPublic);
});

export const getEmployee = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const sql = await db();
    const rows = await sql<EmployeeRow>`
      select id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
      from employees
      where id = ${data.id} and active = true
      limit 1
    `;
    return rows[0] ? asPublic(rows[0]) : null;
  });

export const findBoundEmployee = createServerFn({ method: "POST" })
  .validator(z.object({ deviceId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const sql = await db();
    const rows = await sql<EmployeeRow>`
      select id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
      from employees
      where device_token = ${data.deviceId} and active = true
      limit 1
    `;
    return rows[0] ? asPublic(rows[0]) : null;
  });

async function unlockRow(
  sql: Sql,
  employeeId: number,
  pin: string,
  deviceId: string,
  bind: boolean,
) {
  const rows = await sql<{
    id: number;
    name: string;
    role: string;
    pin_hash: string;
    pin_salt: string;
    device_token: string | null;
    failed_attempts: number;
    locked_until: string | null;
    avatar_animal: string | null;
    avatar_color: string | null;
    must_set_pin: boolean | null;
    pin_reset_requested: boolean | null;
  }>`
    select id, name, role, pin_hash, pin_salt, device_token,
           failed_attempts, locked_until::text as locked_until,
           avatar_animal, avatar_color, must_set_pin, pin_reset_requested
    from employees
    where id = ${employeeId} and active = true
    limit 1
  `;
  const row = rows[0];
  if (!row) throw new Error("Empleado no encontrado");
  if (row.must_set_pin) {
    throw new Error("El gerente restableció su PIN. Cree uno nuevo.");
  }
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    throw new Error("Demasiados intentos. Espere medio minuto.");
  }
  if (!(await verifyPin(pin, row.pin_salt, row.pin_hash))) {
    const fails = Number(row.failed_attempts) + 1;
    if (fails >= 5) {
      await sql`
        update employees
        set failed_attempts = ${fails},
            locked_until = now() + interval '30 seconds'
        where id = ${row.id}
      `;
      throw new Error("PIN incorrecto. Caja bloqueada 30 segundos.");
    }
    await sql`update employees set failed_attempts = ${fails} where id = ${row.id}`;
    throw new Error(`PIN incorrecto. Le quedan ${5 - fails} intentos.`);
  }

  if (bind) {
    await sql`
      update employees
      set device_token = ${deviceId}, failed_attempts = 0, locked_until = null
      where id = ${row.id}
    `;
  } else {
    await sql`
      update employees
      set failed_attempts = 0, locked_until = null
      where id = ${row.id}
    `;
  }

  return asSession(row);
}

export const unlockEmployee = createServerFn({ method: "POST" })
  .validator(
    z.object({
      employeeId: z.number().int().positive(),
      pin: pinSchema,
      deviceId: z.string().uuid(),
      bind: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    return unlockRow(sql, data.employeeId, data.pin, data.deviceId, data.bind);
  });

export const setupFirstEmployee = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().trim().min(2).max(40),
      pin: pinSchema,
      deviceId: z.string().uuid(),
      bind: z.boolean(),
      animal: animalSchema,
      color: colorSchema,
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    const [{ n }] = await sql<{ n: number }>`
      select count(*)::int as n from employees
      where active = true and role <> 'gerente'
    `;
    if (n > 0) {
      const existing = await sql<EmployeeRow>`
        select id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
        from employees
        where active = true and role <> 'gerente'
        order by id
        limit 1
      `;
      if (existing[0]) return asSession(existing[0]);
      throw new Error("El equipo ya está configurado");
    }
    const { randomBytes } = await import("node:crypto");
    const salt = randomBytes(16).toString("hex");
    const pinHash = await hashPin(data.pin, salt);
    const token = data.bind ? data.deviceId : null;
    const rows = await sql<EmployeeRow>`
      insert into employees (name, pin_hash, pin_salt, role, device_token, avatar_animal, avatar_color)
      values (${data.name}, ${pinHash}, ${salt}, 'pendiente', ${token}, ${data.animal}, ${data.color})
      returning id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
    `;
    return asSession(rows[0]!);
  });

export const setupGerente = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().trim().min(2).max(40),
      pin: pinSchema,
      animal: animalSchema,
      color: colorSchema,
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    const [{ n }] = await sql<{ n: number }>`
      select count(*)::int as n from employees
      where active = true and role = 'gerente'
    `;
    if (n > 0) {
      const existing = await sql<EmployeeRow>`
        select id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
        from employees
        where active = true and role = 'gerente'
        order by id
        limit 1
      `;
      if (existing[0]) return asSession(existing[0]);
      throw new Error("Ya hay un gerente");
    }
    const { randomBytes } = await import("node:crypto");
    const salt = randomBytes(16).toString("hex");
    const pinHash = await hashPin(data.pin, salt);
    const rows = await sql<EmployeeRow>`
      insert into employees (name, pin_hash, pin_salt, role, avatar_animal, avatar_color)
      values (${data.name}, ${pinHash}, ${salt}, 'gerente', ${data.animal}, ${data.color})
      returning id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
    `;
    return asSession(rows[0]!);
  });

export const createEmployee = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().trim().min(2).max(40),
      pin: pinSchema,
      animal: animalSchema,
      color: colorSchema,
      actorId: z.number().int().positive().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    const { randomBytes } = await import("node:crypto");
    const salt = randomBytes(16).toString("hex");
    const pinHash = await hashPin(data.pin, salt);
    const rows = await sql<EmployeeRow>`
      insert into employees (name, pin_hash, pin_salt, role, avatar_animal, avatar_color)
      values (${data.name}, ${pinHash}, ${salt}, 'pendiente', ${data.animal}, ${data.color})
      returning id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
    `;
    return asPublic(rows[0]!);
  });

export const createGerente = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().trim().min(2).max(40),
      pin: pinSchema,
      animal: animalSchema,
      color: colorSchema,
      actorId: z.number().int().positive().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    if (data.actorId) {
      const actor = await sql<{ role: string }>`
        select role from employees where id = ${data.actorId} and active = true limit 1
      `;
      if (actor[0]?.role !== "gerente") throw new Error("Solo un gerente puede agregar otro gerente");
    }
    const { randomBytes } = await import("node:crypto");
    const salt = randomBytes(16).toString("hex");
    const pinHash = await hashPin(data.pin, salt);
    const rows = await sql<EmployeeRow>`
      insert into employees (name, pin_hash, pin_salt, role, avatar_animal, avatar_color)
      values (${data.name}, ${pinHash}, ${salt}, 'gerente', ${data.animal}, ${data.color})
      returning id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
    `;
    return asPublic(rows[0]!);
  });

export const assignPuesto = createServerFn({ method: "POST" })
  .validator(
    z.object({
      actorId: z.number().int().positive(),
      employeeId: z.number().int().positive(),
      role: jobSchema,
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    const actor = await sql<{ role: string }>`
      select role from employees where id = ${data.actorId} and active = true limit 1
    `;
    if (actor[0]?.role !== "gerente") throw new Error("Solo el gerente asigna puestos");
    const target = await sql<EmployeeRow>`
      select id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
      from employees
      where id = ${data.employeeId} and active = true
      limit 1
    `;
    if (!target[0]) throw new Error("Trabajador no encontrado");
    if (normalizeRole(target[0].role) === "gerente") {
      throw new Error("No se puede cambiar el puesto de un gerente");
    }
    const updated = await sql<EmployeeRow>`
      update employees
      set role = ${data.role}
      where id = ${data.employeeId}
      returning id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
    `;
    return asPublic(updated[0]!);
  });

export const unbindDevice = createServerFn({ method: "POST" })
  .validator(z.object({ deviceId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const sql = await db();
    await sql`update employees set device_token = null where device_token = ${data.deviceId}`;
    return { ok: true as const };
  });

export const requestPinReset = createServerFn({ method: "POST" })
  .validator(z.object({ employeeId: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const sql = await db();
    const rows = await sql<EmployeeRow>`
      update employees
      set pin_reset_requested = true
      where id = ${data.employeeId} and active = true and role <> 'gerente'
      returning id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
    `;
    if (!rows[0]) throw new Error("Empleado no encontrado");
    return asPublic(rows[0]);
  });

export const resetEmployeePin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      actorId: z.number().int().positive(),
      employeeId: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    const actor = await sql<{ role: string }>`
      select role from employees where id = ${data.actorId} and active = true limit 1
    `;
    if (actor[0]?.role !== "gerente") throw new Error("Solo el gerente restablece PIN");
    const rows = await sql<EmployeeRow>`
      update employees
      set must_set_pin = true,
          pin_reset_requested = false,
          failed_attempts = 0,
          locked_until = null,
          device_token = null
      where id = ${data.employeeId} and active = true and role <> 'gerente'
      returning id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
    `;
    if (!rows[0]) throw new Error("Trabajador no encontrado");
    return asPublic(rows[0]);
  });

export const setNewPin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      employeeId: z.number().int().positive(),
      pin: pinSchema,
      deviceId: z.string().uuid(),
      bind: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    const rows = await sql<{ id: number; must_set_pin: boolean }>`
      select id, must_set_pin from employees
      where id = ${data.employeeId} and active = true
      limit 1
    `;
    if (!rows[0]) throw new Error("Empleado no encontrado");
    if (!rows[0].must_set_pin) throw new Error("No hay un restablecimiento pendiente");
    const { randomBytes } = await import("node:crypto");
    const salt = randomBytes(16).toString("hex");
    const pinHash = await hashPin(data.pin, salt);
    const token = data.bind ? data.deviceId : null;
    const next = await sql<EmployeeRow>`
      update employees
      set pin_hash = ${pinHash},
          pin_salt = ${salt},
          must_set_pin = false,
          pin_reset_requested = false,
          failed_attempts = 0,
          locked_until = null,
          device_token = ${token}
      where id = ${data.employeeId}
      returning id, name, role, device_token, avatar_animal, avatar_color, must_set_pin, pin_reset_requested
    `;
    return asSession(next[0]!);
  });
