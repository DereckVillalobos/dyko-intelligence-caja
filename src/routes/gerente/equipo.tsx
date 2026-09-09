import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { assignPuesto, listTeam, resetEmployeePin, type PublicEmployee } from "@/lib/pos/staff-api";
import { JOBS, roleLabel, useGerente, type JobRole } from "@/lib/pos/staff";
import { queryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gerente/equipo")({
  component: EquipoPage,
});

function EquipoPage() {
  const session = useGerente((s) => s.session);
  const [picked, setPicked] = useState<PublicEmployee | null>(null);
  const teamQuery = useQuery({
    queryKey: ["team"],
    queryFn: () => listTeam(),
    refetchInterval: 3000,
  });
  const team = teamQuery.data ?? [];
  const pending = team.filter((p) => p.role === "pendiente");
  const assigned = team.filter((p) => p.role !== "pendiente");

  const mutation = useMutation({
    mutationFn: (role: JobRole) =>
      assignPuesto({
        data: {
          actorId: session!.employeeId,
          employeeId: picked!.id,
          role,
        },
      }),
    onSuccess: (person) => {
      void queryClient.invalidateQueries({ queryKey: ["team"] });
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["manager-overview"] });
      toast.success(`${person.name} ahora es ${roleLabel(person.role)}`);
      setPicked(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetMut = useMutation({
    mutationFn: () =>
      resetEmployeePin({
        data: { actorId: session!.employeeId, employeeId: picked!.id },
      }),
    onSuccess: (person) => {
      void queryClient.invalidateQueries({ queryKey: ["team"] });
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      void queryClient.invalidateQueries({ queryKey: ["manager-overview"] });
      toast.success(`${person.name} ya puede crear un PIN nuevo`);
      setPicked(person);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (picked) {
    return (
      <main className="mx-auto flex min-h-[70dvh] max-w-lg flex-col px-4 py-5">
        <button
          type="button"
          className="self-start text-sm font-medium text-primary"
          onClick={() => setPicked(null)}
        >
          Atrás
        </button>
        <div className="mt-6 flex flex-col items-center">
          <AnimalAvatar name={picked.name} animal={picked.animal} color={picked.color} size="lg" />
          <h1 className="font-display mt-3 text-2xl font-semibold tracking-tight">{picked.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {picked.role === "pendiente"
              ? "Asigne un puesto para que pueda entrar."
              : `Hoy es ${roleLabel(picked.role)}. Puede cambiarlo.`}
          </p>
          {picked.pinResetRequested ? (
            <p className="mt-3 rounded-2xl bg-warning/15 px-3 py-2 text-center text-sm font-medium text-warning">
              Pidió restablecer el PIN
            </p>
          ) : null}
          {picked.mustSetPin ? (
            <p className="mt-3 text-center text-sm text-muted">
              Ya puede crear un PIN nuevo en la caja.
            </p>
          ) : null}
        </div>
        <div className="mt-8 space-y-3">
          {JOBS.map((job) => (
            <button
              key={job.role}
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(job.role)}
              className={cn(
                "w-full rounded-2xl p-4 text-left transition-transform duration-150 active:scale-[0.99]",
                picked.role === job.role ? "bg-fg text-primary-fg" : "ios-list",
              )}
            >
              <span className="block text-[17px] font-semibold">{job.title}</span>
              <span
                className={cn(
                  "mt-1 block text-[13px] leading-snug",
                  picked.role === job.role ? "text-primary-fg/70" : "text-muted",
                )}
              >
                {job.hint}
              </span>
            </button>
          ))}
          <Button
            variant="secondary"
            className="w-full"
            disabled={resetMut.isPending || picked.mustSetPin}
            onClick={() => resetMut.mutate()}
          >
            {picked.mustSetPin ? "PIN listo para recrear" : "Restablecer PIN"}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Equipo</h1>
      <p className="mt-1 text-sm text-muted">
        Quien se registra en la caja espera aquí. Usted le da el puesto.
      </p>

      <section className="mt-5">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          Por asignar
        </p>
        {pending.length ? (
          <ul className="grid grid-cols-2 gap-2">
            {pending.map((person) => (
              <li key={person.id}>
                <PersonCard person={person} onPick={() => setPicked(person)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="ios-list rounded-2xl px-4 py-5 text-sm text-muted">
            No hay trabajadores nuevos. Cuando alguien se registre en la caja, aparece aquí.
          </p>
        )}
      </section>

      <section className="mt-6">
        <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
          Con puesto
        </p>
        {assigned.length ? (
          <ul className="grid grid-cols-2 gap-2">
            {assigned.map((person) => (
              <li key={person.id}>
                <PersonCard person={person} onPick={() => setPicked(person)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 text-sm text-muted">Todavía no hay puestos asignados.</p>
        )}
      </section>
    </main>
  );
}

function PersonCard({ person, onPick }: { person: PublicEmployee; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="ios-list flex w-full flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center transition-transform duration-150 active:scale-[0.98]"
    >
      <AnimalAvatar name={person.name} animal={person.animal} color={person.color} size="md" />
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium">{person.name}</span>
        <span className="text-xs text-muted">
          {person.pinResetRequested
            ? "Olvidó el PIN"
            : person.mustSetPin
              ? "Crear PIN nuevo"
              : roleLabel(person.role)}
        </span>
      </span>
      {person.role === "pendiente" ? (
        <span className="text-xs font-medium text-primary">Asignar puesto</span>
      ) : null}
    </button>
  );
}
