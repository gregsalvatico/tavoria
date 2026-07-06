// Pro-eligibility gate: only show Pro upsells / lock icons once the user has
// been signed in for at least 7 days. New users in their first week should not
// see anything locked behind a paywall — it feels cheap and distrust-inducing
// before they've even built a profile.
//
// We use an AsyncStorage flag `tavoria.first_seen` written on first auth.
// The flag is read synchronously via a tiny in-memory cache hydrated by
// initProEligibility() (called once from app startup).

import AsyncStorage from "@react-native-async-storage/async-storage";

const FIRST_SEEN_KEY = "tavoria.first_seen";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Cached first-seen timestamp (ms since epoch). null = not initialised yet,
// 0 = no flag stored (treat user as brand new in this session).
let firstSeenMs: number | null = null;

// Hydrate the cache and stamp the flag if it's the user's first visit.
// Safe to call multiple times.
export async function initProEligibility(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(FIRST_SEEN_KEY);
    if (stored) {
      const n = Number(stored);
      firstSeenMs = Number.isFinite(n) ? n : Date.now();
      return;
    }
    const now = Date.now();
    await AsyncStorage.setItem(FIRST_SEEN_KEY, String(now));
    firstSeenMs = now;
  } catch {
    // Fallback: pretend the user was just seen — so they DON'T see Pro locks.
    firstSeenMs = Date.now();
  }
}

// Synchronous check used in render. Returns true only if we know the user
// has been around for ≥7 days. If the cache hasn't been hydrated yet, returns
// false (i.e. err on the side of HIDING the Pro UI).
export function isProEligible(): boolean {
  if (firstSeenMs == null) return false;
  return Date.now() - firstSeenMs > SEVEN_DAYS_MS;
}
