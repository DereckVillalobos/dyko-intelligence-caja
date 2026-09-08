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
};

export type TodaySummary = {
  count: number;
  total: number;
  cash: number;
  card: number;
  sinpe: number;
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  sinpe: "SINPE Móvil",
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
