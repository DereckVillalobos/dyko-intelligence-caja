import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Keypad } from "@/components/pos/keypad";
import { formatColones } from "@/lib/money";

export function OpenAmount({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(0);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-overlay sm:items-center">
      <div className="glass-sheet w-full max-w-md space-y-4 rounded-t-3xl p-5 sm:rounded-3xl">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            Monto abierto
          </p>
          <p className="text-sm text-muted">Para productos sin código o cobros varios.</p>
        </div>
        <p className="text-center font-display text-5xl font-semibold tabular-nums tracking-tight">
          {formatColones(amount)}
        </p>
        <Keypad value={amount} onChange={setAmount} />
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={amount <= 0}
            onClick={() => onConfirm(amount)}
          >
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
}
