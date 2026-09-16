import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { t } from "../lib/i18n";
import { TAVORIA } from "../lib/designTokens";
import VideoCarousel from "./VideoCarousel";
import { MEDIA_GRID_GAP, MEDIA_TILE_RADIUS, MEDIA_TILE_WIDTH } from "./mediaLayout";
import type { MediaItem } from "./mediaTypes";

type Props = {
  media?: MediaItem[];
  photos?: (string | null)[];
  videos?: (string | null)[];
  onAdd?: () => void;
  addLabel?: string;
};

const uniqueUrls = (urls: (string | null)[]) =>
  Array.from(new Set(urls.filter((url): url is string => Boolean(url))));

/** A large, non-scrolling media grid for complete profile pages. */
export default function MediaGrid({ media: suppliedMedia, photos = [], videos = [], onAdd, addLabel = t("talent.add") }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const media = suppliedMedia ?? [
    ...uniqueUrls(photos).map((url) => ({ url, kind: "photo" as const })),
    ...uniqueUrls(videos).map((url) => ({ url, kind: "video" as const })),
  ];
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  if (!media.length && !onAdd) return null;

  return (
    <>
      <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
        {media.map((item) => item.kind === "photo" ? (
          <Pressable
            key={`${item.kind}-${item.url}`}
            accessibilityRole="button"
            accessibilityLabel={t("talent.photos")}
            onPress={() => setActivePhoto(item.url)}
            style={[styles.tile, isDesktop && styles.tileDesktop]}
          >
            <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
          </Pressable>
        ) : (
          <View key={`${item.kind}-${item.url}`} style={[styles.tile, isDesktop && styles.tileDesktop]}>
            <VideoCarousel urls={[item.url]} width="100%" aspectRatio={1} />
          </View>
        ))}
        {onAdd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={addLabel}
            onPress={onAdd}
            style={[styles.tile, styles.addTile, isDesktop && styles.tileDesktop]}
          >
            <Feather name="plus" size={22} color="#626B78" />
            <Text style={styles.addText}>{addLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal visible={Boolean(activePhoto)} transparent onRequestClose={() => setActivePhoto(null)}>
        <View style={styles.modal}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("talent.close")}
            onPress={() => setActivePhoto(null)}
            style={styles.close}
          >
            <Feather name="x" size={24} color={TAVORIA.color.paper} />
          </Pressable>
          {activePhoto ? <Image source={{ uri: activePhoto }} resizeMode="contain" style={styles.fullImage} /> : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: MEDIA_GRID_GAP, width: "100%" },
  gridDesktop: { gap: TAVORIA.space.md },
  tile: {
    aspectRatio: 1,
    backgroundColor: TAVORIA.color.navy,
    borderRadius: MEDIA_TILE_RADIUS,
    overflow: "hidden",
    width: MEDIA_TILE_WIDTH,
  },
  tileDesktop: { width: "31.5%" },
  image: { height: "100%", width: "100%" },
  addTile: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderWidth: 1, justifyContent: "center" },
  addText: { color: "#626B78", fontSize: 12, fontWeight: "600", marginTop: 8 },
  modal: { alignItems: "center", backgroundColor: "rgba(14,26,36,.96)", flex: 1, justifyContent: "center", padding: 24 },
  close: { padding: 12, position: "absolute", right: 24, top: 24, zIndex: 2 },
  fullImage: { height: "82%", maxWidth: 960, width: "100%" },
});
