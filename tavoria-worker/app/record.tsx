import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createApplication, uploadWorkerMedia } from "../lib/db";
import { t } from "../lib/i18n";
import { patchWorkerProfile } from "../lib/workerProfile";
import { pickImageWeb, pickVideoWeb } from "../lib/webMedia";

type Phase =
  | "intro"           // explain + take photo
  | "photo-preview"   // show photo, retake or continue
  | "video-intro"     // show 5 prompts, then record video
  | "video-preview"   // confirm video, submit
  | "uploading"       // spinner while we push to Supabase
  | "done";           // brief success state

// Localised at render-time via t() — see PROMPTS variable inside Record().

export default function Record() {
  const router = useRouter();
  const { next, shiftId, venueId, venueName } = useLocalSearchParams<{
    next?: string;
    shiftId?: string;
    venueId?: string;
    venueName?: string;
  }>();
  const isProfileFlow = next === "worker-profile";
  const isApplyFlow = next === "apply" && !!shiftId && !!venueId;
  const isVenueBoardFlow = next === "venue-board" && !!venueId;

  // Localised prompt list — must be inside component so t() is reactive
  const PROMPTS = [
    { q: t("record_screen.prompt_q1"), tip: t("record_screen.prompt_q1_tip") },
    { q: t("record_screen.prompt_q2"), tip: t("record_screen.prompt_q2_tip") },
  ];

  const [phase, setPhase] = useState<Phase>("intro");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(1)).current;
  const isVideoPhase = phase === "video-intro" || phase === "video-preview";

  // Pulsing ring for the AI coach avatar
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // ---- ACTIONS ----

  async function takePhoto() {
    setErrorMsg(null);
    // Web: use HTML file input with capture="user" — opens the camera on
    // phone browsers, falls back to file picker on desktop.
    if (Platform.OS === "web") {
      const res = await pickImageWeb({ camera: "user" });
      if (!res.canceled && res.assets[0]) {
        setPhotoUri(res.assets[0].uri);
        setPhase("photo-preview");
      }
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t("record_screen.perm_camera_title"),
        t("record_screen.perm_camera_msg")
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      setPhase("photo-preview");
    }
  }

  async function pickPhotoFromLibrary() {
    setErrorMsg(null);
    // Web: plain file picker, no capture hint.
    if (Platform.OS === "web") {
      const res = await pickImageWeb();
      if (!res.canceled && res.assets[0]) {
        setPhotoUri(res.assets[0].uri);
        setPhase("photo-preview");
      }
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        t("record_screen.perm_lib_title"),
        t("record_screen.perm_lib_msg")
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      setPhase("photo-preview");
    }
  }

  async function recordVideo() {
    setErrorMsg(null);
    // Web: capture="user" opens the camera on phone browsers, falls
    // back to file picker on desktop.
    if (Platform.OS === "web") {
      const res = await pickVideoWeb({ camera: "user" });
      if (!res.canceled && res.assets[0]) {
        setVideoUri(res.assets[0].uri);
        setVideoDuration(
          Math.round(((res.assets[0] as any).duration ?? 0) / 1000)
        );
        setPhase("video-preview");
      }
      return;
    }
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!camPerm.granted) {
      Alert.alert(
        t("record_screen.perm_camera_title"),
        t("record_screen.perm_camvideo_msg")
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: 30,
      quality: 0.7,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!res.canceled && res.assets[0]) {
      setVideoUri(res.assets[0].uri);
      setVideoDuration(
        Math.round(((res.assets[0] as any).duration ?? 0) / 1000)
      );
      setPhase("video-preview");
    }
  }

  async function submitAll() {
    if (!photoUri || !videoUri) {
      setErrorMsg(t("record_screen.err_missing"));
      return;
    }
    setPhase("uploading");
    setErrorMsg(null);
    try {
      const photoUrl = await uploadWorkerMedia("photo", photoUri);
      const videoUrl = await uploadWorkerMedia("video", videoUri);
      patchWorkerProfile({ photoUrl, videoUrl, photoUploaded: true });

      // Apply-flow: create the application now that the worker has media
      if (isApplyFlow && shiftId && venueId) {
        try {
          await createApplication({
            shift_id: shiftId,
            venue_id: venueId,
          });
        } catch (e) {
          console.warn("[record] createApplication failed:", e);
        }
      }

      setPhase("done");
      // Brief success state, then route
      setTimeout(() => {
        if (isApplyFlow) {
          // Apply path — application was already created above. Route
          // through positions + experience so the venue sees a full profile,
          // then land on /applied. The apply params are threaded so each
          // subsequent screen knows where to forward to next.
          router.replace({
            pathname: "/worker-positions",
            params: {
              next: "apply",
              shiftId: shiftId ?? "",
              venueId: venueId ?? "",
              venueName: venueName ?? "",
            },
          });
        } else if (isVenueBoardFlow) {
          // Came from a QR scan — drop them on the venue's shifts list
          router.replace({
            pathname: "/venue-board",
            params: { venueId },
          });
        } else if (isProfileFlow) {
          router.replace("/worker-positions");
        } else {
          router.replace("/applied");
        }
      }, 900);
    } catch (e: any) {
      setErrorMsg(e?.message ?? t("record_screen.err_upload"));
      setPhase("video-preview");
    }
  }

  // ---- RENDER ----

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.stage}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              if (phase === "photo-preview") return setPhase("intro");
              if (phase === "video-intro") return setPhase("photo-preview");
              if (phase === "video-preview") return setPhase("video-intro");
              if (router.canGoBack()) { router.back(); return; }
              router.replace("/");
            }}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Feather
              name={phase === "intro" ? "x" : "chevron-left"}
              size={22}
              color="#F7F4EE"
            />
          </Pressable>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeTxt}>
              {t("record_screen.step_of").replace(
                "{{n}}",
                String(isVideoPhase ? 2 : 1)
              )}
            </Text>
          </View>

          <View style={{ width: 38 }} />
        </View>

        {/* Center: AI coach + state-specific content */}
        <View style={styles.stageCenter}>
          {/* PHASE: intro — explain + take photo */}
          {phase === "intro" && (
            <>
              <View style={styles.avatarWrap}>
                <Animated.View
                  style={[styles.avatarRing, { opacity: pulse }]}
                />
                <View style={styles.avatar}>
                  <Feather name="user" size={56} color="white" />
                  <View style={styles.avatarDot} />
                </View>
                <Text style={styles.avatarLbl}>{t("record_screen.coach")}</Text>
              </View>

              <View style={styles.questionBlock}>
                <Text style={styles.questionLbl}>
                  {t("record_screen.intro_kicker")}
                </Text>
                <Text style={styles.questionTxt}>
                  {t("record_screen.intro_title")}
                </Text>
                <Text style={styles.questionTip}>
                  {t("record_screen.intro_tip")}
                </Text>
              </View>
            </>
          )}

          {/* PHASE: photo-preview */}
          {phase === "photo-preview" && photoUri && (
            <>
              <View style={styles.previewPhotoWrap}>
                <Image source={{ uri: photoUri }} style={styles.previewPhoto} />
              </View>
              <Text style={styles.previewTitle}>
                {t("record_screen.photo_ok_title")}
              </Text>
              <Text style={styles.previewSub}>
                {t("record_screen.photo_ok_sub")}
              </Text>
            </>
          )}

          {/* PHASE: video-intro */}
          {phase === "video-intro" && (
            <>
              <View style={styles.avatarWrap}>
                <Animated.View
                  style={[styles.avatarRing, { opacity: pulse }]}
                />
                <View style={styles.avatar}>
                  <Feather name="video" size={48} color="white" />
                  <View style={styles.avatarDot} />
                </View>
                <Text style={styles.avatarLbl}>{t("record_screen.coach")}</Text>
              </View>

              <View style={styles.questionBlock}>
                <Text style={styles.questionLbl}>
                  {t("record_screen.video_kicker")}
                </Text>
                <Text style={styles.questionTxt}>
                  {t("record_screen.video_title")}
                </Text>
              </View>

              <View style={styles.promptsBox}>
                {PROMPTS.map((p, i) => (
                  <View key={i} style={styles.promptRow}>
                    <View style={styles.promptNum}>
                      <Text style={styles.promptNumTxt}>{i + 1}</Text>
                    </View>
                    <Text style={styles.promptTxt}>{p.q}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => router.push("/interview-prep")}
                style={styles.tipsLink}
              >
                <Feather name="book-open" size={14} color="#F0531C" />
                <Text style={styles.tipsLinkTxt}>
                  {t("record_screen.video_tip_lbl")}
                </Text>
              </Pressable>
            </>
          )}

          {/* PHASE: video-preview */}
          {phase === "video-preview" && videoUri && (
            <View style={styles.reviewWrap}>
              <Feather name="check-circle" size={56} color="#3FE38B" />
              <Text style={styles.previewTitle}>
                {t("record_screen.video_ready_title")}
              </Text>
              <Text style={styles.previewSub}>
                {videoDuration > 0
                  ? t("record_screen.video_ready_sub_recorded").replace(
                      "{{n}}",
                      String(videoDuration)
                    )
                  : t("record_screen.video_ready_sub_default")}
              </Text>
              {errorMsg ? (
                <Text style={styles.errorTxt}>{errorMsg}</Text>
              ) : null}
            </View>
          )}

          {/* PHASE: uploading */}
          {phase === "uploading" && (
            <View style={styles.reviewWrap}>
              <ActivityIndicator size="large" color="#F0531C" />
              <Text style={styles.previewTitle}>
                {t("record_screen.uploading_title")}
              </Text>
              <Text style={styles.previewSub}>
                {t("record_screen.uploading_sub")}
              </Text>
            </View>
          )}

          {/* PHASE: done */}
          {phase === "done" && (
            <View style={styles.reviewWrap}>
              <Feather name="check-circle" size={72} color="#3FE38B" />
              <Text style={styles.previewTitle}>
                {t("record_screen.done_title")}
              </Text>
              <Text style={styles.previewSub}>
                {t("record_screen.done_sub")}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom bar — action buttons per phase */}
      <View style={styles.bottom}>
        {phase === "intro" && (
          <View style={styles.bottomCol}>
            <Pressable style={styles.primaryBtn} onPress={takePhoto}>
              <Feather name="camera" size={18} color="#F7F4EE" />
              <Text style={styles.primaryBtnTxt}>
                {t("record_screen.take_photo")}
              </Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={pickPhotoFromLibrary}>
              <Feather name="image" size={16} color="#F7F4EE" />
              <Text style={styles.ghostBtnTxt}>
                {t("record_screen.choose_lib")}
              </Text>
            </Pressable>
          </View>
        )}

        {phase === "photo-preview" && (
          <View style={styles.reviewButtons}>
            <Pressable
              style={styles.retakeBtn}
              onPress={() => {
                setPhotoUri(null);
                setPhase("intro");
              }}
            >
              <Feather name="refresh-ccw" size={18} color="#F7F4EE" />
              <Text style={styles.retakeTxt}>
                {t("record_screen.retake")}
              </Text>
            </Pressable>
            <Pressable
              style={styles.submitBtn}
              onPress={() => setPhase("video-intro")}
            >
              <Text style={styles.submitTxt}>Continue</Text>
              <Feather name="arrow-right" size={18} color="#F7F4EE" />
            </Pressable>
          </View>
        )}

        {phase === "video-intro" && (
          <View style={styles.bottomCol}>
            <Pressable style={styles.primaryBtn} onPress={recordVideo}>
              <View style={styles.recDotSmall} />
              <Text style={styles.primaryBtnTxt}>
                {t("record_screen.record_video")}
              </Text>
            </Pressable>
          </View>
        )}

        {phase === "video-preview" && (
          <View style={styles.reviewButtons}>
            <Pressable
              style={styles.retakeBtn}
              onPress={() => {
                setVideoUri(null);
                setVideoDuration(0);
                setPhase("video-intro");
              }}
            >
              <Feather name="refresh-ccw" size={18} color="#F7F4EE" />
              <Text style={styles.retakeTxt}>
                {t("record_screen.retake")}
              </Text>
            </Pressable>
            <Pressable style={styles.submitBtn} onPress={submitAll}>
              <Text style={styles.submitTxt}>{t("record_screen.submit")}</Text>
              <Feather name="arrow-right" size={18} color="#F7F4EE" />
            </Pressable>
          </View>
        )}

        {(phase === "uploading" || phase === "done") && (
          <View style={{ height: 60 }} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0E1A24" },
  stage: { flex: 1, backgroundColor: "#0E1A24", position: "relative" },
  stageCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  stepBadgeTxt: {
    color: "#F7F4EE",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  avatarWrap: { alignItems: "center", marginBottom: 28, position: "relative" },
  avatarRing: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#F0531C",
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarDot: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#3FE38B",
    borderWidth: 3,
    borderColor: "#0E1A24",
  },
  avatarLbl: {
    marginTop: 14,
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  questionBlock: { alignItems: "center", marginTop: 8 },
  questionLbl: {
    color: "#F0531C",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  questionTxt: {
    color: "#F7F4EE",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
    textAlign: "center",
    lineHeight: 32,
  },
  questionTip: {
    marginTop: 14,
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },

  promptsBox: {
    marginTop: 24,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    width: "100%",
    maxWidth: 360,
  },
  promptRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  promptNum: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
  },
  promptNumTxt: { color: "#F7F4EE", fontSize: 12, fontWeight: "800" },
  promptTxt: {
    color: "#F7F4EE",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  tipsLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,90,31,0.15)",
  },
  tipsLinkTxt: { color: "#F0531C", fontSize: 13, fontWeight: "700" },

  previewPhotoWrap: {
    width: 240,
    height: 240,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#F0531C",
    marginBottom: 20,
  },
  previewPhoto: { width: "100%", height: "100%" },
  previewTitle: {
    color: "#F7F4EE",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "center",
  },
  previewSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 24,
  },
  errorTxt: {
    color: "#FF9F8A",
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 24,
  },

  reviewWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 24,
  },

  bottom: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
  },
  bottomCol: { width: "100%", gap: 10 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F0531C",
    paddingVertical: 16,
    borderRadius: 999,
  },
  primaryBtnTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  ghostBtnTxt: { color: "#F7F4EE", fontSize: 14, fontWeight: "600" },

  recDotSmall: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#E24B4A",
  },

  reviewButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  retakeTxt: { color: "#F7F4EE", fontSize: 14, fontWeight: "700" },
  submitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0531C",
    paddingVertical: 14,
    borderRadius: 999,
  },
  submitTxt: { color: "#F7F4EE", fontSize: 15, fontWeight: "700" },
});
