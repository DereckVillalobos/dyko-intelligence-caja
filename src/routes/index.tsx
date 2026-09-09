import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutDashboard, ScanBarcode } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dyko Intelligence" },
      { name: "apple-mobile-web-app-title", content: "Dyko" },
    ],
  }),
  component: Launcher,
});

function Launcher() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">Dyko Intelligence</p>
      <h1 className="font-display mt-2 text-[28px] leading-tight font-semibold tracking-tight">
        Dos apps. Un local.
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        Caja es para el equipo. Gerente es para quien dirige. Se sincronizan solas: ventas, PIN,
        inventario y SINPE.
      </p>

      <div className="mt-8 space-y-3">
        <AppTile
          to="/caja"
          icon={ScanBarcode}
          title="Caja"
          hint="Empleados. Escanear, cobrar, inventario."
        />
        <AppTile
          to="/gerente"
          icon={LayoutDashboard}
          title="Gerente"
          hint="Dueño. Equipo, meta, cierre y avance."
        />
      </div>

      <p className="mt-auto pt-8 text-center text-xs text-muted">
        En el iPhone, abra cada una y agréguela a inicio por separado. El local queda conectado.
      </p>
    </main>
  );
}

function AppTile({
  to,
  icon: Icon,
  title,
  hint,
}: {
  to: "/caja" | "/gerente";
  icon: typeof ScanBarcode;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="ios-list flex w-full items-center gap-4 rounded-3xl px-4 py-4 text-left transition-transform duration-150 active:scale-[0.99]"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-fg text-primary-fg">
        <Icon className="size-7" />
      </span>
      <span className="min-w-0">
        <span className="block text-[19px] font-semibold tracking-tight">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{hint}</span>
      </span>
    </Link>
  );
}
