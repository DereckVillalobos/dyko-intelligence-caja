import type { StaffRole } from "./staff";

export type PaymentMethod = "cash" | "card" | "sinpe";

export type Product = {
  id: number;
  barcode: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
};

export type CartLine = {
  key: string;
  productId: number | null;
  barcode: string;
  name: string;
  unitPrice: number;
  qty: number;
};

export type SaleSummary = {
  id: number;
  ticket: string;
  total: number;
  paymentMethod: PaymentMethod;
  tendered: number;
  changeDue: number;
  cashier: string;
  status: string;
  createdAt: string;
  itemCount: number;
};

export type SaleItem = {
  id: number;
  productId: number | null;
  barcode: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type SaleDetail = SaleSummary & {
  subtotal: number;
  items: SaleItem[];
};

export type StoreSettings = {
  storeName: string;
  sinpePhone: string;
  sinpeHolder: string;
  dailyGoal: number;
  cashFloat: number;
  storeCode: string;
};

export type TodaySummary = {
  count: number;
  total: number;
  cash: number;
  card: number;
  sinpe: number;
};

export type CashierStat = {
  id: number;
  name: string;
  animal: string;
  color: string;
  role: StaffRole;
  count: number;
  total: number;
};

export type LowStockItem = {
  id: number;
  name: string;
  stock: number;
};

export type ManagerOverview = {
  today: TodaySummary;
  cashiers: CashierStat[];
  pendingCount: number;
  teamCount: number;
  lowStock: LowStockItem[];
  dailyGoal: number;
  pinResetCount: number;
  close: CashClose | null;
};

export type CashClose = {
  dayKey: string;
  closed: boolean;
  closedAt: string | null;
  closerName: string | null;
  floatAmount: number;
  cashSales: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
  cardTotal: number;
  sinpeTotal: number;
  salesCount: number;
  salesTotal: number;
  note: string | null;
};

export type WasteReason = "vencido" | "roto" | "otro";

export type InventoryKind = "create" | "receive" | "waste" | "price";

export type InventoryEvent = {
  id: number;
  employeeId: number;
  employeeName: string;
  productName: string;
  kind: InventoryKind;
  qty: number;
  reason: WasteReason | null;
  note: string | null;
  priceBefore: number | null;
  priceAfter: number | null;
  createdAt: string;
};

export type VentasPerf = {
  id: number;
  name: string;
  animal: string;
  color: string;
  count: number;
  total: number;
  cash: number;
  card: number;
  sinpe: number;
  avgTicket: number;
  lastSaleAt: string | null;
};

export type GondoPerf = {
  id: number;
  name: string;
  animal: string;
  color: string;
  received: number;
  created: number;
  waste: number;
  wasteVencido: number;
  wasteRoto: number;
  wasteOtro: number;
  wasteValue: number;
  priceChanges: number;
  lastAt: string | null;
};

export type DailyPerformance = {
  ventas: VentasPerf[];
  gondoleros: GondoPerf[];
  events: InventoryEvent[];
  totals: {
    count: number;
    total: number;
    cash: number;
    card: number;
    sinpe: number;
    received: number;
    waste: number;
    wasteValue: number;
  };
};

export type WeekDayPoint = {
  key: string;
  label: string;
  count: number;
  total: number;
};

export type WeekTotals = {
  count: number;
  total: number;
  cash: number;
  card: number;
  sinpe: number;
  avgTicket: number;
  received: number;
  waste: number;
  wasteValue: number;
};

export type WeeklyDashboard = {
  weekStart: string;
  weekLabel: string;
  daysElapsed: number;
  thisWeek: WeekTotals;
  lastWeek: WeekTotals;
  deltaPct: number | null;
  days: WeekDayPoint[];
  bestDay: WeekDayPoint | null;
  peakHour: { hour: number; count: number } | null;
  mix: { cash: number; card: number; sinpe: number };
  perDay: number;
  wasteRate: number;
  ventas: VentasPerf[];
  gondoleros: GondoPerf[];
};


export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  sinpe: "SINPE Móvil",
};

export const WASTE_LABEL: Record<WasteReason, string> = {
  vencido: "Vencido",
  roto: "Roto",
  otro: "Otro",
};

export const CATEGORIES = [
  "Todos",
  "Bebidas",
  "Abarrotes",
  "Lácteos",
  "Snacks",
  "Panadería",
  "Limpieza",
] as const;
