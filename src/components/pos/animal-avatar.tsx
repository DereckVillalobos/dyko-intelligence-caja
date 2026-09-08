import { cn } from "@/lib/utils";

export const ANIMAL_KEYS = [
  "fox",
  "turtle",
  "sloth",
  "toucan",
  "owl",
  "frog",
  "rabbit",
  "hummingbird",
] as const;

export type AnimalKey = (typeof ANIMAL_KEYS)[number];

export function animalForId(id: number): AnimalKey {
  const index = Math.abs(id - 1) % ANIMAL_KEYS.length;
  return ANIMAL_KEYS[index]!;
}

export function AnimalAvatar({
  id,
  name,
  size = "md",
}: {
  id: number;
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const animal = animalForId(id);
  const dim =
    size === "lg" ? "size-24" : size === "md" ? "size-16" : size === "sm" ? "size-10" : "size-7";
  return (
    <span
      className={cn("inline-flex overflow-hidden rounded-full bg-fg ring-1 ring-border/60", dim)}
      aria-hidden
      title={name}
    >
      <img
        src={`/animals/${animal}.jpg`}
        alt=""
        className="size-full object-cover"
        draggable={false}
      />
    </span>
  );
}
