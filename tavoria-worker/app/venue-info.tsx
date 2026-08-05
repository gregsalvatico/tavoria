import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { patchVenueProfile, getVenueProfile } from "../lib/venueProfile";
import { insertVenue, recordVenueTermsAcceptance } from "../lib/db";
import { registerPush } from "../lib/pushNotifications";
import { sendVenueWelcomeEmail } from "../lib/email";
import { t } from "../lib/i18n";
import {
  generateUsername,
  nameToSlug,
  signUpWithUsernamePin,
} from "../lib/usernameAuth";
import { rememberAccount } from "../lib/savedAccounts";
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

export default function VenueInfo() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stable username suffix while user keeps typing the venue name
  const [usernameSuffix, setUsernameSuffix] = useState<string>("");
  useEffect(() => {
    if (name.trim().length >= 1 && !usernameSuffix) {
      const u = generateUsername(name);
      setUsernameSuffix(u.split("-").pop() || "");
    }
  }, [name, usernameSuffix]);

  const username = useMemo(() => {
    if (name.trim().length < 1 || !usernameSuffix) return "";
    const slug = nameToSlug(name) || "venue";
    return `${slug}-${usernameSuffix}`;
  }, [name, usernameSuffix]);

  const pinValid = /^\d{4}$/.test(pin);
  const pinsMatch = pinValid && pin === pin2;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canContinue =
    name.trim().length >= 1 &&
    emailValid &&
    pinValid &&
    pinsMatch &&
    username.length > 0 &&
    acceptedTerms;

  const onContinue = async () => {
    setErrorMsg(null);
    setBusy(true);
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const city = trimmedAddress.split(",").pop()?.trim() || "Milan";
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const type = getVenueProfile()?.type;
    try {
      // 1. Create the auth user (username + PIN) — gives us a stable user_id
      const { username: finalUsername } = await signUpWithUsernamePin({
        username,
        pin,
        firstName: trimmedName,
      });
      // 2. Insert the venue row tied to that auth user
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
      // Record T&C acceptance immediately for audit trail
      try {
        await recordVenueTermsAcceptance(row.id, t("terms.version") || "v1.0");
      } catch (e) {
        console.warn("[venue-info] terms acceptance write failed", e);
      }
      // Register for push notifications (soft prompt; no-op in Expo Go)
      registerPush({ role: "venue", venueId: row.id }).catch(() => {});
      // 3. Store this account chooser entry locally (never the PIN or a session).
      await rememberAccount({ username: finalUsername, roles: ["venue"] });
      // Email is best-effort: account creation must still succeed if the
      // provider is temporarily unavailable or not configured yet.
      sendVenueWelcomeEmail({
        email: trimmedEmail,
        username: finalUsername,
        venueName: trimmedName,
      }).catch((e) => console.warn("[venue-info] welcome email failed:", e));
      router.push("/venue-photo");
    } catch (e: any) {
      setErrorMsg(e?.message || "Could not save. Try again.");
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
              router.replace("/venue-type");
            }}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Feather name="chevron-left" size={26} color="#0E1A24" />
          </Pressable>
          <ProgressDots step={1} total={4} />
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.h1, styles.h1Center]}>
            <Text style={styles.h1Accent}>{t("venue_info.title").charAt(0)}</Text>
            {t("venue_info.title").slice(1)}
          </Text>
          <Text style={[styles.sub, { textAlign: "center" }]}>
            {t("venue_info.sub")}
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("venue_info.venue_name")}</Text>
            <View style={styles.inputWrap}>
              <Feather name="bookmark" size={16} color="#6B7280" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Bar Centrale"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                autoFocus
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            {username ? (
              <Text style={styles.usernameHint}>
                Your username:{" "}
                <Text style={styles.usernameMono}>{username}</Text>
              </Text>
            ) : (
              <Text style={styles.usernameHintMuted}>
                Username will appear here
              </Text>
            )}

            {/* PIN + Confirm — number keypad, hidden as dots */}
            <Text style={[styles.label, { marginTop: 18 }]}>4-digit PIN</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={16} color="#6B7280" />
              <TextInput
                value={pin}
                onChangeText={(v) =>
                  setPin(v.replace(/[^0-9]/g, "").slice(0, 4))
                }
                placeholder="••••"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                returnKeyType="next"
              />
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Confirm PIN</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={16} color="#6B7280" />
              <TextInput
                value={pin2}
                onChangeText={(v) =>
                  setPin2(v.replace(/[^0-9]/g, "").slice(0, 4))
                }
                placeholder="••••"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                returnKeyType="next"
              />
            </View>
            {pin.length === 4 && pin2.length === 4 && !pinsMatch && (
              <Text style={styles.errorTxt}>PINs don't match</Text>
            )}

            <Text style={[styles.label, { marginTop: 18 }]}>{t("venue_info.address")}</Text>
            <View style={styles.inputWrap}>
              <Feather name="map-pin" size={16} color="#6B7280" />
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Street, City"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                returnKeyType="next"
              />
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>{t("signup.email")}</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={16} color="#6B7280" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="manager@barcentrale.it"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>
              {t("venue_info.phone")}{" "}
              <Text style={styles.labelOptional}>({t("common.optional")})</Text>
            </Text>
            <View style={styles.inputWrap}>
              <Feather name="phone" size={16} color="#6B7280" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+39 02 1234 5678"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>

          </View>

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

          <View style={{ height: 12 }} />
          <Text style={styles.requirements}>
            Enter a venue name, valid email, matching 4-digit PINs, and accept the Terms to continue.
          </Text>
        </ScrollView>

        {errorMsg && (
          <Text style={styles.errorTxt}>{errorMsg}</Text>
        )}

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

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.progress}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.progDot, i <= step && styles.progDotActive]} />
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

  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  h1: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 30,
    fontWeight: "400",
    color: "#0E1A24",
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  h1Center: { textAlign: "center" },
  h1Accent: { color: "#F0531C" },
  sub: { color: "#6B7280", fontSize: 14, marginTop: 6 },

  fieldGroup: { marginTop: 28 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  labelOptional: {
    color: "#9CA3AF",
    fontWeight: "500",
    textTransform: "none",
    letterSpacing: 0,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  input: { flex: 1, fontSize: 16, color: "#0E1A24", padding: 0 },

  // Username preview under the venue name field
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
    textAlign: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  bottom: { paddingBottom: 24, paddingHorizontal: 20, paddingTop: 20 },
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
