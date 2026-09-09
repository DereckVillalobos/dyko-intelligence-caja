import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { SyncMark } from "@/components/pos/sync-mark";
import { getSettings, saveExpiryAlerts, saveSettings } from "@/lib/pos/api";
import { EXPIRY_WARN_OPTIONS } from "@/lib/pos/types";
import { cn } from "@/lib/utils";
import { useGerente } from "@/lib/pos/staff";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/gerente/ajustes")({
  component: GerenteAjustes,
});

function GerenteAjustes() {
  const session = useGerente((s) => s.session);
  const signOut = useGerente((s) => s.signOut);
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettings(),
  });
  const [storeName, setStoreName] = useState("");
  const [sinpePhone, setSinpePhone] = useState("");
  const [sinpeHolder, setSinpeHolder] = useState("");
  const [expiryAlertsOn, setExpiryAlertsOn] = useState(true);
  const [expiryWarnDays, setExpiryWarnDays] = useState(7);

  useEffect(() => {
    if (!settingsQuery.data) return;
    setStoreName(settingsQuery.data.storeName);
    setSinpePhone(settingsQuery.data.sinpePhone);
    setSinpeHolder(settingsQuery.data.sinpeHolder);
    setExpiryAlertsOn(settingsQuery.data.expiryAlertsOn);
    setExpiryWarnDays(settingsQuery.data.expiryWarnDays);
  }, [settingsQuery.data]);

  const alertsMut = useMutation({
    mutationFn: (next: { expiryAlertsOn: boolean; expiryWarnDays: number }) =>
      saveExpiryAlerts({
        data: { actorId: session!.employeeId, ...next },
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["settings"], data);
      void queryClient.invalidateQueries({ queryKey: ["manager-overview"] });
      toast.success(
        data.expiryAlertsOn
          ? `Alertas: ${data.expiryWarnDays} día${data.expiryWarnDays === 1 ? "" : "s"} antes`
          : "Alertas de vencimiento apagadas",
      );
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo guardar"),
  });

  function setAlerts(next: { expiryAlertsOn: boolean; expiryWarnDays: number }) {
    setExpiryAlertsOn(next.expiryAlertsOn);
    setExpiryWarnDays(next.expiryWarnDays);
    alertsMut.mutate(next);
  }

  const mutation = useMutation({
    mutationFn: () =>
      saveSettings({
        data: { storeName, sinpePhone, sinpeHolder, actorId: session!.employeeId },
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["settings"], data);
      toast.success("Ajustes guardados");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo guardar"),
  });

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Ajustes</h1>
      <p className="mt-1 text-sm text-muted">Local, SINPE y alertas de vencimiento.</p>

      <section className="mt-5">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          Este teléfono
        </p>
        <div className="ios-list rounded-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            {session ? (
              <AnimalAvatar
                name={session.name}
                animal={session.animal}
                color={session.color}
                size="sm"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-[17px] font-semibold">{session?.name}</p>
              <p className="text-sm text-muted">Gerente</p>
            </div>
          </div>
          <Button variant="secondary" className="mt-3 w-full" onClick={() => signOut()}>
            Cerrar sesión
          </Button>
        </div>
      </section>

      <section className="mt-6">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          Tienda
        </p>
        <div className="ios-list space-y-3 rounded-2xl p-4">
          <Field label="Nombre del local">
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="mt-6">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          SINPE Móvil
        </p>
        <div className="ios-list space-y-3 rounded-2xl p-4">
          <Field label="Número">
            <Input
              value={sinpePhone}
              onChange={(e) => setSinpePhone(e.target.value)}
              inputMode="tel"
            />
          </Field>
          <Field label="Titular">
            <Input value={sinpeHolder} onChange={(e) => setSinpeHolder(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="mt-6">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          Alertas de vencimiento
        </p>
        <div className="ios-list space-y-3 rounded-2xl p-4">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setAlerts({ expiryAlertsOn: !expiryAlertsOn, expiryWarnDays })}
          >
            <span>
              <span className="block text-[15px] font-medium">Avisar al equipo</span>
              <span className="mt-0.5 block text-xs text-muted">
                Inventario, caja y esta app. Dyko usa la misma ventana.
              </span>
            </span>
            <span
              className={cn(
                "relative h-7 w-11 shrink-0 rounded-full transition-colors",
                expiryAlertsOn ? "bg-success" : "bg-fill",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform",
                  expiryAlertsOn ? "translate-x-[18px]" : "translate-x-0.5",
                )}
              />
            </span>
          </button>
          {expiryAlertsOn ? (
            <div>
              <p className="text-sm font-medium">Avisar con esta anticipación</p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {EXPIRY_WARN_OPTIONS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setAlerts({ expiryAlertsOn: true, expiryWarnDays: days })}
                    className={cn(
                      "h-10 rounded-full text-sm font-medium",
                      expiryWarnDays === days ? "bg-fg text-primary-fg" : "bg-fill text-muted",
                    )}
                  >
                    {days}d
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Si falta {expiryWarnDays} día{expiryWarnDays === 1 ? "" : "s"} o ya venció, sale aviso.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <Button
        className="mt-6 w-full"
        size="lg"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Guardando…" : "Guardar cambios"}
      </Button>

      <SyncMark side="gerente" />
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
