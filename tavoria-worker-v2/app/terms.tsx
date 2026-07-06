// Full Terms & Privacy screen.
// Renders 18 sections from the `terms.*` namespace in the active locale.

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../lib/i18n";

const SECTION_IDS = [
  "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9",
  "s10", "s11", "s12", "s13", "s14", "s15", "s16", "s17", "s18",
];

export default function Terms() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        <Text style={styles.headerTitle}>{t("terms.title")}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.meta}>
          {t("terms.last_updated")} · {t("terms.version")}
        </Text>

        <Text style={styles.intro}>{t("terms.intro")}</Text>

        {SECTION_IDS.map((id) => (
          <View key={id} style={styles.section}>
            <Text style={styles.sectionHeading}>{t(`terms.${id}_h`)}</Text>
            <Text style={styles.sectionBody}>{t(`terms.${id}_p`)}</Text>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F1EFE8",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#0E1A24" },

  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  meta: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 20,
    letterSpacing: 0.3,
  },

  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: "#0E1A24",
    marginBottom: 24,
  },

  section: { marginBottom: 22 },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0E1A24",
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#2C3038",
  },
});
