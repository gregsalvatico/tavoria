import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CountryPicker from "../components/CountryPicker";
import {
  countryNameFromCode,
  flagFromCode,
  WORK_ELIGIBILITY_OPTIONS,
  WorkEligibilityIT,
} from "../lib/countries";
import { getWorkerProfile, patchWorkerProfile } from "../lib/workerProfile";
import { upsertWorker } from "../lib/db";
import { t } from "../lib/i18n";

const EXPERIENCE = [
  { id: 0, labelKey: "worker_experience.exp_new" },
  { id: 1, labelKey: "worker_experience.exp_under_1" },
  { id: 2, labelKey: "worker_experience.exp_1_2" },
  { id: 4, labelKey: "worker_experience.exp_3_5" },
  { id: 6, labelKey: "worker_experience.exp_5_plus" },
];

const LANGUAGES = [
  { code: "EN", labelKey: "worker_experience.lang_english" },
  { code: "IT", labelKey: "worker_experience.lang_italian" },
  { code: "FR", labelKey: "worker_experience.lang_french" },
  { code: "ES", labelKey: "worker_experience.lang_spanish" },
  { code: "DE", labelKey: "worker_experience.lang_german" },
  { code: "PT", labelKey: "worker_experience.lang_portuguese" },
  { code: "AR", labelKey: "worker_experience.lang_arabic" },
  { code: "ZH", labelKey: "worker_experience.lang_chinese" },
];

export default function WorkerExperience() {
  const router = useRouter();
  // Apply-flow params come from /worker-positions (which got them from
  // /record). We use them to land back on /applied with the venue name.
  const { next, venueName } = useLocalSearchParams<{
    next?: string;
    venueName?: string;
  }>();
  const isApplyFlow = next === "apply";

  const [years, setYears] = useState<number | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [city, setCity] = useState("Milan");
  const [otherLangs, setOtherLangs] = useState<string[]>([]);
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherDraft, setOtherDraft] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New fields — nationality defaults to Italy, eligibility defaults to EU citizen
  const [nationality, setNationality] = useState<string>("IT");
  const [eligibility, setEligibility] = useState<WorkEligibilityIT>("eu_citizen");
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const onContinue = async () => {
    setErrorMsg(null);
    setBusy(true);
    const allLanguages = [...languages, ...otherLangs];
    const yearsLabel =
      EXPERIENCE.find((e) => e.id === years)?.labelKey
        ? t(EXPERIENCE.find((e) => e.id === years)!.labelKey)
        : undefined;
    patchWorkerProfile({
      yearsExperience: years ?? undefined,
      languages: allLanguages,
      city: city.trim(),
      country: "Italy",
      nationality,
      workEligibilityIT: eligibility,
    });
    const profile = getWorkerProfile();
    try {
      const { id: workerId } = await upsertWorker({
        first_name: profile?.firstName,
        last_name: profile?.lastName,
        email: profile?.email,
        phone: profile?.phone,
        phone_visible: profile?.phoneVisible ?? true,
        age_range: profile?.ageRange,
        city: city.trim(),
        country: "Italy",
        nationality,
        work_eligibility_it: eligibility,
        years_exp: yearsLabel,
        positions: profile?.positions ?? [],
        languages: allLanguages,
      });
      patchWorkerProfile({ workerId });
      // If we're mid-apply (came via /record → /worker-positions → here),
      // land on /applied with the venueName so the worker sees a proper
      // success screen instead of the post-signup bonus hub.
      if (isApplyFlow) {
        router.replace({
          pathname: "/applied",
          params: { venueName: venueName ?? "" },
        });
      } else {
        router.push("/worker-bonus");
      }
    } catch (e: any) {
      setErrorMsg(e?.message || t("worker_experience.err_save"));
    } finally {
      setBusy(false);
    }
  };

  const toggleLang = (code: string) =>
    setLanguages((cur) =>
      cur.includes(code) ? cur.filter((x) => x !== code) : [...cur, code]
    );

  const addOtherLang = () => {
    const trimmed = otherDraft.trim();
    if (trimmed && !otherLangs.includes(trimmed)) {
      setOtherLangs((cur) => [...cur, trimmed]);
    }
    setOtherDraft("");
    setOtherOpen(false);
  };

  const removeOtherLang = (l: string) =>
    setOtherLangs((cur) => cur.filter((x) => x !== l));

  const useMyLocation = () => {
    // Mock detection — real impl would call expo-location
    setDetecting(true);
    setTimeout(() => {
      setCity("Milan");
      setDetecting(false);
    }, 700);
  };

  const canContinue =
    years !== null &&
    (languages.length > 0 || otherLangs.length > 0) &&
    city.trim().length > 1;

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
              router.replace("/worker-positions");
            }}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Feather name="chevron-left" size={26} color="#0E1A24" />
          </Pressable>
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotOn]} />
            <View style={[styles.dot, styles.dotOn]} />
          </View>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.h1}>
            <Text style={{ color: "#F0531C" }}>
              {t("worker_experience.title").charAt(0)}
            </Text>
            {t("worker_experience.title").slice(1)}
          </Text>

          <Text style={styles.sectionTitle}>{t("worker_experience.years_exp")}</Text>
          <View style={styles.chipWrap}>
            {EXPERIENCE.map((e) => {
              const on = years === e.id;
              return (
                <Pressable
                  key={e.id}
                  onPress={() => setYears(e.id)}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>
                    {t(e.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>{t("worker_experience.languages")}</Text>
          <View style={styles.chipWrap}>
            {LANGUAGES.map((l) => {
              const on = languages.includes(l.code);
              return (
                <Pressable
                  key={l.code}
                  onPress={() => toggleLang(l.code)}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>
                    {t(l.labelKey)}
                  </Text>
                </Pressable>
              );
            })}

            {/* Custom-language tags */}
            {otherLangs.map((l) => (
              <Pressable
                key={`other-${l}`}
                onPress={() => removeOtherLang(l)}
                style={[styles.chip, styles.chipOther]}
              >
                <Text style={[styles.chipTxt, styles.chipTxtOther]}>{l}</Text>
                <Feather
                  name="x"
                  size={12}
                  color="white"
                  style={{ marginLeft: 4 }}
                />
              </Pressable>
            ))}

            {/* "Other" add chip */}
            <Pressable
              onPress={() => setOtherOpen(true)}
              style={[styles.chip, styles.chipAddOther]}
            >
              <Feather
                name="plus"
                size={13}
                color="#9CA3AF"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.chipAddOtherTxt}>{t("worker_experience.other_chip")}</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>{t("worker_experience.city")}</Text>
          <View style={styles.inputWrap}>
            <Feather name="map-pin" size={14} color="#6B7280" />
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder={t("worker_experience.city_placeholder")}
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>
          <Pressable onPress={useMyLocation} style={styles.locateBtn}>
            {detecting ? (
              <>
                <Feather name="loader" size={14} color="#185FA5" />
                <Text style={styles.locateBtnTxt}>{t("worker_experience.detecting")}</Text>
              </>
            ) : (
              <>
                <Feather name="navigation" size={14} color="#185FA5" />
                <Text style={styles.locateBtnTxt}>{t("worker_experience.use_my_location")}</Text>
              </>
            )}
          </Pressable>

          {/* Nationality */}
          <Text style={styles.sectionTitle}>
            {t("worker_experience.nationality")}
          </Text>
          <Pressable
            onPress={() => setCountryPickerOpen(true)}
            style={styles.pickerBtn}
          >
            <Text style={styles.pickerFlag}>{flagFromCode(nationality)}</Text>
            <Text style={styles.pickerLbl}>
              {countryNameFromCode(nationality) ?? t("worker_experience.nationality_choose")}
            </Text>
            <Feather name="chevron-down" size={18} color="#6B7280" />
          </Pressable>

          {/* Right to work in Italy */}
          <Text style={styles.sectionTitle}>
            {t("worker_experience.work_eligibility_it")}
          </Text>
          <Text style={styles.sectionSub}>
            {t("worker_experience.work_eligibility_sub")}
          </Text>
          <View style={styles.eligibilityCol}>
            {WORK_ELIGIBILITY_OPTIONS.map((opt) => {
              const on = eligibility === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setEligibility(opt.id)}
                  style={[styles.eligRow, on && styles.eligRowOn]}
                >
                  <Text style={styles.eligEmoji}>{opt.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eligLbl, on && styles.eligLblOn]}>
                      {t(opt.lblKey)}
                    </Text>
                    <Text style={[styles.eligSub, on && styles.eligSubOn]}>
                      {t(`${opt.lblKey}_sub`)}
                    </Text>
                  </View>
                  <View
                    style={[styles.eligRadio, on && styles.eligRadioOn]}
                  >
                    {on && (
                      <Feather name="check" size={14} color="#F7F4EE" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: 12 }} />
        </ScrollView>

        <CountryPicker
          visible={countryPickerOpen}
          selectedCode={nationality}
          onClose={() => setCountryPickerOpen(false)}
          onSelect={(c) => setNationality(c.code)}
          title={t("worker_experience.nationality_picker")}
        />

        {/* Custom language modal */}
        <Modal
          visible={otherOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setOtherOpen(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
            onPress={() => setOtherOpen(false)}
          />
          <View style={styles.otherSheet}>
            <View style={styles.otherGrabber} />
            <Text style={styles.otherTitle}>{t("worker_experience.other_lang_title")}</Text>
            <Text style={styles.otherSub}>
              {t("worker_experience.other_lang_sub")}
            </Text>
            <TextInput
              value={otherDraft}
              onChangeText={setOtherDraft}
              placeholder={t("worker_experience.other_lang_placeholder")}
              placeholderTextColor="#9CA3AF"
              autoFocus
              autoCapitalize="words"
              style={styles.otherInput}
              returnKeyType="done"
              onSubmitEditing={addOtherLang}
            />
            <Pressable
              disabled={otherDraft.trim().length < 2}
              onPress={addOtherLang}
              style={[
                styles.otherAddBtn,
                otherDraft.trim().length < 2 && styles.otherAddBtnDisabled,
              ]}
            >
              <Text style={styles.otherAddTxt}>{t("worker_experience.other_lang_add")}</Text>
            </Pressable>
          </View>
        </Modal>

        {errorMsg && <Text style={styles.errorTxt}>{errorMsg}</Text>}

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
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

  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 },
  h1: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  h2: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0E1A24",
    textAlign: "center",
    marginTop: 22,
    marginBottom: 10,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  chipOn: { backgroundColor: "#0E1A24", borderColor: "#0E1A24" },
  chipTxt: { fontSize: 13, fontWeight: "600", color: "#0E1A24" },
  chipTxtOn: { color: "white" },

  chipOther: {
    backgroundColor: "#534AB7",
    borderColor: "#534AB7",
    flexDirection: "row",
    alignItems: "center",
  },
  chipTxtOther: { color: "white" },
  chipAddOther: {
    flexDirection: "row",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
    backgroundColor: "transparent",
  },
  chipAddOtherTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    fontStyle: "italic",
  },

  locateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 6,
  },
  locateBtnTxt: { color: "#185FA5", fontSize: 13, fontWeight: "600" },

  otherSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  otherGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignSelf: "center",
    marginBottom: 14,
  },
  otherTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0E1A24",
    textAlign: "center",
  },
  otherSub: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  otherInput: {
    backgroundColor: "#F1EFE8",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    color: "#0E1A24",
    marginTop: 16,
  },
  otherAddBtn: {
    backgroundColor: "#F0531C",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 12,
  },
  otherAddBtnDisabled: { backgroundColor: "rgba(11,15,26,0.15)" },
  otherAddTxt: { color: "white", fontSize: 15, fontWeight: "700" },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  input: { flex: 1, fontSize: 16, color: "#0E1A24", padding: 0 },

  // Phone visibility consent toggle
  phoneToggleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  phoneToggleBox: {
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
  phoneToggleBoxOn: {
    backgroundColor: "#F0531C",
    borderColor: "#F0531C",
  },
  phoneToggleLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0E1A24",
    marginBottom: 2,
    lineHeight: 18,
  },
  phoneToggleSub: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },

  // Sub-title under section header (used for work-eligibility helper text)
  sectionSub: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: -4,
    marginBottom: 10,
    paddingHorizontal: 20,
  },

  // Country picker button — tap opens CountryPicker modal
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  pickerFlag: { fontSize: 24 },
  pickerLbl: { flex: 1, fontSize: 16, color: "#0E1A24", fontWeight: "600" },

  // Work-eligibility radio list
  eligibilityCol: { gap: 8 },
  eligRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  eligRowOn: {
    backgroundColor: "#EAF3DE",
    borderColor: "rgba(99,153,34,0.40)",
    borderWidth: 1.5,
  },
  eligEmoji: { fontSize: 22 },
  eligLbl: { fontSize: 14, fontWeight: "700", color: "#0E1A24" },
  eligLblOn: { color: "#3B6D11" },
  eligSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  eligSubOn: { color: "#3B6D11" },
  eligRadio: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },
  eligRadioOn: {
    backgroundColor: "#3B6D11",
    borderColor: "#3B6D11",
  },

  errorTxt: {
    color: "#B91C1C",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 20,
    paddingTop: 6,
  },

  bottom: {
    padding: 16,
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
