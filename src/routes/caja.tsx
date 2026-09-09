import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/pos/app-shell";
import { StaffGate } from "@/components/pos/staff-gate";

export const Route = createFileRoute("/caja")({
  head: () => ({
    meta: [
      { title: "Dyko Caja" },
      { name: "apple-mobile-web-app-title", content: "Dyko Caja" },
      { name: "description", content: "Caja móvil para el equipo: escanear, cobrar y inventario." },
    ],
  }),
  component: CajaLayout,
});

function CajaLayout() {
  return (
    <StaffGate>
      <AppShell>
        <Outlet />
      </AppShell>
    </StaffGate>
  );
}
