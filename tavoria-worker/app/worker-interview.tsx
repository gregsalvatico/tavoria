// 7-question role-based interview QCM.
// Sits between worker-bonus and worker-personality in the bonus profile flow.
// Pulls questions from interviewQuestions.ts based on the worker's picked positions.

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
import { t } from "../lib/i18n";
import {
  InterviewQuestion,
  localizeQuestions,
  pickQuestionsForRoles,
} from "../lib/interviewQuestions";
import { updateCurrentWorker } from "../lib/db";
import {
  InterviewAnswer,
  getWorkerProfile,
  patchWorkerProfile,
} from "../lib/workerProfile";

export default function WorkerInterview() {
  const router = useRouter();
  const profile = getWorkerProfile();
  const positions = profile?.positions ?? [];

  // Lock the question set on mount so re-renders don't reshuffle.
  // Localize at render time using the active i18n locale.
  const questions = useMemo<InterviewQuestion[]>(
    () => localizeQuestions(pickQuestionsForRoles(positions)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const total = questions.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"questions" | "result">("questions");

  // Slide animation for question transitions
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
    // Auto-advance after short delay so they see their selection
    setTimeout(() => {
      if (step + 1 < total) {
        setStep(step + 1);
      } else {
        setPhase("result");
      }
    }, 280);
  };

  const onSaveAndContinue = async () => {
    const completedAt = new Date().toISOString();
    const fullAnswers: InterviewAnswer[] = questions.map((quest) => {
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
    patchWorkerProfile({
      interviewAnswers: fullAnswers,
      interviewCompletedAt: completedAt,
    });
    // Persist to Supabase (don't block UI on error — keep going)
    try {
      await updateCurrentWorker({
        interview_answers: fullAnswers,
        interview_completed_at: completedAt,
      });
    } catch (e) {
      console.warn("[interview] failed to save answers:", e);
    }
    // Back to /worker-bonus so the user sees the interview row turn green
    // and decides whether to continue with the rest or save and finish.
    router.replace("/worker-bonus");
  };

  // ----- RESULT SCREEN -----
  if (phase === "result") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.resultWrap}>
          <View style={styles.resultBadge}>
            <Feather name="check" size={36} color="white" />
          </View>
          <Text style={styles.resultTitle}>
            <Text style={{ color: "#F0531C" }}>{t("interview_ui.worker_done_title").charAt(0)}</Text>
            {t("interview_ui.worker_done_title").slice(1)}
          </Text>
          <Text style={styles.resultSub}>{t("interview_ui.worker_done_sub")}</Text>
        </View>

        <View style={styles.bottom}>
          <Pressable style={styles.cta} onPress={onSaveAndContinue}>
            <Text style={styles.ctaTxt}>{t("common.continue")}</Text>
            <Feather name="arrow-right" size={20} color="#F7F4EE" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ----- QUESTION SCREEN -----
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (step !== 0) { setStep(step - 1); return; }
            if (router.canGoBack()) { router.back(); return; }
            router.replace("/worker-bonus");
          }}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        <Text style={styles.progressTxt}>
          {step + 1} {t("worker_personality.of")} {total}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Progress bar */}
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

  scroll: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28 },

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

  // Result screen
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
    maxWidth: 280,
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
