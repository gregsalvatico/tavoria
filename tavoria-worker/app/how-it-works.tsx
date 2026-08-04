import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Role = "venue" | "worker";

const venueSteps = [
  {
    icon: "plus-circle" as const,
    title: "Post a shift",
    body: "Add the role, pay and timing. Workers can then find it, scan your QR or open your link.",
  },
  {
    icon: "users" as const,
    title: "Review candidates",
    body: "See who applied and open their profile.",
  },
  {
    icon: "calendar" as const,
    title: "Request an interview",
    body: "Choose the date, time and meeting options. The worker is notified and contact details unlock.",
  },
  {
    icon: "check-circle" as const,
    title: "Confirm the outcome",
    body: "After the interview, mark them hired or declined. They get the update in the app and by email.",
  },
];

const workerSteps = [
  {
    icon: "user" as const,
    title: "Create your profile",
    body: "Add your experience and availability so venues can assess you.",
  },
  {
    icon: "search" as const,
    title: "Find a shift and apply",
    body: "Browse shifts, follow a venue link or scan a QR. Applying sends your profile to the venue.",
  },
  {
    icon: "bell" as const,
    title: "Wait for a response",
    body: "Your application stays pending while the venue reviews it. Interview requests are highlighted and emailed to you.",
  },
  {
    icon: "calendar" as const,
    title: "Arrange the interview",
    body: "See the proposed date, time and location. The venue's contact options then unlock.",
  },
  {
    icon: "check-circle" as const,
    title: "See the final decision",
    body: "The venue marks you hired or declined. You see the result in the app and by email.",
  },
];

export default function HowItWorks() {
  const router = useRouter();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role: Role = roleParam === "venue" ? "venue" : "worker";
  const isVenue = role === "venue";
  const steps = isVenue ? venueSteps : workerSteps;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={21} color="white" />
        </Pressable>
        <Text style={styles.headerLabel}>HOW IT WORKS</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.badge, isVenue ? styles.venueBadge : styles.workerBadge]}>
          <Feather name={isVenue ? "briefcase" : "coffee"} size={14} color="white" />
          <Text style={styles.badgeText}>{isVenue ? "FOR VENUES" : "FOR WORKERS"}</Text>
        </View>

        <Text style={styles.title}>{isVenue ? "From a shift to a great hire." : "From your profile to your next shift."}</Text>
        <Text style={styles.intro}>
          {isVenue
            ? "Tavoria helps you find people, agree an interview, then take the final decision."
            : "Tavoria helps venues find you, then makes every next step clear."}
        </Text>

        <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>THE FLOW</Text></View>
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
                <Text style={styles.stepNumber}>STEP {index + 1}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepBody}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionLabel}><Text style={styles.sectionLabelText}>GOOD TO KNOW</Text></View>
        <View style={styles.noteCard}>
          <Note icon="lock" text="Contact details stay hidden until an interview is requested." />
          <Note icon="mail" text="Important updates are shown in the app and sent by email." />
          <Note icon="message-circle" text="Once contact is unlocked, you arrange the details directly by email, phone, WhatsApp or in person." />
        </View>

        {isVenue ? (
          <View style={styles.proCard}>
            <View style={styles.proKicker}><Feather name="star" size={13} color="#F0531C" /><Text style={styles.proKickerText}>TAVORIA PRO</Text></View>
            <Text style={styles.proTitle}>Invite before they apply</Text>
            <Text style={styles.proText}>With Pro, venues will be able to request an interview from a candidate who has not applied yet. Pro is coming soon.</Text>
          </View>
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
