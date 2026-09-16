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
import { formatLocalizedDate } from "../lib/dateFormat";
import { getVenueProfile, patchVenueProfile } from "../lib/venueProfile";
import { localizeRoles } from "../lib/positions";
import AppBottomNav from "../components/AppBottomNav";
import { ListRow, ListSurface, PageContainer } from "../components/PagePrimitives";
import VenueProfileHeader from "../components/VenueProfileHeader";
import VenueScreenHeader from "../components/VenueScreenHeader";
import { TAVORIA } from "../lib/designTokens";

const VENUE_TYPE_PHOTOS: Record<string, any> = {
  cafe: require("../assets/venue-cafe.png"),
  bar: require("../assets/venue-bar.png"),
  restaurant: require("../assets/venue-restaurant.png"),
  hotel: require("../assets/venue-hotel.png"),
  club: require("../assets/venue-club.png"),
  beach_club: require("../assets/venue-beach.png"),
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
  photo_urls?: (string | null)[];
  video_urls?: (string | null)[];
  venue_style?: string;
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
          photo_urls: cached.photoUrls,
          video_urls: cached.videoUrls,
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
          photo_urls: remoteVenue.photo_urls as (string | null)[] | undefined,
          video_urls: remoteVenue.video_urls as (string | null)[] | undefined,
          venue_style: remoteVenue.venue_style as string | undefined,
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
          photoUrls: nextVenue.photo_urls?.filter((url): url is string => Boolean(url)),
          videoUrls: nextVenue.video_urls?.filter((url): url is string => Boolean(url)),
          venueStyle: nextVenue.venue_style,
        });
      }
      const rows = await getCurrentVenueShifts(localVenueId);
      setShifts(rows as unknown as ShiftRow[]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? t("shift_detail.load_error"));
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
      <PageContainer>
        <VenueScreenHeader
          title={t("home_in.my_shifts")}
          active="shifts"
          onRefresh={() => { setRefreshing(true); void load(); }}
          refreshable={!loading}
          refreshing={refreshing}
        />
      </PageContainer>
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
            <Pressable
              accessibilityRole="button"
              onPress={() => { setRefreshing(true); void load(); }}
              style={({ hovered, pressed }) => [styles.retryButton, hovered && styles.retryButtonHovered, pressed && styles.retryButtonPressed]}
            >
              <Feather name="refresh-cw" size={15} color={TAVORIA.color.orange} />
              <Text style={styles.retryText}>{t("talent.retry")}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.contentStack}>
            {venue ? <VenueSummary venue={venue} onEdit={() => router.push("/venue-edit")} onAvatarReplace={() => router.push("/venue-avatar-edit")} /> : null}
            <Pressable
              onPress={() => router.push("/post-shift")}
              style={styles.postShiftCard}
              accessibilityRole="button"
            >
              <View style={styles.postShiftIcon}>
                <Feather name="plus" size={19} color="#F0531C" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.postShiftTitleRow}>
                  <Text style={styles.postShiftTitle}>{t("home_in.post_shift")}</Text>
                  <Feather name="arrow-up-right" size={16} color="#F0531C" />
                </View>
                <Text style={styles.postShiftText}>{t("venue_shifts.empty_sub")}</Text>
              </View>
            </Pressable>

            {shifts.length === 0 ? (
              <View style={styles.emptyInline}>
                <Feather name="briefcase" size={22} color="#9CA3AF" />
                <Text style={styles.emptyInlineTitle}>{t("venue_shifts.empty_title")}</Text>
              </View>
            ) : (
              <ListSurface style={styles.shiftList}>
                {shifts.map((s, index) => <ShiftRowItem key={s.id} row={s} router={router} isDesktop={isDesktop} last={index === shifts.length - 1} />)}
              </ListSurface>
            )}
          </View>
        )}
      </ScrollView>
      <AppBottomNav role="venue" active="shifts" />
    </SafeAreaView>
  );
}

function VenueSummary({ venue, onEdit, onAvatarReplace }: { venue: VenueRow; onEdit: () => void; onAvatarReplace: () => void }) {
  return <VenueProfileHeader venue={venue} onEdit={onEdit} onAvatarReplace={onAvatarReplace} />;
}

function ShiftRowItem({
  row,
  router,
  isDesktop,
  last,
}: {
  row: ShiftRow;
  router: ReturnType<typeof useRouter>;
  isDesktop: boolean;
  last: boolean;
}) {
  const photo = row.venue?.photo_url
    ? { uri: row.venue.photo_url }
    : VENUE_TYPE_PHOTOS[(row.venue?.type || "cafe").toLowerCase()] ??
      VENUE_TYPE_PHOTOS.cafe;

  const isUrgent =
    row.start_when === "now" || row.start_when === "asap";
  const roleStr = localizeRoles(row.roles ?? []).slice(0, 2).join(" · ") || t("shift_detail.default_shift");
  const payStr =
    row.pay_amount && row.pay_unit
      ? `€${row.pay_amount}/${row.pay_unit}`
      : t("shift_detail.pay_discussed");
  const whenStr = (() => {
    if (isUrgent) return row.start_when === "now" ? t("shift_detail.need_now_banner") : t("shift_filters.asap");
    if (row.start_date) {
      const d = new Date(row.start_date);
      const today = new Date();
      const sameDay =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
      if (sameDay) return t("shift_filters.today");
      return formatLocalizedDate(d);
    }
    return (row.days ?? []).map(dayLabel).join(" · ") || "—";
  })();

  return (
    <ListRow
      label={roleStr}
      last={last}
      onPress={() =>
        router.push({ pathname: "/shift-detail", params: { id: row.id } })
      }
    >
      <Image source={photo} style={[styles.thumb, isDesktop && styles.thumbDesktop]} resizeMode="cover" />
      {isUrgent && (
        <View style={styles.urgentDot}>
          <Feather name="zap" size={10} color="white" />
        </View>
      )}
      <View style={styles.rowBody}>
        <Text style={[styles.role, isDesktop && styles.roleDesktop]} numberOfLines={1}>
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
    </ListRow>
  );
}

function dayLabel(day: string) {
  const value = t(`shift_detail.days_short.${day}`);
  return value && !value.includes(".") ? value : day;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TAVORIA.color.paperDeep },
  scroll: { paddingBottom: 20, paddingHorizontal: 16, paddingTop: 10 },
  scrollDesktop: { alignSelf: "center", maxWidth: 1180, paddingHorizontal: 24, width: "100%" },
  contentStack: { gap: 16 },

  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  fullWidthState: { width: "100%" },
  emptyWrap: { alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 60 },
  emptyTxt: { color: "#6B7280", fontSize: 13, textAlign: "center" },
  retryButton: { alignItems: "center", borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.pill, borderWidth: 1, flexDirection: "row", gap: 7, marginTop: 8, minHeight: 40, paddingHorizontal: 14 },
  retryButtonHovered: { backgroundColor: TAVORIA.color.white },
  retryButtonPressed: { opacity: 0.72 },
  retryText: { color: TAVORIA.color.orange, fontSize: 13, fontWeight: "700" },
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
  postShiftCard: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, flexDirection: "row", gap: 11, marginBottom: 0, marginTop: 0, minHeight: 104, paddingHorizontal: 16, paddingVertical: 16 },
  postShiftIcon: { alignItems: "center", backgroundColor: "#FFE1CE", borderRadius: TAVORIA.radius.small, height: 44, justifyContent: "center", width: 44 },
  postShiftTitle: { color: TAVORIA.color.navy, fontSize: 15, fontWeight: "800" },
  postShiftTitleRow: { alignItems: "center", flexDirection: "row", gap: 5 },
  postShiftText: { color: "#6B7280", fontSize: 11, marginTop: 3 },
  shiftList: { marginBottom: 0 },
  emptyInline: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.08)", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 11, padding: 14 },
  emptyInlineTitle: { color: "#0E1A24", fontSize: 14, fontWeight: "800" },

  thumb: { backgroundColor: "#E5E5E0", borderRadius: 14, height: 72, width: 64 },
  thumbDesktop: { borderRadius: 14, height: 72, width: 64 },
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
  rowBody: { flex: 1, gap: 5, minWidth: 0 },
  role: { color: TAVORIA.color.navy, fontSize: 16, fontWeight: "700" },
  roleDesktop: { fontSize: 16 },
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
