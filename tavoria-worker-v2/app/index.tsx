// Tavoria v2 — home screen scaffold.
//
// First screen built entirely from the new component kit (components/kit.tsx).
// Demonstrates editorial type system + paper background + tangerine CTA +
// DM Mono labels. Greg approves this look, then we build each subsequent
// screen the same way.

import { useRouter } from "expo-router";
import { Linking, Pressable, View } from "react-native";
import {
  Body,
  Button,
  Caption,
  Card,
  Eyebrow,
  H1,
  Hairline,
  Mono,
  Pill,
  Screen,
  StatsStrip,
} from "../components/kit";
import { colors, fonts } from "../lib/theme";

export default function HomeV2() {
  const router = useRouter();

  return (
    <Screen scroll>
      {/* Top nav — language + sign-in */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <Pill>🇮🇹 IT</Pill>
        <Pressable onPress={() => router.push("/signin")} hitSlop={8}>
          <Eyebrow>Accedi</Eyebrow>
        </Pressable>
      </View>

      {/* Wordmark */}
      <View style={{ alignItems: "center", marginBottom: 28 }}>
        <H1
          italic
          style={{
            fontSize: 56,
            lineHeight: 56,
            letterSpacing: -1.2,
            color: colors.ink,
          }}
        >
          Tavoria
          <Mono style={{ color: colors.tangerine, fontSize: 56 }}>.</Mono>
        </H1>
      </View>

      {/* Hero */}
      <View style={{ marginBottom: 32 }}>
        <Eyebrow accent style={{ textAlign: "center", marginBottom: 14 }}>
          Hospitality · Milano · Luglio 2026
        </Eyebrow>
        <H1
          style={{
            textAlign: "center",
            fontSize: 40,
            lineHeight: 42,
            marginBottom: 6,
          }}
        >
          Personale di sala,{"\n"}bar e cucina.
        </H1>
        <H1
          italic
          style={{
            textAlign: "center",
            fontSize: 40,
            lineHeight: 42,
            color: colors.tangerine,
          }}
        >
          Pronto in 24 ore.
        </H1>
        <Body
          muted
          style={{ textAlign: "center", marginTop: 18, paddingHorizontal: 8 }}
        >
          Scansiona un QR sulla porta di un locale, registra un video di 30
          secondi e candidati sul momento.
        </Body>
      </View>

      {/* Stats strip */}
      <StatsStrip
        items={[
          { value: "24h", label: "Per assumere" },
          { value: "30s", label: "Per candidarsi" },
          { value: "0%", label: "Commissioni", accent: true },
          { value: "€0", label: "Per lo staff" },
        ]}
        style={{ marginBottom: 32 }}
      />

      {/* CTA tiles — staff side */}
      <Eyebrow style={{ marginBottom: 10, textAlign: "center" }}>
        Per lo staff
      </Eyebrow>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
        <Pressable onPress={() => router.push("/discover")} style={{ flex: 1 }}>
          <Card style={{ paddingVertical: 18, paddingHorizontal: 16 }}>
            <Body style={{ fontFamily: fonts.sansSemibold, marginBottom: 4 }}>
              Vedi locali vicini
            </Body>
            <Caption>Trova turni a Milano</Caption>
          </Card>
        </Pressable>
        <Pressable
          onPress={() => router.push("/signup?next=worker-profile")}
          style={{ flex: 1 }}
        >
          <Card style={{ paddingVertical: 18, paddingHorizontal: 16 }}>
            <Body style={{ fontFamily: fonts.sansSemibold, marginBottom: 4 }}>
              Cerco lavoro
            </Body>
            <Caption>Crea il mio profilo</Caption>
          </Card>
        </Pressable>
      </View>

      {/* Scan QR — primary action */}
      <Button
        label="Scansiona un QR  →"
        variant="primary"
        size="lg"
        onPress={() => router.push("/scan")}
        style={{ marginBottom: 24 }}
      />

      {/* CTA tiles — venue side */}
      <Eyebrow style={{ marginBottom: 10, textAlign: "center" }}>
        Per i locali
      </Eyebrow>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 40 }}>
        <Pressable
          onPress={() => router.push("/venue-browse-workers")}
          style={{ flex: 1 }}
        >
          <Card style={{ paddingVertical: 18, paddingHorizontal: 16 }}>
            <Body style={{ fontFamily: fonts.sansSemibold, marginBottom: 4 }}>
              Vedi candidati
            </Body>
            <Caption>Staff a Milano</Caption>
          </Card>
        </Pressable>
        <Pressable
          onPress={() => router.push("/venue-type")}
          style={{ flex: 1 }}
        >
          <Card style={{ paddingVertical: 18, paddingHorizontal: 16 }}>
            <Body style={{ fontFamily: fonts.sansSemibold, marginBottom: 4 }}>
              Gestisco un locale
            </Body>
            <Caption>Registrati in 60 sec</Caption>
          </Card>
        </Pressable>
      </View>

      <Hairline style={{ marginBottom: 24 }} />

      {/* Legal footer */}
      <View style={{ alignItems: "center" }}>
        <Caption style={{ textAlign: "center", marginBottom: 6 }}>
          K3Y Solutions S.r.l. — Milano, Italia
        </Caption>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <Pressable onPress={() => router.push("/terms")} hitSlop={8}>
            <Caption style={{ textDecorationLine: "underline" }}>Privacy</Caption>
          </Pressable>
          <Pressable onPress={() => router.push("/terms")} hitSlop={8}>
            <Caption style={{ textDecorationLine: "underline" }}>Termini</Caption>
          </Pressable>
          <Pressable
            onPress={() =>
              Linking.openURL("mailto:hello@tavoriapp.com").catch(() => {})
            }
            hitSlop={8}
          >
            <Caption style={{ textDecorationLine: "underline" }}>
              hello@tavoriapp.com
            </Caption>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
