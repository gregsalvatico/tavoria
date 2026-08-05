import { Feather } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ApplicationStatus,
  getApplicationById,
  getCurrentWorkerFull,
  getWorkerById,
  updateApplicationStatus,
} from "../lib/db";
import {
  countryNameFromCode,
  flagFromCode,
  isEligibleToWorkIT,
  WORK_ELIGIBILITY_OPTIONS,
} from "../lib/countries";
import { t } from "../lib/i18n";
import { localizeRole, localizeRoles } from "../lib/positions";
import { isProEligible } from "../lib/proEligibility";
import { hasLocalQaReviewAccess } from "../lib/qaAccess";
import { getWorkerProfile } from "../lib/workerProfile";
import {
  Alert,
  Animated,
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
import { telUrl, whatsAppUrl } from "../lib/contact";
import { openExternalLink } from "../lib/externalLinks";
import AppBottomNav from "../components/AppBottomNav";
import ApplicationActionModal, {
  type ApplicationAction,
  type InterviewSchedule,
} from "../components/ApplicationActionModal";
import InterviewOutcomeModal, {
  type InterviewOutcome,
} from "../components/InterviewOutcomeModal";
import ProInvitationModal from "../components/ProInvitationModal";
import ContactPersonModal from "../components/ContactPersonModal";

function yearsShort(n: number): string {
  const key = `worker_experience.years_short_${n}`;
  const val = t(key);
  if (val && !val.includes(".")) return val;
  return `${n} yrs`;
}

function yearsLongLabel(n: number): string {
  const key = `worker_experience.years_long_${n}`;
  const val = t(key);
  if (val && !val.includes(".")) return val;
  return `${n} yrs experience`;
}

export default function Candidate() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    applicationId?: string;
    workerId?: string;
  }>();
  const incomingAppId = params.applicationId;
  const incomingWorkerId = params.workerId;

  // Owner mode: viewing your own card (no applicationId/workerId params)
  // Venue mode: viewing a candidate (one of those params is set)
  const isOwnerMode = !incomingAppId && !incomingWorkerId;

  const onShare = async () => {
    try {
      await Share.share({
        message:
          "Check out my hospitality profile on Tavoria — get hired in minutes, not weeks.",
      });
    } catch {}
  };

  const [lastAction, setLastAction] = useState<ApplicationAction | null>(null);
  const [pendingAction, setPendingAction] = useState<ApplicationAction | null>(null);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [venueName, setVenueName] = useState<string>("");
  const [venueAddress, setVenueAddress] = useState<string>("");
  const [interviewLocationOptions, setInterviewLocationOptions] = useState<("venue" | "phone" | "video" | "other")[]>(["venue", "phone", "video"]);
  const [interviewScheduledAt, setInterviewScheduledAt] = useState<string | null>(null);
  const [interviewLocation, setInterviewLocation] = useState<string>("");
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [proInviteOpen, setProInviteOpen] = useState(false);
  const [contactApplicantOpen, setContactApplicantOpen] = useState(false);
  const applicationId = incomingAppId ?? null;
  // If navigated with applicationId, fetch that specific applicant from Supabase
  const [remoteWorker, setRemoteWorker] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [qaReviewAccess, setQaReviewAccess] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    hasLocalQaReviewAccess().then(setQaReviewAccess).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (incomingAppId) {
          const app = await getApplicationById(incomingAppId);
          setRemoteWorker(app?.worker ?? null);
          if (app?.status) setAppStatus(app.status);
          const v = (app as any)?.venue;
          if (v?.name) setVenueName(v.name);
          if (v?.address) setVenueAddress(v.address);
          if (Array.isArray(v?.interview_location_options) && v.interview_location_options.length) {
            setInterviewLocationOptions(v.interview_location_options);
          }
          if ((app as any)?.interview_scheduled_at) {
            setInterviewScheduledAt((app as any).interview_scheduled_at);
          }
          if ((app as any)?.interview_location) {
            setInterviewLocation((app as any).interview_location);
          }
        } else if (incomingWorkerId) {
          const w = await getWorkerById(incomingWorkerId);
          setRemoteWorker(w);
        } else {
          // Owner mode — hydrate own card from Supabase (covers app restarts when
          // the in-memory workerProfile cache is empty).
          const w = await getCurrentWorkerFull();
          if (w) setRemoteWorker(w);
        }
      } catch (e) {
        console.warn("[candidate] failed to load worker:", e);
      }
    })();
  }, [incomingAppId, incomingWorkerId]);

  // Map UI action → DB status; update Supabase, then show toast
  async function handleAction(action: ApplicationAction, interview?: InterviewSchedule) {
    if (!applicationId) {
      setPendingAction(null);
      Alert.alert(
        t("candidate_actions.no_application_title"),
        t("candidate_actions.no_application_body")
      );
      return;
    }
    const statusMap: Record<ApplicationAction, ApplicationStatus> = {
      decline: "declined",
      star: "starred",
      interview: "interview_requested",
      hire: "hired",
    };
    setUpdatingStatus(true);
    try {
      await updateApplicationStatus(applicationId, statusMap[action], interview);
      setLastAction(action);
      setAppStatus(statusMap[action]);
      if (interview) {
        setInterviewScheduledAt(interview.scheduledAt);
        setInterviewLocation(interview.location);
      }
      setPendingAction(null);
      setOutcomeOpen(false);
    } catch (e: any) {
      console.warn("[candidate] updateApplicationStatus failed:", e);
      Alert.alert(
        t("candidate_actions.save_error_title"),
        e?.message ?? t("candidate_actions.save_error_body"),
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  // If the worker just signed up, show THEIR card — otherwise fall back to the demo Greg.
  const localWorker = getWorkerProfile();
  const view = useMemo(() => {
    // 1. If we navigated here with an applicationId AND fetched the remote worker → show that
    if (remoteWorker) {
      return {
        firstName: remoteWorker.first_name ?? "—",
        ageLabel: remoteWorker.age_range ?? "",
        country: remoteWorker.city ?? remoteWorker.country ?? "—",
        nationality: remoteWorker.nationality ?? undefined,
        workEligibilityIT: remoteWorker.work_eligibility_it ?? undefined,
        yearsTxt: remoteWorker.years_exp || "—",
        yearsLong: remoteWorker.years_exp || "",
        positions: remoteWorker.positions ?? [],
        languagesLine:
          (remoteWorker.languages ?? []).length > 0
            ? remoteWorker.languages.join(" · ")
            : "—",
        photoUrl: remoteWorker.photo_url ?? undefined,
        videoUrl: remoteWorker.video_url ?? undefined,
        phone: remoteWorker.phone ?? undefined,
        phoneVisible:
          remoteWorker.phone_visible === false ? false : true,
      };
    }
    // 2. Else: show the locally-signed-up worker (own preview)
    if (localWorker && localWorker.firstName) {
      return {
        firstName: localWorker.firstName,
        ageLabel: localWorker.ageRange ?? "",
        country: localWorker.city ?? localWorker.country ?? "—",
        nationality: localWorker.nationality ?? undefined,
        workEligibilityIT: localWorker.workEligibilityIT ?? undefined,
        yearsTxt:
          localWorker.yearsExperience !== undefined
            ? yearsShort(localWorker.yearsExperience)
            : "—",
        yearsLong:
          localWorker.yearsExperience !== undefined
            ? yearsLongLabel(localWorker.yearsExperience)
            : "",
        positions: localWorker.positions ?? [],
        languagesLine:
          (localWorker.languages ?? []).length > 0
            ? localWorker.languages!.join(" · ")
            : "—",
        photoUrl: localWorker.photoUrl,
        videoUrl: localWorker.videoUrl,
        phone: localWorker.phone,
        phoneVisible:
          localWorker.phoneVisible === false ? false : true,
      };
    }
    // 3. Empty state — never show fake demo data
    return {
      firstName: "—",
      ageLabel: "",
      country: "",
      nationality: undefined as string | undefined,
      workEligibilityIT: undefined as string | undefined,
      yearsTxt: "",
      yearsLong: "",
      positions: [] as string[],
      languagesLine: "—",
      photoUrl: undefined as string | undefined,
      videoUrl: undefined as string | undefined,
      phone: undefined as string | undefined,
      phoneVisible: true,
    };
  }, [localWorker, remoteWorker]);

  // Dot count for the photo strip — until we wire multiple photos, show 1 dot per uploaded photo
  const photoCount = view.photoUrl ? 1 : 0;

  // Keep one native VideoView attached to this player at a time. Android cannot
  // mount the same expo-video player in both the preview and modal together.
  const [videoOpen, setVideoOpen] = useState(false);
  const player = useVideoPlayer(view.videoUrl ?? null, (p) => {
    p.loop = false;
    p.muted = true;
  });
  useEffect(() => {
    if (videoOpen) {
      player.muted = false;
      player.play();
    } else {
      player.pause();
      player.currentTime = 0;
      player.muted = true;
    }
  }, [videoOpen, player]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scrollWrap}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <Link href="/" asChild>
              <Pressable style={styles.backBtn} hitSlop={12}>
                <Feather name="chevron-left" size={28} color="#0E1A24" />
              </Pressable>
            </Link>
            {/* "14 left" counter removed — felt gimmicky / Tinder-like. */}
          </View>
          <Link
            href={
              incomingAppId
                ? `/profile?mode=venue&applicationId=${incomingAppId}`
                : incomingWorkerId
                ? `/profile?mode=venue&workerId=${incomingWorkerId}`
                : "/profile?mode=worker"
            }
            asChild
          >
            <Pressable style={styles.fullProfileTopLink} hitSlop={8}>
              <Text style={styles.fullProfileTopTxt}>{t("candidate_actions.view_full_profile")}</Text>
              <Feather name="chevron-right" size={14} color="#0E1A24" />
            </Pressable>
          </Link>
        </View>

        <View style={styles.card}>
          <View style={styles.photoWrap}>
            {view.photoUrl ? (
              <Image
                source={{ uri: view.photoUrl }}
                style={styles.photo}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Feather name="user" size={64} color="rgba(255,255,255,0.55)" />
              </View>
            )}

            {photoCount > 1 && (
              <View style={styles.photoDots}>
                {Array.from({ length: photoCount }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === 0 && styles.dotActive]}
                  />
                ))}
              </View>
            )}

            {/* "Available now" pill hidden — worker rows don't have a
                last_seen_at yet, so showing it on everyone is misleading.
                Re-enable once we wire a real presence signal. */}
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.profileKicker}>WORKER PROFILE</Text>
            <View style={styles.nameRow}>
              <Text style={[styles.sideTxt, styles.sideLeft]}>
                {view.country}
              </Text>
              <View style={styles.nameCenterCol}>
                <Text
                  style={styles.name}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {view.firstName}
                </Text>
                {view.ageLabel ? (
                  <Text style={styles.nameAgeLine}>
                    {view.ageLabel}
                    <Text style={styles.ageYSuffix}> y</Text>
                  </Text>
                ) : null}
                {view.yearsLong ? (
                  <Text
                    style={styles.nameExpLine}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {view.yearsLong}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.distRow, styles.sideRight]}>
                <Feather name="map-pin" size={12} color="#6B7280" />
                <Text style={styles.distance}>1.2 km</Text>
              </View>
            </View>

            <View style={styles.infoPanel}>
            <View style={[styles.infoRow, { justifyContent: "center" }]}>
              <Feather name="briefcase" size={14} color="#6B7280" />
              <Text style={styles.infoTxt}>
                {view.positions.length > 0 ? (
                  <>
                    <Text style={styles.primaryJob}>{localizeRole(view.positions[0])}</Text>
                    {view.positions.length > 1 && (
                      <Text>{" · " + localizeRoles(view.positions.slice(1)).join(" · ")}</Text>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </Text>
            </View>
            <View style={[styles.infoRow, { justifyContent: "center" }]}>
              <Feather name="globe" size={14} color="#6B7280" />
              <Text style={styles.infoTxt}>{view.languagesLine}</Text>
            </View>
            </View>

            {/* Nationality + work eligibility chip row */}
            {(view.nationality || view.workEligibilityIT) && (
              <View style={styles.eligChipRow}>
                {view.nationality && (
                  <View style={styles.eligChip}>
                    <Text style={styles.eligChipFlag}>
                      {flagFromCode(view.nationality)}
                    </Text>
                    <Text style={styles.eligChipTxt}>
                      {countryNameFromCode(view.nationality)}
                    </Text>
                  </View>
                )}
                {view.workEligibilityIT && (
                  <View
                    style={[
                      styles.eligChip,
                      isEligibleToWorkIT(
                        view.workEligibilityIT,
                        view.nationality
                      )
                        ? styles.eligChipGreen
                        : styles.eligChipAmber,
                    ]}
                  >
                    <Text style={styles.eligChipFlag}>
                      {WORK_ELIGIBILITY_OPTIONS.find(
                        (o) => o.id === view.workEligibilityIT
                      )?.emoji ?? ""}
                    </Text>
                    <Text
                      style={[
                        styles.eligChipTxt,
                        isEligibleToWorkIT(
                          view.workEligibilityIT,
                          view.nationality
                        )
                          ? styles.eligChipTxtGreen
                          : styles.eligChipTxtAmber,
                      ]}
                    >
                      {t(
                        `work_eligibility.${view.workEligibilityIT}`
                      )}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.sectionLabel}>{t("candidate_actions.videos_label")}</Text>
            <View style={styles.videoRow}>
              <View style={styles.videoBoxBig}>
                {view.videoUrl && !videoOpen ? (
                  <VideoView
                    player={player}
                    style={styles.videoThumb}
                    contentFit="cover"
                    nativeControls={false}
                    surfaceType="textureView"
                  />
                ) : (
                  <View style={[styles.videoThumb, styles.videoEmptyBox]}>
                    <Feather
                      name="video-off"
                      size={28}
                      color="rgba(255,255,255,0.45)"
                    />
                    <Text style={styles.videoAbsentText}>No intro video</Text>
                  </View>
                )}
                {view.videoUrl ? <>
                  <View style={styles.videoOverlay} pointerEvents="none" />
                  <Pressable
                    style={styles.videoPlayCircleBig}
                    onPress={() => setVideoOpen(true)}
                    hitSlop={20}
                    accessibilityRole="button"
                    accessibilityLabel="Open intro video"
                  >
                    <Feather name="maximize-2" size={24} color="white" />
                  </Pressable>
                </> : null}
                {view.videoUrl ? (
                  <View style={styles.videoRecordedBadge}>
                    <Feather name="check" size={11} color="white" />
                    <Text style={styles.videoRecordedTxt}>{t("candidate_actions.just_recorded")}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.videoSideCol}>
                {isOwnerMode ? (
                  <>
                    <Pressable
                      style={[styles.videoBoxSmall, styles.videoAdd]}
                      onPress={() => router.push("/worker-videos")}
                    >
                      <View style={styles.videoAddPlus}>
                        <Feather name="plus" size={16} color="#F0531C" />
                      </View>
                      <Text style={styles.videoAddTxt}>{t("candidate_actions.add_video")}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.videoBoxSmall, styles.videoAdd]}
                      onPress={() => router.push("/worker-videos")}
                    >
                      <View style={styles.videoAddPlus}>
                        <Feather name="plus" size={16} color="#F0531C" />
                      </View>
                      <Text style={styles.videoAddTxt}>{t("candidate_actions.add_video")}</Text>
                    </Pressable>
                  </>
                ) : isProEligible() && !qaReviewAccess ? (
                  <>
                    <View style={[styles.videoBoxSmall, styles.videoLocked]}>
                      <Feather name="lock" size={18} color="#F7F4EE" />
                      <View style={styles.proPillSm}>
                        <Text style={styles.proPillTxt}>PRO</Text>
                      </View>
                    </View>
                    <View style={[styles.videoBoxSmall, styles.videoLocked]}>
                      <Feather name="lock" size={18} color="#F7F4EE" />
                      <View style={styles.proPillSm}>
                        <Text style={styles.proPillTxt}>PRO</Text>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>
            </View>

            {/* Contact section — locked until interview/hire, always shown in owner mode */}
            {(isOwnerMode ||
              qaReviewAccess ||
              appStatus === "interview_requested" ||
              appStatus === "hired") ? (
              <View style={styles.contactBlock}>
                <Text style={styles.contactLabel}>
                  {t("contact.section_label")}
                </Text>
                {view.phone && view.phoneVisible !== false ? (
                  <View style={styles.contactRow}>
                    <Feather name="phone" size={14} color="#2C3038" />
                    <Text style={styles.contactPhone}>{view.phone}</Text>
                    {!isOwnerMode && (
                      <View style={styles.contactBtnRow}>
                        <Pressable
                          style={styles.contactApplicantBtn}
                          onPress={() => setContactApplicantOpen(true)}
                        >
                          <Feather name="send" size={14} color="#0E1A24" />
                          <Text style={styles.contactApplicantBtnTxt}>{t("contact_modal.contact_applicant")}</Text>
                        </Pressable>
                        <Pressable
                          style={styles.waBtn}
                          onPress={() => {
                            const msg = t("contact.wa_msg_venue_to_worker", {
                              name: view.firstName,
                              venue: venueName || "Tavoria",
                            });
                            const url = whatsAppUrl(view.phone!, msg);
                            void openExternalLink(url, t("external_link.whatsapp"));
                          }}
                        >
                          <Feather name="message-circle" size={14} color="white" />
                          <Text style={styles.waBtnTxt}>
                            {t("contact.whatsapp")}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={styles.callBtn}
                          onPress={() => {
                            const url = telUrl(view.phone!);
                            void openExternalLink(url, t("external_link.phone"));
                          }}
                        >
                          <Feather name="phone-call" size={14} color="#185FA5" />
                          <Text style={styles.callBtnTxt}>
                            {t("contact.call")}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.contactSubMuted}>
                    {t("contact.no_phone")}
                  </Text>
                )}
              </View>
            ) : !isOwnerMode ? (
              <View style={styles.contactBlockLocked}>
                <Feather name="lock" size={14} color="#854F0B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLockedTitle}>
                    {t("contact.locked_title")}
                  </Text>
                  <Text style={styles.contactLockedMsg}>
                    {t("contact.locked_msg_venue")}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {isOwnerMode ? (
            <View style={styles.ownerButtons}>
              <Pressable
                style={[styles.ownerButton, styles.ownerButtonPrimary]}
                onPress={() => router.push("/worker-bonus?mode=edit")}
              >
                <Feather name="edit-2" size={18} color="white" />
                <Text style={styles.ownerButtonText}>{t("candidate_actions.edit")}</Text>
              </Pressable>
              <Pressable
                style={[styles.ownerButton, styles.ownerButtonSecondary]}
                onPress={onShare}
              >
                <Feather name="share-2" size={18} color="white" />
                <Text style={styles.ownerButtonText}>{t("candidate_actions.share")}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.interviewActions}>
              {appStatus === "interview_requested" ? (
                <>
                  <View style={styles.interviewSummary}>
                    <Feather name="calendar" size={16} color="#185FA5" />
                    <Text style={styles.interviewSummaryText}>
                      {interviewScheduledAt
                        ? new Date(interviewScheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                        : t("candidate_actions.status_interview_requested")}
                      {interviewLocation ? ` · ${interviewLocation}` : ""}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.outcomeButton}
                    onPress={() => setOutcomeOpen(true)}
                    disabled={updatingStatus}
                  >
                    <Feather name="clipboard" size={19} color="white" />
                    <Text style={styles.primaryActionText}>{t("candidate_actions.update_outcome")}</Text>
                  </Pressable>
                </>
              ) : appStatus === "hired" || appStatus === "declined" ? (
                <>
                  <View style={[styles.finalStatus, appStatus === "hired" ? styles.finalStatusHired : styles.finalStatusDeclined]}>
                    <Feather name={appStatus === "hired" ? "check-circle" : "x-circle"} size={20} color={appStatus === "hired" ? "#3B6D11" : "#993556"} />
                    <Text style={[styles.finalStatusText, { color: appStatus === "hired" ? "#3B6D11" : "#993556" }]}>
                      {t(`candidate_actions.status_${appStatus}`)}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.requestInterviewButton, updatingStatus && styles.actionDisabled]}
                    onPress={() => setPendingAction("interview")}
                    disabled={updatingStatus}
                  >
                    <Feather name="calendar" size={19} color="white" />
                    <Text style={styles.primaryActionText}>{t("candidate_actions.request_another_interview")}</Text>
                  </Pressable>
                </>
              ) : (
                applicationId ? <Pressable
                  style={[styles.requestInterviewButton, updatingStatus && styles.actionDisabled]}
                  onPress={() => setPendingAction("interview")}
                  disabled={updatingStatus}
                >
                  <Feather name="calendar" size={19} color="white" />
                  <Text style={styles.primaryActionText}>{t("candidate_actions.confirm_interview_cta")}</Text>
                </Pressable> : <Pressable
                  style={styles.proInviteButton}
                  onPress={() => setProInviteOpen(true)}
                >
                  <Feather name="star" size={18} color="#F0531C" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.proInviteTitle}>{t("venue_pro.cta")}</Text>
                    <Text style={styles.proInviteText}>{t("venue_pro.sub")}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#46505A" />
                </Pressable>
              )}
            </View>
          )}
        </View>

        {lastAction && (
          <View style={styles.toast}>
            <Text style={styles.toastTxt}>
              {lastAction === "decline" && t("candidate_actions.toast_declined")}
              {lastAction === "star" && t("candidate_actions.toast_star")}
              {lastAction === "interview" && t("candidate_actions.toast_interview")}
              {lastAction === "hire" && t("candidate_actions.toast_hire")}
            </Text>
          </View>
        )}
      </ScrollView>

      <ApplicationActionModal
        action={pendingAction}
        visible={pendingAction !== null}
        loading={updatingStatus}
        venueAddress={venueAddress}
        availableLocationTypes={interviewLocationOptions}
        onCancel={() => setPendingAction(null)}
        onConfirm={(interview) => {
          if (pendingAction) handleAction(pendingAction, interview);
        }}
      />

      <InterviewOutcomeModal
        visible={outcomeOpen}
        loading={updatingStatus}
        onClose={() => setOutcomeOpen(false)}
        onSelect={(outcome: InterviewOutcome) => handleAction(outcome)}
      />
      <ProInvitationModal
        visible={proInviteOpen}
        onClose={() => setProInviteOpen(false)}
        onExplore={() => {
          setProInviteOpen(false);
          router.push("/venue-pro");
        }}
      />
      <ContactPersonModal
        visible={contactApplicantOpen}
        onClose={() => setContactApplicantOpen(false)}
        name={view.firstName}
        phone={view.phoneVisible === false ? undefined : view.phone}
        recipientType="applicant"
      />

      {/* Fullscreen video modal */}
      <Modal
        visible={videoOpen}
        animationType="fade"
        onRequestClose={() => setVideoOpen(false)}
      >
        <View style={styles.videoModal}>
          {view.videoUrl ? (
            <VideoView
              style={styles.videoPlayer}
              player={player}
              allowsFullscreen
              contentFit="contain"
              nativeControls
            />
          ) : null}
          <Pressable
            style={styles.videoCloseBtn}
            onPress={() => setVideoOpen(false)}
            hitSlop={12}
          >
            <Feather name="x" size={24} color="white" />
          </Pressable>
        </View>
      </Modal>
      {isOwnerMode ? (
        <AppBottomNav role="worker" active="profile" />
      ) : (
        <AppBottomNav role="venue" active={incomingAppId ? "inbox" : "home"} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  scrollWrap: { flex: 1 },
  scroll: { padding: 12, paddingBottom: 32 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerSide: { flexDirection: "row", alignItems: "center", gap: 4 },
  backBtn: { paddingVertical: 2, paddingRight: 4 },
  counter: { fontSize: 13, color: "#6B7280" },
  fullProfileTopLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingLeft: 8,
  },
  fullProfileTopTxt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0E1A24",
  },

  card: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  // Square photo container so portrait selfies show the full face
  // (forehead → chin) instead of being cropped to a horizontal band.
  photoWrap: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: "#0E1A24",
    position: "relative",
  },
  photo: { width: "100%", height: "100%" },
  photoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0E1A24",
  },

  photoDots: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: { backgroundColor: "white" },

  badgeAvail: {
    position: "absolute",
    top: 30,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#3FE38B",
  },
  badgeAvailTxt: { color: "white", fontSize: 12, fontWeight: "600" },

  badgeVideo: {
    position: "absolute",
    bottom: 14,
    left: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  badgeVideoTxt: { color: "white", fontSize: 12, fontWeight: "600" },

  cardBody: { padding: 16 },
  profileKicker: { color: "#F0531C", fontFamily: "DMMono_500Medium", fontSize: 10, letterSpacing: 1.1, marginBottom: 4, textAlign: "center" },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 27,
    fontWeight: "400",
    color: "#0E1A24",
    letterSpacing: 0.5,
    textAlign: "center",
    textTransform: "none",
  },
  nameAge: {
    fontWeight: "400",
    fontSize: 18,
    letterSpacing: 0,
    color: "#6B7280",
    textTransform: "none",
  },
  nameCenterCol: {
    flex: 2,
    alignItems: "center",
  },
  nameAgeLine: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  ageYSuffix: {
    fontSize: 10,
    fontWeight: "400",
    color: "#9CA3AF",
  },
  nameExpLine: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#854F0B",
    textAlign: "center",
  },
  sideTxt: { fontSize: 13, color: "#6B7280" },
  sideLeft: { flex: 1, textAlign: "left" },
  sideRight: { flex: 1, justifyContent: "flex-end" },
  distRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  distance: { fontSize: 13, color: "#6B7280" },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 0,
  },
  infoPanel: { backgroundColor: "#F7F4EE", borderRadius: 14, gap: 8, marginTop: 15, paddingHorizontal: 12, paddingVertical: 11 },
  infoTxt: { fontSize: 14, color: "#0E1A24", fontWeight: "600" },
  primaryJob: { fontSize: 14, fontWeight: "800", color: "#0E1A24" },
  infoEm: { fontWeight: "700", fontSize: 14, color: "#0E1A24" },

  jobsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  jobsLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  jobsCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  jobsRight: { flex: 1 },
  alsoQualified: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 10,
    fontStyle: "italic",
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 6,
  },
  videoRow: { flexDirection: "row", gap: 8 },
  videoBoxBig: {
    flex: 2,
    aspectRatio: 16 / 10,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#0E1A24",
  },
  videoThumb: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  videoEmptyBox: {
    backgroundColor: "#0E1A24",
    justifyContent: "center",
    alignItems: "center",
  },

  // Nationality + work-eligibility chip row
  eligChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginTop: 6,
  },
  eligChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F1EFE8",
  },
  eligChipFlag: { fontSize: 13 },
  eligChipTxt: { fontSize: 11, fontWeight: "700", color: "#0E1A24" },
  eligChipGreen: { backgroundColor: "#EAF3DE" },
  eligChipTxtGreen: { color: "#3B6D11" },
  eligChipAmber: { backgroundColor: "#FAEEDA" },
  eligChipTxtAmber: { color: "#854F0B" },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  videoPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayCircleBig: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  videoDurBig: {
    position: "absolute",
    bottom: 8,
    right: 10,
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  videoRecordedBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#3B6D11",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  videoRecordedTxt: { color: "white", fontSize: 10, fontWeight: "700" },
  proInviteButton: { alignItems: "center", backgroundColor: "#FFF4ED", borderColor: "#F9B28D", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 58, paddingHorizontal: 13 },
  proInviteTitle: { color: "#0E1A24", fontSize: 13, fontWeight: "800" },
  proInviteText: { color: "#6B7280", fontSize: 11, lineHeight: 15, marginTop: 2 },
  actionDisabled: { opacity: 0.6 },

  contactBlock: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.10)",
    gap: 8,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#6B7280",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  contactPhone: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0E1A24",
    marginRight: 6,
  },
  contactBtnRow: {
    flexDirection: "row",
    gap: 6,
    marginLeft: "auto",
  },
  waBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#25D366",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  waBtnTxt: { color: "white", fontWeight: "800", fontSize: 12 },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E6F1FB",
    borderWidth: 1,
    borderColor: "#185FA5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  callBtnTxt: { color: "#185FA5", fontWeight: "800", fontSize: 12 },
  contactSubMuted: { fontSize: 13, color: "#6B7280" },
  contactBlockLocked: {
    marginTop: 14,
    paddingTop: 12,
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.10)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  contactLockedTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#854F0B",
    marginBottom: 2,
  },
  contactLockedMsg: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },

  videoModal: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  videoPlayer: { width: "100%", height: "100%" },
  videoCloseBtn: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoSideCol: {
    flex: 1,
    gap: 6,
  },
  videoBoxSmall: {
    flex: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  videoLocked: { backgroundColor: "#0E1A24" },
  // Owner-mode "Add video" tile — dashed orange box, no PRO lock
  videoAdd: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#F0531C",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  videoAddPlus: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#FFF4EE",
    justifyContent: "center",
    alignItems: "center",
  },
  videoAddTxt: { fontSize: 10, fontWeight: "700", color: "#0E1A24" },
  proPillSm: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#D4A24C",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  proPillTxt: { color: "#0E1A24", fontSize: 8, fontWeight: "800", letterSpacing: 0.6 },

  fullProfileLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  fullProfileTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0E1A24",
  },
  buttonsRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  contactApplicantBtn: { alignItems: "center", backgroundColor: "#F1EFE8", borderColor: "rgba(14,26,36,0.14)", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  contactApplicantBtnTxt: { color: "#0E1A24", fontSize: 12, fontWeight: "800" },
  videoAbsentText: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "700", marginTop: 8 },
  interviewActions: { borderTopColor: "rgba(0,0,0,0.08)", borderTopWidth: 0.5, gap: 9, padding: 12 },
  requestInterviewButton: { alignItems: "center", backgroundColor: "#F0531C", borderRadius: 999, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 54, paddingHorizontal: 18 },
  outcomeButton: { alignItems: "center", backgroundColor: "#0E1A24", borderRadius: 999, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 54, paddingHorizontal: 18 },
  primaryActionText: { color: "white", fontSize: 15, fontWeight: "700" },
  interviewSummary: { alignItems: "flex-start", backgroundColor: "#E6F1FB", borderRadius: 13, flexDirection: "row", gap: 8, padding: 12 },
  interviewSummaryText: { color: "#185FA5", flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  finalStatus: { alignItems: "center", borderRadius: 14, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 54, paddingHorizontal: 14 },
  finalStatusHired: { backgroundColor: "#EAF3DE" },
  finalStatusDeclined: { backgroundColor: "#FCEBEB" },
  finalStatusText: { fontSize: 15, fontWeight: "800" },
  ownerButtons: { borderTopColor: "rgba(0,0,0,0.08)", borderTopWidth: 0.5, gap: 10, padding: 12 },
  ownerButton: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 54, paddingHorizontal: 18, paddingVertical: 15, width: "100%" },
  ownerButtonPrimary: { backgroundColor: "#F0531C" },
  ownerButtonSecondary: { backgroundColor: "#0E1A24" },
  ownerButtonText: { color: "white", fontSize: 15, fontWeight: "700" },
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
  proMicro: {
    position: "absolute",
    top: 5,
    right: 6,
    backgroundColor: "#D4A24C",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  proMicroTxt: { color: "#0E1A24", fontSize: 7, fontWeight: "800", letterSpacing: 0.5 },
  actionLbl: { fontSize: 12, fontWeight: "700", color: "#6B7280" },

  toast: {
    marginTop: 16,
    backgroundColor: "#0E1A24",
    borderRadius: 12,
    padding: 14,
  },
  toastTxt: { color: "#F7F4EE", fontSize: 13, textAlign: "center" },

  upgrade: {
    marginTop: 14,
    backgroundColor: "#FAEEDA",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  upgradeTxt: {
    flex: 1,
    color: "#854F0B",
    fontSize: 12,
    lineHeight: 16,
  },
});
