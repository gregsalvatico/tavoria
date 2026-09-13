import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { countryNameFromCode } from "../lib/countries";
import { getAppliedWorkerIdsForVenue, getCurrentVenueRow, getDiscoverWorkersPage, getVenueMatchRequests, requestDirectInterview, type DiscoverCursor } from "../lib/db";
import { t } from "../lib/i18n";
import { localizeRoles } from "../lib/positions";
import { MatchRequest, MatchWorker, WorkerMatch, rankWorkers } from "../lib/workerMatching";
import { TAVORIA } from "../lib/designTokens";
import AppBottomNav from "./AppBottomNav";
import { talentStyles, TalentOption } from "./TalentFields";
import SheetModal from "./SheetModal";
import VenueScreenHeader from "./VenueScreenHeader";
import FilterChips from "./FilterChips";
import { FilterBar, HeaderIconButton, ListRow, ListSurface, PageContainer, RefreshIconButton } from "./PagePrimitives";
import ApplicationActionModal, { type InterviewLocationType, type InterviewSchedule } from "./ApplicationActionModal";
import PreviewMedia from "./PreviewMedia";

export default function WorkerDirectory({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const [workers, setWorkers] = useState<MatchWorker[]>([]);
  const [requests, setRequests] = useState<{ venue: MatchRequest; shifts: MatchRequest[] }>({ venue: {}, shifts: [] });
  const [requestId, setRequestId] = useState("");
  const [requestMenu, setRequestMenu] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<WorkerMatch | null>(null);
  const [contactMatch, setContactMatch] = useState<WorkerMatch | null>(null);
  const [contactBusy, setContactBusy] = useState(false);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [venueAddress, setVenueAddress] = useState("");
  const [locationOptions, setLocationOptions] = useState<InterviewLocationType[]>(["venue", "phone", "video"]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("all"), [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true), [refreshing, setRefreshing] = useState(false), [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState<DiscoverCursor | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const load = useCallback(async () => {
    setError("");
    setLoadMoreError("");
    try {
      const [page, context, venue] = await Promise.all([getDiscoverWorkersPage(), getVenueMatchRequests(), getCurrentVenueRow()]);
      const applications = venue?.id ? await getAppliedWorkerIdsForVenue(venue.id) : [];
      setWorkers(page.rows); setNextCursor(page.nextCursor); setRequests(context); setApplied(new Set(applications));
      setVenueId(venue?.id ?? null);
      setVenueAddress(venue?.address ?? "");
      if (Array.isArray(venue?.interview_location_options) && venue.interview_location_options.length) {
        setLocationOptions(venue.interview_location_options as InterviewLocationType[]);
      }
    } catch (e: any) { setError(e.message ?? t("talent.loadError")); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !nextCursor) return;
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const page = await getDiscoverWorkersPage(nextCursor);
      setWorkers((current) => {
        const existing = new Set(current.map((worker) => worker.id));
        return [...current, ...page.rows.filter((worker) => !existing.has(worker.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (e: any) {
      setLoadMoreError(e.message ?? t("talent.loadError"));
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, nextCursor]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const request = requests.shifts.find(s => s.id === requestId) ?? requests.venue;
  const requestLabel = (r: MatchRequest) => [localizeRoles(r.roles ?? []).join(" / "), r.start_date, r.hours_start?.slice(0, 5)].filter(Boolean).join(" · ");
  const matches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    const pool = workers.filter(w => (filter === "all" || (filter === "applied" ? applied.has(w.id) : !applied.has(w.id))) &&
      (!q || [w.first_name, w.last_name, w.city, ...localizeRoles(w.positions), ...w.languages ?? []].filter(Boolean).join(" ").toLocaleLowerCase().includes(q)));
    return rankWorkers(pool, request);
  }, [workers, query, filter, applied, request]);
  const confirmContact = async (interview?: InterviewSchedule) => {
    if (!contactMatch?.worker.id || !venueId || !interview) return;
    setContactBusy(true);
    try {
      await requestDirectInterview({ workerId: contactMatch.worker.id, venueId, scheduledAt: interview.scheduledAt, location: interview.location });
      setApplied((current) => new Set(current).add(contactMatch.worker.id));
      setContactMatch(null);
      Alert.alert(t("candidate_actions.toast_interview"));
    } catch (e: any) {
      Alert.alert(t("candidate_actions.save_error_title"), e?.message ?? t("candidate_actions.save_error_body"));
    } finally {
      setContactBusy(false);
    }
  };
  const preview = <WorkerPreview match={selectedMatch} desktop={isDesktop} onClose={() => setSelectedMatch(null)} onContact={() => {
    setContactMatch(selectedMatch);
  }} onOpen={() => {
    if (!selectedMatch?.worker.id) return;
    setSelectedMatch(null);
    router.push({ pathname: "/candidate", params: { workerId: selectedMatch.worker.id } });
  }} />;
  return <SafeAreaView style={styles.safe} edges={embedded ? [] : ["top", "bottom"]}>
    <View style={[styles.workspace, isDesktop && styles.workspaceDesktop]}>
      <View style={[styles.mainColumn, isDesktop && styles.mainColumnDesktop]}>
      <PageContainer style={styles.content}>
      <VenueScreenHeader
        title={t("talent.search")}
        active="candidates"
      />
    </PageContainer>
    {!loading && !error ? (
      <FilterBar
        trailing={
          <View style={styles.filterActions}>
            <HeaderIconButton
              label={filtersOpen ? t("talent.close") : t("talent.filters")}
              onPress={() => setFiltersOpen((open) => !open)}
              style={[styles.filterToggle, (filtersOpen || query || requestId) && styles.filterToggleActive]}
            >
              <Feather name="filter" size={17} color={filtersOpen || query || requestId ? TAVORIA.color.orange : TAVORIA.color.navy} />
              {query || requestId ? <View style={styles.filterBadge} /> : null}
            </HeaderIconButton>
            {/* Keep refresh beside filters so the action group remains one compact control cluster. */}
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
          options={[
            { id: "all", label: t("candidate_filters.all"), count: workers.length },
            { id: "applied", label: t("candidate_filters.applied"), count: workers.filter((worker) => applied.has(worker.id)).length },
            { id: "not_applied", label: t("candidate_filters.not_applied"), count: workers.filter((worker) => !applied.has(worker.id)).length },
          ]}
          value={filter}
          onChange={setFilter}
          desktop={isDesktop}
          contained
        />
      </FilterBar>
    ) : null}
    {!loading && !error && filtersOpen ? (
      <PageContainer style={styles.filterControlsContainer}>
        <View style={[styles.filterControls, isDesktop && styles.filterControlsDesktop]}>
          <View style={styles.search}><Feather name="search" size={17} color="#73776F" /><TextInput accessibilityLabel={t("talent.search")} placeholder={t("talent.search")} placeholderTextColor="#8B9088" value={query} onChangeText={setQuery} style={styles.searchInput} />{query ? <Pressable accessibilityLabel={t("talent.close")} onPress={() => setQuery("")}><Feather name="x" size={16} color="#73776F" /></Pressable> : null}</View>
          <Pressable onPress={() => setRequestMenu(true)} accessibilityRole="button" style={styles.request}><Text style={styles.requestText} numberOfLines={1}>{requestId && request.id ? requestLabel(request) : t("talent.allRequests")}</Text><Feather name="chevron-down" color="#626760" size={16} /></Pressable>
        </View>
      </PageContainer>
    ) : null}
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.list, isDesktop && styles.listDesktop]} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} scrollEventThrottle={250} onScroll={(event) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 480) void loadMore();
    }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
      {loading ? <ActivityIndicator color="#F0531C" style={{ margin: 40 }} /> : error ? <View style={{ padding: 24 }}><Text style={talentStyles.error}>{error}</Text><Pressable onPress={load}><Text>{t("talent.retry")}</Text></Pressable></View> : !matches.length ? <Text style={styles.empty}>{t("talent.noResults")}</Text> : <ListSurface>{matches.map((match, index) => {
        const w = match.worker;
        const name = [w.first_name, w.last_name].filter(Boolean).join(" ") || t("talent.worker");
        const photo = w.photo_url ?? (w.photo_urls ?? []).find(Boolean);
        const hasPhoto = !!photo;
        const hasVideo = !!w.video_url || (w.video_urls ?? []).some(Boolean);
        return <ListRow key={w.id} label={name} last={index === matches.length - 1} onPress={() => setSelectedMatch(match)}>
            {photo ? <Image source={{ uri: photo }} style={styles.avatar} /> : <View style={[styles.avatar, styles.placeholder]}><Text style={styles.initial}>{name[0]}</Text></View>}
            <View style={styles.workerBody}>
              <View style={styles.nameRow}><Text style={styles.name}>{name}</Text>{hasVideo && <Feather name="video" size={15} color="#73776F" />}{hasPhoto && !w.photo_url && <Feather name="image" size={15} color="#73776F" />}{applied.has(w.id) && <Text style={styles.applied}>{t("candidate_filters.applied")}</Text>}</View>
              <Text style={styles.roles}>{localizeRoles(w.positions).join(" · ")}</Text>
              <Text style={styles.meta}>{[w.city, w.age_range, w.nationality ? countryNameFromCode(w.nationality) : null, w.years_exp, w.languages?.join(" / ")].filter(Boolean).join(" · ")}</Text>
              {!!match.reasons.length && <View style={styles.reasons}>{match.reasons.slice(0, 4).map(reason => <Text key={reason} style={[styles.reason, reason.includes("conflict") && { color: "#9C6333" }]}>{t(`talent.${reason}`)}</Text>)}</View>}
            </View><Feather name="chevron-right" size={17} color="#8B9088" />
        </ListRow>;
      })}</ListSurface>}
      {loadingMore ? <ActivityIndicator color="#F0531C" style={styles.loadMore} /> : null}
      {loadMoreError ? <Pressable style={styles.loadMoreRetry} onPress={() => void loadMore()}><Text style={styles.loadMoreRetryText}>{t("talent.retry")}</Text></Pressable> : null}
    </ScrollView>
      </View>
      {isDesktop ? preview : null}
    </View>
    {!embedded && <AppBottomNav role="venue" active="home" />}
    {!isDesktop ? preview : null}
    <ApplicationActionModal action="interview" visible={contactMatch !== null} loading={contactBusy} venueAddress={venueAddress} availableLocationTypes={locationOptions} onCancel={() => setContactMatch(null)} onConfirm={confirmContact} />
    <Modal visible={requestMenu} transparent animationType="fade" onRequestClose={() => setRequestMenu(false)}><Pressable style={styles.backdrop} onPress={() => setRequestMenu(false)}><Pressable style={styles.menu} onPress={e => e.stopPropagation()}><ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}><View style={{ gap: 8 }}><TalentOption label={t("talent.allRequests")} selected={!requestId} onPress={() => { setRequestId(""); setRequestMenu(false); }} />{requests.shifts.map(r => <TalentOption key={r.id} label={requestLabel(r)} selected={requestId === r.id} onPress={() => { setRequestId(r.id ?? ""); setRequestMenu(false); }} />)}</View></ScrollView></Pressable></Pressable></Modal>
  </SafeAreaView>;
}

function WorkerPreview({ match, desktop, onClose, onContact, onOpen }: { match: WorkerMatch | null; desktop: boolean; onClose: () => void; onContact: () => void; onOpen: () => void }) {
  const worker = match?.worker;
  if (!worker) return null;
  const name = [worker.first_name, worker.last_name].filter(Boolean).join(" ") || t("talent.worker");
  const photos: (string | null)[] = [worker.photo_url ?? null, ...(worker.photo_urls ?? [])];
  const videos: (string | null)[] = [worker.video_url ?? null, ...(worker.video_urls ?? [])];
  const roles = localizeRoles(worker.positions ?? []).join(" · ");
  const meta = [worker.city, worker.age_range, worker.nationality ? countryNameFromCode(worker.nationality) : null, worker.years_exp].filter(Boolean).join(" · ");
  return <SheetModal
    visible
    desktop={desktop}
    onClose={onClose}
    title={name}
    headerAction={
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={t("candidate_actions.view_full_profile")}
        hitSlop={6}
        onPress={onOpen}
        style={styles.previewHeaderLink}
      >
        <Text style={styles.previewHeaderLinkText}>{t("candidate_actions.view_full_profile")}</Text>
        <Feather name="arrow-up-right" size={14} color={TAVORIA.color.orange} />
      </Pressable>
    }
  >
    <PreviewMedia
      photos={photos}
      videos={videos}
      placeholder={<View style={[styles.previewPhoto, styles.previewPlaceholder]}><Text style={styles.previewInitial}>{name[0]}</Text></View>}
    />
    {roles ? <Text style={styles.previewRoles}>{roles}</Text> : null}
    {meta ? <Text style={styles.previewMeta}>{meta}</Text> : null}
    {!!match.reasons.length ? <View style={styles.previewReasons}>{match.reasons.slice(0, 4).map(reason => <Text key={reason} style={styles.previewReason}>{t(`talent.${reason}`)}</Text>)}</View> : null}
    <Pressable onPress={onContact} style={styles.previewPrimary}><Feather name="message-circle" size={17} color="#FFFFFF" /><Text style={styles.previewPrimaryText}>{t("contact_modal.contact_applicant")}</Text></Pressable>
  </SheetModal>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TAVORIA.color.paperDeep },
  workspace: { flex: 1, minHeight: 0 },
  workspaceDesktop: { flexDirection: "row", marginVertical: -TAVORIA.space.lg },
  mainColumn: { flex: 1, minWidth: 0 },
  mainColumnDesktop: { paddingVertical: TAVORIA.space.lg },
  content: { paddingTop: 0 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  title: { fontFamily: "InstrumentSerif_400Regular", fontSize: 29, fontWeight: "400", color: TAVORIA.color.navy },
  icon: { height: 36, width: 36, alignItems: "center", justifyContent: "center" },
  filterControlsContainer: { paddingBottom: 0, paddingTop: 0 },
  filterActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  filterToggle: { backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.medium, borderWidth: 1, position: "relative" },
  filterToggleActive: { backgroundColor: TAVORIA.color.orangeSoft, borderColor: TAVORIA.color.orange },
  filterBadge: { backgroundColor: TAVORIA.color.orange, borderColor: TAVORIA.color.white, borderRadius: 999, borderWidth: 2, height: 9, position: "absolute", right: 8, top: 7, width: 9 },
  filterControls: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8, width: "100%" },
  filterControlsDesktop: { marginBottom: 4 },
  search: { flexDirection: "row", flexGrow: 1, flexBasis: 280, height: 44, alignItems: "center", gap: 10, borderWidth: 1, borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.medium, backgroundColor: TAVORIA.color.white, paddingHorizontal: 12 },
  searchInput: { color: TAVORIA.color.navy, flex: 1, fontSize: 14, height: 20, lineHeight: 20, minWidth: 0, paddingHorizontal: 0, paddingVertical: 0, textAlignVertical: "center" },
  request: { flexDirection: "row", gap: 12, alignItems: "center", height: 44, borderWidth: 1, borderColor: TAVORIA.color.borderStrong, paddingHorizontal: 12, borderRadius: TAVORIA.radius.medium, maxWidth: "100%", backgroundColor: TAVORIA.color.white },
  requestText: { fontSize: 13, color: TAVORIA.color.navy, flexShrink: 1 },
  filters: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginTop: 16, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: TAVORIA.color.border },
  filterGroup: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tab: { paddingVertical: 10 },
  tabSelected: { borderBottomWidth: 2, borderBottomColor: TAVORIA.color.orange },
  tabText: { fontSize: 13, color: TAVORIA.color.muted },
  tabTextSelected: { color: TAVORIA.color.orange, fontWeight: "700" },
  list: { alignSelf: "center", paddingBottom: 32, paddingHorizontal: 16, paddingTop: 4, width: "100%" },
  listDesktop: { alignSelf: "center", maxWidth: 1180, paddingHorizontal: 24, width: "100%" },
  group: { fontSize: 12, color: "#626B78", paddingTop: 24, paddingBottom: 10, fontWeight: "600" },
  avatar: { borderRadius: TAVORIA.radius.medium, height: 72, width: 64 },
  placeholder: { backgroundColor: "#E8E5DB", alignItems: "center", justifyContent: "center" },
  initial: { fontFamily: "InstrumentSerif_400Regular", fontSize: 24, color: "#0E1A24" },
  workerBody: { flex: 1, minWidth: 0, gap: 5 },
  nameRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  name: { color: "#0E1A24", fontSize: 17, fontWeight: "600" },
  roles: { color: "#303C49", fontSize: 14 },
  meta: { color: "#626B78", fontSize: 12, lineHeight: 19 },
  applied: { fontSize: 11, color: "#626B78" },
  reasons: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 3 },
  reason: { fontFamily: "DMMono_400Regular", fontSize: 10, color: "#477354" },
  empty: { paddingVertical: 60, textAlign: "center", color: "#626B78" },
  loadMore: { paddingVertical: 18 },
  loadMoreRetry: { alignItems: "center", paddingVertical: 12 },
  loadMoreRetryText: { color: TAVORIA.color.orange, fontSize: 13, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(14,26,36,.36)", justifyContent: "center", alignItems: "center", padding: 24 },
  menu: { width: "100%", maxWidth: 480, maxHeight: "75%", padding: 16, backgroundColor: TAVORIA.color.paper, borderRadius: TAVORIA.radius.large },
  previewPhoto: { backgroundColor: "#E8E5DB", borderRadius: TAVORIA.radius.medium, height: 220, width: "100%" },
  previewPlaceholder: { alignItems: "center", justifyContent: "center" },
  previewInitial: { color: TAVORIA.color.orange, fontFamily: "InstrumentSerif_400Regular", fontSize: 54 },
  previewRoles: { color: TAVORIA.color.navy, fontSize: 17, fontWeight: "700", marginTop: 2 },
  previewMeta: { color: TAVORIA.color.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  previewReasons: { borderBottomColor: TAVORIA.color.border, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: TAVORIA.color.border, borderTopWidth: StyleSheet.hairlineWidth, gap: 8, marginTop: 16, paddingVertical: 14 },
  previewReason: { color: TAVORIA.color.success, fontSize: 12 },
  previewHeaderLink: { alignItems: "center", flexDirection: "row", gap: 4, minHeight: 36, paddingHorizontal: 4 },
  previewHeaderLinkText: { color: TAVORIA.color.orange, fontSize: 11, fontWeight: "800" },
  previewPrimary: { alignItems: "center", backgroundColor: TAVORIA.color.navy, borderRadius: TAVORIA.radius.pill, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 48, marginTop: 8, paddingHorizontal: 18 },
  previewPrimaryText: { color: TAVORIA.color.paper, fontSize: 14, fontWeight: "800" },
});
