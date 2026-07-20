// Worker signup screen — username + 4-digit PIN.
// User types name → username auto-generated in gray. User picks a 4-digit PIN.
// Routes onward to /record (apply flow) or /record?next=worker-profile.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { t } from "../lib/i18n";
import {
  generateUsername,
  signUpWithUsernamePin,
} from "../lib/usernameAuth";
import { patchWorkerProfile } from "../lib/workerProfile";
import { recordWorkerTermsAcceptance, upsertWorker } from "../lib/db";
import { registerPush } from "../lib/pushNotifications";
import { sendWelcomeEmail } from "../lib/email";

const LAST_USERNAME_KEY = "gigi.last_username";

export default function Signup() {
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
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Username is regenerated once a name has been entered.
  // Keeping the suffix stable while the user keeps typing the same name.
  const [usernameSuffix, setUsernameSuffix] = useState<string>("");
  useEffect(() => {
    if (firstName.trim().length >= 1 && !usernameSuffix) {
      const u = generateUsername(firstName);
      setUsernameSuffix(u.split("-").pop() || "");
    }
  }, [firstName, usernameSuffix]);

  const username = useMemo(() => {
    if (firstName.trim().length < 1 || !usernameSuffix) return "";
    return `${generateUsernameFromCachedSuffix(firstName, usernameSuffix)}`;
  }, [firstName, usernameSuffix]);

  const pinValid = /^\d{4}$/.test(pin);
  const pinsMatch = pinValid && pin === pin2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canContinue =
    firstName.trim().length >= 1 &&
    emailValid &&
    pinValid &&
    pinsMatch &&
    username.length > 0 &&
    acceptedTerms;

  const onContinue = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      // Sign up — handles collision retries internally
      const { username: finalUsername } = await signUpWithUsernamePin({
        username,
        pin,
        firstName: firstName.trim(),
      });
      patchWorkerProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        phoneVisible: true,
      });
      // Persist name + phone to Supabase right away so the worker row has
      // an identity even if the user never completes profile setup (e.g. they
      // go straight to the apply flow and stop after submitting a video).
      // worker-experience.tsx will later upsert the rest of the data on top.
      try {
        const { id: workerId } = await upsertWorker({
          first_name: firstName.trim(),
          last_name: lastName.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim(),
          phone_visible: true,
        });
        patchWorkerProfile({ workerId });
      } catch (e) {
        console.warn("[signup] initial upsertWorker failed", e);
      }
      // Record T&C acceptance immediately (audit trail before user can abandon)
      try {
        await recordWorkerTermsAcceptance(t("terms.version") || "v1.0");
      } catch (e) {
        console.warn("[signup] terms acceptance write failed", e);
      }
      // Workers sign in with a generated username, so send that username to
      // the real email address collected during signup.
      sendWelcomeEmail({
        kind: "worker",
        email: email.trim(),
        username: finalUsername,
        displayName: firstName.trim(),
      }).catch((e) => console.warn("[signup] welcome email failed:", e));
      // Register for push notifications — soft prompt, no-op in Expo Go.
      // Fire-and-forget so we don't block the user.
      registerPush({ role: "worker" }).catch(() => {});
      // Remember the username for pre-filling Sign In next time
      try {
        await AsyncStorage.setItem(LAST_USERNAME_KEY, finalUsername);
      } catch {}

      // Continue to the rest of signup (or directly to apply / venue-board flow)
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
        // After QR-scan signup: record then land on the venue board
        router.replace({
          pathname: "/record",
          params: { next: "venue-board", venueId },
        });
      } else {
        router.replace(
          isProfileFlow ? "/record?next=worker-profile" : "/record"
        );
      }
    } catch (e: any) {
      setErrorMsg(e?.message || t("auth_pin.err_signup"));
    } finally {
      setBusy(false);
    }
  };

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
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotOn]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.breadcrumb}>
            {isApplyFlow ? (
              <>
                <Feather name="briefcase" size={13} color="#854F0B" />
                <Text style={styles.breadcrumbTxt}>
                  {t("auth_pin.breadcrumb_apply")}{" "}
                  <Text style={styles.breadcrumbBold}>
                    {venueName || t("auth_pin.breadcrumb_this_shift")}
                  </Text>
                </Text>
              </>
            ) : (
              <>
                <Feather name="user" size={13} color="#854F0B" />
                <Text style={styles.breadcrumbTxt}>
                  {t("auth_pin.breadcrumb_welcome")}{" "}
                  <Text style={styles.breadcrumbBold}>Tavoria</Text>
                </Text>
              </>
            )}
          </View>

          <Text style={[styles.h1, { textAlign: "center" }]}>
            <Text style={{ color: "#F0531C" }}>
              {t("auth_pin.sign_up_title").charAt(0)}
            </Text>
            {t("auth_pin.sign_up_title").slice(1)}
          </Text>
          <Text style={styles.h2}>{t("auth_pin.sign_up_sub")}</Text>

          {/* First name + auto username preview */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("signup.first_name")}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Maria"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            {username ? (
              <Text style={styles.usernameHint}>
                {t("auth_pin.username_hint")}{" "}
                <Text style={styles.usernameMono}>{username}</Text>
              </Text>
            ) : (
              <Text style={styles.usernameHintMuted}>
                {t("auth_pin.username_placeholder")}
              </Text>
            )}

            <Text style={[styles.label, { marginTop: 18 }]}>
              {t("signup.last_name")}{" "}
              <Text style={styles.optional}>({t("common.optional")})</Text>
            </Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="García"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>
              {t("signup.email")}
            </Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={16} color="#6B7280" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Phone — used so venues can reach the worker on WhatsApp post-hire.
                Optional today; SMS verification coming later. */}
            <Text style={[styles.label, { marginTop: 18 }]}>
              {t("contact.your_phone_label")}{" "}
              <Text style={styles.optional}>({t("common.optional")})</Text>
            </Text>
            <View style={styles.inputWrap}>
              <Feather name="phone" size={16} color="#6B7280" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder={t("contact.your_phone_placeholder")}
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* PIN — number keypad, hidden as dots */}
            <Text style={[styles.label, { marginTop: 22 }]}>
              {t("auth_pin.pin_label")}
            </Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={16} color="#6B7280" />
              <TextInput
                value={pin}
                onChangeText={(v) => setPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
                placeholder={t("auth_pin.pin_dots")}
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                returnKeyType="next"
              />
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>
              {t("auth_pin.pin_confirm")}
            </Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={16} color="#6B7280" />
              <TextInput
                value={pin2}
                onChangeText={(v) => setPin2(v.replace(/[^0-9]/g, "").slice(0, 4))}
                placeholder={t("auth_pin.pin_dots")}
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                returnKeyType="done"
                onSubmitEditing={() => canContinue && onContinue()}
              />
            </View>
            {pin.length === 4 && pin2.length === 4 && !pinsMatch && (
              <Text style={styles.errorTxt}>
                {t("auth_pin.pins_dont_match")}
              </Text>
            )}
          </View>

          {errorMsg && <Text style={styles.errorTxt}>{errorMsg}</Text>}

          <Pressable
            style={styles.termsRow}
            onPress={() => setAcceptedTerms((v) => !v)}
            hitSlop={6}
          >
            <View
              style={[
                styles.checkbox,
                acceptedTerms && styles.checkboxChecked,
              ]}
            >
              {acceptedTerms && (
                <Feather name="check" size={14} color="white" />
              )}
            </View>
            <Text style={styles.termsTxt}>
              {t("terms.accept_short")}{" "}
              <Link href="/terms" asChild>
                <Text style={styles.termsLink}>{t("terms.accept_link")}</Text>
              </Link>
            </Text>
          </Pressable>

          <Text style={styles.legal}>{t("auth_pin.sign_up_legal")}</Text>
          <Text style={styles.requirements}>
            Enter your name and email, matching 4-digit PINs, and accept the Terms to continue.
          </Text>
        </ScrollView>

        <View style={styles.bottom}>
          <Pressable
            disabled={!canContinue || busy}
            onPress={onContinue}
            style={[styles.cta, (!canContinue || busy) && styles.ctaDisabled]}
          >
            {busy ? (
              <ActivityIndicator color="#F7F4EE" />
            ) : (
              <>
                <Text style={styles.ctaTxt}>{t("common.continue")}</Text>
                <Feather name="arrow-right" size={20} color="#F7F4EE" />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Helper to keep the displayed username stable while the user is still typing
function generateUsernameFromCachedSuffix(
  firstName: string,
  suffix: string
): string {
  const slug = firstName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return `${slug || "user"}-${suffix}`;
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
  dotsRow: { flexDirection: "row", gap: 5 },
  dot: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(11,15,26,0.15)",
  },
  dotOn: { backgroundColor: "#0E1A24" },

  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },

  breadcrumb: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FAEEDA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 14,
  },
  breadcrumbTxt: { color: "#854F0B", fontSize: 12 },
  breadcrumbBold: { fontWeight: "700" },

  h1: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.6,
  },
  h2: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
    textAlign: "center",
  },

  fieldGroup: { marginTop: 24 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  optional: { textTransform: "none", color: "#9CA3AF", letterSpacing: 0 },

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

  usernameHint: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
  },
  usernameHintMuted: {
    marginTop: 6,
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  usernameMono: {
    color: "#F0531C",
    fontWeight: "700",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },

  errorTxt: {
    color: "#B91C1C",
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },

  legal: {
    marginTop: 14,
    fontSize: 11,
    lineHeight: 16,
    color: "#9CA3AF",
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
  requirements: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 10,
  },
  ctaTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginTop: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#9CA3AF",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: "#F0531C",
    borderColor: "#F0531C",
  },
  termsTxt: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#4B4F58",
  },
  termsLink: {
    color: "#185FA5",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
