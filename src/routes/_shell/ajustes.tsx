import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { EmployeeForm, type EmployeeDraft } from "@/components/pos/employee-form";
import { getSettings, saveSettings } from "@/lib/pos/api";
import { createEmployee, listEmployees, unbindDevice } from "@/lib/pos/staff-api";
import { getDeviceId, useStaff } from "@/lib/pos/staff";
import { queryClient } from "@/lib/query-client";

export const Route = createFileRoute("/_shell/ajustes")({
  component: AjustesPage,
});

function AjustesPage() {
  const session = useStaff((s) => s.session);
  const mode = useStaff((s) => s.mode);
  const signOut = useStaff((s) => s.signOut);
  const setMode = useStaff((s) => s.setMode);
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettings(),
  });
  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: () => listEmployees(),
  });
  const [storeName, setStoreName] = useState("");
  const [sinpePhone, setSinpePhone] = useState("");
  const [sinpeHolder, setSinpeHolder] = useState("");
  const [adding, setAdding] = useState(false);

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

  const isAdmin = session?.role === "admin";

  async function closeShift() {
    if (mode === "personal") {
      await unbindDevice({ data: { deviceId: getDeviceId() } }).catch(() => undefined);
    }
    signOut();
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Ajustes</h1>
      <p className="mt-1 text-sm text-muted">Local, cajero de este teléfono y SINPE.</p>

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
              <p className="text-sm text-muted">
                {mode === "personal" ? "Teléfono personal" : session?.role === "admin" ? "Responsable" : "Cajero"}
              </p>
            </div>
          </div>
          <Button variant="secondary" className="mt-3 w-full" onClick={() => void closeShift()}>
            {mode === "personal" ? "Desvincular este teléfono" : "Cerrar turno"}
          </Button>
          {mode === "personal" ? (
            <button
              type="button"
              className="mt-2 w-full text-center text-sm text-muted"
              onClick={() => {
                setMode(null);
                void closeShift();
              }}
            >
              Cambiar tipo de teléfono
            </button>
          ) : null}
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

      {mode === "shared" ? (
        <section className="mt-6">
          <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
            Equipo
          </p>
          <ul className="grid grid-cols-2 gap-2">
            {(employeesQuery.data ?? []).map((person) => (
              <li key={person.id} className="ios-list flex flex-col items-center gap-2 rounded-2xl px-3 py-4">
                <AnimalAvatar
                  name={person.name}
                  animal={person.animal}
                  color={person.color}
                  size="md"
                />
                <span className="min-w-0 text-center">
                  <span className="block truncate text-[15px] font-medium">{person.name}</span>
                  <span className="text-xs text-muted">
                    {person.role === "admin" ? "Responsable" : "Cajero"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {isAdmin ? (
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setAdding(true)}>
              Agregar cajero
            </Button>
          ) : (
            <p className="mt-2 px-1 text-xs text-muted">
              Solo el responsable puede agregar personal.
            </p>
          )}
        </section>
      ) : (
        <p className="mt-6 px-1 text-sm text-muted">
          Este teléfono es solo suyo. No hace falta agregar a nadie más. El equipo se gestiona en
          el teléfono de la empresa.
        </p>
      )}

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
          La identidad formal del empleado la confirma Dyko. Aquí solo queda quién cobró, con
          nombre y PIN. Sin cédula, correo ni teléfono personal.
        </p>
      </section>

      {adding ? (
        <div className="fixed inset-0 z-50 bg-bg">
          <AddEmployee
            actorId={session?.employeeId}
            onClose={() => setAdding(false)}
          />
        </div>
      ) : null}
    </main>
  );
}

function AddEmployee({ actorId, onClose }: { actorId?: number; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (draft: EmployeeDraft) =>
      createEmployee({
        data: {
          name: draft.name,
          pin: draft.pin,
          animal: draft.animal,
          color: draft.color,
          actorId,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Trabajador agregado");
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <EmployeeForm
      kicker="Nuevo trabajador"
      onBack={onClose}
      pending={mutation.isPending}
      error={error}
      onSubmit={(draft) => mutation.mutate(draft)}
    />
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
