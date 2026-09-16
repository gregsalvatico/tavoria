import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StickyFooter from "../components/StickyFooter";
import ActionButton from "../components/ActionButton";
import { getCurrentVenueRow } from "../lib/db";
import { t } from "../lib/i18n";
import { TAVORIA } from "../lib/designTokens";
import VenueMediaEditor, { type VenueMediaData } from "../components/VenueMediaEditor";

export default function VenueProfileMedia() {
  const router = useRouter();
  const [venue, setVenue] = useState<any>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const row = await getCurrentVenueRow();
      if (!row) throw new Error(t("talent.loadError"));
      setVenue(row);
    } catch (e: any) {
      setError(e?.message ?? t("talent.loadError"));
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        <Pressable accessibilityLabel={t("talent.close")} onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={20} color="#0E1A24" />
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!venue && !error ? <ActivityIndicator color="#F0531C" style={styles.loading} /> : null}
        {venue ? (
          <VenueMediaEditor
            venue={venue as VenueMediaData}
            onVenueChange={(patch) => setVenue((current: any) => ({ ...(current ?? {}), ...patch }))}
          />
        ) : null}
      </ScrollView>
      <StickyFooter desktopRow>
        <ActionButton label={t("common.done")} icon="check" onPress={() => router.back()} />
      </StickyFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TAVORIA.color.paperDeep },
  content: { alignSelf: "center", maxWidth: 840, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32, width: "100%" },
  back: { alignSelf: "flex-start", marginBottom: 8, paddingVertical: 8 },
  error: { color: "#993556", fontSize: 14, lineHeight: 21, marginBottom: 16 },
  loading: { marginTop: 36 },
});
