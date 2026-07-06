// Position helpers — canonical English IDs in the DB,
// localized labels for display.
//
// Always store the canonical ID (e.g. "Barista", "Cook") in the DB.
// Always display via localizeRole().

import { t } from "./i18n";

export const ROLE_IDS = [
  "Barista",
  "Waiter",
  "Runner",
  "Cashier",
  "Host",
  "Bartender",
  "Cook",
  "Chef",
  "Cleaner",
] as const;

export type RoleId = (typeof ROLE_IDS)[number] | string;

// Map a canonical English position id to a translation key.
function roleKey(role: string): string {
  const lower = role.trim().toLowerCase();
  switch (lower) {
    case "barista":
      return "positions.barista";
    case "waiter":
      return "positions.waiter";
    case "runner":
      return "positions.runner";
    case "cashier":
      return "positions.cashier";
    case "host":
      return "positions.host";
    case "bartender":
      return "positions.bartender";
    case "cook":
      return "positions.cook";
    case "chef":
      return "positions.chef";
    case "cleaner":
      return "positions.cleaner";
    default:
      return "";
  }
}

// Return the localized label for a single role. Falls back to the raw string
// for custom roles (e.g. "Sushi chef") that aren't in the translation map.
export function localizeRole(role?: string | null): string {
  if (!role) return "";
  const key = roleKey(role);
  if (!key) return role; // custom role — show as-is
  const translated = t(key);
  // Guard against i18n returning the key itself (missing translation)
  return translated && !translated.includes(".") ? translated : role;
}

// Localize a whole list, preserving order.
export function localizeRoles(roles?: string[] | null): string[] {
  if (!roles || roles.length === 0) return [];
  return roles.map(localizeRole);
}
