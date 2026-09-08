import { useStaff } from "./staff";

export function getCashier(): string {
  return useStaff.getState().session?.name?.trim() || "Caja";
}

export function getEmployeeId(): number | null {
  return useStaff.getState().session?.employeeId ?? null;
}
