import { useEffect, useRef, useState } from "react";
import { AnimalAvatar } from "@/components/pos/animal-avatar";
import { PinPad } from "@/components/pos/pin-pad";

export function SetPin({
  name,
  animal,
  color,
  kicker,
  pending,
  error,
  onBack,
  onSubmit,
}: {
  name: string;
  animal: string;
  color: string;
  kicker: string;
  pending?: boolean;
  error?: string | null;
  onBack: () => void;
  onSubmit: (pin: string) => void;
}) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"pin" | "confirm">("pin");
  const [localError, setLocalError] = useState<string | null>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (step === "pin" && pin.length === 4) setStep("confirm");
    if (step === "confirm" && confirm.length === 4 && !submitted.current && !pending) {
      if (confirm !== pin) {
        setLocalError("Los PIN no coinciden");
        setConfirm("");
        return;
      }
      submitted.current = true;
      onSubmit(confirm);
    }
  }, [pin, confirm, step, pending, onSubmit]);

  useEffect(() => {
    if (error) submitted.current = false;
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <button type="button" className="self-start text-sm font-medium text-primary" onClick={onBack}>
        Atrás
      </button>
      <div className="mt-6 flex flex-col items-center">
        <AnimalAvatar name={name} animal={animal} color={color} size="lg" />
        <p className="mt-3 text-xs font-medium tracking-wide text-muted uppercase">{kicker}</p>
        <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight">{name}</h1>
        <p className="mt-1 text-sm text-muted">
          {step === "pin" ? "Cree un PIN de 4 dígitos" : "Confirme el PIN"}
        </p>
      </div>
      <div className="mt-8">
        <PinPad
          value={step === "pin" ? pin : confirm}
          onChange={(next) => {
            setLocalError(null);
            if (step === "pin") setPin(next);
            else setConfirm(next);
          }}
          disabled={pending}
          error={Boolean(localError || error)}
        />
        {localError || error ? (
          <p className="mt-4 text-center text-sm text-danger">{localError || error}</p>
        ) : null}
      </div>
    </div>
  );
}
