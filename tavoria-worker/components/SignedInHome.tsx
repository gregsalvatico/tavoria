import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getDiscoverShifts,
  getDiscoverWorkers,
  getAppliedShiftIdsForCurrentWorker,
  getAppliedWorkerIdsForVenue,
  type WorkerStatusCounts,
} from "../lib/db";
import { LANGUAGES, type Language, t } from "../lib/i18n";
import { localizeRoles } from "../lib/positions";
import AppBottomNav from "./AppBottomNav";
import FilterChips from "./FilterChips";
import {
  matchesShiftTime,
  getShiftTimeFilters,
  type ShiftTimeFilter,
} from "../lib/shiftFilters";

const VENUE_TYPE_PHOTOS: Record<string, number> = {
  cafe: require("../assets/venue-cafe.png"),
  bar: require("../assets/venue-bar.png"),
  restaurant: require("../assets/venue-restaurant.png"),
  hotel: require("../assets/venue-hotel.png"),
  club: require("../assets/venue-club.png"),
  beach_club: require("../assets/venue-beach.png"),
};

type AccountContext = {
  username?: string;
  hasVenue: boolean;
  venueName?: string;
  venueId?: string;
  venueCity?: string;
  venueType?: string;
  venuePhotoUrl?: string;
  hasWorker: boolean;
  workerName?: string;
  workerId?: string;
  workerCity?: string;
  workerPhotoUrl?: string;
};

type ShiftRow = {
  id: string;
  roles?: string[];
  pay_amount?: number;
  pay_unit?: string;
  days?: string[];
  start_when?: string;
  start_date?: string;
  status?: string;
  venue?: {
    id?: string;
    name?: string;
    type?: string;
    city?: string;
    photo_url?: string;
  };
};

type WorkerRow = {
  id: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  video_url?: string;
  positions?: string[];
  languages?: string[];
  city?: string;
  age_range?: string;
  years_exp?: string;
};

type CandidateFilter = "all" | "applied" | "not_applied";

type Props = {
  ctx: AccountContext;
  lang: Language;
  pendingCount: number;
  workerCounts: WorkerStatusCounts;
  proEligible: boolean;
  onChangeLanguage: (language: Language) => Promise<void>;
  onPrintQr: () => Promise<void>;
  onShare: () => Promise<void>;
  onSignOut: () => Promise<void>;
};

export default function SignedInHome({
  ctx,
  lang,
  pendingCount,
  workerCounts,
  proEligible,
  onChangeLanguage,
  onPrintQr,
  onShare,
  onSignOut,
}: Props) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [rows, setRows] = useState<ShiftRow[]>([]);
  const [candidateRows, setCandidateRows] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<ShiftTimeFilter>("all");
  const [hideApplied, setHideApplied] = useState(true);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [candidateFilter, setCandidateFilter] = useState<CandidateFilter>("all");
  const [appliedWorkerIds, setAppliedWorkerIds] = useState<Set<string>>(new Set());

  const venueMode = ctx.hasVenue;
  const displayName = venueMode
    ? ctx.venueName || t("home_in.continue_venue")
    : ctx.workerName || t("home_in.continue_worker");
  const city = venueMode ? ctx.venueCity : ctx.workerCity;
  const photoUrl = venueMode ? ctx.venuePhotoUrl : ctx.workerPhotoUrl;

  const load = useCallback(async () => {
    setErrorMsg(null);
    try {
      if (venueMode) {
        const [result, appliedWorkerIds] = await Promise.all([
          getDiscoverWorkers(),
          ctx.venueId ? getAppliedWorkerIdsForVenue(ctx.venueId).catch(() => []) : [],
        ]);
        setCandidateRows(result as WorkerRow[]);
        setAppliedWorkerIds(new Set(appliedWorkerIds));
      } else {
        const [result, applied] = await Promise.all([
          getDiscoverShifts(),
          getAppliedShiftIdsForCurrentWorker().catch(() => []),
        ]);
        setRows(result as ShiftRow[]);
        setAppliedIds(new Set(applied));
      }
    } catch (error: any) {
      setErrorMsg(error?.message ?? "Could not load shifts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ctx.venueId, venueMode]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const go = (path: string) => {
    setDrawerOpen(false);
    router.push(path as never);
  };

  const visibleRows = useMemo(() => {
    let result = rows.filter((row) => matchesShiftTime(row, timeFilter));
    if (hideApplied && appliedIds.size) {
      result = result.filter((row) => !appliedIds.has(row.id));
    }
    return result;
  }, [appliedIds, hideApplied, rows, timeFilter]);

  const visibleCandidateRows = useMemo(() => {
    if (candidateFilter === "applied") {
      return candidateRows.filter((worker) => appliedWorkerIds.has(worker.id));
    }
    if (candidateFilter === "not_applied") {
      return candidateRows.filter((worker) => !appliedWorkerIds.has(worker.id));
    }
    return candidateRows;
  }, [appliedWorkerIds, candidateFilter, candidateRows]);

  const candidateFilterOptions = useMemo(() => {
    const appliedCount = candidateRows.filter((worker) => appliedWorkerIds.has(worker.id)).length;
    return [
      { id: "all" as const, label: "All", count: candidateRows.length },
      { id: "applied" as const, label: "Applied", count: appliedCount },
      { id: "not_applied" as const, label: "Not applied", count: candidateRows.length - appliedCount },
    ];
  }, [appliedWorkerIds, candidateRows]);

  const avatar = (
    <View style={styles.avatar}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.avatarImage} resizeMode="cover" />
      ) : venueMode ? (
        <Image
          source={venueFallback(ctx.venueType)}
          style={styles.avatarImage}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setDrawerOpen(true)}
          hitSlop={8}
          accessibilityLabel="Open account menu"
        >
          {avatar}
        </Pressable>
        <Text style={styles.wordmark}>
          <Text style={styles.accent}>T</Text>avoria<Text style={styles.accent}>.</Text>
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.feedHeading}>
        <View>
          <Text style={styles.feedKicker}>
            {venueMode ? t("auth_pin.role_venue") : t("auth_pin.role_worker")}
          </Text>
          <Text style={styles.feedTitle}>
            {venueMode ? t("home_in.browse_workers") : t("home_in.browse_shifts")}
          </Text>
        </View>
        <View style={styles.headingActions}>
          {!venueMode ? (
            <QuickFilter
              active={hideApplied}
              icon="check-circle"
              label={t("shift_filters.hide_applied")}
              onPress={() => setHideApplied((value) => !value)}
            />
          ) : null}
          <Pressable
            onPress={() => {
              setRefreshing(true);
              void load();
            }}
            style={styles.refreshBtn}
            hitSlop={8}
          >
            <Feather name="refresh-cw" size={18} color="#0E1A24" />
          </Pressable>
        </View>
      </View>

      {venueMode ? (
        <FilterChips
          options={candidateFilterOptions}
          value={candidateFilter}
          onChange={setCandidateFilter}
        />
      ) : (
        <FilterChips
          options={getShiftTimeFilters()}
          value={timeFilter}
          onChange={setTimeFilter}
        />
      )}

      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color="#F0531C" size="large" />
          </View>
        ) : errorMsg ? (
          <View style={styles.stateWrap}>
            <Feather name="alert-circle" size={30} color="#B91C1C" />
            <Text style={styles.stateTitle}>Could not load shifts</Text>
            <Text style={styles.stateText}>{errorMsg}</Text>
          </View>
        ) : venueMode && candidateRows.length === 0 ? (
          <View style={styles.stateWrap}>
            <View style={styles.emptyIcon}>
              <Feather name="users" size={28} color="#F0531C" />
            </View>
            <Text style={styles.stateTitle}>{t("home_in.no_workers_title")}</Text>
            <Text style={styles.stateText}>{t("home_in.no_workers_sub")}</Text>
          </View>
        ) : venueMode && visibleCandidateRows.length === 0 ? (
          <View style={styles.stateWrap}>
            <View style={styles.emptyIcon}>
              <Feather name="users" size={28} color="#F0531C" />
            </View>
            <Text style={styles.stateTitle}>No workers in this filter</Text>
            <Text style={styles.stateText}>Try another filter to see more candidates.</Text>
          </View>
        ) : !venueMode && visibleRows.length === 0 ? (
          <View style={styles.stateWrap}>
            <View style={styles.emptyIcon}>
              <Feather name="briefcase" size={28} color="#F0531C" />
            </View>
            <Text style={styles.stateTitle}>
              {venueMode ? t("venue_shifts.empty_title") : "No shifts right now"}
            </Text>
            <Text style={styles.stateText}>
              {venueMode
                ? "Open the account menu to post your first shift."
                : "Pull down to refresh. New shifts appear here."}
            </Text>
          </View>
        ) : venueMode ? (
          visibleCandidateRows.map((worker) => (
            <HomeCandidateRow
              key={worker.id}
              worker={worker}
              onOpen={() =>
                router.push({ pathname: "/candidate", params: { workerId: worker.id } })
              }
            />
          ))
        ) : (
          visibleRows.map((row) => (
            <HomeShiftRow key={row.id} row={row} venueMode={venueMode} onOpen={() => {
              router.push({ pathname: "/shift-detail", params: { id: row.id } });
            }} />
          ))
        )}
      </ScrollView>

      <AppBottomNav
        role={venueMode ? "venue" : "worker"}
        active="home"
        badge={venueMode ? pendingCount : workerCounts.newTotal}
      />

      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={styles.drawerRoot}>
          <SafeAreaView style={styles.drawer} edges={["top", "bottom"]}>
            <ScrollView
              contentContainerStyle={styles.drawerContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.drawerProfile}>
                <View style={styles.drawerAvatarWrap}>{avatar}</View>
                <View style={styles.drawerProfileText}>
                  <Text style={styles.drawerName} numberOfLines={1}>{displayName}</Text>
                  {ctx.username ? (
                    <Text style={styles.drawerUsername} numberOfLines={1}>@{ctx.username}</Text>
                  ) : null}
                  <Text style={styles.drawerMeta} numberOfLines={1}>
                    {venueMode ? t("auth_pin.role_venue") : t("auth_pin.role_worker")}
                    {city ? ` · ${city}` : ""}
                  </Text>
                </View>
              </View>

              {ctx.hasVenue && (
                <DrawerSection>
                  <DrawerAction icon="printer" label={t("home_in.print_qr")} onPress={() => { setDrawerOpen(false); void onPrintQr(); }} />
                  <DrawerAction icon="share-2" label={t("home_in.share_gigi")} onPress={() => { setDrawerOpen(false); void onShare(); }} />
                  <DrawerAction icon="compass" label="How Tavoria works" detail="Your hiring flow" onPress={() => go("/how-it-works?role=venue")} />
                </DrawerSection>
              )}

              {ctx.hasWorker && (
                <DrawerSection>
                  <DrawerAction icon="maximize" label={t("home.scan_qr")} onPress={() => go("/scan")} />
                  <DrawerAction icon="share-2" label={t("home_in.share_profile")} onPress={() => { setDrawerOpen(false); void onShare(); }} />
                  <DrawerAction icon="compass" label="How Tavoria works" detail="Your job flow" onPress={() => go("/how-it-works?role=worker")} />
                </DrawerSection>
              )}

              {ctx.hasVenue && proEligible && (
                <Pressable style={styles.proCard} onPress={() => go("/venue-pro")}>
                  <View style={styles.proTopRow}>
                    <View style={styles.proBadge}>
                      <Feather name="star" size={11} color="#F7F4EE" />
                      <Text style={styles.proBadgeText}>{t("venue_pro.kicker")}</Text>
                    </View>
                    <Feather name="arrow-up-right" size={18} color="#F0531C" />
                  </View>
                  <Text style={styles.proTitle}>{t("venue_pro.title")}</Text>
                  <Text style={styles.proText}>{t("venue_pro.sub")}</Text>
                </Pressable>
              )}

              <DrawerSection>
                <DrawerAction
                  icon="globe"
                  label={t("language.pick")}
                  detail={lang.toUpperCase()}
                  onPress={() => {
                    setDrawerOpen(false);
                    setLanguageOpen(true);
                  }}
                />
                <DrawerAction
                  icon="mail"
                  label="Contact Tavoria team"
                  detail="hello@tavoriapp.com"
                  onPress={() => {
                    setDrawerOpen(false);
                    void Linking.openURL("mailto:hello@tavoriapp.com");
                  }}
                />
                <DrawerAction icon="log-out" label={t("common.sign_out")} danger onPress={() => { setDrawerOpen(false); void onSignOut(); }} />
              </DrawerSection>
            </ScrollView>
          </SafeAreaView>
          <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
        </View>
      </Modal>

      <Modal
        visible={languageOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageOpen(false)}
      >
        <Pressable style={styles.languageBackdrop} onPress={() => setLanguageOpen(false)} />
        <View style={styles.languageSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.languageTitle}>{t("language.pick")}</Text>
          {LANGUAGES.map((language) => (
            <Pressable
              key={language.code}
              style={[styles.languageRow, language.code === lang && styles.languageRowActive]}
              onPress={async () => {
                await onChangeLanguage(language.code);
                setLanguageOpen(false);
              }}
            >
              <Text style={styles.languageFlag}>{language.flag}</Text>
              <Text style={styles.languageLabel}>{language.label}</Text>
              <View style={styles.languageCheck}>
                {language.code === lang && <Feather name="check-circle" size={20} color="#F0531C" />}
              </View>
            </Pressable>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DrawerSection({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.drawerSection}>
      <View style={styles.drawerSectionCard}>{children}</View>
    </View>
  );
}

function QuickFilter({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.quickFilter, active && styles.quickFilterActive]} onPress={onPress}>
      <Feather name={active ? "check" : icon} size={12} color={active ? "white" : "#46505A"} />
      <Text style={[styles.quickFilterLabel, active && styles.quickFilterLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function DrawerAction({
  icon,
  label,
  detail,
  badge,
  danger,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  detail?: string;
  badge?: number;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.drawerAction} onPress={onPress}>
      <View style={[styles.drawerActionIcon, danger && styles.drawerActionIconDanger]}>
        <Feather name={icon} size={17} color={danger ? "#B91C1C" : "#0E1A24"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.drawerActionLabel, danger && { color: "#B91C1C" }]}>{label}</Text>
        {detail ? <Text style={styles.drawerActionDetail}>{detail}</Text> : null}
      </View>
      {!!badge && badge > 0 && (
        <View style={styles.drawerBadge}>
          <Text style={styles.drawerBadgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={18} color="#A0A5AB" />
    </Pressable>
  );
}

function HomeCandidateRow({
  worker,
  onOpen,
}: {
  worker: WorkerRow;
  onOpen: () => void;
}) {
  const name = [worker.first_name, worker.last_name].filter(Boolean).join(" ") || "Candidate";
  const roles = localizeRoles((worker.positions ?? []).slice(0, 2)).join(" · ") || "Hospitality";
  const meta = [worker.city, worker.age_range ? `${worker.age_range}y` : null, worker.years_exp]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable style={styles.candidateCard} onPress={onOpen}>
      {worker.photo_url ? (
        <Image source={{ uri: worker.photo_url }} style={styles.candidateAvatar} resizeMode="cover" />
      ) : (
        <View style={[styles.candidateAvatar, styles.candidateAvatarEmpty]}>
          <Text style={styles.candidateInitial}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.candidateBody}>
        <View style={styles.candidateNameRow}>
          <Text style={styles.candidateName} numberOfLines={1}>{name}</Text>
          {worker.video_url ? <Feather name="video" size={13} color="#185FA5" /> : null}
        </View>
        <Text style={styles.candidateRoles} numberOfLines={1}>{roles}</Text>
        {meta ? <Text style={styles.candidateMeta} numberOfLines={1}>{meta}</Text> : null}
      </View>
      <Feather name="chevron-right" size={19} color="#A0A5AB" />
    </Pressable>
  );
}

function HomeShiftRow({
  row,
  venueMode,
  onOpen,
}: {
  row: ShiftRow;
  venueMode: boolean;
  onOpen: () => void;
}) {
  const photo = row.venue?.photo_url
    ? { uri: row.venue.photo_url }
    : venueFallback(row.venue?.type);
  const roles = localizeRoles((row.roles ?? []).slice(0, 2)).join(" · ") || "Shift";
  const urgent = row.start_when === "now" || row.start_when === "asap";
  const when = urgent ? null : formatWhen(row);
  const pay = row.pay_amount
    ? `€${row.pay_amount}${row.pay_unit ? `/${shortUnit(row.pay_unit)}` : ""}`
    : "Pay discussed later";

  return (
    <Pressable style={styles.shiftCard} onPress={onOpen}>
      <Image source={photo} style={styles.shiftImage} resizeMode="cover" />
      <View style={styles.shiftBody}>
        <View style={styles.shiftTopLine}>
          <Text style={styles.shiftVenue} numberOfLines={1}>
            {venueMode ? roles : row.venue?.name || "Venue"}
          </Text>
          {urgent && (
            <View style={styles.urgentBadge}>
              <Feather name="zap" size={10} color="#B91C1C" />
              <Text style={styles.urgentText}>{row.start_when === "now" ? "NOW" : "ASAP"}</Text>
            </View>
          )}
        </View>
        {!venueMode && <Text style={styles.shiftRoles} numberOfLines={1}>{roles}</Text>}
        <View style={styles.shiftMeta}>
          <Text style={styles.shiftPay}>{pay}</Text>
          {when ? (
            <>
              <Text style={styles.shiftDot}>·</Text>
              <Text style={styles.shiftWhen} numberOfLines={1}>{when}</Text>
            </>
          ) : null}
        </View>
        {venueMode && row.status ? (
          <Text style={styles.shiftStatus}>{row.status.toUpperCase()}</Text>
        ) : row.venue?.city ? (
          <Text style={styles.shiftCity}>{row.venue.city}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={19} color="#A0A5AB" />
    </Pressable>
  );
}

function venueFallback(type?: string) {
  const key = (type || "cafe").toLowerCase().replace(/\s+/g, "_").replace("café", "cafe");
  return VENUE_TYPE_PHOTOS[key] ?? VENUE_TYPE_PHOTOS.cafe;
}

function shortUnit(unit: string) {
  const normalized = unit.toLowerCase();
  if (normalized.startsWith("hour")) return "h";
  if (normalized.startsWith("day")) return "day";
  if (normalized.startsWith("week")) return "wk";
  if (normalized.startsWith("month")) return "mo";
  return unit;
}

function formatWhen(row: ShiftRow) {
  if (row.start_when === "now") return "Now";
  if (row.start_when === "asap") return "ASAP";
  if (row.start_date) {
    return new Date(row.start_date).toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
  }
  return row.days?.slice(0, 3).map((day) => day.slice(0, 3)).join(" · ") || "Flexible";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F4EE" },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#FFE9DB",
    borderColor: "rgba(14,26,36,0.12)",
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    overflow: "hidden",
    width: 44,
  },
  avatarImage: { height: "100%", width: "100%" },
  avatarInitial: { color: "#F0531C", fontFamily: "InstrumentSerif_400Regular", fontSize: 24 },
  wordmark: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 30, letterSpacing: -0.8 },
  accent: { color: "#F0531C" },
  feedHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  feedHeadingFiltered: { paddingBottom: 4 },
  feedKicker: { color: "#F0531C", fontSize: 10, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" },
  feedTitle: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 31, lineHeight: 35, marginTop: 2 },
  headingActions: { alignItems: "center", flexDirection: "row", gap: 7 },
  refreshBtn: { alignItems: "center", backgroundColor: "white", borderRadius: 999, height: 38, justifyContent: "center", width: 38 },
  feed: { flex: 1 },
  feedContent: { gap: 10, paddingBottom: 28, paddingHorizontal: 16 },
  quickFilters: { flexDirection: "row", flexWrap: "wrap", gap: 7, paddingBottom: 10, paddingHorizontal: 16 },
  quickFilter: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.12)", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 5, paddingHorizontal: 11, paddingVertical: 7 },
  quickFilterActive: { backgroundColor: "#F0531C", borderColor: "#F0531C" },
  quickFilterLabel: { color: "#46505A", fontSize: 11, fontWeight: "700" },
  quickFilterLabelActive: { color: "white" },
  stateWrap: { alignItems: "center", minHeight: 310, justifyContent: "center", paddingHorizontal: 28 },
  emptyIcon: { alignItems: "center", backgroundColor: "#FFF0E7", borderRadius: 999, height: 64, justifyContent: "center", marginBottom: 14, width: 64 },
  stateTitle: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 23, marginTop: 12, textAlign: "center" },
  stateText: { color: "#6B7280", fontSize: 14, lineHeight: 20, marginTop: 6, textAlign: "center" },
  shiftCard: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.08)", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 12, padding: 12 },
  shiftImage: { borderRadius: 12, height: 60, width: 60 },
  shiftBody: { flex: 1, minWidth: 0 },
  shiftTopLine: { alignItems: "center", flexDirection: "row", gap: 8 },
  shiftVenue: { color: "#0E1A24", flex: 1, fontSize: 16, fontWeight: "700" },
  shiftRoles: { color: "#46505A", fontSize: 13, marginTop: 2 },
  shiftMeta: { alignItems: "center", flexDirection: "row", marginTop: 6 },
  shiftPay: { color: "#F0531C", fontSize: 12, fontWeight: "800" },
  shiftDot: { color: "#C4C7CB", marginHorizontal: 6 },
  shiftWhen: { color: "#6B7280", flex: 1, fontSize: 12 },
  shiftCity: { color: "#8A8F98", fontSize: 11, marginTop: 4 },
  shiftStatus: { color: "#0F6E56", fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginTop: 4 },
  urgentBadge: { alignItems: "center", backgroundColor: "#FDECEC", borderRadius: 999, flexDirection: "row", gap: 3, paddingHorizontal: 7, paddingVertical: 4 },
  urgentText: { color: "#B91C1C", fontSize: 9, fontWeight: "800" },
  candidateCard: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.08)", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 12, padding: 11 },
  candidateAvatar: { borderRadius: 14, height: 64, width: 64 },
  candidateAvatarEmpty: { alignItems: "center", backgroundColor: "#FFE9DB", justifyContent: "center" },
  candidateInitial: { color: "#F0531C", fontFamily: "InstrumentSerif_400Regular", fontSize: 27 },
  candidateBody: { flex: 1, minWidth: 0 },
  candidateNameRow: { alignItems: "center", flexDirection: "row", gap: 6 },
  candidateName: { color: "#0E1A24", flexShrink: 1, fontSize: 16, fontWeight: "700" },
  candidateRoles: { color: "#46505A", fontSize: 13, marginTop: 3 },
  candidateMeta: { color: "#8A8F98", fontSize: 11, marginTop: 5 },
  drawerRoot: { flex: 1, flexDirection: "row" },
  drawer: { backgroundColor: "#F7F4EE", maxWidth: 380, width: "86%" },
  drawerBackdrop: { backgroundColor: "rgba(14,26,36,0.46)", flex: 1 },
  drawerContent: { paddingBottom: 28, paddingHorizontal: 16 },
  drawerProfile: { alignItems: "center", paddingBottom: 18, paddingHorizontal: 4, paddingTop: 10 },
  drawerAvatarWrap: { marginBottom: 10 },
  drawerProfileText: { alignItems: "center", width: "100%" },
  drawerName: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 24, lineHeight: 27, textAlign: "center" },
  drawerUsername: { color: "#F0531C", fontFamily: "DMMono_500Medium", fontSize: 12, marginTop: 3, textAlign: "center" },
  drawerMeta: { color: "#6B7280", fontSize: 12, marginTop: 7, textAlign: "center", textTransform: "uppercase" },
  drawerSection: { marginTop: 12 },
  drawerSectionCard: { backgroundColor: "white", borderColor: "rgba(14,26,36,0.08)", borderRadius: 17, borderWidth: 1, overflow: "hidden" },
  drawerAction: { alignItems: "center", borderBottomColor: "rgba(14,26,36,0.07)", borderBottomWidth: 1, flexDirection: "row", gap: 11, minHeight: 58, paddingHorizontal: 12, paddingVertical: 9 },
  drawerActionIcon: { alignItems: "center", backgroundColor: "#F1EEE8", borderRadius: 10, height: 34, justifyContent: "center", width: 34 },
  drawerActionIconDanger: { backgroundColor: "#FDECEC" },
  drawerActionLabel: { color: "#0E1A24", fontSize: 14, fontWeight: "700" },
  drawerActionDetail: { color: "#8A8F98", fontSize: 11, marginTop: 2 },
  drawerBadge: { alignItems: "center", backgroundColor: "#F0531C", borderRadius: 999, justifyContent: "center", minWidth: 22, paddingHorizontal: 6, paddingVertical: 3 },
  drawerBadgeText: { color: "white", fontSize: 10, fontWeight: "800" },
  proCard: { backgroundColor: "#FFF0E7", borderColor: "rgba(240,83,28,0.26)", borderRadius: 19, borderWidth: 1, marginTop: 18, padding: 16 },
  proTopRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  proBadge: { alignItems: "center", backgroundColor: "#F0531C", borderRadius: 999, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 5 },
  proBadgeText: { color: "#F7F4EE", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  proTitle: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 22, lineHeight: 25, marginTop: 12 },
  proText: { color: "#5C6670", fontSize: 12, lineHeight: 17, marginTop: 5 },
  proIncluded: { alignItems: "center", borderTopColor: "rgba(14,26,36,0.08)", borderTopWidth: 1, flexDirection: "row", gap: 6, marginTop: 12, paddingTop: 10 },
  proIncludedText: { color: "#0F6E56", flex: 1, fontSize: 11, fontWeight: "700" },
  languageBackdrop: { backgroundColor: "rgba(14,26,36,0.46)", flex: 1 },
  languageSheet: { backgroundColor: "white", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: { alignSelf: "center", backgroundColor: "#D7D9DC", borderRadius: 999, height: 4, marginBottom: 16, width: 36 },
  languageTitle: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 24, marginBottom: 14 },
  languageRow: { alignItems: "center", backgroundColor: "#F7F4EE", borderRadius: 16, flexDirection: "row", gap: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 13 },
  languageRowActive: { backgroundColor: "#FFF1E8", borderColor: "#F0531C", borderWidth: 1 },
  languageFlag: { fontSize: 22, textAlign: "center", width: 26 },
  languageLabel: { color: "#0E1A24", flex: 1, fontSize: 16, fontWeight: "700" },
  languageCheck: { alignItems: "center", justifyContent: "center", width: 20 },
});
