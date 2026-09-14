import { StyleSheet, Text, View } from "react-native";
import { t } from "../lib/i18n";
import MediaGrid from "./MediaGrid";

export default function VenueMediaGallery({ photoUrls = [], videoUrls = [] }: { photoUrls?: (string | null)[]; videoUrls?: (string | null)[] }) {
  const photos = photoUrls.filter((url): url is string => Boolean(url));
  const videos = videoUrls.filter((url): url is string => Boolean(url));
  if (!photos.length && !videos.length) return null;
  return (
    <View style={styles.wrap}>
      {photos.length ? (
        <View style={styles.group}>
          <Text style={styles.caption}>{t("talent.photos")}</Text>
          <MediaGrid photos={photos} />
        </View>
      ) : null}
      {videos.length ? (
        <View style={styles.group}>
          <Text style={styles.caption}>{t("talent.videos")}</Text>
          <MediaGrid videos={videos} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Keep additional media visually separate from the primary venue image.
  wrap: { gap: 15, marginBottom: 16, marginTop: 18 },
  group: { gap: 9 },
  caption: { color: "#626B78", fontFamily: "DMMono_500Medium", fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase" },
});
