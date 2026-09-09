import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { EmployeeForm, type EmployeeDraft } from "@/components/pos/employee-form";
import { PinPad } from "@/components/pos/pin-pad";
import { SetPin } from "@/components/pos/set-pin";
import { WaitingPost } from "@/components/pos/waiting-post";
import {
  createEmployee,
  findBoundEmployee,
  getEmployee,
  listEmployees,
  requestPinReset,
  setNewPin,
  setupFirstEmployee,
  unlockEmployee,
  type PublicEmployee,
} from "@/lib/pos/staff-api";
import { toast } from "sonner";
import { getDeviceId, roleLabel, useStaff, type DeviceMode, type StaffSession } from "@/lib/pos/staff";
import { queryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";

export function StaffGate({ children }: { children: React.ReactNode }) {
  const mode = useStaff((s) => s.mode);
  const session = useStaff((s) => s.session);
  const setMode = useStaff((s) => s.setMode);
  const signIn = useStaff((s) => s.signIn);
  const signOut = useStaff((s) => s.signOut);
  const [ready, setReady] = useState(false);
  const [checkingBind, setCheckingBind] = useState(true);

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: () => listEmployees(),
  });

  const meQuery = useQuery({
    queryKey: ["me", session?.employeeId],
    queryFn: () => getEmployee({ data: { id: session!.employeeId } }),
    enabled: Boolean(session),
    refetchInterval: 2500,
  });

  useEffect(() => {
    const next = meQuery.data;
    if (!session || !next) return;
    if (next.mustSetPin) {
      signOut();
      toast("El gerente restableció su PIN. Créelo de nuevo.");
      return;
    }
    if (
      next.role !== session.role ||
      next.name !== session.name ||
      next.animal !== session.animal ||
      next.color !== session.color
    ) {
      if (session.role === "pendiente" && next.role !== "pendiente") {
        toast.success(`Te asignaron ${roleLabel(next.role)}`);
      }
      signIn({
        employeeId: next.id,
        name: next.name,
        role: next.role,
        animal: next.animal,
        color: next.color,
      });
    }
  }, [meQuery.data, session, signIn, signOut]);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setReady(true);
    };
    const persistApi = useStaff.persist;
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

  useEffect(() => {
    if (!ready) return;
    if (session || mode !== "personal") {
      setCheckingBind(false);
      return;
    }
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) setCheckingBind(false);
    }, 2500);
    void findBoundEmployee({ data: { deviceId: getDeviceId() } })
      .then((bound) => {
        if (cancelled) return;
        if (bound && !bound.mustSetPin) {
          signIn({
            employeeId: bound.id,
            name: bound.name,
            role: bound.role,
            animal: bound.animal,
            color: bound.color,
          });
        }
        setCheckingBind(false);
      })
      .catch(() => {
        if (!cancelled) setCheckingBind(false);
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [ready, mode, session, signIn]);

  if (!ready || checkingBind) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
        <p className="font-display text-xl font-semibold tracking-tight">Dyko Intelligence</p>
        <p className="mt-1 text-sm text-muted">Caja móvil</p>
      </div>
    );
  }

  if (session?.role === "pendiente") return <WaitingPost />;
  if (session) return <>{children}</>;

  if (!mode) {
    return <ModePicker onPick={setMode} />;
  }

  const employees = employeesQuery.data ?? [];
  if (employees.length === 0) {
    return (
      <FirstEmployee
        mode={mode}
        onDone={(next) => signIn(next)}
        onBack={() => setMode(null)}
      />
    );
  }

  return (
    <LockScreen
      mode={mode}
      employees={employees}
      onUnlock={(next) => signIn(next)}
    />
  );
}

function ModePicker({ onPick }: { onPick: (mode: DeviceMode) => void }) {
  const [choice, setChoice] = useState<DeviceMode | null>(null);
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">Dyko Intelligence</p>
      <h1 className="font-display mt-2 text-[28px] leading-tight font-semibold tracking-tight">
        ¿De quién es este teléfono?
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        No pedimos cédula, correo ni número. Solo el nombre que sale en el ticket y un PIN de 4
        dígitos.
      </p>
      <div className="mt-6 space-y-3">
        <ModeCard
          active={choice === "personal"}
          icon={Smartphone}
          title="Teléfono del empleado"
          hint="Se vincula a una persona. Entra solo, sin PIN cada vez."
          onClick={() => setChoice("personal")}
        />
        <ModeCard
          active={choice === "shared"}
          icon={Building2}
          title="Teléfono de la empresa"
          hint="Varios cajeros. Cada quien entra con su PIN de 4 dígitos."
          onClick={() => setChoice("shared")}
        />
      </div>
      <Button className="mt-auto" size="lg" disabled={!choice} onClick={() => choice && onPick(choice)}>
        Continuar
      </Button>
      <Link
        to="/"
        className="mt-4 mb-[env(safe-area-inset-bottom)] text-center text-[15px] font-medium text-muted"
      >
        Cambiar de app
      </Link>
    </div>
  );
}

function ModeCard({
  active,
  icon: Icon,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  icon: typeof Smartphone;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full gap-3 rounded-2xl p-4 text-left transition-transform duration-150 active:scale-[0.99]",
        active ? "bg-fg text-primary-fg" : "ios-list",
      )}
    >
      <Icon className="mt-0.5 size-6 shrink-0" />
      <span>
        <span className="block text-[17px] font-semibold">{title}</span>
        <span className={cn("mt-1 block text-[13px] leading-snug", active ? "text-primary-fg/70" : "text-muted")}>
          {hint}
        </span>
      </span>
    </button>
  );
}

function FirstEmployee({
  mode,
  onDone,
  onBack,
}: {
  mode: DeviceMode;
  onDone: (session: StaffSession) => void;
  onBack: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (draft: EmployeeDraft) =>
      setupFirstEmployee({
        data: {
          name: draft.name,
          pin: draft.pin,
          animal: draft.animal,
          color: draft.color,
          deviceId: getDeviceId(),
          bind: mode === "personal",
        },
      }),
    onSuccess: (session) => {
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      onDone(session);
    },
    onError: (err: Error) => {
      setError(err.message);
      if (err.message.includes("ya está configurado")) {
        void queryClient.invalidateQueries({ queryKey: ["employees"] });
      }
    },
  });

  return (
    <EmployeeForm
      kicker="Su perfil en el equipo"
      onBack={onBack}
      pending={mutation.isPending}
      error={error}
      onSubmit={(draft) => mutation.mutate(draft)}
    />
  );
}

function LockScreen({
  mode,
  employees,
  onUnlock,
}: {
  mode: DeviceMode;
  employees: PublicEmployee[];
  onUnlock: (session: StaffSession) => void;
}) {
  const [picked, setPicked] = useState<PublicEmployee | null>(null);
  const [adding, setAdding] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);

  const mutation = useMutation({
    mutationFn: (code: string) =>
      unlockEmployee({
        data: {
          employeeId: picked!.id,
          pin: code,
          deviceId: getDeviceId(),
          bind: mode === "personal",
        },
      }),
    onSuccess: onUnlock,
    onError: (err: Error) => {
      setError(err.message);
      setPin("");
    },
  });

  const resetMut = useMutation({
    mutationFn: () => requestPinReset({ data: { employeeId: picked!.id } }),
    onSuccess: () => {
      setForgot(true);
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const newPinMut = useMutation({
    mutationFn: (code: string) =>
      setNewPin({
        data: {
          employeeId: picked!.id,
          pin: code,
          deviceId: getDeviceId(),
          bind: mode === "personal",
        },
      }),
    onSuccess: onUnlock,
    onError: (err: Error) => setError(err.message),
  });

  useEffect(() => {
    if (pin.length !== 4 || !picked || picked.mustSetPin) return;
    mutation.mutate(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  if (adding) {
    return <AddTeammate onBack={() => setAdding(false)} />;
  }

  if (!picked) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          {mode === "personal" ? "Vincular este teléfono" : "Turno"}
        </p>
        <h1 className="font-display mt-2 text-[28px] leading-tight font-semibold tracking-tight">
          ¿Quién trabaja?
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          {mode === "personal"
            ? "Toque su perfil. Este teléfono queda ligado a usted."
            : "Toque su perfil e ingrese su PIN de 4 dígitos."}
        </p>
        <ul
          className={
            employees.length === 1
              ? "mt-8 flex justify-center"
              : "mt-8 grid grid-cols-2 gap-3"
          }
        >
          {employees.map((person) => (
            <li key={person.id} className={employees.length === 1 ? "w-44" : undefined}>
              <button
                type="button"
                onClick={() => {
                  setPicked(person);
                  setPin("");
                  setError(null);
                  setForgot(false);
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
                  <span className="text-xs text-muted">
                    {person.mustSetPin ? "Crear PIN nuevo" : roleLabel(person.role)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {mode === "shared" ? (
          <div className="mt-auto pt-6">
            <Button variant="secondary" size="lg" className="w-full" onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Agregar trabajador
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  if (picked.mustSetPin) {
    return (
      <SetPin
        name={picked.name}
        animal={picked.animal}
        color={picked.color}
        kicker="PIN restablecido"
        pending={newPinMut.isPending}
        error={error}
        onBack={() => setPicked(null)}
        onSubmit={(code) => newPinMut.mutate(code)}
      />
    );
  }

  if (forgot) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
        <button type="button" className="self-start text-sm font-medium text-primary" onClick={() => setPicked(null)}>
          Atrás
        </button>
        <div className="mt-16 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Espere al gerente</h1>
          <p className="mt-2 text-[15px] text-muted">
            {picked.name}, el gerente restablece su PIN en Equipo. Después vuelva y cree uno nuevo.
          </p>
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
        <PinPad value={pin} onChange={(next) => { setError(null); setPin(next); }} disabled={mutation.isPending} error={Boolean(error)} />
        {error ? <p className="mt-4 text-center text-sm text-danger">{error}</p> : null}
      </div>
      <button
        type="button"
        className="mt-6 text-center text-sm font-medium text-primary"
        disabled={resetMut.isPending}
        onClick={() => resetMut.mutate()}
      >
        Olvidé mi PIN
      </button>
    </div>
  );
}

function AddTeammate({ onBack }: { onBack: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (draft: EmployeeDraft) =>
      createEmployee({
        data: {
          name: draft.name,
          pin: draft.pin,
          animal: draft.animal,
          color: draft.color,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      onBack();
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <EmployeeForm
      kicker="Nuevo trabajador"
      onBack={onBack}
      pending={mutation.isPending}
      error={error}
      onSubmit={(draft) => mutation.mutate(draft)}
    />
  );
}
