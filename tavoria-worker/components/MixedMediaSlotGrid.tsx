import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { t } from "../lib/i18n";
import { TAVORIA } from "../lib/designTokens";
import VideoCarousel from "./VideoCarousel";
import { MEDIA_GRID_GAP, MEDIA_TILE_RADIUS, MEDIA_TILE_WIDTH } from "./mediaLayout";
import type { MediaItem } from "./mediaTypes";

export type EditableMediaItem = MediaItem & { slot: number };

type Props = {
  items: EditableMediaItem[];
  maxItems: number;
  busy: boolean;
  onPick: (index: number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
};

/** One mixed photo/video grid used by profile media editors. */
export default function MixedMediaSlotGrid({ items, maxItems, busy, onPick, onRemove, onAdd }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  return (
    <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
      {items.map((item, index) => (
        <View key={`${item.kind}-${item.url}-${item.slot}`} style={[styles.item, isDesktop && styles.itemDesktop]}>
          <View style={styles.preview}>
            {item.kind === "photo" ? (
              <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
            ) : (
              <VideoCarousel urls={[item.url]} width="100%" aspectRatio={1} />
            )}
          </View>
          <View style={styles.itemActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("talent.replace")}
              disabled={busy}
              onPressIn={(event) => (event as any).stopPropagation?.()}
          onPress={(event) => {
                (event as any).stopPropagation?.();
                onPick(index);
              }}
              style={({ hovered, pressed }) => [
                styles.secondary,
                hovered && styles.secondaryHovered,
                pressed && styles.pressed,
                busy && styles.disabled,
              ]}
            >
              <Text style={styles.secondaryText}>{t("talent.replace")}</Text>
              {busy ? <ActivityIndicator size="small" color={TAVORIA.color.orange} /> : null}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("talent.remove")}
              disabled={busy}
              onPressIn={(event) => (event as any).stopPropagation?.()}
          onPress={(event) => {
                (event as any).stopPropagation?.();
                onRemove(index);
              }}
              style={({ hovered, pressed }) => [
                styles.delete,
                hovered && styles.deleteHovered,
                pressed && styles.pressed,
                busy && styles.disabled,
              ]}
            >
              <Feather name="trash-2" size={16} color={TAVORIA.color.muted} />
            </Pressable>
          </View>
        </View>
      ))}
      {items.length < maxItems ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("talent.add")}
          disabled={busy}
          onPressIn={(event) => (event as any).stopPropagation?.()}
          onPress={(event) => {
            (event as any).stopPropagation?.();
            onAdd();
          }}
          style={({ hovered, pressed }) => [
            styles.add,
            isDesktop && styles.addDesktop,
            hovered && styles.addHovered,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}
        >
          {busy ? <ActivityIndicator size="small" color={TAVORIA.color.orange} /> : <Feather name="plus" size={20} color={TAVORIA.color.muted} />}
          <Text style={styles.addText}>{t("talent.add")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: MEDIA_GRID_GAP, width: "100%" },
  gridDesktop: { gap: TAVORIA.space.md },
  item: { gap: TAVORIA.space.xs, maxWidth: "100%", width: MEDIA_TILE_WIDTH },
  itemDesktop: { width: "31.5%" },
  preview: { alignItems: "center", aspectRatio: 1, backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: MEDIA_TILE_RADIUS, borderWidth: 1, justifyContent: "center", overflow: "hidden", width: "100%" },
  image: { height: "100%", width: "100%" },
  itemActions: { alignItems: "center", flexDirection: "row", gap: TAVORIA.space.xs },
  secondary: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.small, borderWidth: 1, flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 40, paddingHorizontal: 8 },
  secondaryHovered: { backgroundColor: TAVORIA.color.paperDeep },
  secondaryText: { color: TAVORIA.color.navy, fontSize: 12, fontWeight: "700" },
  delete: { alignItems: "center", borderRadius: TAVORIA.radius.small, height: 40, justifyContent: "center", width: 40 },
  deleteHovered: { backgroundColor: TAVORIA.color.paperDeep },
  add: { alignItems: "center", aspectRatio: 1, backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderRadius: MEDIA_TILE_RADIUS, borderWidth: 1, gap: 7, justifyContent: "center", width: MEDIA_TILE_WIDTH },
  addDesktop: { width: "31.5%" },
  addHovered: { backgroundColor: TAVORIA.color.paperDeep },
  addText: { color: TAVORIA.color.muted, fontSize: 12, fontWeight: "600" },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.45 },
});
