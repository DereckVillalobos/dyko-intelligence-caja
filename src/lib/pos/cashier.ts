const KEY = "dyko.cashier";

export function getCashier(): string {
  if (typeof window === "undefined") return "Caja 1";
  return window.localStorage.getItem(KEY)?.trim() || "Caja 1";
}

export function setCashier(name: string) {
  window.localStorage.setItem(KEY, name.trim() || "Caja 1");
}
