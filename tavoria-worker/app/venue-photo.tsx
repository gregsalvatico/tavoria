import { useGlobalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import {
  PayScheduleId,
  getVenueProfile,
  patchVenueProfile,
} from "../lib/venueProfile";
import { getCurrentVenueRow, updateVenue } from "../lib/db";
import { t } from "../lib/i18n";
import { useIsDesktop } from "../lib/responsive";
import StickyFooter from "../components/StickyFooter";
import ActionButton from "../components/ActionButton";
import ResponsiveModal from "../components/ResponsiveModal";
import { FormFlowHeader } from "../components/PagePrimitives";
import VenueProfileFields from "../components/VenueProfileFields";
import { customPayScheduleValue, storedPayScheduleValue } from "../lib/venueOptions";

const VENUE_SETUP_STEPS = ["style", "schedule"] as const;
type VenueSetupStep = (typeof VENUE_SETUP_STEPS)[number];

export default function VenuePhoto() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { focus } = useGlobalSearchParams<{ focus?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const setupStep: number = typeof focus === "string" && VENUE_SETUP_STEPS.includes(focus as VenueSetupStep)
    ? VENUE_SETUP_STEPS.indexOf(focus as VenueSetupStep)
    : 0;
  const cachedVenue = getVenueProfile();
  const [venueStyle, setVenueStyle] = useState<string | null>(cachedVenue?.venueStyle ?? null);
  const [schedule, setSchedule] = useState<PayScheduleId | null>(cachedVenue?.payScheduleId ?? null);
  const [customSchedule, setCustomSchedule] = useState(customPayScheduleValue(cachedVenue?.payScheduleLabel));
  const [customScheduleOpen, setCustomScheduleOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentVenueRow()
      .then((venue) => {
        if (!active) return;
        if (!venue) {
          const draft = getVenueProfile();
          if (!draft?.id) {
            setRedirecting(true);
            router.replace(draft?.type ? "/venue-info" : "/venue-type");
          }
          return;
        }
        setVenueStyle((venue.venue_style as string | null) ?? null);
        setSchedule((venue.pay_schedule as PayScheduleId | null) ?? null);
        setCustomSchedule(customPayScheduleValue(venue.pay_schedule as string | null));
      })
      .catch((error) => {
        if (active) {
          console.warn("[venue-photo] failed to load venue", error);
          setErrorMsg(t("talent.loadError"));
        }
      })
    return () => { active = false; };
  }, [router]);
  const onContinue = async () => {
    setErrorMsg(null);
    setBusy(true);
    const scheduleValue = storedPayScheduleValue(schedule, customSchedule);
    const venueId = getVenueProfile()?.id;
    try {
      if (venueId) {
        await updateVenue(venueId, {
          pay_schedule: scheduleValue,
          venue_style: venueStyle ?? undefined,
        });
      }
      patchVenueProfile({
        payScheduleId: schedule ?? undefined,
        payScheduleLabel: schedule === "custom" ? customSchedule.trim() : scheduleValue,
        venueStyle: venueStyle ?? undefined,
      });
      // Venue setup is complete. Replace the final setup screen so the first
      // shift cannot navigate back into venue creation.
      // Interview QCM is now a bonus step on /venue-bonus after the post.
      router.replace("/post-shift");
    } catch (e: any) {
      setErrorMsg(e?.message || "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const moveToSetupStep = (nextStep: number) => {
    const next = VENUE_SETUP_STEPS[nextStep];
    if (!next) return;
    router.replace({ pathname: "/venue-photo", params: { focus: next } });
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  const goBack = () => {
    if (setupStep > 0) {
      moveToSetupStep(setupStep - 1);
      return;
    }
    if (router.canGoBack()) { router.back(); return; }
    router.replace("/venue-info");
  };

  const onPrimaryAction = () => {
    if (setupStep < VENUE_SETUP_STEPS.length - 1) {
      moveToSetupStep(setupStep + 1);
      return;
    }
    void onContinue();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FormFlowHeader
        title={t("venue_edit.title")}
        subtitle={t("venue_edit.intro")}
        onBack={goBack}
        step={setupStep + 2}
        total={5}
      />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
        showsVerticalScrollIndicator={false}
      >
        {setupStep === 0 && (
          <VenueProfileFields
            section="style"
            venueStyle={venueStyle}
            paySchedule={schedule}
            customSchedule={customSchedule}
            onVenueStyleChange={setVenueStyle}
            onPayScheduleChange={setSchedule}
            onCustomScheduleChange={setCustomSchedule}
            onOpenCustomSchedule={() => setCustomScheduleOpen(true)}
          />
        )}

        {setupStep === 1 && (
          <VenueProfileFields
            section="schedule"
            venueStyle={venueStyle}
            paySchedule={schedule}
            customSchedule={customSchedule}
            onVenueStyleChange={setVenueStyle}
            onPayScheduleChange={setSchedule}
            onCustomScheduleChange={setCustomSchedule}
            onOpenCustomSchedule={() => setCustomScheduleOpen(true)}
          />
        )}


        <View style={{ height: 12 }} />
        {errorMsg && <Text style={styles.errorTxt}>{errorMsg}</Text>}

      </ScrollView>
      <StickyFooter desktopRow fullBleed backgroundColor="#F7F4EE">
        <View style={styles.footerActions}>
          <ActionButton label={t("common.back")} icon="arrow-left" variant="secondary" onPress={goBack} style={styles.footerButton} />
          <ActionButton label={t("common.continue")} icon="arrow-right" disabled={busy} loading={busy} onPress={onPrimaryAction} style={styles.footerButton} />
        </View>
      </StickyFooter>

      {/* Custom schedule input modal */}
      <ResponsiveModal
        visible={customScheduleOpen}
        onClose={() => setCustomScheduleOpen(false)}
        panelStyle={styles.customSchedulePanel}
      >
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            paddingBottom: 24,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: "rgba(0,0,0,0.08)",
            }}
          >
            <Pressable onPress={() => setCustomScheduleOpen(false)}>
              <Text style={{ color: "#6B7280", fontSize: 15 }}>Cancel</Text>
            </Pressable>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#0E1A24" }}>
              Custom pay schedule
            </Text>
            <Pressable onPress={() => setCustomScheduleOpen(false)}>
              <Text
                style={{ color: "#F0531C", fontSize: 15, fontWeight: "700" }}
              >
                Done
              </Text>
            </Pressable>
          </View>
          <View style={{ padding: 16, paddingBottom: 24 }}>
            <TextInput
              value={customSchedule}
              onChangeText={setCustomSchedule}
              placeholder="e.g. every 2 weeks · invoice monthly"
              placeholderTextColor="#9CA3AF"
              autoFocus
              style={{
                backgroundColor: "white",
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 0.5,
                borderColor: "rgba(0,0,0,0.10)",
                fontSize: 16,
                color: "#0E1A24",
              }}
              returnKeyType="done"
            />
          </View>
        </View>
      </ResponsiveModal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  customSchedulePanel: { backgroundColor: "white", maxWidth: 560 },
  safe: { flex: 1, backgroundColor: "#F7F4EE" },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  scrollDesktop: { alignSelf: "center", maxWidth: 840, paddingHorizontal: 24, width: "100%" },
  errorTxt: { color: "#B91C1C", fontSize: 13, paddingHorizontal: 20, paddingTop: 8, textAlign: "center" },
  footerActions: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "center", maxWidth: 420, width: "100%" },
  footerButton: { flex: 1, width: "auto" },
});
