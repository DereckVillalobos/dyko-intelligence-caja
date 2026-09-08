import { Banknote, ScanLine } from "lucide-react";
import { formatColones } from "@/lib/money";
import type { Product } from "@/lib/pos/types";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  onProduct,
  onScan,
  onOpenAmount,
}: {
  products: Product[];
  onProduct: (product: Product) => void;
  onScan: () => void;
  onOpenAmount: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
      <ActionTile
        icon={ScanLine}
        title="Escanear"
        hint="Cámara o código"
        onClick={onScan}
      />
      <ActionTile
        icon={Banknote}
        title="Monto abierto"
        hint="Sin código"
        onClick={onOpenAmount}
      />
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onProduct(product)}
          className="hairline flex min-h-[7.5rem] flex-col items-start rounded-2xl bg-bg-elevated p-3 text-left transition-transform duration-150 active:scale-[0.98]"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-fill text-sm font-semibold text-muted">
            {product.name.slice(0, 1)}
          </span>
          <span className="mt-auto line-clamp-2 text-[14px] leading-snug font-medium">
            {product.name}
          </span>
          <span className="mt-1 text-[15px] font-semibold tabular-nums">
            {formatColones(product.price)}
          </span>
        </button>
      ))}
    </div>
  );
}

function ActionTile({
  icon: Icon,
  title,
  hint,
  onClick,
}: {
  icon: typeof ScanLine;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[7.5rem] flex-col items-start rounded-2xl p-3 text-left",
        "bg-fg text-primary-fg transition-transform duration-150 active:scale-[0.98]",
      )}
    >
      <Icon className="size-6" />
      <span className="mt-auto text-[14px] font-semibold">{title}</span>
      <span className="text-[12px] text-primary-fg/70">{hint}</span>
    </button>
  );
}
