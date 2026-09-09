import { cn } from "@/lib/utils";
import { colorHex, parseAnimal } from "@/lib/pos/avatar";

export { ANIMAL_KEYS, AVATAR_COLORS } from "@/lib/pos/avatar";
export type { AnimalKey, AvatarColorKey } from "@/lib/pos/avatar";

export function AnimalMark({ animal, className }: { animal: string; className?: string }) {
  const kind = parseAnimal(animal);
  return (
    <img
      src={`/animals/${kind}.png?v=2`}
      alt=""
      draggable={false}
      className={cn("size-full object-contain", className)}
    />
  );
}

export function AnimalAvatar({
  name,
  animal,
  color,
  size = "md",
}: {
  name: string;
  animal?: string | null;
  color?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const kind = parseAnimal(animal);
  const tint = colorHex(color);
  const dim =
    size === "lg" ? "size-24" : size === "md" ? "size-16" : size === "sm" ? "size-10" : "size-7";
  const pad = size === "lg" ? "p-2.5" : size === "md" ? "p-1.5" : size === "sm" ? "p-1" : "p-0.5";
  return (
    <span
      className={cn("inline-flex items-center justify-center overflow-hidden rounded-full", dim, pad)}
      style={{ backgroundColor: tint }}
      aria-hidden
      title={name}
    >
      <AnimalMark animal={kind} />
    </span>
  );
}
