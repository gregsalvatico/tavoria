// Venue board — public landing page reached by scanning a venue's door QR.
// Shows the venue header + all live shifts. If the user has no worker
// profile yet, they're routed through /signup first and come back here.

import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { getCurrentUserContext, getCurrentWorkerContactAccessForVenue, getVenueBoard } from "../lib/db";
import { localizeRoles } from "../lib/positions";
import ContactPersonModal from "../components/ContactPersonModal";
import { t } from "../lib/i18n";
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

type Venue = {
  id: string;
  name?: string;
  type?: string;
  city?: string;
  address?: string;
  venue_style?: string;
  photo_url?: string;
  pay_schedule?: string;
  email?: string;
  phone?: string;
  website_url?: string;
  contact_email_enabled?: boolean;
  contact_phone_enabled?: boolean;
  contact_in_person_enabled?: boolean;
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
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const { venueId } = useLocalSearchParams<{ venueId?: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [contactAccess, setContactAccess] = useState<any | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const load = useCallback(async () => {
    if (!venueId) {
      setErrorMsg("No venue specified.");
      setLoading(false);
      return;
    }
    setErrorMsg(null);
    try {
      const [data, access] = await Promise.all([
        getVenueBoard(venueId),
        getCurrentWorkerContactAccessForVenue(venueId),
      ]);
      setVenue(data.venue as Venue);
      setShifts((data.shifts ?? []) as ShiftRow[]);
      setContactAccess(access);
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
        const account = await getCurrentUserContext();
        if (!account.hasWorker && !account.hasVenue) {
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
  const contactsUnlocked = !!contactAccess;
  const contactEmail = contactsUnlocked && venue?.contact_email_enabled !== false ? venue?.email : undefined;
  const contactPhone = contactsUnlocked && venue?.contact_phone_enabled !== false ? venue?.phone : undefined;
  const visitAddress = contactsUnlocked && venue?.contact_in_person_enabled === true ? venue?.address : undefined;
  const hasContactMethod = !!(contactEmail || contactPhone || visitAddress);
  const venueWebsite = websiteUrl(venue?.website_url);
  const venueWebsiteLabel = websiteLabel(venue?.website_url);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
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

            {(venue?.address || venueWebsite) ? (
              <View style={styles.venueLinksCard}>
                {venue?.address ? (
                  <Pressable
                    style={styles.venueLinkRow}
                    onPress={() => void openExternalLink(mapsUrl(venue.address!), t("external_link.maps"))}
                  >
                    <View style={styles.venueLinkIcon}><Feather name="map-pin" size={16} color="#F0531C" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.venueLinkLabel}>{t("venue_card.directions")}</Text>
                      <Text style={styles.venueLinkText} numberOfLines={1}>{venue.address}</Text>
                    </View>
                    <Feather name="arrow-up-right" size={17} color="#F0531C" />
                  </Pressable>
                ) : null}
                {venueWebsite ? (
                  <Pressable
                    style={[styles.venueLinkRow, venue?.address && styles.venueLinkDivider]}
                    onPress={() => void openExternalLink(venueWebsite, t("venue_card.website"))}
                  >
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

            <Pressable
              style={[styles.contactCard, contactsUnlocked ? styles.contactCardOpen : styles.contactCardLocked]}
              onPress={() => contactsUnlocked && hasContactMethod && setContactOpen(true)}
              disabled={!contactsUnlocked || !hasContactMethod}
            >
              <View style={[styles.contactIcon, contactsUnlocked ? styles.contactIconOpen : styles.contactIconLocked]}>
                <Feather name={contactsUnlocked ? "unlock" : "lock"} size={16} color={contactsUnlocked ? "#F0531C" : "#854F0B"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactTitle}>{contactsUnlocked ? "Venue contact details" : "Contact details locked"}</Text>
                <Text style={styles.contactText}>
                  {contactsUnlocked
                    ? hasContactMethod
                      ? [contactEmail, contactPhone, visitAddress].filter(Boolean).join(" · ")
                      : "This venue has not enabled a contact method yet."
                    : "Apply, then wait for the venue to request an interview or hire you."}
                </Text>
              </View>
              {contactsUnlocked && hasContactMethod ? <Feather name="chevron-right" size={18} color="#F0531C" /> : null}
            </Pressable>

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
              <View style={isDesktop && styles.desktopGrid}>
                {shifts.map((s) => (
                  <ShiftRowItem key={s.id} row={s} router={router} isDesktop={isDesktop} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <ContactPersonModal
        visible={contactOpen}
        onClose={() => setContactOpen(false)}
        name={venue?.name ?? "venue"}
        email={contactEmail}
        phone={contactPhone}
        visitAddress={visitAddress}
        initialMessage={`Hi ${venue?.name ?? ""}, Iâ€™m following up about a shift on Tavoria.`.trim()}
      />
    </SafeAreaView>
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
      style={[styles.row, isDesktop && styles.rowDesktop]}
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
  headerDesktop: { paddingHorizontal: 24 },
  iconBtn: { padding: 4, width: 32, alignItems: "center" },

  scroll: { paddingHorizontal: 14, paddingBottom: 20 },
  scrollDesktop: { paddingHorizontal: 24 },
  desktopGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  loadingWrap: { paddingVertical: 60, alignItems: "center" },
  fullWidthState: { width: "100%" },
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
  venueLinksCard: {
    backgroundColor: "white",
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 14,
    borderWidth: 0.5,
    marginBottom: 12,
    overflow: "hidden",
  },
  venueLinkRow: { alignItems: "center", flexDirection: "row", gap: 10, padding: 12 },
  venueLinkDivider: { borderTopColor: "rgba(0,0,0,0.08)", borderTopWidth: 1 },
  venueLinkIcon: { alignItems: "center", backgroundColor: "#FFF4EE", borderRadius: 9, height: 34, justifyContent: "center", width: 34 },
  venueLinkLabel: { color: "#6B7280", fontSize: 10, fontWeight: "800", letterSpacing: 0.7, textTransform: "uppercase" },
  venueLinkText: { color: "#0E1A24", fontSize: 13, fontWeight: "700", marginTop: 2 },

  contactCard: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 16, padding: 12 },
  contactCardOpen: { backgroundColor: "#FFF4EE", borderColor: "#F7C7AB" },
  contactCardLocked: { backgroundColor: "#EAE7DF", borderColor: "#DED8CC" },
  contactIcon: { alignItems: "center", borderRadius: 9, height: 34, justifyContent: "center", width: 34 },
  contactIconOpen: { backgroundColor: "#FFE1CE" },
  contactIconLocked: { backgroundColor: "#DDD6C9" },
  contactTitle: { color: "#0E1A24", fontSize: 13, fontWeight: "800" },
  contactText: { color: "#5D6670", fontSize: 11, lineHeight: 16, marginTop: 2 },

  sectionTitle: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 11,
    fontWeight: "400",
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
  rowDesktop: { marginBottom: 0, width: "48.8%" },
  urgentDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#E24B4A",
    justifyContent: "center",
    alignItems: "center",
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
