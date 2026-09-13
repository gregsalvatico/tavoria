import { Feather } from "@expo/vector-icons";
import { ReactNode, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { t } from "../lib/i18n";
import { TAVORIA } from "../lib/designTokens";
import VideoCarousel from "./VideoCarousel";

type Props = {
  photos?: (string | null)[];
  videos?: (string | null)[];
  placeholder?: ReactNode;
  placeholderSource?: ImageSourcePropType;
};

const uniqueUrls = (urls: (string | null)[]) => Array.from(new Set(urls.filter((url): url is string => Boolean(url))));

export default function PreviewMedia({ photos = [], videos = [], placeholder, placeholderSource }: Props) {
  const photoUrls = uniqueUrls(photos);
  const videoUrls = uniqueUrls(videos);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!photoUrls.length && !videoUrls.length && !placeholder && !placeholderSource) return null;

  return (
    <View style={styles.wrap}>
      {photoUrls.length ? (
        <View style={styles.photoSection}>
          <View style={styles.carousel}>
            <Image source={{ uri: photoUrls[photoIndex] }} style={styles.photo} resizeMode="cover" />
            {photoUrls.length > 1 ? (
              <>
                <Pressable
                  accessibilityLabel="Previous photo"
                  accessibilityRole="button"
                  disabled={photoIndex === 0}
                  onPress={() => setPhotoIndex((index) => Math.max(0, index - 1))}
                  style={[styles.carouselButton, styles.carouselButtonLeft, photoIndex === 0 && styles.carouselButtonDisabled]}
                >
                  <Feather name="chevron-left" size={19} color={TAVORIA.color.navy} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Next photo"
                  accessibilityRole="button"
                  disabled={photoIndex === photoUrls.length - 1}
                  onPress={() => setPhotoIndex((index) => Math.min(photoUrls.length - 1, index + 1))}
                  style={[styles.carouselButton, styles.carouselButtonRight, photoIndex === photoUrls.length - 1 && styles.carouselButtonDisabled]}
                >
                  <Feather name="chevron-right" size={19} color={TAVORIA.color.navy} />
                </Pressable>
                <View style={styles.dots}>
                  {photoUrls.map((url, index) => (
                    <View key={url} style={[styles.dot, index === photoIndex && styles.dotActive]} />
                  ))}
                </View>
              </>
            ) : null}
          </View>
        </View>
      ) : placeholderSource ? (
        <Image source={placeholderSource} style={styles.photo} resizeMode="cover" />
      ) : (
        placeholder
      )}

      {videoUrls.length ? (
        <View style={styles.videoSection}>
          <Text style={styles.label}>{t("talent.videos")}</Text>
          <VideoCarousel urls={videoUrls} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  photoSection: { width: "100%" },
  carousel: { borderRadius: TAVORIA.radius.medium, overflow: "hidden", position: "relative" },
  photo: { backgroundColor: "#E8E5DB", borderRadius: TAVORIA.radius.medium, height: 220, width: "100%" },
  carouselButton: { alignItems: "center", backgroundColor: "rgba(247,244,238,0.92)", borderRadius: 20, height: 38, justifyContent: "center", position: "absolute", top: "50%", width: 38 },
  carouselButtonLeft: { left: 10, marginTop: -19 },
  carouselButtonRight: { marginTop: -19, right: 10 },
  carouselButtonDisabled: { opacity: 0.38 },
  dots: { alignItems: "center", bottom: 10, flexDirection: "row", gap: 5, justifyContent: "center", left: 0, position: "absolute", right: 0 },
  dot: { backgroundColor: "rgba(247,244,238,0.65)", borderRadius: 999, height: 5, width: 5 },
  dotActive: { backgroundColor: TAVORIA.color.orange, width: 14 },
  videoSection: { gap: 8 },
  label: { color: TAVORIA.color.muted, fontFamily: "DMMono_500Medium", fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase" },
});
