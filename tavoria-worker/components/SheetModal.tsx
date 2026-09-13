import { Feather } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { t } from "../lib/i18n";
import { TAVORIA } from "../lib/designTokens";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  desktop?: boolean;
  headerAction?: React.ReactNode;
};

export default function SheetModal({ visible, title, onClose, children, desktop = false, headerAction }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, { duration: 180, toValue: 1, useNativeDriver: true }).start();
  }, [progress, visible]);

  const translate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [260, 0],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [380, 0],
  });

  const panel = (
    <>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.headerActions}>
          {headerAction}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("talent.close")}
            hitSlop={8}
            onPress={onClose}
            style={styles.close}
          >
            <Feather name="x" size={19} color={TAVORIA.color.navy} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </>
  );

  if (desktop) {
    return visible ? <Animated.View style={[styles.sidebar, { transform: [{ translateX }] }]}>{panel}</Animated.View> : null;
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("talent.close")}
          style={styles.backdrop}
          onPress={onClose}
        />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: translate }] }]}>{panel}</Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(14,26,36,0.42)" },
  sheet: {
    alignSelf: "center",
    backgroundColor: TAVORIA.color.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "84%",
    maxWidth: 680,
    width: "100%",
  },
  sidebar: { backgroundColor: TAVORIA.color.paper, borderLeftColor: TAVORIA.color.borderStrong, borderLeftWidth: 1, flexShrink: 0, height: "100%", width: 380 },
  header: { alignItems: "center", borderBottomColor: TAVORIA.color.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12, paddingTop: TAVORIA.space.lg },
  title: { color: TAVORIA.color.navy, flex: 1, fontFamily: "InstrumentSerif_400Regular", fontSize: 25, lineHeight: 30, minWidth: 0 },
  headerActions: { alignItems: "center", flexDirection: "row", flexShrink: 0, gap: 4 },
  close: { alignItems: "center", height: 36, justifyContent: "center", width: 36 },
  scroll: { flex: 1 },
  content: { gap: 16, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 16 },
});
