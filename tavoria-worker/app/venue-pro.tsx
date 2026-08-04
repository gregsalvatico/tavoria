// Full-screen Tavoria Pro page. Reached by tapping the black Pro card on the
// signed-in venue home. Shows the full value prop and the subscribe CTA.

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../lib/i18n";

export default function VenuePro() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) { router.back(); return; }
            router.replace("/");
          }}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="x" size={24} color="white" />
        </Pressable>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBadge}>
          <Feather name="star" size={14} color="white" />
          <Text style={styles.heroBadgeTxt}>{t("venue_pro.kicker")}</Text>
        </View>

        <Text style={styles.heroTitle}>{t("venue_pro.title")}</Text>
        <Text style={styles.heroSub}>{t("venue_pro.sub")}</Text>

        <View style={styles.comparisonLabel}>
          <Text style={styles.comparisonLabelText}>{t("venue_pro.free_kicker")}</Text>
        </View>
        <View style={styles.freeCard}>
          <View style={styles.freeKickerRow}>
            <Feather name="check-circle" size={14} color="#3B6D11" />
            <Text style={styles.freeKicker}>
              {t("venue_pro.free_kicker")}
            </Text>
          </View>
          <Text style={styles.freeTitle}>{t("venue_pro.free_title")}</Text>
          <View style={styles.freeBullets}>
            <FreeBullet text={t("venue_pro.free_b1")} />
            <FreeBullet text={t("venue_pro.free_b2")} />
          </View>
        </View>

        <View style={styles.comparisonLabel}>
          <Text style={styles.comparisonLabelText}>{t("venue_pro.kicker")}</Text>
        </View>
        <View style={styles.proCard}>
          <ProBullet text={t("venue_pro.bullet1")} />
          <ProBullet text={t("venue_pro.bullet2")} />
          <ProBullet text={t("venue_pro.bullet3")} />
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Text style={styles.price}>{t("venue_pro.price")}</Text>
        <Text style={styles.comingSoon}>{t("common.coming_soon")}</Text>
        <Pressable style={[styles.cta, styles.ctaDisabled]} disabled>
          <Text style={styles.ctaTxt}>{t("venue_pro.cta")}</Text>
          <Feather name="lock" size={18} color="#6B7280" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ProBullet({ text }: { text: string }) {
  return (
    <View style={styles.proBulletRow}>
      <View style={styles.proBulletDot}>
        <Feather name="check" size={14} color="#F0531C" />
      </View>
      <Text style={styles.proBulletTxt}>{text}</Text>
    </View>
  );
}

function FreeBullet({ text }: { text: string }) {
  return (
    <View style={styles.freeBulletRow}>
      <View style={styles.freeBulletDot}>
        <Feather name="check" size={14} color="#3B6D11" />
      </View>
      <Text style={styles.freeBulletTxt}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0E1A24" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },

  scroll: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 24 },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "#F0531C",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  heroBadgeTxt: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  heroTitle: {
    fontFamily: "InstrumentSerif_400Regular",
    color: "white",
    fontSize: 30,
    fontWeight: "400",
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  heroSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 22,
  },

  comparisonLabel: { marginBottom: 8, marginTop: 16 },
  comparisonLabelText: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  proBulletRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  proBulletDot: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,90,31,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  proBulletTxt: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },

  freeCard: {
    backgroundColor: "#EAF3DE",
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
  },
  freeKickerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  freeKicker: {
    color: "#3B6D11",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  freeTitle: {
    color: "#3B6D11",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
    letterSpacing: -0.2,
  },
  freeBullets: { gap: 14, marginTop: 16 },
  freeBulletRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  freeBulletDot: { alignItems: "center", backgroundColor: "rgba(59,109,17,0.13)", borderRadius: 999, height: 28, justifyContent: "center", width: 28 },
  freeBulletTxt: { color: "#3B6D11", flex: 1, fontSize: 15, fontWeight: "600" },
  proCard: { borderColor: "rgba(240,83,28,0.72)", borderRadius: 16, borderWidth: 1, gap: 14, padding: 16 },

  bottom: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: "#0E1A24",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.10)",
    gap: 10,
  },
  price: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  comingSoon: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: -5, textAlign: "center" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F7F4EE",
    borderRadius: 999,
    paddingVertical: 18,
  },
  ctaDisabled: { backgroundColor: "#D9D7D1" },
  ctaTxt: { color: "#0E1A24", fontSize: 16, fontWeight: "800" },
});
