// Tavoria v2 — venue info (step 2 of 4 in venue onboarding).
//
// Collects venue name, address, contact email, optional phone, and a 4-digit
// PIN. Editorial form pattern: DM Mono labels, thin hairline inputs, single
// orange CTA. Same business logic as v1.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import {
  BackBar,
  Body,
  Button,
  Caption,
  Checkbox,
  Eyebrow,
  H1,
  Screen,
  TextField,
} from "../components/kit";
import { colors, fonts } from "../lib/theme";
import { t } from "../lib/i18n";
import { insertVenue, recordVenueTermsAcceptance, uploadVenuePhoto } from "../lib/db";
import { registerPush } from "../lib/pushNotifications";
import { generateUsername, nameToSlug, signUpWithUsernamePin } from "../lib/usernameAuth";
import { getVenueProfile, patchVenueProfile } from "../lib/venueProfile";

const LAST_USERNAME_KEY = "tavoria.last_username";

export default function VenueInfoV2() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("Via Brera 12, Milano");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [usernameSuffix, setUsernameSuffix] = useState<string>("");
  useEffect(() => {
    if (name.trim().length >= 2 && !usernameSuffix) {
      const u = generateUsername(name);
      setUsernameSuffix(u.split("-").pop() || "");
    }
  }, [name, usernameSuffix]);

  const username = useMemo(() => {
    if (name.trim().length < 2 || !usernameSuffix) return "";
    const slug = nameToSlug(name) || "venue";
    return `${slug}-${usernameSuffix}`;
  }, [name, usernameSuffix]);

  const pinValid = /^\d{4}$/.test(pin);
  const pinsMatch = pinValid && pin === pin2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canContinue =
    name.trim().length >= 2 &&
    emailValid &&
    pinValid &&
    pinsMatch &&
    username.length > 0 &&
    acceptedTerms &&
    !busy;

  const onContinue = async () => {
    setErrorMsg(null);
    setBusy(true);
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const city = trimmedAddress.split(",").pop()?.trim() || "Milano";
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const type = getVenueProfile()?.type;
    try {
      const { username: finalUsername } = await signUpWithUsernamePin({
        username,
        pin,
        firstName: trimmedName,
      });
      const row = await insertVenue({
        name: trimmedName,
        type,
        address: trimmedAddress,
        city,
        email: trimmedEmail,
        phone: trimmedPhone || undefined,
      });
      patchVenueProfile({
        id: row.id,
        name: trimmedName,
        address: trimmedAddress,
        city,
        email: trimmedEmail,
        phone: trimmedPhone || undefined,
      });
      try {
        await recordVenueTermsAcceptance(row.id, t("terms.version") || "v1.0");
      } catch (e) {
        console.warn("[venue-info-v2] terms acceptance write failed", e);
      }
      registerPush({ role: "venue", venueId: row.id }).catch(() => {});
      try {
        await AsyncStorage.setItem(LAST_USERNAME_KEY, finalUsername);
      } catch {}
      router.push("/venue-photo");
    } catch (e: any) {
      setErrorMsg(e?.message || t("auth_pin.err_signup"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <BackBar onBack={() => router.back()} step={2} totalSteps={4} />

        <Eyebrow accent style={{ marginBottom: 10 }}>
          {t("venue_info.kicker")}
        </Eyebrow>
        <H1 italic style={{ fontSize: 36, lineHeight: 38, marginBottom: 6 }}>
          {t("venue_info.title")}
        </H1>
        <Body muted style={{ marginBottom: 28 }}>
          {t("venue_info.sub")}
        </Body>

        <TextField
          label={t("venue_info.name_label")}
          value={name}
          onChangeText={setName}
          placeholder="Cinelandia"
          autoCapitalize="words"
          returnKeyType="next"
        />
        {username ? (
          <Caption style={{ marginTop: -14, marginBottom: 16 }}>
            {t("auth_pin.username_hint")}{" "}
            <Text style={{ color: colors.tangerine, fontFamily: fonts.mono }}>
              {username}
            </Text>
          </Caption>
        ) : null}

        <TextField
          label={t("venue_info.address_label")}
          value={address}
          onChangeText={setAddress}
          placeholder="Via Brera 12, Milano"
          autoCapitalize="words"
          returnKeyType="next"
        />

        <TextField
          label={t("venue_info.email_label")}
          value={email}
          onChangeText={setEmail}
          placeholder="ciao@locale.it"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />

        <TextField
          label={t("venue_info.phone_label")}
          optional
          value={phone}
          onChangeText={setPhone}
          placeholder="+39 ..."
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />

        <TextField
          label={t("auth_pin.pin_label")}
          value={pin}
          onChangeText={(v) => setPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
          placeholder="••••"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          returnKeyType="next"
          hint={t("auth_pin.pin_hint")}
        />

        <TextField
          label={t("auth_pin.pin_confirm")}
          value={pin2}
          onChangeText={(v) => setPin2(v.replace(/[^0-9]/g, "").slice(0, 4))}
          placeholder="••••"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          returnKeyType="done"
          onSubmitEditing={() => canContinue && onContinue()}
          error={
            pin.length === 4 && pin2.length === 4 && !pinsMatch
              ? t("auth_pin.pins_dont_match")
              : undefined
          }
        />

        <Checkbox
          checked={acceptedTerms}
          onToggle={() => setAcceptedTerms((v) => !v)}
          style={{ marginTop: 6, marginBottom: 18 }}
        >
          <Caption>
            {t("terms.accept_short")}{" "}
            <Link href="/terms" asChild>
              <Pressable hitSlop={4}>
                <Text
                  style={{
                    color: colors.tangerine,
                    fontFamily: fonts.sansSemibold,
                    fontSize: 13,
                    textDecorationLine: "underline",
                  }}
                >
                  {t("terms.accept_link")}
                </Text>
              </Pressable>
            </Link>
          </Caption>
        </Checkbox>

        {errorMsg ? (
          <Caption style={{ color: colors.danger, marginBottom: 14 }}>
            {errorMsg}
          </Caption>
        ) : null}

        <Button
          label={busy ? "..." : `${t("common.continue")}  →`}
          variant="primary"
          size="lg"
          onPress={onContinue}
          disabled={!canContinue}
        />

        <Caption style={{ marginTop: 14, textAlign: "center" }}>
          {t("auth_pin.sign_up_legal")}
        </Caption>
      </KeyboardAvoidingView>
    </Screen>
  );
}
