import { ReactNode } from "react";
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useIsDesktop } from "../lib/responsive";
import { TAVORIA } from "../lib/designTokens";
import { PAGE_MAX_WIDTH } from "./PagePrimitives";

const FOOTER_MAX_WIDTH = PAGE_MAX_WIDTH;

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
  backgroundColor = TAVORIA.color.white,
  style,
}: Props) {
  const isDesktop = useIsDesktop();

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor },
        fullBleed && styles.fullBleed,
        style,
      ]}
    >
      <View
        style={[
          styles.content,
          isDesktop && styles.contentDesktop,
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
    alignSelf: "stretch",
    alignItems: "center",
    borderTopColor: TAVORIA.color.border,
    borderTopWidth: 0.5,
    flexShrink: 0,
    gap: 10,
    zIndex: 10,
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 12,
    width: "100%",
  },
  fullBleed: { alignSelf: "stretch", width: "100%" },
  content: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: TAVORIA.space.md,
    width: "100%",
  },
  contentDesktop: {
    alignSelf: "center",
    maxWidth: FOOTER_MAX_WIDTH,
    paddingHorizontal: TAVORIA.space.lg,
  },
  desktopRow: {
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: TAVORIA.space.sm,
    justifyContent: "center",
  },
});
