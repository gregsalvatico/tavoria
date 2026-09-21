import { Modal, Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useIsDesktop } from "../lib/responsive";
import { TAVORIA } from "../lib/designTokens";
import { t } from "../lib/i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelStyle?: StyleProp<ViewStyle>;
};

/**
 * Shared modal frame: bottom sheet on touch devices, constrained dialog on
 * desktop. Content stays owned by the calling screen so headers and controls
 * remain reusable without duplicating the responsive shell.
 */
export default function ResponsiveModal({ visible, onClose, children, panelStyle }: Props) {
  const isDesktop = useIsDesktop();

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType={isDesktop ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      <View style={[styles.root, isDesktop ? styles.desktopRoot : styles.mobileRoot]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("talent.close")} style={styles.backdrop} onPress={onClose} />
        <View style={[styles.panel, isDesktop ? styles.desktopPanel : styles.mobilePanel, panelStyle]}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { elevation: TAVORIA.layer.modal, flex: 1, zIndex: TAVORIA.layer.modal },
  mobileRoot: { justifyContent: "flex-end" },
  desktopRoot: { alignItems: "center", justifyContent: "center", padding: TAVORIA.space.lg },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(14,26,36,0.42)" },
  panel: { backgroundColor: TAVORIA.color.paper, overflow: "hidden", width: "100%" },
  mobilePanel: { borderTopLeftRadius: TAVORIA.radius.large, borderTopRightRadius: TAVORIA.radius.large, maxHeight: "88%" },
  desktopPanel: { borderRadius: TAVORIA.radius.large, maxHeight: "86%", maxWidth: 560 },
});
