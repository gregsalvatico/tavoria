import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../lib/i18n";
import { TAVORIA } from "../lib/designTokens";
import VideoCarousel from "./VideoCarousel";

type Props = {
  photos?: (string | null)[];
  videos?: (string | null)[];
  onAdd?: () => void;
  addLabel?: string;
};

const uniqueUrls = (urls: (string | null)[]) =>
  Array.from(new Set(urls.filter((url): url is string => Boolean(url))));

/** A large, non-scrolling media grid for complete profile pages. */
export default function MediaGrid({ photos = [], videos = [], onAdd, addLabel = t("talent.add") }: Props) {
  const photoUrls = uniqueUrls(photos);
  const videoUrls = uniqueUrls(videos);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  if (!photoUrls.length && !videoUrls.length && !onAdd) return null;

  return (
    <>
      <View style={styles.grid}>
        {photoUrls.map((url) => (
          <Pressable
            key={`photo-${url}`}
            accessibilityRole="button"
            accessibilityLabel={t("talent.photos")}
            onPress={() => setActivePhoto(url)}
            style={styles.tile}
          >
            <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
          </Pressable>
        ))}
        {videoUrls.map((url) => (
          <View key={`video-${url}`} style={styles.tile}>
            <VideoCarousel urls={[url]} width="100%" aspectRatio={1} />
          </View>
        ))}
        {onAdd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={addLabel}
            onPress={onAdd}
            style={[styles.tile, styles.addTile]}
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, width: "100%" },
  tile: {
    aspectRatio: 1,
    backgroundColor: TAVORIA.color.navy,
    borderRadius: TAVORIA.radius.medium,
    overflow: "hidden",
    width: "48%",
  },
  image: { height: "100%", width: "100%" },
  addTile: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderWidth: 1, justifyContent: "center" },
  addText: { color: "#626B78", fontSize: 12, marginTop: 8 },
  modal: { alignItems: "center", backgroundColor: "rgba(14,26,36,.96)", flex: 1, justifyContent: "center", padding: 24 },
  close: { padding: 12, position: "absolute", right: 24, top: 24, zIndex: 2 },
  fullImage: { height: "82%", maxWidth: 960, width: "100%" },
});
