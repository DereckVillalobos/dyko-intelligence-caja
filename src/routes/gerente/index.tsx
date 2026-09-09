import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { Button } from "@/components/ui/button";
import { Keypad } from "@/components/pos/keypad";
import { CashCloseSheet } from "@/components/pos/cash-close-sheet";
import { getManagerOverview, saveDailyGoal } from "@/lib/pos/api";
import { formatColones, formatDay, startOfCostaRicaDayIso } from "@/lib/money";
import { roleLabel, useGerente } from "@/lib/pos/staff";
import { queryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gerente/")({
  component: GerenteHoy,
});

function GerenteHoy() {
  const session = useGerente((s) => s.session);
  const [goalOpen, setGoalOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState(0);

  const overviewQuery = useQuery({
    queryKey: ["manager-overview"],
    queryFn: () => getManagerOverview({ data: { since: startOfCostaRicaDayIso() } }),
    refetchInterval: 4000,
  });
  const data = overviewQuery.data;
  const today = data?.today;
  const goal = data?.dailyGoal ?? 0;
  const pct = goal > 0 ? Math.round(((today?.total ?? 0) / goal) * 100) : 0;
  const close = data?.close;

  const goalMut = useMutation({
    mutationFn: () => saveDailyGoal({ data: { actorId: session!.employeeId, dailyGoal: goalDraft } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["manager-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success(goalDraft ? "Meta del día lista" : "Sin meta hoy");
      setGoalOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">Hoy</p>
      <h1 className="font-display text-2xl font-semibold tracking-tight">El local</h1>
      <p className="mt-1 text-sm text-muted">Ventas, equipo e inventario de este día.</p>

      <button
        type="button"
        onClick={() => {
          setGoalDraft(goal);
          setGoalOpen(true);
        }}
        className="ios-list mt-4 w-full rounded-2xl px-4 py-3.5 text-left"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Meta del día</p>
          <p className="text-xs font-medium text-primary">{goal ? `${pct}%` : "Definir"}</p>
        </div>
        {goal ? (
          <>
            <p className="mt-1 text-[17px] font-semibold tabular-nums">
              {formatColones(today?.total ?? 0)}
              <span className="text-sm font-medium text-muted"> de {formatColones(goal)}</span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fill">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted">Toque para poner cuánto quieren hacer hoy.</p>
        )}
      </button>

      {(data?.pinResetCount ?? 0) > 0 ? (
        <Link
          to="/gerente/equipo"
          className="ios-list mt-3 flex items-center gap-3 rounded-2xl px-4 py-3.5"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-warning/15 text-sm font-semibold text-warning">
            {data?.pinResetCount}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">Olvidaron el PIN</span>
            <span className="text-sm text-muted">Restablecer en Equipo</span>
          </span>
          <ChevronRight className="size-5 text-subtle" />
        </Link>
      ) : null}

      {(data?.pendingCount ?? 0) > 0 ? (
        <Link
          to="/gerente/equipo"
          className="ios-list mt-3 flex items-center gap-3 rounded-2xl px-4 py-3.5"
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

      {close?.closed ? (
        <button
          type="button"
          onClick={() => setCloseOpen(true)}
          className="ios-list mt-4 w-full rounded-2xl px-4 py-3.5 text-left"
        >
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Caja cerrada</p>
          <p
            className={cn(
              "mt-1 text-[17px] font-semibold tabular-nums",
              close.difference === 0 ? "text-success" : close.difference < 0 ? "text-danger" : "text-success",
            )}
          >
            {close.difference === 0
              ? "Cuadra"
              : close.difference > 0
                ? `Sobra ${formatColones(close.difference)}`
                : `Falta ${formatColones(Math.abs(close.difference))}`}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {close.closerName} · contado {formatColones(close.countedCash)}
          </p>
        </button>
      ) : (
        <Button className="mt-4 w-full" size="lg" onClick={() => setCloseOpen(true)}>
          Cerrar caja de hoy
        </Button>
      )}

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

      {(data?.expiring.length ?? 0) > 0 ? (
        <section className="mt-6">
          <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
            Por vencer
          </p>
          <ul className="ios-list divide-y divide-border overflow-hidden rounded-2xl">
            {data!.expiring.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <span className="truncate text-[15px] font-medium">{item.name}</span>
                <span className="text-sm text-warning">
                  {formatDay(`${item.expiresOn}T12:00:00-06:00`)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {goalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center">
          <div className="glass-sheet w-full max-w-md rounded-t-3xl p-5 sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <p className="text-[17px] font-semibold">Meta de hoy</p>
              <button type="button" className="text-sm font-medium text-primary" onClick={() => setGoalOpen(false)}>
                Cerrar
              </button>
            </div>
            <p className="mt-3 text-center font-display text-4xl font-semibold tabular-nums tracking-tight">
              {formatColones(goalDraft)}
            </p>
            <div className="mt-3 flex gap-2">
              {[50_000, 100_000, 150_000, 200_000].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setGoalDraft(n)}
                  className={cn(
                    "h-8 flex-1 rounded-full text-xs font-medium",
                    goalDraft === n ? "bg-fg text-primary-fg" : "bg-fill text-muted",
                  )}
                >
                  {n / 1000} mil
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Keypad value={goalDraft} onChange={setGoalDraft} />
            </div>
            <Button className="mt-4 w-full" size="lg" disabled={goalMut.isPending} onClick={() => goalMut.mutate()}>
              Guardar meta
            </Button>
          </div>
        </div>
      ) : null}

      {closeOpen && close && session ? (
        <CashCloseSheet preview={close} actorId={session.employeeId} onClose={() => setCloseOpen(false)} />
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
