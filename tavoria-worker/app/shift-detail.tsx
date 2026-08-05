// Shift detail screen — reached from /discover row tap.
// Shows full shift info + venue + Apply button.

import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import {
  createApplication,
  getCurrentWorkerApplicationForShift,
  getCurrentWorkerFull,
  getCurrentUserContext,
  updateShiftStatus,
} from "../lib/db";
import { t } from "../lib/i18n";
import { localizeContractType } from "../lib/contractTypes";
import { localizeRole, localizeRoles } from "../lib/positions";
import ContactPersonModal from "../components/ContactPersonModal";

const VENUE_CAFE = require("../assets/venue-cafe.png");
const VENUE_TYPE_PHOTOS: Record<string, number> = {
  cafe: VENUE_CAFE,
  bar: require("../assets/venue-bar.png"),
  restaurant: require("../assets/venue-restaurant.png"),
  hotel: require("../assets/venue-hotel.png"),
  club: require("../assets/venue-club.png"),
  beach_club: require("../assets/venue-beach.png"),
};

// Per-render, localized day labels — read via t() at call site so they react
// to the language picker.
function dayShortLabel(code: string): string {
  const v = t(`shift_detail.days_short.${code}`);
  return v && !v.includes(".") ? v : code;
}

function payUnitLabel(unit: string): string {
  const v = t(`shift_detail.pay_unit.${unit}`);
  return v && !v.includes(".") ? v : unit;
}

function payScheduleLabel(schedule: string): string {
  const normalized = schedule.trim().toLowerCase();
  const key =
    normalized === "sameday" || normalized === "same day" || normalized === "daily"
      ? "daily"
      : normalized === "weekly"
      ? "weekly"
      : normalized === "monthly"
      ? "monthly"
      : null;
  if (!key) return schedule;
  const value = t(`pay_schedule.${key}`);
  return value && !value.includes("[missing") ? value : schedule;
}

export default function ShiftDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [shift, setShift] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [shiftStatus, setShiftStatus] = useState<"live" | "paused">("live");
  const [application, setApplication] = useState<any | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);

  // Determine if the current signed-in user owns the venue that posted this shift
  useEffect(() => {
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user.id;
        if (userId && shift?.venue?.user_id === userId) {
          setIsOwner(true);
        }
      } catch {}
    })();
  }, [shift?.venue?.user_id]);

  useEffect(() => {
    if (shift?.status) setShiftStatus(shift.status);
  }, [shift?.status]);

  const toggleStatus = async () => {
    if (!id) return;
    const next = shiftStatus === "live" ? "paused" : "live";
    setShiftStatus(next);
    try {
      await updateShiftStatus(id, next);
    } catch (e) {
      // Revert on error
      setShiftStatus(shiftStatus);
      Alert.alert("Could not update status", "Try again.");
    }
  };

  const onShare = async () => {
    if (!shift) return;
    const venueName = shift.venue?.name ?? "our venue";
    const role = localizeRole((shift.roles ?? [])[0]) || "a position";
    try {
      await Share.share({
        message: `${t("shift_owner.share_msg")} ${venueName} — ${role}.\n${Linking.createURL(`shift-detail?id=${encodeURIComponent(id)}`)}`,
      });
    } catch {}
  };

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const [shiftResult, existingApplication, account] = await Promise.all([
        supabase
          .from("shifts")
          .select(
            `
              *,
              venue:venues(
                id, name, type, city, address, email, phone, venue_style, photo_url,
                pay_schedule, roles, user_id,
                contact_email_enabled, contact_phone_enabled, contact_in_person_enabled
              )
            `
          )
          .eq("id", id)
          .maybeSingle(),
        getCurrentWorkerApplicationForShift(id).catch(() => null),
        getCurrentUserContext().catch(() => ({ hasVenue: false, hasWorker: false })),
      ]);
      if (shiftResult.error) throw shiftResult.error;
      setShift(shiftResult.data);
      setApplication(existingApplication);
      setHasAccount(account.hasVenue || account.hasWorker);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Could not load shift.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // A venue can update an application's status while the worker is elsewhere
  // in the app. Reload whenever this detail screen regains focus so the
  // action always reflects the current database status.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onApply = async () => {
    if (!shift) return;
    setApplying(true);
    try {
      // Already a worker? Apply directly (no need to redo photo/video)
      const existing = await getCurrentWorkerFull();
      if (existing?.id) {
        const prior = await getCurrentWorkerApplicationForShift(shift.id);
        if (prior) {
          setApplication(prior);
          setApplying(false);
          return;
        }
        await createApplication({
          worker_id: existing.id,
          venue_id: shift.venue_id,
          shift_id: shift.id,
        });
        setApplying(false);
        router.replace({
          pathname: "/applied",
          params: { venueName: shift.venue?.name ?? "" },
        });
        return;
      }
      // Not signed up yet — route through signup → record → application
      setApplying(false);
      router.push({
        pathname: "/signup",
        params: {
          next: "apply",
          shiftId: shift.id,
          venueId: shift.venue_id,
          venueName: shift.venue?.name ?? "",
        },
      });
    } catch (e: any) {
      Alert.alert(
        "Could not apply",
        e?.message ?? "Try again in a moment."
      );
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#F0531C" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !shift) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.errorWrap}>
          <Feather name="alert-circle" size={40} color="#993556" />
          <Text style={styles.errorTitle}>Shift not available</Text>
          <Text style={styles.errorSub}>
            {errorMsg ?? "This shift might have been filled or cancelled."}
          </Text>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) { router.back(); return; }
              router.replace("/");
            }}
            style={styles.backPrimaryBtn}
          >
            <Text style={styles.backPrimaryTxt}>Back to shifts</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const v = shift.venue;
  const photo = v?.photo_url
    ? { uri: v.photo_url }
    : VENUE_TYPE_PHOTOS[(v?.type || "cafe").toLowerCase()] ?? VENUE_CAFE;

  const isUrgent =
    shift.start_when === "now" || shift.start_when === "asap";
  const payStr =
    shift.pay_amount && shift.pay_unit
      ? `€${shift.pay_amount} / ${payUnitLabel(shift.pay_unit)}`
      : t("shift_detail.pay_discussed");
  const roleStr = localizeRoles(shift.roles ?? []).join(" · ") || "Shift";
  const hoursStr =
    shift.hours_start && shift.hours_end
      ? `${shift.hours_start} – ${shift.hours_end}`
      : t("shift_detail.hours_flexible");
  const daysStr =
    (shift.days ?? [])
      .map((d: string) => dayShortLabel(d))
      .join(" · ") || t("shift_detail.any_day");
  const canContactVenue =
    application?.status === "interview_requested" || application?.status === "hired";
  const venueEmail = canContactVenue && v?.contact_email_enabled !== false ? v?.email : undefined;
  const venuePhone = canContactVenue && v?.contact_phone_enabled !== false ? v?.phone : undefined;
  const visitAddress = canContactVenue && v?.contact_in_person_enabled === true ? v?.address : undefined;
  const hasContactMethod = !!(venueEmail || venuePhone || visitAddress);
  const applicationStatus = application?.status;
  const canOpenContact = applicationStatus === "interview_requested" && hasContactMethod;
  const applicationStateLabel =
    applicationStatus === "hired"
      ? t("candidate_actions.status_hired")
      : applicationStatus === "declined"
      ? t("candidate_actions.status_declined")
      : "Application sent — awaiting reply";
  const applicationIcon =
    applicationStatus === "hired"
      ? "check-circle"
      : applicationStatus === "declined"
      ? "x-circle"
      : "clock";
  const applicationLabel = application?.status === "declined"
    ? "This application is closed"
    : "Application sent — awaiting reply";

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
        {isOwner ? (
          <View style={styles.statusPillWrap}>
            <Text style={styles.statusHint}>
              {t(shiftStatus === "live" ? "shift_owner.tap_to_pause" : "shift_owner.tap_to_resume")}
            </Text>
            <Pressable
              onPress={toggleStatus}
              style={[
                styles.statusPill,
                shiftStatus === "live" ? styles.statusLive : styles.statusPaused,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  shiftStatus === "live"
                    ? styles.statusDotLive
                    : styles.statusDotPaused,
                ]}
              />
              <Text
                style={[
                  styles.statusTxt,
                  shiftStatus === "live"
                    ? styles.statusTxtLive
                    : styles.statusTxtPaused,
                ]}
              >
                {t(
                  shiftStatus === "live"
                    ? "shift_owner.live"
                    : "shift_owner.paused"
                )}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={photo} style={styles.heroImg} />
          {isUrgent && (
            <View style={styles.urgentBanner}>
              <Feather name="zap" size={14} color="white" />
              <Text style={styles.urgentBannerTxt}>
                {shift.start_when === "now"
                  ? t("shift_detail.need_now_banner")
                  : t("shift_detail.asap_banner")}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Pressable
            disabled={!shift.venue_id}
            onPress={() => router.push({ pathname: "/venue-board", params: { venueId: shift.venue_id } })}
            style={styles.venueNameLink}
          >
            <Text style={styles.venueName}>{v?.name ?? "Venue"}</Text>
            <Feather name="arrow-up-right" size={19} color="#185FA5" />
          </Pressable>
          <View style={styles.metaRow}>
            {v?.type && (
              <Tag>{(() => {
                const k = `venue_type.${v.type.toLowerCase()}`;
                const val = t(k);
                return val && !val.includes(".") ? val : v.type;
              })()}</Tag>
            )}
            {v?.venue_style && (
              <Tag>{(() => {
                const k = `venue_style.${v.venue_style.toLowerCase()}`;
                const val = t(k);
                return val && !val.includes(".") ? val : v.venue_style;
              })()}</Tag>
            )}
            {v?.city && (
              <View style={styles.iconRow}>
                <Feather name="map-pin" size={12} color="#6B7280" />
                <Text style={styles.metaTxt}>{v.city}</Text>
              </View>
            )}
          </View>

          {/* Big pay block */}
          <Pressable
            style={[styles.paySection, !hasAccount && styles.paySectionLocked]}
            onPress={() => {
              if (!hasAccount) router.push("/signin");
            }}
            disabled={hasAccount}
          >
            <Text style={styles.paySectionLbl}>{t("shift_detail.pay_label")}</Text>
            {hasAccount ? <Text style={styles.paySectionVal}>{payStr}</Text> : (
              <View style={styles.payLockedDetail}>
                <Feather name="lock" size={15} color="#F0531C" />
                <Text style={styles.payLockedDetailTxt}>{t("shift_detail.pay_signin")}</Text>
              </View>
            )}
            {hasAccount && v?.pay_schedule && (
              <Text style={styles.paySectionMeta}>
                {t("shift_detail.paid_prefix", {
                  schedule: payScheduleLabel(v.pay_schedule),
                })}
              </Text>
            )}
          </Pressable>

          <KV icon="briefcase" label={t("shift_detail.position")}>
            {roleStr}
          </KV>
          <KV icon="clock" label={t("shift_detail.hours")}>
            {hoursStr}
          </KV>
          <KV icon="calendar" label={t("shift_detail.days")}>
            {daysStr}
          </KV>
          {shift.contract_type && (
            <KV icon="file-text" label={t("shift_detail.contract")}>
              {localizeContractType(shift.contract_type)}
            </KV>
          )}
          <VenueContactDetails
            unlocked={canContactVenue}
            email={venueEmail}
            phone={venuePhone}
            visitAddress={visitAddress}
          />
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        {isOwner ? (
          <View style={styles.ownerBar}>
            <OwnerAction
              icon="edit-2"
              label={t("shift_owner.edit")}
              color="white"
              bg="#F0531C"
              onPress={() => router.push({ pathname: "/shift-edit", params: { id } })}
            />
            <OwnerAction
              icon="share-2"
              label={t("shift_owner.share")}
              color="#0E1A24"
              bg="#F1EFE8"
              onPress={onShare}
            />
          </View>
        ) : (
          application ? (
            <Pressable
              onPress={() => canOpenContact && setContactOpen(true)}
              disabled={!canOpenContact}
              style={[styles.applyBtn, canOpenContact ? styles.contactBtn : styles.applicationStatusBtn]}
            >
              <Text style={styles.applyTxt}>
                {applicationStatus === "interview_requested"
                  ? hasContactMethod
                    ? "Contact venue"
                    : "Contact details unavailable"
                  : applicationStateLabel}
              </Text>
              <Feather
                name={canOpenContact ? "message-circle" : applicationIcon}
                size={19}
                color="#F7F4EE"
              />
            </Pressable>
          ) : (
            <Pressable
              onPress={onApply}
              disabled={applying}
              style={[styles.applyBtn, applying && { opacity: 0.6}]}
            >
              {applying ? (
                <ActivityIndicator color="#F7F4EE" />
              ) : (
                <>
                  <Text style={styles.applyTxt}>{t("shift_detail.apply_now")}</Text>
                  <Feather name="arrow-right" size={20} color="#F7F4EE" />
                </>
              )}
            </Pressable>
          )
        )}
      </View>

      <ContactPersonModal
        visible={contactOpen}
        onClose={() => setContactOpen(false)}
        name={v?.name ?? "venue"}
        email={venueEmail}
        phone={venuePhone}
        visitAddress={visitAddress}
        initialMessage={`Hi ${v?.name ?? ""}, I’m following up about the ${roleStr} shift.`.trim()}
      />

    </SafeAreaView>
  );
}

function VenueContactDetails({
  unlocked,
  email,
  phone,
  visitAddress,
}: {
  unlocked: boolean;
  email?: string | null;
  phone?: string | null;
  visitAddress?: string | null;
}) {
  return (
    <View style={[styles.contactDetails, unlocked ? styles.contactDetailsOpen : styles.contactDetailsLocked]}>
      <View style={styles.contactDetailsHead}>
        <View style={[styles.contactDetailsIcon, unlocked ? styles.contactDetailsIconOpen : styles.contactDetailsIconLocked]}>
          <Feather name={unlocked ? "unlock" : "lock"} size={15} color={unlocked ? "#F0531C" : "#854F0B"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactDetailsTitle}>{unlocked ? "Venue contact details" : "Venue contact details locked"}</Text>
          <Text style={styles.contactDetailsSub}>{unlocked ? "Use any method the venue has enabled below." : "The venue will share these after it requests an interview or hires you."}</Text>
        </View>
      </View>
      {unlocked ? (
        email || phone || visitAddress ? (
          <View style={styles.contactMethodList}>
            {email ? <ContactMethod icon="mail" label="Email" value={email} /> : null}
            {phone ? <ContactMethod icon="phone" label="Phone & WhatsApp" value={phone} /> : null}
            {visitAddress ? <ContactMethod icon="map-pin" label="Visit in person" value={visitAddress} /> : null}
          </View>
        ) : (
          <Text style={styles.contactNone}>This venue has not enabled a contact method yet.</Text>
        )
      ) : (
        <View style={styles.contactLockedPlaceholders}>
          <Text style={styles.contactPlaceholder}>••••••@••••••••</Text>
          <Text style={styles.contactPlaceholder}>••• ••• •••••</Text>
        </View>
      )}
    </View>
  );
}

function ContactMethod({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.contactMethod}>
      <Feather name={icon} size={15} color="#0E1A24" />
      <View style={{ flex: 1 }}>
        <Text style={styles.contactMethodLabel}>{label}</Text>
        <Text style={styles.contactMethodValue}>{value}</Text>
      </View>
    </View>
  );
}

function OwnerAction({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.ownerTile, { backgroundColor: bg, borderColor: color }]}
      onPress={onPress}
    >
      <Feather name={icon} size={19} color={color} />
      <Text style={[styles.ownerTileLbl, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagTxt}>{children}</Text>
    </View>
  );
}

function KV({
  icon,
  label,
  children,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.kv}>
      <View style={styles.kvIcon}>
        <Feather name={icon} size={14} color="#0E1A24" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.kvLabel}>{label}</Text>
        <Text style={styles.kvValue}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconBtn: { padding: 4, width: 32 },

  scroll: { paddingHorizontal: 14, paddingBottom: 20 },

  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0E1A24",
    marginTop: 8,
  },
  errorSub: { color: "#6B7280", fontSize: 13, textAlign: "center" },
  backPrimaryBtn: {
    marginTop: 16,
    backgroundColor: "#F0531C",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  backPrimaryTxt: { color: "white", fontWeight: "800", fontSize: 15 },

  hero: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0E1A24",
    marginBottom: 14,
    position: "relative",
  },
  heroImg: { width: "100%", height: 220 },
  urgentBanner: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E24B4A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  urgentBannerTxt: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  venueName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.4,
  },
  venueNameLink: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 7 },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  tag: {
    backgroundColor: "#F1EFE8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagTxt: { fontSize: 11, fontWeight: "700", color: "#0E1A24" },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaTxt: { fontSize: 12, color: "#6B7280" },

  paySection: {
    backgroundColor: "#FFF4EE",
    padding: 14,
    borderRadius: 14,
    marginVertical: 4,
  },
  paySectionLbl: {
    fontSize: 11,
    fontWeight: "800",
    color: "#F0531C",
    letterSpacing: 1.4,
  },
  paySectionVal: {
    fontSize: 26,
    fontWeight: "900",
    color: "#F0531C",
    marginTop: 4,
    letterSpacing: -0.6,
  },
  paySectionMeta: { fontSize: 12, color: "#854F0B", marginTop: 4 },
  paySectionLocked: { backgroundColor: "#FFF4EE", borderColor: "#F7C7AB", borderWidth: 1 },
  payLockedDetail: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 5 },
  payLockedDetailTxt: { color: "#C2410C", fontSize: 15, fontWeight: "800" },

  kv: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  kvIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F1EFE8",
    justifyContent: "center",
    alignItems: "center",
  },
  kvLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0.8,
  },
  kvValue: { fontSize: 14, color: "#0E1A24", marginTop: 1, fontWeight: "500" },

  contactDetails: { borderRadius: 14, marginTop: 2, padding: 13 },
  contactDetailsOpen: { backgroundColor: "#FFF4EE", borderColor: "#F7C7AB", borderWidth: 1 },
  contactDetailsLocked: { backgroundColor: "#F1EFE8", borderColor: "#E2DED3", borderWidth: 1 },
  contactDetailsHead: { alignItems: "flex-start", flexDirection: "row", gap: 9 },
  contactDetailsIcon: { alignItems: "center", borderRadius: 9, height: 31, justifyContent: "center", width: 31 },
  contactDetailsIconOpen: { backgroundColor: "#FFE1CE" },
  contactDetailsIconLocked: { backgroundColor: "#E7E2D7" },
  contactDetailsTitle: { color: "#0E1A24", fontSize: 13, fontWeight: "800" },
  contactDetailsSub: { color: "#5D6670", fontSize: 11, lineHeight: 15, marginTop: 2 },
  contactMethodList: { gap: 9, marginTop: 12 },
  contactMethod: { alignItems: "flex-start", backgroundColor: "white", borderRadius: 10, flexDirection: "row", gap: 8, padding: 9 },
  contactMethodLabel: { color: "#6B7280", fontSize: 10, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  contactMethodValue: { color: "#0E1A24", fontSize: 12, lineHeight: 17, marginTop: 1 },
  contactNone: { color: "#6B7280", fontSize: 12, marginTop: 10 },
  contactLockedPlaceholders: { flexDirection: "row", gap: 12, marginTop: 12 },
  contactPlaceholder: { color: "#9CA3AF", fontSize: 12, letterSpacing: 1, textDecorationLine: "line-through" },

  bottom: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "white",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0531C",
    borderRadius: 999,
    paddingVertical: 18,
  },
  applicationStatusBtn: { backgroundColor: "#6B7280" },
  contactBtn: { backgroundColor: "#0E1A24" },
  applyTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "800" },

  // Live / Paused status pill in the header
  statusPillWrap: { alignItems: "center", flexDirection: "row", gap: 8 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusLive: {
    backgroundColor: "#EAF3DE",
    borderColor: "#3B6D11",
  },
  statusPaused: {
    backgroundColor: "#F1EFE8",
    borderColor: "rgba(11,15,26,0.20)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusDotLive: { backgroundColor: "#3B6D11" },
  statusDotPaused: { backgroundColor: "#6B7280" },
  statusTxt: { fontSize: 12, fontWeight: "800" },
  statusTxtLive: { color: "#3B6D11" },
  statusTxtPaused: { color: "#6B7280" },
  statusHint: {
    fontSize: 10,
    color: "#9CA3AF",
    letterSpacing: 0.1,
  },

  // Owner bottom action bar — 4 colored squared tiles
  ownerBar: {
    flexDirection: "column",
    gap: 8,
  },
  ownerTile: {
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 18,
    width: "100%",
  },
  ownerTileLbl: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  // QR modal sheet
  qrBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  qrSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  qrGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignSelf: "center",
    marginBottom: 14,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0E1A24",
    textAlign: "center",
  },
  qrSub: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  qrImageWrap: {
    width: 240,
    height: 240,
    alignSelf: "center",
    marginTop: 18,
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  qrImage: { width: "100%", height: "100%" },
  qrUrl: {
    marginTop: 10,
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
  },
  qrShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0531C",
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 16,
  },
  qrShareTxt: { color: "white", fontSize: 15, fontWeight: "700" },
  qrCloseBtn: { alignItems: "center", paddingVertical: 10, marginTop: 4 },
  qrCloseTxt: { color: "#6B7280", fontSize: 14, fontWeight: "600" },
});
