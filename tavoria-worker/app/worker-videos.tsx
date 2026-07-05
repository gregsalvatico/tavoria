import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentWorkerFull, uploadWorkerMedia } from "../lib/db";
import { t } from "../lib/i18n";
import { getWorkerProfile, patchWorkerProfile } from "../lib/workerProfile";
import { pickVideoWeb } from "../lib/webMedia";

type VideoRow = {
  id: string;
  title: string;
  sub: string;
  icon: keyof typeof Feather.glyphMap;
  required?: boolean;
};

const VIDEOS: VideoRow[] = [
  {
    id: "intro",
    title: "Coached intro",
    sub: "30 sec · name, where you're from, why this role",
    icon: "user",
    required: true,
  },
  {
    id: "pitch",
    title: "Free-form pitch",
    sub: "60 sec · why should they hire YOU?",
    icon: "mic",
  },
  {
    id: "lang",
    title: "Language demo",
    sub: "30 sec · say hello in each language you speak",
    icon: "globe",
  },
];

export default function WorkerVideos() {
  const router = useRouter();
  // Seed completed state from the worker's existing profile so a video
  // already uploaded during signup shows as "Recorded" here.
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    const p = getWorkerProfile();
    return p?.videoUrl ? { intro: true } : {};
  });
  const [recording, setRecording] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // After an app restart the local cache is empty — hydrate from Supabase too.
  useEffect(() => {
    if (done.intro) return;
    let cancelled = false;
    (async () => {
      try {
        const w = await getCurrentWorkerFull();
        if (cancelled || !w?.video_url) return;
        patchWorkerProfile({ videoUrl: w.video_url });
        setDone((cur) => ({ ...cur, intro: true }));
      } catch (e) {
        console.warn("[worker-videos] hydrate failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const score = Math.round(
    (Object.values(done).filter(Boolean).length / VIDEOS.length) * 100
  );

  // Real camera capture for the intro video. Other slots stay mock for now.
  async function recordIntroVideo() {
    setRecording(null);
    try {
      const isWeb = Platform.OS === "web";
      if (!isWeb) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Camera permission needed",
            "Please enable camera and microphone access in Settings to record."
          );
          return;
        }
      }
      // Web: capture="user" opens the camera on phone browsers, falls
      // back to file picker on desktop.
      const res = isWeb
        ? await pickVideoWeb({ camera: "user" })
        : await ImagePicker.launchCameraAsync({
            mediaTypes: ["videos"],
            videoMaxDuration: 30,
            quality: 0.7,
            cameraType: ImagePicker.CameraType.front,
          });
      if (res.canceled || !res.assets[0]) return;

      setUploading(true);
      const url = await uploadWorkerMedia("video", res.assets[0].uri);
      patchWorkerProfile({ videoUrl: url });
      setDone((cur) => ({ ...cur, intro: true }));
      setUploading(false);
    } catch (e: any) {
      setUploading(false);
      Alert.alert("Upload failed", e?.message ?? "Please try again.");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) { router.back(); return; }
            router.replace("/worker-bonus");
          }}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotOn]} />
          <View style={[styles.dot, styles.dotOn]} />
          <View style={styles.dot} />
        </View>
        <Pressable
          onPress={() => router.push("/worker-photos")}
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
            {t("worker_videos.title").charAt(0)}
          </Text>
          {t("worker_videos.title").slice(1)}
        </Text>
        <Text style={styles.h2}>{t("worker_videos.sub")}</Text>

        <View style={styles.scoreBox}>
          <View style={styles.scoreHead}>
            <Text style={styles.scoreLbl}>VIDEOS RECORDED</Text>
            <Text style={styles.scoreVal}>
              {Object.values(done).filter(Boolean).length}/3
            </Text>
          </View>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${score}%` }]} />
          </View>
        </View>

        <View style={styles.videosCol}>
          {VIDEOS.map((v) => {
            const recorded = done[v.id];
            return (
              <View
                key={v.id}
                style={[styles.videoCard, recorded && styles.videoCardOn]}
              >
                <View style={styles.videoCardTop}>
                  <View
                    style={[
                      styles.videoIcon,
                      recorded && styles.videoIconOn,
                    ]}
                  >
                    <Feather
                      name={v.icon}
                      size={18}
                      color={recorded ? "white" : "#0E1A24"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.videoTitleRow}>
                      <Text style={styles.videoTitle}>{v.title}</Text>
                      {v.required && (
                        <View style={styles.reqPill}>
                          <Text style={styles.reqPillTxt}>{t("worker_videos.required")}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.videoSub}>{v.sub}</Text>
                  </View>
                </View>

                {recorded ? (
                  <View style={styles.videoActions}>
                    <View style={styles.recordedBadge}>
                      <Feather name="check" size={14} color="white" />
                      <Text style={styles.recordedTxt}>{t("worker_videos.recorded")}</Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        v.id === "intro" ? recordIntroVideo() : setRecording(v.id)
                      }
                      style={styles.linkBtn}
                    >
                      <Feather name="rotate-ccw" size={13} color="#185FA5" />
                      <Text style={styles.linkBtnTxt}>{t("worker_videos.re_record")}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.recordBtn}
                    onPress={() =>
                      v.id === "intro" ? recordIntroVideo() : setRecording(v.id)
                    }
                  >
                    <Feather name="video" size={16} color="white" />
                    <Text style={styles.recordBtnTxt}>{t("worker_videos.record_now")}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.tipBox}>
          <Ionicons name="bulb" size={14} color="#854F0B" />
          <Text style={styles.tipTxt}>
            Workers with all 3 videos are{" "}
            <Text style={{ fontWeight: "800" }}>3× more likely</Text> to get
            an interview.
          </Text>
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          onPress={() => router.push("/worker-photos")}
          style={styles.cta}
        >
          <Text style={styles.ctaTxt}>{t("common.continue")}</Text>
          <Feather name="arrow-right" size={20} color="#F7F4EE" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/worker-photos")}
          style={styles.skipBtn}
        >
          <Text style={styles.skipBtnTxt}>{t("worker_videos.add_later")}</Text>
        </Pressable>
      </View>

      {/* Uploading overlay */}
      <Modal visible={uploading} transparent animationType="fade">
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingCard}>
            <ActivityIndicator size="large" color="#F0531C" />
            <Text style={styles.uploadingTitle}>{t("worker_videos.recorded")}…</Text>
            <Text style={styles.uploadingSub}>—</Text>
          </View>
        </View>
      </Modal>

      {/* Mock recording sheet (only for pitch / lang for now) */}
      <Modal
        visible={recording !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setRecording(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setRecording(null)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalGrabber} />
          <View style={styles.recordSheetCamera}>
            <Feather name="camera" size={48} color="rgba(255,255,255,0.4)" />
            <Text style={styles.recordSheetTitle}>
              Recording: {VIDEOS.find((v) => v.id === recording)?.title}
            </Text>
            <Text style={styles.recordSheetSub}>
              (camera preview shows here)
            </Text>
          </View>
          <View style={styles.recordSheetActions}>
            <Pressable
              onPress={() => setRecording(null)}
              style={styles.recordSheetCancel}
            >
              <Text style={styles.recordSheetCancelTxt}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (recording) {
                  setDone((cur) => ({ ...cur, [recording]: true }));
                }
                setRecording(null);
              }}
              style={styles.recordSheetSave}
            >
              <Feather name="check" size={16} color="white" />
              <Text style={styles.recordSheetSaveTxt}>Save take</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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

  videosCol: { gap: 10, marginTop: 16 },
  videoCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
    gap: 12,
  },
  videoCardOn: {
    backgroundColor: "#EAF3DE",
    borderColor: "rgba(99,153,34,0.40)",
  },
  videoCardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  videoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1EFE8",
    justifyContent: "center",
    alignItems: "center",
  },
  videoIconOn: { backgroundColor: "#3B6D11" },
  videoTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  videoTitle: { fontSize: 15, fontWeight: "700", color: "#0E1A24" },
  videoSub: { fontSize: 12, color: "#6B7280", marginTop: 1, lineHeight: 16 },
  reqPill: {
    backgroundColor: "#0E1A24",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reqPillTxt: { color: "white", fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },

  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0E1A24",
    paddingVertical: 12,
    borderRadius: 10,
  },
  recordBtnTxt: { color: "white", fontSize: 14, fontWeight: "700" },

  videoActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recordedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#3B6D11",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  recordedTxt: { color: "white", fontSize: 12, fontWeight: "700" },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  linkBtnTxt: { color: "#185FA5", fontSize: 13, fontWeight: "600" },

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
  tipTxt: { flex: 1, color: "#854F0B", fontSize: 13, lineHeight: 18 },

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

  // Mock recording modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalSheet: {
    backgroundColor: "#0E1A24",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  modalGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignSelf: "center",
    marginBottom: 14,
  },
  recordSheetCamera: {
    height: 240,
    backgroundColor: "#1A1F2E",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  recordSheetTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  recordSheetSub: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  recordSheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  recordSheetCancel: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  recordSheetCancelTxt: { color: "white", fontSize: 14, fontWeight: "600" },
  recordSheetSave: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F0531C",
    paddingVertical: 14,
    borderRadius: 999,
  },
  recordSheetSaveTxt: { color: "white", fontSize: 15, fontWeight: "700" },

  uploadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(11,15,26,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  uploadingCard: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 28,
    alignItems: "center",
    gap: 10,
    minWidth: 260,
  },
  uploadingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0E1A24",
    marginTop: 6,
  },
  uploadingSub: { fontSize: 12, color: "#6B7280", textAlign: "center" },
});
