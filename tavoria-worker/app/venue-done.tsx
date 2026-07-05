import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { getVenueProfile } from "../lib/venueProfile";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../lib/i18n";

export default function VenueDone() {
  const router = useRouter();
  const profile = getVenueProfile();
  const venueName = (profile?.name || "Bar Centrale").toUpperCase();
  const venueCity = profile?.city || "Milan";
  const venueType = profile?.type || "Café";
  const scale = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

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

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity, pulse]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) { router.back(); return; }
            router.replace("/");
          }}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>

        <View style={styles.center}>
          <Animated.View style={[styles.previewWrap, { opacity, transform: [{ scale }] }]}>
            <Image
              source={require("../assets/venue-cafe.png")}
              style={styles.previewImg}
              resizeMode="cover"
            />
            <View style={styles.previewScrim} />
            <View style={styles.previewLive}>
              <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
              <Text style={styles.previewLiveTxt}>Live on Tavoria</Text>
            </View>
            <View style={styles.previewName}>
              <Text style={styles.previewNameTxt}>{venueName}</Text>
              <Text style={styles.previewSub}>
                {venueCity} · {venueType.toLowerCase()}
              </Text>
            </View>
          </Animated.View>

          <Text style={styles.h1}>
            <Text style={{ color: "#F0531C" }}>
              {t("venue_done.title").charAt(0)}
            </Text>
            {t("venue_done.title").slice(1)}
          </Text>
          <Text style={styles.h2}>
            Workers in {venueCity} can find{" "}
            {profile?.name || "your venue"} starting now. Post your first
            shift and applications come in within minutes.
          </Text>

          <View style={styles.nextBox}>
            <Text style={styles.nextLbl}>NEXT</Text>
            <View style={styles.nextRow}>
              <View style={styles.nextDot}>
                <Feather name="plus" size={14} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextH}>Post your first shift</Text>
                <Text style={styles.nextSub}>3 taps · role, when, pay</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#6B7280" />
            </View>
            <View style={styles.divider} />
            <View style={styles.nextRow}>
              <View
                style={[styles.nextDot, { backgroundColor: "#E1F5EE" }]}
              >
                <Feather name="printer" size={14} color="#0F6E56" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextH}>Get your QR sticker</Text>
                <Text style={styles.nextSub}>print, stick on your door</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#6B7280" />
            </View>
          </View>
        </View>

        <View style={styles.bottom}>
          <Pressable
            style={styles.cta}
            onPress={() => router.replace("/venue-photo")}
          >
            <Text style={styles.ctaTxt}>{t("venue_done.post_shift")}</Text>
            <Feather name="arrow-right" size={20} color="#F7F4EE" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/venue-inbox")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 10,
            }}
          >
            <Feather name="inbox" size={16} color="#0E1A24" />
            <Text style={{ color: "#0E1A24", fontSize: 14, fontWeight: "700" }}>
              View applicants
            </Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/")}>
            <Text style={styles.secondaryTxt}>I'll do it later</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  backBtn: { padding: 4, width: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  previewWrap: {
    width: "100%",
    height: 160,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0E1A24",
    position: "relative",
    marginBottom: 22,
  },
  previewImg: { width: "100%", height: "100%" },
  previewScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  previewLive: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#3FE38B",
  },
  previewLiveTxt: { color: "white", fontSize: 12, fontWeight: "600" },
  previewName: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
  },
  previewNameTxt: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  previewSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 2,
  },

  h1: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  h2: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },

  nextBox: {
    width: "100%",
    marginTop: 22,
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  nextLbl: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  nextRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  nextDot: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
  },
  nextH: { fontSize: 14, fontWeight: "700", color: "#0E1A24" },
  nextSub: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  divider: { height: 0.5, backgroundColor: "rgba(0,0,0,0.08)", marginVertical: 4 },

  bottom: { gap: 12, alignItems: "center", paddingTop: 8 },
  cta: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0E1A24",
    borderRadius: 999,
    paddingVertical: 18,
  },
  ctaTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },
  secondaryTxt: { color: "#6B7280", fontSize: 14, paddingVertical: 4 },
});
