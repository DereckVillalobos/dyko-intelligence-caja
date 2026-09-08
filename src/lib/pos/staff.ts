import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DeviceMode = "personal" | "shared";
export type StaffRole = "admin" | "cajero";

export type StaffSession = {
  employeeId: number;
  name: string;
  role: StaffRole;
};

type StaffState = {
  mode: DeviceMode | null;
  session: StaffSession | null;
  setMode: (mode: DeviceMode | null) => void;
  signIn: (session: StaffSession) => void;
  signOut: () => void;
};

const DEVICE_ID_KEY = "dyko.deviceId";

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
