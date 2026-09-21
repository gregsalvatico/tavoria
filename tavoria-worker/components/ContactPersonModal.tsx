import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { mailtoUrl, mapsUrl, telUrl, whatsAppUrl } from "../lib/contact";
import { openExternalLink } from "../lib/externalLinks";
import { t } from "../lib/i18n";
import { TAVORIA } from "../lib/designTokens";
import TavoriaModal from "./TavoriaModal";

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
  const open = (url: string | null, target: string) => openExternalLink(url, target);
  const copyEmail = async () => {
    if (!email) return;
    await Clipboard.setStringAsync(email);
    setCopied(true);
  };
  const recipientLabel = recipientType === "applicant"
    ? t("contact_modal.applicant")
    : t("contact_modal.venue");

  return (
    <TavoriaModal
      visible={visible}
      onClose={onClose}
      title={t("contact_modal.title", { name: name || recipientLabel })}
      subtitle={t("contact_modal.intro")}
    >

          {email ? (
            <Pressable style={[styles.action, styles.emailAction]} onPress={() => void open(mailtoUrl(email, `Tavoria - ${name}`, ""), t("external_link.email"))}>
              <Feather name="mail" size={18} color="#185FA5" />
              <View style={styles.actionCopy}>
                <View style={styles.actionTitleRow}>
                  <Text style={styles.actionTitle}>{t("contact_modal.open_email")}</Text>
                  <Feather name="arrow-up-right" size={17} color="#185FA5" />
                </View>
                <Text style={styles.actionDetail} numberOfLines={1}>{email}</Text>
              </View>
            </Pressable>
          ) : null}

          {phone ? (
            <Pressable style={[styles.action, styles.whatsAppAction]} onPress={() => void open(whatsAppUrl(phone, ""), t("external_link.whatsapp"))}>
              <Feather name="message-circle" size={18} color="white" />
              <View style={styles.actionCopy}>
                <View style={styles.actionTitleRow}>
                  <Text style={styles.actionTitleLight}>{t("contact_modal.whatsapp")}</Text>
                  <Feather name="arrow-up-right" size={17} color="white" />
                </View>
                <Text style={styles.actionDetailLight} numberOfLines={1}>{phone}</Text>
              </View>
            </Pressable>
          ) : null}

          {email ? (
            <Pressable style={[styles.action, styles.copyAction]} onPress={copyEmail}>
              <Feather name={copied ? "check" : "copy"} size={18} color="#0E1A24" />
              <View style={styles.actionCopy}>
                <Text style={styles.actionTitle}>{copied ? t("contact_modal.email_copied") : t("contact_modal.copy_email")}</Text>
                <Text style={styles.actionDetail} numberOfLines={1}>{email}</Text>
              </View>
            </Pressable>
          ) : null}

          {phone ? (
            <Pressable style={styles.action} onPress={() => void open(telUrl(phone), t("external_link.phone"))}>
              <Feather name="phone-call" size={18} color="#0E1A24" />
              <View style={styles.actionCopy}>
                <View style={styles.actionTitleRow}>
                  <Text style={styles.actionTitle}>{t("contact_modal.call", { recipient: recipientLabel.toLowerCase() })}</Text>
                  <Feather name="arrow-up-right" size={17} color="#0E1A24" />
                </View>
                <Text style={styles.actionDetail}>{phone}</Text>
              </View>
            </Pressable>
          ) : null}

          {visitAddress ? (
            <Pressable style={[styles.action, styles.visitAction]} onPress={() => void open(mapsUrl(visitAddress), t("external_link.maps"))}>
              <Feather name="map-pin" size={18} color="#F0531C" />
              <View style={styles.actionCopy}>
                <View style={styles.actionTitleRow}>
                  <Text style={styles.actionTitle}>{t("contact_modal.visit")}</Text>
                  <Feather name="arrow-up-right" size={17} color="#F0531C" />
                </View>
                <Text style={styles.actionDetail} numberOfLines={2}>{visitAddress}</Text>
              </View>
            </Pressable>
          ) : null}

          {!email && !phone && !visitAddress ? <Text style={styles.noContact}>{t("contact_modal.no_contact", { recipient: recipientLabel.toLowerCase() })}</Text> : null}
    </TavoriaModal>
  );
}

const styles = StyleSheet.create({
  action: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, flexDirection: "row", gap: 11, marginTop: 10, minHeight: 62, paddingHorizontal: 13 },
  emailAction: { marginTop: 12 },
  copyAction: { marginTop: 8 },
  visitAction: { borderColor: "#F7C7AB" },
  whatsAppAction: { backgroundColor: "#25D366", borderColor: "#25D366" },
  actionCopy: { flex: 1, minWidth: 0 },
  actionTitleRow: { alignItems: "center", flexDirection: "row", gap: 5 },
  actionTitle: { color: "#0E1A24", fontSize: 14, fontWeight: "800" },
  actionDetail: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  actionTitleLight: { color: "white", fontSize: 14, fontWeight: "800" },
  actionDetailLight: { color: "rgba(255,255,255,0.82)", fontSize: 11, marginTop: 2 },
  noContact: { color: "#6B7280", fontSize: 13, paddingVertical: 20, textAlign: "center" },
});
