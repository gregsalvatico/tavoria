import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { mailtoUrl, mapsUrl, telUrl, whatsAppUrl } from "../lib/contact";
import { t } from "../lib/i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  name: string;
  email?: string | null;
  phone?: string | null;
  visitAddress?: string | null;
  initialMessage?: string;
  recipientType?: "venue" | "applicant";
};

export default function ContactPersonModal({
  visible,
  onClose,
  name,
  email,
  phone,
  visitAddress,
  recipientType = "venue",
}: Props) {
  const [copied, setCopied] = useState(false);
  const open = (url: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  };
  const copyEmail = async () => {
    if (!email) return;
    await Clipboard.setStringAsync(email);
    setCopied(true);
  };
  const recipientLabel = recipientType === "applicant"
    ? t("contact_modal.applicant")
    : t("contact_modal.venue");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.kicker}>{t("contact_modal.kicker")}</Text>
              <Text style={styles.title}>{t("contact_modal.title", { name: name || recipientLabel })}</Text>
            </View>
            <Pressable style={styles.close} onPress={onClose} hitSlop={10}>
              <Feather name="x" size={20} color="#0E1A24" />
            </Pressable>
          </View>

          <Text style={styles.intro}>{t("contact_modal.intro")}</Text>

          {email ? (
            <Pressable style={[styles.action, styles.emailAction]} onPress={() => open(mailtoUrl(email, `Tavoria - ${name}`, ""))}>
              <Feather name="mail" size={18} color="#185FA5" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{t("contact_modal.open_email")}</Text>
                <Text style={styles.actionDetail} numberOfLines={1}>{email}</Text>
              </View>
              <Feather name="arrow-up-right" size={17} color="#185FA5" />
            </Pressable>
          ) : null}

          {phone ? (
            <Pressable style={[styles.action, styles.whatsAppAction]} onPress={() => open(whatsAppUrl(phone, ""))}>
              <Feather name="message-circle" size={18} color="white" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitleLight}>{t("contact_modal.whatsapp")}</Text>
                <Text style={styles.actionDetailLight} numberOfLines={1}>{phone}</Text>
              </View>
              <Feather name="arrow-up-right" size={17} color="white" />
            </Pressable>
          ) : null}

          {email ? (
            <Pressable style={[styles.action, styles.copyAction]} onPress={copyEmail}>
              <Feather name={copied ? "check" : "copy"} size={18} color="#0E1A24" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{copied ? t("contact_modal.email_copied") : t("contact_modal.copy_email")}</Text>
                <Text style={styles.actionDetail} numberOfLines={1}>{email}</Text>
              </View>
            </Pressable>
          ) : null}

          {phone ? (
            <Pressable style={styles.action} onPress={() => open(telUrl(phone))}>
              <Feather name="phone-call" size={18} color="#0E1A24" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{t("contact_modal.call", { recipient: recipientLabel.toLowerCase() })}</Text>
                <Text style={styles.actionDetail}>{phone}</Text>
              </View>
              <Feather name="arrow-up-right" size={17} color="#0E1A24" />
            </Pressable>
          ) : null}

          {visitAddress ? (
            <Pressable style={[styles.action, styles.visitAction]} onPress={() => open(mapsUrl(visitAddress))}>
              <Feather name="map-pin" size={18} color="#F0531C" />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{t("contact_modal.visit")}</Text>
                <Text style={styles.actionDetail} numberOfLines={2}>{visitAddress}</Text>
              </View>
              <Feather name="arrow-up-right" size={17} color="#F0531C" />
            </Pressable>
          ) : null}

          {!email && !phone && !visitAddress ? <Text style={styles.noContact}>{t("contact_modal.no_contact", { recipient: recipientLabel.toLowerCase() })}</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { backgroundColor: "rgba(14,26,36,0.48)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: "#F7F4EE", borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: "86%" },
  content: { paddingBottom: 30, paddingHorizontal: 18, paddingTop: 11 },
  handle: { alignSelf: "center", backgroundColor: "#C8CBCF", borderRadius: 999, height: 4, marginBottom: 17, width: 38 },
  titleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  kicker: { color: "#F0531C", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 27, lineHeight: 31, marginTop: 2 },
  close: { alignItems: "center", backgroundColor: "white", borderRadius: 999, height: 38, justifyContent: "center", width: 38 },
  intro: { color: "#5D6670", fontSize: 13, lineHeight: 19, marginBottom: 8, marginTop: 10 },
  action: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.12)", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 11, marginTop: 10, minHeight: 62, paddingHorizontal: 13 },
  emailAction: { marginTop: 12 },
  copyAction: { marginTop: 8 },
  visitAction: { borderColor: "#F7C7AB" },
  whatsAppAction: { backgroundColor: "#25D366", borderColor: "#25D366" },
  actionTitle: { color: "#0E1A24", fontSize: 14, fontWeight: "800" },
  actionDetail: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  actionTitleLight: { color: "white", fontSize: 14, fontWeight: "800" },
  actionDetailLight: { color: "rgba(255,255,255,0.82)", fontSize: 11, marginTop: 2 },
  noContact: { color: "#6B7280", fontSize: 13, paddingVertical: 20, textAlign: "center" },
});
