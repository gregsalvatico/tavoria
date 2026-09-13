import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
import {
  getDiscoverShifts,
  getDiscoverWorkers,
  getDiscoverShiftsPage,
  getAppliedShiftIdsForCurrentWorker,
  getAppliedWorkerIdsForVenue,
  type DiscoverCursor,
  type WorkerStatusCounts,
} from "../lib/db";
import { LANGUAGES, type Language, t } from "../lib/i18n";
import { localizeRoles } from "../lib/positions";
import { openExternalLink } from "../lib/externalLinks";
import AppBottomNav from "./AppBottomNav";
import WorkerDirectory from "./WorkerDirectory";
import FilterChips, { FilterToggleChip } from "./FilterChips";
import { FilterBar, ListRow, ListSurface, PageContainer, PageHeader, RefreshIconButton } from "./PagePrimitives";
import SheetModal from "./SheetModal";
import PreviewMedia from "./PreviewMedia";
import {
  matchesShiftTime,
  getShiftTimeFilters,
  type ShiftTimeFilter,
} from "../lib/shiftFilters";
import { TAVORIA } from "../lib/designTokens";
import { getAccountMenuSections } from "../lib/accountNavigation";
import { applyToShift } from "../lib/applyShift";
import ActionButton from "./ActionButton";

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
  venue_id?: string;
  roles?: string[];
  pay_amount?: number;
  pay_unit?: string;
  days?: string[];
  start_when?: string;
  start_date?: string;
  hours_start?: string;
  hours_end?: string;
  status?: string;
  venue?: {
    id?: string;
    name?: string;
    type?: string;
    city?: string;
    photo_url?: string;
    photo_urls?: (string | null)[];
    video_urls?: (string | null)[];
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
  activeRole?: "worker" | "venue";
  lang: Language;
  pendingCount: number;
  workerCounts: WorkerStatusCounts;
  onChangeLanguage: (language: Language) => Promise<void>;
  onPrintQr: () => Promise<void>;
  onShare: () => void | Promise<void>;
  onSignOut: () => Promise<void>;
};

export default function SignedInHome({
  ctx,
  activeRole,
  lang,
  pendingCount,
  workerCounts,
  onChangeLanguage,
  onPrintQr,
  onShare,
  onSignOut,
}: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
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
  const [selectedShift, setSelectedShift] = useState<ShiftRow | null>(null);
  const [applyingShift, setApplyingShift] = useState(false);
  const [shiftCursor, setShiftCursor] = useState<DiscoverCursor | null>(null);
  const [loadingMoreShifts, setLoadingMoreShifts] = useState(false);
  const [shiftLoadMoreError, setShiftLoadMoreError] = useState("");

  const venueMode = activeRole === "venue" || (activeRole !== "worker" && ctx.hasVenue);
  const displayName = venueMode
    ? ctx.venueName || t("home_in.continue_venue")
    : ctx.workerName || t("home_in.continue_worker");
  const city = venueMode ? ctx.venueCity : ctx.workerCity;
  const photoUrl = venueMode ? ctx.venuePhotoUrl : ctx.workerPhotoUrl;
  const accountMenu = getAccountMenuSections(venueMode ? "venue" : "worker");

  const load = useCallback(async () => {
    if (venueMode) return;
    setErrorMsg(null);
    setShiftLoadMoreError("");
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
          getDiscoverShiftsPage(),
          getAppliedShiftIdsForCurrentWorker().catch(() => []),
        ]);
        setRows(result.rows as ShiftRow[]);
        setShiftCursor(result.nextCursor);
        setAppliedIds(new Set(applied));
      }
    } catch (error: any) {
      setErrorMsg(error?.message ?? t("shift_detail.load_error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ctx.venueId, venueMode]);

  const loadMoreShifts = useCallback(async () => {
    if (venueMode || loading || loadingMoreShifts || !shiftCursor) return;
    setLoadingMoreShifts(true);
    setShiftLoadMoreError("");
    try {
      const page = await getDiscoverShiftsPage(shiftCursor);
      setRows((current) => {
        const existing = new Set(current.map((row) => row.id));
        return [...current, ...((page.rows as ShiftRow[]).filter((row) => !existing.has(row.id)))];
      });
      setShiftCursor(page.nextCursor);
    } catch (error: any) {
      setShiftLoadMoreError(error?.message ?? t("shift_detail.load_error"));
    } finally {
      setLoadingMoreShifts(false);
    }
  }, [loading, loadingMoreShifts, shiftCursor, venueMode]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const go = (path: string) => {
    setDrawerOpen(false);
    router.push(path as never);
  };

  const applySelectedShift = async () => {
    if (!selectedShift) return;
    setApplyingShift(true);
    try {
      const result = await applyToShift(selectedShift);
      if (result.kind === "existing") {
        setAppliedIds((current) => new Set(current).add(selectedShift.id));
        return;
      }
      setSelectedShift(null);
      if (result.kind === "created") {
        router.replace({ pathname: "/applied", params: { venueName: result.venueName } });
        return;
      }
      router.push({
        pathname: "/signup",
        params: {
          next: "apply",
          shiftId: result.shiftId,
          venueId: result.venueId,
          venueName: result.venueName,
        },
      });
    } catch (error: any) {
      Alert.alert(t("shift_detail.apply_error_title"), error?.message ?? t("shift_detail.apply_error_body"));
    } finally {
      setApplyingShift(false);
    }
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
      { id: "all" as const, label: t("candidate_filters.all"), count: candidateRows.length },
      { id: "applied" as const, label: t("candidate_filters.applied"), count: appliedCount },
      { id: "not_applied" as const, label: t("candidate_filters.not_applied"), count: candidateRows.length - appliedCount },
    ];
  }, [appliedWorkerIds, candidateRows, lang]);

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

  const shiftPreview = <ShiftPreview
    row={selectedShift}
    desktop={isDesktop}
    applied={selectedShift ? appliedIds.has(selectedShift.id) : false}
    applying={applyingShift}
    onClose={() => setSelectedShift(null)}
    onApply={() => void applySelectedShift()}
    onOpen={() => {
      if (!selectedShift) return;
      const id = selectedShift.id;
      setSelectedShift(null);
      router.push({ pathname: "/shift-detail", params: { id } });
    }}
  />;

  if (venueMode) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F7F7F2" }}>
        <WorkerDirectory embedded />
        <AppBottomNav role="venue" active="home" badge={pendingCount} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, isDesktop && styles.safeDesktop]} edges={["top", "bottom"]}>
      <View style={[styles.workspace, isDesktop && styles.workspaceDesktop]}>
      <View style={[styles.mainColumn, isDesktop && styles.mainColumnDesktop]}>
      <PageContainer>
        <PageHeader
          title={t("home_in.browse_shifts")}
          left={
            <Pressable
              onPress={() => setDrawerOpen(true)}
              hitSlop={10}
              accessibilityLabel="Open account menu"
              accessibilityRole="button"
              style={({ hovered, pressed }) => [
                styles.headerIconButton,
                hovered && styles.headerIconButtonHovered,
                pressed && styles.headerIconButtonPressed,
              ]}
            >
              <Feather name="menu" size={21} color={TAVORIA.color.navy} />
            </Pressable>
          }
          right={null}
        />
      </PageContainer>

      {venueMode ? <WorkerDirectory embedded /> : <>
      <FilterBar
        trailing={
          <View style={styles.filterActions}>
            <QuickFilter
              active={hideApplied}
              icon="check-circle"
              label={t("shift_filters.hide_applied")}
              onPress={() => setHideApplied((value) => !value)}
              desktop={isDesktop}
            />
            {!loading ? (
              <RefreshIconButton
                label={t("talent.retry")}
                loading={refreshing}
                onPress={() => {
                  setRefreshing(true);
                  void load();
                }}
              />
            ) : null}
          </View>
        }
      >
        <FilterChips
          options={getShiftTimeFilters()}
          value={timeFilter}
          onChange={setTimeFilter}
          desktop={isDesktop}
          contained
        />
      </FilterBar>

      <ScrollView
        style={styles.feed}
        contentContainerStyle={[styles.feedContent, isDesktop && styles.feedContentDesktop]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={250}
        onScroll={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 480) {
            void loadMoreShifts();
          }
        }}
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
            <Text style={styles.stateTitle}>{t("shift_detail.load_error")}</Text>
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
            <Text style={styles.stateTitle}>{t("talent.filteredTitle")}</Text>
            <Text style={styles.stateText}>{t("talent.filteredSub")}</Text>
          </View>
        ) : !venueMode && visibleRows.length === 0 ? (
          <View style={styles.stateWrap}>
            <View style={styles.emptyIcon}>
              <Feather name="briefcase" size={28} color="#F0531C" />
            </View>
            <Text style={styles.stateTitle}>
              {venueMode ? t("venue_shifts.empty_title") : t("home_in.no_shifts_title")}
            </Text>
            <Text style={styles.stateText}>
              {venueMode
                ? t("venue_shifts.empty_sub")
                : t("home_in.no_shifts_sub")}
            </Text>
          </View>
        ) : venueMode ? (
          <ListSurface>
          <View style={isDesktop && styles.desktopGrid}>
            {visibleCandidateRows.map((worker, index) => (
              <HomeCandidateRow
                key={worker.id}
                worker={worker}
                last={index === visibleCandidateRows.length - 1}
                onOpen={() =>
                  router.push({ pathname: "/candidate", params: { workerId: worker.id } })
                }
              />
            ))}
          </View>
          </ListSurface>
        ) : (
          <ListSurface>
            <View style={isDesktop && styles.desktopGrid}>
              {visibleRows.map((row, index) => (
                <HomeShiftRow
                  key={row.id}
                  row={row}
                  last={index === visibleRows.length - 1}
                  venueMode={venueMode}
                  onOpen={() => {
                    setSelectedShift(row);
                  }}
                  onOpenVenue={() => {
                    if (row.venue?.id) {
                      router.push({ pathname: "/venue-board", params: { venueId: row.venue.id } });
                    }
                  }}
                />
              ))}
            </View>
          </ListSurface>
        )}
        {loadingMoreShifts ? <ActivityIndicator color="#F0531C" style={styles.loadMore} /> : null}
        {shiftLoadMoreError ? <Pressable style={styles.loadMoreRetry} onPress={() => void loadMoreShifts()}><Text style={styles.loadMoreRetryText}>{t("talent.retry")}</Text></Pressable> : null}
      </ScrollView>

      </>}
      </View>
      {isDesktop ? shiftPreview : null}
      </View>
      <AppBottomNav
        role={venueMode ? "venue" : "worker"}
        active="home"
        badge={venueMode ? pendingCount : workerCounts.newTotal}
      />

      {!isDesktop ? shiftPreview : null}

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
                  {accountMenu.roleActions.map((item) => <DrawerAction key={item.id} icon={item.icon} label={t(item.labelKey)} detail={item.detailKey ? t(item.detailKey) : undefined} onPress={() => { setDrawerOpen(false); if (item.id === "share") void onShare(); }} />)}
                </DrawerSection>
              )}

              {ctx.hasWorker && (
                <DrawerSection>
                  <DrawerAction icon="maximize" label={t("home.scan_qr")} onPress={() => go("/scan")} />
                  {accountMenu.roleActions.map((item) => <DrawerAction key={item.id} icon={item.icon} label={t(item.labelKey)} detail={item.detailKey ? t(item.detailKey) : undefined} onPress={() => { setDrawerOpen(false); if (item.id === "share") void onShare(); }} />)}
                </DrawerSection>
              )}

              <DrawerSection>
                {accountMenu.commonActions.map((item) => <DrawerAction key={item.id} icon={item.icon} label={t(item.labelKey)} detail={item.id === "language" ? lang.toUpperCase() : item.detailKey ? t(item.detailKey) : undefined} onPress={() => {
                  setDrawerOpen(false);
                  if (item.id === "language") setLanguageOpen(true);
                  else if (item.id === "change_pin") go("/change-pin");
                  else setContactOpen(true);
                }} />)}
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

      <Modal
        visible={contactOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setContactOpen(false)}
      >
        <Pressable style={styles.contactBackdrop} onPress={() => setContactOpen(false)}>
          <Pressable style={styles.contactSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.contactTitle}>{t("team_contact.title")}</Text>
            <Text style={styles.contactSub}>{t("team_contact.subtitle")}</Text>
            <Pressable
              style={styles.contactOption}
              onPress={() => {
                setContactOpen(false);
                void openExternalLink("mailto:hello@tavoriapp.com", t("external_link.email"));
              }}
            >
              <View style={styles.contactOptionIcon}>
                <Feather name="mail" size={19} color="#0E1A24" />
              </View>
              <View style={styles.contactOptionText}>
                <Text style={styles.contactOptionTitle}>{t("team_contact.email")}</Text>
                <Text style={styles.contactOptionDetail}>{t("team_contact.email_detail")}</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#6B7280" />
            </Pressable>
            <Pressable
              style={styles.contactOption}
              onPress={() => {
                setContactOpen(false);
                void openExternalLink("https://www.instagram.com/tavoriapp/", t("team_contact.instagram"));
              }}
            >
              <View style={styles.contactOptionIcon}>
                <Feather name="instagram" size={19} color="#0E1A24" />
              </View>
              <View style={styles.contactOptionText}>
                <Text style={styles.contactOptionTitle}>{t("team_contact.instagram")}</Text>
                <Text style={styles.contactOptionDetail}>{t("team_contact.instagram_detail")}</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#6B7280" />
            </Pressable>
            <Pressable onPress={() => setContactOpen(false)} style={styles.cancelContactBtn}>
              <Text style={styles.cancelContactText}>{t("team_contact.cancel")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
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
  desktop,
}: {
  active: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  desktop: boolean;
}) {
  return <FilterToggleChip label={label} active={active} icon={icon} onPress={onPress} desktop={desktop} />;
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
    <Pressable
      style={({ hovered, pressed }) => [
        styles.drawerAction,
        hovered && styles.drawerActionHovered,
        pressed && styles.drawerActionPressed,
      ]}
      onPress={onPress}
    >
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
  last,
}: {
  worker: WorkerRow;
  onOpen: () => void;
  last: boolean;
}) {
  const name = [worker.first_name, worker.last_name].filter(Boolean).join(" ") || "Candidate";
  const roles = localizeRoles((worker.positions ?? []).slice(0, 2)).join(" · ") || "Hospitality";
  const meta = [worker.city, worker.age_range ? `${worker.age_range}y` : null, worker.years_exp]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListRow label={name} last={last} onPress={onOpen}>
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
    </ListRow>
  );
}

function HomeShiftRow({
  row,
  venueMode,
  onOpen,
  onOpenVenue,
  last,
}: {
  row: ShiftRow;
  venueMode: boolean;
  onOpen: () => void;
  onOpenVenue: () => void;
  last: boolean;
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
    <ListRow label={row.venue?.name || roles} last={last} onPress={onOpen}>
      <Image source={photo} style={styles.shiftImage} resizeMode="cover" />
      <View style={styles.shiftBody}>
        <View style={styles.shiftTopLine}>
          {venueMode || !row.venue?.id ? (
            <Text style={styles.shiftVenue} numberOfLines={1}>
              {venueMode ? roles : row.venue?.name || "Venue"}
            </Text>
          ) : (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onOpenVenue();
              }}
              style={styles.shiftVenueLink}
            >
              <Text style={styles.shiftVenue} numberOfLines={1}>{row.venue.name || "Venue"}</Text>
              <Feather name="arrow-up-right" size={14} color="#185FA5" />
            </Pressable>
          )}
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
    </ListRow>
  );
}

function ShiftPreview({
  row,
  desktop,
  applied,
  applying,
  onClose,
  onApply,
  onOpen,
}: {
  row: ShiftRow | null;
  desktop: boolean;
  applied: boolean;
  applying: boolean;
  onClose: () => void;
  onOpen: () => void;
  onApply: () => void;
}) {
  if (!row) return null;
  const photos: (string | null)[] = [row.venue?.photo_url ?? null, ...(row.venue?.photo_urls ?? [])];
  const videos: (string | null)[] = [...(row.venue?.video_urls ?? [])];
  const roles = localizeRoles((row.roles ?? []).slice(0, 3)).join(" · ") || t("shift_detail.default_shift");
  const pay = row.pay_amount ? `€${row.pay_amount}${row.pay_unit ? `/${shortUnit(row.pay_unit)}` : ""}` : t("shift_detail.pay_discussed");
  const when = formatWhen(row);
  const hours = row.hours_start && row.hours_end ? `${row.hours_start} – ${row.hours_end}` : null;
  return (
    <SheetModal
      visible
      desktop={desktop}
      onClose={onClose}
      title={roles}
      headerAction={
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t("shift_detail.view_full_shift")}
          hitSlop={6}
          onPress={onOpen}
          style={styles.previewHeaderLink}
        >
          <Text style={styles.previewHeaderLinkText}>{t("shift_detail.view_full_shift")}</Text>
          <Feather name="arrow-up-right" size={14} color={TAVORIA.color.orange} />
        </Pressable>
      }
    >
      <PreviewMedia photos={photos} videos={videos} placeholderSource={venueFallback(row.venue?.type)} />
      <Text style={styles.previewVenue}>{row.venue?.name || t("shift_detail.default_venue")}</Text>
      {row.venue?.city ? <Text style={styles.previewMeta}>{row.venue.city}</Text> : null}
      <View style={styles.previewFacts}>
        <PreviewFact icon="credit-card" label={t("shift_detail.pay_label")} value={pay} />
        <PreviewFact icon="calendar" label={t("shift_detail.days")} value={when} />
        {hours ? <PreviewFact icon="clock" label={t("shift_detail.hours")} value={hours} /> : null}
      </View>
      <ActionButton
        label={applied ? t("shift_detail.application_pending") : t("shift_detail.apply_now")}
        icon={applied ? "check-circle" : "arrow-right"}
        loading={applying}
        disabled={applied}
        onPress={onApply}
        style={[styles.previewPrimary, applied && styles.previewActionDisabled]}
      />
    </SheetModal>
  );
}

function PreviewFact({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.previewFact}>
      <Feather name={icon} size={15} color={TAVORIA.color.muted} />
      <View style={styles.previewFactBody}>
        <Text style={styles.previewFactLabel}>{label}</Text>
        <Text style={styles.previewFactValue}>{value}</Text>
      </View>
    </View>
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
  if (row.start_when === "now") return t("shift_detail.need_now_banner");
  if (row.start_when === "asap") return t("shift_filters.asap");
  if (row.start_date) {
    return new Date(row.start_date).toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
  }
  return row.days?.slice(0, 3).map((day) => day.slice(0, 3)).join(" · ") || t("shift_detail.hours_flexible");
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TAVORIA.color.paper },
  safeDesktop: { backgroundColor: TAVORIA.color.paperDeep },
  workspace: { flex: 1, minHeight: 0 },
  workspaceDesktop: { flexDirection: "row", marginVertical: -TAVORIA.space.lg },
  mainColumn: { flex: 1, minWidth: 0 },
  mainColumnDesktop: { paddingVertical: TAVORIA.space.lg },
  headerIconButton: { alignItems: "center", borderRadius: 10, height: 36, justifyContent: "center", width: 36 },
  headerIconButtonHovered: { backgroundColor: "rgba(14,26,36,0.07)" },
  headerIconButtonPressed: { opacity: 0.72 },
  avatar: {
    alignItems: "center",
    backgroundColor: TAVORIA.color.orangeSoft,
    borderColor: TAVORIA.color.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    overflow: "hidden",
    width: 44,
  },
  avatarImage: { height: "100%", width: "100%" },
  avatarInitial: { color: TAVORIA.color.orange, fontFamily: "InstrumentSerif_400Regular", fontSize: 24 },
  feed: { flex: 1 },
  feedContent: { gap: 0, paddingBottom: 28, paddingHorizontal: 16 },
  feedContentDesktop: { alignSelf: "center", maxWidth: 1180, paddingHorizontal: 24, width: "100%" },
  desktopGrid: { width: "100%" },
  filterActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  loadMore: { paddingVertical: 18 },
  loadMoreRetry: { alignItems: "center", paddingVertical: 12 },
  loadMoreRetryText: { color: TAVORIA.color.orange, fontSize: 13, fontWeight: "700" },
  stateWrap: { alignItems: "center", minHeight: 310, justifyContent: "center", paddingHorizontal: 28 },
  emptyIcon: { alignItems: "center", backgroundColor: "#FFF0E7", borderRadius: 999, height: 64, justifyContent: "center", marginBottom: 14, width: 64 },
  stateTitle: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 23, marginTop: 12, textAlign: "center" },
  stateText: { color: "#6B7280", fontSize: 14, lineHeight: 20, marginTop: 6, textAlign: "center" },
  shiftImage: { borderRadius: 14, height: 72, width: 64 },
  shiftBody: { flex: 1, minWidth: 0 },
  shiftTopLine: { alignItems: "center", flexDirection: "row", gap: 8 },
  shiftVenue: { color: "#0E1A24", flexShrink: 1, fontSize: 17, fontWeight: "700" },
  shiftVenueLink: { alignItems: "center", flexDirection: "row", flexShrink: 1, gap: 4, minWidth: 0 },
  shiftRoles: { color: "#46505A", fontSize: 14, marginTop: 3 },
  shiftMeta: { alignItems: "center", flexDirection: "row", marginTop: 6 },
  shiftPay: { color: "#F0531C", fontSize: 12, fontWeight: "800" },
  shiftDot: { color: "#C4C7CB", marginHorizontal: 6 },
  shiftWhen: { color: "#6B7280", flex: 1, fontSize: 12 },
  shiftCity: { color: "#8A8F98", fontSize: 11, marginTop: 4 },
  shiftStatus: { color: "#0F6E56", fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginTop: 4 },
  urgentBadge: { alignItems: "center", backgroundColor: "#FDECEC", borderRadius: 999, flexDirection: "row", gap: 3, paddingHorizontal: 7, paddingVertical: 4 },
  urgentText: { color: "#B91C1C", fontSize: 9, fontWeight: "800" },
  candidateAvatar: { borderRadius: TAVORIA.radius.medium, height: 72, width: 64 },
  candidateAvatarEmpty: { alignItems: "center", backgroundColor: "#FFE9DB", justifyContent: "center" },
  candidateInitial: { color: TAVORIA.color.orange, fontFamily: "InstrumentSerif_400Regular", fontSize: 27 },
  candidateBody: { flex: 1, minWidth: 0 },
  candidateNameRow: { alignItems: "center", flexDirection: "row", gap: 6 },
  candidateName: { color: "#0E1A24", flexShrink: 1, fontSize: 17, fontWeight: "700" },
  candidateRoles: { color: "#46505A", fontSize: 14, marginTop: 3 },
  candidateMeta: { color: "#8A8F98", fontSize: 12, marginTop: 5 },
  previewVenue: { color: TAVORIA.color.navy, fontSize: 18, fontWeight: "700", marginTop: 14 },
  previewMeta: { color: TAVORIA.color.muted, fontSize: 13, marginTop: 4 },
  previewFacts: { borderBottomColor: TAVORIA.color.border, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: TAVORIA.color.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", flexWrap: "wrap", marginTop: 16, paddingVertical: 4 },
  previewFact: { alignItems: "flex-start", flexDirection: "row", gap: 8, minWidth: 150, paddingVertical: 10, width: "50%" },
  previewFactBody: { flex: 1, minWidth: 0 },
  previewFactLabel: { color: TAVORIA.color.muted, fontFamily: "DMMono_500Medium", fontSize: 9, letterSpacing: 0.6, textTransform: "uppercase" },
  previewFactValue: { color: TAVORIA.color.navy, fontSize: 13, fontWeight: "700", marginTop: 3 },
  previewHeaderLink: { alignItems: "center", flexDirection: "row", gap: 4, minHeight: 36, paddingHorizontal: 4 },
  previewHeaderLinkText: { color: TAVORIA.color.orange, fontSize: 11, fontWeight: "800" },
  previewPrimary: { backgroundColor: TAVORIA.color.orange, height: 48, maxHeight: 48, minHeight: 48, marginTop: 16, width: "100%" },
  previewActionDisabled: { opacity: 0.58 },
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
  drawerActionHovered: { backgroundColor: "#F1EFE8" },
  drawerActionPressed: { opacity: 0.72 },
  drawerActionIcon: { alignItems: "center", backgroundColor: "#F1EEE8", borderRadius: 10, height: 34, justifyContent: "center", width: 34 },
  drawerActionIconDanger: { backgroundColor: "#FDECEC" },
  drawerActionLabel: { color: "#0E1A24", fontSize: 14, fontWeight: "700" },
  drawerActionDetail: { color: "#8A8F98", fontSize: 11, marginTop: 2 },
  drawerBadge: { alignItems: "center", backgroundColor: "#F0531C", borderRadius: 999, justifyContent: "center", minWidth: 22, paddingHorizontal: 6, paddingVertical: 3 },
  drawerBadgeText: { color: "white", fontSize: 10, fontWeight: "800" },
  languageBackdrop: { backgroundColor: "rgba(14,26,36,0.46)", flex: 1 },
  languageSheet: { backgroundColor: "white", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: { alignSelf: "center", backgroundColor: "#D7D9DC", borderRadius: 999, height: 4, marginBottom: 16, width: 36 },
  languageTitle: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 24, marginBottom: 14 },
  languageRow: { alignItems: "center", backgroundColor: "#F7F4EE", borderRadius: 16, flexDirection: "row", gap: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 13 },
  languageRowActive: { backgroundColor: "#FFF1E8", borderColor: "#F0531C", borderWidth: 1 },
  languageFlag: { fontSize: 22, textAlign: "center", width: 26 },
  languageLabel: { color: "#0E1A24", flex: 1, fontSize: 16, fontWeight: "700" },
  languageCheck: { alignItems: "center", justifyContent: "center", width: 20 },
  contactBackdrop: { backgroundColor: "rgba(14,26,36,0.46)", flex: 1, justifyContent: "flex-end" },
  contactSheet: { backgroundColor: "white", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 12 },
  contactTitle: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 24, marginBottom: 5 },
  contactSub: { color: "#6B7280", fontSize: 13, lineHeight: 19, marginBottom: 14 },
  contactOption: { alignItems: "center", backgroundColor: "#F7F4EE", borderRadius: 16, flexDirection: "row", gap: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 13 },
  contactOptionIcon: { alignItems: "center", backgroundColor: "#FFF1E8", borderRadius: 11, height: 38, justifyContent: "center", width: 38 },
  contactOptionText: { flex: 1 },
  contactOptionTitle: { color: "#0E1A24", fontSize: 15, fontWeight: "700" },
  contactOptionDetail: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  cancelContactBtn: { alignItems: "center", marginTop: 8, paddingVertical: 10 },
  cancelContactText: { color: "#6B7280", fontSize: 14, fontWeight: "700" },
});
