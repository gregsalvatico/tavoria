import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import ActionButton from "../components/ActionButton";
import StickyFooter from "../components/StickyFooter";
import { getCurrentVenueRow, updateVenue, uploadVenueMedia } from "../lib/db";
import { t } from "../lib/i18n";
import { pickImageWeb } from "../lib/webMedia";
import { TAVORIA } from "../lib/designTokens";

export default function VenueAvatarEdit() {
  const router = useRouter();
  const [venue, setVenue] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentVenueRow()
      .then((row) => {
        if (!row) throw new Error(t("talent.loadError"));
        setVenue(row);
      })
      .catch((e: any) => setError(e?.message ?? t("talent.loadError")));
  }, []);

  const replaceAvatar = async () => {
    if (!venue?.id || busyRef.current) return;
    setError("");
    busyRef.current = true;
    setBusy(true);
    try {
      const result = Platform.OS === "web"
        ? await pickImageWeb({ camera: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] as any, quality: 0.8 });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const previousPrimary = venue.photo_url ?? venue.photo_urls?.find(Boolean) ?? null;
      const url = await uploadVenueMedia(venue.id, "photo", asset.uri, (asset as any).mimeType);
      const additionalPhotos = (venue.photo_urls ?? []).map((photo: string | null) => photo === previousPrimary ? null : photo);
      await updateVenue(venue.id, { photo_url: url, photo_urls: additionalPhotos });
      setVenue((current: any) => ({ ...(current ?? {}), photo_url: url, photo_urls: additionalPhotos }));
    } catch (e: any) {
      setError(e?.message ?? t("talent.uploadError"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const primaryPhoto = venue?.photo_url ?? venue?.photo_urls?.find(Boolean) ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityLabel={t("talent.close")} onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={20} color={TAVORIA.color.navy} />
        </Pressable>
        <Text style={styles.title}>{t("talent.profilePhoto")}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!venue && !error ? <ActivityIndicator color={TAVORIA.color.orange} style={styles.loading} /> : null}
        {venue ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t("talent.replace")} disabled={busy} onPress={() => void replaceAvatar()} style={styles.avatarCard}>
            {primaryPhoto ? <Image source={{ uri: primaryPhoto }} style={styles.avatar} resizeMode="cover" /> : <Feather name="camera" size={24} color={TAVORIA.color.muted} />}
            <Text style={styles.replace}>{primaryPhoto ? t("talent.replace") : t("talent.add")}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <StickyFooter desktopRow>
        <ActionButton label={t("common.done")} icon="check" onPress={() => router.back()} />
      </StickyFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: TAVORIA.color.paperDeep, flex: 1 },
  content: { alignSelf: "center", gap: 14, maxWidth: 840, paddingBottom: 32, paddingHorizontal: 24, paddingTop: 18, width: "100%" },
  back: { alignSelf: "flex-start", paddingVertical: 8 },
  title: { color: TAVORIA.color.navy, fontFamily: "InstrumentSerif_400Regular", fontSize: 29 },
  error: { color: TAVORIA.color.error, fontSize: 14, lineHeight: 21 },
  loading: { marginTop: 36 },
  avatarCard: { alignItems: "center", alignSelf: "flex-start", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.medium, borderWidth: 1, gap: 8, minHeight: 170, overflow: "hidden", paddingBottom: 10, width: 170 },
  avatar: { aspectRatio: 1, width: "100%" },
  replace: { color: TAVORIA.color.navy, fontSize: 12, fontWeight: "700" },
});
