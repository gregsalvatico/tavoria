import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentWorkerFull } from "../lib/db";
import { t } from "../lib/i18n";
import { getWorkerProfile, patchWorkerProfile } from "../lib/workerProfile";

type ItemKey = "interview" | "personality" | "videos" | "photos" | "documents";

type Item = {
  key: ItemKey;
  icon: keyof typeof Feather.glyphMap;
  lblKey: string;
  subKey: string;
  doneSubKey?: string;
  route: string;
};

const ITEMS: Item[] = [
  {
    key: "interview",
    icon: "message-square",
    lblKey: "worker_bonus.interview_qs",
    subKey: "worker_bonus.interview_qs_sub",
    doneSubKey: "worker_bonus.interview_qs_done",
    route: "/worker-interview",
  },
  {
    key: "personality",
    icon: "compass",
    lblKey: "worker_bonus.personality_test",
    subKey: "worker_bonus.personality_test_sub",
    doneSubKey: "worker_bonus.personality_test_done",
    route: "/worker-personality",
  },
  {
    key: "videos",
    icon: "video",
    lblKey: "worker_bonus.more_videos",
    subKey: "worker_bonus.more_videos_sub",
    route: "/worker-videos",
  },
  {
    key: "photos",
    icon: "image",
    lblKey: "worker_bonus.more_photos",
    subKey: "worker_bonus.more_photos_sub",
    route: "/worker-photos",
  },
  {
    key: "documents",
    icon: "file-text",
    lblKey: "worker_bonus.documents",
    subKey: "worker_bonus.documents_sub",
    route: "/worker-photos",
  },
];

export default function WorkerBonus() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = params.mode === "edit";
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Track completion state — re-checked on every focus so green checks update
  // when the user comes back from /worker-interview or /worker-personality.
  const [done, setDone] = useState<Record<ItemKey, boolean>>({
    interview: false,
    personality: false,
    videos: false,
    photos: false,
    documents: false,
  });

  const refresh = useCallback(async () => {
    // First take whatever's in the in-memory cache (fast paint)
    const p = getWorkerProfile();
    setDone({
      interview: !!(p?.interviewAnswers && p.interviewAnswers.length > 0),
      personality: !!(p?.personality && p.personality.length > 0),
      videos: false,
      photos: false,
      documents: false,
    });
    // Then hydrate from Supabase so saved progress shows even after an app
    // restart (when the in-memory cache is empty).
    try {
      const w = await getCurrentWorkerFull();
      if (!w) return;
      patchWorkerProfile({
        interviewAnswers: w.interview_answers ?? undefined,
        interviewCompletedAt: w.interview_completed_at ?? undefined,
        personality: w.personality ?? undefined,
        strengths: w.strengths ?? undefined,
        photoUrl: w.photo_url ?? undefined,
        videoUrl: w.video_url ?? undefined,
      });
      setDone({
        interview: Array.isArray(w.interview_answers) && w.interview_answers.length > 0,
        personality: Array.isArray(w.personality) && w.personality.length > 0,
        videos: false,
        photos: false,
        documents: false,
      });
    } catch (e) {
      console.warn("[worker-bonus] hydrate failed:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

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

  // Next incomplete step — the CTA at the bottom jumps to this
  const nextItem = ITEMS.find((it) => !done[it.key]) ?? ITEMS[0];
  const allDone = ITEMS.every((it) => done[it.key]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) { router.back(); return; }
              router.replace("/");
            }}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Feather name="chevron-left" size={26} color="#0E1A24" />
          </Pressable>
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotOn]} />
            <View style={[styles.dot, styles.dotOn]} />
          </View>
          <View style={{ width: 32 }} />
        </View>

        <Animated.View
          style={[styles.checkCircle, { opacity, transform: [{ scale }] }]}
        >
          <Feather name="check" size={48} color="#F7F4EE" />
        </Animated.View>

        <Text style={styles.h1}>
          <Text style={{ color: "#F0531C" }}>
            {t("worker_bonus.title").charAt(0)}
          </Text>
          {t("worker_bonus.title").slice(1)}
        </Text>
        <Text style={styles.h2}>{t("worker_bonus.sub")}</Text>

        {isEditMode ? (
          <Pressable
            style={styles.editBanner}
            onPress={() => router.push("/worker-positions")}
          >
            <View style={styles.editBannerIcon}>
              <Feather name="refresh-cw" size={18} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.editBannerTitle}>
                {t("worker_bonus.edit_banner_title")}
              </Text>
              <Text style={styles.editBannerSub}>
                {t("worker_bonus.edit_banner_sub")}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="white" />
          </Pressable>
        ) : (
          <View style={styles.boostBanner}>
            <View style={styles.boostBannerIcon}>
              <Feather name="trending-up" size={18} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.boostTitle}>
                {t("worker_bonus.boost_title")}
              </Text>
              <Text style={styles.boostSub}>
                {t("worker_bonus.boost_sub")}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.listLbl}>{t("worker_bonus.list_lbl")}</Text>
        <View style={styles.itemsCol}>
          {ITEMS.map((it) => {
            const isDone = done[it.key];
            return (
              <Pressable
                key={it.key}
                onPress={() => router.push(it.route as any)}
                style={[styles.itemRow, isDone && styles.itemRowDone]}
              >
                <View
                  style={[styles.itemIcon, isDone && styles.itemIconDone]}
                >
                  <Feather
                    name={isDone ? "check" : it.icon}
                    size={16}
                    color={isDone ? "white" : "#F0531C"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemLbl, isDone && styles.itemLblDone]}>
                    {t(it.lblKey)}
                  </Text>
                  <Text style={[styles.itemSub, isDone && styles.itemSubDone]}>
                    {isDone && it.doneSubKey ? t(it.doneSubKey) : t(it.subKey)}
                  </Text>
                </View>
                {isDone ? (
                  <Feather name="check-circle" size={18} color="#3B6D11" />
                ) : (
                  <Ionicons name="sparkles" size={16} color="#D4A24C" />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 14 }} />
      </ScrollView>

      <View style={styles.bottom}>
        {!allDone && (
          <Pressable
            style={styles.cta}
            onPress={() => router.push(nextItem.route as any)}
          >
            <Text style={styles.ctaTxt}>
              {done.interview
                ? t("worker_bonus.continue_next")
                : t("worker_bonus.complete")}
            </Text>
            <Feather name="arrow-right" size={20} color="#F7F4EE" />
          </Pressable>
        )}
        <Pressable
          style={styles.skipBtn}
          onPress={() => router.replace("/worker-done")}
        >
          <Text style={styles.skipBtnTxt}>
            {allDone ? t("common.done") : t("worker_bonus.save_finish")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  checkCircle: {
    alignSelf: "center",
    width: 88,
    height: 88,
    borderRadius: 999,
    backgroundColor: "#3B6D11",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 18,
  },

  h1: {
    fontSize: 30,
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

  boostBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0531C",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
  },
  boostBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  boostTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  boostSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },

  // Edit-mode banner — shown when the user came from "Edit" on their card
  editBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#185FA5",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
  },
  editBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  editBannerTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  editBannerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
  },

  listLbl: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 1.2,
    marginTop: 22,
    marginBottom: 10,
    textAlign: "center",
  },
  itemsCol: { gap: 8 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  // Completed row: green border + soft green tint
  itemRowDone: {
    backgroundColor: "#EAF3DE",
    borderColor: "rgba(59,109,17,0.45)",
    borderWidth: 1.5,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFF4EE",
    justifyContent: "center",
    alignItems: "center",
  },
  itemIconDone: {
    backgroundColor: "#3B6D11",
  },
  itemLbl: { fontSize: 14, fontWeight: "700", color: "#0E1A24" },
  itemLblDone: { color: "#3B6D11" },
  itemSub: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  itemSubDone: { color: "#3B6D11", fontWeight: "600" },

  bottom: {
    padding: 16,
    gap: 10,
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
  ctaTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },
  skipBtn: { alignItems: "center", paddingVertical: 8 },
  skipBtnTxt: { color: "#6B7280", fontSize: 14, fontWeight: "600" },
});
