import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { StaffRole } from "./staff";

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
};

const pinSchema = z.string().regex(/^\d{4}$/, "El PIN debe tener 4 dígitos");

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

function asPublic(row: { id: number; name: string; role: string; device_token: string | null }): PublicEmployee {
  return {
    id: row.id,
    name: row.name,
    role: row.role === "admin" ? "admin" : "cajero",
    bound: Boolean(row.device_token),
  };
}

export const listEmployees = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await db();
  const rows = await sql<{
    id: number;
    name: string;
    role: string;
    device_token: string | null;
  }>`
    select id, name, role, device_token
    from employees
    where active = true
    order by name
  `;
  return rows.map(asPublic);
});

export const findBoundEmployee = createServerFn({ method: "POST" })
  .validator(z.object({ deviceId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const sql = await db();
    const rows = await sql<{
      id: number;
      name: string;
      role: string;
      device_token: string | null;
    }>`
      select id, name, role, device_token
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
  }>`
    select id, name, role, pin_hash, pin_salt, device_token,
           failed_attempts, locked_until::text as locked_until
    from employees
    where id = ${employeeId} and active = true
    limit 1
  `;
  const row = rows[0];
  if (!row) throw new Error("Empleado no encontrado");
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

  return {
    employeeId: row.id,
    name: row.name,
    role: (row.role === "admin" ? "admin" : "cajero") as StaffRole,
  };
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
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    const [{ n }] = await sql<{ n: number }>`select count(*)::int as n from employees`;
    if (n > 0) throw new Error("El equipo ya está configurado");
    const { randomBytes } = await import("node:crypto");
    const salt = randomBytes(16).toString("hex");
    const pinHash = await hashPin(data.pin, salt);
    const token = data.bind ? data.deviceId : null;
    const rows = await sql<{ id: number; name: string; role: string }>`
      insert into employees (name, pin_hash, pin_salt, role, device_token)
      values (${data.name}, ${pinHash}, ${salt}, 'admin', ${token})
      returning id, name, role
    `;
    const row = rows[0]!;
    return {
      employeeId: row.id,
      name: row.name,
      role: "admin" as const,
    };
  });

export const createEmployee = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().trim().min(2).max(40),
      pin: pinSchema,
      actorId: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    const actor = await sql<{ role: string }>`
      select role from employees where id = ${data.actorId} and active = true limit 1
    `;
    if (actor[0]?.role !== "admin") throw new Error("Solo un responsable puede agregar personal");
    const { randomBytes } = await import("node:crypto");
    const salt = randomBytes(16).toString("hex");
    const pinHash = await hashPin(data.pin, salt);
    const rows = await sql<{
      id: number;
      name: string;
      role: string;
      device_token: string | null;
    }>`
      insert into employees (name, pin_hash, pin_salt, role)
      values (${data.name}, ${pinHash}, ${salt}, 'cajero')
      returning id, name, role, device_token
    `;
    return asPublic(rows[0]!);
  });

export const unbindDevice = createServerFn({ method: "POST" })
  .validator(z.object({ deviceId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const sql = await db();
    await sql`update employees set device_token = null where device_token = ${data.deviceId}`;
    return { ok: true as const };
  });
