import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createApplication,
  getCurrentWorkerFull,
  uploadWorkerMedia,
} from "../lib/db";
import { t } from "../lib/i18n";
import { getWorkerProfile, patchWorkerProfile } from "../lib/workerProfile";
import { pickImageWeb } from "../lib/webMedia";

type DocRow = {
  id: string;
  title: string;
  sub: string;
  icon: keyof typeof Feather.glyphMap;
  badge?: string;
};

// Doc rows — display labels are localized at render via t(),
// see DOCS variable inside WorkerPhotos().
type DocRowDef = { id: string; icon: keyof typeof Feather.glyphMap };
const DOC_DEFS: DocRowDef[] = [
  { id: "cv", icon: "file-text" },
  { id: "ref", icon: "award" },
  { id: "id", icon: "shield" },
];

export default function WorkerPhotos() {
  const router = useRouter();
  // Seed slot 0 (profile photo) from the worker's existing photoUrl so a photo
  // already uploaded during signup shows here as a filled tile, not "Add photo".
  const initialProfile = getWorkerProfile()?.photoUrl ?? null;
  const [photos, setPhotos] = useState<boolean[]>([
    !!initialProfile,
    false,
    false,
    false,
    false,
  ]);
  const [photoUris, setPhotoUris] = useState<(string | null)[]>([
    initialProfile,
    null,
    null,
    null,
    null,
  ]);

  // After an app restart the in-memory workerProfile cache is empty,
  // so also hydrate from Supabase. Skipped if slot 0 already has a URI.
  useEffect(() => {
    if (initialProfile) return;
    let cancelled = false;
    (async () => {
      try {
        const w = await getCurrentWorkerFull();
        if (cancelled || !w?.photo_url) return;
        // Mirror into the in-memory cache so other screens pick it up
        patchWorkerProfile({ photoUrl: w.photo_url, photoUploaded: true });
        setPhotoUris((cur) => cur.map((v, i) => (i === 0 ? w.photo_url : v)));
        setPhotos((cur) => cur.map((v, i) => (i === 0 ? true : v)));
      } catch (e) {
        console.warn("[worker-photos] hydrate failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [docs, setDocs] = useState<Record<string, boolean>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [checking, setChecking] = useState<number | null>(null);
  const [rejectedSlot, setRejectedSlot] = useState<number | null>(null);

  // Capture from camera or library, upload to Supabase (slot 0 only), then mark slot
  const handleCaptureOrPick = async (
    slot: number,
    source: "camera" | "library"
  ) => {
    setUploadingPhoto(null);
    try {
      const isWeb = Platform.OS === "web";
      // Web: HTML file input with capture="user" hints the camera on phone
      // browsers; desktop falls back to file picker. No permission ask.
      let res: { canceled: boolean; assets: Array<{ uri: string }> };
      if (isWeb) {
        res = await pickImageWeb({
          camera: source === "camera" ? "user" : false,
        });
      } else {
        let perm;
        if (source === "camera") {
          perm = await ImagePicker.requestCameraPermissionsAsync();
        } else {
          perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        }
        if (!perm.granted) {
          Alert.alert(
            source === "camera"
              ? "Camera permission needed"
              : "Photos permission needed",
            "Please enable access in Settings to continue."
          );
          return;
        }
        const opts = {
          mediaTypes: ["images"] as ImagePicker.MediaType[],
          allowsEditing: true,
          aspect: [1, 1] as [number, number],
          quality: 0.7,
        };
        res =
          source === "camera"
            ? await ImagePicker.launchCameraAsync({
                ...opts,
                cameraType: ImagePicker.CameraType.front,
              })
            : await ImagePicker.launchImageLibraryAsync(opts);
      }
      if (res.canceled || !res.assets[0]) return;
      const uri = res.assets[0].uri;

      // Quick "safety check" UI while we upload
      setChecking(slot);
      // Only slot 0 (profile photo) is uploaded to Supabase for now
      if (slot === 0) {
        const url = await uploadWorkerMedia("photo", uri);
        patchWorkerProfile({ photoUrl: url, photoUploaded: true });
      }
      setPhotoUris((cur) => cur.map((v, i) => (i === slot ? uri : v)));
      setPhotos((cur) => cur.map((v, i) => (i === slot ? true : v)));
      setChecking(null);
    } catch (e: any) {
      setChecking(null);
      Alert.alert("Upload failed", e?.message ?? "Please try again.");
    }
  };

  const photoCount = photos.filter(Boolean).length;
  const docCount = Object.values(docs).filter(Boolean).length;
  const score = Math.min(100, photoCount * 16 + docCount * 8);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) { router.back(); return; }
            router.replace("/worker-videos");
          }}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotOn]} />
          <View style={[styles.dot, styles.dotOn]} />
          <View style={[styles.dot, styles.dotOn]} />
        </View>
        <Pressable
          onPress={() => router.replace("/worker-done")}
          hitSlop={12}
        >
          <Text style={styles.skipTop}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>
          <Text style={{ color: "#F0531C" }}>
            {t("worker_photos.title").charAt(0)}
          </Text>
          {t("worker_photos.title").slice(1)}
        </Text>
        <Text style={styles.h2}>{t("worker_photos.sub")}</Text>

        <View style={styles.scoreBox}>
          <View style={styles.scoreHead}>
            <Text style={styles.scoreLbl}>{t("worker_photos.profile_strength")}</Text>
            <Text style={styles.scoreVal}>{score}%</Text>
          </View>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${score}%` }]} />
          </View>
        </View>

        {/* Photos */}
        <Text style={styles.sectionTitle}>{t("worker_photos.photos")} · {photoCount}/5</Text>
        <Text style={styles.sectionSub}>{t("worker_photos.photos_sub")}</Text>
        <View style={styles.mediaGrid}>
          {photos.map((on, i) => (
            <Pressable
              key={i}
              onPress={() => setUploadingPhoto(i)}
              style={[styles.mediaTile, on && styles.mediaTileOn]}
            >
              {on ? (
                <>
                  {photoUris[i] ? (
                    <Image
                      source={{ uri: photoUris[i]! }}
                      style={styles.mediaThumb}
                    />
                  ) : (
                    <Feather name="image" size={26} color="white" />
                  )}
                  <View style={styles.mediaCheck}>
                    <Feather name="check" size={14} color="white" />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.plusCircle}>
                    <Feather name="plus" size={20} color="#F0531C" />
                  </View>
                  <Text style={styles.mediaTileLbl}>
                    {i === 0
                      ? t("worker_photos.profile_photo")
                      : t("worker_photos.add_photo")}
                  </Text>
                </>
              )}
            </Pressable>
          ))}
        </View>

        {/* Documents */}
        <Text style={styles.sectionTitle}>{t("worker_photos.documents_title")}</Text>
        <Text style={styles.sectionSub}>{t("worker_photos.documents_sub")}</Text>
        <View style={styles.docsCol}>
          {DOC_DEFS.map((d) => {
            const uploaded = docs[d.id];
            const title =
              d.id === "cv"
                ? t("docs.cv")
                : d.id === "ref"
                ? t("docs.refs")
                : t("docs.id");
            const sub =
              d.id === "cv"
                ? t("docs.cv_sub")
                : d.id === "ref"
                ? t("docs.refs_sub")
                : t("docs.id_sub");
            const badge =
              d.id === "ref"
                ? t("docs.vouched_badge")
                : d.id === "id"
                ? t("docs.verified_badge")
                : null;
            return (
              <Pressable
                key={d.id}
                onPress={() => setUploadingDoc(d.id)}
                style={[styles.docRow, uploaded && styles.docRowOn]}
              >
                <View
                  style={[
                    styles.docIcon,
                    uploaded && styles.docIconOn,
                  ]}
                >
                  <Feather
                    name={d.icon}
                    size={18}
                    color={uploaded ? "white" : "#0E1A24"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.docTitleRow}>
                    <Text style={styles.docTitle}>{title}</Text>
                    {badge && (
                      <View style={styles.badgePill}>
                        <Ionicons
                          name={d.id === "id" ? "shield-checkmark" : "star"}
                          size={10}
                          color="#854F0B"
                        />
                        <Text style={styles.badgePillTxt}>{badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.docSub}>{sub}</Text>
                </View>
                {uploaded ? (
                  <Feather name="check-circle" size={20} color="#3B6D11" />
                ) : (
                  <View style={styles.uploadChip}>
                    <Feather name="upload" size={13} color="#0E1A24" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tipBox}>
          <Feather name="lock" size={14} color="#854F0B" />
          <Text style={styles.tipTxt}>
            Documents are encrypted. Venues see only the badges — never the
            files themselves.
          </Text>
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          style={styles.cta}
          onPress={async () => {
            try {
              const profile = getWorkerProfile();
              const app = await createApplication({
                worker_id: profile?.workerId,
              });
              patchWorkerProfile({ applicationId: app.id });
            } catch (e) {
              // Don't block the user if application write fails — just log
              console.warn("[worker-photos] createApplication failed:", e);
            }
            router.replace("/worker-done");
          }}
        >
          <Text style={styles.ctaTxt}>{t("worker_photos.save_live")}</Text>
          <Feather name="arrow-right" size={20} color="#F7F4EE" />
        </Pressable>
        <Pressable
          onPress={() => router.replace("/worker-done")}
          style={styles.skipBtn}
        >
          <Text style={styles.skipBtnTxt}>{t("worker_photos.add_later")}</Text>
        </Pressable>
      </View>

      {/* Moderation: "Checking…" overlay */}
      <Modal visible={checking !== null} transparent animationType="fade">
        <View style={styles.checkingOverlay}>
          <View style={styles.checkingCard}>
            <View style={styles.checkingSpinner}>
              <Feather name="shield" size={24} color="#F0531C" />
            </View>
            <Text style={styles.checkingTitle}>{t("worker_photos.checking")}</Text>
            <Text style={styles.checkingSub}>{t("worker_photos.checking_sub")}</Text>
          </View>
        </View>
      </Modal>

      {/* Moderation: rejected toast */}
      {rejectedSlot !== null && (
        <View style={styles.rejectedToast}>
          <Feather name="alert-circle" size={16} color="#FCEBEB" />
          <Text style={styles.rejectedTxt}>{t("worker_photos.rejected")}</Text>
        </View>
      )}

      {/* Photo upload sheet */}
      <Modal
        visible={uploadingPhoto !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadingPhoto(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setUploadingPhoto(null)}
        />
        <View style={styles.uploadSheet}>
          <View style={styles.modalGrabber} />
          <Text style={styles.uploadSheetTitle}>
            {uploadingPhoto !== null && photos[uploadingPhoto]
              ? t("docs.replace_photo_title")
              : t("docs.add_photo_title")}
          </Text>
          <View style={styles.uploadOptCol}>
            <UploadOpt
              icon="camera"
              label={t("worker_photos.take_photo")}
              onPress={() => {
                if (uploadingPhoto !== null) {
                  handleCaptureOrPick(uploadingPhoto, "camera");
                } else {
                  setUploadingPhoto(null);
                }
              }}
            />
            <UploadOpt
              icon="image"
              label={t("worker_photos.choose_library")}
              onPress={() => {
                if (uploadingPhoto !== null) {
                  handleCaptureOrPick(uploadingPhoto, "library");
                } else {
                  setUploadingPhoto(null);
                }
              }}
            />
            {uploadingPhoto !== null && photos[uploadingPhoto] && (
              <UploadOpt
                icon="trash-2"
                label={t("worker_photos.remove_photo")}
                danger
                onPress={() => {
                  if (uploadingPhoto !== null) {
                    const slot = uploadingPhoto;
                    setPhotos((cur) =>
                      cur.map((v, i) => (i === slot ? false : v))
                    );
                    setPhotoUris((cur) =>
                      cur.map((v, i) => (i === slot ? null : v))
                    );
                  }
                  setUploadingPhoto(null);
                }}
              />
            )}
          </View>
          <Pressable
            onPress={() => setUploadingPhoto(null)}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelBtnTxt}>{t("common.cancel")}</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Document upload sheet */}
      <Modal
        visible={uploadingDoc !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadingDoc(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setUploadingDoc(null)}
        />
        <View style={styles.uploadSheet}>
          <View style={styles.modalGrabber} />
          <Text style={styles.uploadSheetTitle}>
            {t("docs.upload_prefix")}{" "}
            {uploadingDoc === "cv"
              ? t("docs.cv")
              : uploadingDoc === "ref"
              ? t("docs.refs")
              : uploadingDoc === "id"
              ? t("docs.id")
              : ""}
          </Text>
          <View style={styles.uploadOptCol}>
            <UploadOpt
              icon="file-text"
              label={t("docs.pick_pdf")}
              onPress={() => {
                if (uploadingDoc) {
                  setDocs((cur) => ({ ...cur, [uploadingDoc]: true }));
                }
                setUploadingDoc(null);
              }}
            />
            <UploadOpt
              icon="camera"
              label={t("docs.scan_cam")}
              onPress={() => {
                if (uploadingDoc) {
                  setDocs((cur) => ({ ...cur, [uploadingDoc]: true }));
                }
                setUploadingDoc(null);
              }}
            />
          </View>
          <Pressable
            onPress={() => setUploadingDoc(null)}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelBtnTxt}>{t("common.cancel")}</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function UploadOpt({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.uploadOpt}>
      <View
        style={[
          styles.uploadOptIcon,
          danger && { backgroundColor: "#FCEBEB" },
        ]}
      >
        <Feather
          name={icon}
          size={18}
          color={danger ? "#993556" : "#0E1A24"}
        />
      </View>
      <Text
        style={[styles.uploadOptLbl, danger && { color: "#993556" }]}
      >
        {label}
      </Text>
      <Feather name="chevron-right" size={18} color="#6B7280" />
    </Pressable>
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
  dotsRow: { flexDirection: "row", gap: 5 },
  dot: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(11,15,26,0.15)",
  },
  dotOn: { backgroundColor: "#0E1A24" },
  skipTop: { color: "#6B7280", fontSize: 14, fontWeight: "600" },

  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 },
  h1: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  h2: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },

  scoreBox: {
    marginTop: 16,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  scoreHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  scoreLbl: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1.2,
  },
  scoreVal: { fontSize: 16, fontWeight: "800", color: "#F0531C" },
  scoreTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E9E7DF",
    overflow: "hidden",
  },
  scoreFill: { height: "100%", backgroundColor: "#F0531C", borderRadius: 999 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0E1A24",
    textAlign: "center",
    marginTop: 22,
  },
  sectionSub: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 10,
    paddingHorizontal: 20,
  },

  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mediaTile: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  mediaTileOn: {
    backgroundColor: "#534AB7",
    borderColor: "#534AB7",
    borderStyle: "solid",
  },
  plusCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#FFF4EE",
    justifyContent: "center",
    alignItems: "center",
  },
  mediaTileLbl: { fontSize: 11, color: "#0E1A24", fontWeight: "600" },
  mediaThumb: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    borderRadius: 11,
  },
  mediaCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
  },

  docsCol: { gap: 8 },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  docRowOn: {
    backgroundColor: "#EAF3DE",
    borderColor: "rgba(99,153,34,0.40)",
  },
  docIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1EFE8",
    justifyContent: "center",
    alignItems: "center",
  },
  docIconOn: { backgroundColor: "#3B6D11" },
  docTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  docTitle: { fontSize: 14, fontWeight: "700", color: "#0E1A24" },
  docSub: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FAEEDA",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgePillTxt: { color: "#854F0B", fontSize: 9, fontWeight: "800" },
  uploadChip: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F1EFE8",
    justifyContent: "center",
    alignItems: "center",
  },

  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: "#FAEEDA",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  tipTxt: { flex: 1, color: "#854F0B", fontSize: 12, lineHeight: 16 },

  bottom: {
    padding: 16,
    gap: 10,
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
  ctaTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },
  skipBtn: { alignItems: "center", paddingVertical: 4 },
  skipBtnTxt: { color: "#6B7280", fontSize: 13, fontWeight: "600" },

  // Upload sheets
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  uploadSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  modalGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignSelf: "center",
    marginBottom: 14,
  },
  uploadSheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0E1A24",
    textAlign: "center",
  },
  uploadOptCol: { marginTop: 18, gap: 6 },
  uploadOpt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F1EFE8",
  },
  uploadOptIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadOptLbl: { flex: 1, fontSize: 15, fontWeight: "600", color: "#0E1A24" },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#F1EFE8",
    alignItems: "center",
  },
  cancelBtnTxt: { color: "#0E1A24", fontSize: 15, fontWeight: "700" },

  // Moderation states
  checkingOverlay: {
    flex: 1,
    backgroundColor: "rgba(11,15,26,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  checkingCard: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 28,
    alignItems: "center",
    gap: 12,
    minWidth: 260,
  },
  checkingSpinner: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#FFF4EE",
    justifyContent: "center",
    alignItems: "center",
  },
  checkingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0E1A24",
    marginTop: 6,
  },
  checkingSub: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 17,
  },

  rejectedToast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 110,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#993556",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    zIndex: 999,
  },
  rejectedTxt: { flex: 1, color: "#FCEBEB", fontSize: 13, fontWeight: "600" },
});
