import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../lib/i18n";

export default function WorkerDone() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.center}>
          <Animated.View
            style={[
              styles.checkCircle,
              { opacity, transform: [{ scale }] },
            ]}
          >
            <Feather name="check" size={56} color="#F7F4EE" />
          </Animated.View>

          <Text style={styles.h1}>
            <Text style={{ color: "#F0531C" }}>
              {t("worker_done.title").charAt(0)}
            </Text>
            {t("worker_done.title").slice(1)}
          </Text>
          <Text style={styles.h2}>{t("worker_done.sub")}</Text>

          <View style={styles.nextBox}>
            <Text style={styles.nextLbl}>WHAT YOU CAN DO</Text>
            <View style={styles.nextRow}>
              <View style={[styles.nextDot, { backgroundColor: "#F0531C" }]}>
                <Feather name="search" size={14} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextH}>Browse venues nearby</Text>
                <Text style={styles.nextSub}>find shifts that match you</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#6B7280" />
            </View>
            <View style={styles.divider} />
            <View style={styles.nextRow}>
              <View style={[styles.nextDot, { backgroundColor: "#0E1A24" }]}>
                <Feather name="camera" size={14} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextH}>Scan a venue's QR</Text>
                <Text style={styles.nextSub}>
                  walk in, scan, apply on the spot
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color="#6B7280" />
            </View>
            <View style={styles.divider} />
            <View style={styles.nextRow}>
              <View style={[styles.nextDot, { backgroundColor: "#E1F5EE" }]}>
                <Feather name="bell" size={14} color="#0F6E56" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextH}>Wait for an offer</Text>
                <Text style={styles.nextSub}>
                  we'll notify you when venues want you
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottom}>
          <Pressable
            style={styles.cta}
            onPress={() => router.push("/candidate")}
          >
            <Feather name="eye" size={18} color="#F7F4EE" />
            <Text style={styles.ctaTxt}>{t("worker_done.preview")}</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => router.replace("/discover")}
          >
            <Text style={styles.secondaryBtnTxt}>{t("worker_done.discover")}</Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/")}>
            <Text style={styles.secondaryTxt}>I'll explore later</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  checkCircle: {
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "#3B6D11",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  h1: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.6,
  },
  h2: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 320,
  },

  nextBox: {
    marginTop: 28,
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  nextLbl: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 2,
  },
  nextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  nextDot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
  },
  nextH: { fontSize: 14, fontWeight: "700", color: "#0E1A24" },
  nextSub: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  divider: { height: 0.5, backgroundColor: "rgba(0,0,0,0.08)", marginVertical: 2 },

  bottom: { gap: 12, alignItems: "center", paddingTop: 8 },
  cta: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0531C",
    borderRadius: 999,
    paddingVertical: 18,
  },
  ctaTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
  },
  secondaryBtnTxt: { color: "#0E1A24", fontSize: 15, fontWeight: "600" },
  secondaryTxt: { color: "#6B7280", fontSize: 14, paddingVertical: 4 },
});

