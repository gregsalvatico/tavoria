// Full-screen Tavoria Pro page. Reached by tapping the black Pro card on the
// signed-in venue home. Shows the full value prop and the subscribe CTA.

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../lib/i18n";

export default function VenuePro() {
  const router = useRouter();

  const onSubscribe = () => {
    Alert.alert(
      "Coming soon",
      "Pro subscriptions launch with the public release. Drop us a message at hello@tavoriapp.com for early access."
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
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

        <View style={styles.bulletsCol}>
          <ProBullet text={t("venue_pro.bullet1")} />
          <ProBullet text={t("venue_pro.bullet2")} />
          <ProBullet text={t("venue_pro.bullet3")} />
        </View>

        {/* Included card — what stays free */}
        <View style={styles.freeCard}>
          <View style={styles.freeKickerRow}>
            <Feather name="check-circle" size={14} color="#3B6D11" />
            <Text style={styles.freeKicker}>
              {t("venue_pro.free_kicker")}
            </Text>
          </View>
          <Text style={styles.freeTitle}>{t("venue_pro.free_title")}</Text>
          <View style={{ marginTop: 8, gap: 4 }}>
            <FreeBullet text={t("venue_pro.free_b1")} />
            <FreeBullet text={t("venue_pro.free_b2")} />
            <FreeBullet text={t("venue_pro.free_b3")} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Text style={styles.price}>{t("venue_pro.price")}</Text>
        <Pressable style={styles.cta} onPress={onSubscribe}>
          <Text style={styles.ctaTxt}>{t("venue_pro.cta")}</Text>
          <Feather name="arrow-right" size={20} color="#0E1A24" />
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
      <Feather name="check" size={12} color="#3B6D11" />
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
    color: "white",
    fontSize: 30,
    fontWeight: "900",
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

  bulletsCol: { gap: 14, marginBottom: 26 },
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
    marginBottom: 12,
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
  freeBulletRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  freeBulletTxt: { color: "#3B6D11", fontSize: 13, fontWeight: "600" },

  bottom: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#0E1A24",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.10)",
    gap: 10,
  },
  price: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    textAlign: "center",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F7F4EE",
    borderRadius: 999,
    paddingVertical: 18,
  },
  ctaTxt: { color: "#0E1A24", fontSize: 16, fontWeight: "800" },
});
