import { Feather } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../lib/i18n";
import { useIsDesktop } from "../lib/responsive";
import { TAVORIA } from "../lib/designTokens";
import { MEDIA_GRID_GAP, MEDIA_TILE_WIDTH } from "./mediaLayout";

export type VenueTypeOption = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  hue: string;
  image: number;
  labelKey: string;
  label: string;
};

export const VENUE_TYPE_OPTIONS: VenueTypeOption[] = [
  { id: "cafe", label: "Café", labelKey: "venue_type.cafe", icon: "coffee", hue: "#FAEEDA", image: require("../assets/venue-cafe.png") },
  { id: "bar", label: "Bar", labelKey: "venue_type.bar", icon: "wind", hue: "#FBEAF0", image: require("../assets/venue-bar.png") },
  { id: "restaurant", label: "Restaurant", labelKey: "venue_type.restaurant", icon: "shopping-bag", hue: "#FAECE7", image: require("../assets/venue-restaurant.png") },
  { id: "hotel", label: "Hotel", labelKey: "venue_type.hotel", icon: "home", hue: "#E6F1FB", image: require("../assets/venue-hotel.png") },
  { id: "club", label: "Club", labelKey: "venue_type.club", icon: "music", hue: "#EEEDFE", image: require("../assets/venue-club.png") },
  { id: "beach", label: "Beach club", labelKey: "venue_type.beach_club", icon: "sun", hue: "#E1F5EE", image: require("../assets/venue-beach.png") },
];

export function venueTypeId(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return VENUE_TYPE_OPTIONS.find((option) => option.id === normalized || option.label.toLowerCase() === normalized)?.id ?? null;
}

export function venueTypeLabel(value?: string | null) {
  const id = venueTypeId(value);
  return VENUE_TYPE_OPTIONS.find((option) => option.id === id)?.label;
}

export default function VenueTypePicker({ value, onChange }: { value?: string | null; onChange: (id: string) => void }) {
  const isDesktop = useIsDesktop();
  const selectedId = venueTypeId(value);
  return (
    <View style={styles.grid}>
      {VENUE_TYPE_OPTIONS.map((option) => {
        const selected = option.id === selectedId;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.id)}
            style={({ hovered, pressed }) => [
              styles.tile,
              { width: isDesktop ? MEDIA_TILE_WIDTH : "47%" },
              selected && styles.tileSelected,
              hovered && !selected && styles.tileHovered,
              pressed && styles.pressed,
            ]}
          >
            <Image source={option.image} style={styles.image} resizeMode="cover" />
            <View style={styles.scrim} pointerEvents="none" />
            <Text style={styles.label}>{t(option.labelKey)}</Text>
            {selected ? (
              <View style={styles.check}>
                <Feather name="check" size={14} color={TAVORIA.color.white} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: MEDIA_GRID_GAP, width: "100%" },
  tile: { aspectRatio: 1, borderColor: "transparent", borderRadius: TAVORIA.radius.medium, borderWidth: 2, overflow: "hidden", position: "relative" },
  tileSelected: { borderColor: TAVORIA.color.orange },
  tileHovered: { borderColor: TAVORIA.color.borderStrong, transform: [{ scale: 0.99 }] },
  image: { height: "100%", width: "100%" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.30)" },
  label: { bottom: TAVORIA.space.sm, color: TAVORIA.color.white, fontSize: 18, fontWeight: "800", left: TAVORIA.space.sm, position: "absolute", right: TAVORIA.space.sm, textAlign: "center", textShadowColor: "rgba(0,0,0,0.45)", textShadowOffset: { height: 1, width: 0 }, textShadowRadius: 4 },
  check: { alignItems: "center", backgroundColor: TAVORIA.color.orange, borderRadius: 999, height: 28, justifyContent: "center", position: "absolute", right: 10, top: 10, width: 28 },
  pressed: { opacity: 0.82 },
});
