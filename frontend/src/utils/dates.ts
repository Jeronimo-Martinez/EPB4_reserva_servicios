// Instants come from the backend in UTC; the app always shows them in the business zone (Bogotá).
export const TZ = 'America/Bogota';

const clockFmt = new Intl.DateTimeFormat('es-CO', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });

/** "HH:mm" in Bogotá for an instant. */
export function hhmm(instant: string) {
  const parts = Object.fromEntries(clockFmt.formatToParts(new Date(instant)).map((p) => [p.type, p.value]));
  return `${parts.hour}:${parts.minute}`;
}

/** "YYYY-MM-DD" in Bogotá for an instant. */
export const dayKey = (instant: string | number) => dayKeyFmt.format(new Date(instant));

// Calendar dates travel as "YYYY-MM-DD"; doing the math in UTC keeps the browser zone from shifting days.
export const toDate = (day: string) => new Date(`${day}T00:00:00Z`);

export function shift(day: string, days: number, months = 0) {
  const d = toDate(day);
  if (months) {
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + months);
  }
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const fmt = (day: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', ...options }).format(toDate(day));

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Jueves, 24 de julio de 2025". */
export const longDate = (day: string) =>
  capitalize(fmt(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

/** "$45.000" (pesos colombianos, sin decimales). */
export const cop = (value: number) => `$${value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
