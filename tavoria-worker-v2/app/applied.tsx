// Tavoria v2 — application sent confirmation.
//
// Celebration screen after the worker submits an apply. Editorial: serif italic
// "Sei a posto." headline, brass success mark, 3-step timeline using Hairline +
// Mono labels, single primary CTA back to discover.

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import {
  Body,
  Button,
  Caption,
  Card,
  Eyebrow,
  H1,
  Hairline,
  Pill,
  Screen,
} from "../components/kit";
import { colors, fonts } from "../lib/theme";
import { t } from "../lib/i18n";

export default function AppliedV2() {
  const router = useRouter();
  const { venueName } = useLocalSearchParams<{ venueName?: string }>();
  const venueLbl = (venueName || t("applied.venue_fallback")).trim();
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  return (
    <Screen scroll>
      <View
        style={{
          flex: 1,
          minHeight: 600,
          justifyContent: "space-between",
          paddingTop: 40,
        }}
      >
        {/* Hero */}
        <View style={{ alignItems: "center" }}>
          <Animated.View
            style={[
              {
                width: 96,
                height: 96,
                borderRadius: 999,
                backgroundColor: colors.success,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
              },
              { transform: [{ scale }], opacity },
            ]}
          >
            <Animated.Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 48,
                color: colors.paper,
                lineHeight: 52,
              }}
            >
              ✓
            </Animated.Text>
          </Animated.View>

          <Eyebrow accent style={{ marginBottom: 12 }}>
            {t("applied.kicker")}
          </Eyebrow>
          <H1
            italic
            style={{
              textAlign: "center",
              fontSize: 44,
              lineHeight: 46,
              marginBottom: 10,
            }}
          >
            {t("applied.title")}
          </H1>
          <Body
            muted
            style={{
              textAlign: "center",
              paddingHorizontal: 16,
              marginBottom: 32,
            }}
          >
            {t("applied.sub")}
          </Body>

          {/* Timeline */}
          <Card style={{ width: "100%", padding: 0 }}>
            <TimelineStep
              label={t("applied.step1")}
              meta={t("applied.step1_meta")}
              status="done"
            />
            <Hairline />
            <TimelineStep
              label={t("applied.step2").replace("{{venue}}", venueLbl)}
              meta={t("applied.step2_meta")}
              status="pending"
            />
            <Hairline />
            <TimelineStep
              label={t("applied.step3")}
              meta={t("applied.step3_meta")}
              status="pending"
            />
          </Card>

          {/* Tip */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 22,
              paddingHorizontal: 4,
            }}
          >
            <Pill variant="accent">●</Pill>
            <Caption style={{ flex: 1, color: colors.mute2 }}>
              {t("applied.tip")}
            </Caption>
          </View>
        </View>

        {/* CTAs */}
        <View style={{ gap: 12, marginTop: 32 }}>
          <Button
            label={t("home.browse") + "  →"}
            variant="primary"
            size="lg"
            onPress={() => router.replace("/discover")}
          />
          <Button
            label={t("common.done")}
            variant="ghost"
            onPress={() => router.replace("/")}
          />
        </View>
      </View>
    </Screen>
  );
}

function TimelineStep({
  label,
  meta,
  status,
}: {
  label: string;
  meta: string;
  status: "done" | "pending";
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 18,
        paddingHorizontal: 18,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          backgroundColor:
            status === "done" ? colors.ink : colors.hairlineStrong,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Caption
          style={{
            color: status === "done" ? colors.paper : colors.mute,
            fontFamily: fonts.sansBold,
            fontSize: 14,
            lineHeight: 16,
          }}
        >
          {status === "done" ? "✓" : "·"}
        </Caption>
      </View>
      <View style={{ flex: 1 }}>
        <Body
          style={{
            fontFamily: fonts.sansSemibold,
            fontSize: 14,
            marginBottom: 2,
          }}
        >
          {label}
        </Body>
        <Caption>{meta}</Caption>
      </View>
    </View>
  );
}
