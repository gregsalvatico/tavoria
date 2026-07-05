import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../lib/i18n";

export default function Applied() {
  const router = useRouter();
  const { venueName } = useLocalSearchParams<{ venueName?: string }>();
  const venueLbl = (venueName || "The venue").trim();
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
            style={[styles.checkCircle, { transform: [{ scale }], opacity }]}
          >
            <Feather name="check" size={56} color="#F7F4EE" />
          </Animated.View>

          <Text style={styles.h1}>
            <Text style={{ color: "#F0531C" }}>
              {t("applied.title").charAt(0)}
            </Text>
            {t("applied.title").slice(1)}
          </Text>
          <Text style={styles.h2}>{t("applied.sub")}</Text>

          <View style={styles.timelineCard}>
            <Step
              icon="check"
              label="Application sent"
              meta="now"
              done
            />
            <Connector />
            <Step
              icon="eye"
              label={`${venueLbl} reviews you`}
              meta="usually within an hour"
            />
            <Connector />
            <Step
              icon="bell"
              label="You get a push notification"
              meta="hire offer · interview · or pass"
            />
          </View>

          <View style={styles.tipBox}>
            <Feather name="zap" size={14} color="#854F0B" />
            <Text style={styles.tipTxt}>
              Tip: keep notifications on. Same-day hires happen fast.
            </Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.replace("/discover")}
          >
            <Text style={styles.primaryBtnTxt}>{t("home.browse")}</Text>
            <Feather name="arrow-right" size={20} color="#F7F4EE" />
          </Pressable>
          <Pressable onPress={() => router.replace("/")}>
            <Text style={styles.secondaryTxt}>{t("common.done")}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Step({
  icon,
  label,
  meta,
  done,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  meta: string;
  done?: boolean;
}) {
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepIcon,
          done ? styles.stepIconDone : styles.stepIconPending,
        ]}
      >
        <Feather
          name={icon}
          size={14}
          color={done ? "#F7F4EE" : "#6B7280"}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepLabel}>{label}</Text>
        <Text style={styles.stepMeta}>{meta}</Text>
      </View>
    </View>
  );
}

function Connector() {
  return <View style={styles.connector} />;
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
  },

  timelineCard: {
    marginTop: 28,
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  step: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  stepIconDone: { backgroundColor: "#3B6D11" },
  stepIconPending: { backgroundColor: "#E9E7DF" },
  stepLabel: { fontSize: 14, fontWeight: "600", color: "#0E1A24" },
  stepMeta: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  connector: {
    width: 2,
    height: 16,
    backgroundColor: "#E9E7DF",
    marginLeft: 13,
    marginVertical: 2,
  },

  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: "#FAEEDA",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  tipTxt: { color: "#854F0B", fontSize: 12, flex: 1 },

  bottom: { gap: 14, paddingTop: 8, paddingBottom: 8, alignItems: "center" },
  primaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E1A24",
    borderRadius: 999,
    paddingVertical: 18,
    gap: 8,
  },
  primaryBtnTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },
  secondaryTxt: { color: "#6B7280", fontSize: 14, paddingVertical: 4 },
});
