// Tavoria v2 — venue type picker.
//
// Step 1 of 4 in the venue onboarding. Image-tile grid: café / bar /
// restaurant / hotel / club / beach club. Editorial cream background, big
// serif heading, 2-col grid with image + scrim + label.

import { useRouter } from "expo-router";
import { useState } from "react";
import { Dimensions, Image, Pressable, View } from "react-native";
import {
  BackBar,
  Body,
  Button,
  Eyebrow,
  H1,
  Screen,
} from "../components/kit";
import { colors, fonts } from "../lib/theme";
import { t } from "../lib/i18n";
import { patchVenueProfile } from "../lib/venueProfile";

const SCREEN_W = Dimensions.get("window").width;
const TILE_SIZE = (SCREEN_W - 24 * 2 - 10) / 2;

type VenueType = {
  id: string;
  label: string;
  image?: number;
};

const TYPES: VenueType[] = [
  { id: "cafe", label: "Café", image: require("../assets/venue-cafe.png") },
  { id: "bar", label: "Bar", image: require("../assets/venue-bar.png") },
  {
    id: "restaurant",
    label: "Restaurant",
    image: require("../assets/venue-restaurant.png"),
  },
  { id: "hotel", label: "Hotel", image: require("../assets/venue-hotel.png") },
  { id: "club", label: "Club", image: require("../assets/venue-club.png") },
  {
    id: "beach",
    label: "Beach club",
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

export default function VenueTypeV2() {
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <Screen scroll>
      <BackBar onBack={() => router.back()} step={1} totalSteps={4} />

      <Eyebrow accent style={{ marginBottom: 10 }}>
        {t("venue_type.kicker")}
      </Eyebrow>
      <H1 italic style={{ fontSize: 36, lineHeight: 38, marginBottom: 6 }}>
        {t("venue_type.title")}
      </H1>
      <Body muted style={{ marginBottom: 24 }}>
        {t("venue_type.sub")}
      </Body>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 24,
        }}
      >
        {TYPES.map((ty) => {
          const active = picked === ty.id;
          return (
            <Pressable
              key={ty.id}
              onPress={() => setPicked(ty.id)}
              style={{
                width: TILE_SIZE,
                height: TILE_SIZE,
                borderRadius: 16,
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.tangerine : colors.hairline,
                overflow: "hidden",
                position: "relative",
                backgroundColor: colors.surface,
              }}
            >
              {ty.image ? (
                <Image
                  source={ty.image}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : null}
              {/* Scrim for label legibility */}
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "55%",
                  backgroundColor: "rgba(14,26,36,0.55)",
                }}
                pointerEvents="none"
              />
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 16,
                  alignItems: "center",
                }}
                pointerEvents="none"
              >
                <Body
                  style={{
                    fontFamily: fonts.serifItalic,
                    fontSize: 22,
                    color: colors.paper,
                  }}
                >
                  {t(TYPE_LABEL_KEYS[ty.id] ?? "")}
                </Body>
              </View>
              {active && (
                <View
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    backgroundColor: colors.tangerine,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Body
                    style={{
                      fontFamily: fonts.sansBold,
                      color: colors.paper,
                      fontSize: 13,
                      lineHeight: 14,
                    }}
                  >
                    ✓
                  </Body>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <Button
        label={`${t("common.continue")}  →`}
        variant="primary"
        size="lg"
        disabled={!picked}
        onPress={() => {
          const chosen = TYPES.find((x) => x.id === picked);
          if (chosen) patchVenueProfile({ type: chosen.label });
          router.push("/venue-info");
        }}
      />
    </Screen>
  );
}
