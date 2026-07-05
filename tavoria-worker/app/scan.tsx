// Real QR scanner — uses expo-camera CameraView with barcode scanning.
// Accepts QR payloads in formats:
//   https://tavoriapp.com/v/{uuid}
//   gigi://venue/{uuid}
//   bare uuid (8-4-4-4-12)
// On valid scan → navigates to /venue-board?venueId=xxx
// On invalid → shows "QR non riconosciuto" overlay with Retry button.

import { Feather } from "@expo/vector-icons";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../lib/i18n";

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extractVenueId(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Match a UUID anywhere in the string — covers https://tavoriapp.com/v/{uuid},
  // gigi://venue/{uuid}, and bare {uuid}.
  const m = trimmed.match(UUID_RE);
  return m ? m[0].toLowerCase() : null;
}

export default function Scan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [invalid, setInvalid] = useState(false);
  // Prevent re-firing onBarcodeScanned dozens of times per second
  const handlingRef = useRef(false);

  const onScan = useCallback(
    (result: BarcodeScanningResult) => {
      if (handlingRef.current || scanned) return;
      const venueId = extractVenueId(result.data ?? "");
      if (!venueId) {
        handlingRef.current = true;
        setInvalid(true);
        return;
      }
      handlingRef.current = true;
      setScanned(true);
      // Replace the scan screen so back button doesn't return here
      router.replace({
        pathname: "/venue-board",
        params: { venueId },
      });
    },
    [router, scanned]
  );

  const retryInvalid = () => {
    setInvalid(false);
    handlingRef.current = false;
  };

  // 1. Permission still loading
  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.dimTxt}>{t("scan.requesting")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Permission denied — show ask screen
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) { router.back(); return; }
              router.replace("/");
            }}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Feather name="chevron-left" size={28} color="#F7F4EE" />
          </Pressable>
        </View>
        <View style={styles.center}>
          <View style={styles.permIcon}>
            <Feather name="camera-off" size={48} color="#F0531C" />
          </View>
          <Text style={styles.permTitle}>{t("scan.perm_title")}</Text>
          <Text style={styles.permSub}>{t("scan.perm_msg")}</Text>
          <Pressable style={styles.grantBtn} onPress={requestPermission}>
            <Text style={styles.grantBtnTxt}>{t("scan.grant_btn")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // 3. Permission granted — live camera
  return (
    <View style={styles.safe}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned || invalid ? undefined : onScan}
      />

      {/* Dim overlay with viewfinder cutout */}
      <SafeAreaView style={styles.overlay} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) { router.back(); return; }
              router.replace("/");
            }}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Feather name="chevron-left" size={28} color="#F7F4EE" />
          </Pressable>
          <Text style={styles.headerTitle}>{t("scan.title")}</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.viewfinderWrap}>
          <View style={styles.viewfinder}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.helpTxt}>{t("scan.sub")}</Text>
        </View>
      </SafeAreaView>

      {/* Invalid-QR modal */}
      {invalid && (
        <View style={styles.invalidBackdrop}>
          <View style={styles.invalidCard}>
            <View style={styles.invalidIcon}>
              <Feather name="x-circle" size={36} color="#993556" />
            </View>
            <Text style={styles.invalidTitle}>{t("scan.invalid_title")}</Text>
            <Text style={styles.invalidSub}>{t("scan.invalid_msg")}</Text>
            <Pressable style={styles.retryBtn} onPress={retryInvalid}>
              <Text style={styles.retryBtnTxt}>{t("scan.invalid_again")}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0E1A24" },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  dimTxt: { color: "rgba(250,250,247,0.6)", fontSize: 15 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: { padding: 4 },
  headerTitle: { color: "#F7F4EE", fontSize: 16, fontWeight: "600" },

  viewfinderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewfinder: {
    width: 260,
    height: 260,
    borderRadius: 24,
    position: "relative",
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#F0531C",
    borderTopLeftRadius: 18,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#F0531C",
    borderTopRightRadius: 18,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#F0531C",
    borderBottomLeftRadius: 18,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#F0531C",
    borderBottomRightRadius: 18,
  },

  footer: {
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  helpTxt: {
    color: "rgba(250,250,247,0.85)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Permission prompt screen
  permIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,90,31,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  permTitle: {
    color: "#F7F4EE",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  permSub: {
    color: "rgba(250,250,247,0.7)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
  },
  grantBtn: {
    backgroundColor: "#F0531C",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  grantBtnTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },

  // Invalid QR modal
  invalidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  invalidCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
  },
  invalidIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FCEBEB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  invalidTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0E1A24",
    marginBottom: 6,
  },
  invalidSub: {
    fontSize: 14,
    color: "#4B4F58",
    textAlign: "center",
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: "#0E1A24",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  retryBtnTxt: { color: "white", fontSize: 15, fontWeight: "700" },
});
