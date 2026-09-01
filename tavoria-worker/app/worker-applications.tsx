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
import { localizeRoles } from "../lib/positions";
import AppBottomNav from "../components/AppBottomNav";
import FilterChips from "../components/FilterChips";

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
      <View style={styles.header}>
        {isDesktop ? <View style={styles.iconBtn} /> : (
          <Pressable
            onPress={() => {
              if (router.canGoBack()) { router.back(); return; }
              router.replace("/");
            }}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Feather name="chevron-left" size={26} color="#0E1A24" />
          </Pressable>
        )}
        <Text style={styles.h1}>
          <Text style={{ color: "#F0531C" }}>M</Text>y applications
        </Text>
        <Pressable onPress={() => load()} hitSlop={12} style={styles.iconBtn}>
          <Feather name="refresh-cw" size={20} color="#0E1A24" />
        </Pressable>
      </View>

      <FilterChips
        options={filters.map((item) => ({ ...item, count: counts[item.id] }))}
        value={filter}
        onChange={setFilter}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
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
          <View style={isDesktop && styles.desktopGrid}>
            {filtered.map((a) => (
            <ApplicationCard
              key={a.id}
              a={a}
              router={router}
              isDesktop={isDesktop}
              hasUnreadInterview={a.status === "interview_requested" && seenInterviewUpdates[a.id] !== a.updated_at}
              onOpen={() => markInterviewSeen(a.id, a.updated_at)}
            />
            ))}
          </View>
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
  hasUnreadInterview,
  onOpen,
}: {
  a: ApplicationRow;
  router: ReturnType<typeof useRouter>;
  isDesktop: boolean;
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

  const contactUnlocked = a.status === "interview_requested" || a.status === "hired";
  const contactItems = contactUnlocked
    ? [
        v?.contact_email_enabled !== false ? v?.email : undefined,
        v?.contact_phone_enabled !== false ? v?.phone : undefined,
        v?.contact_in_person_enabled === true ? "Visit in person" : undefined,
      ].filter(Boolean)
    : [];

  const payStr =
    s?.pay_amount && s?.pay_unit
      ? `€${s.pay_amount}/${shortUnit(s.pay_unit)}`
      : null;
  const roleStr = s
    ? localizeRoles(s.roles ?? []).slice(0, 2).join(" · ") || "Shift"
    : t("candidate_actions.direct_interview_invitation");

  return (
    <View style={[styles.rowWrap, isDesktop && styles.rowWrapDesktop]}>
      <Pressable
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
        style={[styles.row, hasUnreadInterview && styles.rowInterviewUpdate]}
      >
        <Image source={photo} style={styles.thumb} resizeMode="cover" />
        <View style={{ flex: 1 }}>
          <View style={styles.line1}>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                const venueId = v?.id ?? a.venue_id;
                if (venueId) router.push({ pathname: "/venue-board", params: { venueId } });
              }}
              style={styles.venueNameLink}
            >
              <Text style={styles.venueName} numberOfLines={1}>
                {v?.name || "Venue"}
              </Text>
              <Feather name="arrow-up-right" size={14} color="#185FA5" />
            </Pressable>
            {payStr && <Text style={styles.pay}>{payStr}</Text>}
          </View>
          <Text style={styles.role} numberOfLines={1}>
            {roleStr}
          </Text>
          <View style={styles.line3}>
            <StatusPill status={a.status} />
            <Text style={styles.timeTxt}>· {formatWhen(a.created_at)}</Text>
          </View>
          {a.status === "interview_requested" ? (
            <View style={styles.interviewSchedule}>
              <Feather name="calendar" size={14} color="#C2410C" />
              <Text style={styles.interviewScheduleText}>
                {a.interview_scheduled_at
                  ? new Date(a.interview_scheduled_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                  : t("candidate_actions.status_interview_requested_detail")}
                {a.interview_location ? ` · ${a.interview_location}` : ""}
              </Text>
            </View>
          ) : (
            <Text style={styles.statusDetail}>{statusCopy(a.status).detail}</Text>
          )}
          <View style={[styles.contactPreview, contactUnlocked ? styles.contactPreviewOpen : styles.contactPreviewLocked]}>
            <Feather name={contactUnlocked ? "unlock" : "lock"} size={12} color={contactUnlocked ? "#C2410C" : "#854F0B"} />
            <Text style={styles.contactPreviewText} numberOfLines={1}>
              {contactUnlocked
                ? contactItems.length > 0
                  ? contactItems.join(" / ")
                  : "No contact method enabled"
                : "Contact details unlock after an interview request"}
            </Text>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color="#9CA3AF" />
      </Pressable>

    </View>
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
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
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
  h1: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 22,
    fontWeight: "400",
    color: "#0E1A24",
    letterSpacing: -0.4,
  },

  scroll: { paddingHorizontal: 14, paddingBottom: 20 },
  scrollDesktop: { paddingHorizontal: 24 },
  desktopGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
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

  rowWrap: { marginBottom: 8 },
  rowWrapDesktop: { marginBottom: 0, width: "48.8%" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  rowInterviewUpdate: { backgroundColor: "#FFAB7D", borderColor: "#F0531C", borderWidth: 2 },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#E5E5E0",
  },
  line1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  venueName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.2,
  },
  venueNameLink: { alignItems: "center", flex: 1, flexDirection: "row", gap: 4, minWidth: 0 },
  pay: { fontSize: 14, fontWeight: "900", color: "#F0531C" },
  role: {
    fontFamily: "InstrumentSerif_400Regular", fontSize: 13, fontWeight: "400", color: "#6B7280", marginTop: 3 },
  line3: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  timeTxt: { fontSize: 11, color: "#9CA3AF" },
  statusDetail: { color: "#6B7280", fontSize: 11, lineHeight: 15, marginTop: 5 },
  interviewSchedule: { alignItems: "flex-start", backgroundColor: "#FFE3D1", borderRadius: 9, flexDirection: "row", gap: 6, marginTop: 7, paddingHorizontal: 8, paddingVertical: 7 },
  interviewScheduleText: { color: "#9A3412", flex: 1, fontSize: 11, fontWeight: "700", lineHeight: 15 },
  contactPreview: { alignItems: "center", alignSelf: "flex-start", borderRadius: 8, flexDirection: "row", gap: 5, marginTop: 7, maxWidth: "100%", paddingHorizontal: 7, paddingVertical: 5 },
  contactPreviewOpen: { backgroundColor: "#FFE3D1" },
  contactPreviewLocked: { backgroundColor: "#F1EFE8" },
  contactPreviewText: { color: "#5D6670", fontSize: 10, lineHeight: 14 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusTxt: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
