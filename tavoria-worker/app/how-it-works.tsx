import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../lib/i18n";

type Role = "venue" | "worker";

export default function HowItWorks() {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role: Role = roleParam === "venue" ? "venue" : "worker";
  const isVenue = role === "venue";
  const steps = isVenue
    ? [
        { icon: "plus-circle" as const, title: t("how_it_works.venue_step_1_title"), body: t("how_it_works.venue_step_1_body") },
        { icon: "users" as const, title: t("how_it_works.venue_step_2_title"), body: t("how_it_works.venue_step_2_body") },
        { icon: "calendar" as const, title: t("how_it_works.venue_step_3_title"), body: t("how_it_works.venue_step_3_body") },
        { icon: "check-circle" as const, title: t("how_it_works.venue_step_4_title"), body: t("how_it_works.venue_step_4_body") },
      ]
    : [
        { icon: "user" as const, title: t("how_it_works.worker_step_1_title"), body: t("how_it_works.worker_step_1_body") },
        { icon: "search" as const, title: t("how_it_works.worker_step_2_title"), body: t("how_it_works.worker_step_2_body") },
        { icon: "bell" as const, title: t("how_it_works.worker_step_3_title"), body: t("how_it_works.worker_step_3_body") },
        { icon: "calendar" as const, title: t("how_it_works.worker_step_4_title"), body: t("how_it_works.worker_step_4_body") },
        { icon: "check-circle" as const, title: t("how_it_works.worker_step_5_title"), body: t("how_it_works.worker_step_5_body") },
      ];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <Feather name="arrow-left" size={21} color="white" />
        </Pressable>
        <Text style={styles.headerLabel}>{t("how_it_works.header")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.badge, isVenue ? styles.venueBadge : styles.workerBadge]}>
          <Feather name={isVenue ? "briefcase" : "coffee"} size={14} color="white" />
          <Text style={styles.badgeText}>{isVenue ? t("how_it_works.for_venues") : t("how_it_works.for_workers")}</Text>
        </View>

        <Text style={styles.title}>{isVenue ? t("how_it_works.venue_title") : t("how_it_works.worker_title")}</Text>
        <Text style={styles.intro}>
          {isVenue
            ? t("how_it_works.venue_intro")
            : t("how_it_works.worker_intro")}
        </Text>

        <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>{t("how_it_works.flow")}</Text></View>
        <View style={styles.stepsCard}>
          {steps.map((step, index) => (
            <View key={step.title} style={styles.step}>
              <View style={styles.stepRail}>
                <View style={[styles.stepIcon, isVenue ? styles.venueStepIcon : styles.workerStepIcon]}>
                  <Feather name={step.icon} size={16} color={isVenue ? "#3B6D11" : "#F0531C"} />
                </View>
                {index < steps.length - 1 ? <View style={styles.connector} /> : null}
              </View>
              <View style={styles.stepCopy}>
                <Text style={styles.stepNumber}>{t("how_it_works.step", { number: index + 1 })}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepBody}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>{t("how_it_works.good_to_know")}</Text></View>
        <View style={styles.noteCard}>
          <Note icon="lock" text={t("how_it_works.note_contact_locked")} />
          <Note icon="mail" text={t("how_it_works.note_email")} />
          <Note icon="message-circle" text={t("how_it_works.note_contact_unlocked")} />
        </View>

        {isVenue ? (
          <Pressable style={styles.proCard} onPress={() => router.push("/venue-pro")} accessibilityRole="link">
            <View style={styles.proKicker}><Feather name="star" size={13} color="#F0531C" /><Text style={styles.proKickerText}>TAVORIA PRO</Text></View>
            <Text style={styles.proTitle}>{t("how_it_works.pro_title")}</Text>
            <Text style={styles.proText}>{t("how_it_works.pro_body")}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Note({ icon, text }: { icon: React.ComponentProps<typeof Feather>["name"]; text: string }) {
  return (
    <View style={styles.noteRow}>
      <View style={styles.noteIcon}><Feather name={icon} size={15} color="#F0531C" /></View>
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0E1A24" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10 },
  backButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 999, height: 36, justifyContent: "center", width: 36 },
  headerLabel: { color: "rgba(255,255,255,0.65)", fontFamily: "DMMono_500Medium", fontSize: 11, letterSpacing: 1.3 },
  headerSpacer: { width: 36 },
  scroll: { paddingBottom: 36, paddingHorizontal: 22, paddingTop: 12 },
  badge: { alignItems: "center", alignSelf: "flex-start", borderRadius: 999, flexDirection: "row", gap: 6, marginBottom: 14, paddingHorizontal: 12, paddingVertical: 6 },
  venueBadge: { backgroundColor: "#3B6D11" },
  workerBadge: { backgroundColor: "#F0531C" },
  badgeText: { color: "white", fontFamily: "DMMono_500Medium", fontSize: 11, letterSpacing: 1.1 },
  title: { color: "white", fontFamily: "InstrumentSerif_400Regular", fontSize: 31, letterSpacing: -0.6, lineHeight: 36 },
  intro: { color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 22, marginTop: 10 },
  sectionLabel: { marginBottom: 8, marginTop: 24 },
  sectionLabelText: { color: "rgba(255,255,255,0.55)", fontFamily: "DMMono_500Medium", fontSize: 11, letterSpacing: 1.2 },
  stepsCard: { backgroundColor: "#F7F4EE", borderRadius: 18, padding: 16 },
  step: { flexDirection: "row", minHeight: 91 },
  stepRail: { alignItems: "center", width: 34 },
  stepIcon: { alignItems: "center", borderRadius: 999, height: 28, justifyContent: "center", width: 28 },
  venueStepIcon: { backgroundColor: "#EAF3DE" },
  workerStepIcon: { backgroundColor: "#FDE4D8" },
  connector: { backgroundColor: "rgba(14,26,36,0.13)", flex: 1, marginBottom: -3, marginTop: 5, width: 1 },
  stepCopy: { flex: 1, paddingBottom: 18, paddingLeft: 8 },
  stepNumber: { color: "#7B838B", fontFamily: "DMMono_500Medium", fontSize: 10, letterSpacing: 1, marginBottom: 3 },
  stepTitle: { color: "#0E1A24", fontSize: 16, fontWeight: "800", lineHeight: 20 },
  stepBody: { color: "#59616A", fontSize: 13, lineHeight: 19, marginTop: 4 },
  noteCard: { backgroundColor: "white", borderColor: "rgba(255,255,255,0.2)", borderRadius: 18, borderWidth: 1, gap: 14, padding: 16 },
  noteRow: { alignItems: "flex-start", flexDirection: "row", gap: 11 },
  noteIcon: { alignItems: "center", backgroundColor: "#FDE4D8", borderRadius: 999, height: 28, justifyContent: "center", width: 28 },
  noteText: { color: "#24313D", flex: 1, fontSize: 14, lineHeight: 20 },
  proCard: { borderColor: "rgba(240,83,28,0.72)", borderRadius: 18, borderWidth: 1, marginTop: 22, padding: 16 },
  proKicker: { alignItems: "center", flexDirection: "row", gap: 6 },
  proKickerText: { color: "#F0531C", fontFamily: "DMMono_500Medium", fontSize: 11, letterSpacing: 1.1 },
  proTitle: { color: "white", fontSize: 17, fontWeight: "800", marginTop: 8 },
  proText: { color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 19, marginTop: 5 },
});
