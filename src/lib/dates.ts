/**
 * Date utility helpers.
 * All dates are computed in the user's local timezone.
 * "Day number" = integer days since Unix epoch (UTC midnight),
 * used as the compact storage format for dates.
 */

const MS_PER_DAY = 86_400_000;

/** Convert a Date to an integer day number (days since epoch, local date components). */
export function dateToDayNum(d: Date): number {
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const utcMs = Date.UTC(year, month, day);
  return Math.floor(utcMs / MS_PER_DAY);
}

/** Convert an integer day number back to a Date at local midnight. */
export function dayNumToDate(n: number): Date {
  const utcMs = n * MS_PER_DAY;
  const d = new Date(utcMs);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Today's day number. */
export function todayDayNum(): number {
  return dateToDayNum(new Date());
}

/** Format date as "Oct 26" or "Oct 26, 2026" (with year if not current year). */
export function formatShortDate(d: Date, alwaysYear = false): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const thisYear = new Date().getFullYear();
  if (alwaysYear || year !== thisYear) {
    return `${month} ${day}, ${year}`;
  }
  return `${month} ${day}`;
}

/** Format a date range label, e.g. "Oct 26 – Nov 1, 2026". */
export function formatDateRange(start: Date, end: Date): string {
  const sameYear = start.getFullYear() === end.getFullYear();
  const currentYear = new Date().getFullYear();
  if (sameYear && start.getFullYear() === currentYear) {
    return `${formatShortDate(start)} – ${formatShortDate(end)}`;
  }
  if (sameYear) {
    return `${formatShortDate(start)} – ${formatShortDate(end, true)}`;
  }
  return `${formatShortDate(start, true)} – ${formatShortDate(end, true)}`;
}

/** Weekday names. */
const WEEKDAYS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getWeekdayNames(startMonday: boolean): string[] {
  return startMonday ? WEEKDAYS_MON : WEEKDAYS_SUN;
}

const WEEKDAYS_FULL_MON = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const WEEKDAYS_FULL_SUN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function getWeekdayFullNames(startMonday: boolean): string[] {
  return startMonday ? WEEKDAYS_FULL_MON : WEEKDAYS_FULL_SUN;
}

/**
 * Get the start of the week containing `date`.
 * startMonday=true → Monday; false → Sunday.
 */
export function getWeekStart(date: Date, startMonday: boolean): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Sun
  const diff = startMonday ? (day === 0 ? -6 : 1 - day) : -day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Get an array of 7 Dates for the week starting from `weekStart`. */
export function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }
  return days;
}

/** Add `n` days to a date. */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** The month name + year, e.g. "October 2026". */
export function formatMonthYear(d: Date): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Get first day of the month. */
export function getMonthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Get last day of the month. */
export function getMonthEnd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** Get the number of days in a month. */
export function getDaysInMonth(d: Date): number {
  return getMonthEnd(d).getDate();
}

/** Check if two dates are the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Clamp a day number between min and max (inclusive). */
export function clampDayNum(day: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, day));
}

/**
 * "YYYY-MM-DD" string from a Date (for <input type="date">).
 */
export function toInputDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse "YYYY-MM-DD" to a Date (local). */
export function parseInputDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Distribute `count` items evenly across a date range [startDay, endDay], returning day numbers. */
export function distributeAcrossRange(startDay: number, endDay: number, count: number): number[] {
  if (count <= 0) return [];
  const span = endDay - startDay;
  if (count === 1) return [startDay];
  const step = span / (count - 1);
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(startDay + Math.round(step * i));
  }
  return result;
}
