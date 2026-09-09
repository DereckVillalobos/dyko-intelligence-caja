import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, X } from "lucide-react";
import { getSale, getTodaySummary, listSales } from "@/lib/pos/api";
import { formatColones, formatDateTime, formatTime, startOfCostaRicaDayIso } from "@/lib/money";
import { PAYMENT_LABEL, type PaymentMethod, type SaleSummary } from "@/lib/pos/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/caja/historial")({
  component: HistorialPage,
});

const FILTERS: Array<{ id: "all" | PaymentMethod; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "cash", label: "Efectivo" },
  { id: "card", label: "Tarjeta" },
  { id: "sinpe", label: "SINPE" },
];

function HistorialPage() {
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

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Historial</h1>
      <p className="mt-1 text-sm text-muted">Registro de ventas de este local.</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <SummaryCard label="Ventas de hoy" value={String(today?.count ?? 0)} />
        <SummaryCard label="Total de hoy" value={formatColones(today?.total ?? 0)} />
        <SummaryCard label="Efectivo" value={formatColones(today?.cash ?? 0)} />
        <SummaryCard label="Tarjeta + SINPE" value={formatColones((today?.card ?? 0) + (today?.sinpe ?? 0))} />
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

      {salesQuery.isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-fill" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="ios-list mt-4 rounded-2xl px-5 py-10 text-center text-sm text-muted">
          Aún no hay ventas {filter === "all" ? "registradas" : `en ${FILTERS.find((f) => f.id === filter)?.label}`}.
        </div>
      ) : (
        <ul className="ios-list mt-4 divide-y divide-border overflow-hidden rounded-2xl">
          {visible.map((sale) => (
            <SaleRow key={sale.id} sale={sale} onOpen={() => setOpenId(sale.id)} />
          ))}
        </ul>
      )}

      {openId !== null ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center">
          <div className="glass-sheet max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted uppercase">
                  {detailQuery.data?.ticket ?? "Venta"}
                </p>
                <p className="font-display text-3xl font-semibold tabular-nums">
                  {detailQuery.data ? formatColones(detailQuery.data.total) : "…"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="flex size-9 items-center justify-center rounded-full bg-fill"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
            </div>
            {detailQuery.data ? (
              <>
                <p className="mt-1 text-sm text-muted">
                  {PAYMENT_LABEL[detailQuery.data.paymentMethod]} · {detailQuery.data.cashier} ·{" "}
                  {formatDateTime(detailQuery.data.createdAt)}
                </p>
                <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl bg-fill">
                  {detailQuery.data.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between px-3 py-3 text-[15px]">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.name}</span>
                        <span className="text-sm text-muted tabular-nums">
                          {item.qty} × {formatColones(item.unitPrice)}
                        </span>
                      </span>
                      <span className="font-semibold tabular-nums">{formatColones(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
                {detailQuery.data.paymentMethod === "cash" ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p className="rounded-xl bg-fill px-3 py-2">
                      Recibido
                      <span className="mt-0.5 block font-semibold tabular-nums">
                        {formatColones(detailQuery.data.tendered)}
                      </span>
                    </p>
                    <p className="rounded-xl bg-fill px-3 py-2">
                      Vuelto
                      <span className="mt-0.5 block font-semibold tabular-nums">
                        {formatColones(detailQuery.data.changeDue)}
                      </span>
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mt-6 text-sm text-muted">Cargando detalle…</p>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="hairline rounded-2xl bg-bg-elevated px-3 py-3">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SaleRow({ sale, onOpen }: { sale: SaleSummary; onOpen: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            sale.paymentMethod === "cash" && "bg-cash",
            sale.paymentMethod === "card" && "bg-card",
            sale.paymentMethod === "sinpe" && "bg-sinpe",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{sale.ticket}</span>
          <span className="text-sm text-muted">
            {PAYMENT_LABEL[sale.paymentMethod]} · {sale.cashier} · {formatTime(sale.createdAt)}
          </span>
        </span>
        <span className="text-[15px] font-semibold tabular-nums">{formatColones(sale.total)}</span>
        <ChevronRight className="size-4 text-subtle" />
      </button>
    </li>
  );
}
