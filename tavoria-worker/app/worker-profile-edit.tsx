import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CountryPicker from "../components/CountryPicker";
import ActionButton from "../components/ActionButton";
import StickyFooter from "../components/StickyFooter";
import { PreferenceFields, TalentInput, TalentOption, TalentSection, talentStyles as s, validPreferences } from "../components/TalentFields";
import { countryNameFromCode } from "../lib/countries";
import { getCurrentWorkerFull, updateCurrentWorker } from "../lib/db";
import { t } from "../lib/i18n";
import { ROLE_IDS, localizeRole } from "../lib/positions";
import { patchWorkerProfile } from "../lib/workerProfile";
import { TAVORIA } from "../lib/designTokens";

export default function WorkerProfileEdit() {
  const router = useRouter();
  const [row, setRow] = useState<any>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => { setError(""); getCurrentWorkerFull().then(w => { if (!w) throw new Error(t("talent.loadError")); setRow(w); }).catch(() => setError(t("talent.loadError"))); };
  useEffect(load, []);
  const patch = (p: any) => setRow((v: any) => ({ ...v, ...p }));
  const save = async () => {
    if (!row.first_name?.trim() || !row.city?.trim() || !row.positions?.length || !validPreferences(row.job_preferences ?? {})) { setError(t("talent.invalid")); return; }
    setBusy(true); setError("");
    try {
      await updateCurrentWorker({ first_name: row.first_name.trim(), last_name: row.last_name?.trim(), city: row.city.trim(), age_range: row.age_range, nationality: row.nationality, positions: row.positions, languages: row.languages, job_preferences: row.job_preferences ?? {} });
      patchWorkerProfile({ firstName: row.first_name.trim(), lastName: row.last_name?.trim(), city: row.city.trim(), ageRange: row.age_range, nationality: row.nationality, positions: row.positions, languages: row.languages, jobPreferences: row.job_preferences });
      router.replace("/candidate");
    } catch (e: any) { setError(e.message ?? t("talent.invalid")); } finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityLabel={t("talent.close")} onPress={() => router.replace("/candidate")} style={styles.back}><Feather name="arrow-left" size={20} color={TAVORIA.color.navy} /></Pressable>
      <Text style={styles.title}>{t("talent.edit")}</Text>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {!row ? error ? <Pressable onPress={load}><Text>{t("talent.retry")}</Text></Pressable> : <ActivityIndicator color={TAVORIA.color.orange} /> : <>
        <TalentSection title={t("talent.basics")}>
          <View style={s.row}><TalentInput label={t("talent.name")} value={row.first_name ?? ""} onChange={first_name => patch({ first_name })} /><TalentInput label={t("talent.surname")} value={row.last_name ?? ""} onChange={last_name => patch({ last_name })} /></View>
          <TalentInput label={t("talent.location")} value={row.city ?? ""} onChange={city => patch({ city })} />
          <Text style={s.label}>{t("talent.age")}</Text><View style={s.row}>{["18–20", "21–25", "26–30", "31–40", "41–50", "50+"].map(age => <TalentOption key={age} label={age} selected={row.age_range === age} onPress={() => patch({ age_range: age })} />)}</View>
          <Text style={s.label}>{t("talent.nationality")}</Text><Pressable onPress={() => setCountryOpen(true)} style={[s.input, { justifyContent: "center" }]}><Text>{row.nationality ? countryNameFromCode(row.nationality) : t("talent.unknown")}</Text></Pressable>
        </TalentSection>
        <TalentSection title={t("talent.roles")}><View style={s.row}>{Array.from(new Set([...ROLE_IDS, ...row.positions ?? []])).map(role => <TalentOption key={role} label={`${localizeRole(role)}${row.positions?.[0] === role ? ` · ${t("talent.primary")}` : ""}`} selected={row.positions?.includes(role) ?? false} onPress={() => patch({ positions: row.positions?.includes(role) ? row.positions.filter((r: string) => r !== role) : (row.positions?.length ?? 0) < 3 ? [...row.positions ?? [], role] : row.positions })} />)}</View></TalentSection>
        <TalentSection title={t("talent.spoken")}><View style={s.row}>{Array.from(new Set(["IT", "EN", "FR", "ES", "DE", "PT", "AR", "ZH", ...row.languages ?? []])).map(code => <TalentOption key={code} label={code} selected={row.languages?.includes(code) ?? false} onPress={() => patch({ languages: row.languages?.includes(code) ? row.languages.filter((l: string) => l !== code) : [...row.languages ?? [], code] })} />)}</View></TalentSection>
        <PreferenceFields roles={row.positions ?? []} value={row.job_preferences ?? {}} onChange={job_preferences => patch({ job_preferences })} />
      </>}
    </ScrollView>
    <StickyFooter desktopRow><ActionButton label={t("talent.save")} icon="check" loading={busy} disabled={!row} onPress={save} /></StickyFooter>
    <CountryPicker visible={countryOpen} selectedCode={row?.nationality} onSelect={country => { patch({ nationality: country.code }); setCountryOpen(false); }} onClose={() => setCountryOpen(false)} />
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TAVORIA.color.paperDeep },
  content: { alignSelf: "center", maxWidth: 840, padding: 24, width: "100%" },
  back: { alignSelf: "flex-start", paddingVertical: 10 },
  title: { color: TAVORIA.color.navy, fontFamily: "InstrumentSerif_400Regular", fontSize: 29, marginBottom: 4 },
});
