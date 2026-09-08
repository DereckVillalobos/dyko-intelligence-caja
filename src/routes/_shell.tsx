import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/pos/app-shell";
import { StaffGate } from "@/components/pos/staff-gate";

export const Route = createFileRoute("/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  return (
    <StaffGate>
      <AppShell>
        <Outlet />
      </AppShell>
    </StaffGate>
  );
}
