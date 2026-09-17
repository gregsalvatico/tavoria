import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StickyFooter from "../components/StickyFooter";
import MixedMediaSlotGrid, { type EditableMediaItem } from "../components/MixedMediaSlotGrid";
import ActionButton from "../components/ActionButton";
import { mediaSlots } from "../components/WorkerProfileContent";
import { getCurrentWorkerFull, updateCurrentWorker, uploadWorkerMedia } from "../lib/db";
import { t } from "../lib/i18n";
import { pickImageWeb, pickMediaWeb } from "../lib/webMedia";
import { TAVORIA } from "../lib/designTokens";
import { uniqueMediaItems, type MediaKind } from "../components/mediaTypes";

const LIMITS = { photo: 5, video: 3 } as const;

function mediaKindFromAsset(asset: { type?: string; mimeType?: string }): MediaKind {
  return asset.type === "video" || asset.mimeType?.startsWith("video/") ? "video" : "photo";
}

function mediaItems(row: any): EditableMediaItem[] {
  const photos = mediaSlots(row, "photo");
  const videos = mediaSlots(row, "video");
  return uniqueMediaItems([
    ...photos.slice(1).flatMap((url, index) => url ? [{ url, kind: "photo" as const, slot: index + 1 }] : []),
    ...videos.flatMap((url, slot) => url ? [{ url, kind: "video" as const, slot }] : []),
  ]);
}

function nextAvailableSlot(items: EditableMediaItem[], kind: MediaKind) {
  const used = new Set(items.filter((item) => item.kind === kind).map((item) => item.slot));
  const firstSlot = kind === "photo" ? 1 : 0;
  const slotCount = kind === "photo" ? LIMITS.photo - 1 : LIMITS.video;
  return Array.from({ length: slotCount }, (_, index) => index + firstSlot).find((slot) => !used.has(slot));
}

export default function WorkerMediaEdit() {
  const router = useRouter();
  const [row, setRow] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");

  const load = () => getCurrentWorkerFull()
    .then((worker) => {
      if (!worker) throw new Error(t("talent.loadError"));
      setRow(worker);
    })
    .catch((e) => setError(e?.message ?? t("talent.loadError")));

  useEffect(() => { void load(); }, []);

  const items = useMemo(() => row ? mediaItems(row) : [], [row]);
  const primaryPhoto = row ? mediaSlots(row, "photo")[0] : null;

  const persist = async (nextItems: EditableMediaItem[], nextPrimary = primaryPhoto) => {
    const photos = Array.from({ length: LIMITS.photo }, () => null as string | null);
    photos[0] = nextPrimary ?? null;
    const videos = Array.from({ length: LIMITS.video }, () => null as string | null);
    uniqueMediaItems(nextItems).forEach((item) => {
      if (item.kind === "photo") photos[item.slot] = item.url;
      else videos[item.slot] = item.url;
    });
    const patch = {
      photo_url: photos[0],
      photo_urls: [null, ...photos.slice(1)],
      video_url: videos[0],
      video_urls: [null, ...videos.slice(1)],
    } as any;
    await updateCurrentWorker(patch);
    setRow((current: any) => ({ ...(current ?? {}), ...patch }));
  };

  const pick = async (index?: number) => {
    if (!row || (index === undefined && items.length >= LIMITS.photo - 1 + LIMITS.video) || busyRef.current) return;
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
      const url = await uploadWorkerMedia(kind, asset.uri, (asset as any).mimeType, targetSlot);
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

  const pickPrimary = async () => {
    if (!row || busyRef.current) return;
    setError("");
    setBusy(true);
    try {
      const result = Platform.OS === "web"
        ? await pickImageWeb({ camera: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] as any, quality: 0.8 });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const url = await uploadWorkerMedia("photo", asset.uri, (asset as any).mimeType, 0);
      const photoSlots = mediaSlots(row, "photo");
      const patch = { photo_url: url, photo_urls: [null, ...photoSlots.slice(1)] } as any;
      await updateCurrentWorker(patch);
      setRow((current: any) => ({ ...(current ?? {}), ...patch }));
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
        <Pressable accessibilityLabel={t("talent.close")} onPress={() => router.dismissTo("/candidate")} style={styles.back}>
          <Feather name="arrow-left" size={20} color={TAVORIA.color.navy} />
        </Pressable>
        <Text style={styles.title}>{t("talent.media")}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!row ? (
          error ? <Pressable onPress={load}><Text style={styles.retry}>{t("talent.retry")}</Text></Pressable> : <ActivityIndicator color={TAVORIA.color.orange} />
        ) : (
          <>
            <Text style={styles.sectionLabel}>{t("talent.profilePhoto")}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t("talent.replace")} disabled={busy} onPress={() => void pickPrimary()} style={styles.primaryPhotoCard}>
              {primaryPhoto ? <Image source={{ uri: primaryPhoto }} style={styles.primaryPhoto} resizeMode="cover" /> : <Feather name="camera" size={22} color={TAVORIA.color.muted} />}
              <Text style={styles.primaryPhotoText}>{primaryPhoto ? t("talent.replace") : t("talent.add")}</Text>
            </Pressable>
            <Text style={styles.sectionLabel}>{t("talent.media")}</Text>
            <MixedMediaSlotGrid
              items={items}
              maxItems={LIMITS.photo - 1 + LIMITS.video}
              busy={busy}
              onPick={(index) => void pick(index)}
              onRemove={(index) => void remove(index)}
              onAdd={() => void pick()}
            />
          </>
        )}
      </ScrollView>
      <StickyFooter desktopRow>
        <ActionButton label={t("common.done")} icon="check" onPress={() => router.dismissTo("/candidate")} />
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
  retry: { color: TAVORIA.color.orange, fontWeight: "700" },
  sectionLabel: { color: TAVORIA.color.muted, fontFamily: "DMMono_500Medium", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  primaryPhotoCard: { alignItems: "center", alignSelf: "flex-start", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.medium, borderWidth: 1, gap: 8, minHeight: 170, overflow: "hidden", paddingBottom: 10, width: 170 },
  primaryPhoto: { aspectRatio: 1, width: "100%" },
  primaryPhotoText: { color: TAVORIA.color.navy, fontSize: 12, fontWeight: "700" },
});
