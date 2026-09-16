import * as ImagePicker from "expo-image-picker";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { updateVenue, uploadVenueMedia } from "../lib/db";
import { t } from "../lib/i18n";
import { pickMediaWeb } from "../lib/webMedia";
import { TAVORIA } from "../lib/designTokens";
import MixedMediaSlotGrid, { type EditableMediaItem } from "./MixedMediaSlotGrid";
import { uniqueMediaItems, type MediaKind } from "./mediaTypes";

const LIMITS = { photo: 5, video: 3 } as const;

export type VenueMediaData = {
  id?: string;
  photo_url?: string | null;
  photo_urls?: (string | null)[];
  video_urls?: (string | null)[];
};

type VenueMediaPatch = {
  photo_url?: string | null;
  photo_urls?: (string | null)[];
  video_urls?: (string | null)[];
};

type Props = {
  venue: VenueMediaData;
  onVenueChange?: (patch: VenueMediaPatch) => void;
};

function mediaKindFromAsset(asset: { type?: string; mimeType?: string }): MediaKind {
  return asset.type === "video" || asset.mimeType?.startsWith("video/") ? "video" : "photo";
}

function primaryVenuePhoto(venue: VenueMediaData) {
  return venue.photo_url ?? venue.photo_urls?.find(Boolean) ?? null;
}

function mediaItems(venue: VenueMediaData): EditableMediaItem[] {
  const primary = primaryVenuePhoto(venue);
  const storedPhotos = venue.photo_url ? (venue.photo_urls ?? []) : (venue.photo_urls ?? []).slice(1);
  const photosWithoutAvatar = storedPhotos.filter((url) => Boolean(url) && url !== primary);
  const photos = Array.from({ length: LIMITS.photo - 1 }, (_, index) => photosWithoutAvatar[index] ?? null);
  const videos = Array.from({ length: LIMITS.video }, (_, index) => venue.video_urls?.[index] ?? null);
  return uniqueMediaItems([
    ...photos.flatMap((url, index) => url ? [{ url, kind: "photo" as const, slot: index + 1 }] : []),
    ...videos.flatMap((url, slot) => url ? [{ url, kind: "video" as const, slot }] : []),
  ]);
}

function nextAvailableSlot(items: EditableMediaItem[], kind: MediaKind) {
  const used = new Set(items.filter((item) => item.kind === kind).map((item) => item.slot));
  const slots = Array.from({ length: LIMITS[kind] }, (_, slot) => slot);
  return slots.find((slot) => (kind === "photo" ? slot > 0 : true) && !used.has(slot));
}

export default function VenueMediaEditor({ venue, onVenueChange }: Props) {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const items = useMemo(() => mediaItems(venue), [venue]);

  const persist = async (nextItems: EditableMediaItem[], nextPrimary = primaryVenuePhoto(venue)) => {
    if (!venue.id) return;
    const photos = Array.from({ length: LIMITS.photo }, () => null as string | null);
    photos[0] = nextPrimary;
    const videos = Array.from({ length: LIMITS.video }, () => null as string | null);
    uniqueMediaItems(nextItems).forEach((item) => {
      if (item.kind === "photo") photos[item.slot] = item.url;
      else videos[item.slot] = item.url;
    });
    const patch: VenueMediaPatch = {
      photo_url: photos[0],
      photo_urls: photos.slice(1),
      video_urls: videos,
    };
    await updateVenue(venue.id, patch);
    onVenueChange?.(patch);
  };

  const pick = async (index?: number) => {
    if (!venue.id || (index === undefined && items.length >= LIMITS.photo - 1 + LIMITS.video) || busyRef.current) return;
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
      const url = await uploadVenueMedia(venue.id, kind, asset.uri, (asset as any).mimeType);
      const next = currentItem
        ? current.map((item, itemIndex) => itemIndex === index ? { url, kind, slot: targetSlot } : item)
        : [...current, { url, kind, slot: targetSlot }];
      await persist(next, primaryVenuePhoto(venue));
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
    <View style={styles.wrap}>
      <Text style={styles.title}>{t("talent.venueMediaTitle")}</Text>
      <Text style={styles.intro}>{t("talent.venuePhotoIntro")}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <MixedMediaSlotGrid
        items={items}
        maxItems={LIMITS.photo - 1 + LIMITS.video}
        busy={busy}
        onPick={(index) => void pick(index)}
        onRemove={(index) => void remove(index)}
        onAdd={() => void pick()}
      />
      {!venue.id ? <ActivityIndicator color={TAVORIA.color.orange} style={styles.loading} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  title: { color: TAVORIA.color.navy, fontSize: 17, fontWeight: "800" },
  intro: { color: TAVORIA.color.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  error: { color: "#993556", fontSize: 14, lineHeight: 21, marginBottom: 16 },
  loading: { marginTop: 24 },
});
