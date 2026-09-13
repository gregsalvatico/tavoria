// Simple i18n setup using i18n-js + expo-localization.
// Translations live in /lib/locales/*.ts
// Language is persisted via AsyncStorage and can be changed at runtime.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { useEffect, useState } from "react";

import en from "./locales/en";
import it from "./locales/it";
import fr from "./locales/fr";
import es from "./locales/es";
import zh from "./locales/zh";
import talent from "./locales/talent";

export type Language = "en" | "it" | "fr" | "es" | "zh";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "zh", label: "简体中文", flag: "🇨🇳" },
];

const STORAGE_KEY = "gigi.language";
const languageListeners = new Set<(language: Language) => void>();

export const i18n = new I18n({ en: { ...en, talent: talent.en }, it: { ...it, talent: talent.it }, fr: { ...fr, talent: talent.fr }, es: { ...es, talent: talent.es }, zh: { ...zh, talent: talent.zh } });
i18n.defaultLocale = "en";
i18n.enableFallback = true;
// Never leak i18n-js's internal `[missing "..." value]` diagnostic into the
// product UI. All known interpolated strings pass their values explicitly;
// retaining the original token here also keeps legacy manual replacements safe.
i18n.missingPlaceholder = (_instance, placeholder) => placeholder;

// Bootstrap on app load — pick stored preference, else device locale, else English
export async function initI18n(): Promise<Language> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      i18n.locale = stored;
      notifyLanguageChange(stored as Language);
      return stored as Language;
    }
  } catch {}
  // Fallback to device language if supported, else English
  const device = Localization.getLocales?.()[0]?.languageCode ?? "en";
  const supported = LANGUAGES.find((l) => l.code === device);
  const lang: Language = supported ? (device as Language) : "en";
  i18n.locale = lang;
  notifyLanguageChange(lang);
  return lang;
}

// Change language at runtime and persist
export async function setLanguage(lang: Language): Promise<void> {
  i18n.locale = lang;
  notifyLanguageChange(lang);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {}
}

function notifyLanguageChange(language: Language) {
  languageListeners.forEach((listener) => listener(language));
}

export function subscribeToLanguage(listener: (language: Language) => void) {
  languageListeners.add(listener);
  return () => {
    languageListeners.delete(listener);
  };
}

export function useLanguage(): Language {
  const [language, setLanguageState] = useState<Language>(getCurrentLang);

  useEffect(() => subscribeToLanguage(setLanguageState), []);

  return language;
}

// Short alias — `t("home.title")` etc.
export const t = (key: string, options?: object) => i18n.t(key, options);

// Read the currently active language code (synchronous).
export function getCurrentLang(): Language {
  const loc = i18n.locale;
  const found = LANGUAGES.find((l) => l.code === loc);
  return (found?.code ?? "en") as Language;
}
