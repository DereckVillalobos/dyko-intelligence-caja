import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, ScanBarcode, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scanner } from "@/components/pos/scanner";
import { createProduct, listProducts, updateProduct } from "@/lib/pos/api";
import { formatColones } from "@/lib/money";
import { queryClient } from "@/lib/query-client";
import { CATEGORIES, type Product } from "@/lib/pos/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/productos")({
  component: ProductosPage,
});

const CATS = CATEGORIES.filter((c) => c !== "Todos");

function ProductosPage() {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);

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

  return (
    <main className="mx-auto max-w-lg px-4 py-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="mt-1 text-sm text-muted">Catálogo con código de barras y precio.</p>
        </div>
        <Button size="icon" onClick={() => setEditing("new")} aria-label="Nuevo producto">
          <Plus className="size-5" />
        </Button>
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
                  <span className={cn("text-xs", product.stock <= 0 ? "text-danger" : "text-muted")}>
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
          onClose={() => setEditing(null)}
        />
      ) : null}
    </main>
  );
}

function ProductForm({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [category, setCategory] = useState(product?.category ?? "Abarrotes");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [scanOpen, setScanOpen] = useState(false);

  const createMut = useMutation({
    mutationFn: () =>
      createProduct({
        data: {
          barcode: barcode.trim(),
          name: name.trim(),
          category,
          price: Number(price),
          stock: Number(stock) || 0,
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
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto actualizado");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo actualizar"),
  });

  const valid = name.trim().length >= 2 && Number(price) > 0 && (product || barcode.trim().length >= 3);
  const pending = createMut.isPending || updateMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay sm:items-center">
      <form
        className="glass-sheet w-full max-w-md space-y-3 rounded-t-3xl p-5 sm:rounded-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          if (product) updateMut.mutate();
          else createMut.mutate();
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[17px] font-semibold">{product ? "Editar producto" : "Nuevo producto"}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-fill"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>
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
          <label className="block space-y-1">
            <span className="text-sm font-medium">Stock</span>
            <Input
              value={stock}
              inputMode="numeric"
              onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
            />
          </label>
        </div>
        <Button type="submit" className="w-full" disabled={!valid || pending}>
          {pending ? "Guardando…" : "Guardar"}
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
