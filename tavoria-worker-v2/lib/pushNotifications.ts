// Push notifications — request OS permission, fetch the Expo push token,
// persist it to the current user's workers/venues row alongside the active
// app language.
//
// Notes:
//   * Push notifications DO NOT work in Expo Go on SDK 53+. They will work
//     fine in a development build (`eas build --profile development`) and
//     in the App-Store/Play-Store production build. registerPush() guards
//     against this so it never throws in Expo Go.
//   * registerPush() is idempotent — call it on every signup, sign-in, and
//     app launch. If the token already matches what's in the DB it's a no-op.

import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { supabase } from "./supabase";
import { getCurrentLang } from "./i18n";

type Role = "worker" | "venue";

const TABLES: Record<Role, "workers" | "venues"> = {
  worker: "workers",
  venue: "venues",
};

/**
 * Ask the user for notification permission and return the resulting Expo
 * push token, or null if we couldn't get one (permission denied, simulator,
 * Expo Go on SDK 53+, etc.).
 */
async function fetchExpoPushToken(): Promise<string | null> {
  // Web does not support Expo push notifications — silently skip.
  if (Platform.OS === "web") {
    return null;
  }
  // Expo Go on SDK 53+ cannot receive push notifications.
  if (Constants.appOwnership === "expo") {
    console.log("[push] running in Expo Go — push tokens unavailable");
    return null;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") {
      console.log("[push] permission denied");
      return null;
    }

    // Set up an Android channel (no-op on iOS)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Tavoria",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#F0531C",
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants.easConfig as { projectId?: string } | undefined)?.projectId;
    if (!projectId) {
      console.warn("[push] no EAS projectId in app.json — cannot fetch token");
      return null;
    }

    const tokenResp = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResp.data ?? null;
  } catch (e) {
    console.warn("[push] fetchExpoPushToken failed:", e);
    return null;
  }
}

/**
 * Register the current user for push notifications. Saves the token + the
 * active language onto their row so the Edge Function can target them.
 *
 * Pass `role` so we know which table to update.
 *
 * For venues, pass `venueId` so we patch a specific venue row. For workers
 * we always patch the row keyed on user_id.
 */
export async function registerPush(opts: {
  role: Role;
  venueId?: string;
}): Promise<void> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session?.user.id) return;

  const token = await fetchExpoPushToken();
  if (!token) return; // silent — already logged inside

  const language = getCurrentLang();

  try {
    if (opts.role === "worker") {
      await supabase
        .from(TABLES.worker)
        .update({ push_token: token, language })
        .eq("user_id", session.user.id);
    } else {
      // Venue: prefer the venueId you just created/loaded; fall back to
      // matching on user_id if not supplied.
      if (opts.venueId) {
        await supabase
          .from(TABLES.venue)
          .update({ push_token: token, language })
          .eq("id", opts.venueId);
      } else {
        await supabase
          .from(TABLES.venue)
          .update({ push_token: token, language })
          .eq("user_id", session.user.id);
      }
    }
  } catch (e) {
    console.warn("[push] saving token to DB failed:", e);
  }
}
