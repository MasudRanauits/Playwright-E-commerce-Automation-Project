/** Date formatting and arithmetic used by test data and report names. */

/** 2026-09-26 */
export function today(): string {
  return toISODate(new Date());
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Filesystem-safe stamp: 2026-09-26_14-30-05 */
export function timestamp(date: Date = new Date()): string {
  return date.toISOString().replace('T', '_').replace(/:/g, '-').slice(0, 19);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

/** Splits a date into the day / month / year selects on the signup form. */
export function toDateOfBirthParts(date: Date): { day: string; month: string; year: string } {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return {
    day: String(date.getDate()),
    month: months[date.getMonth()],
    year: String(date.getFullYear()),
  };
}
