import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { patchWorkerProfile } from "../lib/workerProfile";

const POSITIONS = [
  "Barista",
  "Waiter",
  "Runner",
  "Cashier",
  "Host",
  "Bartender",
  "Cook",
  "Chef",
  "Kitchen helper",
  "Cleaner",
];

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "IT", label: "Italian" },
  { code: "FR", label: "French" },
  { code: "ES", label: "Spanish" },
  { code: "DE", label: "German" },
  { code: "PT", label: "Portuguese" },
  { code: "AR", label: "Arabic" },
  { code: "ZH", label: "Chinese" },
];

const EXPERIENCE = [
  { id: 0, label: "Just starting" },
  { id: 1, label: "< 1 year" },
  { id: 2, label: "1–2 years" },
  { id: 4, label: "3–5 years" },
  { id: 6, label: "5+ years" },
];

const AGE_RANGES = ["18–20", "21–25", "26–30", "31–40", "41–50", "50+"];

export default function WorkerSetup() {
  const router = useRouter();

  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [city, setCity] = useState("Milan");
  const [yearsExp, setYearsExp] = useState<number | null>(null);
  const [positions, setPositions] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  const togglePosition = (r: string) =>
    setPositions((cur) =>
      cur.includes(r) ? cur.filter((x) => x !== r) : cur.length >= 3 ? cur : [...cur, r]
    );

  const toggleLanguage = (code: string) =>
    setLanguages((cur) =>
      cur.includes(code) ? cur.filter((x) => x !== code) : [...cur, code]
    );

  const canContinue =
    ageRange !== null &&
    city.trim().length > 1 &&
    yearsExp !== null &&
    positions.length > 0 &&
    languages.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Feather name="chevron-left" size={26} color="#0E1A24" />
          </Pressable>
          <Text style={styles.title}>Your profile</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            One more step — venues use this to decide if you're a fit.
          </Text>

          {/* Age range */}
          <Section title="Your age range">
            <View style={styles.chipWrap}>
              {AGE_RANGES.map((r) => {
                const on = ageRange === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setAgeRange(r)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {/* City */}
          <Section title="City">
            <View style={styles.inputWrap}>
              <Feather name="map-pin" size={14} color="#6B7280" />
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Milan"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
          </Section>

          {/* Experience */}
          <Section title="Experience">
            <View style={styles.chipWrap}>
              {EXPERIENCE.map((e) => {
                const on = yearsExp === e.id;
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => setYearsExp(e.id)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>
                      {e.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {/* Positions */}
          <Section title="Positions you can do" sub="Up to 3 — primary first">
            <View style={styles.chipWrap}>
              {POSITIONS.map((r) => {
                const on = positions.includes(r);
                const primary = positions[0] === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => togglePosition(r)}
                    style={[
                      styles.chip,
                      on && (primary ? styles.chipPrimary : styles.chipOn),
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipTxt,
                        on && (primary ? styles.chipTxtOn : styles.chipTxtOn),
                      ]}
                    >
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {/* Languages */}
          <Section title="Languages you speak" sub="Pick all you're comfortable with">
            <View style={styles.chipWrap}>
              {LANGUAGES.map((l) => {
                const on = languages.includes(l.code);
                return (
                  <Pressable
                    key={l.code}
                    onPress={() => toggleLanguage(l.code)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>
                      {l.label} ({l.code})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          {/* Photo */}
          <Section title="Profile photo" sub="One clear face shot — required">
            <Pressable style={styles.photoUpload}>
              <View style={styles.photoUploadIcon}>
                <Feather name="camera" size={28} color="#854F0B" />
              </View>
              <Text style={styles.photoUploadTitle}>Take a photo</Text>
              <Text style={styles.photoUploadSub}>
                or upload one from your library
              </Text>
            </Pressable>
          </Section>

          <View style={{ height: 12 }} />
        </ScrollView>

        <View style={styles.bottom}>
          <Pressable
            disabled={!canContinue}
            onPress={() => {
              patchWorkerProfile({
                ageRange: ageRange ?? undefined,
                city: city.trim(),
                country: "Italy",
                yearsExperience: yearsExp ?? undefined,
                positions,
                languages,
              });
              router.replace("/worker-done");
            }}
            style={[styles.cta, !canContinue && styles.ctaDisabled]}
          >
            <Text style={styles.ctaTxt}>Save and go live</Text>
            <Feather name="arrow-right" size={20} color="#F7F4EE" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {sub && <Text style={styles.sectionSub}>{sub}</Text>}
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
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
  title: { fontSize: 16, fontWeight: "700", color: "#0E1A24" },

  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  intro: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 8 },

  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0E1A24",
    textAlign: "center",
  },
  sectionSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    textAlign: "center",
  },

  row2: { flexDirection: "row", gap: 10 },
  fieldHalf: { flex: 1 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  input: { flex: 1, fontSize: 16, color: "#0E1A24", padding: 0 },

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
  chipPrimary: { backgroundColor: "#F0531C", borderColor: "#F0531C" },
  chipTxt: { fontSize: 13, fontWeight: "600", color: "#0E1A24" },
  chipTxtOn: { color: "white" },

  photoUpload: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(133,79,11,0.30)",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 26,
    alignItems: "center",
    gap: 6,
  },
  photoUploadIcon: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: "#FAEEDA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  photoUploadTitle: { fontSize: 15, fontWeight: "700", color: "#0E1A24" },
  photoUploadSub: { fontSize: 12, color: "#6B7280" },

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
