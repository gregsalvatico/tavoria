import { Feather } from "@expo/vector-icons";
import { PayScheduleId } from "./venueProfile";

export type VenueStyleOption = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  labelKey: string;
  subKey: string;
};

export const VENUE_STYLE_OPTIONS: VenueStyleOption[] = [
  { id: "casual", icon: "droplet", labelKey: "venue_style.casual", subKey: "venue_style.casual_sub" },
  { id: "busy", icon: "zap", labelKey: "venue_style.busy", subKey: "venue_style.busy_sub" },
  { id: "upscale", icon: "star", labelKey: "venue_style.upscale", subKey: "venue_style.upscale_sub" },
  { id: "luxury", icon: "award", labelKey: "venue_style.luxury", subKey: "venue_style.luxury_sub" },
];

export type PayScheduleOption = {
  id: Exclude<PayScheduleId, "custom">;
  icon: keyof typeof Feather.glyphMap;
  labelKey: string;
};

export const PAY_SCHEDULE_OPTIONS: PayScheduleOption[] = [
  { id: "sameday", icon: "zap", labelKey: "pay_schedule.daily" },
  { id: "weekly", icon: "calendar", labelKey: "pay_schedule.weekly" },
  { id: "monthly", icon: "credit-card", labelKey: "pay_schedule.monthly" },
];

export function normalizePaySchedule(value?: string | null): PayScheduleId | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (["sameday", "same day", "daily", "giornaliero", "quotidiano"].includes(normalized)) return "sameday";
  if (["weekly", "settimanale"].includes(normalized)) return "weekly";
  if (["monthly", "mensile"].includes(normalized)) return "monthly";
  return "custom";
}

export function customPayScheduleValue(value?: string | null): string {
  const normalized = normalizePaySchedule(value);
  const trimmed = value?.trim() ?? "";
  return normalized === "custom" && !["other", "custom"].includes(trimmed.toLowerCase()) ? trimmed : "";
}

export function storedPayScheduleValue(schedule: PayScheduleId | null, customValue: string): string | undefined {
  if (!schedule) return undefined;
  return schedule === "custom" ? customValue.trim() || "Other" : schedule;
}
