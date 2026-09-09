import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { getManagerOverview } from "@/lib/pos/api";
import { formatColones, startOfCostaRicaDayIso } from "@/lib/money";
import { roleLabel } from "@/lib/pos/staff";

export const Route = createFileRoute("/gerente/")({
  component: GerenteHoy,
});

function GerenteHoy() {
  const overviewQuery = useQuery({
    queryKey: ["manager-overview"],
    queryFn: () => getManagerOverview({ data: { since: startOfCostaRicaDayIso() } }),
    refetchInterval: 4000,
  });
  const data = overviewQuery.data;
  const today = data?.today;

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">Hoy</p>
      <h1 className="font-display text-2xl font-semibold tracking-tight">El local</h1>
      <p className="mt-1 text-sm text-muted">Ventas, equipo e inventario de este día.</p>

      {(data?.pendingCount ?? 0) > 0 ? (
        <Link
          to="/gerente/equipo"
          className="ios-list mt-5 flex items-center gap-3 rounded-2xl px-4 py-3.5"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-warning/15 text-sm font-semibold text-warning">
            {data?.pendingCount}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">
              Nuevos trabajadores iniciaron en el equipo
            </span>
            <span className="text-sm text-muted">Asignar puestos</span>
          </span>
          <ChevronRight className="size-5 text-subtle" />
        </Link>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="Ventas" value={String(today?.count ?? 0)} />
        <Stat label="Total" value={formatColones(today?.total ?? 0)} />
        <Stat label="Efectivo" value={formatColones(today?.cash ?? 0)} />
        <Stat label="Tarjeta" value={formatColones(today?.card ?? 0)} />
        <Stat label="SINPE" value={formatColones(today?.sinpe ?? 0)} />
        <Stat label="Equipo" value={String(data?.teamCount ?? 0)} />
      </div>

      <section className="mt-6">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          Quién cobró hoy
        </p>
        {data?.cashiers.length ? (
          <ul className="ios-list divide-y divide-border overflow-hidden rounded-2xl">
            {data.cashiers.map((person) => (
              <li key={person.id} className="flex items-center gap-3 px-4 py-3">
                <AnimalAvatar
                  name={person.name}
                  animal={person.animal}
                  color={person.color}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{person.name}</span>
                  <span className="text-xs text-muted">{roleLabel(person.role)}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[15px] font-semibold tabular-nums">
                    {formatColones(person.total)}
                  </span>
                  <span className="text-xs text-muted">{person.count} ventas</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ios-list rounded-2xl px-4 py-5 text-sm text-muted">
            Aún no hay ventas hoy.
          </p>
        )}
      </section>

      {(data?.lowStock.length ?? 0) > 0 ? (
        <section className="mt-6">
          <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
            Poco stock
          </p>
          <ul className="ios-list divide-y divide-border overflow-hidden rounded-2xl">
            {data!.lowStock.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <span className="truncate text-[15px] font-medium">{item.name}</span>
                <span className={item.stock <= 0 ? "text-sm text-danger" : "text-sm text-warning"}>
                  {item.stock}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ios-list rounded-2xl px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-[17px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}
