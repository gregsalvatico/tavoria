import { Feather } from "@expo/vector-icons";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentVenueRow, updateVenue } from "../lib/db";
import { getVenueProfile, patchVenueProfile, type PayScheduleId } from "../lib/venueProfile";
import { websiteUrl } from "../lib/contact";
import { t } from "../lib/i18n";
import { useIsDesktop } from "../lib/responsive";
import ActionButton from "../components/ActionButton";
import StickyFooter from "../components/StickyFooter";
import { FormFlowHeader } from "../components/PagePrimitives";
import { TAVORIA } from "../lib/designTokens";
import VenueProfileFields from "../components/VenueProfileFields";
import { customPayScheduleValue, normalizePaySchedule, storedPayScheduleValue } from "../lib/venueOptions";

type InterviewLocationOption = "venue" | "phone" | "video" | "other";
const DEFAULT_INTERVIEW_OPTIONS: InterviewLocationOption[] = ["venue", "phone", "video"];
const VENUE_EDIT_STEPS = ["details", "style", "schedule", "contact"] as const;
type VenueEditStep = (typeof VENUE_EDIT_STEPS)[number];

export default function VenueEdit() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { focus } = useGlobalSearchParams<{ focus?: string }>();
  const focusKey = typeof focus === "string" && VENUE_EDIT_STEPS.includes(focus as VenueEditStep) ? focus as VenueEditStep : "details";
  const stepIndex = VENUE_EDIT_STEPS.indexOf(focusKey);
  const [venueId, setVenueId] = useState<string | null>(getVenueProfile()?.id ?? null);
  const [name, setName] = useState(getVenueProfile()?.name ?? "");
  const [address, setAddress] = useState(getVenueProfile()?.address ?? "");
  const [email, setEmail] = useState(getVenueProfile()?.email ?? "");
  const [phone, setPhone] = useState(getVenueProfile()?.phone ?? "");
  const [website, setWebsite] = useState(getVenueProfile()?.websiteUrl ?? "");
  const [venueStyle, setVenueStyle] = useState<string | null>(getVenueProfile()?.venueStyle ?? null);
  const [paySchedule, setPaySchedule] = useState<PayScheduleId | null>(getVenueProfile()?.payScheduleId ?? null);
  const [customSchedule, setCustomSchedule] = useState(customPayScheduleValue(getVenueProfile()?.payScheduleLabel));
  const [shareEmail, setShareEmail] = useState(getVenueProfile()?.contactEmailEnabled ?? true);
  const [sharePhone, setSharePhone] = useState(getVenueProfile()?.contactPhoneEnabled ?? true);
  const [allowInPerson, setAllowInPerson] = useState(getVenueProfile()?.contactInPersonEnabled ?? false);
  const [interviewOptions, setInterviewOptions] = useState<InterviewLocationOption[]>(
    (getVenueProfile()?.interviewLocationOptions as InterviewLocationOption[] | undefined) ?? DEFAULT_INTERVIEW_OPTIONS
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const venue = await getCurrentVenueRow();
        if (!venue) {
          if (!getVenueProfile()?.id) setLoadError(t("talent.loadError"));
          return;
        }
        setVenueId(venue.id as string);
        setName((venue.name as string | null) ?? "");
        setAddress((venue.address as string | null) ?? "");
        setEmail((venue.email as string | null) ?? "");
        setPhone((venue.phone as string | null) ?? "");
        setWebsite((venue.website_url as string | null) ?? "");
        setVenueStyle((venue.venue_style as string | null) ?? null);
        setPaySchedule(normalizePaySchedule(venue.pay_schedule as string | null));
        setCustomSchedule(customPayScheduleValue(venue.pay_schedule as string | null));
        setShareEmail(venue.contact_email_enabled !== false);
        setSharePhone(venue.contact_phone_enabled !== false);
        setAllowInPerson(venue.contact_in_person_enabled === true);
        setInterviewOptions(
          Array.isArray(venue.interview_location_options) && venue.interview_location_options.length
            ? (venue.interview_location_options as InterviewLocationOption[])
            : DEFAULT_INTERVIEW_OPTIONS
        );
      } catch (error) {
        console.warn("[venue-edit] failed to load venue", error);
        setLoadError(t("talent.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const goToStep = (index: number) => {
    const next = VENUE_EDIT_STEPS[index];
    if (!next) return;
    router.replace({ pathname: "/venue-edit", params: { focus: next } });
  };

  const persistDraft = async () => {
    if (!venueId) return;
    const nextAddress = address.trim();
    const nextWebsite = websiteUrl(website);
    const city = nextAddress.split(",").pop()?.trim() || "Milan";
    const scheduleValue = storedPayScheduleValue(paySchedule, customSchedule);
    await updateVenue(venueId, {
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(nextAddress ? { address: nextAddress, city } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      phone: phone.trim() || null,
      website_url: nextWebsite || null,
      pay_schedule: scheduleValue,
      venue_style: venueStyle ?? undefined,
      contact_email_enabled: shareEmail,
      contact_phone_enabled: sharePhone,
      contact_in_person_enabled: allowInPerson && !!nextAddress,
      interview_location_options: interviewOptions,
    });
    patchVenueProfile({
      id: venueId,
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(nextAddress ? { address: nextAddress, city } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      phone: phone.trim() || undefined,
      websiteUrl: nextWebsite || undefined,
      payScheduleId: paySchedule ?? undefined,
      payScheduleLabel: paySchedule === "custom" ? customSchedule.trim() : scheduleValue,
      venueStyle: venueStyle ?? undefined,
      contactEmailEnabled: shareEmail,
      contactPhoneEnabled: sharePhone,
      contactInPersonEnabled: allowInPerson && !!nextAddress,
      interviewLocationOptions: interviewOptions,
    });
  };

  const openVenueSection = async (path: "/venue-profile-media") => {
    setSaving(true);
    try {
      await persistDraft();
      router.push(path as never);
    } catch (error: any) {
      Alert.alert(t("talent.loadError"), error?.message ?? t("talent.retry"));
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!venueId || !name.trim() || !email.trim()) {
      Alert.alert(t("talent.invalid"), `${t("venue_info.venue_name")} and ${t("signup.email")} are required.`);
      return;
    }
    const nextWebsite = websiteUrl(website);
    if (website.trim() && !nextWebsite) {
      Alert.alert(t("venue_info.website_invalid"), t("venue_info.website_invalid"));
      return;
    }
    setSaving(true);
    try {
      await persistDraft();
      router.back();
    } catch (error: any) {
      Alert.alert(t("talent.loadError"), error?.message ?? t("talent.retry"));
    } finally {
      setSaving(false);
    }
  };

  const advance = async () => {
    if (stepIndex >= VENUE_EDIT_STEPS.length - 1) {
      await save();
      return;
    }
    setSaving(true);
    try {
      await persistDraft();
      goToStep(stepIndex + 1);
    } catch (error: any) {
      Alert.alert(t("talent.loadError"), error?.message ?? t("talent.retry"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <FormFlowHeader
          title={t("venue_edit.title")}
          step={stepIndex}
          total={VENUE_EDIT_STEPS.length}
          closeOnRight
          onClose={() => router.back()}
          onBack={() => {
            if (stepIndex > 0) {
              goToStep(stepIndex - 1);
              return;
            }
            router.back();
          }}
        />
        {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#F0531C" /></View>
        ) : loadError ? (
          <View style={styles.loadError}><Text style={styles.loadErrorText}>{loadError}</Text></View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {focusKey === "details" ? <View style={styles.flowSection}>
              <Field label={t("venue_info.venue_name")} icon="bookmark" value={name} onChangeText={setName} autoCapitalize="words" />
              <Field label={t("venue_info.address")} icon="map-pin" value={address} onChangeText={setAddress} autoCapitalize="words" />
              <Field label={t("signup.email")} icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Field label={t("venue_info.phone")} icon="phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Field label={t("venue_info.website")} icon="globe" value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" />
              <View style={styles.editLinks}>
                <EditLink icon="image" label={t("talent.manageMedia")} detail={t("venue_edit.media_sub")} onPress={() => void openVenueSection("/venue-profile-media")} />
              </View>
            </View> : null}
            {focusKey === "style" ? <View style={styles.flowSection}>
              <VenueProfileFields
                section="style"
                venueStyle={venueStyle}
                paySchedule={paySchedule}
                customSchedule={customSchedule}
                onVenueStyleChange={setVenueStyle}
                onPayScheduleChange={setPaySchedule}
                onCustomScheduleChange={setCustomSchedule}
                onOpenCustomSchedule={() => undefined}
              />
            </View> : null}
            {focusKey === "schedule" ? <View style={styles.flowSection}>
              <VenueProfileFields
                section="schedule"
                venueStyle={venueStyle}
                paySchedule={paySchedule}
                customSchedule={customSchedule}
                onVenueStyleChange={setVenueStyle}
                onPayScheduleChange={setPaySchedule}
                onCustomScheduleChange={setCustomSchedule}
                onOpenCustomSchedule={() => undefined}
              />
            </View> : null}
            {focusKey === "contact" ? <View>
              <View style={styles.contactSettings}>
                <Text style={styles.contactTitle}>{t("venue_edit.contact_title")}</Text>
                <Text style={styles.contactSub}>{t("venue_edit.contact_sub")}</Text>
                <ContactToggle icon="mail" label={t("venue_card.email")} detail={email || t("venue_edit.add_email")} value={shareEmail} onPress={() => setShareEmail((value) => !value)} disabled={!email} />
                <ContactToggle icon="phone" label={t("venue_info.phone")} detail={phone || t("venue_edit.add_phone")} value={sharePhone} onPress={() => setSharePhone((value) => !value)} disabled={!phone} />
                <ContactToggle icon="map-pin" label={t("venue_card.directions")} detail={address || t("venue_edit.add_address")} value={allowInPerson} onPress={() => setAllowInPerson((value) => !value)} disabled={!address} />
              </View>
              <View style={styles.contactSettings}>
                <Text style={styles.contactTitle}>{t("venue_edit.interview_title")}</Text>
                <Text style={styles.contactSub}>{t("venue_edit.interview_sub")}</Text>
                <InterviewFormatToggle icon="map-pin" label={t("venue_card.directions")} value={interviewOptions.includes("venue")} onPress={() => toggleInterviewOption("venue", interviewOptions, setInterviewOptions)} />
                <InterviewFormatToggle icon="phone" label={t("venue_info.phone")} value={interviewOptions.includes("phone")} onPress={() => toggleInterviewOption("phone", interviewOptions, setInterviewOptions)} />
                <InterviewFormatToggle icon="video" label={t("talent.videos")} value={interviewOptions.includes("video")} onPress={() => toggleInterviewOption("video", interviewOptions, setInterviewOptions)} />
                <InterviewFormatToggle icon="edit-3" label={t("common.other")} value={interviewOptions.includes("other")} onPress={() => toggleInterviewOption("other", interviewOptions, setInterviewOptions)} />
              </View>
            </View> : null}
          </ScrollView>
        )}
        {!loading ? (
          <StickyFooter desktopRow>
            <View style={styles.footerActions}>
              <ActionButton label={t("common.back")} icon="arrow-left" variant="secondary" onPress={() => {
                if (stepIndex > 0) { goToStep(stepIndex - 1); return; }
                router.back();
              }} style={styles.footerButton} />
              <ActionButton
                label={stepIndex === VENUE_EDIT_STEPS.length - 1 ? t("venue_edit.save") : t("common.continue")}
                icon={stepIndex === VENUE_EDIT_STEPS.length - 1 ? "check" : "arrow-right"}
                loading={saving}
                onPress={() => { void advance(); }}
                style={styles.footerButton}
              />
            </View>
          </StickyFooter>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ContactToggle(props: { icon: keyof typeof Feather.glyphMap; label: string; detail: string; value: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable style={[styles.toggleRow, props.disabled && styles.toggleRowDisabled]} onPress={props.onPress} disabled={props.disabled}>
      <View style={styles.toggleIcon}><Feather name={props.icon} size={16} color="#0E1A24" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{props.label}</Text>
        <Text style={styles.toggleDetail} numberOfLines={1}>{props.detail}</Text>
      </View>
      <View style={[styles.switch, props.value && styles.switchOn]}>
        <View style={[styles.switchThumb, props.value && styles.switchThumbOn]} />
      </View>
    </Pressable>
  );
}

function InterviewFormatToggle(props: { icon: keyof typeof Feather.glyphMap; label: string; value: boolean; onPress: () => void }) {
  return <ContactToggle icon={props.icon} label={props.label} detail={props.value ? "Available to candidates" : "Not offered"} value={props.value} onPress={props.onPress} />;
}

function toggleInterviewOption(
  option: InterviewLocationOption,
  current: InterviewLocationOption[],
  setOptions: Dispatch<SetStateAction<InterviewLocationOption[]>>
) {
  if (current.includes(option) && current.length === 1) return;
  setOptions((options) => options.includes(option) ? options.filter((item) => item !== option) : [...options, option]);
}

function EditLink({ icon, label, detail, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; detail: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ hovered, pressed }) => [styles.editLink, hovered && styles.editLinkHovered, pressed && styles.editLinkPressed]}>
      <View style={styles.editLinkIcon}><Feather name={icon} size={16} color="#0E1A24" /></View>
      <View style={styles.editLinkBody}><Text style={styles.editLinkLabel}>{label}</Text><Text style={styles.editLinkDetail}>{detail}</Text></View>
      <Feather name="chevron-right" size={17} color="#626B78" />
    </Pressable>
  );
}

function Field(props: { label: string; icon: keyof typeof Feather.glyphMap; value: string; onChangeText: (value: string) => void; autoCapitalize?: "none" | "words"; keyboardType?: "default" | "email-address" | "phone-pad" | "url" }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.inputWrap}>
        <Feather name={props.icon} size={17} color="#6B7280" />
        <TextInput value={props.value} onChangeText={props.onChangeText} autoCapitalize={props.autoCapitalize} keyboardType={props.keyboardType} style={styles.input} placeholderTextColor="#9CA3AF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TAVORIA.color.paperDeep },
  header: { alignItems: "center", borderBottomColor: TAVORIA.color.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  title: { color: TAVORIA.color.navy, fontFamily: "InstrumentSerif_400Regular", fontSize: 22 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  loadError: { alignItems: "center", flex: 1, justifyContent: "center", padding: TAVORIA.space.lg },
  loadErrorText: { color: TAVORIA.color.muted, fontSize: 14, textAlign: "center" },
  content: { alignSelf: "center", maxWidth: 840, paddingHorizontal: TAVORIA.space.md, paddingTop: TAVORIA.space.sm, paddingBottom: TAVORIA.space.lg, width: "100%" },
  contentDesktop: { paddingHorizontal: TAVORIA.space.lg },
  footerActions: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "center", maxWidth: 420, width: "100%" },
  footerButton: { flex: 1, width: "auto" },
  flowSection: { marginBottom: TAVORIA.space.lg },
  sectionTitle: { color: TAVORIA.color.navy, fontSize: 18, fontWeight: "800" },
  sectionSub: { color: TAVORIA.color.muted, fontSize: 13, lineHeight: 19, marginBottom: TAVORIA.space.md, marginTop: 5 },
  field: { marginBottom: 17 },
  editLinks: { gap: 4, marginTop: 2 },
  editLink: { alignItems: "center", borderRadius: TAVORIA.radius.small, flexDirection: "row", gap: 10, minHeight: 56, paddingHorizontal: 8 },
  editLinkHovered: { backgroundColor: TAVORIA.color.paperDeep },
  editLinkPressed: { opacity: 0.72 },
  editLinkIcon: { alignItems: "center", backgroundColor: TAVORIA.color.paperDeep, borderRadius: 9, height: 32, justifyContent: "center", width: 32 },
  editLinkBody: { flex: 1, gap: 2 },
  editLinkLabel: { color: TAVORIA.color.navy, fontSize: 13, fontWeight: "800" },
  editLinkDetail: { color: TAVORIA.color.muted, fontSize: 11 },
  label: { color: "#0E1A24", fontSize: 12, fontWeight: "800", marginBottom: 7 },
  inputWrap: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.12)", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 52, paddingHorizontal: 14 },
  input: { color: "#0E1A24", flex: 1, fontSize: 15, minHeight: 50 },
  contactSettings: { backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, marginTop: 4, padding: 14 },
  contactTitle: { color: "#0E1A24", fontSize: 14, fontWeight: "800" },
  contactSub: { color: "#5D6670", fontSize: 12, lineHeight: 17, marginBottom: 8, marginTop: 3 },
  toggleRow: { alignItems: "center", borderTopColor: "rgba(14,26,36,0.10)", borderTopWidth: 1, flexDirection: "row", gap: 10, paddingVertical: 11 },
  toggleRowDisabled: { opacity: 0.45 },
  toggleIcon: { alignItems: "center", backgroundColor: TAVORIA.color.paperDeep, borderRadius: 9, height: 32, justifyContent: "center", width: 32 },
  toggleLabel: { color: "#0E1A24", fontSize: 13, fontWeight: "800" },
  toggleDetail: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  switch: { backgroundColor: "#CBD0D4", borderRadius: 999, height: 25, justifyContent: "center", paddingHorizontal: 3, width: 44 },
  switchOn: { backgroundColor: "#F0531C" },
  switchThumb: { backgroundColor: "white", borderRadius: 999, height: 19, width: 19 },
  switchThumbOn: { alignSelf: "flex-end" },
});
