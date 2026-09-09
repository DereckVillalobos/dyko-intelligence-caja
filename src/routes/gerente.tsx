import { createFileRoute, Outlet } from "@tanstack/react-router";
import { GerenteGate } from "@/components/pos/gerente-gate";
import { GerenteShell } from "@/components/pos/gerente-shell";

export const Route = createFileRoute("/gerente")({
  head: () => ({
    meta: [
      { title: "Dyko Gerente" },
      { name: "apple-mobile-web-app-title", content: "Dyko Gerente" },
      { name: "description", content: "App del gerente: equipo, caja, meta y rendimiento del local." },
    ],
  }),
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
