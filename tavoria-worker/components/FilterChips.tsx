import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { TAVORIA } from "../lib/designTokens";

export type FilterChipOption<T extends string = string> = {
  id: T;
  label: string;
  count?: number;
};

export function FilterToggleChip({
  label,
  active,
  icon,
  onPress,
  desktop = false,
}: {
  label: string;
  active: boolean;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  desktop?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.chip,
        desktop && styles.chipDesktop,
        active && styles.chipActive,
        hovered && !active && styles.chipHovered,
        pressed && styles.chipPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Feather name={active ? "check" : icon} size={12} color={active ? TAVORIA.color.orange : "#46505A"} />
      <Text style={[styles.label, desktop && styles.labelDesktop, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function FilterChips<T extends string>({
  options,
  value,
  onChange,
  desktop = false,
  contained = false,
  style,
}: {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  desktop?: boolean;
  contained?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, !desktop && styles.rowMobile, desktop && styles.rowDesktop, contained && styles.rowContained]}
      style={[styles.scroll, !desktop && styles.scrollMobile, style]}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={({ hovered, pressed }) => [
              styles.chip,
              desktop && styles.chipDesktop,
              active && styles.chipActive,
              hovered && !active && styles.chipHovered,
              pressed && styles.chipPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
              <Text style={[styles.label, desktop && styles.labelDesktop, active && styles.labelActive]}>
              {option.label}
            </Text>
            {typeof option.count === "number" ? (
              <Text style={[styles.count, desktop && styles.countDesktop, active && styles.countActive]}>{option.count}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Keep the row's bottom padding inside the scroll viewport so mobile chips
  // do not look clipped against the next section.
  scroll: { flexGrow: 0, maxHeight: 60, width: "100%" },
  scrollMobile: { maxHeight: 66 },
  row: { gap: 8, paddingBottom: 8, paddingHorizontal: 16, paddingTop: 6 },
  rowMobile: { paddingBottom: 14 },
  rowDesktop: { paddingHorizontal: 24 },
  rowContained: { paddingHorizontal: 0 },
  chip: {
    alignItems: "center",
    backgroundColor: TAVORIA.color.white,
    borderColor: TAVORIA.color.border,
    borderRadius: TAVORIA.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipDesktop: { minHeight: 40, paddingHorizontal: 16 },
  chipActive: { backgroundColor: TAVORIA.color.orangeSoft, borderColor: TAVORIA.color.orange },
  chipHovered: { backgroundColor: "#F3F4F0" },
  chipPressed: { opacity: 0.78 },
  label: { color: "#46505A", fontSize: 12, fontWeight: "700" },
  labelDesktop: { fontSize: 13 },
  labelActive: { color: TAVORIA.color.orange },
  count: { color: "#8A8F98", fontFamily: "DMMono_500Medium", fontSize: 10 },
  countDesktop: { fontSize: 11 },
  countActive: { color: TAVORIA.color.orange },
});
