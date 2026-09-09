import { createFileRoute, Outlet } from "@tanstack/react-router";
import { GerenteGate } from "@/components/pos/gerente-gate";
import { GerenteShell } from "@/components/pos/gerente-shell";

export const Route = createFileRoute("/gerente")({
  component: GerenteLayout,
});

function GerenteLayout() {
  return (
    <GerenteGate>
      <GerenteShell>
        <Outlet />
      </GerenteShell>
    </GerenteGate>
  );
}
