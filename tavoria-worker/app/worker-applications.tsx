// Worker's "My applications" — list of shifts I applied to, with venue response status.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { getApplicationsForCurrentWorker } from "../lib/db";
import { t } from "../lib/i18n";
import { formatLocalizedDate } from "../lib/dateFormat";
import { localizeRoles } from "../lib/positions";
import AppBottomNav from "../components/AppBottomNav";
import FilterChips from "../components/FilterChips";
import { FilterBar, ListRow, ListSurface, PageContainer, RefreshIconButton } from "../components/PagePrimitives";
import WorkerScreenHeader from "../components/WorkerScreenHeader";
import { TAVORIA } from "../lib/designTokens";

const WORKER_LAST_SEEN_KEY = "gigi.worker.apps_last_seen";
const WORKER_SEEN_INTERVIEW_UPDATES_KEY = "gigi.worker.seen_interview_application_updates";

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  updated_at?: string;
  interview_scheduled_at?: string;
  interview_location?: string;
  venue_id: string;
  shift_id?: string;
  venue?: {
    id: string;
    name: string;
    type?: string;
    city?: string;
    photo_url?: string;
    venue_style?: string;
    address?: string;
    email?: string;
    phone?: string;
    contact_email_enabled?: boolean;
    contact_phone_enabled?: boolean;
    contact_in_person_enabled?: boolean;
  };
  shift?: {
    id: string;
    roles?: string[];
    hours_start?: string;
    hours_end?: string;
    pay_amount?: number;
    pay_unit?: string;
    start_when?: string;
    start_date?: string;
  };
};

const VENUE_CAFE = require("../assets/venue-cafe.png");
const VENUE_TYPE_PHOTOS: Record<string, number> = {
  cafe: VENUE_CAFE,
  bar: require("../assets/venue-bar.png"),
  restaurant: require("../assets/venue-restaurant.png"),
  hotel: require("../assets/venue-hotel.png"),
  club: require("../assets/venue-club.png"),
  beach_club: require("../assets/venue-beach.png"),
};

type Filter = "all" | "waiting" | "interview" | "hired" | "declined";

function getFilters(): { id: Filter; label: string }[] {
  return [
    { id: "all", label: t("application_filters.all") },
    { id: "waiting", label: t("application_filters.waiting") },
    { id: "interview", label: t("application_filters.interview") },
    { id: "hired", label: t("application_filters.hired") },
    { id: "declined", label: t("application_filters.declined") },
  ];
}

const STATUS_TO_FILTER: Record<string, Filter> = {
  pending: "waiting",
  starred: "waiting",
  interview_requested: "interview",
  hired: "hired",
  declined: "declined",
};

export default function WorkerApplications() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [seenInterviewUpdates, setSeenInterviewUpdates] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setErrorMsg(null);
    try {
      const rows = await getApplicationsForCurrentWorker();
      setApps(rows as unknown as ApplicationRow[]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Could not load applications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  useEffect(() => {
    AsyncStorage.getItem(WORKER_SEEN_INTERVIEW_UPDATES_KEY)
      .then((value) => {
        if (!value) return;
        const updates = JSON.parse(value);
        if (updates && typeof updates === "object" && !Array.isArray(updates)) {
          setSeenInterviewUpdates(
            Object.fromEntries(
              Object.entries(updates).filter((entry): entry is [string, string] => typeof entry[1] === "string")
            )
          );
        }
      })
      .catch(() => {});
    // Mark "right now" as last-seen so the red "new" corner badges on the
    // home pills clear when the worker returns.
    AsyncStorage.setItem(WORKER_LAST_SEEN_KEY, new Date().toISOString()).catch(
      () => {}
    );
  }, [load]);

  const markInterviewSeen = useCallback((applicationId: string, updatedAt?: string) => {
    if (!updatedAt) return;
    setSeenInterviewUpdates((current) => {
      if (current[applicationId] === updatedAt) return current;
      const next = { ...current, [applicationId]: updatedAt };
      AsyncStorage.setItem(WORKER_SEEN_INTERVIEW_UPDATES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: apps.length,
      waiting: 0,
      interview: 0,
      hired: 0,
      declined: 0,
    };
    apps.forEach((a) => {
      const f = STATUS_TO_FILTER[a.status];
      if (f && f !== "all") c[f]++;
    });
    return c;
  }, [apps]);

  const filtered =
    filter === "all"
      ? apps
      : apps.filter((a) => STATUS_TO_FILTER[a.status] === filter);
  const filters = getFilters();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <PageContainer>
        <WorkerScreenHeader title={t("home_in.my_applications")} active="applications" />
      </PageContainer>

      <FilterBar
        mobileOpen={filtersOpen}
        mobileActive={filter !== "all"}
        mobileLabel={t("talent.filters")}
        onToggleMobile={() => setFiltersOpen((open) => !open)}
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
            <Feather name="send" size={40} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {filter === "all"
                ? "No applications yet"
                : `No applications in "${
                    filters.find((f) => f.id === filter)?.label
                  }"`}
            </Text>
            {filter === "all" && (
              <>
                <Text style={styles.emptyTxt}>
                  Browse shifts and apply to one — they show up here.
                </Text>
                <Pressable
                  onPress={() => router.replace("/")}
                  style={styles.emptyCta}
                >
                  <Feather name="search" size={16} color="white" />
                  <Text style={styles.emptyCtaTxt}>Browse shifts</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <ListSurface>
            {filtered.map((a, index) => (
            <ApplicationCard
              key={a.id}
              a={a}
              router={router}
              isDesktop={isDesktop}
              last={index === filtered.length - 1}
              hasUnreadInterview={a.status === "interview_requested" && seenInterviewUpdates[a.id] !== a.updated_at}
              onOpen={() => markInterviewSeen(a.id, a.updated_at)}
            />
            ))}
          </ListSurface>
        )}
      </ScrollView>
      <AppBottomNav role="worker" active="applications" />
    </SafeAreaView>
  );
}

function ApplicationCard({
  a,
  router,
  isDesktop,
  last,
  hasUnreadInterview,
  onOpen,
}: {
  a: ApplicationRow;
  router: ReturnType<typeof useRouter>;
  isDesktop: boolean;
  last: boolean;
  hasUnreadInterview: boolean;
  onOpen: () => void;
}) {
  const v = a.venue;
  const s = a.shift;
  const typeKey = (v?.type || "cafe")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace("café", "cafe");
  const photo = v?.photo_url
    ? { uri: v.photo_url }
    : VENUE_TYPE_PHOTOS[typeKey] ?? VENUE_CAFE;

  const payStr =
    s?.pay_amount && s?.pay_unit
      ? `€${s.pay_amount}/${shortUnit(s.pay_unit)}`
      : null;
  const roleStr = s
    ? localizeRoles(s.roles ?? []).slice(0, 2).join(" · ") || t("shift_detail.default_shift")
    : t("candidate_actions.direct_interview_invitation");

  return (
    <ListRow
      label={v?.name || t("shift_detail.default_venue")}
      last={last}
      onPress={() => {
        onOpen();
        if (s?.id) {
          router.push({ pathname: "/shift-detail", params: { id: s.id } });
        } else {
          const venueId = v?.id ?? a.venue_id;
          if (venueId) {
            router.push({ pathname: "/venue-board", params: { venueId } });
          }
        }
      }}
      style={hasUnreadInterview && styles.rowInterviewUpdate}
    >
        <Image source={photo} style={[styles.thumb, isDesktop && styles.thumbDesktop]} resizeMode="cover" />
        <View style={styles.rowBody}>
          <View style={styles.line1}>
            <Text style={[styles.venueName, isDesktop && styles.venueNameDesktop]} numberOfLines={1}>
              {v?.name || t("shift_detail.default_venue")}
            </Text>
            {payStr && <Text style={styles.pay}>{payStr}</Text>}
          </View>
          <Text style={[styles.role, isDesktop && styles.roleDesktop]} numberOfLines={1}>
            {roleStr}
          </Text>
          <View style={styles.line3}>
            <StatusPill status={a.status} />
            <Text style={styles.timeTxt}>· {formatWhen(a.created_at)}</Text>
          </View>
          {a.status === "interview_requested" ? (
            <View style={styles.interviewSchedule}>
              <Feather name="calendar" size={14} color="#626B78" />
              <Text style={styles.interviewScheduleText}>
                {a.interview_scheduled_at
                  ? new Date(a.interview_scheduled_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                  : t("candidate_actions.status_interview_requested_detail")}
                {a.interview_location ? ` · ${a.interview_location}` : ""}
              </Text>
            </View>
          ) : null}
        </View>
        <Feather name="chevron-right" size={18} color="#9CA3AF" />
    </ListRow>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = statusCopy(status);
  return (
    <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusTxt, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

function statusCopy(status: string) {
  const map: Record<string, { bg: string; fg: string; label: string; detail: string }> = {
    pending: {
      bg: "#F1EFE8",
      fg: "#6B7280",
      label: t("candidate_actions.status_pending"),
      detail: t("candidate_actions.status_pending_detail"),
    },
    starred: {
      bg: "#FCF6E8",
      fg: "#854F0B",
      label: t("candidate_actions.status_starred"),
      detail: t("candidate_actions.status_starred_detail"),
    },
    interview_requested: {
      bg: "#E6F1FB",
      fg: "#185FA5",
      label: t("candidate_actions.status_interview_requested"),
      detail: t("candidate_actions.status_interview_requested_detail"),
    },
    hired: {
      bg: "#EAF3DE",
      fg: "#3B6D11",
      label: t("candidate_actions.status_hired"),
      detail: t("candidate_actions.status_hired_detail"),
    },
    declined: {
      bg: "#FCEBEB",
      fg: "#993556",
      label: t("candidate_actions.status_declined"),
      detail: t("candidate_actions.status_declined_detail"),
    },
  };
  return map[status] ?? {
    bg: "#F1EFE8",
    fg: "#6B7280",
    label: status,
    detail: "",
  };
}

function shortUnit(u: string) {
  if (u === "hour") return "h";
  if (u === "day") return "d";
  if (u === "week") return "wk";
  if (u === "month") return "mo";
  return u;
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return t("common.just_now");
  if (diff < 3600) return t("common.minutes_ago", { count: Math.floor(diff / 60) });
  if (diff < 86400) return t("common.hours_ago", { count: Math.floor(diff / 3600) });
  if (diff < 86400 * 7) return t("common.days_ago", { count: Math.floor(diff / 86400) });
  return formatLocalizedDate(d, { day: "numeric", month: "short", year: "numeric" });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TAVORIA.color.paperDeep },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerDesktop: { alignSelf: "center", maxWidth: 1180, paddingHorizontal: 24, width: "100%" },
  iconBtn: { padding: 4, width: 32 },
  h1: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 22,
    fontWeight: "400",
    color: "#0E1A24",
    letterSpacing: -0.4,
  },
  h1Desktop: { fontSize: 29 },

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
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 16,
    fontWeight: "400",
    color: "#0E1A24",
    marginTop: 8,
  },
  emptyTxt: { color: "#6B7280", fontSize: 13, textAlign: "center" },
  emptyCta: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0531C",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyCtaTxt: { color: "white", fontWeight: "800", fontSize: 14 },

  rowInterviewUpdate: { backgroundColor: "#F7F7F2" },
  thumb: {
    width: 64,
    height: 72,
    borderRadius: 14,
    backgroundColor: "#E5E5E0",
  },
  thumbDesktop: { borderRadius: 14, height: 72, width: 64 },
  rowBody: { flex: 1, gap: 5, minWidth: 0 },
  line1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  venueName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.2,
  },
  venueNameDesktop: { fontSize: 17 },
  pay: { fontSize: 14, fontWeight: "900", color: "#F0531C" },
  role: { color: "#303C49", fontSize: 14 },
  roleDesktop: { fontSize: 14 },
  line3: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  timeTxt: { fontSize: 11, color: "#9CA3AF" },
  interviewSchedule: { alignItems: "flex-start", backgroundColor: "#F1EFE8", borderRadius: 9, flexDirection: "row", gap: 6, marginTop: 7, paddingHorizontal: 8, paddingVertical: 7 },
  interviewScheduleText: { color: "#263542", flex: 1, fontSize: 11, fontWeight: "700", lineHeight: 15 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusTxt: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
