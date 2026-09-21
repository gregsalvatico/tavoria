import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { t } from "../lib/i18n";
import TavoriaModal from "./TavoriaModal";

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
    <TavoriaModal visible={visible} onClose={onClose} title={t("share_tavoria_modal.title")} subtitle={t("share_tavoria_modal.sub")}>
      <View style={styles.preview}>
        {loading ? <ActivityIndicator color="#F0531C" size="large" /> : qrDataUrl ? <Image source={{ uri: qrDataUrl }} style={styles.image} /> : <Text style={styles.error}>{t("common.try_again")}</Text>}
      </View>
      <Text style={styles.url}>{TAVORIA_URL.replace("https://", "")}</Text>
      <Pressable style={styles.shareButton} onPress={() => void share()}>
        <Feather name="share-2" size={18} color="white" />
        <Text style={styles.shareText}>{t("share_tavoria_modal.share")}</Text>
      </Pressable>
    </TavoriaModal>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: "center", backgroundColor: "white", borderRadius: 16, justifyContent: "center", marginTop: 18, minHeight: 240, padding: 16 },
  image: { height: 240, width: 240 },
  error: { color: "#6B7280", fontSize: 13 },
  url: { color: "#5D6670", fontFamily: "DMMono_500Medium", fontSize: 11, marginTop: 12, textAlign: "center" },
  shareButton: { alignItems: "center", backgroundColor: "#F0531C", borderRadius: 999, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 18, minHeight: 52, paddingHorizontal: 18 },
  shareText: { color: "white", fontSize: 15, fontWeight: "800" },
});
