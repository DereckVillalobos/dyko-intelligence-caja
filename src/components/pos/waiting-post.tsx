import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { Button } from "@/components/ui/button";
import { getDeviceId, roleLabel, useStaff } from "@/lib/pos/staff";
import { unbindDevice } from "@/lib/pos/staff-api";

export function WaitingPost() {
  const session = useStaff((s) => s.session);
  const mode = useStaff((s) => s.mode);
  const signOut = useStaff((s) => s.signOut);
  if (!session) return null;

  async function closeShift() {
    if (mode === "personal") {
      await unbindDevice({ data: { deviceId: getDeviceId() } }).catch(() => undefined);
    }
    signOut();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center px-6 py-10 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">Dyko Intelligence</p>
      <div className="dyko-breathe mt-10">
        <AnimalAvatar
          name={session.name}
          animal={session.animal}
          color={session.color}
          size="lg"
        />
      </div>
      <h1 className="font-display mt-5 text-center text-[28px] leading-tight font-semibold tracking-tight">
        Hola, {session.name}
      </h1>
      <p className="mt-3 max-w-xs text-center text-[15px] text-muted">
        Esperando la asignación de tu puesto. El gerente te va a dar acceso a Ventas o a Gondolero.
      </p>
      <p className="mt-4 rounded-full bg-fill px-3 py-1 text-xs font-medium text-muted">
        {roleLabel(session.role)}
      </p>
      <div className="mt-auto w-full">
        <Button variant="secondary" size="lg" className="w-full" onClick={() => void closeShift()}>
          {mode === "personal" ? "Salir" : "Cerrar turno"}
        </Button>
      </div>
    </div>
  );
}
