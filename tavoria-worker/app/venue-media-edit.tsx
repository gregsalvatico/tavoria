import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StickyFooter from "../components/StickyFooter";
import ActionButton from "../components/ActionButton";
import MixedMediaSlotGrid, { type EditableMediaItem } from "../components/MixedMediaSlotGrid";
import { updateShift, uploadVenueShiftMedia } from "../lib/db";
import { t } from "../lib/i18n";
import { pickMediaWeb } from "../lib/webMedia";
import { supabase } from "../lib/supabase";
import { TAVORIA } from "../lib/designTokens";
import { uniqueMediaItems, type MediaKind } from "../components/mediaTypes";

const LIMITS = { photo: 5, video: 3 } as const;

function mediaKindFromAsset(asset: { type?: string; mimeType?: string }): MediaKind {
  return asset.type === "video" || asset.mimeType?.startsWith("video/") ? "video" : "photo";
}

function mediaItems(row: { photo_urls?: (string | null)[]; video_urls?: (string | null)[] }): EditableMediaItem[] {
  const photos = Array.from({ length: LIMITS.photo }, (_, slot) => row.photo_urls?.[slot] ?? null);
  const videos = Array.from({ length: LIMITS.video }, (_, slot) => row.video_urls?.[slot] ?? null);
  return uniqueMediaItems([
    ...photos.flatMap((url, slot) => url ? [{ url, kind: "photo" as const, slot }] : []),
    ...videos.flatMap((url, slot) => url ? [{ url, kind: "video" as const, slot }] : []),
  ]);
}

function nextAvailableSlot(items: EditableMediaItem[], kind: MediaKind) {
  const used = new Set(items.filter((item) => item.kind === kind).map((item) => item.slot));
  return Array.from({ length: LIMITS[kind] }, (_, slot) => slot).find((slot) => !used.has(slot));
}

export default function VenueMediaEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [row, setRow] = useState<{ photo_urls?: (string | null)[]; video_urls?: (string | null)[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
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

  const items = useMemo(() => row ? mediaItems(row) : [], [row]);

  const persist = async (nextItems: EditableMediaItem[]) => {
    if (!id) return;
    const photos = Array.from({ length: LIMITS.photo }, () => null as string | null);
    const videos = Array.from({ length: LIMITS.video }, () => null as string | null);
    uniqueMediaItems(nextItems).forEach((item) => {
      if (item.kind === "photo") photos[item.slot] = item.url;
      else videos[item.slot] = item.url;
    });
    await updateShift(id, { photo_urls: photos, video_urls: videos });
    setRow({ photo_urls: photos, video_urls: videos });
  };

  const pick = async (index?: number) => {
    if (!id || (index === undefined && items.length >= LIMITS.photo + LIMITS.video) || busyRef.current) return;
    setError("");
    busyRef.current = true;
    setBusy(true);
    try {
      const result = Platform.OS === "web"
        ? await pickMediaWeb({ camera: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"] as any, quality: 0.8 });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const kind = mediaKindFromAsset(asset as any);
      const current = [...items];
      const currentItem = index === undefined ? undefined : current[index];
      const targetSlot = currentItem?.kind === kind
        ? currentItem.slot
        : nextAvailableSlot(index === undefined ? current : current.filter((_, itemIndex) => itemIndex !== index), kind);
      if (targetSlot === undefined) {
        setError(t("talent.mediaLimit"));
        return;
      }
      const url = await uploadVenueShiftMedia(id, kind, asset.uri, (asset as any).mimeType);
      const next = currentItem
        ? current.map((item, itemIndex) => itemIndex === index ? { url, kind, slot: targetSlot } : item)
        : [...current, { url, kind, slot: targetSlot }];
      await persist(next);
    } catch (e: any) {
      setError(e?.message ?? t("talent.uploadError"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const remove = async (index: number) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await persist(items.filter((_, itemIndex) => itemIndex !== index));
    } catch (e: any) {
      setError(e?.message ?? t("talent.uploadError"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        <Pressable accessibilityLabel={t("talent.close")} onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={20} color={TAVORIA.color.navy} />
        </Pressable>
        <Text style={styles.title}>{t("talent.media")}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!row && !error ? <ActivityIndicator color={TAVORIA.color.orange} style={styles.loading} /> : null}
        {row ? (
          <MixedMediaSlotGrid
            items={items}
            maxItems={LIMITS.photo + LIMITS.video}
            busy={busy}
            onPick={(index) => void pick(index)}
            onRemove={(index) => void remove(index)}
            onAdd={() => void pick()}
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
  safe: { backgroundColor: TAVORIA.color.paperDeep, flex: 1 },
  content: { alignSelf: "center", gap: 12, maxWidth: 840, paddingBottom: 32, paddingHorizontal: 24, paddingTop: 18, width: "100%" },
  back: { alignSelf: "flex-start", paddingVertical: 8 },
  title: { color: TAVORIA.color.navy, fontFamily: "InstrumentSerif_400Regular", fontSize: 29 },
  error: { color: TAVORIA.color.error, fontSize: 14, lineHeight: 21 },
  loading: { marginTop: 36 },
});
