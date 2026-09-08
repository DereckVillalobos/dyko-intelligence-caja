import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function PinPad({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  function press(key: (typeof KEYS)[number]) {
    if (disabled || !key) return;
    if (key === "del") {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= 4) return;
    onChange(value + key);
  }

  return (
    <div className="space-y-5">
      <div className={cn("flex justify-center gap-3", error && "animate-pulse")}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-3.5 rounded-full border-2 transition-colors duration-150",
              value.length > i ? "border-fg bg-fg" : "border-border bg-transparent",
              error && "border-danger bg-danger",
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key, i) =>
          key === "" ? (
            <span key={`empty-${i}`} />
          ) : (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => press(key)}
              aria-label={key === "del" ? "Borrar" : key}
              className={cn(
                "flex h-16 items-center justify-center rounded-full bg-fill text-[22px] font-medium text-fg",
                "transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-40",
                key === "del" && "text-muted",
              )}
            >
              {key === "del" ? <Delete className="size-6" /> : key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
