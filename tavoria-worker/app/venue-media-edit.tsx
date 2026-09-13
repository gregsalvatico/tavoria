import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StickyFooter from "../components/StickyFooter";
import ActionButton from "../components/ActionButton";
import { updateShift, uploadVenueShiftMedia } from "../lib/db";
import { t } from "../lib/i18n";
import { pickImageWeb, pickVideoWeb } from "../lib/webMedia";
import { supabase } from "../lib/supabase";
import { TAVORIA } from "../lib/designTokens";

const LIMITS = { photo: 5, video: 3 } as const;
type Kind = keyof typeof LIMITS;

export default function VenueMediaEdit() {
  const router = useRouter();
  const { id, kind: rawKind } = useLocalSearchParams<{ id?: string; kind?: string }>();
  const kind: Kind = rawKind === "video" ? "video" : "photo";
  const [row, setRow] = useState<{ photo_urls?: (string | null)[]; video_urls?: (string | null)[] } | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    if (!id) return;
    setError("");
    const { data, error: loadError } = await supabase
      .from("shifts")
      .select("photo_urls, video_urls")
      .eq("id", id)
      .single();
    if (loadError) {
      setError(loadError.message.includes("schema cache")
        ? "Venue media needs the latest database migration. Apply 20260912083615_venue_media.sql in Supabase, then retry."
        : loadError.message);
      return;
    }
    setRow(data);
  };

  useEffect(() => { void load(); }, [id]);

  const slots = useMemo(() => {
    const urls = row?.[`${kind}_urls`] ?? [];
    return Array.from({ length: LIMITS[kind] }, (_, index) => urls[index] ?? null);
  }, [kind, row]);
  const nextSlot = slots.findIndex((url) => !url);

  const pick = async (slot: number) => {
    if (!id) return;
    setError("");
    setBusy(slot);
    try {
      const result = Platform.OS === "web"
        ? kind === "photo" ? await pickImageWeb({ camera: false }) : await pickVideoWeb({ camera: false })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: [kind === "photo" ? "images" : "videos"],
            quality: 0.8,
          });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const url = await uploadVenueShiftMedia(id, kind, asset.uri, (asset as any).mimeType);
      const urls = [...slots];
      urls[slot] = url;
      await updateShift(id, { [`${kind}_urls`]: urls });
      setRow((current) => ({ ...(current ?? {}), [`${kind}_urls`]: urls }));
    } catch (e: any) {
      setError(e?.message ?? t("talent.uploadError"));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (slot: number) => {
    if (!id) return;
    setBusy(slot);
    setError("");
    try {
      const urls = [...slots];
      urls[slot] = null;
      await updateShift(id, { [`${kind}_urls`]: urls });
      setRow((current) => ({ ...(current ?? {}), [`${kind}_urls`]: urls }));
    } catch (e: any) {
      setError(e?.message ?? t("talent.uploadError"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        <Pressable accessibilityLabel={t("talent.close")} onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={20} color="#0E1A24" />
        </Pressable>
        <Text style={styles.title}>{t(`talent.${kind === "photo" ? "photos" : "videos"}`)}</Text>
        <Text style={styles.intro}>
          {kind === "photo" ? t("talent.venuePhotoIntro") : t("talent.venueVideoIntro")}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!row && !error ? <ActivityIndicator color="#F0531C" style={styles.loading} /> : null}
        {row ? (
          <View style={styles.grid}>
            {slots.map((url, index) => url ? (
              <View key={`${url}-${index}`} style={styles.item}>
                <View style={styles.preview}>
                  {kind === "photo" ? <Image source={{ uri: url }} style={styles.image} /> : <Feather name="video" size={28} color="#F0531C" />}
                </View>
                <View style={styles.itemActions}>
                  <Pressable disabled={busy !== null} onPress={() => void pick(index)} style={styles.secondary}>
                    <Text style={styles.secondaryText}>{t("talent.replace")}</Text>
                    {busy === index ? <ActivityIndicator size="small" color="#F0531C" /> : null}
                  </Pressable>
                  <Pressable disabled={busy !== null} accessibilityLabel={t("talent.remove")} onPress={() => void remove(index)} style={styles.delete}>
                    <Feather name="trash-2" size={16} color="#626B78" />
                  </Pressable>
                </View>
              </View>
            ) : null)}
            {nextSlot >= 0 ? (
              <Pressable disabled={busy !== null} onPress={() => void pick(nextSlot)} style={styles.add}>
                <Feather name="plus" size={20} color="#F0531C" />
                <Text style={styles.addText}>{t("talent.add")}</Text>
                {busy === nextSlot ? <ActivityIndicator size="small" color="#F0531C" /> : null}
              </Pressable>
            ) : null}
          </View>
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
  title: { color: TAVORIA.color.navy, fontFamily: "InstrumentSerif_400Regular", fontSize: 29 },
  intro: { color: TAVORIA.color.muted, fontSize: 14, lineHeight: 21, marginBottom: 22, marginTop: 6 },
  error: { color: "#993556", fontSize: 14, lineHeight: 21, marginBottom: 16 },
  loading: { marginTop: 36 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  item: { width: 210, maxWidth: "100%", gap: 10 },
  preview: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, height: 170, justifyContent: "center", overflow: "hidden" },
  image: { height: "100%", width: "100%" },
  itemActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  secondary: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.small, borderWidth: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 40, paddingHorizontal: 13 },
  secondaryText: { color: TAVORIA.color.navy, fontSize: 13, fontWeight: "700" },
  delete: { alignItems: "center", height: 36, justifyContent: "center", width: 36 },
  add: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.medium, borderWidth: 1, gap: 7, height: 170, justifyContent: "center", paddingHorizontal: 20, width: 210 },
  addText: { color: TAVORIA.color.navy, fontSize: 13, fontWeight: "700" },
});
