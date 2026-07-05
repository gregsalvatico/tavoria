// Venue answers the same QCM as workers — picking what their IDEAL candidate
// would answer. Used for two-sided matching later (worker answer match %).
// Same role-based mixer as worker-interview.tsx.

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateVenue } from "../lib/db";
import { t } from "../lib/i18n";
import {
  InterviewQuestion,
  localizeQuestions,
  pickQuestionsForRoles,
} from "../lib/interviewQuestions";
import {
  VenuePreferredAnswer,
  getVenueProfile,
  patchVenueProfile,
} from "../lib/venueProfile";

export default function VenueInterview() {
  const router = useRouter();
  const profile = getVenueProfile();
  // venue.roles uses lowercase labels (e.g. "Barista") matching worker positions
  const roles = profile?.roles ?? [];

  const questions = useMemo<InterviewQuestion[]>(
    () => localizeQuestions(pickQuestionsForRoles(roles)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const total = questions.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"questions" | "result">("questions");
  const [busy, setBusy] = useState(false);

  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slide.setValue(20);
    Animated.timing(slide, {
      toValue: 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, slide]);

  const q = questions[step];

  const onPick = (optId: string) => {
    setAnswers((cur) => ({ ...cur, [q.id]: optId }));
    setTimeout(() => {
      if (step + 1 < total) setStep(step + 1);
      else setPhase("result");
    }, 280);
  };

  const onSkip = () => router.replace("/venue-bonus");

  const onSaveAndContinue = async () => {
    if (busy) return;
    setBusy(true);
    const completedAt = new Date().toISOString();
    const fullAnswers: VenuePreferredAnswer[] = questions.map((quest) => {
      const aId = answers[quest.id];
      const opt = quest.options.find((o) => o.id === aId);
      return {
        q_id: quest.id,
        q_text: quest.text,
        role: quest.role,
        a_id: aId ?? "",
        a_text: opt?.text ?? "",
      };
    });
    patchVenueProfile({
      preferredInterviewAnswers: fullAnswers,
      preferredInterviewCompletedAt: completedAt,
    });
    const venueId = profile?.id;
    if (venueId) {
      try {
        await updateVenue(venueId, {
          preferred_interview_answers: fullAnswers,
          preferred_interview_completed_at: completedAt,
        });
      } catch (e) {
        console.warn("[venue-interview] save failed:", e);
      }
    }
    setBusy(false);
    // Interview saved — back to venue-bonus so they see the green check
    // and pick what to do next (post more / see shifts).
    router.replace("/venue-bonus");
  };

  // ----- RESULT -----
  if (phase === "result") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.resultWrap}>
          <View style={styles.resultBadge}>
            <Feather name="check" size={36} color="white" />
          </View>
          <Text style={styles.resultTitle}>
            <Text style={{ color: "#F0531C" }}>M</Text>atching enabled
          </Text>
          <Text style={styles.resultSub}>
            We&apos;ll prioritise workers whose answers align with what you
            picked — your perfect candidate.
          </Text>
        </View>

        <View style={styles.bottom}>
          <Pressable
            style={[styles.cta, busy && { opacity: 0.6 }]}
            disabled={busy}
            onPress={onSaveAndContinue}
          >
            <Text style={styles.ctaTxt}>{t("common.continue")}</Text>
            <Feather name="arrow-right" size={20} color="#F7F4EE" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ----- QUESTION -----
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (step !== 0) { setStep(step - 1); return; }
            if (router.canGoBack()) { router.back(); return; }
            router.replace("/venue-bonus");
          }}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        <Text style={styles.progressTxt}>
          {step + 1} {t("worker_personality.of")} {total}
        </Text>
        <Pressable onPress={onSkip} hitSlop={8}>
          <Text style={styles.skipTopTxt}>{t("interview_ui.skip")}</Text>
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${((step + 1) / total) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Framing banner — different from worker side */}
        {step === 0 && (
          <View style={styles.framingBanner}>
            <View style={styles.framingIcon}>
              <Feather name="target" size={18} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.framingTitle}>{t("interview_ui.venue_framing_title")}</Text>
              <Text style={styles.framingSub}>{t("interview_ui.venue_framing_sub")}</Text>
            </View>
          </View>
        )}

        <View style={styles.roleChip}>
          <Feather name="briefcase" size={12} color="#854F0B" />
          <Text style={styles.roleChipTxt}>{q.role}</Text>
        </View>

        <Animated.View style={{ transform: [{ translateY: slide }] }}>
          <Text style={styles.questionTxt}>{q.text}</Text>

          <View style={styles.optionsCol}>
            {q.options.map((opt) => {
              const on = answers[q.id] === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => onPick(opt.id)}
                  style={[styles.optionRow, on && styles.optionRowOn]}
                >
                  <View style={[styles.optionDot, on && styles.optionDotOn]}>
                    {on && <Feather name="check" size={14} color="white" />}
                  </View>
                  <Text
                    style={[styles.optionTxt, on && styles.optionTxtOn]}
                  >
                    {opt.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
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
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconBtn: { padding: 4, width: 32 },
  progressTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  skipTopTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
  },

  progressTrack: {
    height: 4,
    marginHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "rgba(11,15,26,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#F0531C",
    borderRadius: 999,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28 },

  framingBanner: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: "#F0531C",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  framingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  framingTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  framingSub: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },

  roleChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FAEEDA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  roleChipTxt: {
    color: "#854F0B",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  questionTxt: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 22,
  },

  optionsCol: { gap: 10 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  optionRowOn: {
    borderColor: "#F0531C",
    backgroundColor: "#FFF4EE",
  },
  optionDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(11,15,26,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionDotOn: {
    borderColor: "#F0531C",
    backgroundColor: "#F0531C",
  },
  optionTxt: {
    flex: 1,
    fontSize: 14,
    color: "#0E1A24",
    fontWeight: "500",
    lineHeight: 20,
  },
  optionTxtOn: { fontWeight: "700" },

  resultWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  resultBadge: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: "#3B6D11",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  resultSub: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },

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
  ctaTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },
});
