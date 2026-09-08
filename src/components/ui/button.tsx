import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[transform,opacity,background-color] duration-150 ease-out select-none disabled:pointer-events-none disabled:opacity-40 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:opacity-90",
        secondary: "bg-fill text-fg hover:bg-border",
        ghost: "bg-transparent text-primary hover:bg-fill",
        danger: "bg-danger text-primary-fg hover:opacity-90",
        success: "bg-success text-primary-fg hover:opacity-90",
      },
      size: {
        sm: "h-9 rounded-lg px-3 text-sm",
        md: "h-11 rounded-xl px-4 text-[15px]",
        lg: "h-14 rounded-2xl px-5 text-[17px]",
        icon: "size-11 rounded-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
