import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateShift, updateShiftStatus } from "../lib/db";
import {
  STANDARD_CONTRACT_TYPES,
  normalizeContractType,
  parseContractTypes,
  serializeContractTypes,
} from "../lib/contractTypes";
import { t } from "../lib/i18n";
import { supabase } from "../lib/supabase";
import ActionButton from "../components/ActionButton";
import ResponsiveModal from "../components/ResponsiveModal";
import { RequirementFields } from "../components/TalentFields";
import StickyFooter from "../components/StickyFooter";
import { FormFlowHeader } from "../components/PagePrimitives";
import { useIsDesktop } from "../lib/responsive";
import { TAVORIA } from "../lib/designTokens";
import type { WorkerRequirements } from "../lib/workerMatching";

const UNITS = ["hour", "day", "week", "month"] as const;
const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2).toString().padStart(2, "0");
  return `${hours}:${index % 2 === 0 ? "00" : "30"}`;
});

export default function ShiftEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState<WorkerRequirements>({});
  const [saving, setSaving] = useState(false);
  const [contracts, setContracts] = useState<string[]>(["part_time"]);
  const [customContract, setCustomContract] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [pay, setPay] = useState("");
  const [unit, setUnit] = useState<(typeof UNITS)[number]>("hour");
  const [shiftStatus, setShiftStatus] = useState<"live" | "paused">("live");
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        Alert.alert("Could not load shift", error.message);
        router.back();
        return;
      }
      const rawContracts = parseContractTypes(data.contract_type);
      const normalizedContracts = Array.from(new Set(rawContracts.map((value) => normalizeContractType(value) ?? "other")));
      const customValue = rawContracts.find((value) => normalizeContractType(value) === null) ?? "";
      setRequirements(data.worker_requirements ?? {});
      setContracts(normalizedContracts.length ? normalizedContracts : ["part_time"]);
      setCustomContract(customValue);
      setStart(data.hours_start ?? "");
      setEnd(data.hours_end ?? "");
      setPay(data.pay_amount?.toString() ?? "");
      setShiftStatus(data.status === "paused" ? "paused" : "live");
      if (UNITS.includes(data.pay_unit as (typeof UNITS)[number])) {
        setUnit(data.pay_unit as (typeof UNITS)[number]);
      }
      setLoading(false);
    })();
  }, [id]);

  const canSave = useMemo(() => {
    const payAmount = Number(pay.replace(",", "."));
    return (
      Number.isFinite(payAmount) &&
      payAmount >= 0 &&
      (requirements.minimumExperience === undefined || Number.isFinite(requirements.minimumExperience) && requirements.minimumExperience >= 0 && requirements.minimumExperience <= 80) &&
      contracts.length > 0 && (!contracts.includes("other") || customContract.trim().length > 0)
    );
  }, [contracts, customContract, pay, requirements]);

  const toggleStatus = async () => {
    if (!id || statusSaving) return;
    const previous = shiftStatus;
    const next = previous === "live" ? "paused" : "live";
    setShiftStatus(next);
    setStatusSaving(true);
    try {
      await updateShiftStatus(id, next);
    } catch (error: any) {
      setShiftStatus(previous);
      Alert.alert(t("shift_detail.status_update_error_title"), error?.message ?? t("shift_detail.try_again"));
    } finally {
      setStatusSaving(false);
    }
  };

  const save = async () => {
    if (!id || !canSave) return;
    const payAmount = Number(pay.replace(",", "."));
    setSaving(true);
    try {
      await updateShift(id, {
        worker_requirements: requirements,
        contract_type: serializeContractTypes(contracts, customContract),
        hours_start: start || undefined,
        hours_end: end || undefined,
        pay_amount: payAmount,
        pay_unit: unit,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Could not save shift", error?.message ?? "Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FormFlowHeader
        title={t("shift_edit.title")}
        subtitle={t("shift_edit.intro")}
        onBack={() => router.back()}
      />

      {loading ? (
        <View style={styles.loading}><ActivityIndicator color="#F0531C" size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View style={[styles.statusCard, shiftStatus === "live" ? styles.statusCardLive : styles.statusCardPaused]}>
            <View style={styles.statusCopy}>
              <Text style={styles.statusLabel}>{shiftStatus === "live" ? t("shift_owner.live") : t("shift_owner.paused")}</Text>
              <Text style={styles.statusHint}>
                {t(shiftStatus === "live" ? "shift_owner.tap_to_pause" : "shift_owner.tap_to_resume")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: statusSaving }}
              disabled={statusSaving}
              onPress={() => void toggleStatus()}
              style={({ hovered, pressed }) => [
                styles.statusToggle,
                shiftStatus === "live" ? styles.statusToggleLive : styles.statusTogglePaused,
                hovered && styles.statusToggleHovered,
                pressed && styles.statusTogglePressed,
              ]}
            >
              <View style={[styles.statusDot, shiftStatus === "live" ? styles.statusDotLive : styles.statusDotPaused]} />
              <Text style={[styles.statusToggleText, shiftStatus === "live" ? styles.statusToggleTextLive : styles.statusToggleTextPaused]}>
                {shiftStatus === "live" ? t("shift_owner.live") : t("shift_owner.paused")}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>{t("shift_edit.contract")}</Text>
          <View style={styles.optionGrid}>
            {STANDARD_CONTRACT_TYPES.map((item) => (
              <Choice
                key={item}
                label={t(`post_shift.${item}`)}
                selected={contracts.includes(item)}
                onPress={() => setContracts((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])}
              />
            ))}
            <Choice
              label={t("post_shift.other")}
              selected={contracts.includes("other")}
              onPress={() => setContracts((current) => current.includes("other") ? current.filter((value) => value !== "other") : [...current, "other"])}
            />
          </View>
          {contracts.includes("other") ? (
            <Field
              label={t("post_shift.other")}
              value={customContract}
              onChangeText={setCustomContract}
              placeholder={t("shift_edit.contract_placeholder")}
            />
          ) : null}

          <View style={styles.timeRow}>
            <TimeField label={t("shift_edit.start_time")} value={start} onChange={setStart} />
            <TimeField label={t("shift_edit.end_time")} value={end} onChange={setEnd} />
          </View>

          <Field
            label={t("shift_edit.pay")}
            value={pay}
            onChangeText={(value) => setPay(value.replace(/[^0-9,.]/g, ""))}
            placeholder="12"
            keyboardType="decimal-pad"
          />
          <Text style={styles.label}>{t("shift_edit.pay_period")}</Text>
          <View style={styles.unitRow}>
            {UNITS.map((item) => (
              <Choice
                key={item}
                label={t(`post_shift.per_${item}`)}
                selected={unit === item}
                onPress={() => setUnit(item)}
              />
            ))}
          </View>

          <RequirementFields value={requirements} onChange={setRequirements} />
        </ScrollView>
      )}
      {!loading ? (
        <StickyFooter desktopRow>
          <ActionButton label={t("shift_edit.save")} icon="check" loading={saving} disabled={!canSave} onPress={save} />
        </StickyFooter>
      ) : null}
    </SafeAreaView>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceOn]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextOn]}>{label}</Text>
      {selected ? <Feather name="check" size={15} color="#F0531C" /> : null}
    </Pressable>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.timeField}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={styles.timeSelect}>
        <Text style={[styles.timeValue, !value && styles.timePlaceholder]}>{value || "--:--"}</Text>
        <Feather name="chevron-down" size={18} color="#5D6670" />
      </Pressable>
      <ResponsiveModal visible={open} onClose={() => setOpen(false)}>
          <View style={styles.timeSheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={12}><Feather name="x" size={22} color="#0E1A24" /></Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.timeOptions}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              {TIME_OPTIONS.map((time) => (
                <Choice
                  key={time}
                  label={time}
                  selected={value === time}
                  onPress={() => { onChange(time); setOpen(false); }}
                />
              ))}
            </ScrollView>
          </View>
      </ResponsiveModal>
    </View>
  );
}

function Field({ label, ...props }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "decimal-pad" }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor="#9CA3AF" /></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TAVORIA.color.paperDeep },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  content: { alignSelf: "center", paddingHorizontal: 16, paddingTop: TAVORIA.space.sm, paddingBottom: 24, width: "100%" },
  contentDesktop: { maxWidth: 840, paddingHorizontal: 24 },
  statusCard: { alignItems: "center", borderRadius: TAVORIA.radius.medium, borderWidth: 1, flexDirection: "row", gap: 14, justifyContent: "space-between", marginBottom: 24, padding: 14 },
  statusCardLive: { backgroundColor: "#EAF3DE", borderColor: "rgba(59,109,17,0.28)" },
  statusCardPaused: { backgroundColor: TAVORIA.color.paper, borderColor: TAVORIA.color.borderStrong },
  statusCopy: { flex: 1, minWidth: 0 },
  statusLabel: { color: TAVORIA.color.navy, fontSize: 14, fontWeight: "800" },
  statusHint: { color: TAVORIA.color.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  statusToggle: { alignItems: "center", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 7, minHeight: 38, paddingHorizontal: 12 },
  statusToggleLive: { backgroundColor: "#F5FAEE", borderColor: "#3B6D11" },
  statusTogglePaused: { backgroundColor: TAVORIA.color.paperDeep, borderColor: TAVORIA.color.borderStrong },
  statusToggleHovered: { backgroundColor: "rgba(14,26,36,0.08)" },
  statusTogglePressed: { opacity: 0.72 },
  statusDot: { borderRadius: 999, height: 8, width: 8 },
  statusDotLive: { backgroundColor: "#3B6D11" },
  statusDotPaused: { backgroundColor: "#6B7280" },
  statusToggleText: { fontSize: 12, fontWeight: "800" },
  statusToggleTextLive: { color: "#3B6D11" },
  statusToggleTextPaused: { color: TAVORIA.color.muted },
  label: { color: TAVORIA.color.navy, fontSize: 12, fontWeight: "800", marginBottom: 7 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  choice: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.small, borderWidth: 1, flexDirection: "row", gap: 6, minHeight: 44, paddingHorizontal: 12, paddingVertical: 9 },
  choiceOn: { backgroundColor: TAVORIA.color.orangeSoft, borderColor: TAVORIA.color.orange },
  choiceText: { color: TAVORIA.color.ink, fontSize: 13, fontWeight: "700" },
  choiceTextOn: { color: "#C2410C" },
  field: { marginBottom: 18 },
  input: { backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.small, borderWidth: 1, color: TAVORIA.color.navy, fontSize: 16, minHeight: 50, paddingHorizontal: 14 },
  timeRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  timeField: { flex: 1 },
  timeSelect: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.small, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 50, paddingHorizontal: 14 },
  timeValue: { color: "#0E1A24", fontFamily: "DMMono_500Medium", fontSize: 16 },
  timePlaceholder: { color: "#9CA3AF" },
  unitRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modalBackdrop: { backgroundColor: "rgba(14,26,36,0.42)", flex: 1, justifyContent: "flex-end" },
  timeSheet: { backgroundColor: "#F7F4EE", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "72%", padding: 18 },
  sheetHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  sheetTitle: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 24 },
  timeOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 12 },
});
