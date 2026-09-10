import { ReactNode } from "react";
import {
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { useIsDesktop } from "../lib/responsive";

type Props = {
  children: ReactNode;
  desktopRow?: boolean;
  fullBleed?: boolean;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

/** Keeps page actions visible while the page content scrolls underneath. */
export default function StickyFooter({
  children,
  desktopRow = false,
  fullBleed = false,
  backgroundColor = "white",
  style,
}: Props) {
  const isDesktop = useIsDesktop();
  const { width } = useWindowDimensions();
  const flowWidth = Math.max(0, width - 286);
  const constrainedWidth = Math.min(flowWidth, 940);
  const bleed = Math.max(0, (flowWidth - constrainedWidth) / 2);

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor },
        fullBleed && isDesktop && bleed > 0 && {
          alignSelf: "flex-start",
          marginLeft: -bleed,
          width: flowWidth,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.content,
          desktopRow && isDesktop && styles.desktopRow,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: "center",
    borderTopColor: "rgba(14,26,36,0.10)",
    borderTopWidth: 0.5,
    flexShrink: 0,
    gap: 10,
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 16,
  },
  content: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    width: "100%",
  },
  desktopRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
  },
});
