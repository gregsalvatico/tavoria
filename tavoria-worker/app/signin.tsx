// Sign-in: username + 4-digit PIN. A device-only account chooser remembers
// usernames and roles, never PINs or Supabase sessions.

import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
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
import { getCurrentUserContext } from "../lib/db";
import { setCachedHomeContext } from "../lib/homeContextCache";
import { desktopButtonStyle, useIsDesktop } from "../lib/responsive";
import StickyFooter from "../components/StickyFooter";
import ActionButton from "../components/ActionButton";
import {
  forgetAccount,
  getSavedAccounts,
  rememberAccount,
  type AccountRole,
  type SavedAccount,
} from "../lib/savedAccounts";
import { supabase } from "../lib/supabase";

export default function SignIn() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { next, shiftId, venueId, venueName } = useLocalSearchParams<{
    next?: string;
    shiftId?: string;
    venueId?: string;
    venueName?: string;
  }>();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pinError, setPinError] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [selectedRole, setSelectedRole] = useState<AccountRole | null>(null);
  const pinInputRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      const accounts = await getSavedAccounts();
      setSavedAccounts(accounts);
      if (accounts[0]) {
        setUsername(accounts[0].username);
        if (accounts[0].roles.length === 1) {
          setSelectedRole(accounts[0].roles[0]);
        }
      }
    })();
  }, []);

  const chooseAccount = (account: SavedAccount) => {
    setUsername(account.username);
    setPin("");
    setSelectedRole(account.roles.length === 1 ? account.roles[0] : null);
    setErrorMsg(null);
    setPinError(false);
  };

  const removeSavedAccount = async (account: SavedAccount) => {
    const next = await forgetAccount(account.username);
    setSavedAccounts(next);
    if (username === account.username) {
      setUsername("");
      setPin("");
      setErrorMsg(null);
      setPinError(false);
    }
  };

  const onSignIn = async () => {
    if (busy || !canSubmit) return;
    setErrorMsg(null);
    setPinError(false);
    setBusy(true);
    try {
      await signInWithUsernamePin({
        username: username.trim().toLowerCase(),
        pin,
      });
      const context = await getCurrentUserContext().catch(() => null);
      const hasSelectedRole = selectedRole === "venue"
        ? context?.hasVenue
        : context?.hasWorker;
      if (!hasSelectedRole) {
        await supabase.auth.signOut();
        throw new Error(t("auth_pin.role_unavailable"));
      }
      const roles = [
        ...(context?.hasWorker ? (["worker"] as const) : []),
        ...(context?.hasVenue ? (["venue"] as const) : []),
      ];
      setSavedAccounts(
        await rememberAccount({
          username: username.trim().toLowerCase(),
          roles,
        })
      );
      // Seed the already-mounted home before replacing this route. If the
      // context request failed, keep the home behind its neutral auth gate and
      // let its focus refresh retry instead of flashing the public landing.
      setCachedHomeContext(context);
      if (next === "venue-board" && venueId) {
        router.replace({ pathname: "/venue-board", params: { venueId } });
      } else {
        router.replace({ pathname: "/", params: { role: selectedRole } });
      }
    } catch (e: any) {
      const message = e?.message ?? t("auth_pin.err_signin");
      setErrorMsg(message);
      setPin("");
      setPinError(true);
      requestAnimationFrame(() => pinInputRef.current?.focus());
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    selectedRole !== null && username.trim().length > 0 && /^\d{4}$/.test(pin);

  return (
    <SafeAreaView
      style={styles.safe}
      edges={isDesktop ? ["top"] : ["top", "bottom"]}
    >
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
          style={styles.formScroll}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <Text style={styles.h1}>
            <Text style={{ color: "#F0531C" }}>
              {t("auth_pin.sign_in_title").charAt(0)}
            </Text>
            {t("auth_pin.sign_in_title").slice(1)}
          </Text>
          <Text style={styles.h2}>{t("auth_pin.sign_in_sub_fresh")}</Text>

          <View style={styles.rolePicker}>
            <Text style={styles.rolePickerLabel}>{t("auth_pin.sign_in_as")}</Text>
            <View style={styles.roleOptions}>
              {(["worker", "venue"] as const).map((role) => {
                const selected = selectedRole === role;
                return (
                  <Pressable
                    key={role}
                    onPress={() => {
                      setSelectedRole(role);
                      setErrorMsg(null);
                    }}
                    style={[styles.roleOption, selected && styles.roleOptionSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View style={[styles.roleOptionIcon, selected && styles.roleOptionIconSelected]}>
                      <Feather
                        name={role === "worker" ? "user" : "home"}
                        size={16}
                        color={selected ? "#F0531C" : "#6B7280"}
                      />
                    </View>
                    <Text style={[styles.roleOptionText, selected && styles.roleOptionTextSelected]}>
                      {t(role === "worker" ? "auth_pin.role_worker" : "auth_pin.role_venue")}
                    </Text>
                    {selected ? <Feather name="check" size={16} color="#F0531C" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {savedAccounts.length > 0 && (
            <View style={styles.savedAccounts}>
              <Text style={styles.savedAccountsLabel}>
                {t("auth_pin.saved_accounts")}
              </Text>
              {savedAccounts.map((account) => {
                const selected = account.username === username;
                return (
                  <View
                    key={account.username}
                    style={[styles.savedAccount, selected && styles.savedAccountSelected]}
                  >
                    <Pressable
                      onPress={() => chooseAccount(account)}
                      style={styles.savedAccountMain}
                    >
                      <View style={styles.savedAccountIcon}>
                        <Feather name="user" size={17} color="#0E1A24" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.savedAccountUsername}>{account.username}</Text>
                        <View style={styles.roleBadges}>
                          {account.roles.includes("worker") && (
                            <View style={[styles.roleBadge, styles.workerBadge]}>
                              <Feather name="briefcase" size={10} color="#185FA5" />
                              <Text style={[styles.roleBadgeText, { color: "#185FA5" }]}>
                                {t("auth_pin.role_worker")}
                              </Text>
                            </View>
                          )}
                          {account.roles.includes("venue") && (
                            <View style={[styles.roleBadge, styles.venueBadge]}>
                              <Feather name="home" size={10} color="#F0531C" />
                              <Text style={[styles.roleBadgeText, { color: "#C2410C" }]}>
                                {t("auth_pin.role_venue")}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => removeSavedAccount(account)}
                      hitSlop={10}
                      style={styles.forgetBtn}
                      accessibilityLabel={`Forget ${account.username}`}
                    >
                      <Feather name="x" size={17} color="#6B7280" />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t("auth_pin.username_label")}</Text>
            <View style={[styles.inputWrap, pinError && styles.inputWrapError]}>
              <Feather name="user" size={16} color="#6B7280" />
              <TextInput
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                }}
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
                ref={pinInputRef}
                value={pin}
                onChangeText={(v) => {
                  setPin(v.replace(/[^0-9]/g, "").slice(0, 4));
                  if (pinError) setPinError(false);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={t("auth_pin.pin_dots")}
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                returnKeyType="done"
                onSubmitEditing={() => canSubmit && onSignIn()}
              />
            </View>
          </View>

          {errorMsg && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Feather name="alert-circle" size={16} color="#B91C1C" />
              <Text style={styles.errorTxt}>{errorMsg} Enter your PIN again to retry.</Text>
            </View>
          )}

          <Pressable
            onPress={() => {
              if (selectedRole === "venue") {
                router.replace("/venue-type");
                return;
              }
              router.replace({
                pathname: "/signup",
                params: {
                  ...(next ? { next } : {}),
                  ...(shiftId ? { shiftId } : {}),
                  ...(venueId ? { venueId } : {}),
                  ...(venueName ? { venueName } : {}),
                },
              });
            }}
            style={styles.authSwitch}
          >
            <Text style={styles.authSwitchPrompt}>{t("auth_pin.new_here")}</Text>
            <Text style={styles.authSwitchLink}>{t("auth_pin.sign_up_title")}</Text>
          </Pressable>
        </ScrollView>

        <StickyFooter>
          <View style={styles.bottomInner}>
            <ActionButton
              label={t("auth_pin.sign_in_cta")}
              icon="arrow-right"
              loading={busy}
              disabled={!canSubmit}
              onPress={onSignIn}
              style={[styles.cta, isDesktop && desktopButtonStyle]}
            />
          </View>
        </StickyFooter>
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

  formScroll: { alignSelf: "center", flex: 1, maxWidth: 690, width: "100%" },
  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14 },

  h1: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 30,
    fontWeight: "400",
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

  rolePicker: { marginTop: 22 },
  rolePickerLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  roleOptions: { flexDirection: "row", gap: 8 },
  roleOption: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(14,26,36,0.10)",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 11,
  },
  roleOptionSelected: { backgroundColor: "#FFF8F4", borderColor: "#F0531C" },
  roleOptionIcon: {
    alignItems: "center",
    backgroundColor: "#F7F4EE",
    borderRadius: 8,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  roleOptionIconSelected: { backgroundColor: "#FFEFE6" },
  roleOptionText: { color: "#46505A", flex: 1, fontSize: 13, fontWeight: "700" },
  roleOptionTextSelected: { color: "#0E1A24" },

  savedAccounts: { gap: 8, marginTop: 22 },
  savedAccountsLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  savedAccount: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "rgba(14,26,36,0.10)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
  },
  savedAccountSelected: { borderColor: "#F0531C", backgroundColor: "#FFF8F4" },
  savedAccountMain: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  savedAccountIcon: {
    alignItems: "center",
    backgroundColor: "#F7F4EE",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  savedAccountUsername: { color: "#0E1A24", fontSize: 15, fontWeight: "700" },
  roleBadges: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 4 },
  roleBadge: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  workerBadge: { backgroundColor: "#E7F0F9" },
  venueBadge: { backgroundColor: "#FFEFE6" },
  roleBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  forgetBtn: { paddingHorizontal: 12, paddingVertical: 14 },

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
  inputWrapError: { borderColor: "#D92D20", borderWidth: 1 },
  input: { flex: 1, fontSize: 16, color: "#0E1A24", padding: 0 },

  errorBox: { alignItems: "center", backgroundColor: "#FDECEC", borderRadius: 12, flexDirection: "row", gap: 8, marginTop: 14, padding: 12 },
  errorTxt: {
    color: "#B91C1C",
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  authSwitch: { alignItems: "center", flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 26, paddingVertical: 8 },
  authSwitchPrompt: { color: "#6B7280", fontSize: 13 },
  authSwitchLink: { color: "#185FA5", fontSize: 13, fontWeight: "800" },

  bottom: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: "white",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  bottomInner: { alignItems: "center", alignSelf: "center", maxWidth: 690, width: "100%" },
  cta: {
    width: "100%",
  },
});
