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
import { updateCurrentWorker } from "../lib/db";
import { t } from "../lib/i18n";
import { patchWorkerProfile } from "../lib/workerProfile";

type Option = {
  label: string;
  traits: string[];
  icon: keyof typeof Feather.glyphMap;
  hue: string;
};
type Q = { scenario: string; question: string; options: Option[] };

// Reusable hue palette
const HUE = {
  orange: { bg: "#FFF4EE", fg: "#993C1D" },
  purple: { bg: "#EEEDFE", fg: "#3C3489" },
  teal: { bg: "#E1F5EE", fg: "#0F6E56" },
  blue: { bg: "#E6F1FB", fg: "#0C447C" },
  amber: { bg: "#FAEEDA", fg: "#854F0B" },
  pink: { bg: "#FBEAF0", fg: "#72243E" },
  gray: { bg: "#F1EFE8", fg: "#444441" },
  green: { bg: "#EAF3DE", fg: "#3B6D11" },
  red: { bg: "#FCEBEB", fg: "#791F1F" },
};

// Canonical, non-localized shape for each question.
// `iconHue` carries the visual config; `traits` are identifiers (not user-visible).
type QSpec = {
  options: { traits: string[]; icon: keyof typeof Feather.glyphMap; hue: string }[];
};

const QUESTION_SPECS: QSpec[] = [
  {
    options: [
      { traits: ["Energetic", "Confident", "Stress resistance"], icon: "zap", hue: "orange" },
      { traits: ["Calm", "Reliable", "Accuracy"], icon: "feather", hue: "blue" },
      { traits: ["Teamwork", "Communication"], icon: "users", hue: "teal" },
      { traits: ["Leadership", "Initiative"], icon: "award", hue: "purple" },
    ],
  },
  {
    options: [
      { traits: ["Customer service", "Friendly"], icon: "heart", hue: "pink" },
      { traits: ["Active listening", "Patient"], icon: "headphones", hue: "blue" },
      { traits: ["Professional", "Honest"], icon: "shield", hue: "gray" },
      { traits: ["Bubbly", "Cheerful"], icon: "smile", hue: "amber" },
    ],
  },
  {
    options: [
      { traits: ["Energetic", "Cheerful"], icon: "sun", hue: "orange" },
      { traits: ["Detail-oriented", "Calm"], icon: "moon", hue: "blue" },
      { traits: ["Stress resistance", "Confident"], icon: "trending-up", hue: "red" },
      { traits: ["Patient", "Detail-oriented"], icon: "eye", hue: "teal" },
    ],
  },
  {
    options: [
      { traits: ["Patient", "Reliable"], icon: "book-open", hue: "blue" },
      { traits: ["Initiative", "Confident"], icon: "play", hue: "orange" },
      { traits: ["Teamwork", "Communication"], icon: "users", hue: "teal" },
      { traits: ["Communication", "Initiative"], icon: "message-circle", hue: "purple" },
    ],
  },
  {
    options: [
      { traits: ["Communication", "Honest"], icon: "message-circle", hue: "purple" },
      { traits: ["Reliable", "Teamwork"], icon: "anchor", hue: "blue" },
      { traits: ["Professional", "Honest"], icon: "shield", hue: "gray" },
      { traits: ["Leadership", "Patient"], icon: "award", hue: "purple" },
    ],
  },
  {
    options: [
      { traits: ["Customer service", "Detail-oriented"], icon: "bookmark", hue: "amber" },
      { traits: ["Active listening", "Friendly"], icon: "eye", hue: "blue" },
      { traits: ["Speed", "Accuracy"], icon: "zap", hue: "orange" },
      { traits: ["Friendly", "Bubbly"], icon: "smile", hue: "pink" },
    ],
  },
  {
    options: [
      { traits: ["Bubbly", "Energetic"], icon: "users", hue: "orange" },
      { traits: ["Calm", "Patient"], icon: "moon", hue: "blue" },
      { traits: ["Energetic", "Stress resistance"], icon: "activity", hue: "green" },
      { traits: ["Detail-oriented", "Patient"], icon: "coffee", hue: "amber" },
    ],
  },
  {
    options: [
      { traits: ["Reliable", "Honest"], icon: "shield", hue: "blue" },
      { traits: ["Energetic", "Bubbly"], icon: "zap", hue: "orange" },
      { traits: ["Detail-oriented", "Accuracy"], icon: "target", hue: "purple" },
      { traits: ["Friendly", "Customer service"], icon: "heart", hue: "pink" },
    ],
  },
  {
    options: [
      { traits: ["Patient", "Customer service"], icon: "heart", hue: "pink" },
      { traits: ["Professional", "Efficient"], icon: "shield", hue: "gray" },
      { traits: ["Friendly", "Warmth"], icon: "smile", hue: "amber" },
      { traits: ["Teamwork", "Honest"], icon: "users", hue: "teal" },
    ],
  },
  {
    options: [
      { traits: ["Patient", "Focused"], icon: "feather", hue: "blue" },
      { traits: ["Energetic", "Adaptable"], icon: "shuffle", hue: "orange" },
      { traits: ["Speed", "Accuracy"], icon: "zap", hue: "amber" },
      { traits: ["Detail-oriented", "Pride"], icon: "target", hue: "purple" },
    ],
  },
  {
    options: [
      { traits: ["Detail-oriented", "Reliable"], icon: "book-open", hue: "blue" },
      { traits: ["Curious", "Engaged"], icon: "coffee", hue: "amber" },
      { traits: ["Organized", "Initiative"], icon: "edit-3", hue: "teal" },
      { traits: ["Curious", "Communication"], icon: "message-circle", hue: "purple" },
    ],
  },
  {
    options: [
      { traits: ["Professional", "Honest"], icon: "shield", hue: "blue" },
      { traits: ["Adaptable", "Customer service"], icon: "heart", hue: "pink" },
      { traits: ["Initiative", "Leadership"], icon: "trending-up", hue: "orange" },
      { traits: ["Critical", "Professional"], icon: "help-circle", hue: "gray" },
    ],
  },
  {
    options: [
      { traits: ["Energetic", "Confident"], icon: "zap", hue: "orange" },
      { traits: ["Focused", "Engaged"], icon: "clock", hue: "blue" },
      { traits: ["Bubbly", "Friendly"], icon: "smile", hue: "amber" },
      { traits: ["Detail-oriented", "Pride"], icon: "award", hue: "purple" },
    ],
  },
  {
    options: [
      { traits: ["Energetic", "Bubbly"], icon: "volume-2", hue: "orange" },
      { traits: ["Patient", "Detail-oriented"], icon: "moon", hue: "blue" },
      { traits: ["Speed", "Accuracy"], icon: "zap", hue: "red" },
      { traits: ["Teamwork", "Friendly"], icon: "users", hue: "teal" },
    ],
  },
  {
    options: [
      { traits: ["Teamwork", "Bubbly"], icon: "users", hue: "orange" },
      { traits: ["Calm", "Pride"], icon: "feather", hue: "blue" },
      { traits: ["Detail-oriented", "Initiative"], icon: "edit-3", hue: "purple" },
      { traits: ["Friendly", "Customer service"], icon: "message-circle", hue: "pink" },
    ],
  },
  {
    options: [
      { traits: ["Leadership", "Initiative"], icon: "home", hue: "orange" },
      { traits: ["Detail-oriented", "Expertise"], icon: "award", hue: "purple" },
      { traits: ["Leadership", "Teamwork"], icon: "users", hue: "teal" },
      { traits: ["Pride", "Friendly"], icon: "heart", hue: "pink" },
    ],
  },
];

// Build the fully-localized QUESTIONS array by zipping spec (icon/hue/traits)
// with translated strings (scenario/question/option labels).
function buildQuestions(): Q[] {
  return QUESTION_SPECS.map((spec, i) => {
    const key = `personality.q${String(i + 1).padStart(2, "0")}`;
    return {
      scenario: t(`${key}.scenario`),
      question: t(`${key}.question`),
      options: spec.options.map((opt, j) => ({
        label: t(`${key}.opt_${j + 1}`),
        traits: opt.traits,
        icon: opt.icon,
        hue: opt.hue,
      })),
    };
  });
}

export default function WorkerPersonality() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  // Built once per render — t() reads the current locale.
  const QUESTIONS = useMemo(() => buildQuestions(), []);
  const total = QUESTIONS.length;
  const dnaTitle = t("personality.dna_title");
  const dnaTitleFirst = dnaTitle.charAt(0);
  const dnaTitleRest = dnaTitle.slice(1);

  // Slide animation between questions
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    slide.setValue(40);
    fade.setValue(0);
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step, done, fade, slide]);

  const traits = useMemo(() => {
    const counts: Record<string, number> = {};
    picks.forEach((opt, qi) => {
      QUESTIONS[qi].options[opt].traits.forEach((tr) => {
        counts[tr] = (counts[tr] ?? 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([trait]) => trait);
  }, [picks, QUESTIONS]);

  const onPick = (idx: number) => {
    const next = [...picks, idx];
    setPicks(next);
    if (step + 1 >= total) setDone(true);
    else setStep(step + 1);
  };

  const onSave = async () => {
    const top = traits.slice(0, 8);
    const rest = traits.slice(8, 16);
    patchWorkerProfile({ personality: top, strengths: rest });
    // Persist to Supabase so admin/venue can see it (don't block on error)
    try {
      await updateCurrentWorker({ personality: top, strengths: rest });
    } catch (e) {
      console.warn("[personality] failed to save:", e);
    }
    // Back to /worker-bonus so the user sees personality turn green
    // and decides whether to continue with videos/photos or save and finish.
    router.replace("/worker-bonus");
  };

  const progressPct = ((step + (done ? 1 : 0)) / total) * 100;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (done) setDone(false);
            else if (step > 0) {
              setStep(step - 1);
              setPicks(picks.slice(0, -1));
            } else router.back();
          }}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotOn]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={{ width: 32 }} />
      </View>

      {!done ? (
        <>
          {/* Quiz progress bar — at top, animated fill */}
          <View style={styles.quizProgressWrap}>
            <View style={styles.quizProgressTrack}>
              <View
                style={[
                  styles.quizProgressFill,
                  { width: `${progressPct}%` },
                ]}
              />
            </View>
            <Text style={styles.quizProgressTxt}>
              {step + 1} {t("worker_personality.of")} {total}
            </Text>
          </View>

          <Animated.View
            style={{
              flex: 1,
              opacity: fade,
              transform: [{ translateX: slide }],
            }}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.scenarioBox}>
                <View style={styles.quoteMark}>
                  <Text style={styles.quoteMarkTxt}>"</Text>
                </View>
                <Text style={styles.scenarioTxt}>
                  {QUESTIONS[step].scenario}
                </Text>
              </View>

              <Text style={styles.h1}>{QUESTIONS[step].question}</Text>

              <View style={styles.optionsCol}>
                {QUESTIONS[step].options.map((opt, i) => {
                  const hue = HUE[opt.hue as keyof typeof HUE];
                  return (
                    <Pressable
                      key={i}
                      onPress={() => onPick(i)}
                      style={({ pressed }) => [
                        styles.optionCard,
                        pressed && styles.optionCardPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.optionIconWrap,
                          { backgroundColor: hue.bg },
                        ]}
                      >
                        <Feather
                          name={opt.icon}
                          size={20}
                          color={hue.fg}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionTxt}>{opt.label}</Text>
                      </View>
                      <Feather
                        name="chevron-right"
                        size={18}
                        color="#6B7280"
                      />
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ height: 12 }} />
            </ScrollView>
          </Animated.View>
        </>
      ) : (
        // Results view
        <Animated.View
          style={{
            flex: 1,
            opacity: fade,
            transform: [{ translateX: slide }],
          }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.resultIconWrap}>
              <View style={styles.resultIconInner}>
                <Feather name="award" size={32} color="white" />
              </View>
            </View>
            <Text style={styles.resultTitle}>
              <Text style={{ color: "#F0531C" }}>{dnaTitleFirst}</Text>
              {dnaTitleRest}
            </Text>
            <Text style={styles.resultSub}>
              {t("personality.dna_sub", { n: total })}
            </Text>

            <View style={styles.primaryTraitBox}>
              <Text style={styles.primaryTraitLbl}>
                {t("personality.dominant")}
              </Text>
              <Text style={styles.primaryTraitTxt}>{traits[0] ?? "—"}</Text>
            </View>

            <Text style={styles.resultLbl}>{t("personality.strong_in")}</Text>
            <View style={styles.traitsRow}>
              {traits.slice(1, 7).map((tr) => (
                <View key={tr} style={styles.traitBig}>
                  <Text style={styles.traitBigTxt}>{tr}</Text>
                </View>
              ))}
            </View>

            {traits.length > 7 && (
              <>
                <Text style={styles.resultLbl}>
                  {t("personality.also_you")}
                </Text>
                <View style={styles.traitsRow}>
                  {traits.slice(7, 15).map((tr) => (
                    <View key={tr} style={styles.traitSmall}>
                      <Text style={styles.traitSmallTxt}>{tr}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Pressable
              style={styles.retakeBtn}
              onPress={() => {
                setPicks([]);
                setStep(0);
                setDone(false);
              }}
            >
              <Feather name="rotate-ccw" size={14} color="#185FA5" />
              <Text style={styles.retakeTxt}>{t("personality.retake")}</Text>
            </Pressable>

            <View style={{ height: 14 }} />
          </ScrollView>
        </Animated.View>
      )}

      {done && (
        <View style={styles.bottom}>
          <Pressable onPress={onSave} style={styles.cta}>
            <Text style={styles.ctaTxt}>{t("common.continue")}</Text>
            <Feather name="arrow-right" size={20} color="#F7F4EE" />
          </Pressable>
        </View>
      )}
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
  dotsRow: { flexDirection: "row", gap: 5 },
  dot: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(11,15,26,0.15)",
  },
  dotOn: { backgroundColor: "#0E1A24" },

  quizProgressWrap: { paddingHorizontal: 20, marginTop: 4, marginBottom: 6 },
  quizProgressTrack: {
    height: 6,
    backgroundColor: "rgba(11,15,26,0.10)",
    borderRadius: 999,
    overflow: "hidden",
  },
  quizProgressFill: {
    height: "100%",
    backgroundColor: "#F0531C",
    borderRadius: 999,
  },
  quizProgressTxt: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    textAlign: "center",
    letterSpacing: 0.8,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },

  scenarioBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
    marginBottom: 14,
  },
  quoteMark: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#FFF4EE",
    justifyContent: "center",
    alignItems: "center",
  },
  quoteMarkTxt: {
    color: "#F0531C",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24,
    marginTop: -4,
  },
  scenarioTxt: {
    flex: 1,
    color: "#0E1A24",
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 19,
  },

  h1: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.5,
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 6,
  },

  optionsCol: { marginTop: 14, gap: 8 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  optionCardPressed: {
    backgroundColor: "#F1EFE8",
    transform: [{ scale: 0.99 }],
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  optionTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0E1A24",
    lineHeight: 19,
  },

  // Results
  resultIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: "#FFF4EE",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 16,
  },
  resultIconInner: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0E1A24",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  resultSub: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },

  primaryTraitBox: {
    marginTop: 22,
    backgroundColor: "#F0531C",
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  primaryTraitLbl: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 1.4,
  },
  primaryTraitTxt: {
    fontSize: 32,
    fontWeight: "900",
    color: "white",
    marginTop: 4,
    letterSpacing: -0.5,
  },

  resultLbl: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 1.4,
    marginTop: 22,
    marginBottom: 10,
    textAlign: "center",
  },
  traitsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  traitBig: {
    backgroundColor: "#EEEDFE",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  traitBigTxt: { color: "#3C3489", fontSize: 14, fontWeight: "700" },
  traitSmall: {
    backgroundColor: "#E1F5EE",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  traitSmallTxt: { color: "#0F6E56", fontSize: 12, fontWeight: "600" },

  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 22,
    paddingVertical: 10,
  },
  retakeTxt: { color: "#185FA5", fontSize: 13, fontWeight: "600" },

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
