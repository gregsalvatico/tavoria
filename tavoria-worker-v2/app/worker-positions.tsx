import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const SCREEN_W = Dimensions.get("window").width;
const ROLE_TILE_SIZE = (SCREEN_W - 20 * 2 - 8 * 2) / 3;
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../lib/i18n";
import { localizeRole } from "../lib/positions";
import { patchWorkerProfile } from "../lib/workerProfile";

type Role = {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  image: number;
};

const ROLES: Role[] = [
  { id: "Barista", label: "Barista", icon: "coffee", image: require("../assets/position-barista.png") },
  { id: "Waiter", label: "Waiter", icon: "shopping-bag", image: require("../assets/position-waiter.png") },
  { id: "Runner", label: "Runner", icon: "zap", image: require("../assets/position-runner.png") },
  { id: "Cashier", label: "Cashier", icon: "credit-card", image: require("../assets/position-cashier.png") },
  { id: "Host", label: "Host", icon: "smile", image: require("../assets/position-host.png") },
  { id: "Bartender", label: "Bartender", icon: "wind", image: require("../assets/position-bartender.png") },
  { id: "Cook", label: "Cook", icon: "thermometer", image: require("../assets/position-cook.png") },
  { id: "Chef", label: "Chef", icon: "award", image: require("../assets/position-chef.png") },
  { id: "Cleaner", label: "Cleaner", icon: "trash-2", image: require("../assets/position-cleaner.png") },
];

const AGE_RANGES = ["18-20", "21-25", "26-30", "31-40", "41-50", "50+"];

export default function WorkerPositions() {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<string | null>(null);

  const toggleRole = (id: string) =>
    setPicked((cur) =>
      cur.includes(id)
        ? cur.filter((x) => x !== id)
        : cur.length >= 3
        ? cur
        : [...cur, id]
    );

  const canContinue = picked.length > 0 && ageRange !== null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        <Dots step={0} total={2} />
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>
          <Text style={{ color: "#F0531C" }}>
            {t("worker_positions.title").charAt(0)}
          </Text>
          {t("worker_positions.title").slice(1)}
        </Text>
        <Text style={styles.h2}>{t("worker_positions.sub")}</Text>

        <View style={styles.rolesGrid}>
          {ROLES.map((r) => {
            const on = picked.includes(r.id);
            const primary = picked[0] === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => toggleRole(r.id)}
                style={[
                  styles.roleTile,
                  on && (primary ? styles.roleTilePrimary : styles.roleTileOn),
                ]}
              >
                <Image
                  source={r.image}
                  style={styles.roleTileImg}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.roleTileScrim,
                    primary && styles.roleTileScrimPrimary,
                  ]}
                  pointerEvents="none"
                />
                <Text style={styles.roleTileLbl} numberOfLines={1}>
                  {localizeRole(r.id)}
                </Text>
                {on && (
                  <View
                    style={[
                      styles.roleCheck,
                      primary && styles.roleCheckPrimary,
                    ]}
                  >
                    <Feather name="check" size={11} color="white" />
                  </View>
                )}
                {primary && (
                  <View style={styles.primaryTag}>
                    <Text style={styles.primaryTagTxt}>{t("worker_positions.primary_tag")}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{t("worker_positions.age_range")}</Text>
        <View style={styles.chipWrap}>
          {AGE_RANGES.map((r) => {
            const on = ageRange === r;
            return (
              <Pressable
                key={r}
                onPress={() => setAgeRange(r)}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{r}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          disabled={!canContinue}
          onPress={() => {
            patchWorkerProfile({
              positions: picked,
              ageRange: ageRange ?? undefined,
            });
            router.push("/worker-experience");
          }}
          style={[styles.cta, !canContinue && styles.ctaDisabled]}
        >
          <Text style={styles.ctaTxt}>{t("common.continue")}</Text>
          <Feather name="arrow-right" size={20} color="#F7F4EE" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Dots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconBtn: { padding: 4, width: 32 },
  dotsRow: { flexDirection: "row", gap: 5 },
  dot: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(11,15,26,0.15)",
  },
  dotOn: { backgroundColor: "#0E1A24" },

  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 },
  h1: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  h2: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },

  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  roleTile: {
    width: ROLE_TILE_SIZE,
    height: ROLE_TILE_SIZE,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  roleTileOn: { borderColor: "#0E1A24" },
  roleTilePrimary: { borderColor: "#F0531C" },
  roleTileImg: {
    width: "100%",
    height: "100%",
  },
  roleTileScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  roleTileScrimPrimary: {
    backgroundColor: "rgba(255,90,31,0.30)",
  },
  roleTileLbl: {
    position: "absolute",
    bottom: 8,
    left: 4,
    right: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  roleCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
  },
  roleCheckPrimary: { backgroundColor: "white" },
  primaryTag: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryTagTxt: {
    color: "#F0531C",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0E1A24",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  chipOn: { backgroundColor: "#0E1A24", borderColor: "#0E1A24" },
  chipTxt: { fontSize: 13, fontWeight: "600", color: "#0E1A24" },
  chipTxtOn: { color: "white" },

  bottom: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0531C",
    borderRadius: 999,
    paddingVertical: 18,
  },
  ctaDisabled: { backgroundColor: "rgba(11,15,26,0.15)" },
  ctaTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },
});
