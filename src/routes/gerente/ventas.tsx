import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { getWeeklyDashboard } from "@/lib/pos/api";
import { formatColones, formatHour } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gerente/ventas")({
  component: SemanaPage,
});

function SemanaPage() {
  const query = useQuery({
    queryKey: ["weekly"],
    queryFn: () => getWeeklyDashboard(),
    refetchInterval: 8000,
  });
  const data = query.data;
  const week = data?.thisWeek;
  const last = data?.lastWeek;
  const maxBar = Math.max(1, ...(data?.days.map((d) => d.total) ?? [0]));
  const delta = data?.deltaPct;
  const up = (delta ?? 0) > 0;
  const down = (delta ?? 0) < 0;

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">Semana</p>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Rendimiento</h1>
      <p className="mt-1 text-sm text-muted">
        {data?.weekLabel ?? "Esta semana"} · comparado con la anterior.
      </p>

      <div className="ios-list mt-4 rounded-2xl px-4 py-4">
        <p className="text-xs text-muted">Cobrado esta semana</p>
        <p className="mt-1 font-display text-3xl font-semibold tabular-nums tracking-tight">
          {formatColones(week?.total ?? 0)}
        </p>
        <p className="mt-1 text-sm">
          <span
            className={cn(
              "font-medium",
              up && "text-success",
              down && "text-danger",
              !up && !down && "text-muted",
            )}
          >
            {delta == null
              ? "Sin semana anterior para comparar"
              : `${delta > 0 ? "+" : ""}${delta}% vs semana pasada`}
          </span>
          <span className="text-muted"> · {week?.count ?? 0} tickets</span>
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Ticket medio" value={formatColones(week?.avgTicket ?? 0)} />
        <Stat label="Promedio / día" value={formatColones(data?.perDay ?? 0)} />
        <Stat
          label="Mejor día"
          value={data?.bestDay ? `${data.bestDay.label} · ${formatColones(data.bestDay.total)}` : "—"}
        />
        <Stat
          label="Hora pico"
          value={data?.peakHour ? `${formatHour(data.peakHour.hour)} · ${data.peakHour.count}` : "—"}
        />
      </div>

      <section className="mt-6">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          Ventas por día
        </p>
        <div className="ios-list rounded-2xl px-4 py-4">
          <div className="flex h-28 items-end gap-2">
            {(data?.days ?? []).map((day) => (
              <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div className="flex h-20 w-full items-end justify-center">
                  <div
                    className="w-full max-w-7 rounded-full bg-primary"
                    style={{ height: `${Math.max(6, (day.total / maxBar) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-muted">{day.label}</span>
              </div>
            ))}
          </div>
          {!(data?.thisWeek.total) ? (
            <p className="mt-3 text-center text-xs text-muted">Aún no hay ventas esta semana.</p>
          ) : null}
        </div>
      </section>

      <section className="mt-6">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          Cómo pagan
        </p>
        <div className="ios-list space-y-3 rounded-2xl px-4 py-4">
          <MixRow label="Efectivo" pct={data?.mix.cash ?? 0} amount={week?.cash ?? 0} tone="bg-cash" />
          <MixRow label="Tarjeta" pct={data?.mix.card ?? 0} amount={week?.card ?? 0} tone="bg-card" />
          <MixRow label="SINPE" pct={data?.mix.sinpe ?? 0} amount={week?.sinpe ?? 0} tone="bg-sinpe" />
        </div>
      </section>

      <section className="mt-6">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          Eficiencia de ventas
        </p>
        {data?.ventas.length ? (
          <ul className="ios-list divide-y divide-border overflow-hidden rounded-2xl">
            {data.ventas.map((person, i) => {
              const share = week?.total ? Math.round((person.total / week.total) * 100) : 0;
              return (
                <li key={person.id} className="flex items-center gap-3 px-4 py-3">
                  <AnimalAvatar name={person.name} animal={person.animal} color={person.color} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">
                      {person.name}
                      {i === 0 && person.total > 0 ? (
                        <span className="ml-2 text-xs font-medium text-success">Lidera</span>
                      ) : null}
                    </span>
                    <span className="text-xs text-muted">
                      {person.count} ventas · {share}% de la semana · ticket {formatColones(person.avgTicket)}
                    </span>
                  </span>
                  <span className="text-right text-[15px] font-semibold tabular-nums">
                    {formatColones(person.total)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="ios-list rounded-2xl px-4 py-5 text-sm text-muted">
            Asigne el puesto de Ventas para ver eficiencia por persona.
          </p>
        )}
      </section>

      <section className="mt-6">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          Góndola de la semana
        </p>
        <div className="mb-2 grid grid-cols-3 gap-2">
          <Stat label="Metidos" value={String(week?.received ?? 0)} />
          <Stat label="Salidas" value={String(week?.waste ?? 0)} />
          <Stat label="Merma" value={`${data?.wasteRate ?? 0}%`} warn={(data?.wasteRate ?? 0) > 8} />
        </div>
        {data?.gondoleros.length ? (
          <ul className="ios-list divide-y divide-border overflow-hidden rounded-2xl">
            {data.gondoleros.map((person) => (
              <li key={person.id} className="flex items-center gap-3 px-4 py-3">
                <AnimalAvatar name={person.name} animal={person.animal} color={person.color} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{person.name}</span>
                  <span className="text-xs text-muted">
                    +{person.received} · −{person.waste} · {formatColones(person.wasteValue)} merma
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ios-list rounded-2xl px-4 py-5 text-sm text-muted">
            No hay gondoleros asignados esta semana.
          </p>
        )}
      </section>

      {last && last.total > 0 ? (
        <p className="mt-6 px-1 text-xs text-muted">
          Semana pasada: {formatColones(last.total)} en {last.count} tickets
          {last.avgTicket ? ` · ticket ${formatColones(last.avgTicket)}` : ""}.
        </p>
      ) : null}
    </main>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="ios-list rounded-2xl px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-1 text-[15px] font-semibold tabular-nums", warn && "text-danger")}>{value}</p>
    </div>
  );
}

function MixRow({
  label,
  pct,
  amount,
  tone,
}: {
  label: string;
  pct: number;
  amount: number;
  tone: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted">
          {pct}% · {formatColones(amount)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fill">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
