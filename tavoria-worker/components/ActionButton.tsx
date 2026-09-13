import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { TAVORIA } from "../lib/designTokens";

type Variant = "primary" | "secondary" | "quiet" | "destructive";

type Props = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export default function ActionButton({
  label,
  onPress,
  icon,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
  accessibilityLabel,
}: Props) {
  const isDisabled = disabled || loading;
  const color = variant === "primary" || variant === "destructive" ? TAVORIA.color.paper : TAVORIA.color.navy;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.base,
        styles[variant],
        hovered && styles[`${variant}Hovered` as const],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, styles[`${variant}Text` as const]]}>{label}</Text>
      {loading ? <ActivityIndicator color={color} size="small" /> : icon ? <Feather name={icon} size={17} color={color} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: TAVORIA.radius.pill,
    flexDirection: "row",
    gap: 8,
    height: TAVORIA.control.minHeight,
    justifyContent: "center",
    maxHeight: TAVORIA.control.minHeight,
    minHeight: TAVORIA.control.minHeight,
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: TAVORIA.color.orange },
  secondary: { backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderWidth: 1 },
  quiet: { backgroundColor: "transparent" },
  destructive: { backgroundColor: TAVORIA.color.error },
  text: { fontSize: 15, fontWeight: "800" },
  primaryText: { color: TAVORIA.color.paper },
  secondaryText: { color: TAVORIA.color.navy },
  quietText: { color: TAVORIA.color.navy },
  destructiveText: { color: TAVORIA.color.paper },
  primaryHovered: { backgroundColor: "#D94717" },
  secondaryHovered: { backgroundColor: "#F1EFE8" },
  quietHovered: { backgroundColor: "rgba(14,26,36,0.07)" },
  destructiveHovered: { backgroundColor: "#98201A" },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
});
