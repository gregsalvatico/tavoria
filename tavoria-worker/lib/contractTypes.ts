import { t } from "./i18n";

const CONTRACT_KEYS: Record<string, string> = {
  one_off: "one_off", oneoff: "one_off", "one-off": "one_off", "one off": "one_off", "una tantum": "one_off", puntual: "one_off", ponctuel: "one_off", "一次性": "one_off",
  two_days: "two_days", twodays: "two_days", "2 days": "two_days", "2 giorni": "two_days", "2 dias": "two_days", "2 días": "two_days", "2 jours": "two_days", "2天": "two_days",
  part_time: "part_time", pt: "part_time", "part-time": "part_time", "tempo parziale": "part_time", "tiempo parcial": "part_time", "temps partiel": "part_time", "兼职": "part_time",
  full_time: "full_time", ft: "full_time", "full-time": "full_time", "tempo pieno": "full_time", "tiempo completo": "full_time", "temps plein": "full_time", "全职": "full_time",
  seasonal: "seasonal", stagionale: "seasonal", estacional: "seasonal", saisonnier: "seasonal", "季节性": "seasonal",
  custom: "other", other: "other", altro: "other", otro: "other", autre: "other", "其他": "other",
};

export const STANDARD_CONTRACT_TYPES = [
  "one_off",
  "two_days",
  "part_time",
  "full_time",
  "seasonal",
] as const;

// The database column is currently text. Keep single values compatible with
// existing rows, and use a stable separator for the new multi-select value.
const CONTRACT_SEPARATOR = "|";

export function parseContractTypes(value?: string | null): string[] {
  const raw = value?.trim() ?? "";
  if (!raw) return [];

  // Accept JSON arrays as well so rows created by an earlier experiment remain
  // readable if they exist in the database.
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return Array.from(new Set(parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)));
      }
    } catch {
      // Fall through to the delimiter format for malformed legacy values.
    }
  }

  return Array.from(new Set(raw
    .split(CONTRACT_SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean)));
}

export function serializeContractTypes(values: string[], customLabel?: string): string | undefined {
  const normalized = Array.from(new Set(values
    .map((value) => {
      if (value === "custom" || value === "other") return customLabel?.trim() ?? "";
      return value.trim();
    })
    .filter(Boolean)));
  return normalized.length ? normalized.join(CONTRACT_SEPARATOR) : undefined;
}

export function normalizeContractType(value?: string | null): string | null {
  if (!value) return null;
  return CONTRACT_KEYS[value.trim().toLowerCase()] ?? null;
}

export function localizeContractType(value?: string | null) {
  if (!value) return "";
  return parseContractTypes(value)
    .map((item) => {
      const key = normalizeContractType(item);
      return key ? t(`post_shift.${key}`) : item;
    })
    .join(" · ");
}
