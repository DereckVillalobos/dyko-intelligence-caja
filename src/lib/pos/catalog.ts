import type { Product } from "./types";

export type SeedProduct = Pick<Product, "barcode" | "name" | "category" | "price" | "stock">;

export const SEED_PRODUCTS: SeedProduct[] = [
  { barcode: "7441050000016", name: "Coca-Cola 600 ml", category: "Bebidas", price: 1250, stock: 48 },
  { barcode: "7441050000023", name: "Pepsi 600 ml", category: "Bebidas", price: 1150, stock: 36 },
  { barcode: "7441050000030", name: "Agua Cristal 600 ml", category: "Bebidas", price: 700, stock: 60 },
  { barcode: "7441050000047", name: "Imperial lata 350 ml", category: "Bebidas", price: 1100, stock: 24 },
  { barcode: "7441050000054", name: "Tropical jugo 250 ml", category: "Bebidas", price: 850, stock: 30 },
  { barcode: "7441050000061", name: "Café preparado", category: "Bebidas", price: 1000, stock: 99 },
  { barcode: "7441050000078", name: "Arroz Tío Pelón 1.8 kg", category: "Abarrotes", price: 2450, stock: 20 },
  { barcode: "7441050000085", name: "Frijoles negros 800 g", category: "Abarrotes", price: 1650, stock: 18 },
  { barcode: "7441050000092", name: "Aceite Mazola 800 ml", category: "Abarrotes", price: 2200, stock: 14 },
  { barcode: "7441050000108", name: "Azúcar 1 kg", category: "Abarrotes", price: 1150, stock: 22 },
  { barcode: "7441050000115", name: "Leche Dos Pinos 1 L", category: "Lácteos", price: 1350, stock: 28 },
  { barcode: "7441050000122", name: "Queso Turrialba 250 g", category: "Lácteos", price: 2800, stock: 12 },
  { barcode: "7441050000139", name: "Yogurt Dos Pinos", category: "Lácteos", price: 750, stock: 20 },
  { barcode: "7441050000146", name: "Chiky galletas", category: "Snacks", price: 900, stock: 32 },
  { barcode: "7441050000153", name: "Tosty nachos", category: "Snacks", price: 1050, stock: 26 },
  { barcode: "7441050000160", name: "Maní salado", category: "Snacks", price: 650, stock: 18 },
  { barcode: "7441050000177", name: "Pan Bimbo grande", category: "Panadería", price: 1850, stock: 16 },
  { barcode: "7441050000184", name: "Tortillas 10 und", category: "Panadería", price: 950, stock: 20 },
  { barcode: "7441050000191", name: "Jabón líquido 500 ml", category: "Limpieza", price: 1450, stock: 14 },
  { barcode: "7441050000207", name: "Papel higiénico 4 rollos", category: "Limpieza", price: 2100, stock: 18 },
];

export const DEFAULT_SETTINGS = {
  storeName: "Dyko Intelligence",
  sinpePhone: "8888-0101",
  sinpeHolder: "Dyko Intelligence",
  dailyGoal: 0,
  cashFloat: 0,
  storeCode: "",
};
