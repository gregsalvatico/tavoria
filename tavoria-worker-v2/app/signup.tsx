// Tavoria v2 — worker signup (matches Claude-Design target).
//
// Card-style inputs, PhoneField with country prefix, 4-box PIN, GDPR
// TrustCard, slim progress bar. Same business logic as v1 (username +
// 4-digit PIN). All copy via t() so 5 languages work.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import {
  Body,
  Button,
  Caption,
  Eyebrow,
  H1,
  PhoneField,
  PinBoxes,
  ProgressBar,
  Screen,
  TextField,
  TrustCard,
} from "../components/kit";
import { colors, fonts } from "../lib/theme";
import { t } from "../lib/i18n";
import { recordWorkerTermsAcceptance, upsertWorker } from "../lib/db";
import { registerPush } from "../lib/pushNotifications";
import { patchWorkerProfile } from "../lib/workerProfile";
import { generateUsername, signUpWithUsernamePin } from "../lib/usernameAuth";

const LAST_USERNAME_KEY = "tavoria.last_username";

export default function SignupV2() {
  const router = useRouter();
  const { next, shiftId, venueId, venueName } = useLocalSearchParams<{
    next?: string;
    shiftId?: string;
    venueId?: string;
    venueName?: string;
  }>();
  const isProfileFlow = next === "worker-profile";
  const isApplyFlow = next === "apply";
  const isVenueBoardFlow = next === "venue-board";

  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Username auto-generates as user types
  const [usernameSuffix, setUsernameSuffix] = useState<string>("");
  useEffect(() => {
    if (firstName.trim().length >= 2 && !usernameSuffix) {
      const u = generateUsername(firstName);
      setUsernameSuffix(u.split("-").pop() || "");
    }
  }, [firstName, usernameSuffix]);

  const username = useMemo(() => {
    if (firstName.trim().length < 2 || !usernameSuffix) return "";
    const slug = firstName
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24);
    return `${slug || "user"}-${usernameSuffix}`;
  }, [firstName, usernameSuffix]);

  const pinValid = /^\d{4}$/.test(pin);
  const pinsMatch = pinValid && pin === pin2;
  const canContinue =
    firstName.trim().length >= 2 &&
    pinValid &&
    pinsMatch &&
    username.length > 0 &&
    !busy;

  // Progress estimation across the form (0..1)
  const progress =
    (firstName.trim().length >= 2 ? 0.34 : 0) +
    (pinValid ? 0.33 : 0) +
    (pinsMatch ? 0.33 : 0);

  const onContinue = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      const { username: finalUsername } = await signUpWithUsernamePin({
        username,
        pin,
        firstName: firstName.trim(),
      });
      patchWorkerProfile({
        firstName: firstName.trim(),
        phone: phone.trim() || undefined,
        phoneVisible: true,
      });
      try {
        const { id: workerId } = await upsertWorker({
          first_name: firstName.trim(),
          phone: phone.trim() || undefined,
          phone_visible: true,
        });
        patchWorkerProfile({ workerId });
      } catch (e) {
        console.warn("[signup-v2] upsertWorker failed", e);
      }
      // Implicit T&C acceptance: by continuing the user agrees per the footer
      // disclaimer below the CTA.
      try {
        await recordWorkerTermsAcceptance(t("terms.version") || "v1.0");
      } catch (e) {
        console.warn("[signup-v2] terms acceptance write failed", e);
      }
      registerPush({ role: "worker" }).catch(() => {});
      try {
        await AsyncStorage.setItem(LAST_USERNAME_KEY, finalUsername);
      } catch {}

      if (isApplyFlow && shiftId && venueId) {
        router.replace({
          pathname: "/record",
          params: {
            next: "apply",
            shiftId,
            venueId,
            venueName: venueName ?? "",
          },
        });
      } else if (isVenueBoardFlow && venueId) {
        router.replace({
          pathname: "/record",
          params: { next: "venue-board", venueId },
        });
      } else {
        router.replace(isProfileFlow ? "/record?next=worker-profile" : "/record");
      }
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
        {/* Slim progress bar */}
        <ProgressBar current={progress} total={1} />

        {/* Eyebrow + headline */}
        <Eyebrow accent style={{ marginBottom: 8 }}>
          {t("signup.kicker")}
        </Eyebrow>
        <H1
          italic
          style={{ fontSize: 40, lineHeight: 42, marginBottom: 10 }}
        >
          {t("signup.headline")}
        </H1>
        <Body muted style={{ marginBottom: 30 }}>
          {t("signup.sub")}
        </Body>

        {/* Name */}
        <TextField
          label={t("signup.first_name")}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Maria"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
        />
        {username ? (
          <Caption style={{ marginTop: -10, marginBottom: 14 }}>
            {t("auth_pin.username_hint")}{" "}
            <Text style={{ color: colors.tangerine, fontFamily: fonts.mono }}>
              {username}
            </Text>
          </Caption>
        ) : null}

        {/* Phone */}
        <PhoneField
          label={t("contact.your_phone_label")}
          optional
          value={phone}
          onChangeText={setPhone}
          placeholder="333 1234567"
          hint={t("signup.phone_hint")}
        />

        {/* PIN */}
        <PinBoxes
          label={t("signup.pin_label")}
          value={pin}
          onChange={setPin}
          hint={t("signup.pin_hint")}
        />

        {/* Confirm PIN */}
        <PinBoxes
          label={t("signup.pin_confirm_label")}
          value={pin2}
          onChange={setPin2}
          error={
            pin.length === 4 && pin2.length === 4 && !pinsMatch
              ? t("auth_pin.pins_dont_match")
              : undefined
          }
        />

        {/* GDPR trust card */}
        <TrustCard
          title={t("signup.trust_title")}
          body={t("signup.trust_body")}
          style={{ marginTop: 8 }}
        />

        {errorMsg ? (
          <Caption style={{ color: colors.danger, marginBottom: 14 }}>
            {errorMsg}
          </Caption>
        ) : null}

        {/* Continue */}
        <Button
          label={busy ? "..." : `${t("common.continue")}  →`}
          variant="primary"
          size="lg"
          onPress={onContinue}
          disabled={!canContinue}
        />

        {/* Footer disclaimer (T&C link) */}
        <Caption style={{ marginTop: 14, textAlign: "center" }}>
          {t("signup.footer_legal")}{" "}
          <Link href="/terms" asChild>
            <Pressable hitSlop={4}>
              <Text
                style={{
                  color: colors.ink,
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

        {/* Sign-in link */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 24,
            paddingVertical: 8,
          }}
        >
          <Caption style={{ marginRight: 4 }}>
            {t("auth_pin.already_have_account")}
          </Caption>
          <Link href="/signin" asChild>
            <Pressable hitSlop={6}>
              <Text
                style={{
                  fontFamily: fonts.sansSemibold,
                  fontSize: 13,
                  color: colors.ink,
                  textDecorationLine: "underline",
                }}
              >
                {t("home.sign_in")}
              </Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
