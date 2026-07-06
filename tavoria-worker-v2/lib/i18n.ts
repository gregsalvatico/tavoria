// Simple i18n setup using i18n-js + expo-localization.
// Translations live in /lib/locales/*.ts
// Language is persisted via AsyncStorage and can be changed at runtime.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

import en from "./locales/en";
import it from "./locales/it";
import fr from "./locales/fr";
import es from "./locales/es";
import zh from "./locales/zh";

export type Language = "en" | "it" | "fr" | "es" | "zh";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "zh", label: "简体中文", flag: "🇨🇳" },
];

const STORAGE_KEY = "gigi.language";

export const i18n = new I18n({ en, it, fr, es, zh });
i18n.defaultLocale = "en";
i18n.enableFallback = true;

// Bootstrap on app load — pick stored preference, else device locale, else English
export async function initI18n(): Promise<Language> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      i18n.locale = stored;
      return stored as Language;
    }
  } catch {}
  // Fallback to device language if supported, else English
  const device = Localization.getLocales?.()[0]?.languageCode ?? "en";
  const supported = LANGUAGES.find((l) => l.code === device);
  const lang: Language = supported ? (device as Language) : "en";
  i18n.locale = lang;
  return lang;
}

// Change language at runtime and persist
export async function setLanguage(lang: Language): Promise<void> {
  i18n.locale = lang;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {}
}

// Short alias — `t("home.title")` etc.
export const t = (key: string, options?: object) => i18n.t(key, options);

// Read the currently active language code (synchronous).
export function getCurrentLang(): Language {
  const loc = i18n.locale;
  const found = LANGUAGES.find((l) => l.code === loc);
  return (found?.code ?? "en") as Language;
}
