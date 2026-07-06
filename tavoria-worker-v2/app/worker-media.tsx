import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WorkerMedia() {
  const router = useRouter();
  // Mock: index 0 already has the coached video done in /record
  const [photos, setPhotos] = useState<boolean[]>([true, false, false, false, false]);
  const [videos, setVideos] = useState<boolean[]>([true, false, false]);

  const photoCount = photos.filter(Boolean).length;
  const videoCount = videos.filter(Boolean).length;
  const score = Math.min(100, photoCount * 16 + videoCount * 12 + 20);

  const togglePhoto = (i: number) =>
    setPhotos((cur) => cur.map((v, idx) => (idx === i ? !v : v)));
  const toggleVideo = (i: number) =>
    setVideos((cur) => cur.map((v, idx) => (idx === i ? !v : v)));

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
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
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Make your profile shine.</Text>
        <Text style={styles.h2}>
          More photos and videos = more chances to get hired.
        </Text>

        {/* Profile strength meter */}
        <View style={styles.scoreBox}>
          <View style={styles.scoreHead}>
            <Text style={styles.scoreLbl}>PROFILE STRENGTH</Text>
            <Text style={styles.scoreVal}>{score}%</Text>
          </View>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${score}%` }]} />
          </View>
          <Text style={styles.scoreHint}>
            {score < 60
              ? "Add a couple more photos to stand out."
              : score < 90
              ? "Looking good — add one more video to seal it."
              : "Strong profile. Venues will notice."}
          </Text>
        </View>

        {/* Photos */}
        <Text style={styles.sectionTitle}>Photos · up to 5</Text>
        <Text style={styles.sectionSub}>
          1 clear face shot is required. Action shots help.
        </Text>
        <View style={styles.mediaGrid}>
          {photos.map((on, i) => (
            <Pressable
              key={i}
              onPress={() => togglePhoto(i)}
              style={[styles.mediaTile, on && styles.mediaTileOn]}
            >
              {on ? (
                <>
                  <View style={styles.mediaCheck}>
                    <Feather name="check" size={14} color="white" />
                  </View>
                  <Feather name="image" size={26} color="white" />
                </>
              ) : (
                <>
                  <Feather name="plus" size={22} color="#6B7280" />
                  <Text style={styles.mediaTileLbl}>Add photo</Text>
                </>
              )}
            </Pressable>
          ))}
        </View>

        {/* Videos */}
        <Text style={styles.sectionTitle}>Videos · up to 3</Text>
        <Text style={styles.sectionSub}>
          Your coached intro is locked in. Add a free-form pitch and a language demo to shine.
        </Text>
        <View style={styles.videosCol}>
          <Pressable
            onPress={() => toggleVideo(0)}
            style={[styles.videoRow, styles.videoRowOn]}
          >
            <View style={[styles.videoIcon, styles.videoIconOn]}>
              <Feather name="check" size={16} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.videoH}>Coached intro · 0:24</Text>
              <Text style={styles.videoSub}>Recorded just now</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => toggleVideo(1)}
            style={[styles.videoRow, videos[1] && styles.videoRowOn]}
          >
            <View
              style={[styles.videoIcon, videos[1] && styles.videoIconOn]}
            >
              <Feather
                name={videos[1] ? "check" : "plus"}
                size={16}
                color={videos[1] ? "white" : "#6B7280"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.videoH}>Free-form pitch · optional</Text>
              <Text style={styles.videoSub}>
                Why should they hire you? 60 sec max
              </Text>
            </View>
            {!videos[1] && (
              <Feather name="video" size={18} color="#185FA5" />
            )}
          </Pressable>
          <Pressable
            onPress={() => toggleVideo(2)}
            style={[styles.videoRow, videos[2] && styles.videoRowOn]}
          >
            <View
              style={[styles.videoIcon, videos[2] && styles.videoIconOn]}
            >
              <Feather
                name={videos[2] ? "check" : "plus"}
                size={16}
                color={videos[2] ? "white" : "#6B7280"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.videoH}>Language demo · optional</Text>
              <Text style={styles.videoSub}>
                Say hello in each language you speak
              </Text>
            </View>
            {!videos[2] && (
              <Ionicons name="language" size={18} color="#185FA5" />
            )}
          </Pressable>
        </View>

        <View style={styles.tipBox}>
          <Feather name="trending-up" size={14} color="#854F0B" />
          <Text style={styles.tipTxt}>
            Workers with 3+ photos get hired{" "}
            <Text style={{ fontWeight: "800" }}>2× faster</Text> on Tavoria.
          </Text>
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          style={styles.cta}
          onPress={() => router.replace("/worker-done")}
        >
          <Text style={styles.ctaTxt}>Save and go live</Text>
          <Feather name="arrow-right" size={20} color="#F7F4EE" />
        </Pressable>
      </View>
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
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(11,15,26,0.15)",
  },
  dotOn: { backgroundColor: "#0E1A24" },

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
    marginTop: 18,
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
  scoreVal: { fontSize: 18, fontWeight: "800", color: "#F0531C" },
  scoreTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E9E7DF",
    overflow: "hidden",
  },
  scoreFill: {
    height: "100%",
    backgroundColor: "#F0531C",
    borderRadius: 999,
  },
  scoreHint: { fontSize: 12, color: "#6B7280", marginTop: 8 },

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
  },

  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mediaTile: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  mediaTileOn: {
    backgroundColor: "#534AB7",
    borderColor: "#534AB7",
    borderStyle: "solid",
  },
  mediaTileLbl: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
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

  videosCol: { gap: 8 },
  videoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  videoRowOn: {
    backgroundColor: "#EAF3DE",
    borderColor: "rgba(99,153,34,0.40)",
  },
  videoIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#F1EFE8",
    justifyContent: "center",
    alignItems: "center",
  },
  videoIconOn: { backgroundColor: "#3B6D11" },
  videoH: { fontSize: 14, fontWeight: "700", color: "#0E1A24" },
  videoSub: { fontSize: 12, color: "#6B7280", marginTop: 1 },

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
});
