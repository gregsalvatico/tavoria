import { Feather } from "@expo/vector-icons";
import {
  AccessibilityRole,
  AccessibilityState,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { TAVORIA } from "../lib/designTokens";

export type ChipSize = "compact" | "regular";
export type ChipSelectedTone = "dark" | "accent";

type Props = {
  label: string;
  selected?: boolean;
  selectedTone?: ChipSelectedTone;
  size?: ChipSize;
  icon?: keyof typeof Feather.glyphMap;
  trailingIcon?: keyof typeof Feather.glyphMap;
  count?: number | string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  style?: StyleProp<ViewStyle>;
};

export default function Chip({
  label,
  selected = false,
  selectedTone = "dark",
  size = "regular",
  icon,
  trailingIcon,
  count,
  onPress,
  disabled = false,
  accessibilityRole,
  accessibilityState,
  style,
}: Props) {
  const content = (
    <>
      {icon ? <Feather name={icon} size={size === "compact" ? 12 : 14} color={iconColor(selected, selectedTone)} /> : null}
      <Text style={[styles.label, size === "compact" && styles.labelCompact, selected && selectedTone === "dark" && styles.labelSelected, selected && selectedTone === "accent" && styles.labelAccent]} numberOfLines={1}>
        {label}
      </Text>
      {typeof count !== "undefined" ? (
        <Text style={[styles.count, size === "compact" && styles.countCompact, selected && selectedTone === "dark" && styles.countSelected, selected && selectedTone === "accent" && styles.countAccent]}>
          {count}
        </Text>
      ) : null}
      {trailingIcon ? <Feather name={trailingIcon} size={size === "compact" ? 12 : 13} color={iconColor(selected, selectedTone)} /> : null}
    </>
  );

  const chipStyle = ({ hovered, pressed }: { hovered?: boolean; pressed?: boolean }) => [
    styles.base,
    size === "compact" ? styles.compact : styles.regular,
    selected && selectedTone === "dark" && styles.selectedDark,
    selected && selectedTone === "accent" && styles.selectedAccent,
    hovered && !selected && styles.hovered,
    pressed && styles.pressed,
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole={accessibilityRole ?? "button"}
        accessibilityState={{ ...accessibilityState, selected, disabled }}
        disabled={disabled}
        onPress={onPress}
        style={chipStyle}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={chipStyle({})}>{content}</View>;
}

function iconColor(selected: boolean, tone: ChipSelectedTone) {
  if (!selected) return TAVORIA.color.muted;
  return tone === "accent" ? TAVORIA.color.orange : TAVORIA.color.paper;
}

const styles = StyleSheet.create({
  base: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.pill, borderWidth: 1, flexDirection: "row", gap: 8, justifyContent: "center", maxWidth: "100%" },
  compact: { minHeight: 36, paddingHorizontal: 13 },
  regular: { minHeight: 40, paddingHorizontal: 16 },
  selectedDark: { backgroundColor: TAVORIA.color.navy, borderColor: TAVORIA.color.navy },
  selectedAccent: { backgroundColor: TAVORIA.color.orangeSoft, borderColor: TAVORIA.color.orange },
  hovered: { backgroundColor: TAVORIA.color.paperDeep },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.45 },
  label: { color: TAVORIA.color.navy, flexShrink: 1, fontSize: 13, fontWeight: "600" },
  labelCompact: { fontSize: 12 },
  labelSelected: { color: TAVORIA.color.paper },
  labelAccent: { color: TAVORIA.color.orange },
  count: { color: TAVORIA.color.muted, fontFamily: TAVORIA.type.label, fontSize: 11 },
  countCompact: { fontSize: 10 },
  countSelected: { color: TAVORIA.color.paper },
  countAccent: { color: TAVORIA.color.orange },
});
