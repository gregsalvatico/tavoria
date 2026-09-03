import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getCurrentVenueRow } from "../lib/db";
import { downloadVenueQRPoster } from "../lib/qrPoster";
import { t } from "../lib/i18n";

type VenueInfo = { id: string; name?: string | null; city?: string | null };
type Props = { variant?: "fab" | "sidebar" };

export default function VenueQrFab({ variant = "fab" }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [venue, setVenue] = useState<VenueInfo | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const loadQr = async (force = false) => {
    setOpen(true);
    if (dataUrl && !force) return;
    if (force) setDataUrl(null);
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
      {variant === "sidebar" ? (
        <Pressable
          style={styles.sidebarAction}
          onPress={() => void loadQr()}
          accessibilityRole="button"
          accessibilityLabel={t("home_in.print_qr")}
        >
          <Feather name="printer" size={18} color="rgba(247,244,238,0.62)" />
          <Text style={styles.sidebarActionText}>{t("home_in.print_qr")}</Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.fab}
          onPress={() => void loadQr()}
          accessibilityRole="button"
          accessibilityLabel={t("home_in.print_qr")}
        >
          <Feather name="maximize" size={21} color="white" />
        </Pressable>
      )}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.card}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardContent}>
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{t("qr_modal.title")}</Text>
                  <Text style={styles.subtitle}>{t("qr_modal.sub")}</Text>
                </View>
                <Pressable onPress={() => setOpen(false)} hitSlop={10} style={styles.close}>
                  <Feather name="x" size={19} color="#46505A" />
                </Pressable>
              </View>
              <View style={styles.posterPreview}>
                {loading ? <ActivityIndicator color="#F0531C" size="large" /> : dataUrl ? (
                  <>
                    <Text style={styles.posterVenue} numberOfLines={2}>{venue?.name || "Tavoria"}</Text>
                    {venue?.city ? <Text style={styles.posterCity}>{venue.city}, Italia</Text> : null}
                    <Text style={styles.posterStaff}>CERCASI STAFF</Text>
                    <Text style={styles.posterNotMenu}>Non è il menù — è un’offerta di lavoro.</Text>
                    <View style={styles.posterQrFrame}>
                      <Image source={{ uri: dataUrl }} style={styles.posterQr} />
                    </View>
                    <Text style={styles.posterSub}>Inquadra il QR. Registrati in 5 minuti.</Text>
                    <Text style={styles.posterSub}>Lavora in giornata.</Text>
                    <View style={styles.posterFooter}>
                      <Text style={styles.posterBrand}><Text style={styles.posterBrandAccent}>T</Text>avoria.</Text>
                      <Text style={styles.posterUrl}>tavoriapp.com</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.errorState}>
                    <Feather name="refresh-cw" size={24} color="#F0531C" />
                    <Text style={styles.error}>{t("common.try_again")}</Text>
                    <Pressable
                      style={styles.reloadButton}
                      onPress={() => void loadQr(true)}
                      accessibilityRole="button"
                      accessibilityLabel={t("common.try_again")}
                    >
                      <Feather name="refresh-cw" size={16} color="white" />
                      <Text style={styles.reloadText}>{t("common.try_again")}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
              <Pressable style={[styles.download, !venue && styles.downloadDisabled]} onPress={() => void download()} disabled={!venue}>
                <Feather name="download" size={18} color="white" />
                <Text style={styles.downloadText}>{t("home_in.print_qr")}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { alignItems: "center", backgroundColor: "#0E1A24", borderColor: "#F7F4EE", borderRadius: 999, borderWidth: 3, bottom: 94, elevation: 5, height: 54, justifyContent: "center", position: "absolute", right: 18, shadowColor: "#0E1A24", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10, width: 54, zIndex: 10 },
  sidebarAction: { alignItems: "center", borderRadius: 10, flexDirection: "row", gap: 12, minHeight: 44, paddingHorizontal: 11 },
  sidebarActionText: { color: "rgba(247,244,238,0.68)", flex: 1, fontSize: 13, fontWeight: "700" },
  backdrop: { alignItems: "center", backgroundColor: "rgba(14,26,36,0.52)", flex: 1, justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#F7F4EE", borderRadius: 20, maxHeight: "92%", maxWidth: 420, width: "100%" },
  cardContent: { padding: 20 },
  header: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  title: { color: "#0E1A24", fontSize: 19, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { color: "#6B7280", fontSize: 12, lineHeight: 17, marginTop: 4 },
  close: { alignItems: "center", backgroundColor: "#E9E7E1", borderRadius: 999, height: 34, justifyContent: "center", width: 34 },
  posterPreview: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.1)", borderRadius: 12, borderWidth: 1, justifyContent: "flex-start", marginTop: 18, paddingHorizontal: 16, paddingTop: 18, width: "100%" },
  posterVenue: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 28, lineHeight: 31, textAlign: "center" },
  posterCity: { color: "#6B7280", fontSize: 10, marginTop: 2, textAlign: "center" },
  posterStaff: { color: "#F0531C", fontSize: 17, fontWeight: "900", letterSpacing: 0.2, marginTop: 15, textAlign: "center" },
  posterNotMenu: { color: "#0E1A24", fontSize: 10, marginTop: 5, textAlign: "center" },
  posterQrFrame: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.08)", borderRadius: 8, borderWidth: 1, height: 178, justifyContent: "center", marginTop: 14, padding: 6, width: 178 },
  posterQr: { height: "100%", width: "100%" },
  posterSub: { color: "#374151", fontSize: 10, lineHeight: 14, marginTop: 8, textAlign: "center" },
  posterFooter: { alignItems: "center", borderTopColor: "#DCDCD6", borderTopWidth: 1, marginTop: 17, paddingBottom: 16, paddingTop: 12, width: "100%" },
  posterBrand: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 23, lineHeight: 26 },
  posterBrandAccent: { color: "#F0531C" },
  posterUrl: { color: "#0E1A24", fontSize: 9, fontWeight: "800", letterSpacing: 0.3, marginTop: 3 },
  errorState: { alignItems: "center", gap: 10, paddingVertical: 16 },
  error: { color: "#6B7280", fontSize: 13, lineHeight: 19, maxWidth: 200, textAlign: "center" },
  reloadButton: { alignItems: "center", backgroundColor: "#0E1A24", borderRadius: 999, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 44, paddingHorizontal: 18 },
  reloadText: { color: "white", fontSize: 14, fontWeight: "800" },
  download: { alignItems: "center", backgroundColor: "#F0531C", borderRadius: 999, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 18, minHeight: 52, paddingHorizontal: 18 },
  downloadDisabled: { opacity: 0.55 },
  downloadText: { color: "white", fontSize: 15, fontWeight: "800" },
});
