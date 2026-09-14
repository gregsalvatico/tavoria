import { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { t } from "../lib/i18n";
import { localizeRole } from "../lib/positions";
import { JobPreferences, normalizeJobPreferences, WEEK_DAYS, WorkerRequirements } from "../lib/workerMatching";
import { TAVORIA } from "../lib/designTokens";

export const talentStyles = StyleSheet.create({
  section: { gap: 16, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: TAVORIA.color.border },
  titleRow: { alignItems: "baseline", flexDirection: "row", gap: 10 },
  title: { fontSize: 16, fontWeight: "600", color: TAVORIA.color.navy },
  hint: { color: TAVORIA.color.muted, fontSize: 12 },
  labelRow: { alignItems: "baseline", flexDirection: "row", gap: 4 },
  label: { fontFamily: "DMMono_500Medium", fontSize: 11, letterSpacing: 0.8, color: TAVORIA.color.muted, marginBottom: 7, textTransform: "uppercase" },
  labelSuffix: { color: TAVORIA.color.muted, fontFamily: TAVORIA.type.body, fontSize: 11, marginBottom: 7 },
  input: { backgroundColor: TAVORIA.color.white, borderWidth: 1, borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.small, height: TAVORIA.control.minHeight, paddingHorizontal: 12, paddingVertical: 0, fontSize: 15, color: TAVORIA.color.navy },
  row: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  field: { minWidth: 0 },
  inlineField: { flexGrow: 1, flexBasis: 180, minWidth: 140 },
  option: { minHeight: TAVORIA.control.compactHeight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: TAVORIA.radius.small, borderWidth: 1, borderColor: TAVORIA.color.borderStrong, justifyContent: "center", backgroundColor: TAVORIA.color.white },
  selected: { borderColor: TAVORIA.color.navy, backgroundColor: TAVORIA.color.navy },
  optionHovered: { backgroundColor: "#F3F4F0" },
  optionPressed: { opacity: 0.78 },
  optionText: { fontSize: 13, color: TAVORIA.color.navy },
  selectedText: { color: TAVORIA.color.white },
  error: { color: TAVORIA.color.error, fontSize: 14, paddingVertical: 12 },
  button: { height: TAVORIA.control.minHeight, minHeight: TAVORIA.control.minHeight, maxHeight: TAVORIA.control.minHeight, flexShrink: 0, paddingHorizontal: 22, borderRadius: TAVORIA.radius.pill, backgroundColor: TAVORIA.color.orange, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buttonText: { color: TAVORIA.color.white, fontSize: 14, fontWeight: "600" },
});

export function TalentSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return <View style={talentStyles.section}><View style={hint ? talentStyles.titleRow : undefined}><Text style={talentStyles.title}>{title}</Text>{hint ? <Text style={talentStyles.hint}>{hint}</Text> : null}</View>{children}</View>;
}
export function TalentInput({ label, labelSuffix, value, onChange, numeric = false, placeholder, inline = false }: { label: string; labelSuffix?: string; value: string; onChange: (s: string) => void; numeric?: boolean; placeholder?: string; inline?: boolean }) {
  return <View style={[talentStyles.field, inline && talentStyles.inlineField]}><View style={labelSuffix ? talentStyles.labelRow : undefined}><Text style={talentStyles.label}>{label}</Text>{labelSuffix ? <Text style={talentStyles.labelSuffix}>({labelSuffix})</Text> : null}</View><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} keyboardType={numeric ? "decimal-pad" : "default"} placeholder={placeholder} placeholderTextColor="#8B9088" style={talentStyles.input} /></View>;
}
export function TalentOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={({ hovered, pressed }) => [talentStyles.option, selected && talentStyles.selected, hovered && !selected && talentStyles.optionHovered, pressed && talentStyles.optionPressed]}><Text style={[talentStyles.optionText, selected && talentStyles.selectedText]}>{label}</Text></Pressable>;
}
const numberValue = (s: string) => s.trim() ? Number(s.replace(",", ".")) : undefined;
export function validPreferences(p: JobPreferences): boolean {
  const validTime = (v?: string) => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  const validDate = !p.availableFrom || /^\d{4}-\d{2}-\d{2}$/.test(p.availableFrom) && !Number.isNaN(Date.parse(p.availableFrom)) && new Date(p.availableFrom).toISOString().slice(0, 10) === p.availableFrom;
  return validTime(p.from) && validTime(p.to) && !!validDate &&
    [p.minimumMonthlyPay, ...Object.values(p.roleExperience ?? {})].every(v => v === undefined || Number.isFinite(v) && v >= 0 && v <= 100000);
}
export function RoleExperienceFields({ value, onChange, roles }: { value: JobPreferences; onChange: (v: JobPreferences) => void; roles: string[] }) {
  if (!roles.length) return null;
  const preferences = normalizeJobPreferences(value);
  return <View style={talentStyles.row}>{roles.map(role => <TalentInput inline key={role} label={localizeRole(role)} labelSuffix={t("talent.yearsUnit")} value={preferences.roleExperience?.[role]?.toString() ?? ""} placeholder={t("talent.unknown")} numeric onChange={v => { const next = { ...preferences.roleExperience }; const n = numberValue(v); if (n === undefined) delete next[role]; else next[role] = n; onChange({ ...preferences, roleExperience: next }); }} />)}</View>;
}
export function PreferenceFields({ value, onChange }: { value: JobPreferences; onChange: (v: JobPreferences) => void }) {
  const preferences = normalizeJobPreferences(value);
  const patch = (p: Partial<JobPreferences>) => onChange({ ...preferences, ...p });
  return <>
    <TalentSection title={t("talent.preferences")}>
      <View style={[talentStyles.row, { justifyContent: "space-between", alignItems: "center" }]}><Text style={talentStyles.title}>{t(preferences.openToWork === false ? "talent.paused" : "talent.openToWork")}</Text><Switch accessibilityLabel={t("talent.openToWork")} value={preferences.openToWork !== false} onValueChange={openToWork => patch({ openToWork })} trackColor={{ true: "#F0531C", false: "#DADCD6" }} /></View>
      <Text style={talentStyles.label}>{t("talent.days")}</Text>
      <View style={talentStyles.row}>{WEEK_DAYS.map(day => <TalentOption key={day} label={t(`talent.${day}`)} selected={preferences.days?.includes(day) ?? false} onPress={() => patch({ days: preferences.days?.includes(day) ? preferences.days.filter(d => d !== day) : [...preferences.days ?? [], day] })} />)}</View>
      <View style={talentStyles.row}>
        <TalentInput inline label={t("talent.from")} value={preferences.from ?? ""} placeholder="09:00" onChange={from => patch({ from })} />
        <TalentInput inline label={t("talent.to")} value={preferences.to ?? ""} placeholder="18:00" onChange={to => patch({ to })} />
        <TalentInput inline label={t("talent.availableFrom")} labelSuffix={t("talent.dateUnit")} value={preferences.availableFrom ?? ""} placeholder="YYYY-MM-DD" onChange={availableFrom => patch({ availableFrom })} />
      </View>
      <View style={talentStyles.row}>
        <TalentInput inline label={t("talent.minimumPay")} labelSuffix={t("talent.minimumPayUnit")} value={preferences.minimumMonthlyPay?.toString() ?? ""} numeric placeholder={t("talent.optional")} onChange={v => patch({ minimumMonthlyPay: numberValue(v) })} />
      </View>
    </TalentSection>
  </>;
}
export function RequirementFields({ value, onChange }: { value: WorkerRequirements; onChange: (v: WorkerRequirements) => void }) {
  return <TalentSection title={t("talent.requirements")}>
    <TalentInput label={t("talent.minExperience")} labelSuffix={t("talent.yearsUnit")} value={value.minimumExperience?.toString() ?? ""} numeric placeholder={t("talent.optional")} onChange={v => onChange({ ...value, minimumExperience: numberValue(v) })} />
    <Text style={talentStyles.label}>{t("talent.requiredLanguages")}</Text>
    <View style={talentStyles.row}>{["IT", "EN", "FR", "ES", "DE", "ZH", "AR", "PT"].map(code => <TalentOption key={code} label={code} selected={value.languages?.includes(code) ?? false} onPress={() => onChange({ ...value, languages: value.languages?.includes(code) ? value.languages.filter(l => l !== code) : [...value.languages ?? [], code] })} />)}</View>
  </TalentSection>;
}
