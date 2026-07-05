import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../lib/i18n";
import {
  getCurrentWorkerFull,
  getWorkerById,
  getApplicationById,
} from "../lib/db";
import { getWorkerProfile, type InterviewAnswer } from "../lib/workerProfile";
import { localizeRoles } from "../lib/positions";
import { isProEligible } from "../lib/proEligibility";

type Action = "decline" | "interview" | "hire" | null;

// Years-of-experience numeric → label
const YEARS_LABEL: Record<number, string> = {
  0: "Just starting",
  1: "Less than 1 year",
  2: "1-2 years",
  4: "3-5 years",
  6: "5+ years",
};

// Unified shape the screen renders from
type View = {
  firstName: string;
  ageRange?: string;
  city?: string;
  country?: string;
  yearsExpLabel?: string;
  positions: string[];
  languages: string[];
  photoUrl?: string;
  videoUrl?: string;
  personality: string[];
  strengths: string[];
  interviewAnswers: InterviewAnswer[];
  interviewCompletedAt?: string;
};

function emptyView(): View {
  return {
    firstName: "—",
    positions: [],
    languages: [],
    personality: [],
    strengths: [],
    interviewAnswers: [],
  };
}

// Map a Supabase workers row → View
function fromRow(row: any): View {
  return {
    firstName: row?.first_name ?? "—",
    ageRange: row?.age_range ?? undefined,
    city: row?.city ?? undefined,
    country: row?.country ?? undefined,
    yearsExpLabel:
      typeof row?.years_exp === "number"
        ? YEARS_LABEL[row.years_exp] ?? `${row.years_exp} yrs`
        : row?.years_exp ?? undefined,
    positions: Array.isArray(row?.positions) ? row.positions : [],
    languages: Array.isArray(row?.languages) ? row.languages : [],
    photoUrl: row?.photo_url ?? undefined,
    videoUrl: row?.video_url ?? undefined,
    personality: Array.isArray(row?.personality) ? row.personality : [],
    strengths: Array.isArray(row?.strengths) ? row.strengths : [],
    interviewAnswers: Array.isArray(row?.interview_answers)
      ? row.interview_answers
      : [],
    interviewCompletedAt: row?.interview_completed_at ?? undefined,
  };
}

// Map the in-memory workerProfile → View
function fromLocal(p: any): View {
  return {
    firstName: p?.firstName ?? "—",
    ageRange: p?.ageRange ?? undefined,
    city: p?.city ?? undefined,
    country: p?.country ?? undefined,
    yearsExpLabel:
      typeof p?.yearsExperience === "number"
        ? YEARS_LABEL[p.yearsExperience] ?? `${p.yearsExperience} yrs`
        : undefined,
    positions: Array.isArray(p?.positions) ? p.positions : [],
    languages: Array.isArray(p?.languages) ? p.languages : [],
    photoUrl: p?.photoUrl ?? undefined,
    videoUrl: p?.videoUrl ?? undefined,
    personality: Array.isArray(p?.personality) ? p.personality : [],
    strengths: Array.isArray(p?.strengths) ? p.strengths : [],
    interviewAnswers: Array.isArray(p?.interviewAnswers)
      ? p.interviewAnswers
      : [],
    interviewCompletedAt: p?.interviewCompletedAt ?? undefined,
  };
}

export default function Profile() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    workerId?: string;
    applicationId?: string;
  }>();
  const [lastAction, setLastAction] = useState<Action>(null);

  const explicitVenue = params.mode === "venue";
  const explicitWorker = params.mode === "worker";
  const localWorker = getWorkerProfile();
  const isOwnerMode =
    explicitWorker ||
    (!explicitVenue &&
      !params.workerId &&
      !params.applicationId &&
      !!localWorker?.firstName);

  // Data loading
  const [view, setView] = useState<View>(() => {
    if (isOwnerMode && localWorker) return fromLocal(localWorker);
    return emptyView();
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1. Venue viewing a candidate by applicationId
        if (params.applicationId) {
          const app = await getApplicationById(params.applicationId);
          if (!cancelled && app?.worker) setView(fromRow(app.worker));
          return;
        }
        // 2. Venue viewing a worker by workerId
        if (params.workerId) {
          const w = await getWorkerById(params.workerId);
          if (!cancelled && w) setView(fromRow(w));
          return;
        }
        // 3. Owner mode — load own row from Supabase (richer than local cache)
        if (isOwnerMode) {
          const row = await getCurrentWorkerFull();
          if (cancelled) return;
          if (row) {
            const fromDb = fromRow(row);
            // Merge: db row is source of truth, but fall back to local cache
            // for anything missing (covers the moments between save + refresh)
            setView((prev) => ({
              ...prev,
              ...fromDb,
              personality:
                fromDb.personality.length > 0
                  ? fromDb.personality
                  : prev.personality,
              strengths:
                fromDb.strengths.length > 0
                  ? fromDb.strengths
                  : prev.strengths,
              interviewAnswers:
                fromDb.interviewAnswers.length > 0
                  ? fromDb.interviewAnswers
                  : prev.interviewAnswers,
              photoUrl: fromDb.photoUrl ?? prev.photoUrl,
              videoUrl: fromDb.videoUrl ?? prev.videoUrl,
            }));
          }
        }
      } catch (e) {
        console.warn("[profile] load failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOwnerMode, params.applicationId, params.workerId]);

  const onShare = async () => {
    try {
      await Share.share({
        message:
          "Check out my hospitality profile on Tavoria — get hired in minutes, not weeks.",
      });
    } catch {}
  };

  // Video modal
  const [videoOpen, setVideoOpen] = useState(false);
  const player = useVideoPlayer(view.videoUrl ?? "", (p) => {
    p.loop = false;
  });
  useEffect(() => {
    if (videoOpen) player.play();
    else player.pause();
  }, [videoOpen, player]);

  const hasInterview = view.interviewAnswers.length > 0;
  const hasPersonality = view.personality.length > 0;
  const hasStrengths = view.strengths.length > 0;
  const locationLine = useMemo(() => {
    const bits = [view.city, view.country].filter(Boolean);
    return bits.join(" · ");
  }, [view.city, view.country]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            // router.back() is a no-op on web when there's no history
            // (page refresh, deep link, etc.). Fall back to the screen
            // we'd logically be coming from.
            if (router.canGoBack()) {
              router.back();
              return;
            }
            if (params.applicationId) {
              router.replace({
                pathname: "/candidate",
                params: { applicationId: params.applicationId },
              });
            } else if (params.workerId) {
              router.replace({
                pathname: "/candidate",
                params: { workerId: params.workerId },
              });
            } else {
              router.replace("/");
            }
          }}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Feather name="chevron-left" size={28} color="#0E1A24" />
        </Pressable>
        <Text style={styles.headerTitle}>{t("profile.title")}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero photo */}
        <View style={styles.hero}>
          {view.photoUrl ? (
            <Image
              source={{ uri: view.photoUrl }}
              style={styles.heroImg}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImg, styles.heroPlaceholder]}>
              <Feather name="user" size={80} color="rgba(255,255,255,0.55)" />
            </View>
          )}
          <View style={styles.heroOverlay} />
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroName} numberOfLines={1}>
              {view.firstName.toUpperCase()}
              {view.ageRange ? (
                <Text style={styles.heroAge}>  {view.ageRange}{t("profile.age_suffix")}</Text>
              ) : null}
            </Text>
            {locationLine ? (
              <View style={styles.heroMetaRow}>
                <Feather name="map-pin" size={12} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroMeta}>{locationLine}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgesRow}>
          {/* "Available now" pill hidden — worker rows don't have a
              last_seen_at yet, so showing it on everyone is misleading.
              Re-enable once we wire a real presence signal. */}
          {hasInterview && (
            <View style={[styles.badge, styles.badgeInterview]}>
              <Feather name="check" size={12} color="#3C3489" />
              <Text style={[styles.badgeTxt, { color: "#3C3489" }]}>
                {t("profile.interview_done")}
              </Text>
            </View>
          )}
          {hasPersonality && (
            <View style={[styles.badge, styles.badgeVouched]}>
              <Ionicons name="sparkles" size={12} color="#854F0B" />
              <Text style={[styles.badgeTxt, { color: "#854F0B" }]}>
                {t("profile.personality_test")}
              </Text>
            </View>
          )}
        </View>

        {/* Personality */}
        {hasPersonality && (
          <Section title={t("profile.personality")}>
            <View style={styles.tagsRow}>
              {view.personality.map((p) => (
                <View key={p} style={[styles.tag, styles.tagPersonality]}>
                  <Text style={styles.tagPersonalityTxt}>{p}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Strengths */}
        {hasStrengths && (
          <Section title={t("profile.strengths")}>
            <View style={styles.tagsRow}>
              {view.strengths.map((s) => (
                <View key={s} style={[styles.tag, styles.tagStrength]}>
                  <Text style={styles.tagStrengthTxt}>{s}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Interview answers */}
        {hasInterview && (
          <Section
            title={`${t("profile.interview_label")} · ${view.interviewAnswers.length} ${
              view.interviewAnswers.length === 1
                ? t("profile.answers_one")
                : t("profile.answers_other")
            }`}
          >
            {view.interviewAnswers.map((qa, i) => (
              <View key={qa.q_id ?? i} style={styles.qaCard}>
                <View style={styles.qaTopRow}>
                  <Text style={styles.qaRole}>{qa.role}</Text>
                  <Text style={styles.qaIndex}>
                    {t("profile.q_of")
                      .replace("{{n}}", String(i + 1))
                      .replace("{{total}}", String(view.interviewAnswers.length))}
                  </Text>
                </View>
                <Text style={styles.qaQuestion}>{qa.q_text}</Text>
                <View style={styles.qaAnswerRow}>
                  <Feather name="check-circle" size={14} color="#0F6E56" />
                  <Text style={styles.qaAnswer}>{qa.a_text}</Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* About */}
        <Section title={t("profile.about")}>
          {view.yearsExpLabel ? (
            <View style={styles.infoLine}>
              <Feather name="clock" size={14} color="#6B7280" />
              <Text style={styles.infoTxt}>
                <Text style={styles.bold}>{view.yearsExpLabel}</Text> {t("profile.in_hospitality")}
              </Text>
            </View>
          ) : null}
          {view.positions.length > 0 ? (
            <View style={styles.infoLine}>
              <Feather name="briefcase" size={14} color="#6B7280" />
              <Text style={styles.infoTxt}>
                {localizeRoles(view.positions).join(" · ")}
              </Text>
            </View>
          ) : null}
          {view.languages.length > 0 ? (
            <View style={styles.infoLine}>
              <Feather name="globe" size={14} color="#6B7280" />
              <Text style={styles.infoTxt}>{view.languages.join(" · ")}</Text>
            </View>
          ) : null}
          {locationLine ? (
            <View style={styles.infoLine}>
              <Feather name="map-pin" size={14} color="#6B7280" />
              <Text style={styles.infoTxt}>{locationLine}</Text>
            </View>
          ) : null}
        </Section>

        {/* Videos */}
        <Section title={t("profile.videos")}>
          <View style={styles.videosCol}>
            <Pressable
              style={styles.videoFull}
              onPress={() => {
                if (view.videoUrl) setVideoOpen(true);
                else if (isOwnerMode) router.push("/worker-videos");
                else
                  Alert.alert(
                    "No video yet",
                    "This worker hasn't recorded their intro yet."
                  );
              }}
            >
              <View style={[styles.videoFullImg, styles.videoDark]}>
                <Feather
                  name={view.videoUrl ? "video" : "video-off"}
                  size={32}
                  color="rgba(255,255,255,0.55)"
                />
              </View>
              <View style={styles.videoOverlay} />
              <View style={styles.videoPlay}>
                <Feather
                  name={view.videoUrl ? "play" : "plus"}
                  size={22}
                  color="white"
                />
              </View>
              <Text style={styles.videoLabel}>
                {view.videoUrl
                  ? "Coached intro"
                  : isOwnerMode
                  ? "Record your intro"
                  : "Not recorded yet"}
              </Text>
            </Pressable>

            {/* Free-form pitch: owner can add, visitor sees PRO lock */}
            {isOwnerMode ? (
              <Pressable
                style={styles.videoAddRow}
                onPress={() => router.push("/worker-videos")}
              >
                <Feather name="mic" size={20} color="#F0531C" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.videoAddTitle}>Free-form pitch</Text>
                  <Text style={styles.videoAddSub}>60 sec · tap to record</Text>
                </View>
                <Feather name="plus" size={20} color="#0E1A24" />
              </Pressable>
            ) : isProEligible() ? (
              <View style={styles.videoFullLocked}>
                <Ionicons name="lock-closed" size={22} color="#F7F4EE" />
                <Text style={styles.videoLockedTxt}>Free-form pitch</Text>
                <View style={styles.proPill}>
                  <Text style={styles.proPillTxt}>PRO</Text>
                </View>
              </View>
            ) : null}

            {/* Language demo: owner can add, visitor sees PRO lock */}
            {isOwnerMode ? (
              <Pressable
                style={styles.videoAddRow}
                onPress={() => router.push("/worker-videos")}
              >
                <Feather name="globe" size={20} color="#F0531C" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.videoAddTitle}>{t("profile.language_demo")}</Text>
                  <Text style={styles.videoAddSub}>{t("profile.language_demo_sub")}</Text>
                </View>
                <Feather name="plus" size={20} color="#0E1A24" />
              </Pressable>
            ) : isProEligible() ? (
              <View style={styles.videoFullLocked}>
                <Ionicons name="lock-closed" size={22} color="#F7F4EE" />
                <Text style={styles.videoLockedTxt}>{t("profile.language_demo")}</Text>
                <View style={styles.proPill}>
                  <Text style={styles.proPillTxt}>PRO</Text>
                </View>
              </View>
            ) : null}
          </View>
        </Section>

        {/* Photos */}
        <Section title={`${t("profile.photos_label")} · ${view.photoUrl ? "1" : "0"}/5`}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gallery}
          >
            {view.photoUrl ? (
              <Pressable
                onPress={() => isOwnerMode && router.push("/worker-photos")}
              >
                <Image
                  source={{ uri: view.photoUrl }}
                  style={styles.photoTile}
                  resizeMode="cover"
                />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => isOwnerMode && router.push("/worker-photos")}
                style={[styles.photoTile, styles.photoEmpty]}
              >
                <Feather name="image" size={20} color="rgba(255,255,255,0.55)" />
              </Pressable>
            )}
            {[0, 1, 2, 3].map((i) => {
              if (isOwnerMode) {
                return (
                  <Pressable
                    key={i}
                    onPress={() => router.push("/worker-photos")}
                    style={[styles.photoTile, styles.photoAdd]}
                  >
                    <View style={styles.photoAddPlus}>
                      <Feather name="plus" size={20} color="#F0531C" />
                    </View>
                    <Text style={styles.photoAddTxt}>{t("profile.add_photo")}</Text>
                  </Pressable>
                );
              }
              // Visitor mode: only show PRO-locked slots once the user has
              // been around long enough for the upsell to feel earned.
              if (!isProEligible()) return null;
              return (
                <View key={i} style={[styles.photoTile, styles.photoLocked]}>
                  <Ionicons name="lock-closed" size={20} color="#F7F4EE" />
                  <View style={styles.proPill}>
                    <Text style={styles.proPillTxt}>PRO</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Section>

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Video player modal */}
      {view.videoUrl ? (
        <Modal
          visible={videoOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setVideoOpen(false)}
        >
          <View style={styles.videoModal}>
            <Pressable
              style={styles.videoClose}
              onPress={() => setVideoOpen(false)}
              hitSlop={12}
            >
              <Feather name="x" size={26} color="white" />
            </Pressable>
            <VideoView
              player={player}
              style={styles.videoModalPlayer}
              allowsFullscreen
              nativeControls
            />
          </View>
        </Modal>
      ) : null}

      {/* Sticky action bar */}
      {isOwnerMode ? (
        <View style={styles.actionBar}>
          <Pressable
            style={[styles.actionBtn, styles.ownerEdit]}
            onPress={() => router.push("/worker-bonus?mode=edit")}
          >
            <Feather name="edit-2" size={22} color="#F7F4EE" />
            <Text style={[styles.actionLbl, { color: "#F7F4EE" }]}>{t("profile.edit")}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.ownerBrowse]}
            onPress={() => router.push("/discover")}
          >
            <Feather name="search" size={22} color="#0E1A24" />
            <Text style={[styles.actionLbl, { color: "#0E1A24" }]}>{t("profile.venues")}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.ownerShare]}
            onPress={onShare}
          >
            <Feather name="share-2" size={22} color="#185FA5" />
            <Text style={[styles.actionLbl, { color: "#185FA5" }]}>Share</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actionBar}>
          <Pressable
            style={[styles.actionBtn, styles.actionDecline]}
            onPress={() => setLastAction("decline")}
          >
            <Feather name="x" size={24} color="#993556" />
            <Text style={[styles.actionLbl, { color: "#993556" }]}>
              Decline
            </Text>
          </Pressable>
          {isProEligible() && (
            <Pressable style={[styles.actionBtn, styles.actionStarLocked]}>
              <Ionicons name="star" size={24} color="#D4A24C" />
              <Text style={[styles.actionLbl, { color: "#854F0B" }]}>Star</Text>
              <View style={styles.proMicro}>
                <Text style={styles.proMicroTxt}>PRO</Text>
              </View>
            </Pressable>
          )}
          <Pressable
            style={[styles.actionBtn, styles.actionInterview]}
            onPress={() => setLastAction("interview")}
          >
            <Feather name="video" size={24} color="#185FA5" />
            <Text style={[styles.actionLbl, { color: "#185FA5" }]}>
              Interview
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionHire]}
            onPress={() => setLastAction("hire")}
          >
            <Feather name="check" size={26} color="#3B6D11" />
            <Text style={[styles.actionLbl, { color: "#3B6D11" }]}>Hire</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { width: 36, paddingVertical: 2 },
  headerTitle: { fontSize: 15, fontWeight: "600", color: "#0E1A24" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  hero: {
    height: 320,
    marginHorizontal: 12,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0E1A24",
    position: "relative",
  },
  heroImg: { width: "100%", height: "100%" },
  heroPlaceholder: {
    backgroundColor: "#0E1A24",
    justifyContent: "center",
    alignItems: "center",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  heroTextWrap: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroName: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroAge: {
    fontSize: 20,
    fontWeight: "400",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  heroMeta: { color: "rgba(255,255,255,0.9)", fontSize: 13 },

  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeTxt: { fontSize: 12, fontWeight: "600" },
  badgeLive: { backgroundColor: "#E1F5EE" },
  badgeInterview: { backgroundColor: "#EEEDFE" },
  badgeVouched: { backgroundColor: "#FAEEDA" },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#3FE38B",
  },

  section: { paddingHorizontal: 14, paddingTop: 18 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: "uppercase",
  },

  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  infoTxt: { fontSize: 14, color: "#0E1A24" },
  bold: { fontWeight: "700" },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  tagPersonality: { backgroundColor: "#EEEDFE" },
  tagPersonalityTxt: { fontSize: 12, color: "#3C3489", fontWeight: "600" },
  tagStrength: { backgroundColor: "#E1F5EE" },
  tagStrengthTxt: { fontSize: 12, color: "#0F6E56", fontWeight: "600" },

  // Interview Q&A cards
  qaCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  qaTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  qaRole: {
    fontSize: 10,
    fontWeight: "800",
    color: "#F0531C",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  qaIndex: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  qaQuestion: {
    fontSize: 14,
    color: "#0E1A24",
    fontWeight: "600",
    lineHeight: 19,
    marginBottom: 8,
  },
  qaAnswerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#F0F9F4",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  qaAnswer: { flex: 1, fontSize: 13, color: "#0E1A24", lineHeight: 18 },

  gallery: { gap: 8, paddingRight: 14 },
  photoTile: {
    width: 110,
    height: 140,
    borderRadius: 10,
    backgroundColor: "#0E1A24",
  },
  photoEmpty: { justifyContent: "center", alignItems: "center" },
  photoLocked: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  // Owner-mode "Add photo" tile — dashed border, no PRO lock
  photoAdd: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#F0531C",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  photoAddPlus: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#FFF4EE",
    justifyContent: "center",
    alignItems: "center",
  },
  photoAddTxt: { fontSize: 11, color: "#0E1A24", fontWeight: "700" },

  videosCol: { gap: 10 },
  videoFull: {
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#0E1A24",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  videoFullImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  videoEmpty: { justifyContent: "center", alignItems: "center" },
  // Clean dark thumbnail used when there's a real video URL (no demo asset)
  videoDark: {
    backgroundColor: "#0E1A24",
    justifyContent: "center",
    alignItems: "center",
  },
  // Owner-mode "Add" row for free-form pitch / language demo
  videoAddRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#F0531C",
    borderStyle: "dashed",
  },
  videoAddTitle: { fontSize: 14, fontWeight: "700", color: "#0E1A24" },
  videoAddSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  videoPlay: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoLabel: {
    position: "absolute",
    bottom: 10,
    left: 12,
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  videoFullLocked: {
    height: 90,
    borderRadius: 12,
    backgroundColor: "#0E1A24",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  videoLockedTxt: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },

  proPill: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#D4A24C",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  proPillTxt: {
    color: "#0E1A24",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  videoModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoModalPlayer: { width: "100%", height: "70%" },
  videoClose: { position: "absolute", top: 50, right: 20, zIndex: 10 },

  actionBar: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: "white",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "white",
    gap: 5,
    position: "relative",
  },
  actionDecline: {
    backgroundColor: "#FCEBEB",
    borderColor: "rgba(231,75,74,0.35)",
  },
  actionStarLocked: {
    backgroundColor: "#FCF6E8",
    borderColor: "rgba(212,162,76,0.45)",
  },
  actionInterview: {
    backgroundColor: "#E6F1FB",
    borderColor: "rgba(24,95,165,0.30)",
  },
  actionHire: {
    backgroundColor: "#EAF3DE",
    borderColor: "rgba(99,153,34,0.40)",
    flex: 1.3,
  },
  ownerEdit: {
    backgroundColor: "#F0531C",
    borderColor: "#F0531C",
    flex: 1.2,
  },
  ownerBrowse: {
    backgroundColor: "#F1EFE8",
    borderColor: "rgba(11,15,26,0.10)",
  },
  ownerShare: {
    backgroundColor: "#E6F1FB",
    borderColor: "rgba(24,95,165,0.25)",
  },
  actionLbl: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  proMicro: {
    position: "absolute",
    top: 5,
    right: 6,
    backgroundColor: "#D4A24C",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  proMicroTxt: {
    color: "#0E1A24",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
