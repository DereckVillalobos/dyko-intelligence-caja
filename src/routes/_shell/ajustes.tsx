import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { getSettings } from "@/lib/pos/api";
import { getDeviceId, roleLabel, useStaff } from "@/lib/pos/staff";
import { unbindDevice } from "@/lib/pos/staff-api";

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

  async function closeShift() {
    if (mode === "personal") {
      await unbindDevice({ data: { deviceId: getDeviceId() } }).catch(() => undefined);
    }
    signOut();
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Ajustes</h1>
      <p className="mt-1 text-sm text-muted">Su turno en este teléfono.</p>

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
                {session ? roleLabel(session.role) : ""}
                {mode === "personal" ? " · Teléfono personal" : ""}
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

      {session?.role === "ventas" ? (
        <section className="mt-6">
          <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
            SINPE Móvil del local
          </p>
          <div className="ios-list rounded-2xl px-4 py-3">
            <p className="text-xs text-muted">{settingsQuery.data?.sinpeHolder ?? "—"}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
              {settingsQuery.data?.sinpePhone ?? "—"}
            </p>
            <p className="mt-2 text-xs text-muted">Solo el gerente puede cambiarlo.</p>
          </div>
        </section>
      ) : (
        <p className="mt-6 px-1 text-sm text-muted">
          El gerente asigna el puesto, el local y el SINPE.
        </p>
      )}

      <Link
        to="/gerente"
        className="mt-6 block text-center text-[15px] font-medium text-primary"
      >
        Abrir app del gerente
      </Link>
    </main>
  );
}
