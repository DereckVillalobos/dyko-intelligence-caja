import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Minus, Plus, ScanBarcode, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scanner } from "@/components/pos/scanner";
import { adjustStock, createProduct, listProducts, lookupBarcode, updateProduct } from "@/lib/pos/api";
import { formatColones } from "@/lib/money";
import { queryClient } from "@/lib/query-client";
import { CATEGORIES, WASTE_LABEL, type Product, type WasteReason } from "@/lib/pos/types";
import { useStaff } from "@/lib/pos/staff";
import { cn } from "@/lib/utils";
import { playScanFeedback } from "@/lib/pos/beep";

export const Route = createFileRoute("/_shell/productos")({
  component: ProductosPage,
});

const CATS = CATEGORIES.filter((c) => c !== "Todos");

function ProductosPage() {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const employeeId = useStaff((s) => s.session?.employeeId);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () => listProducts(),
  });
  const products = productsQuery.data ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q) || p.category.toLowerCase().includes(q),
    );
  }, [products, query]);
  const low = products.filter((p) => p.stock <= 5).length;

  async function onScanned(code: string) {
    const local = products.find((p) => p.barcode === code);
    if (local) {
      playScanFeedback();
      setEditing(local);
      setScanOpen(false);
      return;
    }
    try {
      const found = await lookupBarcode({ data: { barcode: code } });
      if (found) {
        playScanFeedback();
        setEditing(found);
        setScanOpen(false);
        return;
      }
    } catch {
      /* fall through */
    }
    toast.message("No está en inventario. Créelo.");
    setEditing("new");
    setScanOpen(false);
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Inventario</h1>
          <p className="mt-1 text-sm text-muted">
            Acomode y cuente. {low ? `${low} con poco stock.` : "Stock al día."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="secondary" onClick={() => setScanOpen(true)} aria-label="Escanear">
            <ScanBarcode className="size-5" />
          </Button>
          <Button size="icon" onClick={() => setEditing("new")} aria-label="Nuevo producto">
            <Plus className="size-5" />
          </Button>
        </div>
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto"
          className="pl-10"
        />
      </div>

      {productsQuery.isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-fill" />
          ))}
        </div>
      ) : (
        <ul className="ios-list mt-4 divide-y divide-border overflow-hidden rounded-2xl">
          {filtered.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => setEditing(product)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-fill text-sm font-semibold text-muted">
                  {product.name.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{product.name}</span>
                  <span className="block font-mono text-xs text-muted">{product.barcode}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[15px] font-semibold tabular-nums">
                    {formatColones(product.price)}
                  </span>
                  <span className={cn("text-xs", product.stock <= 0 ? "text-danger" : product.stock <= 5 ? "text-warning" : "text-muted")}>
                    Stock {product.stock}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <ProductForm
          product={editing === "new" ? null : editing}
          employeeId={employeeId}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <Scanner
        open={scanOpen}
        captureOnce
        heading="Escanear inventario"
        onClose={() => setScanOpen(false)}
        onCode={(code) => void onScanned(code)}
      />
    </main>
  );
}

function ProductForm({
  product,
  employeeId,
  onClose,
}: {
  product: Product | null;
  employeeId?: number;
  onClose: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [category, setCategory] = useState(product?.category ?? "Abarrotes");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [scanOpen, setScanOpen] = useState(false);
  const [liveStock, setLiveStock] = useState(product?.stock ?? 0);
  const [wasteOpen, setWasteOpen] = useState(false);
  const [wasteQty, setWasteQty] = useState("1");
  const [wasteReason, setWasteReason] = useState<WasteReason>("vencido");
  const [wasteNote, setWasteNote] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      createProduct({
        data: {
          barcode: barcode.trim(),
          name: name.trim(),
          category,
          price: Number(price),
          stock: Number(stock) || 0,
          employeeId,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto guardado");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo guardar"),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      updateProduct({
        data: {
          id: product!.id,
          name: name.trim(),
          category,
          price: Number(price),
          stock: Number(stock) || 0,
          employeeId,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto actualizado");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo actualizar"),
  });

  const stockMut = useMutation({
    mutationFn: (payload: { delta: number; reason?: WasteReason; note?: string }) =>
      adjustStock({
        data: {
          id: product!.id,
          delta: payload.delta,
          employeeId: employeeId!,
          reason: payload.reason,
          note: payload.note,
        },
      }),
    onSuccess: (next) => {
      setLiveStock(next.stock);
      setStock(String(next.stock));
      setWasteOpen(false);
      setWasteNote("");
      setWasteQty("1");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      playScanFeedback();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const valid = name.trim().length >= 2 && Number(price) > 0 && (product || barcode.trim().length >= 3);
  const pending = createMut.isPending || updateMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center">
      <form
        className="glass-sheet max-h-[90dvh] w-full max-w-md space-y-3 overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          if (product) updateMut.mutate();
          else createMut.mutate();
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[17px] font-semibold">{product ? product.name : "Nuevo producto"}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-fill"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        {product && employeeId ? (
          <div className="rounded-2xl bg-fill px-4 py-3">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">Existencias</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{liveStock}</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[1, 5, 10].map((delta) => (
                <Button
                  key={delta}
                  type="button"
                  disabled={stockMut.isPending}
                  onClick={() => stockMut.mutate({ delta })}
                >
                  <Plus className="size-4" />
                  {delta}
                </Button>
              ))}
              <Button
                type="button"
                variant="secondary"
                disabled={stockMut.isPending || liveStock <= 0}
                onClick={() => setWasteOpen(true)}
              >
                <Minus className="size-4" />
              </Button>
            </div>
            {wasteOpen ? (
              <div className="mt-3 space-y-2 rounded-xl bg-bg-elevated p-3">
                <p className="text-sm font-medium">¿Por qué sale?</p>
                <Input
                  value={wasteQty}
                  inputMode="numeric"
                  onChange={(e) => setWasteQty(e.target.value.replace(/\D/g, ""))}
                  aria-label="Cantidad a sacar"
                />
                <div className="grid grid-cols-3 gap-1.5">
                  {(["vencido", "roto", "otro"] as WasteReason[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setWasteReason(key)}
                      className={cn(
                        "h-9 rounded-full text-xs font-medium",
                        wasteReason === key ? "bg-fg text-primary-fg" : "bg-fill text-muted",
                      )}
                    >
                      {WASTE_LABEL[key]}
                    </button>
                  ))}
                </div>
                <Input
                  value={wasteNote}
                  onChange={(e) => setWasteNote(e.target.value)}
                  placeholder={wasteReason === "otro" ? "¿Qué pasó?" : "Detalle (opcional)"}
                />
                <Button
                  type="button"
                  variant="danger"
                  className="w-full"
                  disabled={stockMut.isPending || !Number(wasteQty) || (wasteReason === "otro" && !wasteNote.trim())}
                  onClick={() =>
                    stockMut.mutate({
                      delta: -Math.abs(Number(wasteQty) || 1),
                      reason: wasteReason,
                      note: wasteNote.trim() || undefined,
                    })
                  }
                >
                  Sacar del inventario
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <label className="block space-y-1">
          <span className="text-sm font-medium">Nombre</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="space-y-1">
          <span className="text-sm font-medium">Código de barras</span>
          <div className="flex gap-2">
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              disabled={Boolean(product)}
              className="min-w-0 flex-1 font-mono disabled:opacity-60"
              placeholder="Escanear o escribir"
              inputMode="numeric"
              aria-label="Código de barras"
            />
            {product ? null : (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setScanOpen(true)}
                aria-label="Escanear código de barras"
              >
                <ScanBarcode className="size-5" />
              </Button>
            )}
          </div>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Categoría</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-12 w-full rounded-xl bg-fill px-3.5 text-[16px] outline-none"
          >
            {CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Precio (₡)</span>
            <Input
              value={price}
              inputMode="numeric"
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          {product ? null : (
            <label className="block space-y-1">
              <span className="text-sm font-medium">Stock</span>
              <Input
                value={stock}
                inputMode="numeric"
                onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
              />
            </label>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={!valid || pending}>
          {pending ? "Guardando…" : "Guardar ficha"}
        </Button>
      </form>
      <Scanner
        open={scanOpen}
        captureOnce
        heading="Código del producto"
        onClose={() => setScanOpen(false)}
        onCode={(code) => {
          setBarcode(code);
          setScanOpen(false);
        }}
      />
    </div>
  );
}
