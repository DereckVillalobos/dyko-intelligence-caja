import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { getSettings, saveSettings } from "@/lib/pos/api";
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
      queryClient.setQueryData(["settings"], data);
      toast.success("Ajustes guardados");
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo guardar"),
  });

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Ajustes</h1>
      <p className="mt-1 text-sm text-muted">Local, SINPE y sesión del gerente.</p>

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

      <Button
        className="mt-6 w-full"
        size="lg"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Guardando…" : "Guardar cambios"}
      </Button>

      <Link
        to="/"
        className="mt-6 block text-center text-[15px] font-medium text-primary"
      >
        Abrir caja de empleados
      </Link>
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
