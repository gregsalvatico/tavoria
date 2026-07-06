// Venue's posted shifts list — fixes the gap where venues couldn't see what
// they'd posted. Tap a row to view the shift detail (same view workers see).

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { getCurrentVenueRow, getCurrentVenueShifts } from "../lib/db";
import { t } from "../lib/i18n";
import { getVenueProfile, patchVenueProfile } from "../lib/venueProfile";
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
  created_at?: string;
  venue?: {
    id: string;
    name?: string;
    type?: string;
    city?: string;
    photo_url?: string;
  };
};

export default function VenueShifts() {
  const router = useRouter();
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMsg(null);
    try {
      // Use local venueProfile.id if present; otherwise hydrate from Supabase.
      let localVenueId = getVenueProfile()?.id;
      if (!localVenueId) {
        try {
          const v = await getCurrentVenueRow();
          if (v?.id) {
            localVenueId = v.id as string;
            patchVenueProfile({ id: v.id, name: v.name, type: v.type });
          }
        } catch {}
      }
      const rows = await getCurrentVenueShifts(localVenueId);
      setShifts(rows as ShiftRow[]);
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
          <Text style={{ color: "#F0531C" }}>
            {t("venue_shifts.title").charAt(0)}
          </Text>
          {t("venue_shifts.title").slice(1)}
        </Text>
        <Pressable
          onPress={() => router.push("/venue-photo")}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="plus" size={22} color="#F0531C" />
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
        ) : shifts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="briefcase" size={40} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {t("venue_shifts.empty_title")}
            </Text>
            <Text style={styles.emptyTxt}>
              {t("venue_shifts.empty_sub")}
            </Text>
            <Pressable
              onPress={() => router.push("/venue-photo")}
              style={styles.emptyCta}
            >
              <Feather name="plus" size={16} color="white" />
              <Text style={styles.emptyCtaTxt}>
                {t("venue_shifts.post_more")}
              </Text>
            </Pressable>
          </View>
        ) : (
          shifts.map((s) => <ShiftRowItem key={s.id} row={s} router={router} />)
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
  const photo = row.venue?.photo_url
    ? { uri: row.venue.photo_url }
    : VENUE_TYPE_PHOTOS[(row.venue?.type || "cafe").toLowerCase()] ??
      VENUE_TYPE_PHOTOS.cafe;

  const isUrgent =
    row.start_when === "now" || row.start_when === "asap";
  const roleStr = localizeRoles(row.roles ?? []).slice(0, 2).join(" · ") || "Shift";
  const payStr =
    row.pay_amount && row.pay_unit
      ? `€${row.pay_amount}/${row.pay_unit}`
      : "—";
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
      return d.toLocaleDateString([], {
        day: "numeric",
        month: "short",
      });
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
      <Image source={photo} style={styles.thumb} resizeMode="cover" />
      {isUrgent && (
        <View style={styles.urgentDot}>
          <Feather name="zap" size={10} color="white" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.role} numberOfLines={1}>
          {roleStr}
        </Text>
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
  h1: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.4,
  },

  scroll: { paddingHorizontal: 14, paddingBottom: 20 },

  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0E1A24",
    marginTop: 8,
  },
  emptyTxt: { color: "#6B7280", fontSize: 13, textAlign: "center" },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    backgroundColor: "#F0531C",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyCtaTxt: { color: "white", fontSize: 14, fontWeight: "700" },

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
  thumb: { width: 56, height: 56, borderRadius: 10 },
  urgentDot: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#E24B4A",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
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
