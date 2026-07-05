// Shift detail screen — reached from /discover row tap.
// Shows full shift info + venue + Apply button.

import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
  getCurrentWorkerFull,
  updateShiftStatus,
} from "../lib/db";
import { t } from "../lib/i18n";
import { localizeRole, localizeRoles } from "../lib/positions";

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

export default function ShiftDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [shift, setShift] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [shiftStatus, setShiftStatus] = useState<"live" | "paused">("live");

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
        message: `${t("shift_owner.share_msg")} ${venueName} — ${role}. Apply on Tavoria.`,
      });
    } catch {}
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("shifts")
          .select(
            `
            *,
            venue:venues(
              id, name, type, city, address, venue_style, photo_url,
              pay_schedule, roles, user_id
            )
          `
          )
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        setShift(data);
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Could not load shift.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onApply = async () => {
    if (!shift) return;
    setApplying(true);
    try {
      // Already a worker? Apply directly (no need to redo photo/video)
      const existing = await getCurrentWorkerFull();
      if (existing?.id) {
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
              router.replace("/discover");
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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) { router.back(); return; }
            router.replace("/discover");
          }}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        {isOwner ? (
          <Pressable onPress={toggleStatus} style={styles.statusPillWrap}>
            <View
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
            </View>
            <Text style={styles.statusHint}>
              {t(
                shiftStatus === "live"
                  ? "shift_owner.tap_to_pause"
                  : "shift_owner.tap_to_resume"
              )}
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
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
          <Text style={styles.venueName}>{v?.name ?? "Venue"}</Text>
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
          <View style={styles.paySection}>
            <Text style={styles.paySectionLbl}>{t("shift_detail.pay_label")}</Text>
            <Text style={styles.paySectionVal}>{payStr}</Text>
            {v?.pay_schedule && (
              <Text style={styles.paySectionMeta}>
                {t("shift_detail.paid_prefix").replace(
                  "{{schedule}}",
                  v.pay_schedule.toLowerCase()
                )}
              </Text>
            )}
          </View>

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
              {shift.contract_type}
            </KV>
          )}
          {v?.address && (
            <KV icon="map-pin" label={t("shift_detail.address")}>
              {v.address}
            </KV>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        {isOwner ? (
          <View style={styles.ownerBar}>
            <OwnerAction
              icon="users"
              label={t("shift_owner.view_candidates")}
              color="#185FA5"
              bg="#D9E7F5"
              onPress={() =>
                router.push({
                  pathname: "/venue-inbox",
                  params: { shiftId: id },
                })
              }
            />
            <OwnerAction
              icon="edit-2"
              label={t("shift_owner.edit")}
              color="#F0531C"
              bg="#FFD8BE"
              onPress={() =>
                Alert.alert(
                  t("shift_detail.edit_title"),
                  t("shift_detail.edit_msg")
                )
              }
            />
            <OwnerAction
              icon="share-2"
              label={t("shift_owner.share")}
              color="#534AB7"
              bg="#EEEDFE"
              onPress={onShare}
            />
          </View>
        ) : (
          <Pressable
            onPress={onApply}
            disabled={applying}
            style={[styles.applyBtn, applying && { opacity: 0.6 }]}
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
        )}
      </View>

    </SafeAreaView>
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
      <Feather name={icon} size={22} color={color} />
      <Text style={[styles.ownerTileLbl, { color }]} numberOfLines={2}>
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

  bottom: {
    padding: 16,
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
  applyTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "800" },

  // Live / Paused status pill in the header
  statusPillWrap: { alignItems: "flex-end" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    marginTop: 4,
    marginRight: 2,
  },

  // Owner bottom action bar — 4 colored squared tiles
  ownerBar: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  ownerTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  ownerTileLbl: {
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.2,
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
