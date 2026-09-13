import { ReactNode } from "react";
import { Feather } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useIsDesktop } from "../lib/responsive";
import { TAVORIA } from "../lib/designTokens";

export const PAGE_MAX_WIDTH = 1180;

export function PageContainer({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const isDesktop = useIsDesktop();
  return <View style={[styles.container, isDesktop && styles.containerDesktop, style]}>{children}</View>;
}

export function PageHeader({
  title,
  left,
  right,
  style,
}: {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const isDesktop = useIsDesktop();
  return (
    <View style={[styles.header, isDesktop && styles.headerDesktop, style]}>
      <View style={[styles.leftSlot, isDesktop && styles.leftSlotDesktop]}>
        {!isDesktop ? left : null}
      </View>
      <Text style={[styles.title, isDesktop && styles.titleDesktop, !isDesktop && styles.titleMobile]} numberOfLines={1}>
        <Text style={styles.accent}>{title.charAt(0)}</Text>
        {title.slice(1)}
      </Text>
      <View style={styles.rightSlot}>{right}</View>
    </View>
  );
}

export function FilterBar({
  children,
  trailing,
  style,
}: {
  children: ReactNode;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PageContainer style={[styles.filterBar, style]}>
      <View style={styles.filterBarRow}>
        <View style={styles.filterBarContent}>{children}</View>
        {trailing ? <View style={styles.filterBarTrailing}>{trailing}</View> : null}
      </View>
    </PageContainer>
  );
}

export function ListSurface({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.listSurface, style]}>{children}</View>;
}

export function ListRow({
  children,
  onPress,
  label,
  last = false,
  selected = false,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  label?: string;
  last?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ hovered }: any) => [
        styles.listRow,
        selected && styles.listRowSelected,
        hovered && !selected && styles.listRowHovered,
        !last && styles.listRowDivider,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function HeaderIconButton({
  label,
  children,
  onPress,
  disabled = false,
  style,
}: {
  label: string;
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={10}
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.iconButton,
        hovered && styles.iconButtonHovered,
        pressed && styles.iconButtonPressed,
        style,
        disabled && styles.iconButtonDisabled,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function RefreshIconButton({
  label,
  loading = false,
  onPress,
}: {
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <HeaderIconButton
      label={label}
      onPress={onPress}
      disabled={loading}
      style={styles.refreshButton}
    >
      {loading ? (
        <ActivityIndicator color={TAVORIA.color.orange} size="small" />
      ) : (
        <Feather name="refresh-cw" size={16} color={TAVORIA.color.navy} />
      )}
    </HeaderIconButton>
  );
}

export function FlowTopBar({
  onBack,
  center,
  step,
  total,
  right,
  icon = "chevron-left",
}: {
  onBack: () => void;
  center?: ReactNode;
  step?: number;
  total?: number;
  right?: ReactNode;
  icon?: keyof typeof Feather.glyphMap;
}) {
  return (
    <PageContainer style={styles.flowTopBarContainer}>
      <View style={styles.flowTopBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={icon === "x" ? "Close" : "Go back"}
          hitSlop={12}
          onPress={onBack}
          style={({ hovered, pressed }) => [
            styles.flowSide,
            hovered && styles.flowSideHovered,
            pressed && styles.flowSidePressed,
          ]}
        >
          <Feather name={icon} size={24} color={TAVORIA.color.navy} />
        </Pressable>
        <View style={styles.flowCenter}>
          {center ?? (step !== undefined && total !== undefined ? (
            <View style={styles.flowDots}>
              {Array.from({ length: total }).map((_, index) => (
                <View key={index} style={[styles.flowDot, index <= step && styles.flowDotActive]} />
              ))}
            </View>
          ) : null)}
        </View>
        <View style={styles.flowSide}>{right}</View>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    paddingHorizontal: TAVORIA.space.md,
    width: "100%",
  },
  containerDesktop: {
    maxWidth: PAGE_MAX_WIDTH,
    paddingHorizontal: TAVORIA.space.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 16,
    minHeight: 40,
    paddingTop: TAVORIA.space.sm,
  },
  headerDesktop: { gap: 0 },
  leftSlot: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    zIndex: 1,
    width: 36,
  },
  leftSlotDesktop: { width: 0 },
  rightSlot: { alignItems: "center", flexDirection: "row", gap: 8, zIndex: 1 },
  title: {
    color: TAVORIA.color.navy,
    flex: 1,
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 24,
    fontWeight: "400",
  },
  titleDesktop: { fontSize: 29 },
  titleMobile: { left: 48, position: "absolute", right: 48, textAlign: "center" },
  accent: { color: TAVORIA.color.orange },
  filterBar: { paddingBottom: 0 },
  filterBarRow: { alignItems: "center", flexDirection: "row", minWidth: 0, width: "100%" },
  filterBarContent: { flex: 1, minWidth: 0 },
  filterBarTrailing: { alignItems: "center", marginLeft: 8 },
  listSurface: {
    backgroundColor: TAVORIA.color.white,
    borderColor: TAVORIA.color.border,
    borderRadius: TAVORIA.radius.medium,
    borderWidth: 1,
    overflow: "hidden",
  },
  listRow: {
    alignItems: "center",
    backgroundColor: "transparent",
    flexDirection: "row",
    gap: 16,
    minHeight: 88,
    paddingHorizontal: 16,
    paddingVertical: 16,
    position: "relative",
  },
  listRowDivider: {
    borderBottomColor: TAVORIA.color.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listRowHovered: { backgroundColor: "#F3F4F0" },
  listRowSelected: { backgroundColor: TAVORIA.color.orangeSoft },
  iconButton: {
    alignItems: "center",
    borderRadius: TAVORIA.radius.small,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  iconButtonHovered: { backgroundColor: "rgba(14,26,36,0.06)" },
  iconButtonPressed: { opacity: 0.72 },
  iconButtonDisabled: { opacity: 0.55 },
  refreshButton: {
    backgroundColor: TAVORIA.color.white,
    borderColor: TAVORIA.color.border,
    borderRadius: TAVORIA.radius.pill,
    borderWidth: 1,
  },
  flowTopBarContainer: { paddingBottom: 0 },
  flowTopBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingVertical: 4,
  },
  flowSide: {
    alignItems: "center",
    borderRadius: TAVORIA.radius.small,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  flowSideHovered: { backgroundColor: "rgba(14,26,36,0.07)" },
  flowSidePressed: { opacity: 0.72 },
  flowCenter: { alignItems: "center", flex: 1, justifyContent: "center" },
  flowDots: { flexDirection: "row", gap: 5 },
  flowDot: { backgroundColor: "rgba(14,26,36,0.16)", borderRadius: 999, height: 4, width: 22 },
  flowDotActive: { backgroundColor: TAVORIA.color.navy },
});
