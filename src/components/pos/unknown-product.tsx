import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProduct } from "@/lib/pos/api";
import { queryClient } from "@/lib/query-client";
import { CATEGORIES } from "@/lib/pos/types";
import type { Product } from "@/lib/pos/types";

const CATS = CATEGORIES.filter((c) => c !== "Todos");

export function UnknownProduct({
  barcode,
  onClose,
  onCreated,
}: {
  barcode: string;
  onClose: () => void;
  onCreated: (product: Product) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Abarrotes");

  const mutation = useMutation({
    mutationFn: () =>
      createProduct({
        data: {
          barcode,
          name,
          category,
          price: Number(price),
          stock: 0,
        },
      }),
    onSuccess: (product) => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      onCreated(product);
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo guardar"),
  });

  const valid = name.trim().length >= 2 && Number(price) > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-overlay sm:items-center">
      <form
        className="glass-sheet w-full max-w-md space-y-4 rounded-t-3xl p-5 sm:rounded-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) mutation.mutate();
        }}
      >
        <div>
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            Código nuevo
          </p>
          <p className="font-mono text-lg font-semibold tabular-nums">{barcode}</p>
          <p className="mt-1 text-sm text-muted">
            Regístrelo una vez. Quedará en el catálogo para la próxima venta.
          </p>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Nombre</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Galletas Chiky"
            autoFocus
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Precio (₡)</span>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="1250"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Categoría</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-12 w-full rounded-xl bg-fill px-3.5 text-[16px] outline-none focus:ring-2 focus:ring-primary/30"
          >
            {CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={!valid || mutation.isPending}>
            {mutation.isPending ? "Guardando…" : "Guardar y agregar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
