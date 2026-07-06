// Shown after a venue posts their first shift. Mirrors /worker-bonus.
// Contains the "ideal candidate" interview tile and a list of next actions.

import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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
import { supabase } from "../lib/supabase";
import { t } from "../lib/i18n";
import { getVenueProfile, patchVenueProfile } from "../lib/venueProfile";

export default function VenueBonus() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [interviewDone, setInterviewDone] = useState(false);

  // Hydrate the interview-done flag from in-memory cache + Supabase
  const refresh = useCallback(async () => {
    const local = getVenueProfile();
    if (
      local?.preferredInterviewAnswers &&
      local.preferredInterviewAnswers.length > 0
    ) {
      setInterviewDone(true);
    }
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) return;
      const { data, error } = await supabase
        .from("venues")
        .select("preferred_interview_answers")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) return;
      if (
        Array.isArray(data?.preferred_interview_answers) &&
        data.preferred_interview_answers.length > 0
      ) {
        patchVenueProfile({
          preferredInterviewAnswers: data.preferred_interview_answers as any,
        });
        setInterviewDone(true);
      }
    } catch (e) {
      console.warn("[venue-bonus] hydrate failed:", e);
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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.replace("/")}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Feather name="x" size={24} color="#0E1A24" />
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
            {t("venue_bonus.title").charAt(0)}
          </Text>
          {t("venue_bonus.title").slice(1)}
        </Text>
        <Text style={styles.h2}>{t("venue_bonus.sub")}</Text>

        <Text style={styles.listLbl}>{t("venue_bonus.list_lbl")}</Text>

        {/* Ideal candidate interview tile */}
        <Pressable
          onPress={() => router.push("/venue-interview")}
          style={[styles.itemRow, interviewDone && styles.itemRowDone]}
        >
          <View style={[styles.itemIcon, interviewDone && styles.itemIconDone]}>
            <Feather
              name={interviewDone ? "check" : "message-square"}
              size={16}
              color={interviewDone ? "white" : "#F0531C"}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemLbl, interviewDone && styles.itemLblDone]}>
              {t("venue_bonus.interview_qs")}
            </Text>
            <Text style={[styles.itemSub, interviewDone && styles.itemSubDone]}>
              {interviewDone
                ? t("venue_bonus.interview_qs_done")
                : t("venue_bonus.interview_qs_sub")}
            </Text>
          </View>
          {interviewDone ? (
            <Feather name="check-circle" size={18} color="#3B6D11" />
          ) : (
            <Feather name="chevron-right" size={18} color="#6B7280" />
          )}
        </Pressable>

        {/* Post another shift */}
        <Pressable
          onPress={() => router.push("/venue-photo")}
          style={styles.itemRow}
        >
          <View style={[styles.itemIcon, { backgroundColor: "#FFF4EE" }]}>
            <Feather name="plus" size={16} color="#F0531C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemLbl}>{t("venue_bonus.continue_post")}</Text>
            <Text style={styles.itemSub}>
              {t("venue_bonus.continue_post_sub")}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="#6B7280" />
        </Pressable>

        {/* See my shifts */}
        <Pressable
          onPress={() => router.push("/venue-shifts")}
          style={styles.itemRow}
        >
          <View style={[styles.itemIcon, { backgroundColor: "#E6F1FB" }]}>
            <Feather name="list" size={16} color="#185FA5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemLbl}>{t("venue_bonus.see_post")}</Text>
            <Text style={styles.itemSub}>
              {t("venue_bonus.see_post_sub")}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="#6B7280" />
        </Pressable>

        <View style={{ height: 14 }} />
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          onPress={() => router.replace("/")}
          style={styles.skipBtn}
        >
          <Text style={styles.skipBtnTxt}>{t("venue_bonus.save_finish")}</Text>
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

  listLbl: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 1.2,
    marginTop: 28,
    marginBottom: 10,
    textAlign: "center",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
    marginBottom: 8,
  },
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
  itemIconDone: { backgroundColor: "#3B6D11" },
  itemLbl: { fontSize: 14, fontWeight: "700", color: "#0E1A24" },
  itemLblDone: { color: "#3B6D11" },
  itemSub: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  itemSubDone: { color: "#3B6D11", fontWeight: "600" },

  bottom: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipBtnTxt: { color: "#6B7280", fontSize: 14, fontWeight: "600" },
});
