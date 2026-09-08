import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinPad } from "@/components/pos/pin-pad";
import {
  findBoundEmployee,
  listEmployees,
  setupFirstEmployee,
  unlockEmployee,
  type PublicEmployee,
} from "@/lib/pos/staff-api";
import { getDeviceId, useStaff, type DeviceMode } from "@/lib/pos/staff";
import { queryClient } from "@/lib/query-client";
import { cn } from "@/lib/utils";

export function StaffGate({ children }: { children: React.ReactNode }) {
  const mode = useStaff((s) => s.mode);
  const session = useStaff((s) => s.session);
  const setMode = useStaff((s) => s.setMode);
  const signIn = useStaff((s) => s.signIn);
  const [ready, setReady] = useState(false);
  const [checkingBind, setCheckingBind] = useState(true);

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: () => listEmployees(),
  });

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
        if (bound) signIn({ employeeId: bound.id, name: bound.name, role: bound.role });
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
  onDone: (session: { employeeId: number; name: string; role: "admin" }) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"name" | "pin" | "confirm">("name");
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);

  const mutation = useMutation({
    mutationFn: () =>
      setupFirstEmployee({
        data: {
          name: name.trim(),
          pin: confirm,
          deviceId: getDeviceId(),
          bind: mode === "personal",
        },
      }),
    onSuccess: (session) => {
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
      onDone(session);
    },
    onError: (err: Error) => {
      submitted.current = false;
      setError(err.message);
      setConfirm("");
      if (err.message.includes("ya está configurado")) {
        void queryClient.invalidateQueries({ queryKey: ["employees"] });
      }
    },
  });

  useEffect(() => {
    if (step === "pin" && pin.length === 4) setStep("confirm");
    if (step === "confirm" && confirm.length === 4 && !submitted.current) {
      if (confirm !== pin) {
        setError("Los PIN no coinciden");
        setConfirm("");
        return;
      }
      submitted.current = true;
      mutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, confirm, step]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">Responsable de esta caja</p>
      <h1 className="font-display mt-2 text-[28px] leading-tight font-semibold tracking-tight">
        {step === "name" ? "¿Cómo se llama?" : step === "pin" ? "Cree su PIN" : "Confirme el PIN"}
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        {step === "name"
          ? "Así va a aparecer en cada venta. Un nombre es suficiente."
          : "4 dígitos. No lo comparta. Si olvida el PIN, el responsable del local lo puede cambiar."}
      </p>
      {step === "name" ? (
        <>
          <Input
            className="mt-6"
            value={name}
            autoFocus
            placeholder="Ej. María"
            onChange={(e) => setName(e.target.value)}
          />
          <div className="mt-auto flex flex-col gap-2">
            <Button size="lg" disabled={name.trim().length < 2} onClick={() => setStep("pin")}>
              Continuar
            </Button>
            <Button variant="ghost" onClick={onBack}>
              Atrás
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-10">
          <PinPad
            value={step === "pin" ? pin : confirm}
            onChange={step === "pin" ? setPin : setConfirm}
            disabled={mutation.isPending}
            error={Boolean(error)}
          />
          {error ? <p className="mt-4 text-center text-sm text-danger">{error}</p> : null}
        </div>
      )}
    </div>
  );
}

function LockScreen({
  mode,
  employees,
  onUnlock,
}: {
  mode: DeviceMode;
  employees: PublicEmployee[];
  onUnlock: (session: { employeeId: number; name: string; role: PublicEmployee["role"] }) => void;
}) {
  const [picked, setPicked] = useState<PublicEmployee | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (pin.length !== 4 || !picked) return;
    mutation.mutate(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  if (!picked) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          {mode === "personal" ? "Vincular este teléfono" : "Turno"}
        </p>
        <h1 className="font-display mt-2 text-[28px] leading-tight font-semibold tracking-tight">
          ¿Quién cobra?
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          {mode === "personal"
            ? "Elija su nombre. Este teléfono quedará ligado a usted."
            : "Toque su nombre e ingrese su PIN de 4 dígitos."}
        </p>
        <ul className="ios-list mt-6 divide-y divide-border overflow-hidden rounded-2xl">
          {employees.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => {
                  setPicked(person);
                  setPin("");
                  setError(null);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-fill text-sm font-semibold">
                  {person.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-medium">{person.name}</span>
                  <span className="text-xs text-muted">
                    {person.role === "admin" ? "Responsable" : "Cajero"}
                    {person.bound ? " · teléfono vinculado" : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <button type="button" className="self-start text-sm font-medium text-primary" onClick={() => setPicked(null)}>
        Atrás
      </button>
      <div className="mt-6 flex flex-col items-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-fill text-xl font-semibold">
          {picked.name.slice(0, 1).toUpperCase()}
        </span>
        <h1 className="font-display mt-3 text-2xl font-semibold tracking-tight">{picked.name}</h1>
        <p className="mt-1 text-sm text-muted">Ingrese su PIN de 4 dígitos</p>
      </div>
      <div className="mt-8">
        <PinPad value={pin} onChange={(next) => { setError(null); setPin(next); }} disabled={mutation.isPending} error={Boolean(error)} />
        {error ? <p className="mt-4 text-center text-sm text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
