import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ApplicationStatus,
  getApplicationById,
  getCurrentVenueRow,
  getCurrentWorkerFull,
  getWorkerById,
  requestDirectInterview,
  updateApplicationStatus,
} from "../lib/db";
import { t } from "../lib/i18n";
import { getWorkerProfile } from "../lib/workerProfile";
import AppBottomNav from "../components/AppBottomNav";
import ApplicationActionModal, {
  type ApplicationAction,
  type InterviewSchedule,
} from "../components/ApplicationActionModal";
import InterviewOutcomeModal, { type InterviewOutcome } from "../components/InterviewOutcomeModal";
import ContactPersonModal from "../components/ContactPersonModal";
import StickyFooter from "../components/StickyFooter";
import WorkerProfileContent from "../components/WorkerProfileContent";
import WorkerScreenHeader from "../components/WorkerScreenHeader";
import VenueScreenHeader from "../components/VenueScreenHeader";
import { talentStyles } from "../components/TalentFields";

export default function Candidate() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const params = useLocalSearchParams<{ applicationId?: string; workerId?: string }>();
  const incomingAppId = params.applicationId;
  const incomingWorkerId = params.workerId;
  const isOwnerMode = !incomingAppId && !incomingWorkerId;
  const localWorker = getWorkerProfile();

  const [remoteWorker, setRemoteWorker] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [venueAddress, setVenueAddress] = useState("");
  const [venueName, setVenueName] = useState("");
  const [locationOptions, setLocationOptions] = useState<("venue" | "phone" | "video" | "other")[]>(["venue", "phone", "video"]);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [interviewLocation, setInterviewLocation] = useState("");
  const [pendingAction, setPendingAction] = useState<ApplicationAction | null>(null);
  const [lastAction, setLastAction] = useState<ApplicationAction | null>(null);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [directApplicationId, setDirectApplicationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        if (incomingAppId) {
          const app = await getApplicationById(incomingAppId);
          if (!app?.worker) throw new Error(t("talent.loadError"));
          if (!active) return;
          setRemoteWorker(app.worker);
          setAppStatus(app.status ?? null);
          const venue = (app as any).venue;
          setVenueName(venue?.name ?? "");
          setVenueAddress(venue?.address ?? "");
          if (Array.isArray(venue?.interview_location_options) && venue.interview_location_options.length) setLocationOptions(venue.interview_location_options);
          setScheduledAt((app as any).interview_scheduled_at ?? null);
          setInterviewLocation((app as any).interview_location ?? "");
        } else if (incomingWorkerId) {
          const worker = await getWorkerById(incomingWorkerId);
          if (!worker) throw new Error(t("talent.loadError"));
          if (active) setRemoteWorker(worker);
        } else {
          const worker = await getCurrentWorkerFull();
          if (worker && active) setRemoteWorker(worker);
        }
      } catch (e: any) {
        if (active) setError(e?.message ?? t("talent.loadError"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [incomingAppId, incomingWorkerId]));

  useFocusEffect(useCallback(() => {
    if (!incomingWorkerId || incomingAppId) return;
    getCurrentVenueRow().then(venue => {
      if (!venue) return;
      setVenueAddress(venue.address ?? "");
      if (Array.isArray(venue.interview_location_options) && venue.interview_location_options.length) setLocationOptions(venue.interview_location_options);
    }).catch(() => {});
  }, [incomingAppId, incomingWorkerId]));

  const currentApplicationId = incomingAppId ?? directApplicationId;
  const row = remoteWorker ?? (localWorker ? {
    first_name: localWorker.firstName,
    last_name: localWorker.lastName,
    age_range: localWorker.ageRange,
    city: localWorker.city,
    country: localWorker.country,
    nationality: localWorker.nationality,
    positions: localWorker.positions,
    languages: localWorker.languages,
    photo_url: localWorker.photoUrl,
    video_url: localWorker.videoUrl,
    photo_urls: localWorker.photoUrls,
    video_urls: localWorker.videoUrls,
    years_exp: localWorker.yearsExperience,
    job_preferences: localWorker.jobPreferences,
    phone: localWorker.phone,
    phone_visible: localWorker.phoneVisible,
  } : null);

  const confirmAction = async (action: ApplicationAction, interview?: InterviewSchedule) => {
    const statusMap: Record<ApplicationAction, ApplicationStatus> = {
      decline: "declined", star: "starred", interview: "interview_requested", hire: "hired",
    };
    setBusy(true);
    try {
      let applicationId = currentApplicationId;
      if (!applicationId) {
        if (action !== "interview" || !interview || !row?.id) throw new Error("This worker cannot receive an interview request yet.");
        const venue = await getCurrentVenueRow();
        if (!venue?.id) throw new Error("Your venue could not be found. Please sign in again.");
        const invitation = await requestDirectInterview({ workerId: row.id, venueId: venue.id, scheduledAt: interview.scheduledAt, location: interview.location });
        applicationId = invitation.id;
        setDirectApplicationId(invitation.id);
      } else {
        await updateApplicationStatus(applicationId, statusMap[action], interview);
      }
      setAppStatus(statusMap[action]);
      setLastAction(action);
      if (interview) { setScheduledAt(interview.scheduledAt); setInterviewLocation(interview.location); }
      setPendingAction(null);
      setOutcomeOpen(false);
    } catch (e: any) {
      Alert.alert(t("candidate_actions.save_error_title"), e?.message ?? t("candidate_actions.save_error_body"));
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    try { await Share.share({ message: "Check out my hospitality profile on Tavoria — get hired in minutes, not weeks." }); } catch {}
  };

  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {isOwnerMode ? (
        <WorkerScreenHeader title={t("talent.profile")} active="profile" />
      ) : (
        <VenueScreenHeader title={t("candidate_actions.view_full_profile")} active={incomingAppId ? "inbox" : "candidates"} />
      )}
      <View style={styles.content}>
        {loading ? <ActivityIndicator color="#F0531C" style={{ marginVertical: 50 }} /> : error ? <View style={{ paddingVertical: 36, gap: 12 }}><Text style={talentStyles.error}>{error}</Text><Pressable onPress={() => router.replace("/candidate" as never)}><Text style={styles.link}>{t("talent.retry")}</Text></Pressable></View> : row ? <WorkerProfileContent row={row} owner={isOwnerMode} /> : null}
        {!isOwnerMode && row ? <View style={styles.contact}>
          <Text style={styles.contactTitle}>{t("contact.section_label")}</Text>
          {row.phone && row.phone_visible !== false ? <View style={styles.contactRow}><Feather name="phone" size={16} color="#626760" /><Text style={styles.contactPhone}>{row.phone}</Text><Pressable onPress={() => setContactOpen(true)} style={styles.contactAction}><Text style={styles.contactActionText}>{t("contact_modal.contact_applicant")}</Text></Pressable></View> : <Text style={styles.muted}>{t("contact.no_phone")}</Text>}
        </View> : null}
      </View>
    </ScrollView>

    {!loading && !error ? <StickyFooter desktopRow><View style={[styles.footerActions, isDesktop && styles.footerActionsDesktop]}>{isOwnerMode ? <>
      <Pressable accessibilityRole="button" accessibilityLabel={t("candidate_actions.edit")} onPress={() => router.push("/worker-profile-edit" as never)} style={styles.editButton}><Feather name="edit-2" size={16} color="#0E1A24" /></Pressable>
      <Pressable onPress={onShare} style={styles.secondary}><Feather name="share-2" size={16} color="#626760" /><Text style={styles.secondaryText}>{t("candidate_actions.share")}</Text></Pressable>
    </> : appStatus === "interview_requested" ? <>
      <View style={styles.status}><Feather name="calendar" size={16} color="#526C55" /><Text style={styles.statusText}>{scheduledAt ? new Date(scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : t("candidate_actions.status_interview_requested")}{interviewLocation ? " · " + interviewLocation : ""}</Text></View>
      <Pressable disabled={busy} onPress={() => setOutcomeOpen(true)} style={styles.primary}><Feather name="clipboard" size={16} color="#FFF" /><Text style={styles.primaryText}>{t("candidate_actions.update_outcome")}</Text></Pressable>
    </> : <Pressable disabled={busy} onPress={() => setPendingAction("interview")} style={[styles.primary, busy && { opacity: 0.5 }]}><Feather name="calendar" size={16} color="#FFF" /><Text style={styles.primaryText}>{appStatus === "hired" || appStatus === "declined" ? t("candidate_actions.request_another_interview") : t("candidate_actions.confirm_interview_cta")}</Text></Pressable>}</View></StickyFooter> : null}

    {lastAction ? <View style={styles.toast}><Text style={styles.toastText}>{t("candidate_actions.toast_" + (lastAction === "decline" ? "declined" : lastAction))}</Text></View> : null}
    <ApplicationActionModal action={pendingAction} visible={pendingAction !== null} loading={busy} venueAddress={venueAddress} availableLocationTypes={locationOptions} onCancel={() => setPendingAction(null)} onConfirm={interview => { if (pendingAction) void confirmAction(pendingAction, interview); }} />
    <InterviewOutcomeModal visible={outcomeOpen} loading={busy} onClose={() => setOutcomeOpen(false)} onSelect={outcome => void confirmAction(outcome as InterviewOutcome)} />
    <ContactPersonModal visible={contactOpen} onClose={() => setContactOpen(false)} name={row?.first_name ?? ""} phone={row?.phone_visible === false ? undefined : row?.phone} recipientType="applicant" />
    {isOwnerMode ? <AppBottomNav role="worker" active="profile" /> : <AppBottomNav role="venue" active="home" />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  scroll: { width: "100%", maxWidth: 960, alignSelf: "center", paddingHorizontal: 24, paddingBottom: 32 },
  content: { width: "100%" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56, width: "100%", maxWidth: 960, alignSelf: "center", paddingHorizontal: 24 },
  headerDesktop: { paddingTop: 8 },
  back: { width: 36, height: 36, alignItems: "flex-start", justifyContent: "center" },
  headerSpace: { width: 36 },
  headerTitle: { color: "#626B78", fontSize: 13 },
  link: { color: "#185FA5", fontWeight: "600" },
  contact: { borderTopWidth: 1, borderTopColor: "rgba(14,26,36,0.12)", paddingVertical: 22, gap: 12 },
  contactTitle: { color: "#0E1A24", fontSize: 15, fontWeight: "600" },
  contactRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  contactPhone: { color: "#30382F", fontSize: 14 },
  contactAction: { paddingVertical: 7, paddingHorizontal: 10 },
  contactActionText: { color: "#185FA5", fontSize: 13, fontWeight: "600" },
  muted: { color: "#626B78", fontSize: 14 },
  footerActions: { alignItems: "center", gap: 10, width: "100%" },
  footerActionsDesktop: { flexDirection: "row-reverse", justifyContent: "center", width: "auto" },
  primary: { height: 44, minHeight: 44, maxHeight: 44, flexShrink: 0, paddingHorizontal: 20, borderRadius: 22, backgroundColor: "#F0531C", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  secondary: { height: 44, minHeight: 44, maxHeight: 44, flexShrink: 0, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: "rgba(14,26,36,0.16)", backgroundColor: "#FFF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryText: { color: "#0E1A24", fontSize: 14, fontWeight: "600" },
  editButton: { alignItems: "center", backgroundColor: "#FFF", borderColor: "rgba(14,26,36,0.16)", borderRadius: 22, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  status: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8 },
  statusText: { color: "#526C55", fontSize: 13 },
  toast: { position: "absolute", top: 70, alignSelf: "center", backgroundColor: "#202421", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6 },
  toastText: { color: "#FFF", fontSize: 13 },
});
