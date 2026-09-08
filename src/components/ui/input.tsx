import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl bg-fill px-3.5 text-[16px] text-fg outline-none",
        "placeholder:text-subtle",
        "focus:ring-2 focus:ring-primary/30",
        className,
      )}
      {...props}
    />
  );
}
