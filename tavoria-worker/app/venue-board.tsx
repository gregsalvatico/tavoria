// Venue board — public landing page reached by scanning a venue's door QR.
// Shows the venue header + all live shifts. If the user has no worker
// profile yet, they're routed through /signup first and come back here.

import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { getCurrentWorkerFull, getVenueBoard } from "../lib/db";
import { localizeRoles } from "../lib/positions";

const VENUE_TYPE_PHOTOS: Record<string, any> = {
  cafe: require("../assets/venue-cafe.png"),
  bar: require("../assets/venue-bar.png"),
  restaurant: require("../assets/venue-restaurant.png"),
  hotel: require("../assets/venue-hotel.png"),
  club: require("../assets/venue-club.png"),
  beach_club: require("../assets/venue-beach.png"),
};

const DAY_LBL: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

type Venue = {
  id: string;
  name?: string;
  type?: string;
  city?: string;
  address?: string;
  venue_style?: string;
  photo_url?: string;
  pay_schedule?: string;
};

type ShiftRow = {
  id: string;
  roles?: string[];
  pay_amount?: number;
  pay_unit?: string;
  hours_start?: string;
  hours_end?: string;
  days?: string[];
  start_when?: string;
  start_date?: string;
};

export default function VenueBoard() {
  const router = useRouter();
  const { venueId } = useLocalSearchParams<{ venueId?: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!venueId) {
      setErrorMsg("No venue specified.");
      setLoading(false);
      return;
    }
    setErrorMsg(null);
    try {
      const data = await getVenueBoard(venueId);
      setVenue(data.venue as Venue);
      setShifts((data.shifts ?? []) as ShiftRow[]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Could not load venue.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [venueId]);

  // Auth gate: if user is not yet a worker, send them through signup.
  // After signup, /signup will route back here with the venueId param.
  useEffect(() => {
    if (!venueId) return;
    (async () => {
      try {
        const worker = await getCurrentWorkerFull();
        if (!worker) {
          router.replace({
            pathname: "/signup",
            params: { next: "venue-board", venueId },
          });
          return;
        }
        // Already a worker — load the board
        load();
      } catch (e) {
        // If anything fails, still try to load (RLS issues etc. will surface)
        load();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  const photo = venue?.photo_url
    ? { uri: venue.photo_url }
    : VENUE_TYPE_PHOTOS[(venue?.type || "cafe").toLowerCase()] ??
      VENUE_TYPE_PHOTOS.cafe;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace("/")}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="x" size={24} color="#0E1A24" />
        </Pressable>
        <View style={{ width: 32 }} />
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
        ) : (
          <>
            {/* Venue hero */}
            <View style={styles.hero}>
              <Image source={photo} style={styles.heroImg} />
              <View style={styles.heroOverlay} />
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {venue?.name ?? "Venue"}
                </Text>
                <View style={styles.heroMetaRow}>
                  {venue?.type && (
                    <Text style={styles.heroMeta}>{venue.type}</Text>
                  )}
                  {venue?.city && (
                    <>
                      <Text style={styles.heroMetaDot}>·</Text>
                      <Feather
                        name="map-pin"
                        size={12}
                        color="rgba(255,255,255,0.85)"
                      />
                      <Text style={styles.heroMeta}>{venue.city}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>
              {shifts.length > 0
                ? `${shifts.length} shift${shifts.length === 1 ? "" : "s"} available`
                : "No shifts right now"}
            </Text>

            {shifts.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Feather name="clock" size={32} color="#9CA3AF" />
                <Text style={styles.emptyTxt}>
                  {venue?.name ?? "This venue"} isn't hiring at the moment.{" "}
                  Pull down to refresh.
                </Text>
              </View>
            ) : (
              shifts.map((s) => (
                <ShiftRowItem key={s.id} row={s} router={router} />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ShiftRowItem({
  row,
  router,
}: {
  row: ShiftRow;
  router: ReturnType<typeof useRouter>;
}) {
  const isUrgent = row.start_when === "now" || row.start_when === "asap";
  const roleStr = localizeRoles(row.roles ?? []).slice(0, 2).join(" · ") || "Shift";
  const payStr =
    row.pay_amount && row.pay_unit ? `€${row.pay_amount}/${row.pay_unit}` : "—";
  const whenStr = (() => {
    if (isUrgent) return row.start_when === "now" ? "Now" : "ASAP";
    if (row.start_date) {
      const d = new Date(row.start_date);
      const today = new Date();
      const sameDay =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
      if (sameDay) return "Today";
      return d.toLocaleDateString([], { day: "numeric", month: "short" });
    }
    return (row.days ?? []).map((d) => DAY_LBL[d] || d).join(" · ") || "—";
  })();

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/shift-detail", params: { id: row.id } })
      }
      style={styles.row}
    >
      {isUrgent && (
        <View style={styles.urgentDot}>
          <Feather name="zap" size={11} color="white" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.role}>{roleStr}</Text>
        <View style={styles.metaRow}>
          <Feather name="clock" size={11} color="#6B7280" />
          <Text style={styles.metaTxt}>{whenStr}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.pay}>{payStr}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color="#9CA3AF" />
    </Pressable>
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
  iconBtn: { padding: 4, width: 32, alignItems: "center" },

  scroll: { paddingHorizontal: 14, paddingBottom: 20 },

  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTxt: { color: "#6B7280", fontSize: 13, textAlign: "center" },

  hero: {
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0E1A24",
    marginBottom: 14,
    position: "relative",
  },
  heroImg: { width: "100%", height: "100%" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  heroTextWrap: { position: "absolute", bottom: 16, left: 18, right: 18 },
  heroName: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  heroMeta: { color: "rgba(255,255,255,0.9)", fontSize: 13 },
  heroMetaDot: { color: "rgba(255,255,255,0.7)", fontSize: 13 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
    position: "relative",
  },
  urgentDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#E24B4A",
    justifyContent: "center",
    alignItems: "center",
  },
  role: { fontSize: 15, fontWeight: "800", color: "#0E1A24" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  metaTxt: { fontSize: 12, color: "#6B7280" },
  dot: { color: "#9CA3AF", fontSize: 12 },
  pay: { fontSize: 12, fontWeight: "800", color: "#F0531C" },
});
