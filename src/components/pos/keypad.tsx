import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"] as const;

type KeypadProps = {
  value: number;
  onChange: (next: number) => void;
  max?: number;
};

export function Keypad({ value, onChange, max = 99_999_999 }: KeypadProps) {
  function press(key: (typeof KEYS)[number]) {
    if (key === "del") {
      onChange(Math.floor(value / 10));
      return;
    }
    const next = Number(`${value}${key}`);
    if (Number.isNaN(next) || next > max) return;
    onChange(next);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => press(key)}
          className={cn(
            "flex h-12 items-center justify-center rounded-2xl bg-fill text-[20px] font-medium text-fg",
            "transition-transform duration-150 ease-out active:scale-[0.96]",
            key === "del" && "text-muted",
          )}
        >
          {key === "del" ? <Delete className="size-6" /> : key}
        </button>
      ))}
    </div>
  );
}
