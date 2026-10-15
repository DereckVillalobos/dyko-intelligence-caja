import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimalAvatar, AnimalMark } from "@/components/pos/animal-avatar";
import { PinPad } from "@/components/pos/pin-pad";
import {
  ANIMAL_KEYS,
  AVATAR_COLORS,
  type AnimalKey,
  type AvatarColorKey,
  colorHex,
} from "@/lib/pos/avatar";
import { cn } from "@/lib/utils";

export type EmployeeDraft = {
  name: string;
  pin: string;
  animal: AnimalKey;
  color: AvatarColorKey;
};

type Step = "name" | "look" | "pin" | "confirm";

export function EmployeeForm({
  kicker,
  onBack,
  onSubmit,
  pending,
  error,
  submitHint,
  nameExtra,
}: {
  kicker: string;
  onBack?: () => void;
  onSubmit: (draft: EmployeeDraft) => void;
  pending?: boolean;
  error?: string | null;
  submitHint?: string;
  nameExtra?: ReactNode;
}) {
  const [name, setName] = useState("");
  const [animal, setAnimal] = useState<AnimalKey>("fox");
  const [color, setColor] = useState<AvatarColorKey>("peach");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<Step>("name");
  const [localError, setLocalError] = useState<string | null>(null);
  const submitted = useRef(false);
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;

  const title =
    step === "name"
      ? "¿Cómo se llama?"
      : step === "look"
        ? "Elija su perfil"
        : step === "pin"
          ? "Cree su PIN"
          : "Confirme el PIN";

  const hint =
    step === "name"
      ? "Así sale en el ticket. Solo un nombre."
      : step === "look"
        ? "Un animal y un color. Toque el que más le guste."
        : submitHint ?? "4 dígitos. No lo comparta.";

  useEffect(() => {
    if (step === "pin" && pin.length === 4) setStep("confirm");
    if (step === "confirm" && confirm.length === 4 && !submitted.current && !pending) {
      if (confirm !== pin) {
        setLocalError("Los PIN no coinciden");
        setConfirm("");
        return;
      }
      submitted.current = true;
      submitRef.current({ name: name.trim(), pin: confirm, animal, color });
    }
  }, [pin, confirm, step, name, animal, color, pending]);

  useEffect(() => {
    if (error) submitted.current = false;
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{kicker}</p>
      <h1 className="font-display mt-2 text-[28px] leading-tight font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-[15px] text-muted">{hint}</p>

      {step === "name" ? (
        <>
          <Input
            className="mt-6"
            value={name}
            autoFocus
            placeholder="Ej. Carlos"
            onChange={(e) => setName(e.target.value)}
          />
          {nameExtra}
          <div className="mt-auto flex flex-col gap-2">
            <Button size="lg" disabled={name.trim().length < 2} onClick={() => setStep("look")}>
              Continuar
            </Button>
            {onBack ? (
              <Button variant="ghost" onClick={onBack}>
                Atrás
              </Button>
            ) : null}
          </div>
        </>
      ) : null}

      {step === "look" ? (
        <>
          <div className="mt-6 flex flex-col items-center">
            <AnimalAvatar name={name} animal={animal} color={color} size="lg" />
            <p className="mt-3 text-[17px] font-semibold">{name.trim()}</p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {ANIMAL_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setAnimal(key)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-2xl p-2 transition-transform duration-150 active:scale-[0.97]",
                  animal === key ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : "",
                )}
                style={{ backgroundColor: colorHex(color) }}
                aria-label={key}
              >
                <AnimalMark animal={key} />
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            {AVATAR_COLORS.map((swatch) => (
              <button
                key={swatch.key}
                type="button"
                aria-label={swatch.label}
                onClick={() => setColor(swatch.key)}
                className={cn(
                  "size-8 rounded-full transition-transform duration-150 active:scale-95",
                  color === swatch.key ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : "",
                )}
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
          </div>
          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Button size="lg" onClick={() => setStep("pin")}>
              Continuar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPin("");
                setConfirm("");
                setStep("name");
              }}
            >
              Atrás
            </Button>
          </div>
        </>
      ) : null}

      {step === "pin" || step === "confirm" ? (
        <div className="mt-8">
          <div className="mb-6 flex justify-center">
            <AnimalAvatar name={name} animal={animal} color={color} size="md" />
          </div>
          <PinPad
            value={step === "pin" ? pin : confirm}
            onChange={step === "pin" ? setPin : setConfirm}
            disabled={pending}
            error={Boolean(error || localError)}
          />
          {error || localError ? (
            <p className="mt-4 text-center text-sm text-danger">{error || localError}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
