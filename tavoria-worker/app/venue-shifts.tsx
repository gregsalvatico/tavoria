// Venue's posted shifts list — fixes the gap where venues couldn't see what
// they'd posted. Tap a row to view the shift detail (same view workers see).

import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
import { getCurrentVenueRow, getCurrentVenueShifts } from "../lib/db";
import { t } from "../lib/i18n";
import { getVenueProfile, patchVenueProfile } from "../lib/venueProfile";
import { localizeRoles } from "../lib/positions";
import AppBottomNav from "../components/AppBottomNav";
import { mapsUrl, websiteLabel, websiteUrl } from "../lib/contact";
import { openExternalLink } from "../lib/externalLinks";

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

type VenueRow = {
  id?: string;
  name?: string;
  type?: string;
  city?: string;
  address?: string;
  website_url?: string;
  photo_url?: string;
};

export default function VenueShifts() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [venue, setVenue] = useState<VenueRow | null>(() => {
    const cached = getVenueProfile();
    return cached
      ? {
          id: cached.id,
          name: cached.name,
          type: cached.type,
          city: cached.city,
          address: cached.address,
          website_url: cached.websiteUrl,
          photo_url: cached.photoUrl,
        }
      : null;
  });

  const load = useCallback(async () => {
    setErrorMsg(null);
    try {
      const remoteVenue = await getCurrentVenueRow();
      let localVenueId = getVenueProfile()?.id ?? remoteVenue?.id;
      if (remoteVenue?.id) {
        const nextVenue: VenueRow = {
          id: remoteVenue.id as string,
          name: remoteVenue.name as string | undefined,
          type: remoteVenue.type as string | undefined,
          city: remoteVenue.city as string | undefined,
          address: remoteVenue.address as string | undefined,
          website_url: remoteVenue.website_url as string | undefined,
          photo_url: remoteVenue.photo_url as string | undefined,
        };
        setVenue(nextVenue);
        patchVenueProfile({
          id: nextVenue.id,
          name: nextVenue.name ?? "",
          type: nextVenue.type,
          city: nextVenue.city ?? "",
          address: nextVenue.address ?? "",
          websiteUrl: nextVenue.website_url,
          photoUrl: nextVenue.photo_url,
        });
      }
      const rows = await getCurrentVenueShifts(localVenueId);
      setShifts(rows as unknown as ShiftRow[]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Could not load shifts.");
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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
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
        ) : (
          <>
            {venue ? <VenueSummary venue={venue} onEdit={() => router.push("/venue-edit")} /> : null}
            <Pressable
              onPress={() => router.push("/venue-photo")}
              style={styles.postShiftCard}
              accessibilityRole="button"
            >
              <View style={styles.postShiftIcon}>
                <Feather name="plus" size={19} color="#F0531C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.postShiftTitle}>{t("home_in.post_shift")}</Text>
                <Text style={styles.postShiftText}>Add a new opening for your venue</Text>
              </View>
              <Feather name="arrow-up-right" size={19} color="#F0531C" />
            </Pressable>

            {shifts.length === 0 ? (
              <View style={styles.emptyInline}>
                <Feather name="briefcase" size={22} color="#9CA3AF" />
                <Text style={styles.emptyInlineTitle}>{t("venue_shifts.empty_title")}</Text>
              </View>
            ) : (
              <View style={isDesktop && styles.desktopGrid}>
                {shifts.map((s) => <ShiftRowItem key={s.id} row={s} router={router} isDesktop={isDesktop} />)}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <AppBottomNav role="venue" active="shifts" />
    </SafeAreaView>
  );
}

function VenueSummary({ venue, onEdit }: { venue: VenueRow; onEdit: () => void }) {
  const image = venue.photo_url
    ? { uri: venue.photo_url }
    : VENUE_TYPE_PHOTOS[(venue.type || "cafe").toLowerCase()] ?? VENUE_TYPE_PHOTOS.cafe;
  const venueWebsite = websiteUrl(venue.website_url);
  const venueWebsiteLabel = websiteLabel(venue.website_url);

  return (
    <>
    <View style={styles.hero}>
      <Image source={image} style={styles.heroImg} resizeMode="cover" />
      <View style={styles.heroOverlay} />
      <View style={styles.heroTextWrap}>
        <Text style={styles.heroName} numberOfLines={1}>{venue.name || "Your venue"}</Text>
        <View style={styles.heroMetaRow}>
          {venue.type ? <Text style={styles.heroMeta}>{venue.type}</Text> : null}
          {venue.type && venue.city ? <Text style={styles.heroMetaDot}>·</Text> : null}
          {venue.city ? (
            <>
              <Feather name="map-pin" size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroMeta}>{venue.city}</Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
      {(venue.address || venueWebsite) ? (
        <View style={styles.venueLinksCard}>
          {venue.address ? (
            <Pressable style={styles.venueLinkRow} onPress={() => void openExternalLink(mapsUrl(venue.address!), t("external_link.maps"))}>
              <View style={styles.venueLinkIcon}><Feather name="map-pin" size={16} color="#F0531C" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.venueLinkLabel}>{t("venue_card.directions")}</Text>
                <Text style={styles.venueLinkText} numberOfLines={1}>{venue.address}</Text>
              </View>
              <Feather name="arrow-up-right" size={17} color="#F0531C" />
            </Pressable>
          ) : null}
          {venueWebsite ? (
            <Pressable style={[styles.venueLinkRow, venue.address && styles.venueLinkDivider]} onPress={() => void openExternalLink(venueWebsite, t("venue_card.website"))}>
              <View style={styles.venueLinkIcon}><Feather name="globe" size={16} color="#F0531C" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.venueLinkLabel}>{t("venue_card.website")}</Text>
                <Text style={styles.venueLinkText} numberOfLines={1}>{venueWebsiteLabel}</Text>
              </View>
              <Feather name="arrow-up-right" size={17} color="#F0531C" />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <Pressable style={styles.editVenueButton} onPress={onEdit}>
        <Feather name="edit-2" size={15} color="#0E1A24" />
        <Text style={styles.editVenueText}>Edit profile</Text>
      </Pressable>
    </>
  );
}

function ShiftRowItem({
  row,
  router,
  isDesktop,
}: {
  row: ShiftRow;
  router: ReturnType<typeof useRouter>;
  isDesktop: boolean;
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
      style={[styles.row, isDesktop && styles.rowDesktop]}
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
  scroll: { paddingBottom: 20, paddingHorizontal: 14, paddingTop: 10 },
  scrollDesktop: { paddingHorizontal: 24 },
  desktopGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  fullWidthState: { width: "100%" },
  emptyWrap: { alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 60 },
  emptyTxt: { color: "#6B7280", fontSize: 13, textAlign: "center" },
  hero: { backgroundColor: "#0E1A24", borderRadius: 18, height: 180, marginBottom: 14, overflow: "hidden", position: "relative" },
  heroImg: { height: "100%", width: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.30)" },
  heroTextWrap: { bottom: 16, left: 18, position: "absolute", right: 18 },
  heroName: { color: "white", fontSize: 24, fontWeight: "800", letterSpacing: -0.3 },
  heroMetaRow: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 4 },
  heroMeta: { color: "rgba(255,255,255,0.9)", fontSize: 13 },
  heroMetaDot: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  venueLinksCard: { backgroundColor: "white", borderColor: "rgba(0,0,0,0.08)", borderRadius: 14, borderWidth: 0.5, marginBottom: 12, overflow: "hidden" },
  venueLinkRow: { alignItems: "center", flexDirection: "row", gap: 10, padding: 12 },
  venueLinkDivider: { borderTopColor: "rgba(0,0,0,0.08)", borderTopWidth: 1 },
  venueLinkIcon: { alignItems: "center", backgroundColor: "#FFF4EE", borderRadius: 9, height: 34, justifyContent: "center", width: 34 },
  venueLinkLabel: { color: "#6B7280", fontSize: 10, fontWeight: "800", letterSpacing: 0.7, textTransform: "uppercase" },
  venueLinkText: { color: "#0E1A24", fontSize: 13, fontWeight: "700", marginTop: 2 },
  editVenueButton: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.14)", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 7, justifyContent: "center", marginBottom: 12, minHeight: 46, paddingHorizontal: 16 },
  editVenueText: { color: "#0E1A24", fontSize: 13, fontWeight: "800" },
  postShiftCard: { alignItems: "center", backgroundColor: "#FFF8F4", borderColor: "#F0531C", borderRadius: 14, borderStyle: "dashed", borderWidth: 1.5, flexDirection: "row", gap: 11, marginBottom: 18, padding: 12 },
  postShiftIcon: { alignItems: "center", backgroundColor: "#FFF0E7", borderRadius: 12, height: 44, justifyContent: "center", width: 44 },
  postShiftTitle: { color: "#0E1A24", fontSize: 15, fontWeight: "800" },
  postShiftText: { color: "#6B7280", fontSize: 11, marginTop: 3 },
  emptyInline: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.08)", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 11, padding: 14 },
  emptyInlineTitle: { color: "#0E1A24", fontSize: 14, fontWeight: "800" },

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
  rowDesktop: { marginBottom: 0, width: "48.8%" },
  thumb: { width: 60, height: 60, borderRadius: 12 },
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
  role: {
    fontFamily: "InstrumentSerif_400Regular", fontSize: 15, fontWeight: "400", color: "#0E1A24" },
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
