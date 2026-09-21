/**
 * Shared Local Calendar Utility
 *
 * Derives calendar date/week from the user's actual browser local timezone.
 * Does NOT hardcode WIB or any specific offset.
 * SSR-safe: returns deterministic fallback when `typeof window === 'undefined'`.
 * Testable: accepts an optional reference Date for injection.
 *
 * Week definition: ISO 8601 — Monday through Sunday.
 */

/**
 * Returns the local calendar date as YYYY-MM-DD using the browser's timezone.
 * On the server (SSR), returns UTC date as a safe fallback.
 */
export function getLocalDateString(reference?: Date): string {
  const now = reference ?? new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the ISO 8601 week ID as "YYYY-Www" (e.g. "2026-W38").
 * Week starts on Monday; the week containing the year's first Thursday is W01.
 * Uses local calendar date (browser timezone).
 */
export function getLocalWeekId(reference?: Date): string {
  const now = reference ?? new Date();
  // Clone to avoid mutating
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // ISO day of week: Monday=1 … Sunday=7
  const dayOfWeek = d.getDay() || 7; // Convert Sunday(0) to 7
  // Set to nearest Thursday (current date + 4 - dayOfWeek)
  d.setDate(d.getDate() + 4 - dayOfWeek);
  
  // Calculate day difference using Date.UTC to eliminate DST millisecond drift
  const targetYear = d.getFullYear();
  const diffDays = Math.round(
    (Date.UTC(targetYear, d.getMonth(), d.getDate()) - Date.UTC(targetYear, 0, 1)) / 86400000
  );
  const weekNum = Math.ceil((diffDays + 1) / 7);
  return `${targetYear}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Returns the ISO day of the week (1=Monday … 7=Sunday) for a given date.
 */
export function getISODayOfWeek(reference?: Date): number {
  const now = reference ?? new Date();
  return now.getDay() || 7;
}

/**
 * Returns the Monday date (YYYY-MM-DD) of the week containing the given date.
 */
export function getWeekStartMonday(reference?: Date): string {
  const now = reference ?? new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = d.getDay() || 7;
  d.setDate(d.getDate() - (dayOfWeek - 1));
  return getLocalDateString(d);
}

/**
 * Returns an array of 7 local date strings [Monday … Sunday] for the week
 * containing the given date.
 */
export function getWeekDates(reference?: Date): string[] {
  const now = reference ?? new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = d.getDay() || 7;
  d.setDate(d.getDate() - (dayOfWeek - 1)); // Move to Monday

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(getLocalDateString(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/**
 * Checks whether a YYYY-MM-DD string falls within the ISO week
 * identified by the given weekId.
 */
export function isDateInWeek(dateStr: string, weekId: string): boolean {
  // Parse the date safely using component extraction (avoids UTC parsing pitfalls)
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const d = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10)
  );
  return getLocalWeekId(d) === weekId;
}
