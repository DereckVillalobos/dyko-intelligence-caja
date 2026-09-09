import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Keypad } from "@/components/pos/keypad";
import { submitCashClose } from "@/lib/pos/api";
import { formatColones, startOfCostaRicaDayIso } from "@/lib/money";
import { queryClient } from "@/lib/query-client";
import type { CashClose } from "@/lib/pos/types";
import { cn } from "@/lib/utils";

export function CashCloseSheet({
  preview,
  actorId,
  onClose,
}: {
  preview: CashClose;
  actorId: number;
  onClose: () => void;
}) {
  const [floatAmount, setFloatAmount] = useState(preview.floatAmount);
  const [counted, setCounted] = useState(preview.closed ? preview.countedCash : 0);
  const [note, setNote] = useState(preview.note ?? "");
  const [step, setStep] = useState<"float" | "count">("count");

  useEffect(() => {
    setFloatAmount(preview.floatAmount);
    setCounted(preview.closed ? preview.countedCash : 0);
    setNote(preview.note ?? "");
  }, [preview]);

  const expected = floatAmount + preview.cashSales;
  const difference = counted - expected;

  const mutation = useMutation({
    mutationFn: () =>
      submitCashClose({
        data: {
          actorId,
          countedCash: counted,
          floatAmount,
          note: note.trim() || undefined,
          since: startOfCostaRicaDayIso(),
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["manager-overview"] });
      toast.success("Caja cerrada");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center">
      <div className="glass-sheet max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <p className="text-[17px] font-semibold">{preview.closed ? "Volver a contar" : "Cerrar caja"}</p>
          <button type="button" className="text-sm font-medium text-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setStep("float")}
            className={cn("ios-list rounded-2xl px-4 py-3 text-left", step === "float" && "ring-2 ring-primary/30")}
          >
            <p className="text-xs text-muted">Fondo</p>
            <p className="mt-1 text-[17px] font-semibold tabular-nums">{formatColones(floatAmount)}</p>
          </button>
          <div className="ios-list rounded-2xl px-4 py-3">
            <p className="text-xs text-muted">Efectivo ventas</p>
            <p className="mt-1 text-[17px] font-semibold tabular-nums">{formatColones(preview.cashSales)}</p>
          </div>
          <div className="ios-list rounded-2xl px-4 py-3">
            <p className="text-xs text-muted">Esperado</p>
            <p className="mt-1 text-[17px] font-semibold tabular-nums">{formatColones(expected)}</p>
          </div>
          <button
            type="button"
            onClick={() => setStep("count")}
            className={cn("ios-list rounded-2xl px-4 py-3 text-left", step === "count" && "ring-2 ring-primary/30")}
          >
            <p className="text-xs text-muted">Contado</p>
            <p className="mt-1 text-[17px] font-semibold tabular-nums">{formatColones(counted)}</p>
          </button>
        </div>

        <p
          className={cn(
            "mt-3 text-center text-[15px] font-semibold",
            difference === 0 && "text-success",
            difference > 0 && "text-success",
            difference < 0 && "text-danger",
          )}
        >
          {difference === 0
            ? "Cuadra"
            : difference > 0
              ? `Sobra ${formatColones(difference)}`
              : `Falta ${formatColones(Math.abs(difference))}`}
        </p>

        <p className="mt-4 text-center text-xs text-muted">
          {step === "float" ? "Fondo al abrir la gaveta" : "Cuente el efectivo de la gaveta"}
        </p>
        <div className="mt-2">
          {step === "float" ? (
            <Keypad value={floatAmount} onChange={setFloatAmount} />
          ) : (
            <Keypad value={counted} onChange={setCounted} />
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Mini label="Tarjeta" value={formatColones(preview.cardTotal)} />
          <Mini label="SINPE" value={formatColones(preview.sinpeTotal)} />
          <Mini label="Tickets" value={String(preview.salesCount)} />
        </div>

        <Input
          className="mt-4"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nota (opcional)"
        />

        <Button
          className="mt-4 w-full"
          size="lg"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Guardando…" : preview.closed ? "Actualizar cierre" : "Cerrar caja de hoy"}
        </Button>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="ios-list rounded-2xl px-2 py-2">
      <p className="text-[10px] text-muted uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
