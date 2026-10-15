import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { EmployeeForm, type EmployeeDraft } from "@/components/pos/employee-form";
import { PinPad } from "@/components/pos/pin-pad";
import {
  createGerente,
  listGerentes,
  setupGerente,
  unlockEmployee,
  type PublicEmployee,
} from "@/lib/pos/staff-api";
import { getDeviceId, useGerente, type StaffSession } from "@/lib/pos/staff";
import { queryClient } from "@/lib/query-client";

export function GerenteGate({ children }: { children: React.ReactNode }) {
  const session = useGerente((s) => s.session);
  const signIn = useGerente((s) => s.signIn);
  const [ready, setReady] = useState(false);

  const gerentesQuery = useQuery({
    queryKey: ["gerentes"],
    queryFn: () => listGerentes(),
  });

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setReady(true);
    };
    const persistApi = useGerente.persist;
    const fallback = window.setTimeout(finish, 80);
    if (persistApi?.rehydrate) {
      void Promise.resolve(persistApi.rehydrate()).then(finish, finish);
    } else {
      finish();
    }
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
        <p className="font-display text-xl font-semibold tracking-tight">Dyko Intelligence</p>
        <p className="mt-1 text-sm text-muted">Gerente</p>
      </div>
    );
  }

  if (session?.role === "gerente") return <>{children}</>;

  const gerentes = gerentesQuery.data ?? [];
  if (gerentes.length === 0) {
    return <FirstGerente onDone={(next) => signIn(next)} />;
  }

  return <GerenteLock gerentes={gerentes} onUnlock={(next) => signIn(next)} />;
}

function FirstGerente({ onDone }: { onDone: (session: StaffSession) => void }) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const mutation = useMutation({
    mutationFn: (draft: EmployeeDraft) =>
      setupGerente({
        data: {
          name: draft.name,
          pin: draft.pin,
          animal: draft.animal,
          color: draft.color,
          setupCode: setupCode.trim(),
        },
      }),
    onSuccess: (session) => {
      void queryClient.invalidateQueries({ queryKey: ["gerentes"] });
      onDone(session);
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <EmployeeForm
      kicker="Gerente del local"
      onBack={() => navigate({ to: "/" })}
      pending={mutation.isPending}
      error={error}
      nameExtra={
        <label className="mt-4 block text-sm font-medium">
          Código de instalación (solo primera configuración)
          <Input
            className="mt-2"
            type="password"
            autoComplete="off"
            value={setupCode}
            placeholder="Código privado del administrador"
            onChange={(event) => setSetupCode(event.target.value)}
          />
        </label>
      }
      onSubmit={(draft) => mutation.mutate(draft)}
    />
  );
}

function GerenteLock({
  gerentes,
  onUnlock,
}: {
  gerentes: PublicEmployee[];
  onUnlock: (session: StaffSession) => void;
}) {
  const [picked, setPicked] = useState<PublicEmployee | null>(null);
  const [adding, setAdding] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const session = useGerente((s) => s.session);

  const mutation = useMutation({
    mutationFn: (code: string) =>
      unlockEmployee({
        data: {
          employeeId: picked!.id,
          pin: code,
          deviceId: getDeviceId(),
          bind: false,
        },
      }),
    onSuccess: (next) => {
      if (next.role !== "gerente") {
        setError("Este perfil no es de gerente");
        setPin("");
        return;
      }
      onUnlock(next);
    },
    onError: (err: Error) => {
      setError(err.message);
      setPin("");
    },
  });

  useEffect(() => {
    if (pin.length !== 4 || !picked) return;
    mutation.mutate(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  if (adding) {
    return (
      <AddGerente actorId={session?.employeeId} onBack={() => setAdding(false)} />
    );
  }

  if (!picked) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Gerente</p>
        <h1 className="font-display mt-2 text-[28px] leading-tight font-semibold tracking-tight">
          ¿Quién dirige?
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Toque su perfil e ingrese su PIN de 4 dígitos.
        </p>
        <ul
          className={
            gerentes.length === 1 ? "mt-8 flex justify-center" : "mt-8 grid grid-cols-2 gap-3"
          }
        >
          {gerentes.map((person) => (
            <li key={person.id} className={gerentes.length === 1 ? "w-44" : undefined}>
              <button
                type="button"
                onClick={() => {
                  setPicked(person);
                  setPin("");
                  setError(null);
                }}
                className="ios-list flex w-full flex-col items-center gap-3 rounded-3xl px-3 py-5 text-center transition-transform duration-150 active:scale-[0.98]"
              >
                <AnimalAvatar
                  name={person.name}
                  animal={person.animal}
                  color={person.color}
                  size="lg"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[17px] font-semibold">{person.name}</span>
                  <span className="text-xs text-muted">Gerente</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-auto space-y-3 pt-6">
          <Button variant="secondary" size="lg" className="w-full" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Agregar gerente
          </Button>
          <Link to="/" className="block text-center text-[15px] font-medium text-muted">
            Cambiar de app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <button type="button" className="self-start text-sm font-medium text-primary" onClick={() => setPicked(null)}>
        Atrás
      </button>
      <div className="mt-6 flex flex-col items-center">
        <AnimalAvatar name={picked.name} animal={picked.animal} color={picked.color} size="lg" />
        <h1 className="font-display mt-3 text-2xl font-semibold tracking-tight">{picked.name}</h1>
        <p className="mt-1 text-sm text-muted">Ingrese su PIN de 4 dígitos</p>
      </div>
      <div className="mt-8">
        <PinPad
          value={pin}
          onChange={(next) => {
            setError(null);
            setPin(next);
          }}
          disabled={mutation.isPending}
          error={Boolean(error)}
        />
        {error ? <p className="mt-4 text-center text-sm text-danger">{error}</p> : null}
      </div>
    </div>
  );
}

function AddGerente({ actorId, onBack }: { actorId?: number; onBack: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (draft: EmployeeDraft) =>
      createGerente({
        data: {
          name: draft.name,
          pin: draft.pin,
          animal: draft.animal,
          color: draft.color,
          actorId,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["gerentes"] });
      onBack();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <EmployeeForm
      kicker="Nuevo gerente"
      onBack={onBack}
      pending={mutation.isPending}
      error={error}
      onSubmit={(draft) => mutation.mutate(draft)}
    />
  );
}
