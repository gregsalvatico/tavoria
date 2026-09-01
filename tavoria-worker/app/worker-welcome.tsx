import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WorkerWelcome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={[styles.container, isDesktop && styles.desktopContainer]}>
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

        <View style={[styles.middle, isDesktop && styles.desktopMiddle]}>
          <Text style={styles.kicker}>FOR WORKERS</Text>
          <Text style={[styles.h1, isDesktop && styles.desktopH1]}>
            Build your profile{"\n"}
            <Text style={styles.accent}>once.</Text>{" "}
            Get hired{"\n"}again and again.
          </Text>
          <Text style={styles.sub}>
            Phone + name, record a 30-second coached video, done.
            Venues nearby can find you and reach out — or scan a QR
            sticker to apply on the spot.
          </Text>

          <View style={[styles.stepsRow, isDesktop && styles.desktopStepsRow]}>
            <Step label="Phone" />
            <Connector />
            <Step label="Coached video" />
            <Connector />
            <Step label="Languages" />
            <Connector />
            <Step label="Live" accent />
          </View>
        </View>

        <View style={[styles.bottom, isDesktop && styles.desktopBottom]}>
          <Link href="/signup?next=worker-profile" asChild>
            <Pressable style={styles.cta}>
              <Text style={styles.ctaTxt}>Start — it's free</Text>
              <Feather name="arrow-right" size={20} color="#0E1A24" />
            </Pressable>
          </Link>
          <Text style={styles.tinyTxt}>
            Tavoria is free for everyone until 2027.
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
  desktopContainer: { paddingHorizontal: 56 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },
  middle: { flex: 1, justifyContent: "center" },
  desktopMiddle: { alignSelf: "center", maxWidth: 900, width: "100%" },
  kicker: {
    color: "#F0531C",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 12,
  },
  h1: {
    fontFamily: "InstrumentSerif_400Regular",
    color: "#F7F4EE",
    fontSize: 44,
    fontWeight: "400",
    lineHeight: 50,
    letterSpacing: -1.2,
  },
  desktopH1: { maxWidth: 620 },
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
  desktopStepsRow: { maxWidth: 820 },
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

  bottom: { gap: 10, alignItems: "center", paddingBottom: 24 },
  desktopBottom: { alignSelf: "center", maxWidth: 820, width: "100%" },
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
