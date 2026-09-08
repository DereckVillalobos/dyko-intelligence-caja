import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartTotals, useCart } from "@/lib/pos/cart";
import { formatColones } from "@/lib/money";

export function CartPanel({ onCharge }: { onCharge: () => void }) {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const { count, total } = cartTotals(items);

  return (
    <aside className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-1 pb-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Venta actual</p>
          <p className="text-[17px] font-semibold">
            {count === 0 ? "Vacía" : `${count} ${count === 1 ? "artículo" : "artículos"}`}
          </p>
        </div>
        {items.length > 0 ? (
          <button type="button" onClick={clear} className="text-sm font-medium text-danger">
            Vaciar
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-full min-h-40 items-center justify-center rounded-2xl bg-fill px-6 text-center">
            <p className="max-w-[16rem] text-sm text-muted">
              Escanee un código o toque un producto para empezar la venta.
            </p>
          </div>
        ) : (
          <ul className="ios-list divide-y divide-border overflow-hidden rounded-2xl">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{item.name}</p>
                  <p className="text-sm text-muted tabular-nums">
                    {formatColones(item.unitPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <IconBtn
                    label="Quitar uno"
                    onClick={() => setQty(item.key, item.qty - 1)}
                  >
                    {item.qty === 1 ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
                  </IconBtn>
                  <span className="w-7 text-center text-[15px] font-semibold tabular-nums">
                    {item.qty}
                  </span>
                  <IconBtn label="Agregar uno" onClick={() => setQty(item.key, item.qty + 1)}>
                    <Plus className="size-4" />
                  </IconBtn>
                </div>
                <p className="w-20 text-right text-[15px] font-semibold tabular-nums">
                  {formatColones(item.unitPrice * item.qty)}
                </p>
                <button
                  type="button"
                  className="sr-only"
                  onClick={() => remove(item.key)}
                >
                  Eliminar {item.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-4">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-sm text-muted">Total</span>
          <span className="font-display text-3xl font-semibold tracking-tight tabular-nums">
            {formatColones(total)}
          </span>
        </div>
        <Button size="lg" className="w-full" disabled={items.length === 0} onClick={onCharge}>
          Cobrar
        </Button>
      </div>
    </aside>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full bg-fill text-fg active:scale-[0.96]"
    >
      {children}
    </button>
  );
}
