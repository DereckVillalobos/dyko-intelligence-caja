import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/lib/pos/api";

export function SyncMark({ side }: { side: "caja" | "gerente" }) {
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const name = settings.data?.storeName ?? "el local";
  const code = settings.data?.storeCode;

  return (
    <section className="mt-6">
      <p className="mb-2 px-1 text-xs font-medium tracking-wide text-muted uppercase">
        Conexión
      </p>
      <div className="ios-list rounded-2xl px-4 py-3">
        <p className="flex items-center gap-2 text-[15px] font-medium">
          <span className="size-2 rounded-full bg-success" />
          Sincronizado con {name}
        </p>
        {code ? (
          <p className="mt-1 font-mono text-sm tabular-nums text-muted">{code}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted">
          {side === "caja"
            ? "Cobros, inventario y perfiles llegan solos a la app del gerente."
            : "Lo que hace el equipo en Caja aparece aquí al instante."}
        </p>
      </div>
    </section>
  );
}
