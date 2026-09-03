// Root layout. Loads the Tavoria type-system fonts (Hanken Grotesk for body,
// Instrument Serif for headlines, DM Mono for labels/numerals) before
// rendering any screen, and sets Hanken Grotesk as the default <Text> font so
// existing screens that don't specify a font family inherit it automatically.
//
// Phase 1 of the redesign: just the font loading + default font. Phase 2+
// rewrites each screen's typography in detail.

import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { initI18n } from "../lib/i18n";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from "@expo-google-fonts/instrument-serif";
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from "@expo-google-fonts/dm-mono";
import { ActivityIndicator, AppState, Platform, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";
import AppShell from "../components/AppShell";

// Screens in this list read or change an existing user's private account
// data. Public discovery, QR and onboarding routes intentionally stay open.
const PROTECTED_ROUTES = new Set([
  "applied",
  "candidate",
  "change-pin",
  "post-shift",
  "profile",
  "record",
  "shift-edit",
  "venue-browse-workers",
  "venue-edit",
  "venue-inbox",
  "venue-pro",
  "venue-shifts",
  "worker-applications",
]);

// Every lasting Tavoria account uses a generated username backed by this
// internal email domain. Anonymous Supabase sessions have no such email, so
// they must never unlock a private screen.
function isSignedInTavoriaUser(
  user: { email?: string | null; is_anonymous?: boolean } | null
): boolean {
  return !!user?.email?.endsWith("@gigi.local") && user.is_anonymous !== true;
}

// Mutate the default <Text> / <TextInput> style so every component without an
// explicit fontFamily inherits Hanken Grotesk. Saves migrating every <Text>
// in Phase 1.
let defaultsApplied = false;
function applyDefaultFont(family: string) {
  if (defaultsApplied) return;
  const components: any[] = [Text, TextInput];
  components.forEach((c) => {
    c.defaultProps = c.defaultProps || {};
    c.defaultProps.style = [{ fontFamily: family }, c.defaultProps.style];
  });
  defaultsApplied = true;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Authentication check timed out")),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function LoadingScreen() {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: "#F7F4EE",
        flex: 1,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#0E1A24",
          fontFamily: "InstrumentSerif_400Regular",
          fontSize: 34,
        }}
      >
        Tavoria<Text style={{ color: "#F0531C" }}>.</Text>
      </Text>
      <ActivityIndicator color="#F0531C" size="small" style={{ marginTop: 18 }} />
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  // Bootstrap i18n once for the whole app. Without this in the ROOT layout,
  // deep links / page refreshes that don't land on / would skip initI18n and
  // fall back to English even when the user previously picked Italian.
  const [i18nReady, setI18nReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const currentRoute = segments[0];
  const isProtectedRoute = !!currentRoute && PROTECTED_ROUTES.has(currentRoute);
  useEffect(() => {
    initI18n().finally(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    let active = true;
    let authCheckInFlight = false;

    const refreshAuth = async () => {
      if (authCheckInFlight) return;
      authCheckInFlight = true;
      // getUser() confirms that the locally cached session still belongs to
      // an active Supabase account. getSession() alone can be stale after an
      // account is deleted or credentials change on another device.
      try {
        const {
          data: { user },
          error,
        } = await withTimeout(supabase.auth.getUser(), 8000);
        if (!active) return;
        setIsSignedIn(!error && isSignedInTavoriaUser(user));
      } catch {
        // A suspended tab or a temporary network failure must not leave the
        // full-screen auth gate up forever. Fail closed and let the guard send
        // protected routes back to the public home screen.
        if (active) setIsSignedIn(false);
      } finally {
        authCheckInFlight = false;
        if (active) setAuthReady(true);
      }
    };

    void refreshAuth();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setIsSignedIn(isSignedInTavoriaUser(session?.user ?? null));
      setAuthReady(true);
    });

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshAuth();
    });

    let onVisibilityChange: (() => void) | undefined;
    if (Platform.OS === "web" && typeof document !== "undefined") {
      onVisibilityChange = () => {
        if (document.visibilityState === "visible") void refreshAuth();
      };
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      active = false;
      data.subscription.unsubscribe();
      appStateSubscription.remove();
      if (onVisibilityChange && typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, []);

  useEffect(() => {
    if (
      !rootNavigationState?.key ||
      !authReady ||
      !isProtectedRoute ||
      isSignedIn
    ) {
      return;
    }
    router.replace("/");
  }, [authReady, isProtectedRoute, isSignedIn, rootNavigationState?.key, router]);

  if (fontsLoaded) applyDefaultFont("HankenGrotesk_400Regular");

  if (!fontsLoaded || !i18nReady) {
    // Splash background matches the new paper colour so the load-flash blends
    // into the first screen instead of going stark white.
    return <LoadingScreen />;
  }

  return (
    <AppShell currentRoute={currentRoute} isSignedIn={isSignedIn}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F7F4EE" },
        }}
      />
      {isProtectedRoute && (!authReady || !isSignedIn) ? (
        <View
          pointerEvents="auto"
          style={{
            bottom: 0,
            left: 0,
            position: "absolute",
            right: 0,
            top: 0,
          }}
        >
          <LoadingScreen />
        </View>
      ) : null}
    </AppShell>
  );
}
