// Sign-in: username + 4-digit PIN. Pre-fills the last username used on this
// device, so the common case is "open keypad, type 4 digits, done".

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signInWithUsernamePin } from "../lib/usernameAuth";
import { t } from "../lib/i18n";

const LAST_USERNAME_KEY = "gigi.last_username";

export default function SignIn() {
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
      // Remember the username on this device
      try {
        await AsyncStorage.setItem(
          LAST_USERNAME_KEY,
          username.trim().toLowerCase()
        );
      } catch {}
      // Home screen detects worker/venue rows and shows Continue cards
      router.replace("/");
    } catch (e: any) {
      setErrorMsg(e?.message ?? t("auth_pin.err_signin"));
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = username.trim().length > 0 && /^\d{4}$/.test(pin);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.h1}>
            <Text style={{ color: "#F0531C" }}>
              {t("auth_pin.sign_in_title").charAt(0)}
            </Text>
            {t("auth_pin.sign_in_title").slice(1)}
          </Text>
          <Text style={styles.h2}>
            {hasRemembered
              ? t("auth_pin.sign_in_sub_remembered")
              : t("auth_pin.sign_in_sub_fresh")}
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("auth_pin.username_label")}</Text>
            <View style={styles.inputWrap}>
              <Feather name="user" size={16} color="#6B7280" />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="maria-k7p2"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>
              {t("auth_pin.pin_label")}
            </Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={16} color="#6B7280" />
              <TextInput
                value={pin}
                onChangeText={(v) =>
                  setPin(v.replace(/[^0-9]/g, "").slice(0, 4))
                }
                placeholder={t("auth_pin.pin_dots")}
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                autoFocus={hasRemembered}
                returnKeyType="done"
                onSubmitEditing={() => canSubmit && onSignIn()}
              />
            </View>

            {hasRemembered && (
              <Pressable onPress={switchAccount} style={styles.switchBtn}>
                <Feather name="repeat" size={13} color="#185FA5" />
                <Text style={styles.switchTxt}>
                  {t("auth_pin.switch_account")}
                </Text>
              </Pressable>
            )}
          </View>

          {errorMsg && <Text style={styles.errorTxt}>{errorMsg}</Text>}
        </ScrollView>

        <View style={styles.bottom}>
          <Pressable
            disabled={busy || !canSubmit}
            onPress={onSignIn}
            style={[styles.cta, (!canSubmit || busy) && styles.ctaDisabled]}
          >
            {busy ? (
              <ActivityIndicator color="#F7F4EE" />
            ) : (
              <>
                <Text style={styles.ctaTxt}>{t("auth_pin.sign_in_cta")}</Text>
                <Feather name="arrow-right" size={20} color="#F7F4EE" />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F4EE" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconBtn: { padding: 4, width: 32 },

  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },

  h1: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  h2: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
    textAlign: "center",
  },

  fieldGroup: { marginTop: 28 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  input: { flex: 1, fontSize: 16, color: "#0E1A24", padding: 0 },

  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
  },
  switchTxt: { color: "#185FA5", fontSize: 13, fontWeight: "600" },

  errorTxt: {
    color: "#B91C1C",
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },

  bottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "white",
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
