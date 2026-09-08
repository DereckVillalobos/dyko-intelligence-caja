import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  colorHex,
  parseAnimal,
  parseColor,
  type AnimalKey,
  type AvatarColorKey,
} from "@/lib/pos/avatar";

export { ANIMAL_KEYS, AVATAR_COLORS } from "@/lib/pos/avatar";
export type { AnimalKey, AvatarColorKey };

const INK = "#1B2437";
const MID = "#9AA3B8";
const SNOW = "#F4F6FA";

function Ink({ d }: { d: string }) {
  return <path fill={INK} d={d} />;
}
function Soft({ d }: { d: string }) {
  return <path fill={MID} d={d} />;
}
function Snow({ d }: { d: string }) {
  return <path fill={SNOW} d={d} />;
}

const MARKS: Record<AnimalKey, ReactNode> = {
  lion: (
    <>
      <circle cx="32" cy="34" r="24" fill={INK} />
      <circle cx="32" cy="36" r="15" fill={MID} />
      <ellipse cx="32" cy="42" rx="7" ry="6" fill={SNOW} />
      <circle cx="26.5" cy="33" r="1.6" fill={INK} />
      <circle cx="37.5" cy="33" r="1.6" fill={INK} />
      <ellipse cx="32" cy="40" rx="2.2" ry="1.6" fill={INK} />
    </>
  ),
  fox: (
    <>
      <Ink d="M14 30 24 6l10 22" />
      <Ink d="M50 30 40 6 30 28" />
      <Soft d="M18 26 24 12l6 14" />
      <Soft d="M46 26 40 12 34 26" />
      <Ink d="M16 32c0-10 7-16 16-16s16 6 16 16v4c0 8-7 18-16 22-9-4-16-14-16-22z" />
      <Soft d="M18 40c2 8 7 14 14 18 7-4 12-10 14-18 0 0-6 6-14 6s-14-6-14-6z" />
      <Snow d="M26 48c2 4 6 8 6 8s4-4 6-8c-2 2-6 3-6 3s-4-1-6-3z" />
      <circle cx="26" cy="38" r="1.7" fill={SNOW} />
      <circle cx="38" cy="38" r="1.7" fill={SNOW} />
      <ellipse cx="32" cy="46" rx="2.4" ry="1.8" fill={INK} />
    </>
  ),
  panda: (
    <>
      <circle cx="32" cy="34" r="20" fill={MID} />
      <circle cx="16" cy="20" r="8" fill={INK} />
      <circle cx="48" cy="20" r="8" fill={INK} />
      <ellipse cx="22" cy="34" rx="7" ry="8" fill={INK} />
      <ellipse cx="42" cy="34" rx="7" ry="8" fill={INK} />
      <circle cx="23" cy="34" r="2.4" fill={SNOW} />
      <circle cx="41" cy="34" r="2.4" fill={SNOW} />
      <circle cx="23.4" cy="34.4" r="1.3" fill={INK} />
      <circle cx="41.4" cy="34.4" r="1.3" fill={INK} />
      <ellipse cx="32" cy="42" rx="2.2" ry="1.6" fill={INK} />
    </>
  ),
  owl: (
    <>
      <Ink d="M18 22 32 8l14 14v26c0 8-6 16-14 16s-14-8-14-16z" />
      <Soft d="M24 36c2 12 5 18 8 20 3-2 6-8 8-20z" />
      <circle cx="24" cy="30" r="8.5" fill={SNOW} />
      <circle cx="40" cy="30" r="8.5" fill={SNOW} />
      <circle cx="24" cy="31" r="3.4" fill={INK} />
      <circle cx="40" cy="31" r="3.4" fill={INK} />
      <circle cx="25.2" cy="29.8" r="1.1" fill={SNOW} />
      <circle cx="41.2" cy="29.8" r="1.1" fill={SNOW} />
      <Soft d="M22 56h6v6h-6zm14 0h6v6h-6z" />
      <Ink d="M30 36h4l-2 5z" />
    </>
  ),
  elephant: (
    <>
      <Ink d="M18 28h28v24c0 4-4 8-10 8H28c-6 0-10-4-10-8z" />
      <Soft d="M14 22c0-8 8-14 18-14s16 4 18 12c4 0 8 4 8 8 0 6-6 8-10 8H26c-8 0-12-6-12-14z" />
      <Soft d="M36 36c8 4 10 14 8 22h-8c2-6 2-12-2-16z" />
      <circle cx="26" cy="28" r="2" fill={INK} />
      <circle cx="38" cy="28" r="2" fill={INK} />
    </>
  ),
  rabbit: (
    <>
      <Soft d="M22 8c-2 0-6 4-6 14 0 8 4 16 8 18 2-8 4-18 2-26-1.2-4-3.2-6-4-6z" />
      <Soft d="M42 8c2 0 6 4 6 14 0 8-4 16-8 18-2-8-4-18-2-26 1.2-4 3.2-6 4-6z" />
      <ellipse cx="32" cy="42" rx="16" ry="18" fill={MID} />
      <circle cx="26" cy="40" r="1.8" fill={INK} />
      <circle cx="38" cy="40" r="1.8" fill={INK} />
      <ellipse cx="32" cy="46" rx="2" ry="1.5" fill={INK} />
      <circle cx="27" cy="48" r="2.2" fill="#E7A6B4" opacity="0.7" />
      <circle cx="37" cy="48" r="2.2" fill="#E7A6B4" opacity="0.7" />
    </>
  ),
  bear: (
    <>
      <circle cx="16" cy="20" r="10" fill={INK} />
      <circle cx="48" cy="20" r="10" fill={INK} />
      <circle cx="32" cy="36" r="20" fill={INK} />
      <ellipse cx="32" cy="42" rx="10" ry="8" fill={MID} />
      <circle cx="25" cy="32" r="2" fill={SNOW} />
      <circle cx="39" cy="32" r="2" fill={SNOW} />
      <ellipse cx="32" cy="40" rx="2.4" ry="1.8" fill={INK} />
    </>
  ),
  cat: (
    <>
      <Soft d="M12 22 24 8l8 16" />
      <Soft d="M52 22 40 8 32 24" />
      <circle cx="32" cy="38" r="18" fill={MID} />
      <circle cx="25" cy="36" r="1.8" fill={INK} />
      <circle cx="39" cy="36" r="1.8" fill={INK} />
      <Ink d="M32 41 29 45h6z" />
      <path d="M29 47c2 2 4 2 6 0" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  giraffe: (
    <>
      <Soft d="M18 28c0-10 6-18 14-18s14 8 14 18v8c0 10-6 22-14 22s-14-12-14-22z" />
      <Ink d="M22 48c2 8 6 14 10 14s8-6 10-14c-4 4-10 6-10 6s-6-2-10-6z" />
      <circle cx="26" cy="32" r="1.8" fill={INK} />
      <circle cx="38" cy="32" r="1.8" fill={INK} />
      <Soft d="M24 10h4v10h-4zm12 0h4v10h-4z" />
      <circle cx="26" cy="8" r="3.2" fill={INK} />
      <circle cx="38" cy="8" r="3.2" fill={INK} />
      <Soft d="M16 24h8v6h-8zm24 0h8v6h-8z" />
    </>
  ),
};

export function AnimalMark({ animal }: { animal: AnimalKey }) {
  return (
    <svg viewBox="0 0 64 64" className="size-full" aria-hidden>
      {MARKS[animal]}
    </svg>
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
  const pad = size === "lg" ? "p-2" : size === "md" ? "p-1.5" : "p-1";
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
