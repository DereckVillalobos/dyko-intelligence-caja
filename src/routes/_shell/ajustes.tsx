import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSettings, saveSettings } from "@/lib/pos/api";
import { getCashier, setCashier } from "@/lib/pos/cashier";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/_shell/ajustes")({
  component: AjustesPage,
});

function AjustesPage() {
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettings(),
  });
  const [storeName, setStoreName] = useState("");
  const [sinpePhone, setSinpePhone] = useState("");
  const [sinpeHolder, setSinpeHolder] = useState("");
  const [cashier, setCashierName] = useState("Caja 1");

  useEffect(() => {
    setCashierName(getCashier());
  }, []);

  useEffect(() => {
    if (!settingsQuery.data) return;
    setStoreName(settingsQuery.data.storeName);
    setSinpePhone(settingsQuery.data.sinpePhone);
    setSinpeHolder(settingsQuery.data.sinpeHolder);
  }, [settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      saveSettings({
        data: { storeName, sinpePhone, sinpeHolder },
      }),
    onSuccess: (data) => {
      setCashier(cashier);
      queryClient.setQueryData(["settings"], data);
      toast.success("Ajustes guardados");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo guardar"),
  });

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Ajustes</h1>
      <p className="mt-1 text-sm text-muted">Datos del local para cobrar más rápido.</p>

      <section className="mt-5">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          Tienda
        </p>
        <div className="ios-list space-y-3 rounded-2xl p-4">
          <Field label="Nombre del local">
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </Field>
          <Field label="Caja en este teléfono">
            <Input value={cashier} onChange={(e) => setCashierName(e.target.value)} />
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

      <Button
        className="mt-6 w-full"
        size="lg"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Guardando…" : "Guardar cambios"}
      </Button>

      <section className="mt-8 text-sm text-muted">
        <p className="font-medium text-fg">Dyko Intelligence</p>
        <p className="mt-1">
          Caja móvil para cobros en efectivo, datáfono y SINPE. Los precios se muestran con IVA
          incluido (13%).
        </p>
        <p className="mt-3">
          En iPhone: use Safari, toque Compartir y luego Agregar a pantalla de inicio. Así se
          abre como una app y puede usar la cámara para escanear.
        </p>
      </section>
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
