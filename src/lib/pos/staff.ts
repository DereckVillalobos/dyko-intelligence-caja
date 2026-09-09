import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DeviceMode = "personal" | "shared";
export type StaffRole = "gerente" | "pendiente" | "ventas" | "gondolero";
export type JobRole = "ventas" | "gondolero";

export type StaffSession = {
  employeeId: number;
  name: string;
  role: StaffRole;
  animal: string;
  color: string;
};

type StaffState = {
  mode: DeviceMode | null;
  session: StaffSession | null;
  setMode: (mode: DeviceMode | null) => void;
  signIn: (session: StaffSession) => void;
  signOut: () => void;
};

const DEVICE_ID_KEY = "dyko.deviceId";

export const JOBS: Array<{
  role: JobRole;
  title: string;
  hint: string;
}> = [
  {
    role: "ventas",
    title: "Ventas",
    hint: "Cobra, escanea y cierra las ventas del local.",
  },
  {
    role: "gondolero",
    title: "Gondolero",
    hint: "Acomoda, controla inventario y existencias. Sin caja.",
  },
];

export function normalizeRole(role: string | null | undefined): StaffRole {
  if (role === "gerente") return "gerente";
  if (role === "gondolero") return "gondolero";
  if (role === "pendiente") return "pendiente";
  if (role === "ventas" || role === "cajero" || role === "admin") return "ventas";
  return "pendiente";
}

export function roleLabel(role: StaffRole): string {
  if (role === "gerente") return "Gerente";
  if (role === "gondolero") return "Gondolero";
  if (role === "ventas") return "Ventas";
  return "Sin puesto";
}

export function canSell(role: StaffRole) {
  return role === "ventas";
}

export function canStock(role: StaffRole) {
  return role === "gondolero";
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export const useStaff = create<StaffState>()(
  persist(
    (set) => ({
      mode: null,
      session: null,
      setMode: (mode) => set({ mode }),
      signIn: (session) => set({ session }),
      signOut: () => set({ session: null }),
    }),
    { name: "dyko.staff", skipHydration: true },
  ),
);

type GerenteState = {
  session: StaffSession | null;
  signIn: (session: StaffSession) => void;
  signOut: () => void;
};

export const useGerente = create<GerenteState>()(
  persist(
    (set) => ({
      session: null,
      signIn: (session) => set({ session }),
      signOut: () => set({ session: null }),
    }),
    { name: "dyko.gerente", skipHydration: true },
  ),
);
