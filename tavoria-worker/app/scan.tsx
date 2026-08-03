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
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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

function isNoCameraError(message?: string): boolean {
  return /no (camera|device)|camera.*not found|device.*not found|not.?found/i.test(
    message ?? ""
  );
}

export default function Scan() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [cameraError, setCameraError] = useState<"no-device" | "unavailable" | null>(null);
  const [permissionIssue, setPermissionIssue] = useState<"no-device" | "unsupported" | null>(null);
  const [isCheckingCamera, setIsCheckingCamera] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualValue, setManualValue] = useState("");
  // Prevent re-firing onBarcodeScanned dozens of times per second
  const handlingRef = useRef(false);

  const handlePayload = useCallback(
    (raw: string) => {
      const venueId = extractVenueId(raw);
      handlingRef.current = true;
      if (!venueId) {
        setInvalid(true);
        return;
      }
      setScanned(true);
      // Replace the scan screen so back button doesn't return here
      router.replace({
        pathname: "/venue-board",
        params: { venueId },
      });
    },
    [router]
  );

  const onScan = useCallback(
    (result: BarcodeScanningResult) => {
      if (handlingRef.current || scanned) return;
      handlePayload(result.data ?? "");
    },
    [handlePayload, scanned]
  );

  const retryInvalid = () => {
    setInvalid(false);
    handlingRef.current = false;
  };

  const retryCamera = () => {
    setCameraError(null);
    setCameraKey((key) => key + 1);
  };

  const submitManualValue = () => {
    setManualEntry(false);
    handlePayload(manualValue);
  };

  const requestCameraAccess = async () => {
    if (isCheckingCamera) return;

    const startedAt = Date.now();
    setIsCheckingCamera(true);

    try {
      try {
        const available = await CameraView.isAvailableAsync();
        if (!available) {
          setPermissionIssue("unsupported");
          return;
        }

        if (Platform.OS === "web" && typeof navigator !== "undefined") {
          const devices = await navigator.mediaDevices?.enumerateDevices?.();
          if (devices && !devices.some((device) => device.kind === "videoinput")) {
            setPermissionIssue("no-device");
            return;
          }
        }
      } catch {
        // Continue with the platform permission request. The camera view will surface a mount error if needed.
      }

      // Only clear the prior result once a supported camera has been found.
      // This avoids flashing the generic permission screen while retrying.
      setPermissionIssue(null);
      await requestPermission();
    } finally {
      // Keep the feedback visible long enough to avoid a distracting flicker.
      const remainingMs = 350 - (Date.now() - startedAt);
      if (remainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingMs));
      }
      setIsCheckingCamera(false);
    }
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
    const hasNoCamera = permissionIssue === "no-device";
    const isUnsupported = permissionIssue === "unsupported";
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
            <Feather name={hasNoCamera || isUnsupported ? "video-off" : "camera-off"} size={48} color="#F0531C" />
          </View>
          <Text style={styles.permTitle}>
            {hasNoCamera || isUnsupported ? t("scan.no_camera_title") : t("scan.perm_title")}
          </Text>
          <Text style={styles.permSub}>
            {hasNoCamera || isUnsupported ? t("scan.no_camera_msg") : t("scan.perm_msg")}
          </Text>
          <Pressable
            disabled={isCheckingCamera}
            style={[styles.grantBtn, isCheckingCamera && styles.grantBtnDisabled]}
            onPress={requestCameraAccess}
          >
            {isCheckingCamera && <ActivityIndicator color="#F7F4EE" size="small" />}
            <Text style={styles.grantBtnTxt}>
              {isCheckingCamera
                ? t("scan.checking_camera")
                : hasNoCamera || isUnsupported
                  ? t("scan.camera_retry")
                  : t("scan.grant_btn")}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // 3. Permission granted — live camera
  return (
    <View style={styles.safe}>
      <CameraView
        key={cameraKey}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned || invalid ? undefined : onScan}
        onCameraReady={() => setCameraError(null)}
        onMountError={(error) =>
          setCameraError(isNoCameraError(error.message) ? "no-device" : "unavailable")
        }
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
          <Pressable style={styles.manualLink} onPress={() => setManualEntry(true)}>
            <Text style={styles.manualLinkTxt}>{t("scan.enter_manually")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {cameraError && (
        <View style={styles.invalidBackdrop}>
          <View style={styles.invalidCard}>
            <View style={styles.invalidIcon}>
              <Feather name="camera-off" size={36} color="#993556" />
            </View>
            <Text style={styles.invalidTitle}>
              {t(cameraError === "no-device" ? "scan.no_camera_title" : "scan.camera_error_title")}
            </Text>
            <Text style={styles.invalidSub}>
              {t(cameraError === "no-device" ? "scan.no_camera_msg" : "scan.camera_error_msg")}
            </Text>
            <Pressable style={styles.retryBtn} onPress={retryCamera}>
              <Text style={styles.retryBtnTxt}>{t("scan.camera_retry")}</Text>
            </Pressable>
            <Pressable style={styles.manualLink} onPress={() => setManualEntry(true)}>
              <Text style={styles.manualLinkDark}>{t("scan.enter_manually")}</Text>
            </Pressable>
          </View>
        </View>
      )}

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

      {manualEntry && (
        <View style={styles.invalidBackdrop}>
          <View style={styles.invalidCard}>
            <Text style={styles.invalidTitle}>{t("scan.enter_manually")}</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setManualValue}
              placeholder="https://tavoriapp.com/v/..."
              placeholderTextColor="#78808A"
              style={styles.manualInput}
              value={manualValue}
            />
            <Pressable style={styles.retryBtn} onPress={submitManualValue}>
              <Text style={styles.retryBtnTxt}>{t("scan.open_venue")}</Text>
            </Pressable>
            <Pressable style={styles.manualLink} onPress={() => setManualEntry(false)}>
              <Text style={styles.manualLinkDark}>{t("scan.invalid_again")}</Text>
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
  headerTitle: {
    fontFamily: "InstrumentSerif_400Regular", color: "#F7F4EE", fontSize: 16, fontWeight: "400" },

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
  manualLink: {
    alignSelf: "center",
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  manualLinkTxt: {
    color: "#F7F4EE",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  manualLinkDark: {
    color: "#0E1A24",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
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
    fontFamily: "InstrumentSerif_400Regular",
    color: "#F7F4EE",
    fontSize: 20,
    fontWeight: "400",
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
    alignItems: "center",
    backgroundColor: "#F0531C",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  grantBtnDisabled: { opacity: 0.82 },
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
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 18,
    fontWeight: "400",
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
  manualInput: {
    alignSelf: "stretch",
    borderColor: "#C9CDD1",
    borderRadius: 12,
    borderWidth: 1,
    color: "#0E1A24",
    fontSize: 14,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
