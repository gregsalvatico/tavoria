import { Feather } from "@expo/vector-icons";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { getCurrentUserContext } from "../lib/db";
import { LANGUAGES, setLanguage, t, useLanguage, type Language } from "../lib/i18n";
import { clearVenueProfile } from "../lib/venueProfile";
import { clearWorkerProfile } from "../lib/workerProfile";
import { getCachedHomeContext, setCachedHomeContext, type HomeContext } from "../lib/homeContextCache";
import { getAccountMenuSections, type AccountMenuActionId } from "../lib/accountNavigation";
import { supabase } from "../lib/supabase";
import { TAVORIA } from "../lib/designTokens";
import ChangePinModal from "./ChangePinModal";
import ContactTavoriaModal from "./ContactTavoriaModal";
import TavoriaModal from "./TavoriaModal";
import VenueQrFab from "./VenueQrFab";

const FOCUSED_ROUTES = new Set([
  "apply",
  "applied",
  "interview-prep",
  "post-shift",
  "record",
  "scan",
  "shift-edit",
  "shift-media-edit",
  "register",
  "signin",
  "terms",
  "venue-media-edit",
  "venue-bonus",
  "venue-done",
  "venue-edit",
  "venue-info",
  "venue-interview",
  "venue-photo",
  "venue-profile-media",
  "venue-avatar-edit",
  "venue-type",
  "venue-welcome",
  "worker-bonus",
  "worker-done",
  "worker-documents",
  "worker-experience",
  "worker-interview",
  "worker-media",
  "worker-media-edit",
  "worker-personality",
  "worker-photos",
  "worker-profile-edit",
  "worker-positions",
  "worker-setup",
  "worker-videos",
  "worker-welcome",
]);

const AUTH_ROUTES = new Set(["signin", "register"]);

const DESKTOP_FLOW_ROUTES = new Set([
  "apply",
  "applied",
  "interview-prep",
  "post-shift",
  "record",
  "scan",
  "shift-edit",
  "shift-media-edit",
  "venue-media-edit",
  "venue-edit",
  "venue-info",
  "venue-interview",
  "venue-photo",
  "venue-profile-media",
  "venue-avatar-edit",
  "venue-bonus",
  "venue-type",
  "venue-done",
  "worker-bonus",
  "worker-experience",
  "worker-done",
  "worker-documents",
  "worker-interview",
  "worker-media",
  "worker-media-edit",
  "worker-personality",
  "worker-photos",
  "worker-profile-edit",
  "worker-positions",
  "worker-setup",
  "worker-videos",
]);

const DESKTOP_INTRO_ROUTES = new Set(["venue-welcome", "worker-welcome"]);
const FORM_FLOW_ROUTES = new Set(["venue-edit", "post-shift", "venue-type", "venue-info", "venue-photo", "venue-profile-media", "worker-media-edit"]);

const DARK_FLOW_ROUTES = new Set(["apply", "record", "scan"]);
const PAPER_FLOW_ROUTES = new Set(["venue-info", "venue-photo", "venue-type"]);
const DESKTOP_SIDEBAR_WIDTH = 238;

type Props = {
  children: ReactNode;
  currentRoute?: string;
  isSignedIn: boolean;
};

export default function AppShell({ children, currentRoute, isSignedIn }: Props) {
  const { width } = useWindowDimensions();
  const [, setLanguageVersion] = useState(0);
  const language = useLanguage();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const route = currentRoute || "index";
  const showSidebar = isDesktop && isSignedIn && !FOCUSED_ROUTES.has(route);
  const isAuthRoute = isDesktop && AUTH_ROUTES.has(route);
  const isFlowRoute = isDesktop && DESKTOP_FLOW_ROUTES.has(route);
  const isFormFlowRoute = isFlowRoute && FORM_FLOW_ROUTES.has(route);
  const isIntroRoute = isDesktop && DESKTOP_INTRO_ROUTES.has(route);
  const isPublicDesktopRoute = isDesktop && !showSidebar && !isAuthRoute && !isFlowRoute && !isIntroRoute && route !== "index";

  const desktopContent = isAuthRoute ? (
    <DesktopAuthFrame route={route}>{children}</DesktopAuthFrame>
  ) : isFlowRoute ? (
    isFormFlowRoute ? <DesktopFormFlowFrame route={route}>{children}</DesktopFormFlowFrame> : <DesktopFlowFrame route={route}>{children}</DesktopFlowFrame>
  ) : showSidebar ? (
    <DesktopAppFrame route={route}>{children}</DesktopAppFrame>
  ) : isPublicDesktopRoute ? (
    <DesktopPublicFrame route={route}>{children}</DesktopPublicFrame>
  ) : (
    children
  );

  return (
    <View style={styles.viewport}>
      <View
        style={[
          styles.workspace,
          showSidebar && styles.sidebarWorkspace,
        ]}
      >
        {showSidebar ? <DesktopSidebar currentRoute={route} onLanguageChange={() => setLanguageVersion((value) => value + 1)} /> : null}
        <View style={[styles.content, showSidebar && styles.sidebarContent]}>
          <View style={styles.contentInner}>{desktopContent}</View>
        </View>
      </View>
    </View>
  );
}

function DesktopPublicFrame({
  route,
  children,
}: {
  route: string;
  children: ReactNode;
}) {
  const surfaceColor = DARK_FLOW_ROUTES.has(route)
    ? "#0E1A24"
    : route === "terms" || route === "venue-board"
      ? "#F1EFE8"
      : "#F7F4EE";
  return (
    <View style={[styles.publicSurface, { backgroundColor: surfaceColor }]}>
      <View style={styles.publicSurfaceInner}>{children}</View>
    </View>
  );
}

function DesktopAppFrame({
  route,
  children,
}: {
  route: string;
  children: ReactNode;
}) {
  const surfaceColor = DARK_FLOW_ROUTES.has(route) ? "#0E1A24" : "#F1EFE8";

  return (
    <View style={[styles.appSurface, { backgroundColor: surfaceColor }]}>
      {children}
    </View>
  );
}

function DesktopAuthFrame({
  route,
  children,
}: {
  route: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.desktopFrame}>
      <View style={styles.authImageAside}>
        <Image source={require("../assets/tavoria-signin.png")} style={styles.authImage} resizeMode="cover" />
      </View>
      <View style={styles.authMain}>
        <View style={styles.authMainInner}>{children}</View>
      </View>
    </View>
  );
}

function DesktopFlowFrame({
  route,
  children,
}: {
  route: string;
  children: ReactNode;
}) {
  const workerFlow = isWorkerFlowRoute(route);
  if (workerFlow) {
    return (
      <View style={styles.desktopFrame}>
        <DesktopFormFlowSidebar route={route} />
        <View style={[styles.flowMain, { backgroundColor: "#F1EFE8" }]}>
          <View style={styles.flowMainInner}>{children}</View>
        </View>
      </View>
    );
  }

  const activeStep = route.includes("welcome") || route === "venue-type" || route === "worker-setup"
    ? 0
    : route.includes("done") || route === "applied"
      ? 2
      : 1;
  const flowSteps = workerFlow
    ? [t("desktop_flow.worker_step_1"), t("desktop_flow.worker_step_2"), t("desktop_flow.worker_step_3")]
    : [t("desktop_flow.venue_step_1"), t("desktop_flow.venue_step_2"), t("desktop_flow.venue_step_3")];

  return (
    <View style={styles.desktopFrame}>
      <View style={styles.flowAside}>
        <Text style={styles.flowBrand}>
          Tavoria<Text style={styles.brandAccent}>.</Text>
        </Text>
        <View style={styles.flowAsideCopy}>
          <Text style={styles.flowKicker}>{t(workerFlow ? "desktop_flow.worker_kicker" : "desktop_flow.venue_kicker")}</Text>
          <Text style={styles.flowTitle}>
            {t(workerFlow ? "desktop_flow.worker_title" : "desktop_flow.venue_title")}
          </Text>
          <Text style={styles.flowSub}>
            {t(workerFlow ? "desktop_flow.worker_sub" : "desktop_flow.venue_sub")}
          </Text>
        </View>
        <View style={styles.flowSteps}>
          {flowSteps.map((step, index) => (
            <View key={step} style={styles.flowStep}>
              <View style={[styles.flowStepDot, index <= activeStep && styles.flowStepDotActive]} />
              <Text style={[styles.flowStepLabel, index === activeStep && styles.flowStepLabelActive]}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.flowMain, { backgroundColor: DARK_FLOW_ROUTES.has(route) ? "#0E1A24" : PAPER_FLOW_ROUTES.has(route) ? "#F7F4EE" : "#F1EFE8" }]}>
        <View style={styles.flowMainInner}>{children}</View>
      </View>
    </View>
  );
}

type FormFlowStep = {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

function isWorkerFlowRoute(route: string) {
  return route.startsWith("worker-") || ["apply", "applied", "interview-prep", "record", "scan"].includes(route);
}

function formFlowSteps(route: string): FormFlowStep[] {
  if (route === "worker-media-edit") {
    return [
      { id: "profile", label: t("home_in.my_card"), icon: "user" },
      { id: "media", label: t("talent.media"), icon: "image" },
    ];
  }
  if (isWorkerFlowRoute(route)) {
    return [
      { id: "profile", label: t("desktop_flow.worker_step_1"), icon: "user" },
      { id: "story", label: t("desktop_flow.worker_step_2"), icon: "book-open" },
      { id: "live", label: t("desktop_flow.worker_step_3"), icon: "check-circle" },
    ];
  }
  if (route === "venue-edit" || route === "venue-profile-media") {
    return [
      { id: "details", label: t("venue_info.title"), icon: "edit-3" },
      { id: "style", label: t("venue_style.title"), icon: "star" },
      { id: "schedule", label: t("pay_schedule.title"), icon: "calendar" },
      { id: "contact", label: t("venue_edit.contact_title"), icon: "mail" },
      { id: "media", label: t("talent.media"), icon: "image" },
    ];
  }
  if (route !== "post-shift") {
    return [
      { id: "type", label: t("venue_type.title"), icon: "layers" },
      { id: "details", label: t("venue_info.title"), icon: "edit-3" },
      { id: "style", label: t("venue_style.title"), icon: "star" },
      { id: "schedule", label: t("pay_schedule.title"), icon: "calendar" },
    ];
  }
  return [
    { id: "roles", label: t("post_shift.for"), icon: "users" },
    { id: "contract", label: t("post_shift.contract"), icon: "briefcase" },
    { id: "schedule", label: t("post_shift.days"), icon: "calendar" },
    { id: "availability", label: t("post_shift.when"), icon: "clock" },
    { id: "pay", label: t("post_shift.pay"), icon: "credit-card" },
    { id: "requirements", label: t("talent.requirements"), icon: "check-square" },
    { id: "review", label: t("post_shift.review"), icon: "check-circle" },
  ];
}

function formFlowActiveStep(route: string, focus: unknown, steps: FormFlowStep[]) {
  if (route === "venue-type") return "type";
  if (route === "venue-info") return "details";
  if (route === "venue-profile-media" || route === "worker-media-edit") return "media";
  if (typeof focus === "string" && steps.some((step) => step.id === focus)) return focus;
  if (isWorkerFlowRoute(route)) {
    if (["worker-setup", "worker-positions", "apply"].includes(route)) return "profile";
    if (["worker-experience", "interview-prep", "record", "scan"].includes(route)) return "story";
    return "live";
  }
  return route === "venue-edit" ? "details" : steps[0]?.id;
}

function formFlowDestination(route: string, stepId: string) {
  if (route === "worker-media-edit" && stepId === "profile") return "/candidate";
  if (stepId === "media") return route === "worker-media-edit" ? "/worker-media-edit" : "/venue-profile-media";
  if (isWorkerFlowRoute(route)) {
    if (["apply", "applied", "interview-prep", "record", "scan", "worker-profile-edit"].includes(route)) return null;
    if (stepId === "profile") return "/worker-positions";
    if (stepId === "story") return "/worker-experience";
    return "/worker-bonus";
  }
  if (route === "venue-edit" || route === "venue-profile-media") {
    return { pathname: "/venue-edit", params: { focus: stepId } };
  }
  if (route === "post-shift") {
    return { pathname: "/post-shift", params: { focus: stepId } };
  }
  if (stepId === "type") return "/venue-type";
  if (stepId === "details") return "/venue-info";
  return { pathname: "/venue-photo", params: { focus: stepId } };
}

function DesktopFormFlowFrame({
  route,
  children,
}: {
  route: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.desktopFrame}>
      <DesktopFormFlowSidebar route={route} />
      <View style={[styles.flowMain, { backgroundColor: "#F1EFE8" }]}>
        <View style={styles.flowMainInner}>{children}</View>
      </View>
    </View>
  );
}

function DesktopFormFlowSidebar({ route }: { route: string }) {
  const router = useRouter();
  // Global params are required here because the sidebar lives above the
  // screen content in AppShell. Local params can remain stale when only the
  // focus query parameter changes on the same route.
  const params = useGlobalSearchParams<{ focus?: string }>();
  const steps = formFlowSteps(route);
  const activeStep = formFlowActiveStep(route, params.focus, steps);

  return (
    <View style={styles.sidebar}>
      <Pressable
        style={({ pressed }) => [styles.sidebarBrand, pressed && styles.sidebarBrandPressed]}
        onPress={() => router.replace("/")}
        accessibilityRole="button"
        accessibilityLabel={t("home_in.home")}
      >
        <Text style={styles.brandText}>
          <Text style={styles.brandAccent}>T</Text>avoria<Text style={styles.brandAccent}>.</Text>
        </Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.sidebarNavGroup}>
          {steps.map((step) => {
            const active = step.id === activeStep;
            return (
              <Pressable
                key={step.id}
                onPress={() => {
                  if (!active) {
                    const destination = formFlowDestination(route, step.id);
                    if (destination) router.replace(destination as never);
                  }
                }}
                style={({ hovered, pressed }) => [
                  styles.sidebarNavItem,
                  active && styles.sidebarNavItemActive,
                  hovered && !active && styles.sidebarNavItemHovered,
                  pressed && styles.sidebarNavItemPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={step.label}
              >
                <Feather
                  name={step.icon}
                  size={18}
                  color={active ? TAVORIA.color.orange : "rgba(14,26,36,0.62)"}
                />
                <Text style={[styles.sidebarNavLabel, active && styles.sidebarNavLabelActive]} numberOfLines={2}>
                  {step.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function DesktopSidebar({ currentRoute, onLanguageChange }: { currentRoute: string; onLanguageChange: () => void }) {
  const router = useRouter();
  const [context, setContext] = useState<HomeContext | null>(() => getCachedHomeContext());
  const [contextLoading, setContextLoading] = useState(() => !getCachedHomeContext());
  const [languageOpen, setLanguageOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [changePinOpen, setChangePinOpen] = useState(false);
  const language = useLanguage();

  useEffect(() => {
    let active = true;
    const cached = getCachedHomeContext();
    if (cached) {
      setContext(cached);
      setContextLoading(false);
    } else {
      setContextLoading(currentRoute === "index");
    }
    getCurrentUserContext()
      .then((next) => {
        if (active) {
          setContext(next);
          setContextLoading(false);
        }
      })
      .catch(() => {
        if (active) setContextLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentRoute]);

  const venueRoute =
    currentRoute.startsWith("venue-") ||
    currentRoute.startsWith("venue/") ||
    currentRoute === "post-shift" ||
    currentRoute === "shift-edit";
  const venueMode = venueRoute || !!context?.hasVenue;
  const displayName = venueMode
    ? context?.venueName || t("home_in.continue_venue")
    : context?.workerName || t("home_in.continue_worker");
  const initials = displayName.charAt(0).toUpperCase();
  const accountMenu = getAccountMenuSections(venueMode ? "venue" : "worker");

  const items = useMemo(
    () =>
      venueMode
        ? [
            { route: "/venue-browse-workers", icon: "users", label: t("home_in.candidates") },
            { route: "/venue-inbox", icon: "inbox", label: t("home_in.inbox") },
            { route: "/venue-shifts", icon: "briefcase", label: t("home_in.my_shifts") },
          ]
        : [
            { route: "/", icon: "compass", label: t("home_in.venues") },
            { route: "/worker-applications", icon: "send", label: t("home_in.my_applications") },
            { route: "/candidate", icon: "user", label: t("home_in.my_card") },
          ],
    [language, venueMode]
  );

  const share = async () => {
    try {
      await Share.share({
        message: venueMode ? t("home_in.share_venue_msg") : t("home_in.share_worker_msg"),
      });
    } catch {}
  };

  const chooseLanguage = async (next: Language) => {
    await setLanguage(next);
    setLanguageOpen(false);
    onLanguageChange();
  };

  const runMenuAction = (id: AccountMenuActionId) => {
    if (id === "language") {
      setLanguageOpen(true);
      return;
    }
    if (id === "change_pin") {
      setChangePinOpen(true);
      return;
    }
    if (id === "share") {
      void share();
      return;
    }
    setContactOpen(true);
  };

  if (contextLoading && currentRoute === "index") {
    return (
      <View style={styles.sidebar}>
        <Pressable
          style={({ hovered, pressed }) => [
            styles.sidebarBrand,
            hovered && styles.sidebarBrandHovered,
            pressed && styles.sidebarBrandPressed,
          ]}
          onPress={() => router.replace("/")}
          accessibilityRole="button"
        >
          <Text style={styles.brandText}><Text style={styles.brandAccent}>T</Text>avoria<Text style={styles.brandAccent}>.</Text></Text>
        </Pressable>
        <View style={styles.sidebarLoading}>
          <ActivityIndicator color={TAVORIA.color.orange} size="small" />
        </View>
      </View>
    );
  }

  const signOut = async () => {
    clearWorkerProfile();
    clearVenueProfile();
    setCachedHomeContext({ hasVenue: false, hasWorker: false });
    await supabase.auth.signOut().catch(() => {});
    router.replace("/");
  };

  return (
    <View style={styles.sidebar}>
      <Pressable
        style={({ hovered, pressed }) => [
          styles.sidebarBrand,
          hovered && styles.sidebarBrandHovered,
          pressed && styles.sidebarBrandPressed,
        ]}
        onPress={() => router.replace("/")}
        accessibilityRole="button"
        accessibilityLabel={t("home_in.home")}
      >
        <Text style={styles.brandText}>
          <Text style={styles.brandAccent}>T</Text>avoria<Text style={styles.brandAccent}>.</Text>
        </Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.sidebarNavGroup}>
          {items.map((item) => {
            const itemRoute = item.route.slice(1) || "index";
            const homeRoute = venueMode ? "venue-browse-workers" : "index";
            const active = itemRoute === currentRoute || (currentRoute === "index" && itemRoute === homeRoute);
            return (
              <Pressable
                key={item.route}
                onPress={() => {
                  if (!active) router.replace(item.route as never);
                }}
                style={({ hovered, pressed }) => [
                  styles.sidebarNavItem,
                  active && styles.sidebarNavItemActive,
                  hovered && !active && styles.sidebarNavItemHovered,
                  pressed && styles.sidebarNavItemPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
              >
                <Feather
                  name={item.icon as keyof typeof Feather.glyphMap}
                  size={18}
                  color={active ? TAVORIA.color.orange : "rgba(14,26,36,0.62)"}
                />
                <Text style={[styles.sidebarNavLabel, active && styles.sidebarNavLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {accountMenu.roleActions.length ? (
          <View style={styles.sidebarUtilityGroup}>
            {accountMenu.roleActions.map((item) => (
              <Pressable
                key={item.id}
                style={({ hovered, pressed }) => [
                  styles.sidebarUtilityItem,
                  hovered && styles.sidebarUtilityItemHovered,
                  pressed && styles.sidebarUtilityItemPressed,
                ]}
                onPress={() => runMenuAction(item.id)}
                accessibilityRole="button"
              >
                <Feather name={item.icon} size={17} color="rgba(14,26,36,0.62)" />
                <Text style={styles.sidebarUtilityLabel}>{t(item.labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.sidebarUtilityGroup}>
          {accountMenu.commonActions.map((item) => (
            <Pressable
              key={item.id}
              style={({ hovered, pressed }) => [
                styles.sidebarUtilityItem,
                hovered && styles.sidebarUtilityItemHovered,
                pressed && styles.sidebarUtilityItemPressed,
              ]}
              onPress={() => runMenuAction(item.id)}
              accessibilityRole="button"
            >
              <Feather name={item.icon} size={17} color="rgba(14,26,36,0.62)" />
              <Text style={styles.sidebarUtilityLabel}>{t(item.labelKey)}</Text>
              {item.id === "language" ? <Text style={styles.sidebarUtilityMeta}>{language.toUpperCase()}</Text> : null}
            </Pressable>
          ))}
        </View>
        {venueMode ? <VenueQrFab variant="sidebar" /> : null}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <Pressable
          onPress={() => router.push(venueMode ? "/venue-shifts" : "/candidate")}
          style={({ hovered, pressed }) => [
            styles.sidebarAccount,
            hovered && styles.sidebarAccountHovered,
            pressed && styles.sidebarAccountPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={venueMode ? "Open venue profile" : "Open worker profile"}
        >
          {venueMode && context?.venuePhotoUrl ? (
            <Image source={{ uri: context.venuePhotoUrl }} style={styles.sidebarAvatar} />
          ) : context?.workerPhotoUrl ? (
            <Image source={{ uri: context.workerPhotoUrl }} style={styles.sidebarAvatar} />
          ) : (
            <View style={[styles.sidebarAvatar, styles.sidebarAvatarFallback]}>
              <Text style={styles.sidebarAvatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.sidebarAccountCopy}>
            <Text style={styles.sidebarAccountName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.sidebarAccountMeta} numberOfLines={1}>
              {venueMode ? context?.venueCity || "Venue" : context?.workerCity || "Worker"}
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => void signOut()}
          style={({ hovered, pressed }) => [
            styles.sidebarSignOut,
            hovered && styles.sidebarSignOutHovered,
            pressed && styles.sidebarSignOutPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("common.sign_out")}
        >
          <Feather name="log-out" size={16} color="rgba(14,26,36,0.62)" />
          <Text style={styles.sidebarSignOutText}>{t("common.sign_out")}</Text>
        </Pressable>
      </View>

      <TavoriaModal visible={languageOpen} onClose={() => setLanguageOpen(false)} title={t("language.pick")}>
        {LANGUAGES.map((option) => (
          <Pressable
            key={option.code}
            onPress={() => void chooseLanguage(option.code)}
            style={({ hovered, pressed }) => [
              styles.sidebarLanguageOption,
              option.code === language && styles.sidebarLanguageOptionActive,
              hovered && styles.sidebarLanguageOptionHovered,
              pressed && styles.sidebarLanguageOptionPressed,
            ]}
          >
            <Text style={styles.sidebarLanguageFlag}>{option.flag}</Text>
            <Text style={styles.sidebarLanguageLabel}>{option.label}</Text>
            {option.code === language ? <Feather name="check" size={17} color={TAVORIA.color.orange} /> : null}
          </Pressable>
        ))}
      </TavoriaModal>
      <ContactTavoriaModal visible={contactOpen} onClose={() => setContactOpen(false)} />
      <ChangePinModal visible={changePinOpen} onClose={() => setChangePinOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    backgroundColor: TAVORIA.color.paper,
    flex: 1,
  },
  workspace: {
    backgroundColor: "#F7F4EE",
    flex: 1,
    width: "100%",
  },
  sidebarWorkspace: {
    flexDirection: "row",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  contentInner: {
    flex: 1,
    width: "100%",
  },
  // Keep the desktop content breathing room at the top, but let sticky
  // footers reach the viewport edge instead of exposing the shell background.
  sidebarContent: { backgroundColor: TAVORIA.color.paperDeep, minWidth: 0, paddingTop: TAVORIA.space.lg },
  publicSurface: { flex: 1, minWidth: 0, width: "100%" },
  publicSurfaceInner: { alignSelf: "center", flex: 1, minWidth: 0, width: "100%" },
  appSurface: { flex: 1, minWidth: 0, width: "100%" },
  desktopFrame: {
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
    width: "100%",
  },
  authImageAside: { backgroundColor: "#0E1A24", flex: 1, minWidth: 0, overflow: "hidden" },
  authImage: { height: "100%", width: "100%" },
  authMain: { flex: 1, minWidth: 0 },
  authMainInner: { flex: 1, width: "100%" },
  flowAside: {
    backgroundColor: "#0E1A24",
    flexShrink: 0,
    padding: 30,
    width: DESKTOP_SIDEBAR_WIDTH,
  },
  flowBrand: {
    color: "#F7F4EE",
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 30,
  },
  flowAsideCopy: { marginTop: 90 },
  flowKicker: {
    color: "#F0531C",
    fontFamily: "DMMono_500Medium",
    fontSize: 10,
    letterSpacing: 1.5,
  },
  flowTitle: {
    color: "#F7F4EE",
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 34,
    lineHeight: 38,
    marginTop: 14,
  },
  flowSub: {
    color: "rgba(247,244,238,0.62)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
  },
  flowSteps: { gap: 20, marginTop: 56 },
  flowStep: { alignItems: "center", flexDirection: "row", gap: 11 },
  flowStepDot: {
    backgroundColor: "rgba(247,244,238,0.22)",
    borderRadius: 999,
    height: 9,
    width: 9,
  },
  flowStepDotActive: { backgroundColor: "#F0531C" },
  flowStepLabel: { color: "rgba(247,244,238,0.48)", fontSize: 12 },
  flowStepLabelActive: { color: "#F7F4EE", fontWeight: "800" },
  flowMain: { flex: 1, minWidth: 0 },
  // Keep the page frame full width so sticky action bars can reach the
  // viewport edge. Individual flow screens constrain their content separately.
  flowMainInner: { flex: 1, minWidth: 0, width: "100%" },
  sidebar: {
    backgroundColor: "#F7F4EE",
    borderRightColor: "rgba(14,26,36,0.12)",
    borderRightWidth: 1,
    flexShrink: 0,
    position: "relative",
    width: DESKTOP_SIDEBAR_WIDTH,
  },
  sidebarBrand: { borderRadius: 10, marginBottom: 20, marginHorizontal: 14, marginTop: 20, paddingHorizontal: 11, paddingVertical: 10 },
  sidebarBrandHovered: { backgroundColor: "rgba(14,26,36,0.07)", borderRadius: 10 },
  sidebarBrandPressed: { opacity: 0.72 },
  brandText: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 31, letterSpacing: -0.6 },
  brandAccent: { color: "#F0531C" },
  sidebarScroll: { paddingHorizontal: 14, paddingBottom: 24 },
  sidebarNavGroup: { gap: 4 },
  sidebarNavItem: { alignItems: "center", borderRadius: 10, flexDirection: "row", gap: 12, minHeight: 44, paddingHorizontal: 11 },
  sidebarNavItemActive: { backgroundColor: TAVORIA.color.orangeSoft },
  sidebarNavItemHovered: { backgroundColor: "rgba(14,26,36,0.07)" },
  sidebarNavItemPressed: { opacity: 0.72 },
  sidebarNavLabel: { color: "rgba(14,26,36,0.68)", flex: 1, fontSize: 13, fontWeight: "700" },
  sidebarNavLabelActive: { color: TAVORIA.color.orange },
  sidebarUtilityGroup: { borderTopColor: "rgba(14,26,36,0.1)", borderTopWidth: 1, gap: 2, marginTop: 18, paddingTop: 14 },
  sidebarUtilityItem: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 40, paddingHorizontal: 11 },
  sidebarUtilityItemHovered: { backgroundColor: "rgba(14,26,36,0.07)", borderRadius: 10 },
  sidebarUtilityItemPressed: { opacity: 0.72 },
  sidebarUtilityLabel: { color: "rgba(14,26,36,0.68)", flex: 1, fontSize: 12, fontWeight: "700" },
  sidebarUtilityMeta: { color: "rgba(14,26,36,0.45)", fontFamily: "DMMono_500Medium", fontSize: 10 },
  sidebarLoading: { alignItems: "center", flex: 1, justifyContent: "center" },
  sidebarFooter: { borderTopColor: "rgba(14,26,36,0.1)", borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 18 },
  sidebarAccount: { alignItems: "center", borderRadius: 10, flexDirection: "row", gap: 10, minHeight: 44, paddingHorizontal: 11, paddingVertical: 6 },
  sidebarAccountHovered: { backgroundColor: "rgba(14,26,36,0.07)", borderRadius: 10 },
  sidebarAccountPressed: { opacity: 0.72 },
  sidebarAvatar: { borderRadius: 999, height: 36, width: 36 },
  sidebarAvatarFallback: { alignItems: "center", backgroundColor: "#FFE9DB", justifyContent: "center" },
  sidebarAvatarText: { color: "#F0531C", fontFamily: "InstrumentSerif_400Regular", fontSize: 20 },
  sidebarAccountCopy: { flex: 1, minWidth: 0 },
  sidebarAccountName: { color: "#0E1A24", fontSize: 13, fontWeight: "700" },
  sidebarAccountMeta: { color: "rgba(14,26,36,0.52)", fontSize: 11, marginTop: 2 },
  sidebarSignOut: { alignItems: "center", borderRadius: 10, flexDirection: "row", gap: 9, marginTop: 17, minHeight: 40, paddingHorizontal: 11, paddingVertical: 5 },
  sidebarSignOutHovered: { backgroundColor: "rgba(14,26,36,0.07)", borderRadius: 10 },
  sidebarSignOutPressed: { opacity: 0.72 },
  sidebarSignOutText: { color: "rgba(14,26,36,0.62)", fontSize: 12, fontWeight: "700" },
  sidebarLanguageOption: { alignItems: "center", backgroundColor: TAVORIA.color.paperDeep, borderRadius: TAVORIA.radius.small, flexDirection: "row", gap: 10, marginBottom: 8, minHeight: 44, paddingHorizontal: 10 },
  sidebarLanguageOptionActive: { backgroundColor: TAVORIA.color.orangeSoft },
  sidebarLanguageOptionHovered: { backgroundColor: "#E9E7E1" },
  sidebarLanguageOptionPressed: { opacity: 0.72 },
  sidebarLanguageFlag: { fontSize: 20, textAlign: "center", width: 25 },
  sidebarLanguageLabel: { color: TAVORIA.color.navy, flex: 1, fontSize: 13, fontWeight: "700" },
});
