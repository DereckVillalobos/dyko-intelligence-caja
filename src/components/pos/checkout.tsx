import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Banknote, Check, Copy, CreditCard, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Keypad } from "@/components/pos/keypad";
import { playSuccessFeedback } from "@/lib/pos/beep";
import { getEmployeeId } from "@/lib/pos/cashier";
import { completeSale, getSettings } from "@/lib/pos/api";
import { cartTotals, useCart } from "@/lib/pos/cart";
import { queryClient } from "@/lib/query-client";
import { formatColones } from "@/lib/money";
import type { PaymentMethod, SaleDetail } from "@/lib/pos/types";
import { PAYMENT_LABEL } from "@/lib/pos/types";
import { cn } from "@/lib/utils";

const BILLS = [1000, 2000, 5000, 10000, 20000, 50000];

type Step = "method" | "pay" | "done";

export function Checkout({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const { total } = cartTotals(items);
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [tendered, setTendered] = useState(0);
  const [sale, setSale] = useState<SaleDetail | null>(null);

  const settings = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });

  const mutation = useMutation({
    mutationFn: (paymentMethod: PaymentMethod) => {
      const employeeId = getEmployeeId();
      if (!employeeId) throw new Error("Inicie su turno para cobrar");
      return completeSale({
        data: {
          items: items.map((item) => ({
            productId: item.productId,
            barcode: item.barcode,
            name: item.name,
            qty: item.qty,
            unitPrice: item.unitPrice,
          })),
          paymentMethod,
          tendered: paymentMethod === "cash" ? tendered : total,
          employeeId,
        },
      });
    },
    onSuccess: (result) => {
      playSuccessFeedback();
      setSale(result);
      setStep("done");
      clear();
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
      void queryClient.invalidateQueries({ queryKey: ["today"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo registrar la venta");
    },
  });

  const change = tendered - total;
  const canConfirmCash = tendered >= total && total > 0;

  const quickBills = useMemo(() => {
    const above = BILLS.filter((b) => b >= total).slice(0, 3);
    return above;
  }, [total]);

  if (!open) return null;

  function resetAndClose() {
    setStep("method");
    setMethod(null);
    setTendered(0);
    setSale(null);
    onClose();
  }

  function pick(next: PaymentMethod) {
    setMethod(next);
    setTendered(next === "cash" ? 0 : total);
    setStep("pay");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center">
      <div className="glass-sheet flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-[13px] font-medium tracking-wide text-muted uppercase">
            {step === "method" && "Cobrar"}
            {step === "pay" && method && PAYMENT_LABEL[method]}
            {step === "done" && "Venta registrada"}
          </p>
          <button
            type="button"
            onClick={resetAndClose}
            className="flex size-9 items-center justify-center rounded-full bg-fill text-muted"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        {step === "method" ? (
          <div className="space-y-4 px-5 pb-6">
            <div>
              <p className="text-sm text-muted">Total a cobrar</p>
              <p className="font-display text-5xl leading-none font-semibold tracking-tight tabular-nums">
                {formatColones(total)}
              </p>
            </div>
            <div className="grid gap-2">
              <PayMethod
                icon={Banknote}
                title="Efectivo"
                hint="Calcule el vuelto"
                tone="cash"
                onClick={() => pick("cash")}
              />
              <PayMethod
                icon={CreditCard}
                title="Tarjeta"
                hint="Cobre en el datáfono"
                tone="card"
                onClick={() => pick("card")}
              />
              <PayMethod
                icon={Smartphone}
                title="SINPE Móvil"
                hint="Espere la transferencia"
                tone="sinpe"
                onClick={() => pick("sinpe")}
              />
            </div>
          </div>
        ) : null}

        {step === "pay" && method === "cash" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Total" value={formatColones(total)} />
                <Stat
                  label="Vuelto"
                  value={change >= 0 ? formatColones(change) : "—"}
                  emphasize={change > 0}
                />
              </div>
              <p className="text-center font-display text-4xl font-semibold tabular-nums tracking-tight">
                {formatColones(tendered)}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTendered(total)}
                  className="h-9 rounded-full bg-fill px-3 text-sm font-medium"
                >
                  Exacto
                </button>
                {quickBills.map((bill) => (
                  <button
                    key={bill}
                    type="button"
                    onClick={() => setTendered(bill)}
                    className="h-9 rounded-full bg-fill px-3 text-sm font-medium tabular-nums"
                  >
                    {formatColones(bill)}
                  </button>
                ))}
              </div>
              <Keypad value={tendered} onChange={setTendered} />
            </div>
            <div className="px-5 pt-3 pb-6">
              <Button
                size="lg"
                className="w-full"
                disabled={!canConfirmCash || mutation.isPending}
                onClick={() => mutation.mutate("cash")}
              >
                {mutation.isPending ? "Registrando…" : "Confirmar efectivo"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === "pay" && method === "card" ? (
          <div className="space-y-5 px-5 pb-6">
            <p className="text-sm text-muted">
              Cobre este monto en el datáfono y confirme cuando el pago sea aprobado.
            </p>
            <p className="text-center font-display text-5xl font-semibold tracking-tight tabular-nums">
              {formatColones(total)}
            </p>
            <div className="rounded-2xl bg-fill px-4 py-3 text-sm text-muted">
              No cierre la venta hasta ver el voucher aprobado.
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("card")}
            >
              {mutation.isPending ? "Registrando…" : "Confirmar cobro con tarjeta"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("method")}>
              Elegir otro medio
            </Button>
          </div>
        ) : null}

        {step === "pay" && method === "sinpe" ? (
          <div className="space-y-4 px-5 pb-6">
            <p className="text-sm text-muted">
              Pida el SINPE a este número. Confirme cuando vea el dinero en la cuenta.
            </p>
            <div className="ios-list rounded-2xl px-4 py-4">
              <p className="text-xs font-medium tracking-wide text-muted uppercase">
                {settings.data?.sinpeHolder ?? "Dyko Intelligence"}
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="font-display text-3xl font-semibold tracking-tight tabular-nums">
                  {settings.data?.sinpePhone ?? "8888-0101"}
                </p>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={async () => {
                    const phone = settings.data?.sinpePhone ?? "";
                    try {
                      await navigator.clipboard.writeText(phone.replaceAll("-", ""));
                      toast.success("Número copiado");
                    } catch {
                      toast.error("No se pudo copiar");
                    }
                  }}
                  aria-label="Copiar número"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
            <p className="text-center font-display text-4xl font-semibold tabular-nums">
              {formatColones(total)}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-sinpe">
              <span className="size-2 animate-pulse rounded-full bg-sinpe" />
              Esperando SINPE
            </div>
            <Button
              size="lg"
              variant="success"
              className="w-full"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("sinpe")}
            >
              {mutation.isPending ? "Registrando…" : "SINPE recibido"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("method")}>
              Elegir otro medio
            </Button>
          </div>
        ) : null}

        {step === "done" && sale ? (
          <div className="flex flex-col items-center gap-4 px-5 pb-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
              <Check className="size-8" strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm text-muted">{sale.ticket}</p>
              <p className="font-display text-4xl font-semibold tabular-nums tracking-tight">
                {formatColones(sale.total)}
              </p>
              <p className="mt-1 text-sm text-muted">{PAYMENT_LABEL[sale.paymentMethod]}</p>
            </div>
            {sale.paymentMethod === "cash" && sale.changeDue > 0 ? (
              <div className="w-full rounded-2xl bg-success-soft px-4 py-4">
                <p className="text-sm font-medium text-success">Entregue de vuelto</p>
                <p className="font-display text-4xl font-semibold text-success tabular-nums">
                  {formatColones(sale.changeDue)}
                </p>
              </div>
            ) : null}
            <Button size="lg" className="w-full" onClick={resetAndClose}>
              Nueva venta
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PayMethod({
  icon: Icon,
  title,
  hint,
  tone,
  onClick,
}: {
  icon: typeof Banknote;
  title: string;
  hint: string;
  tone: "cash" | "card" | "sinpe";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl bg-fill px-3 py-3 text-left transition-transform duration-150 active:scale-[0.98]"
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-xl text-primary-fg",
          tone === "cash" && "bg-cash",
          tone === "card" && "bg-card",
          tone === "sinpe" && "bg-sinpe",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-medium">{title}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
    </button>
  );
}

function Stat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-fill px-3 py-3">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p
        className={cn(
          "font-display text-xl font-semibold tabular-nums",
          emphasize && "text-success",
        )}
      >
        {value}
      </p>
    </div>
  );
}
