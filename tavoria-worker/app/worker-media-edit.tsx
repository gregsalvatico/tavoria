import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StickyFooter from "../components/StickyFooter";
import ActionButton from "../components/ActionButton";
import { talentStyles as s } from "../components/TalentFields";
import { mediaSlots } from "../components/WorkerProfileContent";
import { getCurrentWorkerFull, updateCurrentWorker, uploadWorkerMedia } from "../lib/db";
import { t } from "../lib/i18n";
import { pickImageWeb, pickVideoWeb } from "../lib/webMedia";
import { TAVORIA } from "../lib/designTokens";

export default function WorkerMediaEdit() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind = params.kind === "video" ? "video" : "photo";
  const [row, setRow] = useState<any>(null), [busy, setBusy] = useState<number | null>(null), [error, setError] = useState("");
  const load = () => getCurrentWorkerFull().then(w => { if (!w) throw new Error(t("talent.loadError")); setRow(w); }).catch(e => setError(e.message));
  useEffect(() => { void load(); }, []);
  const slots = row ? mediaSlots(row, kind) : [];
  const nextSlot = slots.findIndex(url => !url);
  const pick = async (slot: number) => {
    setError(""); setBusy(slot);
    try {
      const result = Platform.OS === "web" ? kind === "photo" ? await pickImageWeb({ camera: false }) : await pickVideoWeb({ camera: false }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: [kind === "photo" ? "images" : "videos"], quality: 0.8 });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const url = await uploadWorkerMedia(kind, asset.uri, (asset as any).mimeType, slot);
      setRow((current: any) => { const slots = mediaSlots(current, kind); slots[slot] = url; return { ...current, [`${kind}_urls`]: slots, ...(slot === 0 ? { [`${kind}_url`]: url } : {}) }; });
    } catch (e: any) { setError(e.message ?? t("talent.uploadError")); } finally { setBusy(null); }
  };
  const remove = async (slot: number) => {
    setBusy(slot); setError("");
    try {
      const slots = mediaSlots(row, kind); slots[slot] = null;
      const patch: any = { [`${kind}_urls`]: slots, ...(slot === 0 ? { [`${kind}_url`]: null } : {}) };
      await updateCurrentWorker(patch); setRow((current: any) => ({ ...current, ...patch }));
    } catch (e: any) { setError(e.message); } finally { setBusy(null); }
  };
  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
      <Pressable accessibilityLabel={t("talent.close")} onPress={() => router.dismissTo("/candidate")} style={styles.back}><Feather name="arrow-left" size={20} color={TAVORIA.color.navy} /></Pressable>
      <Text style={styles.title}>{t(`talent.${kind === "photo" ? "photos" : "videos"}`)}</Text>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {!row ? error ? <Pressable onPress={load}><Text>{t("talent.retry")}</Text></Pressable> : <ActivityIndicator color={TAVORIA.color.orange} /> : <View style={styles.grid}>{slots.map((url, i) => url ? <View key={i} style={[styles.item, { width: kind === "photo" ? 140 : 220 }]}>
        <View style={styles.preview}>{kind === "photo" ? <Image source={{ uri: url }} style={styles.image} /> : <Feather name="video" size={24} color={TAVORIA.color.muted} />}</View>
        <Text style={styles.label}>{kind === "video" ? t(`talent.${["intro", "pitch", "lang"][i]}`) : `${t("talent.photos")} ${i + 1}`}</Text>
        <View style={styles.itemActions}><Pressable disabled={busy !== null} onPress={() => pick(i)} style={styles.secondary}><Text style={s.optionText}>{t(url ? "talent.replace" : "talent.add")}</Text>{busy === i && <ActivityIndicator size="small" color={TAVORIA.color.orange} />}</Pressable>{url && <Pressable disabled={busy !== null} accessibilityLabel={t("talent.remove")} onPress={() => remove(i)} style={styles.delete}><Feather name="trash-2" size={16} color={TAVORIA.color.muted} /></Pressable>}</View>
      </View> : null)}{nextSlot >= 0 && <Pressable disabled={busy !== null} onPress={() => pick(nextSlot)} style={styles.add}><Feather name="plus" size={16} color={TAVORIA.color.orange} /><Text style={styles.addText}>{t("talent.add")}</Text>{busy === nextSlot && <ActivityIndicator size="small" color={TAVORIA.color.orange} />}</Pressable>}</View>}
    </ScrollView><StickyFooter desktopRow><ActionButton label={t("common.done")} icon="check" onPress={() => router.dismissTo("/candidate")} /></StickyFooter>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TAVORIA.color.paperDeep },
  content: { alignSelf: "center", gap: 20, maxWidth: 840, padding: 24, width: "100%" },
  back: { alignSelf: "flex-start", paddingVertical: 8 },
  title: { color: TAVORIA.color.navy, fontFamily: "InstrumentSerif_400Regular", fontSize: 29 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  item: { gap: 12, maxWidth: "100%" },
  preview: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, height: 170, justifyContent: "center", overflow: "hidden" },
  image: { height: "100%", width: "100%" },
  label: { color: TAVORIA.color.muted, fontSize: 12, fontWeight: "700" },
  itemActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  secondary: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.small, borderWidth: 1, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 40, paddingHorizontal: 13 },
  delete: { alignItems: "center", height: 36, justifyContent: "center", width: 36 },
  add: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.medium, borderWidth: 1, flexDirection: "row", gap: 8, height: 48, justifyContent: "center", paddingHorizontal: 18 },
  addText: { color: TAVORIA.color.navy, fontSize: 13, fontWeight: "700" },
});
