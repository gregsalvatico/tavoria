// Shift detail screen — reached from the worker home feed.
// Shows full shift info + venue + Apply button.

import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import {
  getCurrentWorkerApplicationForShift,
  getCurrentUserContext,
} from "../lib/db";
import { applyToShift } from "../lib/applyShift";
import { t } from "../lib/i18n";
import { localizeContractType } from "../lib/contractTypes";
import { localizeRole, localizeRoles } from "../lib/positions";
import ContactPersonModal from "../components/ContactPersonModal";
import ActionButton from "../components/ActionButton";
import { desktopButtonStyle } from "../lib/responsive";
import StickyFooter from "../components/StickyFooter";
import VenueMediaGallery from "../components/VenueMediaGallery";
import { TAVORIA } from "../lib/designTokens";

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

function venueFallback(type?: string) {
  const key = (type || "cafe").trim().toLowerCase().replace(/\s+/g, "_").replace("café", "cafe");
  return VENUE_TYPE_PHOTOS[key] ?? VENUE_CAFE;
}

export default function ShiftDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const [shift, setShift] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [application, setApplication] = useState<any | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const [heroPreviewOpen, setHeroPreviewOpen] = useState(false);

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

  const onShare = async () => {
    if (!shift) return;
    const venueName = shift.venue?.name ?? t("shift_detail.our_venue");
    const role = localizeRole((shift.roles ?? [])[0]) || t("shift_detail.position_fallback");
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
                id, name, type, city, address, email, phone, venue_style, photo_url, photo_urls, video_urls,
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
      setHeroImageFailed(false);
      setShift(shiftResult.data);
      setApplication(existingApplication);
      setHasAccount(account.hasVenue || account.hasWorker);
    } catch (e: any) {
      setErrorMsg(e?.message ?? t("shift_detail.load_error"));
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
      const result = await applyToShift(shift);
      if (result.kind === "existing") {
        setApplication(result.application);
        setApplying(false);
        return;
      }
      if (result.kind === "created") {
        router.replace({ pathname: "/applied", params: { venueName: result.venueName } });
        return;
      }
      setApplying(false);
      router.push({
        pathname: "/signup",
        params: {
          next: "apply",
          shiftId: result.shiftId,
          venueId: result.venueId,
          venueName: result.venueName,
        },
      });
    } catch (e: any) {
      Alert.alert(
        t("shift_detail.apply_error_title"),
        e?.message ?? t("shift_detail.apply_error_body")
      );
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={isDesktop ? ["top"] : ["top", "bottom"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#F0531C" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !shift) {
    return (
      <SafeAreaView style={styles.safe} edges={isDesktop ? ["top"] : ["top", "bottom"]}>
        <View style={styles.errorWrap}>
          <Feather name="alert-circle" size={40} color="#993556" />
          <Text style={styles.errorTitle}>{t("shift_detail.shift_unavailable")}</Text>
          <Text style={styles.errorSub}>
            {errorMsg ?? t("shift_detail.shift_cancelled")}
          </Text>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) { router.back(); return; }
              router.replace("/");
            }}
            style={[styles.backPrimaryBtn, isDesktop && desktopButtonStyle]}
          >
            <Text style={styles.backPrimaryTxt}>{t("shift_detail.back_to_shifts")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const v = shift.venue;
  // Some venue rows keep the primary image in photo_urls while older rows use
  // photo_url. Normalize both shapes so a shift always has a real hero image.
  const venuePhotoUrls = Array.from(
    new Set(
      [v?.photo_url, ...(v?.photo_urls ?? [])].filter(
        (url): url is string => typeof url === "string" && url.trim().length > 0
      )
    )
  );
  const primaryPhotoUrl = venuePhotoUrls[0];
  const additionalVenuePhotoUrls = primaryPhotoUrl ? venuePhotoUrls.slice(1) : [];
  const shiftPhotoUrls = (shift.photo_urls ?? []).filter((url: unknown): url is string => typeof url === "string" && url.trim().length > 0);
  const shiftVideoUrls = (shift.video_urls ?? []).filter((url: unknown): url is string => typeof url === "string" && url.trim().length > 0);
  const previewPhotoUrls = Array.from(new Set([...additionalVenuePhotoUrls, ...shiftPhotoUrls]));
  const previewVideoUrls = Array.from(new Set([...(v?.video_urls ?? []), ...shiftVideoUrls].filter((url): url is string => typeof url === "string" && url.trim().length > 0)));
  const photo = primaryPhotoUrl
    ? { uri: primaryPhotoUrl }
    : venueFallback(v?.type);
  const heroSource = heroImageFailed ? venueFallback(v?.type) : photo;

  const isUrgent =
    shift.start_when === "now" || shift.start_when === "asap";
  const payStr =
    shift.pay_amount && shift.pay_unit
      ? `€${shift.pay_amount} / ${payUnitLabel(shift.pay_unit)}`
      : t("shift_detail.pay_discussed");
  const roleStr = localizeRoles(shift.roles ?? []).join(" · ") || t("shift_detail.default_shift");
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
      : t("shift_detail.application_pending");
  const applicationIcon =
    applicationStatus === "hired"
      ? "check-circle"
      : applicationStatus === "declined"
      ? "x-circle"
      : "clock";
  return (
    <SafeAreaView style={styles.safe} edges={isDesktop ? ["top"] : ["top", "bottom"]}>
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
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
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={isDesktop && styles.detailGrid}>
          <View style={[styles.mediaColumn, isDesktop && styles.mediaColumnDesktop]}>
            {/* Hero */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("talent.photos")}
              onPress={() => setHeroPreviewOpen(true)}
              style={[styles.hero, isDesktop && styles.heroDesktop]}
            >
              <Image
                source={heroSource}
                onError={() => {
                  if (primaryPhotoUrl) setHeroImageFailed(true);
                }}
                style={[styles.heroImg, isDesktop && styles.heroImgDesktop]}
              />
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
            </Pressable>

          <VenueMediaGallery
            photoUrls={previewPhotoUrls}
            videoUrls={previewVideoUrls}
          />
        </View>

        <View style={[styles.card, isDesktop && styles.cardDesktop]}>
          <View style={styles.titleRow}>
            <Pressable
              disabled={!shift.venue_id}
              onPress={() => router.push({ pathname: "/venue-board", params: { venueId: shift.venue_id } })}
              style={styles.venueNameLink}
            >
              <Text style={styles.venueName}>{v?.name ?? t("shift_detail.default_venue")}</Text>
              <Feather name="arrow-up-right" size={19} color="#185FA5" />
            </Pressable>
            {isOwner ? (
              <View style={styles.ownerActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("shift_owner.edit")}
                  onPress={() => router.push({ pathname: "/shift-edit", params: { id } })}
                  style={({ hovered, pressed }) => [styles.iconAction, hovered && styles.iconActionHovered, pressed && styles.iconActionPressed]}
                >
                  <Feather name="edit-2" size={16} color="#0E1A24" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("shift_owner.share")}
                  onPress={onShare}
                  style={({ hovered, pressed }) => [styles.iconAction, hovered && styles.iconActionHovered, pressed && styles.iconActionPressed]}
                >
                  <Feather name="share-2" size={16} color="#0E1A24" />
                </Pressable>
              </View>
            ) : null}
          </View>
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
          <KV icon="calendar" label={t("shift_detail.days")} last={!shift.contract_type}>
            {daysStr}
          </KV>
          {shift.contract_type && (
            <KV icon="file-text" label={t("shift_detail.contract")} last>
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
        </View>

      </ScrollView>

      {!isOwner ? (
        <StickyFooter desktopRow>
          {application ? (
            <ActionButton
              label={
                applicationStatus === "interview_requested"
                  ? hasContactMethod
                    ? t("shift_detail.contact_venue")
                    : t("shift_detail.contact_details_unavailable")
                  : applicationStateLabel
              }
              icon={canOpenContact ? "message-circle" : applicationIcon}
              onPress={() => canOpenContact && setContactOpen(true)}
              disabled={!canOpenContact}
              style={[styles.applyBtn, isDesktop && desktopButtonStyle, canOpenContact ? styles.contactBtn : styles.applicationStatusBtn]}
            />
          ) : (
            <ActionButton
              label={t("shift_detail.apply_now")}
              icon="arrow-right"
              loading={applying}
              onPress={onApply}
              style={[styles.applyBtn, isDesktop && desktopButtonStyle]}
            />
          )}
        </StickyFooter>
      ) : null}

      <ContactPersonModal
        visible={contactOpen}
        onClose={() => setContactOpen(false)}
        name={v?.name ?? t("shift_detail.default_venue")}
        email={venueEmail}
        phone={venuePhone}
        visitAddress={visitAddress}
        initialMessage={t("shift_detail.follow_up_message", {
          venue: v?.name ?? t("shift_detail.default_venue"),
          role: roleStr,
        })}
      />

      <Modal visible={heroPreviewOpen} transparent animationType="fade" onRequestClose={() => setHeroPreviewOpen(false)}>
        <View style={styles.previewModal}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("talent.close")}
            onPress={() => setHeroPreviewOpen(false)}
            style={styles.previewBackdrop}
          />
          <Image source={heroSource} resizeMode="contain" style={styles.previewImage} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("talent.close")}
            onPress={() => setHeroPreviewOpen(false)}
            style={styles.previewClose}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </Modal>

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
          <Text style={styles.contactDetailsTitle}>
            {unlocked ? t("shift_detail.venue_contact_details") : t("shift_detail.venue_contact_details_locked")}
          </Text>
          <Text style={styles.contactDetailsSub}>
            {unlocked ? t("shift_detail.contact_details_open_sub") : t("shift_detail.contact_details_locked_sub")}
          </Text>
        </View>
      </View>
      {unlocked ? (
        email || phone || visitAddress ? (
          <View style={styles.contactMethodList}>
            {email ? <ContactMethod icon="mail" label={t("shift_detail.contact_email")} value={email} /> : null}
            {phone ? <ContactMethod icon="phone" label={t("shift_detail.contact_phone")} value={phone} /> : null}
            {visitAddress ? <ContactMethod icon="map-pin" label={t("shift_detail.contact_visit")} value={visitAddress} /> : null}
          </View>
        ) : (
          <Text style={styles.contactNone}>{t("shift_detail.contact_none")}</Text>
        )
      ) : null}
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
  last = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  if (children === null || children === undefined || (typeof children === "string" && !children.trim())) {
    return null;
  }
  return (
    <View style={[styles.kv, !last && styles.kvDivider]}>
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
  safe: { flex: 1, backgroundColor: TAVORIA.color.paperDeep },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerDesktop: { paddingHorizontal: 24 },
  iconBtn: { padding: 4, width: 32 },

  scroll: { paddingHorizontal: 14, paddingBottom: 20 },
  scrollDesktop: { paddingHorizontal: 24, paddingBottom: 20 },
  detailGrid: { alignItems: "flex-start", flexDirection: "row", gap: 24, maxWidth: 1180, alignSelf: "center", width: "100%" },
  mediaColumn: { minWidth: 0, width: "100%" },
  mediaColumnDesktop: { flex: 1, width: 0 },

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
    alignSelf: "center",
    marginTop: 16,
    backgroundColor: TAVORIA.color.orange,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    width: "100%",
  },
  backPrimaryTxt: { color: "white", fontWeight: "800", fontSize: 15 },

  hero: {
    borderRadius: TAVORIA.radius.large,
    overflow: "hidden",
    backgroundColor: "#0E1A24",
    marginBottom: 14,
    position: "relative",
  },
  heroDesktop: { height: 360, marginBottom: 0, minWidth: 0, width: "100%" },
  heroImgDesktop: { height: "100%" },
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
    backgroundColor: TAVORIA.color.white,
    borderRadius: TAVORIA.radius.medium,
    padding: 20,
    gap: 14,
    borderWidth: 0.5,
    borderColor: TAVORIA.color.border,
  },
  cardDesktop: { flex: 1, minWidth: 0 },
  venueName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.4,
  },
  titleRow: { alignItems: "center", flexDirection: "row", gap: 12, justifyContent: "space-between" },
  venueNameLink: { alignItems: "center", flex: 1, flexDirection: "row", gap: 7, minWidth: 0 },
  ownerActions: { flexDirection: "row", gap: 8 },
  iconAction: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "rgba(14,26,36,0.16)", borderRadius: 22, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  iconActionHovered: { backgroundColor: TAVORIA.color.paperDeep },
  iconActionPressed: { opacity: 0.72 },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  tag: {
    backgroundColor: TAVORIA.color.paperDeep,
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
    backgroundColor: TAVORIA.color.orangeSoft,
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

  kv: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 12 },
  kvDivider: { borderBottomColor: TAVORIA.color.border, borderBottomWidth: StyleSheet.hairlineWidth },
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

  contactDetails: { borderRadius: 14, marginTop: 4, padding: 13 },
  contactDetailsOpen: { backgroundColor: TAVORIA.color.orangeSoft, borderColor: "#F7C7AB", borderWidth: 1 },
  contactDetailsLocked: { backgroundColor: "#EAE7DF", borderColor: "#DED8CC", borderWidth: 1 },
  contactDetailsHead: { alignItems: "flex-start", flexDirection: "row", gap: 9 },
  contactDetailsIcon: { alignItems: "center", borderRadius: 9, height: 31, justifyContent: "center", width: 31 },
  contactDetailsIconOpen: { backgroundColor: "#FFE1CE" },
  contactDetailsIconLocked: { backgroundColor: "#DDD6C9" },
  contactDetailsTitle: { color: "#0E1A24", fontSize: 13, fontWeight: "800" },
  contactDetailsSub: { color: "#5D6670", fontSize: 11, lineHeight: 15, marginTop: 2 },
  contactMethodList: { gap: 9, marginTop: 12 },
  contactMethod: { alignItems: "flex-start", backgroundColor: "white", borderRadius: 10, flexDirection: "row", gap: 8, padding: 9 },
  contactMethodLabel: { color: "#6B7280", fontSize: 10, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  contactMethodValue: { color: "#0E1A24", fontSize: 12, lineHeight: 17, marginTop: 1 },
  contactNone: { color: "#6B7280", fontSize: 12, marginTop: 10 },
  previewModal: { alignItems: "center", backgroundColor: "rgba(14,26,36,.96)", flex: 1, justifyContent: "center", padding: 24 },
  previewBackdrop: { ...StyleSheet.absoluteFillObject },
  previewClose: { elevation: 10, padding: 12, position: "absolute", right: 24, top: 24, zIndex: 10 },
  previewImage: { height: "82%", maxWidth: 960, width: "100%" },

  bottom: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 0,
    paddingTop: 12,
    backgroundColor: "white",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  applyBtn: { minWidth: 220 },
  applicationStatusBtn: { backgroundColor: "#6B7280" },
  contactBtn: { backgroundColor: "#0E1A24" },

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
