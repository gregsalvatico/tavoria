import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Q = {
  q: string;
  a: string;
  inCoached?: boolean;
};

const QUESTIONS: Q[] = [
  {
    q: "Tell us about yourself",
    a: "Hi, I'm [Name], a [Job Title] with [Years] years in [Industry]. I specialize in [Key Skill] and recently worked at [Company] where I [Achievement].",
    inCoached: true,
  },
  {
    q: "Why do you want to join our team?",
    a: "Your team's focus on [Company Value] and the chance to contribute as a [Role] really match my goals. I admire [Project] and my [Skill] can help with [Goal].",
    inCoached: true,
  },
  {
    q: "What are your main professional strengths?",
    a: "My main strengths are [Strength 1], [Strength 2], and [Strength 3]. For example at [Company] I used [Strength 1] to [Result].",
    inCoached: true,
  },
  {
    q: "Describe a professional challenge you overcame",
    a: "A challenge I faced was [Challenge]. I addressed it by [Action] and we achieved [Outcome]. It taught me [Lesson].",
  },
  {
    q: "Why should we hire you?",
    a: "I bring [Years] years as a [Role] with a track record in [Achievement]. I can contribute by [Value] and align with your focus on [Value].",
    inCoached: true,
  },
  {
    q: "Your greatest professional achievement",
    a: "My greatest achievement was [Achievement]. I led [Action] which improved [Metric] by [%]. It mattered because [Impact].",
  },
  {
    q: "Where do you see yourself in 5 years?",
    a: "In five years I see myself as a [Future Role], deepening my expertise in [Skill] and contributing to [Goal].",
  },
  {
    q: "How do you handle stress and pressure?",
    a: "I handle stress by [Method], prioritizing, and communicating early. During [Situation] I [Action] and delivered [Result].",
  },
  {
    q: "Your ideal work environment",
    a: "I thrive in a [Environment] environment with [Team Style]. Clear goals, open communication, and [Value].",
  },
  {
    q: "What motivates you?",
    a: "I'm motivated by [Motivator], especially seeing the impact on [Impact]. In my last role, [Result] kept me proud of my work.",
    inCoached: true,
  },
  {
    q: "How do you prioritize your work?",
    a: "I prioritize by [Method], evaluating urgency and impact. I use [Tool] to plan and adapt when priorities shift.",
  },
  {
    q: "A mistake you made and what you learned",
    a: "I once [Mistake], which led to [Impact]. I took responsibility, corrected it by [Action], and learned [Lesson].",
  },
  {
    q: "How do you handle conflict with a colleague?",
    a: "I listen, understand perspectives, focus on the shared goal. With [Colleague] I [Action] and we agreed on [Resolution].",
  },
  {
    q: "Your salary expectations",
    a: "My expected range is [Range] based on my experience. I'm open to discussion depending on the overall package and growth.",
  },
  {
    q: "Your preferred communication style",
    a: "I prefer [Style] with clear expectations and regular updates. I use [Channel] for quick items, [Channel] for detail.",
  },
  {
    q: "An example of how you showed leadership",
    a: "I led when [Situation]. I coordinated [Team], supported by [Action], and we achieved [Result].",
  },
  {
    q: "Technologies you're most proficient in",
    a: "I'm proficient with [Tech 1], [Tech 2], [Tech 3]. I use them to [Use Case]. Currently learning [Tech].",
  },
  {
    q: "How do you stay updated with industry trends?",
    a: "I stay current via [Source], attending [Events], and applying new ideas in [Example].",
  },
  {
    q: "Your weaknesses",
    a: "A growth area for me is [Weakness]. To improve I [Action] and have seen [Progress]. I value feedback.",
  },
  {
    q: "Independent or team work?",
    a: "I'm comfortable with both, but tend to prefer [Preference] because [Reason]. I enjoy collaboration on goals like [Example].",
  },
  {
    q: "Present yourself in 1 minute",
    a: "Hi, I'm [Name], a [Job Title] with [Years] years in [Industry]. Skilled in [Key Skill], worked on [Achievement]. Looking for [Role] where I can contribute to [Goal].",
  },
];

export default function InterviewPrep() {
  const router = useRouter();
  const coachedCount = QUESTIONS.filter((q) => q.inCoached).length;

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
        <Text style={styles.title}>Interview tips</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Feather name="book-open" size={20} color="#F0531C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              {QUESTIONS.length} interview questions
            </Text>
            <Text style={styles.heroSub}>
              {coachedCount} appear in your coached video. Read through and
              practice — it's the fastest way to land interviews.
            </Text>
          </View>
        </View>

        {QUESTIONS.map((q, i) => (
          <View
            key={i}
            style={[styles.qCard, q.inCoached && styles.qCardCoached]}
          >
            <View style={styles.qHead}>
              <View style={styles.qNum}>
                <Text style={styles.qNumTxt}>{i + 1}</Text>
              </View>
              <Text style={styles.qTxt}>{q.q}</Text>
              {q.inCoached && (
                <View style={styles.coachedPill}>
                  <Feather name="video" size={10} color="#0F6E56" />
                  <Text style={styles.coachedPillTxt}>IN VIDEO</Text>
                </View>
              )}
            </View>
            <Text style={styles.qAns}>{q.a}</Text>
          </View>
        ))}

        <View style={styles.footTip}>
          <Feather name="info" size={14} color="#854F0B" />
          <Text style={styles.footTipTxt}>
            Replace [bracketed text] with your real experience. Keep it concrete
            — venues love specifics.
          </Text>
        </View>
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
  title: { fontSize: 16, fontWeight: "700", color: "#0E1A24" },

  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 },

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
    marginBottom: 14,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF4EE",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: { fontSize: 15, fontWeight: "800", color: "#0E1A24" },
  heroSub: { fontSize: 12, color: "#6B7280", lineHeight: 16, marginTop: 2 },

  qCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  qCardCoached: {
    borderColor: "rgba(15,110,86,0.30)",
    backgroundColor: "#F4FBF6",
  },
  qHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  qNum: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#0E1A24",
    justifyContent: "center",
    alignItems: "center",
  },
  qNumTxt: { color: "white", fontSize: 12, fontWeight: "800" },
  qTxt: { flex: 1, fontSize: 14, fontWeight: "700", color: "#0E1A24" },
  coachedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E1F5EE",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  coachedPillTxt: {
    color: "#0F6E56",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  qAns: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
    lineHeight: 18,
  },

  footTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    backgroundColor: "#FAEEDA",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  footTipTxt: { flex: 1, color: "#854F0B", fontSize: 12, lineHeight: 17 },
});
