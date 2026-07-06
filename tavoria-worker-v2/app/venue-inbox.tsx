// Venue inbox — list of all applicants to the current venue user's shifts.
// Tap an item → candidate detail screen (with the real worker data).

import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApplicationsForCurrentVenueOwner } from "../lib/db";
import { t } from "../lib/i18n";
import { getVenueProfile } from "../lib/venueProfile";
import { localizeRoles } from "../lib/positions";

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
    video_url?: string;
    positions?: string[];
    languages?: string[];
    city?: string;
    age_range?: string;
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

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "New" },
  { id: "interview", label: "Interview" },
  { id: "hired", label: "Hired" },
  { id: "declined", label: "Declined" },
];

const STATUS_TO_FILTER: Record<string, Filter> = {
  pending: "pending",
  interview_requested: "interview",
  hired: "hired",
  declined: "declined",
  starred: "pending",
};

export default function VenueInbox() {
  const router = useRouter();
  const venueProfile = getVenueProfile();
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [venueAnswers, setVenueAnswers] = useState<
    Array<{ q_id: string; a_id: string }> | undefined
  >(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const load = async () => {
    setErrorMsg(null);
    try {
      const rows = await getApplicationsForCurrentVenueOwner();
      setApps(rows as ApplicationRow[]);
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <Text style={styles.h1}>
          <Text style={{ color: "#F0531C" }}>A</Text>pplicants
        </Text>
        <Pressable onPress={() => load()} hitSlop={12} style={styles.iconBtn}>
          <Feather name="refresh-cw" size={20} color="#0E1A24" />
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ flexGrow: 0, maxHeight: 44 }}
      >
        {FILTERS.map((f) => {
          const on = filter === f.id;
          const count = counts[f.id];
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filterChip, on && styles.filterChipOn]}
            >
              <Text
                style={[styles.filterChipTxt, on && styles.filterChipTxtOn]}
              >
                {f.label}{" "}
                <Text
                  style={[
                    styles.filterChipCount,
                    on && styles.filterChipCountOn,
                  ]}
                >
                  ({count})
                </Text>
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
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
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#F0531C" size="large" />
          </View>
        ) : errorMsg ? (
          <View style={styles.emptyWrap}>
            <Feather name="alert-circle" size={32} color="#993556" />
            <Text style={styles.emptyTxt}>{errorMsg}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="inbox" size={40} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No applicants yet</Text>
            <Text style={styles.emptyTxt}>
              {filter === "all"
                ? "When workers apply to your shifts, they'll show up here."
                : `No applicants in "${
                    FILTERS.find((f) => f.id === filter)?.label
                  }".`}
            </Text>
          </View>
        ) : (
          filtered.map((a) => (
            <Pressable
              key={a.id}
              onPress={() =>
                router.push({
                  pathname: "/candidate",
                  params: { applicationId: a.id },
                })
              }
              style={styles.row}
            >
              {a.worker?.photo_url ? (
                <Image
                  source={{ uri: a.worker.photo_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <Feather name="user" size={20} color="#9CA3AF" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {[a.worker?.first_name, a.worker?.last_name]
                      .filter(Boolean)
                      .join(" ") || "Applicant"}
                  </Text>
                  {a.worker?.video_url && (
                    <Feather name="video" size={13} color="#185FA5" />
                  )}
                </View>
                <Text style={styles.meta} numberOfLines={1}>
                  {[
                    localizeRoles(a.worker?.positions ?? []).slice(0, 2).join(" · "),
                    a.worker?.city,
                    a.worker?.age_range ? `${a.worker.age_range}y` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                <Text style={styles.time}>{formatWhen(a.created_at)}</Text>
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
                    {a.status.replace("_", " ")}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
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
    fontSize: 22,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.4,
  },

  filterRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  filterChipOn: {
    backgroundColor: "#0E1A24",
    borderColor: "#0E1A24",
  },
  filterChipTxt: { fontSize: 13, fontWeight: "700", color: "#0E1A24" },
  filterChipTxtOn: { color: "white" },
  filterChipCount: { fontWeight: "500", color: "#9CA3AF" },
  filterChipCountOn: { color: "rgba(255,255,255,0.7)" },

  scroll: { paddingHorizontal: 14, paddingBottom: 20 },

  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0E1A24", marginTop: 8 },
  emptyTxt: { color: "#6B7280", fontSize: 13, textAlign: "center" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: "#0E1A24",
  },
  avatarEmpty: {
    backgroundColor: "#E5E5E0",
    justifyContent: "center",
    alignItems: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "800", color: "#0E1A24", flexShrink: 1 },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  time: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },

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
});
