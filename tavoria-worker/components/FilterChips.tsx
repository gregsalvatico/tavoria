import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

export type FilterChipOption<T extends string = string> = {
  id: T;
  label: string;
  count?: number;
};

export default function FilterChips<T extends string>({
  options,
  value,
  onChange,
  desktop = false,
}: {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  desktop?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, desktop && styles.rowDesktop]}
      style={styles.scroll}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {option.label}
            </Text>
            {typeof option.count === "number" ? (
              <Text style={[styles.count, active && styles.countActive]}>{option.count}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, maxHeight: 52 },
  row: { gap: 8, paddingBottom: 8, paddingHorizontal: 16, paddingTop: 6 },
  rowDesktop: { paddingHorizontal: 24 },
  chip: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "rgba(14,26,36,0.12)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: "#0E1A24", borderColor: "#0E1A24" },
  label: { color: "#46505A", fontSize: 12, fontWeight: "700" },
  labelActive: { color: "white" },
  count: { color: "#8A8F98", fontFamily: "DMMono_500Medium", fontSize: 10 },
  countActive: { color: "rgba(255,255,255,0.72)" },
});
