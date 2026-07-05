import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Shift = {
  id: string;
  role: string;
  contractLabel: string;
  contractColor: string;
  schedule: string;
  pay: string;
  applicants?: number;
};

const OPEN_SHIFTS: Shift[] = [
  {
    id: "1",
    role: "Barista",
    contractLabel: "ONE-OFF",
    contractColor: "#F0531C",
    schedule: "Tonight · 18:00 – 23:00",
    pay: "€14 / hour",
    applicants: 3,
  },
  {
    id: "2",
    role: "Waiter",
    contractLabel: "PART-TIME",
    contractColor: "#F0531C",
    schedule: "Mon–Fri · 11:00 – 15:00",
    pay: "€800 / month",
    applicants: 7,
  },
  {
    id: "3",
    role: "Cook",
    contractLabel: "FULL-TIME",
    contractColor: "#3B6D11",
    schedule: "Tue–Sat · 16:00 – 23:00",
    pay: "€1,800 / month",
    applicants: 2,
  },
];

export default function Apply() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) { router.back(); return; }
            router.replace("/discover");
          }}
          style={styles.closeBtn}
          hitSlop={12}
        >
          <Feather name="x" size={22} color="#F7F4EE" />
        </Pressable>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.venueBlock}>
          <View style={styles.venueLogo}>
            <Text style={styles.venueLogoTxt}>B</Text>
          </View>
          <Text style={styles.kicker}>You scanned</Text>
          <Text style={styles.venueName}>Bar Centrale</Text>
          <View style={styles.venueMetaRow}>
            <Feather name="map-pin" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.venueMeta}>
              Via Brera 12, Milan · 0.2 km away
            </Text>
          </View>
          <View style={styles.venueBadgesRow}>
            <View style={styles.venueBadge}>
              <Feather name="zap" size={11} color="#854F0B" />
              <Text style={styles.venueBadgeTxt}>Same-day pay</Text>
            </View>
            <View style={styles.venueBadge}>
              <Ionicons name="star" size={11} color="#854F0B" />
              <Text style={styles.venueBadgeTxt}>4.7 · 32 hires</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Open positions · {OPEN_SHIFTS.length}
          </Text>
          <Text style={styles.sectionSub}>
            Tap the one you want to apply for
          </Text>
        </View>

        <View style={styles.shiftsCol}>
          {OPEN_SHIFTS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => router.push("/signup")}
              style={styles.shiftCard}
            >
              <View style={styles.shiftCardHeader}>
                <Text style={styles.shiftRole}>{s.role}</Text>
                <View
                  style={[
                    styles.shiftContract,
                    { backgroundColor: s.contractColor },
                  ]}
                >
                  <Text style={styles.shiftContractTxt}>{s.contractLabel}</Text>
                </View>
              </View>

              <View style={styles.shiftMetaRow}>
                <Feather name="calendar" size={13} color="#6B7280" />
                <Text style={styles.shiftMetaTxt}>{s.schedule}</Text>
              </View>
              <View style={styles.shiftMetaRow}>
                <Feather name="dollar-sign" size={13} color="#6B7280" />
                <Text style={[styles.shiftMetaTxt, styles.shiftPay]}>
                  {s.pay}
                </Text>
              </View>

              <View style={styles.shiftFooter}>
                <Text style={styles.shiftApps}>
                  {s.applicants
                    ? `${s.applicants} already applied`
                    : "Be the first to apply"}
                </Text>
                <View style={styles.shiftApplyChip}>
                  <Text style={styles.shiftApplyTxt}>Apply</Text>
                  <Feather name="arrow-right" size={14} color="#F7F4EE" />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.howWrap}>
          <Text style={styles.howTitle}>To apply, you'll:</Text>
          <Step n={1} txt="Enter your phone + name (15 sec)" />
          <Step n={2} txt="Record a 30-second coached video" />
          <Step n={3} txt="Wait for Bar Centrale to reply" />
        </View>

        <Pressable onPress={() => {
          if (router.canGoBack()) { router.back(); return; }
          router.replace("/discover");
        }} style={styles.notNowBtn}>
          <Text style={styles.notNowTxt}>Not now</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ n, txt }: { n: number; txt: string }) {
  return (
    <View style={styles.howStep}>
      <View style={styles.howNum}>
        <Text style={styles.howNumTxt}>{n}</Text>
      </View>
      <Text style={styles.howTxt}>{txt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0E1A24" },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 28 },

  venueBlock: { alignItems: "center", marginTop: 6 },
  venueLogo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  venueLogoTxt: {
    color: "white",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  kicker: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  venueName: {
    color: "#F7F4EE",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  venueMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  venueMeta: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  venueBadgesRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  venueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FAEEDA",
  },
  venueBadgeTxt: { color: "#854F0B", fontSize: 11, fontWeight: "600" },

  sectionHeader: { marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: "#F7F4EE", fontSize: 18, fontWeight: "700" },
  sectionSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    marginTop: 2,
  },

  shiftsCol: { gap: 10 },
  shiftCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.10)",
  },
  shiftCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shiftRole: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F7F4EE",
    letterSpacing: 0.2,
  },
  shiftContract: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  shiftContractTxt: {
    color: "white",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  shiftMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 6,
  },
  shiftMetaTxt: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  shiftPay: { fontWeight: "700" },

  shiftFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.10)",
    paddingTop: 10,
  },
  shiftApps: { color: "rgba(255,255,255,0.55)", fontSize: 11 },
  shiftApplyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F0531C",
  },
  shiftApplyTxt: { color: "#F7F4EE", fontSize: 13, fontWeight: "700" },

  howWrap: { marginTop: 24 },
  howTitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  howStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  howNum: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "rgba(255,90,31,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  howNumTxt: { color: "#F0531C", fontSize: 12, fontWeight: "800" },
  howTxt: { color: "#F7F4EE", fontSize: 14 },

  notNowBtn: { marginTop: 24, paddingVertical: 12, alignItems: "center" },
  notNowTxt: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
});
