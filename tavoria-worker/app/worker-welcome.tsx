import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WorkerWelcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) { router.back(); return; }
            router.replace("/");
          }}
          style={styles.closeBtn}
          hitSlop={12}
        >
          <Feather name="x" size={22} color="#F7F4EE" />
        </Pressable>

        <View style={styles.middle}>
          <Text style={styles.kicker}>FOR WORKERS</Text>
          <Text style={styles.h1}>
            Build your profile{"\n"}
            <Text style={styles.accent}>once.</Text>{" "}
            Get hired{"\n"}again and again.
          </Text>
          <Text style={styles.sub}>
            Phone + name, record a 30-second coached video, done.
            Venues nearby can find you and reach out — or scan a QR
            sticker to apply on the spot.
          </Text>

          <View style={styles.stepsRow}>
            <Step label="Phone" />
            <Connector />
            <Step label="Coached video" />
            <Connector />
            <Step label="Languages" />
            <Connector />
            <Step label="Live" accent />
          </View>
        </View>

        <View style={styles.bottom}>
          <Link href="/signup?next=worker-profile" asChild>
            <Pressable style={styles.cta}>
              <Text style={styles.ctaTxt}>Start — it's free</Text>
              <Feather name="arrow-right" size={20} color="#0E1A24" />
            </Pressable>
          </Link>
          <Text style={styles.tinyTxt}>
            No subscription. Pay €2.99/week only to unlock Pro filters.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Step({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <View style={styles.step}>
      <View
        style={[styles.stepDot, accent ? styles.stepDotAccent : undefined]}
      />
      <Text style={styles.stepLbl}>{label}</Text>
    </View>
  );
}

function Connector() {
  return <View style={styles.stepConn} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0E1A24" },
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 14 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },
  middle: { flex: 1, justifyContent: "center" },
  kicker: {
    color: "#F0531C",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 12,
  },
  h1: {
    color: "#F7F4EE",
    fontSize: 44,
    fontWeight: "900",
    lineHeight: 50,
    letterSpacing: -1.2,
  },
  accent: { color: "#F0531C" },
  sub: {
    marginTop: 18,
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 340,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 36,
    justifyContent: "space-between",
  },
  step: { alignItems: "center", gap: 6, width: 60 },
  stepDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  stepDotAccent: { backgroundColor: "#F0531C" },
  stepLbl: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    textAlign: "center",
  },
  stepConn: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.15)" },

  bottom: { gap: 10, alignItems: "center" },
  cta: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F7F4EE",
    borderRadius: 999,
    paddingVertical: 18,
  },
  ctaTxt: { color: "#0E1A24", fontSize: 16, fontWeight: "700" },
  tinyTxt: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
});
