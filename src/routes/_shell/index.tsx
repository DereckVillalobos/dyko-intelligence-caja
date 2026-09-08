import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { CartPanel } from "@/components/pos/cart-panel";
import { Checkout } from "@/components/pos/checkout";
import { OpenAmount } from "@/components/pos/open-amount";
import { ProductGrid } from "@/components/pos/product-grid";
import { Scanner } from "@/components/pos/scanner";
import { UnknownProduct } from "@/components/pos/unknown-product";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSettings, getTodaySummary, listProducts, lookupBarcode } from "@/lib/pos/api";
import { cartTotals, useCart } from "@/lib/pos/cart";
import { CATEGORIES } from "@/lib/pos/types";
import { formatColones, startOfCostaRicaDayIso } from "@/lib/money";
import { playScanFeedback, unlockAudio } from "@/lib/pos/beep";
import type { Product } from "@/lib/pos/types";

export const Route = createFileRoute("/_shell/")({ component: CajaPage });

function CajaPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Todos");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [openAmount, setOpenAmount] = useState(false);
  const [unknown, setUnknown] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const addProduct = useCart((s) => s.addProduct);
  const addOpenAmount = useCart((s) => s.addOpenAmount);
  const items = useCart((s) => s.items);
  const { count, total } = cartTotals(items);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
  });
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettings(),
  });
  const todayQuery = useQuery({
    queryKey: ["today"],
    queryFn: () => getTodaySummary({ data: { since: startOfCostaRicaDayIso() } }),
  });

  const products = productsQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "Todos" && p.category !== category) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.barcode.includes(q);
    });
  }, [products, query, category]);

  const handleProduct = useCallback(
    (product: Product) => {
      addProduct(product);
      setLastAdded(product.name);
      playScanFeedback();
    },
    [addProduct],
  );

  const handleCode = useCallback(
    async (code: string) => {
      const digits = code.trim();
      const local = products.find((p) => p.barcode === digits);
      if (local) {
        handleProduct(local);
        setQuery("");
        return;
      }
      try {
        const found = await lookupBarcode({ data: { barcode: digits } });
        if (found) {
          handleProduct(found);
          setQuery("");
          return;
        }
      } catch {
        /* fall through to register */
      }
      setUnknown(digits);
    },
    [handleProduct, products],
  );

  async function onSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (/^\d{6,14}$/.test(q)) {
      await handleCode(q);
      return;
    }
    if (filtered.length === 1) handleProduct(filtered[0]!);
  }

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-6">
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              {settingsQuery.data?.storeName ?? "Dyko Intelligence"}
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Caja</h1>
          </div>
          <p className="text-right text-sm text-muted">
            Hoy {todayQuery.data ? formatColones(todayQuery.data.total) : "—"}
            <span className="mt-0.5 block tabular-nums">
              {todayQuery.data?.count ?? 0} ventas
            </span>
          </p>
        </div>

        <form onSubmit={onSearchSubmit} className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar o escanear código"
            className="pl-10"
            autoComplete="off"
            inputMode="search"
          />
        </form>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={
                category === cat
                  ? "h-8 shrink-0 rounded-full bg-fg px-3.5 text-sm font-medium text-primary-fg"
                  : "h-8 shrink-0 rounded-full bg-fill px-3.5 text-sm font-medium text-muted"
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {productsQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-fill" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="ios-list rounded-2xl px-5 py-10 text-center text-sm text-muted">
            No hay productos con ese filtro.
          </div>
        ) : (
          <ProductGrid
            products={filtered}
            onProduct={handleProduct}
            onScan={() => {
              unlockAudio();
              setScannerOpen(true);
            }}
            onOpenAmount={() => setOpenAmount(true)}
          />
        )}
      </section>

      <section className="hairline hidden rounded-3xl bg-bg-elevated p-4 lg:block">
        <CartPanel onCharge={() => setCheckoutOpen(true)} />
      </section>

      {count > 0 ? (
        <div className="glass-bar specular fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 rounded-2xl p-2 lg:hidden">
          <Button
            size="lg"
            className="w-full justify-between px-4"
            onClick={() => setCartOpen(true)}
          >
            <span>
              Ver venta · {count} {count === 1 ? "artículo" : "artículos"}
            </span>
            <span className="tabular-nums">{formatColones(total)}</span>
          </Button>
        </div>
      ) : null}

      {cartOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-overlay"
            aria-label="Cerrar venta"
            onClick={() => setCartOpen(false)}
          />
          <div className="glass-sheet absolute inset-x-0 bottom-0 flex max-h-[82dvh] flex-col rounded-t-3xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <CartPanel
              onCharge={() => {
                setCartOpen(false);
                setCheckoutOpen(true);
              }}
            />
          </div>
        </div>
      ) : null}

      <Scanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCode={(code) => void handleCode(code)}
        lastAdded={lastAdded}
      />
      {openAmount ? (
        <OpenAmount
          onClose={() => setOpenAmount(false)}
          onConfirm={(amount) => {
            addOpenAmount(amount);
            setOpenAmount(false);
            playScanFeedback();
            toast.success("Monto agregado");
          }}
        />
      ) : null}
      {unknown ? (
        <UnknownProduct
          barcode={unknown}
          onClose={() => setUnknown(null)}
          onCreated={(product) => {
            handleProduct(product);
            setUnknown(null);
          }}
        />
      ) : null}
      <Checkout open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </main>
  );
}
