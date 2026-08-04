export type ShiftTimeFilter = "all" | "asap" | "today" | "week" | "scheduled";

import { t } from "./i18n";

export function getShiftTimeFilters(): { id: ShiftTimeFilter; label: string }[] {
  return [
    { id: "all", label: t("shift_filters.all") },
    { id: "asap", label: t("shift_filters.asap") },
    { id: "today", label: t("shift_filters.today") },
    { id: "week", label: t("shift_filters.week") },
    { id: "scheduled", label: t("shift_filters.scheduled") },
  ];
}

type ShiftTiming = { start_when?: string; start_date?: string };

export function matchesShiftTime(
  shift: ShiftTiming,
  filter: ShiftTimeFilter,
  now = new Date()
): boolean {
  if (filter === "all") return true;

  const startWhen = (shift.start_when ?? "").toLowerCase();
  const urgent = startWhen === "now" || startWhen === "asap";
  if (filter === "asap") return urgent;
  if (filter === "scheduled") return startWhen === "pickdate" || !!shift.start_date;
  if (urgent) return true;
  if (!shift.start_date) return false;

  const date = new Date(shift.start_date);
  if (Number.isNaN(date.getTime())) return false;

  if (filter === "today") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  const difference = date.getTime() - now.getTime();
  return difference >= -86400 * 1000 && difference <= 7 * 86400 * 1000;
}
