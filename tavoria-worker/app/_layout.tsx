// Root layout. Loads the Tavoria type-system fonts (Hanken Grotesk for body,
// Instrument Serif for headlines, DM Mono for labels/numerals) before
// rendering any screen, and sets Hanken Grotesk as the default <Text> font so
// existing screens that don't specify a font family inherit it automatically.
//
// Phase 1 of the redesign: just the font loading + default font. Phase 2+
// rewrites each screen's typography in detail.

import { Stack } from "expo-router";
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
import { Text, TextInput, View } from "react-native";

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

export default function RootLayout() {
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
  useEffect(() => {
    initI18n().finally(() => setI18nReady(true));
  }, []);

  if (fontsLoaded) applyDefaultFont("HankenGrotesk_400Regular");

  if (!fontsLoaded || !i18nReady) {
    // Splash background matches the new paper colour so the load-flash blends
    // into the first screen instead of going stark white.
    return <View style={{ flex: 1, backgroundColor: "#F7F4EE" }} />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F7F4EE" },
        }}
      />
    </>
  );
}
