import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { t } from "../lib/i18n";

const TAVORIA_URL = "https://tavoriapp.com";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function ShareTavoriaModal({ visible, onClose }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || qrDataUrl) return;
    let active = true;
    setLoading(true);
    void import("qrcode")
      .then((QRCode: typeof import("qrcode")) =>
        QRCode.toDataURL(TAVORIA_URL, {
          color: { dark: "#0E1A24", light: "#FFFFFF" },
          errorCorrectionLevel: "H",
          margin: 1,
          width: 720,
        })
      )
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch((error) => console.warn("[share-tavoria] QR generation failed:", error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [qrDataUrl, visible]);

  const share = async () => {
    try {
      await Share.share({
        message: `${t("share_tavoria_modal.message")}\n${TAVORIA_URL}`,
        url: TAVORIA_URL,
      });
    } catch (error) {
      console.warn("[share-tavoria] share failed:", error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t("share_tavoria_modal.title")}</Text>
              <Text style={styles.subtitle}>{t("share_tavoria_modal.sub")}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel={t("common.close")}>
              <Feather name="x" size={19} color="#46505A" />
            </Pressable>
          </View>
          <View style={styles.preview}>
            {loading ? <ActivityIndicator color="#F0531C" size="large" /> : qrDataUrl ? <Image source={{ uri: qrDataUrl }} style={styles.image} /> : <Text style={styles.error}>{t("common.try_again")}</Text>}
          </View>
          <Text style={styles.url}>{TAVORIA_URL.replace("https://", "")}</Text>
          <Pressable style={styles.shareButton} onPress={() => void share()}>
            <Feather name="share-2" size={18} color="white" />
            <Text style={styles.shareText}>{t("share_tavoria_modal.share")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: "center", backgroundColor: "rgba(14,26,36,0.52)", flex: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#F7F4EE", borderRadius: 20, maxWidth: 420, padding: 20, width: "100%" },
  header: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  title: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 28, lineHeight: 32 },
  subtitle: { color: "#5D6670", fontSize: 13, lineHeight: 18, marginTop: 5 },
  close: { alignItems: "center", backgroundColor: "#E9E7E1", borderRadius: 999, height: 34, justifyContent: "center", width: 34 },
  preview: { alignItems: "center", backgroundColor: "white", borderRadius: 16, justifyContent: "center", marginTop: 18, minHeight: 240, padding: 16 },
  image: { height: 240, width: 240 },
  error: { color: "#6B7280", fontSize: 13 },
  url: { color: "#5D6670", fontFamily: "DMMono_500Medium", fontSize: 11, marginTop: 12, textAlign: "center" },
  shareButton: { alignItems: "center", backgroundColor: "#F0531C", borderRadius: 999, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 18, minHeight: 52, paddingHorizontal: 18 },
  shareText: { color: "white", fontSize: 15, fontWeight: "800" },
});
