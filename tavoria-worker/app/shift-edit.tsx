import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateShift } from "../lib/db";
import { t } from "../lib/i18n";
import { localizeContractType } from "../lib/contractTypes";
import { supabase } from "../lib/supabase";

const UNITS = ["hour", "day", "week", "month"] as const;

export default function ShiftEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [pay, setPay] = useState("");
  const [unit, setUnit] = useState<(typeof UNITS)[number]>("hour");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("shifts").select("contract_type, hours_start, hours_end, pay_amount, pay_unit").eq("id", id).single();
      if (error) {
        Alert.alert("Could not load shift", error.message);
        router.back();
        return;
      }
      setContract(localizeContractType(data.contract_type));
      setStart(data.hours_start ?? "");
      setEnd(data.hours_end ?? "");
      setPay(data.pay_amount?.toString() ?? "");
      if (UNITS.includes(data.pay_unit as (typeof UNITS)[number])) setUnit(data.pay_unit as (typeof UNITS)[number]);
      setLoading(false);
    })();
  }, [id, router]);

  const save = async () => {
    if (!id) return;
    const payAmount = Number(pay.replace(",", "."));
    if (!Number.isFinite(payAmount) || payAmount < 0) {
      Alert.alert("Check pay", "Enter a valid pay amount.");
      return;
    }
    setSaving(true);
    try {
      await updateShift(id, { contract_type: contract.trim() || undefined, hours_start: start.trim() || undefined, hours_end: end.trim() || undefined, pay_amount: payAmount, pay_unit: unit });
      router.back();
    } catch (error: any) {
      Alert.alert("Could not save shift", error?.message ?? "Try again.");
    } finally { setSaving(false); }
  };

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    <View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={12}><Feather name="chevron-left" size={26} color="#0E1A24" /></Pressable><Text style={styles.title}>{t("shift_edit.title")}</Text><View style={{ width: 26 }} /></View>
    {loading ? <View style={styles.loading}><ActivityIndicator color="#F0531C" size="large" /></View> : <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>{t("shift_edit.intro")}</Text>
      <Field label={t("shift_edit.contract")} value={contract} onChangeText={setContract} placeholder={t("shift_edit.contract_placeholder")} />
      <View style={styles.timeRow}><View style={{ flex: 1 }}><Field label={t("shift_edit.start_time")} value={start} onChangeText={setStart} placeholder="18:00" /></View><View style={{ flex: 1 }}><Field label={t("shift_edit.end_time")} value={end} onChangeText={setEnd} placeholder="23:00" /></View></View>
      <Field label={t("shift_edit.pay")} value={pay} onChangeText={setPay} placeholder="12" keyboardType="decimal-pad" />
      <Text style={styles.label}>{t("shift_edit.pay_period")}</Text><View style={styles.unitRow}>{UNITS.map((item) => <Pressable key={item} onPress={() => setUnit(item)} style={[styles.unit, unit === item && styles.unitOn]}><Text style={[styles.unitText, unit === item && styles.unitTextOn]}>{t(`post_shift.per_${item}`)}</Text></Pressable>)}</View>
      <Pressable style={[styles.save, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color="white" /> : <><Feather name="check" size={18} color="white" /><Text style={styles.saveText}>{t("shift_edit.save")}</Text></>}</Pressable>
    </ScrollView>}
  </SafeAreaView>;
}

function Field({ label, ...props }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: "default" | "decimal-pad" }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor="#9CA3AF" /></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" }, header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }, title: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 24 }, loading: { alignItems: "center", flex: 1, justifyContent: "center" }, content: { padding: 18 }, intro: { color: "#5D6670", fontSize: 14, lineHeight: 20, marginBottom: 22 }, field: { marginBottom: 16 }, label: { color: "#0E1A24", fontSize: 12, fontWeight: "800", marginBottom: 7 }, input: { backgroundColor: "white", borderColor: "rgba(14,26,36,0.12)", borderRadius: 13, borderWidth: 1, color: "#0E1A24", fontSize: 15, minHeight: 52, paddingHorizontal: 14 }, timeRow: { flexDirection: "row", gap: 10 }, unitRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, unit: { backgroundColor: "white", borderColor: "rgba(14,26,36,0.12)", borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 }, unitOn: { backgroundColor: "#FFF0E7", borderColor: "#F0531C" }, unitText: { color: "#5D6670", fontSize: 12, fontWeight: "700" }, unitTextOn: { color: "#F0531C" }, save: { alignItems: "center", backgroundColor: "#F0531C", borderRadius: 999, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 28, minHeight: 54 }, saveText: { color: "white", fontSize: 15, fontWeight: "800" },
});
