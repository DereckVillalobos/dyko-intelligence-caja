import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { getDailyPerformance } from "@/lib/pos/api";
import { formatColones, formatTime, startOfCostaRicaDayIso } from "@/lib/money";
import {
  WASTE_LABEL,
  type GondoPerf,
  type InventoryEvent,
  type VentasPerf,
} from "@/lib/pos/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gerente/rendimiento")({
  component: RendimientoPage,
});

function RendimientoPage() {
  const [picked, setPicked] = useState<{ kind: "ventas"; person: VentasPerf } | { kind: "gondo"; person: GondoPerf } | null>(null);
  const query = useQuery({
    queryKey: ["performance"],
    queryFn: () => getDailyPerformance({ data: { since: startOfCostaRicaDayIso() } }),
    refetchInterval: 5000,
  });
  const data = query.data;
  const totals = data?.totals;

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">Hoy</p>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Avance del equipo</h1>
      <p className="mt-1 text-sm text-muted">
        Cuánto se cobró, qué se metió al inventario y qué salió con motivo.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="Cobrado" value={formatColones(totals?.total ?? 0)} />
        <Stat label="Tickets" value={String(totals?.count ?? 0)} />
        <Stat label="Efectivo" value={formatColones(totals?.cash ?? 0)} />
        <Stat label="SINPE" value={formatColones(totals?.sinpe ?? 0)} />
        <Stat label="Tarjeta" value={formatColones(totals?.card ?? 0)} />
        <Stat label="Merma" value={formatColones(totals?.wasteValue ?? 0)} warn={(totals?.waste ?? 0) > 0} />
      </div>

      <section className="mt-6">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">Ventas</p>
        {data?.ventas.length ? (
          <ul className="ios-list divide-y divide-border overflow-hidden rounded-2xl">
            {data.ventas.map((person, index) => (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => setPicked({ kind: "ventas", person })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <AnimalAvatar name={person.name} animal={person.animal} color={person.color} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">
                      {person.name}
                      {index === 0 && person.total > 0 ? (
                        <span className="ml-2 text-xs font-medium text-success">Lidera hoy</span>
                      ) : null}
                    </span>
                    <span className="text-xs text-muted">
                      {person.count} ventas · ticket {formatColones(person.avgTicket)}
                    </span>
                  </span>
                  <span className="text-right text-[15px] font-semibold tabular-nums">
                    {formatColones(person.total)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ios-list rounded-2xl px-4 py-5 text-sm text-muted">
            Nadie de ventas está asignado todavía.
          </p>
        )}
      </section>

      <section className="mt-6">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">Gondoleros</p>
        {data?.gondoleros.length ? (
          <ul className="ios-list divide-y divide-border overflow-hidden rounded-2xl">
            {data.gondoleros.map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => setPicked({ kind: "gondo", person })}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <AnimalAvatar name={person.name} animal={person.animal} color={person.color} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{person.name}</span>
                    <span className="text-xs text-muted">
                      +{person.received} metidos · −{person.waste} salidas
                    </span>
                  </span>
                  <span className="text-right text-xs text-muted">
                    {person.created} nuevos
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ios-list rounded-2xl px-4 py-5 text-sm text-muted">
            No hay gondoleros asignados.
          </p>
        )}
      </section>

      <section className="mt-6">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          Actividad de inventario
        </p>
        {data?.events.length ? (
          <ul className="ios-list divide-y divide-border overflow-hidden rounded-2xl">
            {data.events.map((event) => (
              <li key={event.id} className="px-4 py-3">
                <p className="text-[15px] font-medium">{eventLine(event)}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {event.employeeName} · {formatTime(event.createdAt)}
                  {event.note ? ` · ${event.note}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ios-list rounded-2xl px-4 py-5 text-sm text-muted">
            Aún no hay movimientos de góndola hoy.
          </p>
        )}
      </section>

      {picked?.kind === "ventas" ? (
        <PersonSheet title={picked.person.name} onClose={() => setPicked(null)}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Ventas" value={String(picked.person.count)} />
            <Stat label="Total" value={formatColones(picked.person.total)} />
            <Stat label="Efectivo" value={formatColones(picked.person.cash)} />
            <Stat label="Tarjeta" value={formatColones(picked.person.card)} />
            <Stat label="SINPE" value={formatColones(picked.person.sinpe)} />
            <Stat label="Ticket medio" value={formatColones(picked.person.avgTicket)} />
          </div>
          {picked.person.lastSaleAt ? (
            <p className="mt-3 text-sm text-muted">Última venta a las {formatTime(picked.person.lastSaleAt)}</p>
          ) : (
            <p className="mt-3 text-sm text-muted">Todavía no cobra hoy.</p>
          )}
        </PersonSheet>
      ) : null}

      {picked?.kind === "gondo" ? (
        <PersonSheet title={picked.person.name} onClose={() => setPicked(null)}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Metidos" value={String(picked.person.received)} />
            <Stat label="Nuevos" value={String(picked.person.created)} />
            <Stat label="Salidas" value={String(picked.person.waste)} />
            <Stat label="Merma" value={formatColones(picked.person.wasteValue)} warn={picked.person.waste > 0} />
            <Stat label="Vencido" value={String(picked.person.wasteVencido)} />
            <Stat label="Roto" value={String(picked.person.wasteRoto)} />
            <Stat label="Otro" value={String(picked.person.wasteOtro)} />
            <Stat label="Precios" value={String(picked.person.priceChanges)} />
          </div>
          {picked.person.lastAt ? (
            <p className="mt-3 text-sm text-muted">Última acción a las {formatTime(picked.person.lastAt)}</p>
          ) : (
            <p className="mt-3 text-sm text-muted">Sin actividad de góndola hoy.</p>
          )}
        </PersonSheet>
      ) : null}
    </main>
  );
}

function eventLine(event: InventoryEvent) {
  if (event.kind === "create") return `Alta: ${event.productName}`;
  if (event.kind === "receive") return `+${event.qty} ${event.productName}`;
  if (event.kind === "price") {
    return `Precio ${event.productName}: ${formatColones(event.priceBefore ?? 0)} → ${formatColones(event.priceAfter ?? 0)}`;
  }
  const reason = event.reason ? WASTE_LABEL[event.reason] : "Salida";
  return `−${event.qty} ${event.productName} · ${reason}`;
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="ios-list rounded-2xl px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-1 text-[17px] font-semibold tabular-nums", warn && "text-danger")}>{value}</p>
    </div>
  );
}

function PersonSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center">
      <div className="glass-sheet w-full max-w-md rounded-t-3xl p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <p className="text-[17px] font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-primary"
          >
            Cerrar
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
