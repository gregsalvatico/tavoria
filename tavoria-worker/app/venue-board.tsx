// Venue board — public landing page reached by scanning a venue's door QR.
// Shows the venue header + all live shifts. If the user has no worker
// profile yet, they're routed through /register first and come back here.

import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { formatLocalizedDate } from "../lib/dateFormat";
import VenueProfileHeader from "../components/VenueProfileHeader";
import { ListRow, ListSurface } from "../components/PagePrimitives";
import { TAVORIA } from "../lib/designTokens";

type Venue = {
  id: string;
  name?: string;
  type?: string;
  city?: string;
  address?: string;
  venue_style?: string;
  photo_url?: string;
  photo_urls?: (string | null)[];
  video_urls?: (string | null)[];
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
      setErrorMsg(t("shift_detail.default_venue"));
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
      setErrorMsg(e?.message ?? t("shift_detail.load_error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [venueId]);

  // Auth gate: if user is not yet a worker, send them through registration.
  // After registration, /register will route back here with the venueId param.
  useEffect(() => {
    if (!venueId) return;
    (async () => {
      try {
        const account = await getCurrentUserContext();
        if (!account.hasWorker && !account.hasVenue) {
          router.replace({
            pathname: "/register",
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

  const contactsUnlocked = !!contactAccess;
  const contactEmail = contactsUnlocked && venue?.contact_email_enabled !== false ? venue?.email : undefined;
  const contactPhone = contactsUnlocked && venue?.contact_phone_enabled !== false ? venue?.phone : undefined;
  const visitAddress = contactsUnlocked && venue?.contact_in_person_enabled === true ? venue?.address : undefined;
  const hasContactMethod = !!(contactEmail || contactPhone || visitAddress);

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
          <View style={styles.contentStack}>
            <VenueProfileHeader venue={venue ?? {}} />

            <Pressable
              style={[styles.contactCard, contactsUnlocked ? styles.contactCardOpen : styles.contactCardLocked]}
              onPress={() => contactsUnlocked && hasContactMethod && setContactOpen(true)}
              disabled={!contactsUnlocked || !hasContactMethod}
            >
              <View style={[styles.contactIcon, contactsUnlocked ? styles.contactIconOpen : styles.contactIconLocked]}>
                <Feather name={contactsUnlocked ? "unlock" : "lock"} size={16} color={contactsUnlocked ? "#F0531C" : "#854F0B"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactTitle}>{contactsUnlocked ? t("shift_detail.venue_contact_details") : t("shift_detail.venue_contact_details_locked")}</Text>
                <Text style={styles.contactText}>
                  {contactsUnlocked
                    ? hasContactMethod
                      ? [contactEmail, contactPhone, visitAddress].filter(Boolean).join(" · ")
                      : t("shift_detail.contact_none")
                    : t("shift_detail.contact_details_locked_sub")}
                </Text>
              </View>
              {contactsUnlocked && hasContactMethod ? <Feather name="chevron-right" size={18} color="#F0531C" /> : null}
            </Pressable>

            <Text style={styles.sectionTitle}>
              {t("venue_shifts.title")}
            </Text>

            {shifts.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Feather name="clock" size={32} color="#9CA3AF" />
                <Text style={styles.emptyTxt}>
                  {venue?.name ?? t("shift_detail.default_venue")} · {t("venue_shifts.empty_sub")}
                </Text>
              </View>
            ) : (
              <ListSurface>
                <View style={isDesktop && styles.desktopGrid}>
                  {shifts.map((s, index) => (
                    <ShiftRowItem key={s.id} row={s} router={router} last={index === shifts.length - 1} />
                  ))}
                </View>
              </ListSurface>
            )}
          </View>
        )}
      </ScrollView>
      <ContactPersonModal
        visible={contactOpen}
        onClose={() => setContactOpen(false)}
        name={venue?.name ?? "venue"}
        email={contactEmail}
        phone={contactPhone}
        visitAddress={visitAddress}
        initialMessage={t("shift_detail.follow_up_message", {
          venue: venue?.name ?? t("shift_detail.default_venue"),
          role: t("shift_detail.default_shift"),
        })}
      />
    </SafeAreaView>
  );
}

function ShiftRowItem({
  row,
  router,
  last,
}: {
  row: ShiftRow;
  router: ReturnType<typeof useRouter>;
  last: boolean;
}) {
  const isUrgent = row.start_when === "now" || row.start_when === "asap";
  const roleStr = localizeRoles(row.roles ?? []).slice(0, 2).join(" · ") || t("shift_detail.default_shift");
  const payStr =
    row.pay_amount && row.pay_unit ? `€${row.pay_amount}/${row.pay_unit}` : t("shift_detail.pay_discussed");
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
    </ListRow>
  );
}

function dayLabel(day: string) {
  const value = t(`shift_detail.days_short.${day}`);
  return value && !value.includes(".") ? value : day;
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
  headerDesktop: { paddingHorizontal: 24 },
  iconBtn: { padding: 4, width: 32, alignItems: "center" },

  scroll: { paddingHorizontal: 14, paddingBottom: 20 },
  scrollDesktop: { alignSelf: "center", maxWidth: 1180, paddingHorizontal: 24, width: "100%" },
  contentStack: { gap: 16 },
  desktopGrid: { width: "100%" },

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

  contactCard: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 0, padding: 12 },
  contactCardOpen: { backgroundColor: TAVORIA.color.orangeSoft, borderColor: "#F7C7AB" },
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
    marginBottom: 0,
    marginTop: 0,
    textTransform: "uppercase",
  },

  urgentDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: TAVORIA.color.orange,
    justifyContent: "center",
    alignItems: "center",
  },
  role: { color: TAVORIA.color.navy, fontSize: 16, fontWeight: "700" },
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
