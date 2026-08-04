import { Feather } from "@expo/vector-icons";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { clearVenueProfile } from "../lib/venueProfile";
import { clearWorkerProfile } from "../lib/workerProfile";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getCurrentUserContext,
  getPendingApplicationsCount,
  getWorkerStatusCounts,
  type WorkerStatusCounts,
} from "../lib/db";
import { downloadVenueQRPoster } from "../lib/qrPoster";
import { initProEligibility, isProEligible } from "../lib/proEligibility";
import { getVenueProfile } from "../lib/venueProfile";
import { openExternalLink } from "../lib/externalLinks";
import SignedInHome from "../components/SignedInHome";
import ShareTavoriaModal from "../components/ShareTavoriaModal";
import {
  getCachedHomeContext,
  setCachedHomeContext,
  subscribeToHomeContext,
  type HomeContext,
} from "../lib/homeContextCache";

const WORKER_LAST_SEEN_KEY = "gigi.worker.apps_last_seen";
import { initI18n, LANGUAGES, Language, setLanguage, t } from "../lib/i18n";
import { colors } from "../lib/theme";

const EMPTY_HOME_CONTEXT: HomeContext = { hasVenue: false, hasWorker: false };

export default function Welcome() {
  const router = useRouter();
  // Bump on language change to force re-render
  const [lang, setLang] = useState<Language>("en");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [ctx, setCtx] = useState<HomeContext>(
    () => getCachedHomeContext() ?? EMPTY_HOME_CONTEXT
  );
  const [contextReady, setContextReady] = useState(
    () => getCachedHomeContext() !== null
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [workerCounts, setWorkerCounts] = useState<WorkerStatusCounts>({
    hired: 0,
    interview: 0,
    starred: 0,
    total: 0,
    newHired: 0,
    newInterview: 0,
    newStarred: 0,
    newTotal: 0,
  });

  // Signed-in is now DERIVED from Supabase state: if the current user has a
  // worker or venue row, they're signed in. No more AsyncStorage flag.
  const signedIn = ctx.hasVenue || ctx.hasWorker;

  useEffect(() => {
    initI18n().then((l) => setLang(l));
    // Hydrate the "have we seen this user for 7 days yet" flag so the
    // PRO upsell / lock UI knows whether to render.
    initProEligibility();
  }, []);

  // Keep an already-mounted home screen in sync with sign-in screens and
  // onboarding routes. This is what prevents the old signed-out tree from
  // appearing for one frame when Expo Router returns to `/`.
  useEffect(() => {
    return subscribeToHomeContext((next) => {
      if (next === null) {
        setContextReady(false);
        return;
      }
      setCtx(next);
      setContextReady(true);
    });
  }, []);

  // Supabase emits SIGNED_IN before navigation. Hide any previously rendered
  // landing page immediately; signin.tsx then seeds the resolved account
  // context, or the focus refresh below resolves it after onboarding.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        const cached = getCachedHomeContext();
        if (!cached?.hasVenue && !cached?.hasWorker) {
          setCachedHomeContext(null);
        }
      } else if (event === "SIGNED_OUT") {
        setCachedHomeContext(EMPTY_HOME_CONTEXT);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Sign out: wipe in-memory caches + Supabase session. ctx then refreshes
  // empty on next focus, which makes signedIn false automatically.
  const signOut = async () => {
    clearWorkerProfile();
    clearVenueProfile();
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("[home] signOut failed:", e);
    }
    setCachedHomeContext(EMPTY_HOME_CONTEXT);
    setPendingCount(0);
    setWorkerCounts({
      hired: 0,
      interview: 0,
      starred: 0,
      total: 0,
      newHired: 0,
      newInterview: 0,
      newStarred: 0,
      newTotal: 0,
    });
  };

  const onShare = () => setShareOpen(true);

  // Re-check on each focus so "Continue as ..." shortcuts appear immediately
  // after the user finishes onboarding
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const c = await getCurrentUserContext();
          if (!cancelled) {
            setCachedHomeContext(c);
          }
          // Fetch pending-application count for the venue Messaggi badge
          if (c.hasVenue) {
            try {
              const n = await getPendingApplicationsCount();
              if (!cancelled) setPendingCount(n);
            } catch {}
          } else if (!cancelled) {
            setPendingCount(0);
          }
          // Worker side: per-status counts + "new since last seen"
          if (c.hasWorker) {
            try {
              const sinceISO = await AsyncStorage.getItem(
                WORKER_LAST_SEEN_KEY
              );
              const counts = await getWorkerStatusCounts(sinceISO);
              if (!cancelled) setWorkerCounts(counts);
            } catch {}
          } else if (!cancelled) {
            setWorkerCounts({
              hired: 0,
              interview: 0,
              starred: 0,
              total: 0,
              newHired: 0,
              newInterview: 0,
              newStarred: 0,
              newTotal: 0,
            });
          }
        } catch {
          // Keep a previously resolved context during transient refresh errors.
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Never let the signed-out landing page flash while auth/profile state is
  // still being resolved. Returning from a top-level tab uses the cache above,
  // so this gate is normally only visible on a cold start.
  if (!contextReady) {
    return <View style={styles.authGate} />;
  }

  // Signed-out home is a clean flex layout (no ScrollView) so iOS doesn't
  // auto-adjust content insets and shove the top off-screen.
  if (!signedIn) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.signedOutRoot}>
          {/* TOP GROUP — topBar + wordmark + hero (all pinned to top) */}
          <View>
            <View style={styles.topBar}>
              <Pressable
                onPress={() => setPickerOpen(true)}
                hitSlop={8}
                style={styles.langBtn}
              >
                <Feather name="globe" size={15} color="#46505A" />
                <Text style={styles.langCode}>{current.code.toUpperCase()}</Text>
                <Feather name="chevron-down" size={14} color="#46505A" />
              </Pressable>
              <Link href="/signin" asChild>
                <Pressable hitSlop={8} style={styles.topLink}>
                  <Text style={styles.topLinkTxt}>{t("home.sign_in")}</Text>
                </Pressable>
              </Link>
            </View>

            <View style={styles.signedOutTop}>
              <Text style={styles.wordmark}>
                <Text style={styles.accentLetter}>T</Text>avoria
                <Text style={styles.accentLetter}>.</Text>
              </Text>
              <Text style={styles.headline}>
                {t("home.headline_top")}{"\n"}
                <Text style={styles.accent}>{t("home.headline3")}</Text>
              </Text>
              <Text style={styles.sub}>{t("home.tagline")}</Text>
            </View>
          </View>

          {/* Clear action hierarchy: venue signup, worker signup, then job browsing. */}
          <View style={styles.signedOutBottom}>
            <Link href="/venue-type" asChild>
              <Pressable style={styles.landingVenueBtn}>
                <Text style={styles.landingVenueBtnText}>{t("home.venue_cta")}</Text>
                <Feather name="arrow-right" size={19} color="#F7F4EE" />
              </Pressable>
            </Link>

            <Link href="/signup?next=worker-profile" asChild>
              <Pressable style={styles.landingWorkerBtn}>
                <Text style={styles.landingWorkerBtnText}>{t("home.worker_cta")}</Text>
                <Feather name="arrow-right" size={19} color="#0E1A24" />
              </Pressable>
            </Link>

            <Link href="/discover" asChild>
              <Pressable style={styles.landingBrowseBtn}>
                <Feather name="search" size={18} color={colors.secondary} />
                <Text style={styles.landingBrowseBtnText}>
                  {t("home_in.browse_shifts")}
                </Text>
              </Pressable>
            </Link>

            <Link href="/scan" asChild>
              <Pressable style={styles.scanQrLink}>
                <Feather name="maximize" size={15} color="#5C6670" />
                <Text style={styles.scanQrLinkText}>{t("home.scan_qr")}</Text>
              </Pressable>
            </Link>

            <LegalFooter />
          </View>
        </View>

        {/* Language picker modal */}
        <Modal
          visible={pickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPickerOpen(false)}
          />
          <View style={styles.langSheet}>
            <View style={styles.langSheetHandle} />
            <Text style={styles.langSheetTitle}>{t("language.pick")}</Text>
            {LANGUAGES.map((l) => (
              <Pressable
                key={l.code}
                onPress={async () => {
                  await setLanguage(l.code);
                  setLang(l.code);
                  setPickerOpen(false);
                }}
                style={[styles.langRow, l.code === lang && styles.langRowOn]}
              >
                <Text style={styles.langRowFlag}>{l.flag}</Text>
                <Text style={styles.langRowLbl}>{l.label}</Text>
                <View style={styles.langRowCheck}>
                  {l.code === lang && (
                    <Feather name="check-circle" size={20} color="#F0531C" />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SignedInHome
      ctx={ctx}
      lang={lang}
      pendingCount={pendingCount}
      workerCounts={workerCounts}
      proEligible={isProEligible()}
      onChangeLanguage={async (language) => {
        await setLanguage(language);
        setLang(language);
      }}
      onPrintQr={async () => {
        if (!ctx.venueId) return;
        try {
          const vp = getVenueProfile();
          await downloadVenueQRPoster({
            venueId: ctx.venueId,
            venueName: ctx.venueName ?? vp?.name ?? "",
            venueCity: ctx.venueCity ?? vp?.city,
          });
        } catch (error) {
          console.warn("[home] downloadVenueQRPoster failed:", error);
          Alert.alert(
            t("home_in.print_qr"),
            String((error as Error)?.message ?? error)
          );
        }
      }}
      onShare={onShare}
        onSignOut={signOut}
      />
      <ShareTavoriaModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );

  /* Legacy signed-in layout retained temporarily while the new feed-first
     home is evaluated. It is unreachable and can be removed after approval. */
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top header — Language (left) · Sign in (right) */}
        <View style={styles.topBar}>
          <Pressable
          onPress={() => setPickerOpen(true)}
          hitSlop={8}
          style={styles.langBtn}
        >
            <Feather name="globe" size={15} color="#46505A" />
            <Text style={styles.langCode}>{current.code.toUpperCase()}</Text>
            <Feather name="chevron-down" size={14} color="#46505A" />
          </Pressable>
          {signedIn ? (
            <Pressable hitSlop={8} style={styles.topLink} onPress={signOut}>
              <Text style={styles.topLinkTxt}>{t("common.sign_out")}</Text>
            </Pressable>
          ) : (
            <View style={{ width: 64 }} />
          )}
        </View>

        {/* Wordmark — big, centered */}
        <View style={styles.wordmarkWrap}>
          <Text style={styles.wordmark}>
            <Text style={styles.accentLetter}>T</Text>avoria
            <Text style={styles.accentLetter}>.</Text>
          </Text>
        </View>

        {/* Hero — shown only when NOT signed in. Sits right under wordmark, no centering. */}
        {!signedIn && (
          <View style={styles.hero}>
            <Text style={styles.kicker}>HOSPITALITY · MILAN · JULY 2026</Text>
            <Text style={styles.headline}>
              {t("home.headline1")}{"\n"}{t("home.headline2")}{"\n"}
              <Text style={styles.accent}>{t("home.headline3")}</Text>
            </Text>
            <Text style={styles.sub}>{t("home.tagline")}</Text>
          </View>
        )}

        {/* Signed-in greeting — small text instead of marketing hero */}
        {signedIn && (
          <View style={styles.signedInGreeting}>
            <Text style={styles.greetingTxt}>
              {t("home_in.welcome")}
              {ctx.workerName ? `, ${ctx.workerName}` : ""}
            </Text>
          </View>
        )}

        {/* Spacer — pushes actions to the bottom on tall phones */}
        {!signedIn && <View style={{ flex: 1, minHeight: 12 }} />}

        {/* Actions */}
        <View style={styles.actions}>
          {/* Continue as venue — only when signed in AND has a venue */}
          {signedIn && ctx.hasVenue && (
            <View
              style={[
                styles.continueCard,
                // If they ONLY have a venue (no worker), make it bigger
                !ctx.hasWorker && styles.continueCardSolo,
              ]}
            >
              <Pressable
                onPress={() => router.push("/venue-shifts")}
                style={styles.continueHeader}
              >
                <View style={styles.continueIcon}>
                  <Feather name="briefcase" size={16} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.continueKicker}>
                    {t("home_in.venue_kicker")}
                  </Text>
                  <Text style={styles.continueTitle}>
                    {ctx.venueName || t("home_in.continue_venue")}
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
              </Pressable>
              <View style={styles.continueRow}>
                <Pressable
                  onPress={() => router.push("/venue-inbox")}
                  style={[styles.continueBtn, styles.continueBtnPrimary]}
                >
                  <Feather name="inbox" size={14} color="white" />
                  <Text style={styles.continueBtnTxtPrimary}>
                    {t("home_in.inbox")}
                  </Text>
                  {pendingCount > 0 && (
                    <View style={styles.inboxBadge}>
                      <Text style={styles.inboxBadgeTxt}>
                        {pendingCount > 99 ? "99+" : String(pendingCount)}
                      </Text>
                    </View>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => router.push("/venue-photo")}
                  style={[styles.continueBtn, styles.continueBtnGhost]}
                >
                  <Feather name="plus" size={14} color="#0E1A24" />
                  <Text style={styles.continueBtnTxt}>
                    {t("home_in.post_shift")}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Continue as worker — only when signed in AND has a worker */}
          {signedIn && ctx.hasWorker && (
            <View
              style={[
                styles.continueCard,
                styles.continueCardWorker,
                // If they ONLY have a worker, make it bigger
                !ctx.hasVenue && styles.continueCardSolo,
              ]}
            >
              <View style={styles.continueHeader}>
                <View
                  style={[styles.continueIcon, { backgroundColor: "#185FA5" }]}
                >
                  <Feather name="user" size={16} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.continueKicker}>
                    {t("home_in.worker_kicker")}
                  </Text>
                  <Text style={styles.continueTitle}>
                    {ctx.workerName
                      ? `${t("home_in.welcome")}, ${ctx.workerName}`
                      : t("home_in.continue_worker")}
                  </Text>
                </View>
              </View>
              <View style={styles.continueRow}>
                <Pressable
                  onPress={() => router.push("/discover")}
                  style={[styles.continueBtn, styles.continueBtnPrimary]}
                >
                  <Feather name="search" size={14} color="white" />
                  <Text style={styles.continueBtnTxtPrimary}>
                    {t("home_in.browse_shifts")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/candidate")}
                  style={[styles.continueBtn, styles.continueBtnGhost]}
                >
                  <Feather name="eye" size={14} color="#0E1A24" />
                  <Text style={styles.continueBtnTxt}>
                    {t("home_in.my_card")}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Signed-out: marketing CTAs + sign-up split */}
          {!signedIn && (
            <>
              {/* Browse tiles — square, same size as worker/venue tiles below */}
              <View style={[styles.splitRow, styles.firstSplitRow]}>
                <Link href="/discover" asChild>
                  <Pressable style={styles.tileWorker}>
                    <Text style={styles.splitEmoji}>📍</Text>
                    <Text style={styles.splitTitle} numberOfLines={1}>
                      {t("home.browse")}
                    </Text>
                    <Text style={styles.splitSub}>
                      {t("home.browse_sub")}
                    </Text>
                  </Pressable>
                </Link>
                <Link href="/venue-browse-workers" asChild>
                  <Pressable style={styles.tileVenue}>
                    <Text style={styles.splitEmoji}>👥</Text>
                    <Text style={styles.splitTitle} numberOfLines={1}>
                      {t("home.see_candidates")}
                    </Text>
                    <Text style={styles.splitSub}>
                      {t("home.see_candidates_sub")}
                    </Text>
                  </Pressable>
                </Link>
              </View>

              {/* Scan QR — primary CTA between the two tile rows */}
              <Link href="/scan" asChild>
                <Pressable style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>
                    {t("home.scan_qr")}
                  </Text>
                </Pressable>
              </Link>

              {/* Signup tiles */}
              <View style={styles.splitRow}>
                <Link href="/signup?next=worker-profile" asChild>
                  <Pressable style={styles.tileWorker}>
                    <Text style={styles.splitEmoji}>👤</Text>
                    <Text style={styles.splitTitle}>
                      {t("home.worker_cta")}
                    </Text>
                    <Text style={styles.splitSub}>
                      {t("home.worker_sub")}
                    </Text>
                  </Pressable>
                </Link>
                <Link href="/venue-type" asChild>
                  <Pressable style={styles.tileVenue}>
                    <Text style={styles.splitEmoji}>🏪</Text>
                    <Text style={styles.splitTitle}>
                      {t("home.venue_cta")}
                    </Text>
                    <Text style={styles.splitSub}>
                      {t("home.venue_sub")}
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </>
          )}

          {/* Signed in but no profiles yet: prompt to start */}
          {signedIn && !ctx.hasVenue && !ctx.hasWorker && (
            <View style={styles.splitRow}>
              <Link href="/signup?next=worker-profile" asChild>
                <Pressable style={styles.splitBtn}>
                  <Text style={styles.splitEmoji}>👤</Text>
                  <Text style={styles.splitTitle}>
                    {t("home.worker_cta")}
                  </Text>
                  <Text style={styles.splitSub}>
                    {t("home.worker_sub")}
                  </Text>
                </Pressable>
              </Link>
              <Link href="/venue-type" asChild>
                <Pressable style={styles.splitBtn}>
                  <Text style={styles.splitEmoji}>🏪</Text>
                  <Text style={styles.splitTitle}>
                    {t("home.venue_cta")}
                  </Text>
                  <Text style={styles.splitSub}>
                    {t("home.venue_sub")}
                  </Text>
                </Pressable>
              </Link>
            </View>
          )}

          {/* Signed-in extras — Scan QR big black pill, then 2 squared tiles */}
          {signedIn && ctx.hasWorker && (
            <>
              {/* Status strip — always shows all 3 pills, red "new" badge in corner */}
              <View style={styles.statusStrip}>
                <Link href="/worker-applications" asChild>
                  <Pressable style={styles.pillHired}>
                    <Text style={styles.pillEmoji}>🎉</Text>
                    <Text style={styles.pillCount}>{workerCounts.hired}</Text>
                    <Text style={styles.pillLabel}>
                      {t("home_in.status_hired_pill")}
                    </Text>
                    {workerCounts.newHired > 0 && (
                      <View style={styles.pillNewBadge}>
                        <Text style={styles.pillNewBadgeTxt}>
                          {workerCounts.newHired > 9
                            ? "9+"
                            : String(workerCounts.newHired)}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </Link>
                <Link href="/worker-applications" asChild>
                  <Pressable style={styles.pillInterview}>
                    <Text style={styles.pillEmoji}>🎬</Text>
                    <Text style={styles.pillCount}>{workerCounts.interview}</Text>
                    <Text style={styles.pillLabel}>
                      {t("home_in.status_interview_pill")}
                    </Text>
                    {workerCounts.newInterview > 0 && (
                      <View style={styles.pillNewBadge}>
                        <Text style={styles.pillNewBadgeTxt}>
                          {workerCounts.newInterview > 9
                            ? "9+"
                            : String(workerCounts.newInterview)}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </Link>
                <Link href="/worker-applications" asChild>
                  <Pressable style={styles.pillStarred}>
                    <Text style={styles.pillEmoji}>⭐️</Text>
                    <Text style={styles.pillCount}>{workerCounts.starred}</Text>
                    <Text style={styles.pillLabel}>
                      {t("home_in.status_starred_pill")}
                    </Text>
                    {workerCounts.newStarred > 0 && (
                      <View style={styles.pillNewBadge}>
                        <Text style={styles.pillNewBadgeTxt}>
                          {workerCounts.newStarred > 9
                            ? "9+"
                            : String(workerCounts.newStarred)}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </Link>
              </View>

              <Link href="/scan" asChild>
                <Pressable style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>
                    {t("home.scan_qr")}
                  </Text>
                </Pressable>
              </Link>

              <View style={styles.splitRow}>
                <Link href="/worker-applications" asChild>
                  <Pressable style={styles.tileWorker}>
                    <Feather name="send" size={22} color="#185FA5" />
                    <Text style={styles.splitTitle} numberOfLines={1}>
                      {t("home_in.my_applications")}
                    </Text>
                    <Text style={styles.splitSub}>
                      {t("home_in.my_applications_sub")}
                    </Text>
                  </Pressable>
                </Link>
                <Pressable style={styles.tileVenue} onPress={onShare}>
                  <Feather name="share-2" size={22} color="#F0531C" />
                  <Text style={styles.splitTitle} numberOfLines={1}>
                    {t("home_in.share_profile")}
                  </Text>
                  <Text style={styles.splitSub}>
                    {t("home_in.share_profile_sub")}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {signedIn && ctx.hasVenue && (
            <>
              <Link href="/venue-browse-workers" asChild>
                <Pressable style={styles.greenPill}>
                  <Feather name="users" size={16} color="#3B6D11" />
                  <Text style={styles.greenPillTxt}>
                    {t("home_in.browse_workers")}
                  </Text>
                </Pressable>
              </Link>
              <Pressable
                style={styles.qrPill}
                onPress={async () => {
                  if (!ctx.venueId) return;
                  try {
                    const vp = getVenueProfile();
                    await downloadVenueQRPoster({
                      venueId: ctx.venueId,
                      venueName: ctx.venueName ?? vp?.name ?? "",
                      venueCity: vp?.city,
                    });
                  } catch (e) {
                    console.warn("[home] downloadVenueQRPoster failed:", e);
                    Alert.alert(
                      t("home_in.print_qr"),
                      String((e as Error)?.message ?? e),
                    );
                  }
                }}
              >
                <Feather name="printer" size={16} color="white" />
                <Text style={styles.qrPillTxt}>{t("home_in.print_qr")}</Text>
              </Pressable>
              <Pressable style={styles.bigPill} onPress={onShare}>
                <Feather name="share-2" size={16} color="#185FA5" />
                <Text style={styles.bigPillTxt}>
                  {t("home_in.share_gigi")}
                </Text>
              </Pressable>

              {/* Tavoria Pro upsell — hidden in the first 7 days so brand-new
                  venues don't see a paywall before they've found their footing.
                  The /venue-pro page itself remains accessible by deep link. */}
              {isProEligible() && (
                <Pressable
                  style={styles.proCard}
                  onPress={() => router.push("/venue-pro")}
                >
                  <View style={styles.proCardHeader}>
                    <View style={styles.proCardBadge}>
                      <Feather name="star" size={12} color="white" />
                      <Text style={styles.proCardKicker}>
                        {t("venue_pro.kicker")}
                      </Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color="rgba(255,255,255,0.8)"
                    />
                  </View>
                  <Text style={styles.proCardTitle}>
                    {t("venue_pro.title")}
                  </Text>
                  <Text style={styles.proCardSub}>{t("venue_pro.sub")}</Text>
                  <View style={styles.proBullets}>
                    <ProBullet text={t("venue_pro.bullet1")} />
                    <ProBullet text={t("venue_pro.bullet2")} />
                    <ProBullet text={t("venue_pro.bullet3")} />
                  </View>
                </Pressable>
              )}

              {/* Tiny free-tier reassurance below */}
              <View style={styles.freeCard}>
                <View style={styles.freeKickerRow}>
                  <Feather name="check-circle" size={14} color="#3B6D11" />
                  <Text style={styles.freeKicker}>
                    {t("venue_pro.free_kicker")}
                  </Text>
                </View>
                <Text style={styles.freeTitle}>
                  {t("venue_pro.free_title")}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <FreeBullet text={t("venue_pro.free_b1")} />
                  <FreeBullet text={t("venue_pro.free_b2")} />
                  <FreeBullet text={t("venue_pro.free_b3")} />
                </View>
              </View>
            </>
          )}

          {/* K3Y Solutions legal footer — both signed-in and signed-out home */}
          <LegalFooter />
        </View>
      </ScrollView>

      {/* Floating WhatsApp button — re-enable once a dedicated business
          number is set up (post-Milan launch). Hidden for now so we don't
          publish a personal mobile to the public app.
      <WhatsAppFAB />
      */}

      {/* Language picker modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPickerOpen(false)}
        />
        <View style={styles.langSheet}>
          <View style={styles.langSheetHandle} />
          <Text style={styles.langSheetTitle}>{t("language.pick")}</Text>
          {LANGUAGES.map((l) => (
            <Pressable
              key={l.code}
              onPress={async () => {
                await setLanguage(l.code);
                setLang(l.code);
                setPickerOpen(false);
              }}
              style={[
                styles.langRow,
                l.code === lang && styles.langRowOn,
              ]}
            >
              <Text style={styles.langRowFlag}>{l.flag}</Text>
              <Text style={styles.langRowLbl}>{l.label}</Text>
              <View style={styles.langRowCheck}>
                {l.code === lang && (
                  <Feather name="check-circle" size={20} color="#F0531C" />
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function ProBullet({ text }: { text: string }) {
  return (
    <View style={styles.proBulletRow}>
      <View style={styles.proBulletDot}>
        <Feather name="check" size={11} color="#F0531C" />
      </View>
      <Text style={styles.proBulletTxt}>{text}</Text>
    </View>
  );
}

function FreeBullet({ text }: { text: string }) {
  return (
    <View style={styles.freeBulletRow}>
      <Feather name="check" size={11} color="#3B6D11" />
      <Text style={styles.freeBulletTxt}>{text}</Text>
    </View>
  );
}

// Small legal footer rendered at the bottom of the home screen (both states).
// Privacy + Terms both route to /terms — the /terms page contains both sections
// until we split them out.
function LegalFooter() {
  // Simpler implementation: uses router.push directly via Pressable instead of
  // <Link asChild><Pressable>, and avoids the flexWrap+gap style combo that
  // was triggering a React Native Web CSSStyleDeclaration error on Chrome.
  const router = useRouter();
  return (
    <View style={styles.legalFooter}>
      <Text style={styles.legalLine}>K3Y Solutions S.r.l. — Milano, Italia</Text>
      <View style={styles.legalRow}>
        <Pressable onPress={() => router.push("/terms")} hitSlop={8}>
          <Text style={styles.legalLink}>{t("home.footer_privacy")}</Text>
        </Pressable>
        <Text style={styles.legalDot}>  ·  </Text>
        <Pressable onPress={() => router.push("/terms")} hitSlop={8}>
          <Text style={styles.legalLink}>{t("home.footer_terms")}</Text>
        </Pressable>
        <Text style={styles.legalDot}>  ·  </Text>
        <Pressable
          onPress={() => void openExternalLink("mailto:hello@tavoriapp.com", t("external_link.email"))}
          hitSlop={8}
        >
          <Text style={styles.legalLink}>hello@tavoriapp.com</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Floating WhatsApp chat button — Italian SMBs live in WhatsApp, so a one-tap
// way to reach support reduces friction for the venue side.
function WhatsAppFAB() {
  // TODO: replace placeholder number with the real Tavoria support number.
  const WA_URL =
    "https://wa.me/+393331234567?text=" + encodeURIComponent("Ciao Tavoria");
  return (
    <Pressable
      onPress={() => void openExternalLink(WA_URL, t("external_link.whatsapp"))}
      style={styles.waFab}
      hitSlop={6}
      accessibilityLabel="Chat on WhatsApp"
    >
      <Feather name="message-circle" size={26} color="white" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  authGate: { backgroundColor: "#F7F4EE", flex: 1 },
  safe: { flex: 1, backgroundColor: "#F7F4EE" },
  kicker: { color: "#6B7280", fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },

  // Signed-out: dedicated flex layout, NOT a ScrollView
  signedOutRoot: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    justifyContent: "space-between",
  },
  signedOutTop: { alignItems: "center", paddingTop: 12 },
  signedOutBottom: { gap: 12 },

  container: {
    flexGrow: 1,
    minHeight: "100%",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: "center",
  },

  topBar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(14,26,36,0.12)",
  },
  langFlag: { fontSize: 16 },
  langCode: { fontSize: 11, fontWeight: "800", color: "#0E1A24", letterSpacing: 0.8 },
  // Keep both header actions flush with the shared 20px content gutter.
  topLink: { paddingVertical: 6 },
  topLinkTxt: { color: "#6B7280", fontSize: 14, fontWeight: "600" },

  wordmarkWrap: { marginTop: 8, alignItems: "center", paddingVertical: 4, height: 60, justifyContent: "center" },
  wordmark: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 44,
    fontWeight: "400",
    color: "#0E1A24",
    letterSpacing: -1.5,
    lineHeight: 56,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  accentLetter: { color: "#F0531C" },

  // Compact serif hero below the wordmark.
  hero: { alignItems: "center", paddingTop: 28 },
  headline: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 34,
    fontWeight: "400",
    color: "#0E1A24",
    lineHeight: 36,
    letterSpacing: -1,
    textAlign: "center",
  },
  accent: { color: "#F0531C" },
  sub: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    maxWidth: 320,
    textAlign: "center",
  },

  actions: { width: "100%", gap: 6, marginTop: 2 },
  primaryBtn: {
    backgroundColor: "#0E1A24",
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryBtnText: { color: "#F7F4EE", fontSize: 17, fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(11,15,26,0.15)",
  },
  secondaryBtnText: { color: "#0E1A24", fontSize: 14, fontWeight: "600" },

  // Signed-out entry points mirror the landing page hierarchy.
  landingVenueBtn: {
    alignItems: "center",
    backgroundColor: "#F0531C",
    borderRadius: 999,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    paddingVertical: 17,
    shadowColor: "#F0531C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
  },
  landingVenueBtnText: { color: "#F7F4EE", fontSize: 17, fontWeight: "700" },
  landingWorkerBtn: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "rgba(14,26,36,0.2)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    paddingVertical: 17,
  },
  landingWorkerBtnText: { color: "#0E1A24", fontSize: 17, fontWeight: "700" },
  landingBrowseBtn: {
    alignItems: "center",
    backgroundColor: colors.tertiary,
    borderRadius: 999,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    paddingVertical: 17,
  },
  landingBrowseBtnText: { color: colors.secondary, fontSize: 17, fontWeight: "700" },
  scanQrLink: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  scanQrLinkText: { color: "#5C6670", fontSize: 14, fontWeight: "600" },

  splitRow: { flexDirection: "row", gap: 10 },
  firstSplitRow: { marginTop: 14 },
  splitBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(11,15,26,0.10)",
    alignItems: "center",
    gap: 2,
  },
  // Worker-side tile (See venues + I'm a worker) — full self-contained style
  tileWorker: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: "center",
    gap: 2,
    backgroundColor: "#9CC3E8",
    borderWidth: 1.5,
    borderColor: "#185FA5",
    position: "relative",
  },
  tileBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "#F0531C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F1EFE8",
  },
  tileBadgeTxt: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 13,
  },
  statusStrip: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    marginBottom: 14,
  },
  pillHired: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: "#DAF1C5",
    borderColor: "#3B6D11",
    position: "relative",
    gap: 4,
  },
  pillInterview: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: "#E6F1FB",
    borderColor: "#185FA5",
    position: "relative",
    gap: 4,
  },
  pillStarred: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: "#FAEEDA",
    borderColor: "#D4A24C",
    position: "relative",
    gap: 4,
  },
  pillNewBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "#A32D2D",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F1EFE8",
  },
  pillNewBadgeTxt: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 13,
  },
  pillEmoji: {
    fontSize: 26,
  },
  pillCount: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0E1A24",
    lineHeight: 26,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2C3038",
  },
  updateCardHired: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    backgroundColor: "#DAF1C5",
    borderColor: "#3B6D11",
  },
  updateCardInterview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    backgroundColor: "#E6F1FB",
    borderColor: "#185FA5",
  },
  updateCardStarred: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    backgroundColor: "#FAEEDA",
    borderColor: "#D4A24C",
  },
  updateEmoji: { fontSize: 32 },
  updateTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0E1A24",
    marginBottom: 2,
  },
  updateBody: {
    fontSize: 13,
    color: "#2C3038",
    lineHeight: 18,
  },
  // Venue-side tile (See candidates + I'm a venue) — full self-contained style
  tileVenue: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FFAB7D",
    borderWidth: 1.5,
    borderColor: "#F0531C",
  },
  splitEmoji: { fontSize: 22, marginBottom: 2 },
  splitTitle: { fontSize: 13, fontWeight: "700", color: "#0E1A24", textAlign: "center" },
  splitSub: { fontSize: 11, color: "#5A6473", textAlign: "center" },

  signedInGreeting: {
    marginVertical: 14,
    alignItems: "center",
  },
  greetingTxt: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 16,
    fontWeight: "400",
    color: "#6B7280",
    letterSpacing: -0.2,
  },

  // "Continue as ..." cards
  continueCard: {
    backgroundColor: "#F0531C",
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  continueCardWorker: {
    backgroundColor: "#185FA5",
  },
  // When there's only ONE profile, give it more presence
  continueCardSolo: {
    paddingVertical: 28,
    gap: 22,
    borderRadius: 22,
  },
  continueHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  continueIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },
  continueKicker: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  continueTitle: {
    fontFamily: "InstrumentSerif_400Regular",
    color: "white",
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: -0.3,
    marginTop: 1,
  },
  continueRow: { flexDirection: "row", gap: 8 },
  continueBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
  },
  continueBtnPrimary: { backgroundColor: "rgba(0,0,0,0.22)", position: "relative" },
  inboxBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#F0531C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "white",
  },
  inboxBadgeTxt: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
  continueBtnGhost: { backgroundColor: "white" },
  continueBtnTxtPrimary: { color: "white", fontWeight: "800", fontSize: 14 },
  continueBtnTxt: { color: "#0E1A24", fontWeight: "800", fontSize: 14 },

  // Consistent full-width pill (Scan, Browse shifts, Browse workers, etc.)
  bigPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(11,15,26,0.15)",
    paddingVertical: 16,
    borderRadius: 999,
  },
  bigPillTxt: { color: "#0E1A24", fontWeight: "700", fontSize: 15 },

  // Light green pill for "Browse workers nearby" — fully self-contained
  // (avoids array-merge quirks that left it without a background).
  greenPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EAF3DE",
    borderWidth: 1.5,
    borderColor: "#3B6D11",
    paddingVertical: 16,
    borderRadius: 999,
  },
  greenPillTxt: { color: "#3B6D11", fontWeight: "700", fontSize: 15 },

  // Black solid pill for the Print QR CTA — stands out below the lighter pills
  qrPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0E1A24",
    paddingVertical: 16,
    borderRadius: 999,
  },
  qrPillTxt: { color: "white", fontWeight: "700", fontSize: 15 },

  // Tavoria Pro upsell card — orange-filled, sits below Print QR
  proCard: {
    backgroundColor: "#0E1A24",
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
    gap: 6,
  },
  proCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  proCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0531C",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  proCardKicker: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  proCardTitle: {
    fontFamily: "InstrumentSerif_400Regular",
    color: "white",
    fontSize: 18,
    fontWeight: "400",
    letterSpacing: -0.3,
    lineHeight: 23,
  },
  proCardSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 8,
  },
  proBullets: { gap: 8, marginBottom: 12 },
  proBulletRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  proBulletDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(255,90,31,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  proBulletTxt: { color: "white", fontSize: 13, fontWeight: "600" },
  proCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F7F4EE",
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 4,
  },
  proCtaTxt: { color: "#0E1A24", fontSize: 14, fontWeight: "800" },
  proPrice: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },

  // Free-tier reassurance card — light green, below the Pro upsell
  freeCard: {
    backgroundColor: "#EAF3DE",
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: "rgba(59,109,17,0.20)",
  },
  freeKickerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  freeKicker: {
    color: "#3B6D11",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  freeTitle: {
    fontFamily: "InstrumentSerif_400Regular",
    color: "#3B6D11",
    fontSize: 15,
    fontWeight: "400",
    marginTop: 4,
    letterSpacing: -0.2,
  },
  freeBulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  freeBulletTxt: { color: "#3B6D11", fontSize: 12, fontWeight: "600" },

  // QR modal — door-sticker preview + share
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
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 18,
    fontWeight: "400",
    color: "#0E1A24",
    textAlign: "center",
  },
  qrSub: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 8,
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

  // Language picker modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  langSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  langSheetHandle: {
    alignSelf: "center",
    backgroundColor: "#D7D9DC",
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    width: 36,
  },
  langSheetTitle: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 24,
    fontWeight: "400",
    color: "#0E1A24",
    textAlign: "left",
    marginBottom: 14,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#F7F4EE",
    marginBottom: 8,
  },
  langRowOn: { backgroundColor: "#FFF1E8", borderWidth: 1, borderColor: "#F0531C" },
  langRowFlag: { fontSize: 22, textAlign: "center", width: 26 },
  langRowLbl: { flex: 1, fontSize: 16, fontWeight: "700", color: "#0E1A24" },
  langRowCheck: { alignItems: "center", justifyContent: "center", width: 20 },

  // Section labels above each pair of signed-out home tiles
  sideLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#8A8F9A",
    marginTop: 14,
    marginBottom: 6,
    textAlign: "center",
  },

  // Softer-tinted overrides used only on the signed-out home so each tile-pair
  // reads as "for staff" / "for locali" without shouting.
  tileWorkerSoft: {
    backgroundColor: "#E7F0F9",
    borderColor: "#185FA5",
  },
  tileVenueSoft: {
    backgroundColor: "#FFEFE6",
    borderColor: "#F0531C",
  },

  // Legal footer — sits flush below the action block on the home screen.
  // Uses marginTop spacing instead of `gap` because RN-Web + flexWrap + gap
  // can crash on Chrome with a CSSStyleDeclaration error.
  legalFooter: {
    marginTop: 12,
    alignItems: "center",
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  legalLine: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
  },
  legalDot: { fontSize: 10, color: "#9CA3AF" },
  legalLink: {
    fontSize: 10,
    color: "#6B7280",
    textDecorationLine: "underline",
  },

  // WhatsApp floating action button — bottom-right, above the safe area
  waFab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
