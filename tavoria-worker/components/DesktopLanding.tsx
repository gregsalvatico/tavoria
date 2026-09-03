import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LANGUAGES, setLanguage, t, type Language } from "../lib/i18n";

type Props = {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
};

export default function DesktopLanding({ currentLanguage, onLanguageChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const current = LANGUAGES.find((language) => language.code === currentLanguage) ?? LANGUAGES[0];

  const chooseLanguage = async (language: Language) => {
    await setLanguage(language);
    onLanguageChange(language);
    setPickerOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.page}>
        <View style={styles.nav}>
          <Text style={styles.brand}>
            <Text style={styles.brandAccent}>T</Text>avoria<Text style={styles.brandAccent}>.</Text>
          </Text>
          <View style={styles.navActions}>
            <Pressable style={styles.languageButton} onPress={() => setPickerOpen(true)}>
              <Feather name="globe" size={15} color="#46505A" />
              <Text style={styles.languageCode}>{current.code.toUpperCase()}</Text>
              <Feather name="chevron-down" size={14} color="#46505A" />
            </Pressable>
            <Link href="/signin" asChild>
              <Pressable style={styles.signInButton}>
                <Text style={styles.signInText}>{t("home.sign_in")}</Text>
                <Feather name="arrow-up-right" size={16} color="#6B7280" />
              </Pressable>
            </Link>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroGrid}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>TAVORIA / HOSPITALITY</Text>
              <Text style={styles.headline}>
                {t("home.headline_top")} {"\n"}
                <Text style={styles.headlineAccent}>{t("home.headline3")}</Text>
              </Text>

              <View style={styles.imageFrame}>
                <Image
                  source={require("../assets/venue-cafe.png")}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={styles.imageShade} />
                <View style={styles.imageCaption}>
                  <Text style={styles.imageCaptionLabel}>REAL VENUES</Text>
                  <Text style={styles.imageCaptionText}>Real shifts. Real people.</Text>
                </View>
              </View>
            </View>

            <View style={styles.startPanel}>
              <View>
                <Text style={styles.panelEyebrow}>START HERE</Text>
                <Text style={styles.panelTitle}>Choose how to begin.</Text>
              </View>

              <View style={styles.actions}>
                <DesktopAction
                  href="/signup?next=worker-profile"
                  icon="user"
                  label={t("home.worker_cta")}
                  description={t("home.worker_sub")}
                  accent="#185FA5"
                />
                <DesktopAction
                  href="/venue-type"
                  icon="briefcase"
                  label={t("home.venue_cta")}
                  description={t("home.venue_sub")}
                  accent="#F0531C"
                  variant="primary"
                />
                <DesktopAction
                  href="/scan"
                  icon="maximize"
                  label={t("home.scan_qr")}
                  description="Use a venue QR code to apply on the spot."
                  accent="#6B7280"
                  variant="link"
                />
              </View>

              <Text style={styles.panelFootnote}>No CV required to get started.</Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerLead}>A simpler way into hospitality work.</Text>
            <Text style={styles.footerMeta}>K3Y Solutions S.r.l. · Milano, Italia</Text>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)} />
        <View style={styles.languageSheet}>
          <Text style={styles.languageSheetTitle}>{t("language.pick")}</Text>
          {LANGUAGES.map((language) => (
            <Pressable
              key={language.code}
              onPress={() => void chooseLanguage(language.code)}
              style={[styles.languageRow, language.code === currentLanguage && styles.languageRowActive]}
            >
              <Text style={styles.languageFlag}>{language.flag}</Text>
              <Text style={styles.languageLabel}>{language.label}</Text>
              {language.code === currentLanguage ? (
                <Feather name="check-circle" size={19} color="#F0531C" />
              ) : null}
            </Pressable>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DesktopAction({
  href,
  icon,
  label,
  description,
  accent,
  variant = "secondary",
}: {
  href: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  accent: string;
  variant?: "primary" | "secondary" | "link";
}) {
  const primary = variant === "primary";
  const link = variant === "link";

  return (
    <Link href={href as never} asChild>
      <Pressable style={primary ? styles.actionPrimary : link ? styles.actionLink : styles.action}>
        <View style={link ? styles.actionIconLink : [styles.actionIcon, { backgroundColor: primary ? "rgba(247,244,238,0.16)" : `${accent}18` }]}>
          <Feather name={icon} size={17} color={primary ? "#F7F4EE" : accent} />
        </View>
        <View style={styles.actionCopy}>
          <Text style={primary ? styles.actionLabelPrimary : link ? styles.actionLabelLink : styles.actionLabel}>{label}</Text>
          <Text style={primary ? styles.actionDescriptionPrimary : link ? styles.actionDescriptionLink : styles.actionDescription}>{description}</Text>
        </View>
        <Feather name="arrow-up-right" size={18} color={primary ? "#F7F4EE" : "#6B7280"} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: "#F7F4EE", flex: 1 },
  page: { flex: 1 },
  nav: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 22,
    width: "100%",
  },
  brand: {
    color: "#0E1A24",
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 31,
  },
  brandAccent: { color: "#F0531C" },
  navActions: { alignItems: "center", flexDirection: "row", gap: 26 },
  languageButton: {
    alignItems: "center",
    borderColor: "rgba(14,26,36,0.15)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  languageCode: { color: "#46505A", fontSize: 11, fontWeight: "800" },
  signInButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  signInText: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: {
    gap: 44,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 58,
    width: "100%",
  },
  heroGrid: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 76,
  },
  heroCopy: { flex: 1, justifyContent: "center", minWidth: 0 },
  eyebrow: {
    color: "#F0531C",
    fontFamily: "DMMono_500Medium",
    fontSize: 10,
    letterSpacing: 1.6,
  },
  headline: {
    color: "#0E1A24",
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 68,
    lineHeight: 69,
    marginTop: 17,
  },
  headlineAccent: { color: "#F0531C" },
  imageFrame: { height: 190, marginTop: 30, overflow: "hidden", position: "relative", width: "100%" },
  heroImage: { height: "100%", width: "100%" },
  imageShade: { backgroundColor: "rgba(14,26,36,0.42)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  imageCaption: { bottom: 18, left: 20, position: "absolute" },
  imageCaptionLabel: { color: "#FFAB7D", fontFamily: "DMMono_500Medium", fontSize: 9, letterSpacing: 1.5 },
  imageCaptionText: { color: "#FFFFFF", fontFamily: "InstrumentSerif_400Regular", fontSize: 23, marginTop: 3 },
  startPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(14,26,36,0.10)",
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "space-between",
    minHeight: 442,
    padding: 28,
    width: 410,
  },
  panelEyebrow: { color: "#F0531C", fontFamily: "DMMono_500Medium", fontSize: 10, letterSpacing: 1.5 },
  panelTitle: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 34, lineHeight: 37, marginTop: 13 },
  actions: { gap: 8, marginTop: 30 },
  action: { alignItems: "center", borderColor: "rgba(14,26,36,0.10)", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 12, padding: 13 },
  actionPrimary: { alignItems: "center", backgroundColor: "#F0531C", borderColor: "#F0531C", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 12, padding: 13 },
  actionLink: { alignItems: "center", flexDirection: "row", gap: 12, paddingHorizontal: 0, paddingVertical: 6 },
  actionIcon: { alignItems: "center", borderRadius: 9, height: 34, justifyContent: "center", width: 34 },
  actionIconLink: { alignItems: "center", height: 34, justifyContent: "center", width: 34 },
  actionCopy: { flex: 1, minWidth: 0 },
  actionLabel: { color: "#0E1A24", fontSize: 14, fontWeight: "800" },
  actionLabelPrimary: { color: "#F7F4EE", fontSize: 14, fontWeight: "800" },
  actionLabelLink: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  actionDescription: { color: "#6B7280", fontSize: 11, marginTop: 3 },
  actionDescriptionPrimary: { color: "rgba(247,244,238,0.80)", fontSize: 11, marginTop: 3 },
  actionDescriptionLink: { color: "#8A929A", fontSize: 11, marginTop: 3 },
  panelFootnote: { color: "#8A929A", fontSize: 11, marginTop: 24 },
  footerRow: { alignItems: "center", borderTopColor: "rgba(14,26,36,0.12)", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingTop: 18 },
  footerLead: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 18 },
  footerMeta: { color: "#8A929A", fontSize: 11 },
  modalBackdrop: { backgroundColor: "rgba(14,26,36,0.38)", flex: 1 },
  languageSheet: { backgroundColor: "#FFFFFF", borderRadius: 18, bottom: 24, left: "50%", marginLeft: -180, padding: 18, position: "absolute", width: 360 },
  languageSheetTitle: { color: "#0E1A24", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  languageRow: { alignItems: "center", borderRadius: 10, flexDirection: "row", gap: 10, paddingHorizontal: 10, paddingVertical: 12 },
  languageRowActive: { backgroundColor: "#FFF3EC" },
  languageFlag: { fontSize: 18 },
  languageLabel: { color: "#0E1A24", flex: 1, fontSize: 14 },
});
