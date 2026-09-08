import { Link, useRouterState } from "@tanstack/react-router";
import { Clock3, ScanBarcode, Settings2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Caja", icon: ScanBarcode },
  { to: "/historial", label: "Historial", icon: Clock3 },
  { to: "/productos", label: "Productos", icon: ShoppingBag },
  { to: "/ajustes", label: "Ajustes", icon: Settings2 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh text-fg">
      <header className="glass-bar specular sticky top-0 z-30 hidden border-b border-border/40 lg:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[17px] font-semibold tracking-tight">
              Dyko Intelligence
            </span>
            <span className="text-sm text-muted">Caja móvil</span>
          </div>
          <nav className="flex items-center gap-1 rounded-full bg-fill/80 p-1">
            {TABS.map((tab) => {
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
        <ul className="grid grid-cols-4 px-2 pt-1">
          {TABS.map((tab) => {
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
