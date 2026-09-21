import { Feather } from "@expo/vector-icons";
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from "react-native";
import Chip from "./Chip";

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
    <Chip
      label={label}
      icon={active ? "check" : icon}
      selected={active}
      selectedTone="accent"
      size={desktop ? "regular" : "compact"}
      onPress={onPress}
      accessibilityState={{ selected: active }}
    />
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
          <Chip
            key={option.id}
            label={option.label}
            count={option.count}
            selected={active}
            selectedTone="accent"
            size={desktop ? "regular" : "compact"}
            onPress={() => onChange(option.id)}
            accessibilityState={{ selected: active }}
          />
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
});
