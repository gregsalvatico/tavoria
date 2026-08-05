import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { getVenueProfile, patchVenueProfile } from "../lib/venueProfile";
import { websiteUrl } from "../lib/contact";

type InterviewLocationOption = "venue" | "phone" | "video" | "other";
const DEFAULT_INTERVIEW_OPTIONS: InterviewLocationOption[] = ["venue", "phone", "video"];

export default function VenueEdit() {
  const router = useRouter();
  const [venueId, setVenueId] = useState<string | null>(getVenueProfile()?.id ?? null);
  const [name, setName] = useState(getVenueProfile()?.name ?? "");
  const [address, setAddress] = useState(getVenueProfile()?.address ?? "");
  const [email, setEmail] = useState(getVenueProfile()?.email ?? "");
  const [phone, setPhone] = useState(getVenueProfile()?.phone ?? "");
  const [website, setWebsite] = useState(getVenueProfile()?.websiteUrl ?? "");
  const [shareEmail, setShareEmail] = useState(getVenueProfile()?.contactEmailEnabled ?? true);
  const [sharePhone, setSharePhone] = useState(getVenueProfile()?.contactPhoneEnabled ?? true);
  const [allowInPerson, setAllowInPerson] = useState(getVenueProfile()?.contactInPersonEnabled ?? false);
  const [interviewOptions, setInterviewOptions] = useState<InterviewLocationOption[]>(
    (getVenueProfile()?.interviewLocationOptions as InterviewLocationOption[] | undefined) ?? DEFAULT_INTERVIEW_OPTIONS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const venue = await getCurrentVenueRow();
        if (!venue) return;
        setVenueId(venue.id as string);
        setName((venue.name as string | null) ?? "");
        setAddress((venue.address as string | null) ?? "");
        setEmail((venue.email as string | null) ?? "");
        setPhone((venue.phone as string | null) ?? "");
        setWebsite((venue.website_url as string | null) ?? "");
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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    if (!venueId || !name.trim() || !email.trim()) {
      Alert.alert("Missing details", "Venue name and email are required.");
      return;
    }
    const nextAddress = address.trim();
    const nextWebsite = websiteUrl(website);
    if (website.trim() && !nextWebsite) {
      Alert.alert("Invalid website", "Enter a valid website link, for example yourvenue.com.");
      return;
    }
    const city = nextAddress.split(",").pop()?.trim() || "Milan";
    setSaving(true);
    try {
      await updateVenue(venueId, {
        name: name.trim(),
        address: nextAddress,
        city,
        email: email.trim(),
        // Send null, rather than undefined, so Supabase clears an existing
        // optional value instead of omitting it from the update payload.
        phone: phone.trim() || null,
        website_url: nextWebsite || null,
        contact_email_enabled: shareEmail,
        contact_phone_enabled: sharePhone,
        contact_in_person_enabled: allowInPerson && !!nextAddress,
        interview_location_options: interviewOptions,
      });
      patchVenueProfile({
        id: venueId,
        name: name.trim(),
        address: nextAddress,
        city,
        email: email.trim(),
        phone: phone.trim() || undefined,
        websiteUrl: nextWebsite || undefined,
        contactEmailEnabled: shareEmail,
        contactPhoneEnabled: sharePhone,
        contactInPersonEnabled: allowInPerson && !!nextAddress,
        interviewLocationOptions: interviewOptions,
      });
      router.back();
    } catch (error: any) {
      Alert.alert("Could not save venue", error?.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={12}>
            <Feather name="chevron-left" size={26} color="#0E1A24" />
          </Pressable>
          <Text style={styles.title}>Edit venue</Text>
          <View style={styles.back} />
        </View>
        {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#F0531C" /></View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.lede}>Keep the details workers use to recognise and contact your venue up to date.</Text>
            <Field label="Venue name" icon="bookmark" value={name} onChangeText={setName} autoCapitalize="words" />
            <Field label="Address" icon="map-pin" value={address} onChangeText={setAddress} autoCapitalize="words" />
            <Field label="Email" icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Field label="Phone" icon="phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label="Website" icon="globe" value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" />
            <View style={styles.contactSettings}>
              <Text style={styles.contactTitle}>Contact options after an interview</Text>
              <Text style={styles.contactSub}>Only workers you invite to interview or hire can see these details.</Text>
              <ContactToggle icon="mail" label="Share email" detail={email ? email : "Add an email above"} value={shareEmail} onPress={() => setShareEmail((value) => !value)} disabled={!email} />
              <ContactToggle icon="phone" label="Share phone and WhatsApp" detail={phone ? phone : "Add a phone number above"} value={sharePhone} onPress={() => setSharePhone((value) => !value)} disabled={!phone} />
              <ContactToggle icon="map-pin" label="Invite them to visit in person" detail={address ? address : "Add an address above"} value={allowInPerson} onPress={() => setAllowInPerson((value) => !value)} disabled={!address} />
            </View>
            <View style={styles.contactSettings}>
              <Text style={styles.contactTitle}>Interview formats</Text>
              <Text style={styles.contactSub}>Choose every way you are open to meeting candidates. Venue, phone and video are selected by default.</Text>
              <InterviewFormatToggle icon="map-pin" label="At the venue" value={interviewOptions.includes("venue")} onPress={() => toggleInterviewOption("venue", interviewOptions, setInterviewOptions)} />
              <InterviewFormatToggle icon="phone" label="Phone call" value={interviewOptions.includes("phone")} onPress={() => toggleInterviewOption("phone", interviewOptions, setInterviewOptions)} />
              <InterviewFormatToggle icon="video" label="Video call" value={interviewOptions.includes("video")} onPress={() => toggleInterviewOption("video", interviewOptions, setInterviewOptions)} />
              <InterviewFormatToggle icon="edit-3" label="Another location" value={interviewOptions.includes("other")} onPress={() => toggleInterviewOption("other", interviewOptions, setInterviewOptions)} />
            </View>
            <Pressable style={[styles.save, saving && { opacity: 0.65 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <><Feather name="check" size={18} color="white" /><Text style={styles.saveText}>Save venue details</Text></>}
            </Pressable>
          </ScrollView>
        )}
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
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10 },
  back: { alignItems: "center", justifyContent: "center", width: 34 },
  title: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 22 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  content: { padding: 20, paddingTop: 14 },
  lede: { color: "#5D6670", fontSize: 14, lineHeight: 20, marginBottom: 24 },
  field: { marginBottom: 17 },
  label: { color: "#0E1A24", fontSize: 12, fontWeight: "800", marginBottom: 7 },
  inputWrap: { alignItems: "center", backgroundColor: "white", borderColor: "rgba(14,26,36,0.12)", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 52, paddingHorizontal: 14 },
  input: { color: "#0E1A24", flex: 1, fontSize: 15, minHeight: 50 },
  contactSettings: { backgroundColor: "#FFF4EE", borderColor: "#F7C7AB", borderRadius: 16, borderWidth: 1, marginTop: 4, padding: 14 },
  contactTitle: { color: "#0E1A24", fontSize: 14, fontWeight: "800" },
  contactSub: { color: "#5D6670", fontSize: 12, lineHeight: 17, marginBottom: 8, marginTop: 3 },
  toggleRow: { alignItems: "center", borderTopColor: "rgba(14,26,36,0.10)", borderTopWidth: 1, flexDirection: "row", gap: 10, paddingVertical: 11 },
  toggleRowDisabled: { opacity: 0.45 },
  toggleIcon: { alignItems: "center", backgroundColor: "white", borderRadius: 9, height: 32, justifyContent: "center", width: 32 },
  toggleLabel: { color: "#0E1A24", fontSize: 13, fontWeight: "800" },
  toggleDetail: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  switch: { backgroundColor: "#CBD0D4", borderRadius: 999, height: 25, justifyContent: "center", paddingHorizontal: 3, width: 44 },
  switchOn: { backgroundColor: "#F0531C" },
  switchThumb: { backgroundColor: "white", borderRadius: 999, height: 19, width: 19 },
  switchThumbOn: { alignSelf: "flex-end" },
  save: { alignItems: "center", backgroundColor: "#F0531C", borderRadius: 999, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 12, minHeight: 54, paddingHorizontal: 18 },
  saveText: { color: "white", fontSize: 15, fontWeight: "800" },
});
