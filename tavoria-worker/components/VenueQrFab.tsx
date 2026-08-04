import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getCurrentVenueRow } from "../lib/db";
import { downloadVenueQRPoster } from "../lib/qrPoster";
import { t } from "../lib/i18n";

type VenueInfo = { id: string; name?: string | null; city?: string | null };

export default function VenueQrFab() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [venue, setVenue] = useState<VenueInfo | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const loadQr = async () => {
    setOpen(true);
    if (dataUrl) return;
    setLoading(true);
    try {
      const currentVenue = await getCurrentVenueRow();
      if (!currentVenue) {
        setOpen(false);
        return;
      }
      const venueInfo = currentVenue as VenueInfo;
      setVenue(venueInfo);
      const QRCode: typeof import("qrcode") = await import("qrcode");
      const nextDataUrl = await QRCode.toDataURL(`https://tavoriapp.com/v/${venueInfo.id}`, {
        color: { dark: "#0E1A24", light: "#FFFFFF" },
        errorCorrectionLevel: "H",
        margin: 1,
        width: 720,
      });
      setDataUrl(nextDataUrl);
    } catch (error) {
      console.warn("[venue-qr] preview failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    if (!venue) return;
    try {
      await downloadVenueQRPoster({
        venueId: venue.id,
        venueName: venue.name ?? "",
        venueCity: venue.city ?? undefined,
      });
    } catch (error) {
      console.warn("[venue-qr] download failed:", error);
      Alert.alert(t("common.try_again"), String((error as Error)?.message ?? error));
    }
  };

  return (
    <>
      <Pressable style={styles.fab} onPress={() => void loadQr()} accessibilityLabel={t("home_in.print_qr")}>
        <Feather name="maximize" size={21} color="white" />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t("qr_modal.title")}</Text>
                <Text style={styles.subtitle}>{t("qr_modal.sub")}</Text>
              </View>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} style={styles.close}>
                <Feather name="x" size={19} color="#46505A" />
              </Pressable>
            </View>
            <View style={styles.preview}>
              {loading ? <ActivityIndicator color="#F0531C" size="large" /> : dataUrl ? (
                <Image source={{ uri: dataUrl }} style={styles.image} />
              ) : (
                <Text style={styles.error}>{t("common.try_again")}</Text>
              )}
            </View>
            <Pressable style={[styles.download, !venue && styles.downloadDisabled]} onPress={() => void download()} disabled={!venue}>
              <Feather name="download" size={18} color="white" />
              <Text style={styles.downloadText}>{t("home_in.print_qr")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { alignItems: "center", backgroundColor: "#0E1A24", borderColor: "#F7F4EE", borderRadius: 999, borderWidth: 3, bottom: 94, elevation: 5, height: 54, justifyContent: "center", position: "absolute", right: 18, shadowColor: "#0E1A24", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10, width: 54, zIndex: 10 },
  backdrop: { alignItems: "center", backgroundColor: "rgba(14,26,36,0.52)", flex: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#F7F4EE", borderRadius: 20, maxWidth: 420, padding: 20, width: "100%" },
  header: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  title: { color: "#0E1A24", fontSize: 19, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { color: "#6B7280", fontSize: 12, lineHeight: 17, marginTop: 4 },
  close: { alignItems: "center", backgroundColor: "#E9E7E1", borderRadius: 999, height: 34, justifyContent: "center", width: 34 },
  preview: { alignItems: "center", backgroundColor: "white", borderRadius: 16, justifyContent: "center", marginTop: 18, minHeight: 240, padding: 16 },
  image: { height: 240, width: 240 },
  error: { color: "#6B7280", fontSize: 13, lineHeight: 19, maxWidth: 200, textAlign: "center" },
  download: { alignItems: "center", backgroundColor: "#F0531C", borderRadius: 999, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 18, minHeight: 52, paddingHorizontal: 18 },
  downloadDisabled: { opacity: 0.55 },
  downloadText: { color: "white", fontSize: 15, fontWeight: "800" },
});
