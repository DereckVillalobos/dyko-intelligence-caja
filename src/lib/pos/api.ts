import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { costaRicaStamp } from "@/lib/money";
import { DEFAULT_SETTINGS, SEED_PRODUCTS } from "./catalog";
import { parseAnimal, parseColor } from "./avatar";
import { normalizeRole } from "./staff";
import type {
  CashierStat,
  LowStockItem,
  ManagerOverview,
  PaymentMethod,
  Product,
  SaleDetail,
  SaleItem,
  SaleSummary,
  StoreSettings,
  TodaySummary,
} from "./types";

type Sql = Awaited<ReturnType<(typeof import("@/lib/db"))["getSql"]>>;

async function db() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

async function ensureSeed(sql: Sql) {
  const [{ n }] = await sql<{ n: number }>`select count(*)::int as n from products`;
  if (n === 0) {
    for (const p of SEED_PRODUCTS) {
      await sql`
        insert into products (barcode, name, category, price, stock)
        values (${p.barcode}, ${p.name}, ${p.category}, ${p.price}, ${p.stock})
        on conflict (barcode) do nothing
      `;
    }
  }
  await sql`
    insert into store_settings (key, value) values
      ('storeName', ${DEFAULT_SETTINGS.storeName}),
      ('sinpePhone', ${DEFAULT_SETTINGS.sinpePhone}),
      ('sinpeHolder', ${DEFAULT_SETTINGS.sinpeHolder})
    on conflict (key) do nothing
  `;
}

function asProduct(row: {
  id: number;
  barcode: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
}): Product {
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    stock: Number(row.stock),
    active: Boolean(row.active),
  };
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await db();
  await ensureSeed(sql);
  const rows = await sql<{
    id: number;
    barcode: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    active: boolean;
  }>`
    select id, barcode, name, category, price, stock, active
    from products
    where active = true
    order by category, name
  `;
  return rows.map(asProduct);
});

export const lookupBarcode = createServerFn({ method: "POST" })
  .validator(z.object({ barcode: z.string().trim().min(1).max(32) }))
  .handler(async ({ data }) => {
    const sql = await db();
    await ensureSeed(sql);
    const rows = await sql<{
      id: number;
      barcode: string;
      name: string;
      category: string;
      price: number;
      stock: number;
      active: boolean;
    }>`
      select id, barcode, name, category, price, stock, active
      from products
      where barcode = ${data.barcode} and active = true
      limit 1
    `;
    return rows[0] ? asProduct(rows[0]) : null;
  });

export const createProduct = createServerFn({ method: "POST" })
  .validator(
    z.object({
      barcode: z.string().trim().min(3).max(32),
      name: z.string().trim().min(2).max(80),
      category: z.string().trim().min(1).max(40),
      price: z.number().int().positive().max(10_000_000),
      stock: z.number().int().nonnegative().max(100_000),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    const rows = await sql<{
      id: number;
      barcode: string;
      name: string;
      category: string;
      price: number;
      stock: number;
      active: boolean;
    }>`
      insert into products (barcode, name, category, price, stock)
      values (${data.barcode}, ${data.name}, ${data.category}, ${data.price}, ${data.stock})
      returning id, barcode, name, category, price, stock, active
    `;
    return asProduct(rows[0]!);
  });

export const updateProduct = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.number().int().positive(),
      name: z.string().trim().min(2).max(80),
      category: z.string().trim().min(1).max(40),
      price: z.number().int().positive().max(10_000_000),
      stock: z.number().int().nonnegative().max(100_000),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    const rows = await sql<{
      id: number;
      barcode: string;
      name: string;
      category: string;
      price: number;
      stock: number;
      active: boolean;
    }>`
      update products
      set name = ${data.name},
          category = ${data.category},
          price = ${data.price},
          stock = ${data.stock}
      where id = ${data.id}
      returning id, barcode, name, category, price, stock, active
    `;
    if (!rows[0]) throw new Error("Producto no encontrado");
    return asProduct(rows[0]);
  });

const saleItemInput = z.object({
  productId: z.number().int().positive().nullable(),
  barcode: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(80),
  qty: z.number().int().positive().max(999),
  unitPrice: z.number().int().nonnegative().max(10_000_000),
});

export const completeSale = createServerFn({ method: "POST" })
  .validator(
    z.object({
      items: z.array(saleItemInput).min(1).max(80),
      paymentMethod: z.enum(["cash", "card", "sinpe"]),
      tendered: z.number().int().nonnegative(),
      employeeId: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    const staff = await sql<{ name: string; role: string }>`
      select name, role from employees where id = ${data.employeeId} and active = true limit 1
    `;
    if (!staff[0]) throw new Error("No hay un cajero activo en este teléfono");
    if (normalizeRole(staff[0].role) !== "ventas") {
      throw new Error("Este puesto no puede cobrar. Espere a que el gerente le asigne Ventas.");
    }
    const cashier = staff[0].name;
    const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
    const total = subtotal;
    if (data.paymentMethod === "cash" && data.tendered < total) {
      throw new Error("El monto recibido es menor al total");
    }
    const tendered = data.paymentMethod === "cash" ? data.tendered : total;
    const changeDue = data.paymentMethod === "cash" ? tendered - total : 0;

    const stamp = costaRicaStamp();
    const [{ n }] = await sql<{ n: number }>`
      select count(*)::int as n from sales where ticket like ${`DYK-${stamp}-%`}
    `;
    const ticket = `DYK-${stamp}-${String(n + 1).padStart(4, "0")}`;

    const inserted = await sql<{ id: number; created_at: string }>`
      insert into sales (ticket, subtotal, total, payment_method, tendered, change_due, cashier, employee_id, status)
      values (${ticket}, ${subtotal}, ${total}, ${data.paymentMethod}, ${tendered}, ${changeDue}, ${cashier}, ${data.employeeId}, 'completed')
      returning id, created_at::text as created_at
    `;
    const saleId = inserted[0]!.id;

    for (const item of data.items) {
      const lineTotal = item.unitPrice * item.qty;
      await sql`
        insert into sale_items (sale_id, product_id, barcode, name, qty, unit_price, line_total)
        values (${saleId}, ${item.productId}, ${item.barcode}, ${item.name}, ${item.qty}, ${item.unitPrice}, ${lineTotal})
      `;
      if (item.productId) {
        await sql`
          update products set stock = stock - ${item.qty} where id = ${item.productId}
        `;
      }
    }

    const items = await sql<{
      id: number;
      product_id: number | null;
      barcode: string;
      name: string;
      qty: number;
      unit_price: number;
      line_total: number;
    }>`
      select id, product_id, barcode, name, qty, unit_price, line_total
      from sale_items where sale_id = ${saleId} order by id
    `;

    const detail: SaleDetail = {
      id: saleId,
      ticket,
      subtotal,
      total,
      paymentMethod: data.paymentMethod,
      tendered,
      changeDue,
      cashier,
      status: "completed",
      createdAt: inserted[0]!.created_at,
      itemCount: items.length,
      items: items.map(mapSaleItem),
    };
    return detail;
  });

function mapSaleItem(row: {
  id: number;
  product_id: number | null;
  barcode: string;
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}): SaleItem {
  return {
    id: row.id,
    productId: row.product_id,
    barcode: row.barcode,
    name: row.name,
    qty: Number(row.qty),
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
  };
}

export const listSales = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await db();
  const rows = await sql<{
    id: number;
    ticket: string;
    total: number;
    payment_method: string;
    tendered: number;
    change_due: number;
    cashier: string;
    status: string;
    created_at: string;
    item_count: number;
  }>`
    select
      s.id,
      s.ticket,
      s.total,
      s.payment_method,
      s.tendered,
      s.change_due,
      s.cashier,
      s.status,
      s.created_at::text as created_at,
      (select count(*)::int from sale_items i where i.sale_id = s.id) as item_count
    from sales s
    order by s.created_at desc
    limit 200
  `;
  return rows.map(
    (row): SaleSummary => ({
      id: row.id,
      ticket: row.ticket,
      total: Number(row.total),
      paymentMethod: row.payment_method as PaymentMethod,
      tendered: Number(row.tendered),
      changeDue: Number(row.change_due),
      cashier: row.cashier,
      status: row.status,
      createdAt: row.created_at,
      itemCount: Number(row.item_count),
    }),
  );
});

export const getSale = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const sql = await db();
    const rows = await sql<{
      id: number;
      ticket: string;
      subtotal: number;
      total: number;
      payment_method: string;
      tendered: number;
      change_due: number;
      cashier: string;
      status: string;
      created_at: string;
    }>`
      select id, ticket, subtotal, total, payment_method, tendered, change_due, cashier, status, created_at::text as created_at
      from sales where id = ${data.id} limit 1
    `;
    const sale = rows[0];
    if (!sale) throw new Error("Venta no encontrada");
    const items = await sql<{
      id: number;
      product_id: number | null;
      barcode: string;
      name: string;
      qty: number;
      unit_price: number;
      line_total: number;
    }>`
      select id, product_id, barcode, name, qty, unit_price, line_total
      from sale_items where sale_id = ${sale.id} order by id
    `;
    const detail: SaleDetail = {
      id: sale.id,
      ticket: sale.ticket,
      subtotal: Number(sale.subtotal),
      total: Number(sale.total),
      paymentMethod: sale.payment_method as PaymentMethod,
      tendered: Number(sale.tendered),
      changeDue: Number(sale.change_due),
      cashier: sale.cashier,
      status: sale.status,
      createdAt: sale.created_at,
      itemCount: items.length,
      items: items.map(mapSaleItem),
    };
    return detail;
  });

export const getTodaySummary = createServerFn({ method: "POST" })
  .validator(z.object({ since: z.string().min(10) }))
  .handler(async ({ data }) => {
    const sql = await db();
    const rows = await sql<{
      payment_method: string;
      n: number;
      total: number;
    }>`
      select payment_method, count(*)::int as n, coalesce(sum(total), 0)::int as total
      from sales
      where created_at >= ${data.since}::timestamptz and status = 'completed'
      group by payment_method
    `;
    const summary: TodaySummary = { count: 0, total: 0, cash: 0, card: 0, sinpe: 0 };
    for (const row of rows) {
      const amount = Number(row.total);
      const count = Number(row.n);
      summary.count += count;
      summary.total += amount;
      if (row.payment_method === "cash") summary.cash = amount;
      if (row.payment_method === "card") summary.card = amount;
      if (row.payment_method === "sinpe") summary.sinpe = amount;
    }
    return summary;
  });

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await db();
  await ensureSeed(sql);
  const rows = await sql<{ key: string; value: string }>`select key, value from store_settings`;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const settings: StoreSettings = {
    storeName: map.storeName ?? DEFAULT_SETTINGS.storeName,
    sinpePhone: map.sinpePhone ?? DEFAULT_SETTINGS.sinpePhone,
    sinpeHolder: map.sinpeHolder ?? DEFAULT_SETTINGS.sinpeHolder,
  };
  return settings;
});

export const saveSettings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      storeName: z.string().trim().min(2).max(80),
      sinpePhone: z.string().trim().min(8).max(20),
      sinpeHolder: z.string().trim().min(2).max(80),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    for (const [key, value] of Object.entries(data)) {
      await sql`
        insert into store_settings (key, value) values (${key}, ${value})
        on conflict (key) do update set value = excluded.value
      `;
    }
    return data;
  });

export const adjustStock = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.number().int().positive(),
      delta: z.number().int().min(-10_000).max(10_000),
      employeeId: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await db();
    const actor = await sql<{ role: string }>`
      select role from employees where id = ${data.employeeId} and active = true limit 1
    `;
    if (!actor[0] || normalizeRole(actor[0].role) !== "gondolero") {
      throw new Error("Solo el gondolero ajusta inventario");
    }
    const rows = await sql<{
      id: number;
      barcode: string;
      name: string;
      category: string;
      price: number;
      stock: number;
      active: boolean;
    }>`
      update products
      set stock = greatest(0, stock + ${data.delta})
      where id = ${data.id} and active = true
      returning id, barcode, name, category, price, stock, active
    `;
    if (!rows[0]) throw new Error("Producto no encontrado");
    return asProduct(rows[0]);
  });

export const getManagerOverview = createServerFn({ method: "POST" })
  .validator(z.object({ since: z.string().min(10) }))
  .handler(async ({ data }) => {
    const sql = await db();
    await ensureSeed(sql);

    const pay = await sql<{ payment_method: string; n: number; total: number }>`
      select payment_method, count(*)::int as n, coalesce(sum(total), 0)::int as total
      from sales
      where created_at >= ${data.since}::timestamptz and status = 'completed'
      group by payment_method
    `;
    const today: TodaySummary = { count: 0, total: 0, cash: 0, card: 0, sinpe: 0 };
    for (const row of pay) {
      const amount = Number(row.total);
      const count = Number(row.n);
      today.count += count;
      today.total += amount;
      if (row.payment_method === "cash") today.cash = amount;
      if (row.payment_method === "card") today.card = amount;
      if (row.payment_method === "sinpe") today.sinpe = amount;
    }

    const cashiersRows = await sql<{
      id: number;
      name: string;
      role: string;
      avatar_animal: string | null;
      avatar_color: string | null;
      n: number;
      total: number;
    }>`
      select
        e.id,
        e.name,
        e.role,
        e.avatar_animal,
        e.avatar_color,
        count(s.id)::int as n,
        coalesce(sum(s.total), 0)::int as total
      from employees e
      left join sales s
        on s.employee_id = e.id
        and s.created_at >= ${data.since}::timestamptz
        and s.status = 'completed'
      where e.active = true
        and e.role <> 'gerente'
        and e.role <> 'pendiente'
      group by e.id, e.name, e.role, e.avatar_animal, e.avatar_color
      order by total desc, e.name
    `;
    const cashiers: CashierStat[] = cashiersRows.map((row) => ({
      id: row.id,
      name: row.name,
      animal: parseAnimal(row.avatar_animal),
      color: parseColor(row.avatar_color),
      role: normalizeRole(row.role),
      count: Number(row.n),
      total: Number(row.total),
    }));

    const [{ pendingCount }] = await sql<{ pendingCount: number }>`
      select count(*)::int as "pendingCount"
      from employees
      where active = true and role = 'pendiente'
    `;
    const [{ teamCount }] = await sql<{ teamCount: number }>`
      select count(*)::int as "teamCount"
      from employees
      where active = true and role <> 'gerente'
    `;
    const lowRows = await sql<{ id: number; name: string; stock: number }>`
      select id, name, stock
      from products
      where active = true and stock <= 5
      order by stock asc, name
      limit 8
    `;
    const lowStock: LowStockItem[] = lowRows.map((row) => ({
      id: row.id,
      name: row.name,
      stock: Number(row.stock),
    }));

    const overview: ManagerOverview = {
      today,
      cashiers,
      pendingCount: Number(pendingCount),
      teamCount: Number(teamCount),
      lowStock,
    };
    return overview;
  });
