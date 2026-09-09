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

export function costaRicaYmd(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Monday 00:00 Costa Rica of the week that contains `date`, `weeksAgo` weeks back. */
export function startOfCostaRicaWeekIso(weeksAgo = 0, date = new Date()): string {
  const ymd = costaRicaYmd(date);
  const noon = Date.parse(`${ymd}T12:00:00-06:00`);
  const dow = new Date(noon).getUTCDay();
  const fromMonday = dow === 0 ? 6 : dow - 1;
  const mondayNoon = noon - (fromMonday + weeksAgo * 7) * 86_400_000;
  const mondayYmd = costaRicaYmd(new Date(mondayNoon));
  return `${mondayYmd}T00:00:00-06:00`;
}

export function addDaysIso(isoMidnight: string, days: number): string {
  const t = Date.parse(isoMidnight) + days * 86_400_000;
  return `${costaRicaYmd(new Date(t))}T00:00:00-06:00`;
}

export function weekDayKeys(weekStartIso: string): Array<{ key: string; label: string }> {
  const labels = ["L", "M", "X", "J", "V", "S", "D"];
  return labels.map((label, i) => {
    const iso = addDaysIso(weekStartIso, i);
    return { key: iso.slice(0, 10), label };
  });
}

const CR_WEEK = new Intl.DateTimeFormat("es-CR", {
  timeZone: "America/Costa_Rica",
  day: "numeric",
  month: "short",
});

export function formatWeekRange(weekStartIso: string): string {
  const start = CR_WEEK.format(new Date(`${weekStartIso.slice(0, 10)}T12:00:00-06:00`));
  const end = CR_WEEK.format(new Date(addDaysIso(weekStartIso, 6).replace("T00:00:00-06:00", "T12:00:00-06:00")));
  return `${start} – ${end}`;
}

export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  return `${String(h).padStart(2, "0")}:00`;
}

export function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

