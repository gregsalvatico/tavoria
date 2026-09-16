import { getCurrentLang, t } from "./i18n";

export const CALENDAR_DAY_CODES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function asDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  // Date-only values must be parsed in local time, otherwise they can move one
  // day backward in time zones west of UTC.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return new Date(value);
}

function titleCaseFirst(value: string): string {
  if (!value) return value;
  const first = value.charAt(0);
  return first.toLocaleUpperCase(getCurrentLang()) + value.slice(1);
}

export function formatLocalizedDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
): string {
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return titleCaseFirst(new Intl.DateTimeFormat(getCurrentLang(), options).format(date));
}

export function formatLocalizedMonthYear(value: Date | string): string {
  return formatLocalizedDate(value, { month: "long", year: "numeric" });
}

export function getLocalizedCalendarDays(): string[] {
  return CALENDAR_DAY_CODES.map((code) => t(`shift_detail.days_short.${code}`));
}

