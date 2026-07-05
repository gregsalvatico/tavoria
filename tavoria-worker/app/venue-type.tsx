import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { t } from "../lib/i18n";
import { patchVenueProfile } from "../lib/venueProfile";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const SCREEN_W = Dimensions.get("window").width;
const TILE_SIZE = (SCREEN_W - 20 * 2 - 10) / 2;
import { SafeAreaView } from "react-native-safe-area-context";

type VenueType = {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  hue: string;
  image?: number; // require()'d image source
};

// labels are wired via t() at render time so they translate live
const TYPES: VenueType[] = [
  {
    id: "cafe",
    label: "Café",
    icon: "coffee",
    hue: "#FAEEDA",
    image: require("../assets/venue-cafe.png"),
  },
  {
    id: "bar",
    label: "Bar",
    icon: "wind",
    hue: "#FBEAF0",
    image: require("../assets/venue-bar.png"),
  },
  {
    id: "restaurant",
    label: "Restaurant",
    icon: "shopping-bag",
    hue: "#FAECE7",
    image: require("../assets/venue-restaurant.png"),
  },
  {
    id: "hotel",
    label: "Hotel",
    icon: "home",
    hue: "#E6F1FB",
    image: require("../assets/venue-hotel.png"),
  },
  {
    id: "club",
    label: "Club",
    icon: "music",
    hue: "#EEEDFE",
    image: require("../assets/venue-club.png"),
  },
  {
    id: "beach",
    label: "Beach club",
    icon: "sun",
    hue: "#E1F5EE",
    image: require("../assets/venue-beach.png"),
  },
];

const TYPE_LABEL_KEYS: Record<string, string> = {
  cafe: "venue_type.cafe",
  bar: "venue_type.bar",
  restaurant: "venue_type.restaurant",
  hotel: "venue_type.hotel",
  club: "venue_type.club",
  beach: "venue_type.beach_club",
};

export default function VenueType() {
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) { router.back(); return; }
            router.replace("/");
          }}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        <ProgressDots step={0} total={4} />
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sub, { textAlign: "center", marginTop: 4 }]}>
          <Text style={styles.subFirst}>{t("venue_type.title").charAt(0)}</Text>
          {t("venue_type.title").slice(1)}
        </Text>

        <View style={styles.grid}>
          {TYPES.map((ty) => {
            const active = picked === ty.id;
            return (
              <Pressable
                key={ty.id}
                onPress={() => setPicked(ty.id)}
                style={[
                  styles.tile,
                  { backgroundColor: ty.hue },
                  active && styles.tileActive,
                ]}
              >
                {ty.image ? (
                  <Image
                    source={ty.image}
                    style={styles.tileImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.tilePlaceholder,
                      { backgroundColor: ty.hue },
                    ]}
                  >
                    <Feather name={ty.icon} size={48} color="#0E1A24" />
                  </View>
                )}
                <View style={styles.tileScrim} pointerEvents="none" />
                <View style={styles.tileLblWrap} pointerEvents="none">
                  <Text style={styles.tileLbl}>
                    {t(TYPE_LABEL_KEYS[ty.id] ?? "")}
                  </Text>
                </View>
                {active && (
                  <View style={styles.tileCheck}>
                    <Feather name="check" size={14} color="white" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          disabled={!picked}
          onPress={() => {
            const chosen = TYPES.find((x) => x.id === picked);
            if (chosen) patchVenueProfile({ type: chosen.label });
            router.push("/venue-info");
          }}
          style={[styles.cta, !picked && styles.ctaDisabled]}
        >
          <Text style={styles.ctaTxt}>{t("common.continue")}</Text>
          <Feather name="arrow-right" size={20} color="#F7F4EE" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.progress}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progDot,
            i <= step && styles.progDotActive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F4EE" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  iconBtn: { padding: 4 },
  progress: { flexDirection: "row", gap: 5 },
  progDot: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(11,15,26,0.15)",
  },
  progDotActive: { backgroundColor: "#0E1A24" },

  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  h1: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0E1A24",
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  sub: {
    color: "#0E1A24",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: 6,
  },
  subFirst: {
    color: "#F0531C",
    fontSize: 32,
    fontWeight: "900",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  tileActive: { borderColor: "#F0531C" },
  tileImg: {
    width: "100%",
    height: "100%",
  },
  tilePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  tileScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  tileLblWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tileLbl: {
    fontSize: 22,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tileCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
  },

  bottom: {
    padding: 20,
    backgroundColor: "#F7F4EE",
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
  ctaDisabled: { backgroundColor: "rgba(11,15,26,0.15)" },
  ctaTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },
});
