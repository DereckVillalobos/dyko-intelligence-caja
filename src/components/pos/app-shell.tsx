import { Link, Navigate, useRouterState } from "@tanstack/react-router";
import { Clock3, ScanBarcode, Settings2, ShoppingBag } from "lucide-react";
import { canSell, canStock, useStaff } from "@/lib/pos/staff";
import { cn } from "@/lib/utils";

const VENTAS_TABS = [
  { to: "/", label: "Caja", icon: ScanBarcode },
  { to: "/historial", label: "Historial", icon: Clock3 },
  { to: "/ajustes", label: "Ajustes", icon: Settings2 },
] as const;

const GONDO_TABS = [
  { to: "/productos", label: "Inventario", icon: ShoppingBag },
  { to: "/ajustes", label: "Ajustes", icon: Settings2 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useStaff((s) => s.session);
  const role = session?.role;
  const tabs = canStock(role ?? "pendiente") ? GONDO_TABS : VENTAS_TABS;
  const cols = tabs.length === 2 ? "grid-cols-2" : "grid-cols-3";

  if (role && canStock(role) && (pathname === "/" || pathname === "/historial")) {
    return <Navigate to="/productos" />;
  }
  if (role && canSell(role) && pathname === "/productos") {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-dvh text-fg">
      <header className="glass-bar specular sticky top-0 z-30 hidden border-b border-border/40 lg:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[17px] font-semibold tracking-tight">
              Dyko Intelligence
            </span>
            <span className="text-sm text-muted">
              {canStock(role ?? "pendiente") ? "Inventario" : "Caja móvil"}
            </span>
            {session ? (
              <span className="ml-2 rounded-full bg-fill px-2.5 py-0.5 text-xs font-medium text-fg">
                {session.name}
              </span>
            ) : null}
          </div>
          <nav className="flex items-center gap-1 rounded-full bg-fill/80 p-1">
            {tabs.map((tab) => {
              const active = pathname === tab.to;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-150",
                    active ? "bg-bg-elevated text-fg hairline" : "text-muted hover:text-fg",
                  )}
                >
                  <tab.icon className="size-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</div>

      <nav className="glass-bar specular fixed inset-x-0 bottom-0 z-40 border-t border-border/40 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className={cn("grid px-2 pt-1", cols)}>
          {tabs.map((tab) => {
            const active = pathname === tab.to;
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-wide",
                    active ? "text-primary" : "text-subtle",
                  )}
                >
                  <tab.icon className={cn("size-6", active ? "stroke-[2.2]" : "stroke-[1.8]")} />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
