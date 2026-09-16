import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { TAVORIA } from "../lib/designTokens";
import { t } from "../lib/i18n";
import MediaCarousel from "./MediaCarousel";
import { uniqueMediaItems, type MediaItem } from "./mediaTypes";

type Props = {
  media?: MediaItem[];
  photos?: (string | null)[];
  videos?: (string | null)[];
  onAdd?: () => void;
};

export default function ProfileMediaSection({ media, photos = [], videos = [], onAdd }: Props) {
  const normalizedMedia = uniqueMediaItems(media ?? [
    ...photos.filter((url): url is string => Boolean(url)).map((url) => ({ url, kind: "photo" as const })),
    ...videos.filter((url): url is string => Boolean(url)).map((url) => ({ url, kind: "video" as const })),
  ]);
  const hasMedia = normalizedMedia.length > 0;
  if (!hasMedia && !onAdd) return null;

  return (
    <View style={styles.section}>
      {hasMedia ? (
        <View>
          <MediaCarousel media={normalizedMedia} />
        </View>
      ) : null}
      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hasMedia ? t("talent.manageMedia") : t("talent.add")}
          onPress={onAdd}
          style={({ hovered, pressed }) => [styles.manage, hovered && styles.manageHovered, pressed && styles.managePressed]}
        >
          <Feather name={hasMedia ? "edit-2" : "plus"} size={15} color={TAVORIA.color.navy} />
          <Text style={styles.manageText}>{hasMedia ? t("talent.manageMedia") : t("talent.add")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderBottomColor: "rgba(14,26,36,0.12)", borderBottomWidth: 1, gap: 13, paddingBottom: 20 },
  manage: { alignItems: "center", alignSelf: "flex-start", borderRadius: TAVORIA.radius.small, flexDirection: "row", gap: 7, minHeight: 36, paddingHorizontal: 9 },
  manageHovered: { backgroundColor: TAVORIA.color.paperDeep },
  managePressed: { opacity: 0.72 },
  manageText: { color: TAVORIA.color.navy, fontSize: 13, fontWeight: "700" },
});
