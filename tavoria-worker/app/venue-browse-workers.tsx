// Venues: browse all workers nearby.
// List view with photo, name, position, city, languages.
// Sorted by match% if the venue has set their preferred interview answers.

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentUserContext, getDiscoverWorkers } from "../lib/db";
import {
  flagFromCode,
  isEligibleToWorkIT,
  WORK_ELIGIBILITY_OPTIONS,
} from "../lib/countries";
import { getVenueProfile } from "../lib/venueProfile";
import { localizeRoles } from "../lib/positions";

type WorkerRow = {
  id: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  video_url?: string;
  positions?: string[];
  languages?: string[];
  city?: string;
  country?: string;
  nationality?: string;
  work_eligibility_it?: string;
  age_range?: string;
  years_exp?: string;
  personality?: string[];
  interview_answers?: Array<{ q_id: string; a_id: string }>;
};

export default function VenueBrowseWorkers() {
  const router = useRouter();
  const venue = getVenueProfile();
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Signed-in = has a real worker or venue row in Supabase
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const c = await getCurrentUserContext();
        setSignedIn(c.hasVenue || c.hasWorker);
      } catch {}
    })();
  }, []);

  // Tap on a worker: if signed in → open profile; otherwise prompt sign up
  const onRowPress = useCallback(
    (workerId: string) => {
      if (signedIn) {
        router.push({ pathname: "/candidate", params: { workerId } });
        return;
      }
      Alert.alert(
        "Sign up to view profiles",
        "Create a venue account in 60 seconds to see full candidate profiles, watch their intro videos, and contact them.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Sign up as a venue",
            onPress: () => router.push("/venue-type"),
          },
        ]
      );
    },
    [signedIn, router]
  );

  const load = useCallback(async () => {
    setErrorMsg(null);
    try {
      const rows = await getDiscoverWorkers();
      setWorkers(rows as WorkerRow[]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Could not load workers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const venueAnswers = (venue?.preferredInterviewAnswers ?? undefined) as
    | Array<{ q_id: string; a_id: string }>
    | undefined;

  // "Eligible to work in Italy" filter — toggled by chip
  const [eligibleOnly, setEligibleOnly] = useState(false);

  // Filter + sort
  const sorted = useMemo(() => {
    let list = workers;
    if (eligibleOnly) {
      list = list.filter((w) =>
        isEligibleToWorkIT(w.work_eligibility_it, w.nationality)
      );
    }
    if (!venueAnswers || venueAnswers.length === 0) return list;
    return [...list].sort((a, b) => {
      const ma = computeMatch(venueAnswers, a.interview_answers)?.pct ?? -1;
      const mb = computeMatch(venueAnswers, b.interview_answers)?.pct ?? -1;
      return mb - ma;
    });
  }, [workers, venueAnswers, eligibleOnly]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
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
        <Text style={styles.h1}>
          <Text style={{ color: "#F0531C" }}>W</Text>orkers nearby
        </Text>
        <Pressable onPress={() => load()} hitSlop={12} style={styles.iconBtn}>
          <Feather name="refresh-cw" size={20} color="#0E1A24" />
        </Pressable>
      </View>

      {venueAnswers && venueAnswers.length > 0 && (
        <View style={styles.matchBanner}>
          <Feather name="target" size={14} color="#F0531C" />
          <Text style={styles.matchBannerTxt}>
            Sorted by match with your ideal-candidate answers
          </Text>
        </View>
      )}

      {!signedIn && (
        <Pressable
          style={styles.gateBanner}
          onPress={() => router.push("/venue-type")}
        >
          <Feather name="lock" size={14} color="#185FA5" />
          <Text style={styles.gateBannerTxt}>
            Sign up as a venue to view full profiles
          </Text>
          <Feather name="chevron-right" size={16} color="#185FA5" />
        </Pressable>
      )}

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setEligibleOnly(!eligibleOnly)}
          style={[
            styles.filterChip,
            eligibleOnly && styles.filterChipOn,
          ]}
        >
          <Text style={styles.filterChipEmoji}>🇮🇹</Text>
          <Text
            style={[
              styles.filterChipTxt,
              eligibleOnly && styles.filterChipTxtOn,
            ]}
          >
            Eligible to work in Italy
          </Text>
        </Pressable>
      </View>

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
        ) : sorted.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="users" size={40} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No workers yet</Text>
            <Text style={styles.emptyTxt}>
              As workers sign up on Tavoria nearby, they&apos;ll appear here.
            </Text>
          </View>
        ) : (
          sorted.map((w) => {
            const m = computeMatch(venueAnswers, w.interview_answers);
            return (
              <Pressable
                key={w.id}
                onPress={() => onRowPress(w.id)}
                style={styles.row}
              >
                {w.photo_url ? (
                  <Image source={{ uri: w.photo_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarEmpty]}>
                    <Feather name="user" size={22} color="#9CA3AF" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    {w.nationality && (
                      <Text style={styles.rowFlag}>
                        {flagFromCode(w.nationality)}
                      </Text>
                    )}
                    <Text style={styles.name} numberOfLines={1}>
                      {[w.first_name, w.last_name]
                        .filter(Boolean)
                        .join(" ") || "Worker"}
                    </Text>
                    {w.video_url && (
                      <Feather name="video" size={13} color="#185FA5" />
                    )}
                  </View>
                  <Text style={styles.meta} numberOfLines={1}>
                    {localizeRoles(w.positions ?? []).slice(0, 2).join(" · ") || "—"}
                  </Text>
                  <View style={styles.meta2Row}>
                    <Feather name="map-pin" size={11} color="#6B7280" />
                    <Text style={styles.meta2Txt}>
                      {[
                        w.city,
                        w.age_range ? `${w.age_range}y` : null,
                        w.years_exp,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </Text>
                    {(w.languages ?? []).length > 0 && (
                      <>
                        <Text style={styles.dot}>·</Text>
                        <Text style={styles.meta2Txt}>
                          {w.languages!.slice(0, 3).join(" ")}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                {m && (
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
                )}
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
  h1: { fontSize: 22, fontWeight: "800", color: "#0E1A24", letterSpacing: -0.4 },

  matchBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFF4EE",
    borderRadius: 999,
  },
  matchBannerTxt: { fontSize: 12, fontWeight: "700", color: "#854F0B" },

  gateBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#E6F1FB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(24,95,165,0.25)",
  },
  gateBannerTxt: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#185FA5",
  },

  // Filter chips row (eligibility, etc.)
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  filterChipOn: {
    backgroundColor: "#EAF3DE",
    borderColor: "#3B6D11",
    borderWidth: 1.5,
  },
  filterChipEmoji: { fontSize: 13 },
  filterChipTxt: { fontSize: 12, fontWeight: "600", color: "#0E1A24" },
  filterChipTxtOn: { color: "#3B6D11", fontWeight: "800" },

  // Flag emoji in row name
  rowFlag: { fontSize: 14 },

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
    width: 56,
    height: 56,
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
  meta: { fontSize: 13, fontWeight: "600", color: "#0E1A24", marginTop: 2 },
  meta2Row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    flexWrap: "wrap",
  },
  meta2Txt: { fontSize: 11, color: "#6B7280" },
  dot: { color: "#9CA3AF", fontSize: 11 },

  matchPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  matchHigh: { backgroundColor: "#EAF3DE" },
  matchMid: { backgroundColor: "#FCF6E8" },
  matchLow: { backgroundColor: "#FCEBEB" },
  matchTxt: { fontSize: 11, fontWeight: "800", color: "#0E1A24" },
});
