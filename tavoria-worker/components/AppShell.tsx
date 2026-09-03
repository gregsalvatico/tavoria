import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { getCurrentUserContext } from "../lib/db";
import { t } from "../lib/i18n";
import { clearVenueProfile } from "../lib/venueProfile";
import { clearWorkerProfile } from "../lib/workerProfile";
import { setCachedHomeContext, type HomeContext } from "../lib/homeContextCache";
import { supabase } from "../lib/supabase";
import VenueQrFab from "./VenueQrFab";

const FOCUSED_ROUTES = new Set([
  "apply",
  "applied",
  "change-pin",
  "how-it-works",
  "interview-prep",
  "post-shift",
  "record",
  "scan",
  "shift-edit",
  "signup",
  "signin",
  "terms",
  "venue-bonus",
  "venue-done",
  "venue-edit",
  "venue-info",
  "venue-interview",
  "venue-photo",
  "venue-pro",
  "venue-type",
  "venue-welcome",
  "worker-bonus",
  "worker-done",
  "worker-experience",
  "worker-interview",
  "worker-media",
  "worker-personality",
  "worker-photos",
  "worker-positions",
  "worker-setup",
  "worker-videos",
  "worker-welcome",
]);

const AUTH_ROUTES = new Set(["signin", "signup"]);

const DESKTOP_FLOW_ROUTES = new Set([
  "apply",
  "applied",
  "change-pin",
  "interview-prep",
  "post-shift",
  "record",
  "scan",
  "shift-edit",
  "venue-edit",
  "venue-info",
  "venue-interview",
  "venue-photo",
  "venue-bonus",
  "venue-type",
  "venue-done",
  "worker-bonus",
  "worker-experience",
  "worker-done",
  "worker-interview",
  "worker-media",
  "worker-personality",
  "worker-photos",
  "worker-positions",
  "worker-setup",
  "worker-videos",
]);

const DESKTOP_INTRO_ROUTES = new Set(["venue-welcome", "worker-welcome"]);

const DARK_FLOW_ROUTES = new Set(["apply", "record", "scan", "venue-pro"]);
const PAPER_FLOW_ROUTES = new Set(["change-pin", "venue-info", "venue-photo", "venue-type"]);

type Props = {
  children: ReactNode;
  currentRoute?: string;
  isSignedIn: boolean;
};

export default function AppShell({ children, currentRoute, isSignedIn }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const route = currentRoute || "index";
  const showSidebar = isDesktop && isSignedIn && !FOCUSED_ROUTES.has(route);
  const isAuthRoute = isDesktop && AUTH_ROUTES.has(route);
  const isFlowRoute = isDesktop && DESKTOP_FLOW_ROUTES.has(route);
  const isIntroRoute = isDesktop && DESKTOP_INTRO_ROUTES.has(route);
  const isPublicDesktopRoute = isDesktop && !showSidebar && !isAuthRoute && !isFlowRoute && !isIntroRoute && route !== "index";

  const desktopContent = isAuthRoute ? (
    <DesktopAuthFrame route={route}>{children}</DesktopAuthFrame>
  ) : isFlowRoute ? (
    <DesktopFlowFrame route={route}>{children}</DesktopFlowFrame>
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
        {showSidebar ? <DesktopSidebar currentRoute={route} /> : null}
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
  const surfaceColor = route === "how-it-works" || DARK_FLOW_ROUTES.has(route)
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
  const isSignup = route === "signup";
  const image = isSignup
    ? require("../assets/position-bartender.png")
    : require("../assets/venue-cafe.png");

  return (
    <View style={styles.desktopFrame}>
      <View style={styles.authAside}>
        <Text style={styles.authAsideBrand}>
          Tavoria<Text style={styles.brandAccent}>.</Text>
        </Text>
        <View style={styles.authAsideCopy}>
          <Text style={styles.authAsideKicker}>
            {isSignup ? t("auth_pin.sign_up_title").toUpperCase() : t("auth_pin.sign_in_title").toUpperCase()}
          </Text>
          <Text style={styles.authAsideTitle}>
            {isSignup ? t("home.headline_top") : t("home.headline_top")}
            {"\n"}
            <Text style={styles.authAsideAccent}>{t("home.headline3")}</Text>
          </Text>
          <Text style={styles.authAsideSub}>{t("home.tagline")}</Text>
        </View>
        <View style={styles.authAsideImageWrap}>
          <Image source={image} style={styles.authAsideImage} resizeMode="cover" />
          <View style={styles.authAsideImageShade} />
          <Text style={styles.authAsideImageLabel}>
            {isSignup ? t("home.worker_cta") : t("home_in.browse_shifts")}
          </Text>
        </View>
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
  const workerFlow =
    route.startsWith("worker-") ||
    ["apply", "applied", "interview-prep", "record", "scan"].includes(route);
  const steps = workerFlow
    ? ["Your details", "Your story", "Go live"]
    : ["Your venue", "What you hire", "Get started"];
  const activeStep = route.includes("welcome") || route === "venue-type" || route === "worker-setup"
    ? 0
    : route.includes("done") || route === "applied"
      ? 2
      : 1;

  return (
    <View style={styles.desktopFrame}>
      <View style={styles.flowAside}>
        <Text style={styles.flowBrand}>
          Tavoria<Text style={styles.brandAccent}>.</Text>
        </Text>
        <View style={styles.flowAsideCopy}>
          <Text style={styles.flowKicker}>{workerFlow ? "WORKER FLOW" : "VENUE FLOW"}</Text>
          <Text style={styles.flowTitle}>
            {workerFlow ? "Build once.\nGet hired again." : "Set up once.\nHire with confidence."}
          </Text>
          <Text style={styles.flowSub}>
            {workerFlow
              ? "A few focused steps and your profile is ready for nearby venues."
              : "Tell venues what you do and start finding the right people."}
          </Text>
        </View>
        <View style={styles.flowSteps}>
          {steps.map((step, index) => (
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

function DesktopSidebar({ currentRoute }: { currentRoute: string }) {
  const router = useRouter();
  const [context, setContext] = useState<HomeContext | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentUserContext()
      .then((next) => {
        if (active) setContext(next);
      })
      .catch(() => {});
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

  const items = useMemo(
    () =>
      venueMode
        ? [
            { route: "/venue-inbox", icon: "inbox", label: t("home_in.inbox") },
            { route: "/venue-shifts", icon: "briefcase", label: t("home_in.my_shifts") },
          ]
        : [
            { route: "/discover", icon: "compass", label: t("home_in.browse_shifts") },
            { route: "/worker-applications", icon: "send", label: t("home_in.my_applications") },
          ],
    [venueMode]
  );

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
        style={styles.sidebarBrand}
        onPress={() => router.replace("/")}
        accessibilityRole="button"
        accessibilityLabel={t("home_in.home")}
      >
        <Text style={styles.brandText}>
          Tavoria<Text style={styles.brandAccent}>.</Text>
        </Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.sidebarNavGroup}>
          {items.map((item) => {
            const itemRoute = item.route.slice(1) || "index";
            const active = itemRoute === currentRoute || (itemRoute === "index" && currentRoute === "index");
            return (
              <Pressable
                key={item.route}
                onPress={() => {
                  if (!active) router.replace(item.route as never);
                }}
                style={[styles.sidebarNavItem, active && styles.sidebarNavItemActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
              >
                <Feather
                  name={item.icon as keyof typeof Feather.glyphMap}
                  size={18}
                  color={active ? "#F7F4EE" : "rgba(247,244,238,0.62)"}
                />
                <Text style={[styles.sidebarNavLabel, active && styles.sidebarNavLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {venueMode ? <VenueQrFab variant="sidebar" /> : null}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <Pressable
          onPress={() => router.push(venueMode ? "/venue-shifts" : "/candidate")}
          style={styles.sidebarAccount}
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
          style={styles.sidebarSignOut}
          accessibilityRole="button"
          accessibilityLabel={t("common.sign_out")}
        >
          <Feather name="log-out" size={16} color="rgba(247,244,238,0.62)" />
          <Text style={styles.sidebarSignOutText}>{t("common.sign_out")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    backgroundColor: "#F7F4EE",
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
  sidebarContent: { minWidth: 0 },
  publicSurface: { flex: 1, minWidth: 0, width: "100%" },
  publicSurfaceInner: { alignSelf: "center", flex: 1, minWidth: 0, width: "100%" },
  appSurface: { flex: 1, minWidth: 0, width: "100%" },
  desktopFrame: {
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
    width: "100%",
  },
  authAside: {
    backgroundColor: "#0E1A24",
    justifyContent: "space-between",
    padding: 34,
    width: 390,
  },
  authAsideBrand: {
    color: "#F7F4EE",
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 30,
  },
  authAsideCopy: { marginTop: 30 },
  authAsideKicker: {
    color: "#F0531C",
    fontFamily: "DMMono_500Medium",
    fontSize: 10,
    letterSpacing: 1.5,
  },
  authAsideTitle: {
    color: "#F7F4EE",
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 47,
    lineHeight: 51,
    marginTop: 14,
  },
  authAsideAccent: { color: "#F0531C" },
  authAsideSub: {
    color: "rgba(247,244,238,0.68)",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 18,
    maxWidth: 300,
  },
  authAsideImageWrap: {
    borderRadius: 16,
    height: 190,
    marginTop: 32,
    overflow: "hidden",
    position: "relative",
  },
  authAsideImage: { height: "100%", width: "100%" },
  authAsideImageShade: {
    backgroundColor: "rgba(14,26,36,0.35)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  authAsideImageLabel: {
    bottom: 14,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    left: 16,
    position: "absolute",
  },
  authMain: { flex: 1, minWidth: 0 },
  authMainInner: { flex: 1, width: "100%" },
  flowAside: {
    backgroundColor: "#0E1A24",
    padding: 30,
    width: 286,
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
  flowMainInner: { alignSelf: "center", flex: 1, maxWidth: 940, width: "100%" },
  sidebar: {
    backgroundColor: "#0E1A24",
    flexShrink: 0,
    position: "relative",
    width: 238,
  },
  sidebarBrand: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 28 },
  brandText: { color: "#F7F4EE", fontFamily: "InstrumentSerif_400Regular", fontSize: 31, letterSpacing: -0.6 },
  brandAccent: { color: "#F0531C" },
  sidebarScroll: { paddingHorizontal: 14, paddingBottom: 24 },
  sidebarNavGroup: { gap: 4 },
  sidebarNavItem: { alignItems: "center", borderRadius: 10, flexDirection: "row", gap: 12, minHeight: 44, paddingHorizontal: 11 },
  sidebarNavItemActive: { backgroundColor: "#F0531C" },
  sidebarNavLabel: { color: "rgba(247,244,238,0.68)", flex: 1, fontSize: 13, fontWeight: "700" },
  sidebarNavLabelActive: { color: "#FFFFFF" },
  sidebarFooter: { borderTopColor: "rgba(247,244,238,0.1)", borderTopWidth: 1, paddingHorizontal: 20, paddingVertical: 18 },
  sidebarAccount: { alignItems: "center", flexDirection: "row", gap: 10 },
  sidebarAvatar: { borderRadius: 999, height: 36, width: 36 },
  sidebarAvatarFallback: { alignItems: "center", backgroundColor: "#FFE9DB", justifyContent: "center" },
  sidebarAvatarText: { color: "#F0531C", fontFamily: "InstrumentSerif_400Regular", fontSize: 20 },
  sidebarAccountCopy: { flex: 1, minWidth: 0 },
  sidebarAccountName: { color: "#F7F4EE", fontSize: 13, fontWeight: "700" },
  sidebarAccountMeta: { color: "rgba(247,244,238,0.46)", fontSize: 11, marginTop: 2 },
  sidebarSignOut: { alignItems: "center", flexDirection: "row", gap: 9, marginTop: 17, paddingVertical: 5 },
  sidebarSignOutText: { color: "rgba(247,244,238,0.6)", fontSize: 12, fontWeight: "700" },
});
