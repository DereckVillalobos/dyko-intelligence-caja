const CRC = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});

const CR_TIME = new Intl.DateTimeFormat("es-CR", {
  timeZone: "America/Costa_Rica",
  hour: "2-digit",
  minute: "2-digit",
});

const CR_DATE = new Intl.DateTimeFormat("es-CR", {
  timeZone: "America/Costa_Rica",
  day: "2-digit",
  month: "short",
});

const CR_FULL = new Intl.DateTimeFormat("es-CR", {
  timeZone: "America/Costa_Rica",
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatColones(amount: number): string {
  return CRC.format(Math.round(amount));
}

export function formatTime(iso: string): string {
  return CR_TIME.format(new Date(iso));
}

export function formatDay(iso: string): string {
  return CR_DATE.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return CR_FULL.format(new Date(iso));
}

export function startOfCostaRicaDayIso(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `${parts}T00:00:00-06:00`;
}

export function costaRicaStamp(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "");
}
