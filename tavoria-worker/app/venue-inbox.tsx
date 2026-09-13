// Venue inbox — list of all applicants to the current venue user's shifts.
// Tap an item → candidate detail screen (with the real worker data).

import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { countryNameFromCode } from "../lib/countries";
import { getApplicationsForCurrentVenueOwner, updateApplicationStatus } from "../lib/db";
import type { ApplicationStatus } from "../lib/db";
import { t } from "../lib/i18n";
import { getVenueProfile } from "../lib/venueProfile";
import { localizeRoles } from "../lib/positions";
import AppBottomNav from "../components/AppBottomNav";
import ApplicationActionModal, {
  type ApplicationAction,
  type InterviewLocationType,
  type InterviewSchedule,
} from "../components/ApplicationActionModal";
import FilterChips from "../components/FilterChips";
import InterviewOutcomeModal, { type InterviewOutcome } from "../components/InterviewOutcomeModal";
import { FilterBar, ListRow, ListSurface, PageContainer, RefreshIconButton } from "../components/PagePrimitives";
import VenueScreenHeader from "../components/VenueScreenHeader";
import PreviewMedia from "../components/PreviewMedia";
import SheetModal from "../components/SheetModal";
import { TAVORIA } from "../lib/designTokens";

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  message?: string;
  worker_id: string;
  venue_id: string;
  shift_id?: string;
  worker?: {
    id: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
    photo_urls?: (string | null)[];
    video_url?: string;
    video_urls?: (string | null)[];
    positions?: string[];
    languages?: string[];
    city?: string;
    age_range?: string;
    nationality?: string;
    years_exp?: string;
    interview_answers?: Array<{ q_id: string; a_id: string }>;
  };
  shift?: {
    id: string;
    roles?: string[];
    hours_start?: string;
    hours_end?: string;
  };
};

type Filter = "all" | "pending" | "interview" | "hired" | "declined";

function getFilters(): { id: Filter; label: string }[] {
  return [
    { id: "all", label: t("application_filters.all") },
    { id: "pending", label: t("application_filters.new") },
    { id: "interview", label: t("application_filters.interview") },
    { id: "hired", label: t("application_filters.hired") },
    { id: "declined", label: t("application_filters.declined") },
  ];
}

const STATUS_TO_FILTER: Record<string, Filter> = {
  pending: "pending",
  interview_requested: "interview",
  hired: "hired",
  declined: "declined",
  starred: "pending",
};

export default function VenueInbox() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const venueProfile = getVenueProfile();
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [venueAnswers, setVenueAnswers] = useState<
    Array<{ q_id: string; a_id: string }> | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationRow | null>(null);
  const [pendingAction, setPendingAction] = useState<ApplicationAction | null>(null);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const load = async () => {
    setErrorMsg(null);
    try {
      const rows = await getApplicationsForCurrentVenueOwner();
      setApps(rows as unknown as ApplicationRow[]);
      // pull venue's preferred answers from local profile (or first row's venue)
      setVenueAnswers(
        (venueProfile?.preferredInterviewAnswers ?? undefined) as any
      );
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Could not load applicants.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const filtered =
    filter === "all"
      ? apps
      : apps.filter((a) => STATUS_TO_FILTER[a.status] === filter);

  const counts: Record<Filter, number> = {
    all: apps.length,
    pending: apps.filter((a) => STATUS_TO_FILTER[a.status] === "pending").length,
    interview: apps.filter((a) => STATUS_TO_FILTER[a.status] === "interview")
      .length,
    hired: apps.filter((a) => STATUS_TO_FILTER[a.status] === "hired").length,
    declined: apps.filter((a) => STATUS_TO_FILTER[a.status] === "declined")
      .length,
  };
  const filters = getFilters();
  const updateSelectedStatus = (status: ApplicationStatus) => {
    setApps((current) => current.map((item) => item.id === selectedApplication?.id ? { ...item, status } : item));
    setSelectedApplication((current) => current ? { ...current, status } : current);
  };
  const confirmAction = async (action: ApplicationAction, interview?: InterviewSchedule) => {
    if (!selectedApplication) return;
    const statusMap: Record<ApplicationAction, ApplicationStatus> = {
      decline: "declined",
      star: "starred",
      interview: "interview_requested",
      hire: "hired",
    };
    setActionBusy(true);
    try {
      await updateApplicationStatus(selectedApplication.id, statusMap[action], interview);
      updateSelectedStatus(statusMap[action]);
      setPendingAction(null);
      setOutcomeOpen(false);
    } catch (error: any) {
      Alert.alert(t("candidate_actions.save_error_title"), error?.message ?? t("candidate_actions.save_error_body"));
    } finally {
      setActionBusy(false);
    }
  };
  const preview = selectedApplication ? (
    <ApplicationPreview
      application={selectedApplication}
      desktop={isDesktop}
      onClose={() => setSelectedApplication(null)}
      onOpen={() => {
        const applicationId = selectedApplication.id;
        setSelectedApplication(null);
        router.push({ pathname: "/candidate", params: { applicationId } });
      }}
      busy={actionBusy}
      onPrimaryAction={() => {
        if (selectedApplication.status === "interview_requested") {
          setOutcomeOpen(true);
        } else {
          setPendingAction("interview");
        }
      }}
      onSecondaryAction={(action) => setPendingAction(action)}
    />
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={[styles.workspace, isDesktop && styles.workspaceDesktop]}>
        <View style={[styles.mainColumn, isDesktop && styles.mainColumnDesktop]}>
          <PageContainer style={styles.content}>
            <VenueScreenHeader
              title={t("home_in.inbox")}
              active="inbox"
            />
          </PageContainer>
          <FilterBar
            trailing={!loading ? (
              <RefreshIconButton
                label={t("talent.retry")}
                loading={refreshing}
                onPress={() => {
                  setRefreshing(true);
                  void load();
                }}
              />
            ) : null}
          >
            <FilterChips
              options={filters.map((item) => ({ ...item, count: counts[item.id] }))}
              value={filter}
              onChange={setFilter}
              desktop={isDesktop}
              contained
            />
          </FilterBar>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        {loading ? (
          <View style={[styles.loadingWrap, isDesktop && styles.fullWidthState]}>
            <ActivityIndicator color="#F0531C" size="large" />
          </View>
        ) : errorMsg ? (
          <View style={[styles.emptyWrap, isDesktop && styles.fullWidthState]}>
            <Feather name="alert-circle" size={32} color="#993556" />
            <Text style={styles.emptyTxt}>{errorMsg}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyWrap, isDesktop && styles.fullWidthState]}>
            <Feather name="inbox" size={40} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{t("venue_inbox.empty_title")}</Text>
            <Text style={styles.emptyTxt}>
              {filter === "all"
                ? t("venue_inbox.empty_sub")
                : t("venue_inbox.empty_filtered", {
                    filter: filters.find((f) => f.id === filter)?.label,
                  })}
            </Text>
          </View>
        ) : (
          <ListSurface>
            {filtered.map((a, index) => (
            <ListRow
              key={a.id}
              label={[a.worker?.first_name, a.worker?.last_name].filter(Boolean).join(" ") || "Applicant"}
              last={index === filtered.length - 1}
              selected={selectedApplication?.id === a.id}
              onPress={() => setSelectedApplication(a)}
            >
              {a.worker?.photo_url ? (
                <Image
                  source={{ uri: a.worker.photo_url }}
                  style={[styles.avatar, isDesktop && styles.avatarDesktop]}
                />
              ) : (
                <View style={[styles.avatar, isDesktop && styles.avatarDesktop, styles.avatarEmpty]}>
                  <Feather name="user" size={20} color="#9CA3AF" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, isDesktop && styles.nameDesktop]} numberOfLines={1}>
                    {[a.worker?.first_name, a.worker?.last_name]
                      .filter(Boolean)
                      .join(" ") || "Applicant"}
                  </Text>
                  {(a.worker?.video_url || (a.worker?.video_urls ?? []).some(Boolean)) && (
                    <Feather name="video" size={13} color="#185FA5" />
                  )}
                </View>
                <Text style={[styles.meta, isDesktop && styles.metaDesktop]} numberOfLines={1}>
                  {[
                    localizeRoles(a.worker?.positions ?? []).slice(0, 2).join(" · "),
                    a.worker?.city,
                    a.worker?.age_range ? `${a.worker.age_range}y` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                <Text style={[styles.time, isDesktop && styles.timeDesktop]}>{formatWhen(a.created_at)}</Text>
              </View>
              <View style={styles.rightCol}>
                {(() => {
                  const m = computeMatch(
                    venueAnswers,
                    a.worker?.interview_answers
                  );
                  return m ? (
                    <View
                      style={[
                        styles.matchPill,
                        m.pct >= 70
                          ? styles.matchHigh
                          : m.pct >= 40
                          ? styles.matchMid
                          : styles.matchLow,
                      ]}
                    >
                      <Text style={styles.matchTxt}>{m.pct}%</Text>
                    </View>
                  ) : null;
                })()}
                <View style={[styles.statusPill, statusStyle(a.status)]}>
                  <Text style={[styles.statusTxt, statusTxtStyle(a.status)]}>
                    {statusLabel(a.status)}
                  </Text>
                </View>
              </View>
            </ListRow>
            ))}
          </ListSurface>
        )}
      </ScrollView>
        </View>
        {isDesktop ? preview : null}
      </View>
      <AppBottomNav role="venue" active="inbox" />
      {!isDesktop ? preview : null}
      <ApplicationActionModal
        action={pendingAction}
        visible={pendingAction !== null}
        loading={actionBusy}
        venueAddress={venueProfile?.address}
        availableLocationTypes={venueProfile?.interviewLocationOptions as InterviewLocationType[] | undefined}
        onCancel={() => setPendingAction(null)}
        onConfirm={(interview) => {
          if (pendingAction) void confirmAction(pendingAction, interview);
        }}
      />
      <InterviewOutcomeModal
        visible={outcomeOpen}
        loading={actionBusy}
        onClose={() => setOutcomeOpen(false)}
        onSelect={(outcome: InterviewOutcome) => void confirmAction(outcome)}
      />
    </SafeAreaView>
  );
}

// ----- helpers -----

function formatWhen(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

function computeMatch(
  preferred?: Array<{ q_id: string; a_id: string }>,
  worker?: Array<{ q_id: string; a_id: string }>
): { matches: number; total: number; pct: number } | null {
  if (!preferred || preferred.length === 0) return null;
  if (!worker || worker.length === 0) return null;
  const m = new Map(worker.map((a) => [a.q_id, a.a_id]));
  let matches = 0;
  let total = 0;
  for (const p of preferred) {
    const w = m.get(p.q_id);
    if (w !== undefined) {
      total++;
      if (w === p.a_id) matches++;
    }
  }
  if (total === 0) return null;
  return { matches, total, pct: Math.round((matches / total) * 100) };
}

function statusStyle(s: string) {
  if (s === "hired") return { backgroundColor: "#EAF3DE" };
  if (s === "interview_requested") return { backgroundColor: "#E6F1FB" };
  if (s === "declined") return { backgroundColor: "#FCEBEB" };
  if (s === "starred") return { backgroundColor: "#FCF6E8" };
  return { backgroundColor: "#F1EFE8" };
}
function statusTxtStyle(s: string) {
  if (s === "hired") return { color: "#3B6D11" };
  if (s === "interview_requested") return { color: "#185FA5" };
  if (s === "declined") return { color: "#993556" };
  if (s === "starred") return { color: "#854F0B" };
  return { color: "#6B7280" };
}

function statusLabel(s: string) {
  const labels: Record<string, string> = {
    pending: t("candidate_actions.status_pending"),
    starred: t("candidate_actions.status_starred"),
    interview_requested: t("candidate_actions.status_interview_requested"),
    hired: t("candidate_actions.status_hired"),
    declined: t("candidate_actions.status_declined"),
  };
  return labels[s] ?? s.replace("_", " ");
}

function ApplicationPreview({
  application,
  desktop,
  onClose,
  onOpen,
  busy,
  onPrimaryAction,
  onSecondaryAction,
}: {
  application: ApplicationRow;
  desktop: boolean;
  onClose: () => void;
  onOpen: () => void;
  busy: boolean;
  onPrimaryAction: () => void;
  onSecondaryAction: (action: ApplicationAction) => void;
}) {
  const worker = application.worker;
  if (!worker) return null;

  const name = [worker.first_name, worker.last_name].filter(Boolean).join(" ") || "Applicant";
  const photos = [worker.photo_url ?? null, ...(worker.photo_urls ?? [])];
  const videos = [worker.video_url ?? null, ...(worker.video_urls ?? [])];
  const roles = localizeRoles(worker.positions ?? []).join(" · ");
  const meta = [
    worker.city,
    worker.age_range,
    worker.nationality ? countryNameFromCode(worker.nationality) : null,
    worker.years_exp,
  ].filter(Boolean).join(" · ");
  const shiftTitle = localizeRoles(application.shift?.roles ?? []).join(" · ");
  const shiftHours = [application.shift?.hours_start, application.shift?.hours_end]
    .filter(Boolean)
    .map((value) => value?.slice(0, 5))
    .join(" – ");
  const primaryLabel = application.status === "interview_requested"
    ? t("candidate_actions.update_outcome")
    : application.status === "hired" || application.status === "declined"
    ? t("candidate_actions.request_another_interview")
    : t("contact_modal.contact_applicant");
  const primaryIcon = application.status === "interview_requested"
    ? "clipboard"
    : application.status === "hired" || application.status === "declined"
    ? "calendar"
    : "message-circle";

  return (
    <SheetModal
      visible
      desktop={desktop}
      onClose={onClose}
      title={name}
      headerAction={
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t("candidate_actions.view_full_profile")}
          hitSlop={6}
          onPress={onOpen}
          style={styles.previewHeaderLink}
        >
          <Text style={styles.previewHeaderLinkText}>{t("candidate_actions.view_full_profile")}</Text>
          <Feather name="arrow-up-right" size={14} color={TAVORIA.color.orange} />
        </Pressable>
      }
    >
      <PreviewMedia
        photos={photos}
        videos={videos}
        placeholder={
          <View style={[styles.previewPhoto, styles.previewPlaceholder]}>
            <Text style={styles.previewInitial}>{name.charAt(0)}</Text>
          </View>
        }
      />
      {roles ? <Text style={styles.previewRoles}>{roles}</Text> : null}
      {meta ? <Text style={styles.previewMeta}>{meta}</Text> : null}
      {shiftTitle || shiftHours ? (
        <View style={styles.previewShift}>
          <View style={styles.previewShiftIcon}>
            <Feather name="briefcase" size={16} color={TAVORIA.color.orange} />
          </View>
          <View style={styles.previewShiftCopy}>
            <Text style={styles.previewShiftLabel}>{t("home_in.my_shifts")}</Text>
            {shiftTitle ? <Text style={styles.previewShiftTitle}>{shiftTitle}</Text> : null}
            {shiftHours ? <Text style={styles.previewShiftMeta}>{shiftHours}</Text> : null}
          </View>
        </View>
      ) : null}
      {application.message ? <Text style={styles.previewMessage}>{application.message}</Text> : null}
      <View style={[styles.previewStatus, statusStyle(application.status)]}>
        <Text style={[styles.previewStatusText, statusTxtStyle(application.status)]}>
          {statusLabel(application.status)}
        </Text>
      </View>
      <View style={styles.previewActions}>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={onPrimaryAction}
          style={[styles.previewPrimary, busy && styles.previewActionDisabled]}
        >
          {busy ? <ActivityIndicator color={TAVORIA.color.paper} size="small" /> : <Feather name={primaryIcon as keyof typeof Feather.glyphMap} size={17} color={TAVORIA.color.paper} />}
          <Text style={styles.previewPrimaryText}>{primaryLabel}</Text>
        </Pressable>
        {application.status === "pending" ? (
          <View style={styles.previewSecondaryActions}>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => onSecondaryAction("star")}
              style={styles.previewSecondary}
            >
              <Feather name="star" size={15} color="#854F0B" />
              <Text style={styles.previewSecondaryText}>{t("candidate_actions.star")}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => onSecondaryAction("decline")}
              style={styles.previewSecondary}
            >
              <Feather name="x-circle" size={15} color="#993556" />
              <Text style={[styles.previewSecondaryText, styles.previewDeclineText]}>{t("candidate_actions.decline")}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TAVORIA.color.paperDeep },
  workspace: { flex: 1, minHeight: 0 },
  workspaceDesktop: { flexDirection: "row", marginVertical: -TAVORIA.space.lg },
  mainColumn: { flex: 1, minWidth: 0 },
  mainColumnDesktop: { paddingVertical: TAVORIA.space.lg },
  content: { paddingTop: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerDesktop: { paddingHorizontal: 24 },
  iconBtn: { padding: 4, width: 32 },
  h1: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 22,
    fontWeight: "400",
    color: "#0E1A24",
    letterSpacing: -0.4,
  },

  scroll: { paddingHorizontal: 16, paddingBottom: 20 },
  scrollDesktop: { alignSelf: "center", maxWidth: 1180, paddingHorizontal: 24, width: "100%" },
  filterBar: { alignSelf: "center", maxWidth: 1180, paddingHorizontal: 14, width: "100%" },
  filterBarDesktop: { paddingHorizontal: 24 },
  desktopGrid: { backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, overflow: "hidden" },

  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  fullWidthState: { width: "100%" },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: "InstrumentSerif_400Regular", fontSize: 16, fontWeight: "400", color: "#0E1A24", marginTop: 8 },
  emptyTxt: { color: "#6B7280", fontSize: 13, textAlign: "center" },

  avatar: {
    width: 64,
    height: 72,
    borderRadius: TAVORIA.radius.medium,
    backgroundColor: "#0E1A24",
  },
  avatarEmpty: {
    backgroundColor: "#E5E5E0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarDesktop: { height: 72, width: 64 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: {
    fontSize: 17, fontWeight: "700", color: "#0E1A24", flexShrink: 1 },
  nameDesktop: { fontSize: 17 },
  meta: { fontSize: 13, color: "#6B7280", marginTop: 3 },
  metaDesktop: { fontSize: 13 },
  time: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  timeDesktop: { fontSize: 12 },

  rightCol: { alignItems: "flex-end", gap: 4 },
  matchPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  matchHigh: { backgroundColor: "#EAF3DE" },
  matchMid: { backgroundColor: "#FCF6E8" },
  matchLow: { backgroundColor: "#FCEBEB" },
  matchTxt: { fontSize: 11, fontWeight: "800", color: "#0E1A24" },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusTxt: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewHeaderLink: { alignItems: "center", flexDirection: "row", gap: 4, minHeight: 36, paddingHorizontal: 4 },
  previewHeaderLinkText: { color: TAVORIA.color.orange, fontSize: 11, fontWeight: "800" },
  previewPhoto: { backgroundColor: "#E8E5DB", borderRadius: TAVORIA.radius.medium, height: 220, width: "100%" },
  previewPlaceholder: { alignItems: "center", justifyContent: "center" },
  previewInitial: { color: TAVORIA.color.orange, fontFamily: "InstrumentSerif_400Regular", fontSize: 54 },
  previewRoles: { color: TAVORIA.color.navy, fontSize: 17, fontWeight: "700", marginTop: 2 },
  previewMeta: { color: TAVORIA.color.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  previewShift: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, flexDirection: "row", gap: 10, marginTop: 16, padding: 12 },
  previewShiftIcon: { alignItems: "center", backgroundColor: TAVORIA.color.orangeSoft, borderRadius: TAVORIA.radius.small, height: 34, justifyContent: "center", width: 34 },
  previewShiftCopy: { flex: 1, minWidth: 0 },
  previewShiftLabel: { color: TAVORIA.color.muted, fontFamily: "DMMono_500Medium", fontSize: 9, letterSpacing: 0.7, textTransform: "uppercase" },
  previewShiftTitle: { color: TAVORIA.color.navy, fontSize: 14, fontWeight: "800", marginTop: 2 },
  previewShiftMeta: { color: TAVORIA.color.muted, fontSize: 12, marginTop: 2 },
  previewMessage: { color: TAVORIA.color.navy, fontSize: 13, lineHeight: 19, marginTop: 16 },
  previewStatus: { alignSelf: "flex-start", borderRadius: TAVORIA.radius.pill, marginTop: 14, paddingHorizontal: 9, paddingVertical: 5 },
  previewStatusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  previewActions: { gap: 8, marginTop: 16 },
  previewPrimary: { alignItems: "center", backgroundColor: TAVORIA.color.navy, borderRadius: TAVORIA.radius.pill, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 48, paddingHorizontal: 18 },
  previewPrimaryText: { color: TAVORIA.color.paper, fontSize: 14, fontWeight: "800" },
  previewActionDisabled: { opacity: 0.58 },
  previewSecondaryActions: { flexDirection: "row", gap: 8 },
  previewSecondary: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.pill, borderWidth: 1, flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 40, paddingHorizontal: 10 },
  previewSecondaryText: { color: "#854F0B", fontSize: 12, fontWeight: "800" },
  previewDeclineText: { color: "#993556" },
});
