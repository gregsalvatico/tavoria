import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateShift } from "../lib/db";
import { STANDARD_CONTRACT_TYPES, normalizeContractType } from "../lib/contractTypes";
import { t } from "../lib/i18n";
import { desktopButtonStyle, useIsDesktop } from "../lib/responsive";
import { supabase } from "../lib/supabase";

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
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState<string>("part_time");
  const [customContract, setCustomContract] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [pay, setPay] = useState("");
  const [unit, setUnit] = useState<(typeof UNITS)[number]>("hour");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("contract_type, hours_start, hours_end, pay_amount, pay_unit")
        .eq("id", id)
        .single();
      if (error) {
        Alert.alert("Could not load shift", error.message);
        router.back();
        return;
      }
      const knownContract = normalizeContractType(data.contract_type);
      setContract(knownContract ?? "other");
      setCustomContract(knownContract ? "" : data.contract_type ?? "");
      setStart(data.hours_start ?? "");
      setEnd(data.hours_end ?? "");
      setPay(data.pay_amount?.toString() ?? "");
      if (UNITS.includes(data.pay_unit as (typeof UNITS)[number])) {
        setUnit(data.pay_unit as (typeof UNITS)[number]);
      }
      setLoading(false);
    })();
  }, [id, router]);

  const canSave = useMemo(() => {
    const payAmount = Number(pay.replace(",", "."));
    return (
      Number.isFinite(payAmount) &&
      payAmount >= 0 &&
      (contract !== "other" || customContract.trim().length > 0)
    );
  }, [contract, customContract, pay]);

  const save = async () => {
    if (!id || !canSave) return;
    const payAmount = Number(pay.replace(",", "."));
    setSaving(true);
    try {
      await updateShift(id, {
        contract_type: contract === "other" ? customContract.trim() : contract,
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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        <Text style={styles.title}>{t("shift_edit.title")}</Text>
        <View style={styles.back} />
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator color="#F0531C" size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <Text style={styles.intro}>{t("shift_edit.intro")}</Text>

          <Text style={styles.label}>{t("shift_edit.contract")}</Text>
          <View style={styles.optionGrid}>
            {STANDARD_CONTRACT_TYPES.map((item) => (
              <Choice
                key={item}
                label={t(`post_shift.${item}`)}
                selected={contract === item}
                onPress={() => setContract(item)}
              />
            ))}
            <Choice
              label={t("post_shift.other")}
              selected={contract === "other"}
              onPress={() => setContract("other")}
            />
          </View>
          {contract === "other" ? (
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

          <Pressable
            style={[styles.save, isDesktop && desktopButtonStyle, (!canSave || saving) && styles.saveDisabled]}
            onPress={save}
            disabled={!canSave || saving}
          >
            {saving ? <ActivityIndicator color="white" /> : <><Feather name="check" size={18} color="white" /><Text style={styles.saveText}>{t("shift_edit.save")}</Text></>}
          </Pressable>
        </ScrollView>
      )}
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
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.timeSheet} onPress={(event) => event.stopPropagation()}>
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
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Field({ label, ...props }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "decimal-pad" }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor="#9CA3AF" /></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  back: { alignItems: "center", height: 32, justifyContent: "center", width: 32 },
  title: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 24 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  content: { padding: 18, paddingBottom: 36 },
  intro: { color: "#5D6670", fontSize: 14, lineHeight: 20, marginBottom: 22 },
  label: { color: "#0E1A24", fontSize: 12, fontWeight: "800", marginBottom: 7 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  choice: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.12)", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 6, minHeight: 44, paddingHorizontal: 12, paddingVertical: 9 },
  choiceOn: { backgroundColor: "#FFF0E7", borderColor: "#F0531C" },
  choiceText: { color: "#46505A", fontSize: 13, fontWeight: "700" },
  choiceTextOn: { color: "#C2410C" },
  field: { marginBottom: 18 },
  input: { backgroundColor: "white", borderColor: "rgba(14,26,36,0.12)", borderRadius: 13, borderWidth: 1, color: "#0E1A24", fontSize: 16, minHeight: 52, paddingHorizontal: 14 },
  timeRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  timeField: { flex: 1 },
  timeSelect: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.12)", borderRadius: 13, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 52, paddingHorizontal: 14 },
  timeValue: { color: "#0E1A24", fontFamily: "DMMono_500Medium", fontSize: 16 },
  timePlaceholder: { color: "#9CA3AF" },
  unitRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  save: { alignItems: "center", backgroundColor: "#F0531C", borderRadius: 999, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 28, minHeight: 54 },
  saveDisabled: { opacity: 0.42 },
  saveText: { color: "white", fontSize: 15, fontWeight: "800" },
  modalBackdrop: { backgroundColor: "rgba(14,26,36,0.42)", flex: 1, justifyContent: "flex-end" },
  timeSheet: { backgroundColor: "#F7F4EE", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "72%", padding: 18 },
  sheetHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  sheetTitle: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 24 },
  timeOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 12 },
});
