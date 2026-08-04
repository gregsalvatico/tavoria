// Worker browse — compact list of live shifts.
// Each row shows the 5 things a worker scans for: pay, role, when, distance, vibe.
// Tap a row → full shift detail with Apply button (/shift-detail?id=xxx).

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  getAppliedShiftIdsForCurrentWorker,
  getDiscoverShifts,
  getCurrentUserContext,
} from "../lib/db";
import { t } from "../lib/i18n";
import { localizeRoles } from "../lib/positions";
import FilterChips from "../components/FilterChips";
import {
  matchesShiftTime,
  getShiftTimeFilters,
  type ShiftTimeFilter,
} from "../lib/shiftFilters";

type ShiftRow = {
  id: string;
  roles?: string[];
  contract_type?: string;
  hours_start?: string;
  hours_end?: string;
  pay_amount?: number;
  pay_unit?: string;
  days?: string[];
  start_when?: string;
  start_date?: string;
  created_at: string;
  venue?: {
    id: string;
    name: string;
    type?: string;
    city?: string;
    venue_style?: string;
    photo_url?: string;
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

export default function Discover() {
  const router = useRouter();
  const [rows, setRows] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<ShiftTimeFilter>("all");
  const [hideApplied, setHideApplied] = useState(true);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [hasAccount, setHasAccount] = useState(false);

  const load = useCallback(async () => {
    setErrorMsg(null);
    try {
      const [shifts, applied, account] = await Promise.all([
        getDiscoverShifts(),
        getAppliedShiftIdsForCurrentWorker().catch(() => []),
        getCurrentUserContext().catch(() => ({ hasVenue: false, hasWorker: false })),
      ]);
      setRows(shifts as unknown as ShiftRow[]);
      setAppliedIds(new Set(applied));
      setHasAccount(account.hasVenue || account.hasWorker);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Could not load shifts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = rows;

    // Time / urgency filter
    if (filter !== "all") list = list.filter((row) => matchesShiftTime(row, filter));

    // Hide already applied
    if (hideApplied && appliedIds.size > 0) {
      list = list.filter((r) => !appliedIds.has(r.id));
    }

    // Sort: today's shifts → ASAP → future by date → undated (random)
    // Assign random tiebreaker for undated group once per render
    const withKey = list.map((r) => ({
      r,
      key: priorityKey(r),
      rand: Math.random(),
    }));
    withKey.sort((a, b) => {
      if (a.key !== b.key) return a.key - b.key;
      if (a.key === SORT_UNDATED) return a.rand - b.rand;
      return 0;
    });
    return withKey.map((x) => x.r);
  }, [rows, filter, hideApplied, appliedIds]);

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
          <Text style={{ color: "#F0531C" }}>S</Text>hifts nearby
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setHideApplied(!hideApplied)}
            style={[styles.toggleChip, hideApplied && styles.toggleChipOn]}
          >
            <Feather name={hideApplied ? "check" : "eye"} size={12} color={hideApplied ? "white" : "#0E1A24"} />
            <Text style={[styles.toggleChipTxt, hideApplied && styles.toggleChipTxtOn]}>
              {t("shift_filters.hide_applied")}
            </Text>
          </Pressable>
          <Pressable onPress={() => load()} hitSlop={12} style={styles.refreshBtn}>
            <Feather name="refresh-cw" size={20} color="#0E1A24" />
          </Pressable>
        </View>
      </View>

      <FilterChips options={getShiftTimeFilters()} value={filter} onChange={setFilter} />

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
            <Feather name="search" size={40} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No shifts right now</Text>
            <Text style={styles.emptyTxt}>
              Pull down to refresh — new shifts appear constantly.
            </Text>
          </View>
        ) : (
          filtered.map((r) => <ShiftRowItem key={r.id} row={r} router={router} showPay={hasAccount} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ShiftRowItem({
  row,
  router,
  showPay,
}: {
  row: ShiftRow;
  router: ReturnType<typeof useRouter>;
  showPay: boolean;
}) {
  const v = row.venue;
  // Normalise venue type to match our key set (lowercase, strip "club"/" club" variants)
  const typeKey = (v?.type || "cafe")
    .toLowerCase()
    .replace(/\s+/g, "_") // "Beach club" → "beach_club"
    .replace("café", "cafe");
  const photo = v?.photo_url
    ? { uri: v.photo_url }
    : VENUE_TYPE_PHOTOS[typeKey] ?? VENUE_CAFE;

  const isUrgent =
    row.start_when === "now" || row.start_when === "asap";

  // Format pay
  const payStr =
    row.pay_amount && row.pay_unit
      ? `€${row.pay_amount}/${shortUnit(row.pay_unit)}`
      : null;

  // Format when
  const whenStr = formatWhen(row);

  // Roles line
  const roleStr = localizeRoles((row.roles ?? []).slice(0, 2)).join(" · ") || "Shift";

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/shift-detail",
          params: { id: row.id },
        })
      }
      style={styles.row}
    >
      <Image source={photo} style={styles.thumb} resizeMode="cover" />
      {isUrgent && (
        <View style={styles.urgentDot}>
          <Feather name="zap" size={10} color="white" />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <View style={styles.line1}>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              if (v?.id) router.push({ pathname: "/venue-board", params: { venueId: v.id } });
            }}
            style={styles.venueNameLink}
          >
            <Text style={styles.venueName} numberOfLines={1}>
              {v?.name || "Venue"}
            </Text>
            {!!v?.id && <Feather name="arrow-up-right" size={14} color="#185FA5" />}
          </Pressable>
          {payStr && (showPay ? (
            <Text style={styles.payBig}>{payStr}</Text>
          ) : (
            <Pressable
              style={styles.payLocked}
              onPress={(event) => {
                event.stopPropagation();
                router.push("/signin");
              }}
            >
              <Feather name="lock" size={11} color="#F0531C" />
              <Text style={styles.payLockedTxt}>{t("shift_detail.pay_signin")}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.line2}>
          <Feather name="briefcase" size={11} color="#6B7280" />
          <Text style={styles.role} numberOfLines={1}>
            {roleStr}
          </Text>
          {v?.venue_style && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.style}>
                {(() => {
                  // venue_style is stored as the lowercase id (casual/busy/
                  // upscale/luxury). Resolve to the localized label; fall
                  // back to the raw value if the key isn't found.
                  const k = `venue_style.${v.venue_style.toLowerCase()}`;
                  const val = t(k);
                  return val && !val.includes(".") ? val : v.venue_style;
                })()}
              </Text>
            </>
          )}
        </View>

        <View style={styles.line3}>
          {isUrgent ? (
            <View style={styles.urgentChip}>
              <Feather name="zap" size={10} color="#E24B4A" />
              <Text style={styles.urgentTxt}>
                {row.start_when === "now" ? "Need now" : "ASAP"}
              </Text>
            </View>
          ) : (
            <View style={styles.whenChip}>
              <Feather name="clock" size={10} color="#0E1A24" />
              <Text style={styles.whenTxt}>{whenStr}</Text>
            </View>
          )}
          <Feather name="map-pin" size={11} color="#6B7280" />
          <Text style={styles.distance} numberOfLines={1}>
            {v?.city ?? "—"}
          </Text>
          {v?.type && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.distance}>{v.type}</Text>
            </>
          )}
        </View>
      </View>

      <Feather name="chevron-right" size={18} color="#9CA3AF" />
    </Pressable>
  );
}

// ----- sort priority -----
// 0 = today's shift (start_date is today)
// 1 = ASAP urgency (no specific date but flagged now/asap)
// 2..N = future scheduled (lower = sooner)
// SORT_UNDATED = undated (sorted randomly at the bottom)
const SORT_UNDATED = 1_000_000;

function isToday(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

function priorityKey(r: ShiftRow): number {
  if (isToday(r.start_date)) return 0;
  const sw = (r.start_when || "").toLowerCase();
  if (sw === "now" || sw === "asap") return 1;
  if (r.start_date) {
    const days = Math.max(
      0,
      Math.floor((new Date(r.start_date).getTime() - Date.now()) / 86400000)
    );
    return 2 + days; // tomorrow=3, day after=4, etc.
  }
  return SORT_UNDATED;
}

function shortUnit(u: string) {
  if (u === "hour") return "h";
  if (u === "day") return "d";
  if (u === "week") return "wk";
  if (u === "month") return "mo";
  return u;
}

function formatWhen(row: ShiftRow) {
  if (row.start_date) {
    const d = new Date(row.start_date);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  }
  if (row.hours_start && row.hours_end) {
    return `${row.hours_start}–${row.hours_end}`;
  }
  return "Flexible";
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
    flexShrink: 1,
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 22,
    fontWeight: "400",
    color: "#0E1A24",
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  toggleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(14,26,36,0.12)",
  },
  toggleChipOn: { backgroundColor: "#F0531C", borderColor: "#F0531C" },
  toggleChipTxt: { fontSize: 11, fontWeight: "700", color: "#46505A" },
  toggleChipTxtOn: { color: "white" },

  scroll: { paddingHorizontal: 14, paddingBottom: 20 },
  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: "InstrumentSerif_400Regular", fontSize: 16, fontWeight: "400", color: "#0E1A24", marginTop: 8 },
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
    position: "relative",
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#E5E5E0",
  },
  urgentDot: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#E24B4A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
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
  payBig: {
    fontSize: 15,
    fontWeight: "900",
    color: "#F0531C",
  },
  payLocked: { alignItems: "center", backgroundColor: "#FFF4EE", borderRadius: 999, flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingVertical: 5 },
  payLockedTxt: { color: "#C2410C", fontSize: 10, fontWeight: "800" },

  line2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  role: {
    fontFamily: "InstrumentSerif_400Regular", fontSize: 13, fontWeight: "400", color: "#0E1A24" },
  style: { fontSize: 12, color: "#6B7280", fontStyle: "italic" },
  dot: { color: "#9CA3AF", fontSize: 12 },

  line3: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  urgentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FCEBEB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  urgentTxt: {
    fontSize: 11,
    fontWeight: "800",
    color: "#E24B4A",
    letterSpacing: 0.3,
  },
  whenChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1EFE8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  whenTxt: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0E1A24",
  },
  distance: { fontSize: 11, color: "#6B7280", fontWeight: "600" },
});
