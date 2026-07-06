// Tavoria v2 — sign-in screen.
//
// Username + 4-digit PIN, pre-filling the last username used on this device.
// Same business logic as v1; rebuilt with the kit + editorial type system.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import {
  BackBar,
  Body,
  Button,
  Caption,
  Eyebrow,
  H1,
  Screen,
  TextField,
} from "../components/kit";
import { colors, fonts } from "../lib/theme";
import { t } from "../lib/i18n";
import { signInWithUsernamePin } from "../lib/usernameAuth";

const LAST_USERNAME_KEY = "tavoria.last_username";

export default function SignInV2() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasRemembered, setHasRemembered] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const last = await AsyncStorage.getItem(LAST_USERNAME_KEY);
        if (last) {
          setUsername(last);
          setHasRemembered(true);
        }
      } catch {}
    })();
  }, []);

  const switchAccount = async () => {
    setUsername("");
    setPin("");
    setErrorMsg(null);
    setHasRemembered(false);
    try {
      await AsyncStorage.removeItem(LAST_USERNAME_KEY);
    } catch {}
  };

  const onSignIn = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      await signInWithUsernamePin({
        username: username.trim().toLowerCase(),
        pin,
      });
      try {
        await AsyncStorage.setItem(
          LAST_USERNAME_KEY,
          username.trim().toLowerCase()
        );
      } catch {}
      router.replace("/");
    } catch (e: any) {
      setErrorMsg(e?.message ?? t("auth_pin.err_signin"));
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    username.trim().length > 0 && /^\d{4}$/.test(pin) && !busy;

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <BackBar onBack={() => router.back()} />

        <Eyebrow accent style={{ marginBottom: 10 }}>
          {t("auth_pin.signin_kicker")}
        </Eyebrow>
        <H1 italic style={{ fontSize: 40, lineHeight: 42, marginBottom: 10 }}>
          {t("auth_pin.sign_in_title")}
        </H1>
        <Body muted style={{ marginBottom: 28 }}>
          {t("auth_pin.sign_in_sub")}
        </Body>

        <TextField
          label={t("auth_pin.username_label")}
          value={username}
          onChangeText={setUsername}
          placeholder="maria-kp7x"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!hasRemembered}
          returnKeyType="next"
        />

        {hasRemembered ? (
          <Pressable
            onPress={switchAccount}
            hitSlop={8}
            style={{ marginTop: -10, marginBottom: 16 }}
          >
            <Caption
              style={{
                color: colors.tangerine,
                fontFamily: fonts.sansSemibold,
                textDecorationLine: "underline",
              }}
            >
              {t("auth_pin.switch_account")}
            </Caption>
          </Pressable>
        ) : null}

        <TextField
          label={t("auth_pin.pin_label")}
          value={pin}
          onChangeText={(v) => setPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
          placeholder="••••"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          returnKeyType="done"
          onSubmitEditing={() => canSubmit && onSignIn()}
        />

        {errorMsg ? (
          <Caption style={{ color: colors.danger, marginBottom: 14 }}>
            {errorMsg}
          </Caption>
        ) : null}

        <Button
          label={busy ? "..." : `${t("auth_pin.sign_in_cta")}  →`}
          variant="primary"
          size="lg"
          onPress={onSignIn}
          disabled={!canSubmit}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 28,
            paddingVertical: 8,
          }}
        >
          <Caption style={{ marginRight: 4 }}>
            {t("auth_pin.no_account")}
          </Caption>
          <Link href="/signup?next=worker-profile" asChild>
            <Pressable hitSlop={6}>
              <Text
                style={{
                  fontFamily: fonts.sansSemibold,
                  fontSize: 13,
                  color: colors.ink,
                  textDecorationLine: "underline",
                }}
              >
                {t("home.worker_cta")}
              </Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
