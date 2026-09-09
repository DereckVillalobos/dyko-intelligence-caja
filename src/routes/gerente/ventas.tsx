import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, X } from "lucide-react";
import { getSale, getTodaySummary, listSales } from "@/lib/pos/api";
import { formatColones, formatDateTime, formatTime, startOfCostaRicaDayIso } from "@/lib/money";
import { PAYMENT_LABEL, type PaymentMethod } from "@/lib/pos/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gerente/ventas")({
  component: GerenteVentas,
});

const FILTERS: Array<{ id: "all" | PaymentMethod; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "cash", label: "Efectivo" },
  { id: "card", label: "Tarjeta" },
  { id: "sinpe", label: "SINPE" },
];

function GerenteVentas() {
  const [filter, setFilter] = useState<"all" | PaymentMethod>("all");
  const [openId, setOpenId] = useState<number | null>(null);

  const salesQuery = useQuery({ queryKey: ["sales"], queryFn: () => listSales() });
  const todayQuery = useQuery({
    queryKey: ["today"],
    queryFn: () => getTodaySummary({ data: { since: startOfCostaRicaDayIso() } }),
  });
  const detailQuery = useQuery({
    queryKey: ["sale", openId],
    queryFn: () => getSale({ data: { id: openId! } }),
    enabled: openId !== null,
  });

  const sales = salesQuery.data ?? [];
  const visible = useMemo(
    () => (filter === "all" ? sales : sales.filter((s) => s.paymentMethod === filter)),
    [sales, filter],
  );
  const today = todayQuery.data;
  const detail = detailQuery.data;

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Ventas</h1>
      <p className="mt-1 text-sm text-muted">Registro completo del local.</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="ios-list rounded-2xl px-4 py-3">
          <p className="text-xs text-muted">Hoy</p>
          <p className="mt-1 text-[17px] font-semibold tabular-nums">{today?.count ?? 0}</p>
        </div>
        <div className="ios-list rounded-2xl px-4 py-3">
          <p className="text-xs text-muted">Total</p>
          <p className="mt-1 text-[17px] font-semibold tabular-nums">
            {formatColones(today?.total ?? 0)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "h-8 shrink-0 rounded-full px-3.5 text-sm font-medium",
              filter === item.id ? "bg-fg text-primary-fg" : "bg-fill text-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ul className="ios-list mt-4 divide-y divide-border overflow-hidden rounded-2xl">
        {visible.map((sale) => (
          <li key={sale.id}>
            <button
              type="button"
              onClick={() => setOpenId(sale.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{sale.ticket}</span>
                <span className="text-xs text-muted">
                  {formatTime(sale.createdAt)} · {sale.cashier} · {PAYMENT_LABEL[sale.paymentMethod]}
                </span>
              </span>
              <span className="text-[15px] font-semibold tabular-nums">
                {formatColones(sale.total)}
              </span>
              <ChevronRight className="size-4 text-subtle" />
            </button>
          </li>
        ))}
      </ul>
      {visible.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">No hay ventas con ese filtro.</p>
      ) : null}

      {openId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center">
          <div className="glass-sheet max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <p className="text-[17px] font-semibold">{detail?.ticket ?? "Venta"}</p>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="flex size-9 items-center justify-center rounded-full bg-fill"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
            </div>
            {detail ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-muted">
                  {formatDateTime(detail.createdAt)} · {detail.cashier} ·{" "}
                  {PAYMENT_LABEL[detail.paymentMethod]}
                </p>
                <ul className="divide-y divide-border">
                  {detail.items.map((item) => (
                    <li key={item.id} className="flex justify-between py-2 text-[15px]">
                      <span>
                        {item.qty} × {item.name}
                      </span>
                      <span className="tabular-nums">{formatColones(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
                <p className="flex justify-between text-[17px] font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatColones(detail.total)}</span>
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">Cargando…</p>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
