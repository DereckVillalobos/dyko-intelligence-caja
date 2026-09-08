export const ANIMAL_KEYS = [
  "lion",
  "fox",
  "panda",
  "owl",
  "elephant",
  "rabbit",
  "bear",
  "cat",
  "giraffe",
] as const;

export type AnimalKey = (typeof ANIMAL_KEYS)[number];

export const AVATAR_COLORS = [
  { key: "peach", hex: "#FFD4C4", label: "Durazno" },
  { key: "butter", hex: "#FFE59A", label: "Mantequilla" },
  { key: "mint", hex: "#C4F0D6", label: "Menta" },
  { key: "sky", hex: "#C5E3FF", label: "Cielo" },
  { key: "lilac", hex: "#DDD0FF", label: "Lila" },
  { key: "rose", hex: "#FFD0E3", label: "Rosa" },
  { key: "cream", hex: "#F3E4D0", label: "Crema" },
  { key: "sage", hex: "#D5E8B8", label: "Salvia" },
] as const;

export type AvatarColorKey = (typeof AVATAR_COLORS)[number]["key"];

export function isAnimalKey(value: string | null | undefined): value is AnimalKey {
  return Boolean(value && (ANIMAL_KEYS as readonly string[]).includes(value));
}

export function isAvatarColor(value: string | null | undefined): value is AvatarColorKey {
  return Boolean(value && AVATAR_COLORS.some((c) => c.key === value));
}

export function parseAnimal(value: string | null | undefined): AnimalKey {
  return isAnimalKey(value) ? value : "fox";
}

export function parseColor(value: string | null | undefined): AvatarColorKey {
  return isAvatarColor(value) ? value : "peach";
}

export function colorHex(key: string | null | undefined): string {
  const found = AVATAR_COLORS.find((c) => c.key === parseColor(key));
  return found?.hex ?? "#FFD4C4";
}
