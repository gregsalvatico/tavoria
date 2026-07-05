import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const SCREEN_W = Dimensions.get("window").width;
const ROLE_TILE_SIZE = (SCREEN_W - 20 * 2 - 8 * 2) / 3; // 3 per row, 8px gap, 20px horizontal padding
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PayScheduleId,
  getVenueProfile,
  patchVenueProfile,
} from "../lib/venueProfile";
import { updateVenue, uploadVenuePhoto } from "../lib/db";
import { t } from "../lib/i18n";
import { localizeRole } from "../lib/positions";
import { pickImageWeb } from "../lib/webMedia";

type Schedule = {
  id: PayScheduleId;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

type ScheduleExt = Schedule & { hue: string };

const SCHEDULES: ScheduleExt[] = [
  { id: "sameday", label: "Daily", icon: "zap", hue: "#F59E0B" },
  { id: "weekly", label: "Weekly", icon: "calendar", hue: "#10B981" },
  { id: "monthly", label: "Monthly", icon: "credit-card", hue: "#3B82F6" },
];

// Map schedule id → t() key suffix under pay_schedule.*
const SCHEDULE_KEYS: Record<string, string> = {
  sameday: "daily",
  weekly: "weekly",
  monthly: "monthly",
};

type Variant = {
  id: string;
  // real photos to be added per category; for demo we have cafe
  source?: number;
  hue: string;
  label: string;
};

const VARIANTS: Variant[] = [
  {
    id: "v1",
    source: require("../assets/venue-cafe.png"),
    hue: "#2D6A75",
    label: "Teal night",
  },
  { id: "v2", hue: "#854F0B", label: "Warm sunset" },
  { id: "v3", hue: "#0F6E56", label: "Forest evening" },
  { id: "v4", hue: "#993556", label: "Wine cellar" },
  { id: "v5", hue: "#185FA5", label: "Blue hour" },
  { id: "v6", hue: "#2C2C2A", label: "Industrial chic" },
];

type Role = {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  image: number;
};

const ROLES: Role[] = [
  { id: "barista", label: "Barista", icon: "coffee", image: require("../assets/position-barista.png") },
  { id: "waiter", label: "Waiter", icon: "shopping-bag", image: require("../assets/position-waiter.png") },
  { id: "runner", label: "Runner", icon: "zap", image: require("../assets/position-runner.png") },
  { id: "cashier", label: "Cashier", icon: "credit-card", image: require("../assets/position-cashier.png") },
  { id: "rider", label: "Rider", icon: "navigation", image: require("../assets/position-rider.png") },
  { id: "bartender", label: "Bartender", icon: "wind", image: require("../assets/position-bartender.png") },
  { id: "cook", label: "Cook", icon: "thermometer", image: require("../assets/position-cook.png") },
  { id: "chef", label: "Chef", icon: "award", image: require("../assets/position-chef.png") },
  { id: "cleaner", label: "Cleaner", icon: "trash-2", image: require("../assets/position-cleaner.png") },
];

type VenueStyleOpt = {
  id: string;
  label: string;
  sub: string;
  ionicon: keyof typeof Ionicons.glyphMap;
  hue: string;
};

const VENUE_STYLES: VenueStyleOpt[] = [
  {
    id: "casual",
    label: "Casual",
    sub: "Relaxed pace",
    ionicon: "water-outline",
    hue: "#06B6D4", // ocean teal — wave vibe
  },
  {
    id: "busy",
    label: "Busy",
    sub: "Fast-paced, high volume",
    ionicon: "flash-outline",
    hue: "#EC4899", // hot pink
  },
  {
    id: "upscale",
    label: "Upscale",
    sub: "Refined service",
    ionicon: "star-outline",
    hue: "#3B82F6", // bright blue
  },
  {
    id: "luxury",
    label: "Luxury",
    sub: "Michelin / 5-star",
    ionicon: "ribbon-outline",
    hue: "#A855F7", // royal purple
  },
];

export default function VenuePhoto() {
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>("v1");
  const [pickedRoles, setPickedRoles] = useState<string[]>([]);
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [customRoleInput, setCustomRoleInput] = useState<string>("");
  const [venueStyle, setVenueStyle] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<PayScheduleId | null>(null);
  const [customSchedule, setCustomSchedule] = useState("");
  const [customScheduleOpen, setCustomScheduleOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadedPhotoUri, setUploadedPhotoUri] = useState<string | null>(
    () => getVenueProfile()?.photoUrl ?? null
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Real venue photo upload (logo or storefront)
  async function pickAndUploadPhoto(source: "camera" | "library") {
    setErrorMsg(null);
    const venueId = getVenueProfile()?.id;
    if (!venueId) {
      Alert.alert(
        "Venue not saved yet",
        "Go back and finish the venue info step first."
      );
      return;
    }
    let uri: string;
    if (Platform.OS === "web") {
      // Web: HTML file input. capture="environment" hints the back camera
      // (better for venue/storefront photos) on phone browsers; desktop
      // falls back to file picker.
      const res = await pickImageWeb({
        camera: source === "camera" ? "environment" : false,
      });
      if (res.canceled || !res.assets[0]) return;
      uri = res.assets[0].uri;
    } else {
      const perm =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          source === "camera"
            ? "Camera permission needed"
            : "Photos permission needed",
          "Enable in Settings to continue."
        );
        return;
      }
      const opts = {
        mediaTypes: ["images"] as ImagePicker.MediaType[],
        allowsEditing: true,
        aspect: [4, 3] as [number, number],
        quality: 0.7,
      };
      const res =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets[0]) return;
      uri = res.assets[0].uri;
    }
    setUploadingPhoto(true);
    try {
      const url = await uploadVenuePhoto(venueId, uri);
      patchVenueProfile({ photoUrl: url });
      setUploadedPhotoUri(url);
      // When user uploads their own photo, clear the variant selection
      setPicked(null);
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Try again.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  const onContinue = async () => {
    setErrorMsg(null);
    setBusy(true);
    const standardLabels = pickedRoles
      .map((id) => ROLES.find((r) => r.id === id)?.label)
      .filter((x): x is string => Boolean(x));
    const labels = [...standardLabels, ...customRoles];
    const sObj = SCHEDULES.find((s) => s.id === schedule);
    const scheduleLabel =
      schedule === "custom"
        ? customSchedule.trim() || "Other"
        : sObj?.label;
    const photoVariant = picked ? parseInt(picked.replace("v", ""), 10) : 1;
    const venueId = getVenueProfile()?.id;
    const venueStyleLabel = VENUE_STYLES.find((s) => s.id === venueStyle)?.label;
    try {
      if (venueId) {
        await updateVenue(venueId, {
          photo_variant: photoVariant,
          roles: labels,
          pay_schedule: scheduleLabel,
          venue_style: venueStyle ?? undefined,
        });
      }
      patchVenueProfile({
        photoId: picked ?? undefined,
        roles: labels,
        payScheduleId: schedule ?? undefined,
        payScheduleLabel: scheduleLabel,
        venueStyle: venueStyle ?? undefined,
        venueStyleLabel,
      });
      // Venue basics done — straight to first shift post.
      // Interview QCM is now a bonus step on /venue-bonus after the post.
      router.push("/post-shift");
    } catch (e: any) {
      setErrorMsg(e?.message || "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const toggleRole = (id: string) =>
    setPickedRoles((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) { router.back(); return; }
            router.replace("/venue-info");
          }}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        <ProgressDots step={2} total={4} />
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Venue style / pace section */}
        <Text
          style={[
            styles.h1,
            { marginTop: 22, fontSize: 24, textAlign: "center" },
          ]}
        >
          <Text style={{ color: "#F0531C" }}>
            {t("venue_style.title").charAt(0)}
          </Text>
          {t("venue_style.title").slice(1)}
        </Text>
        <Text style={[styles.sub, { textAlign: "center" }]}>
          {t("venue_style.sub")}
        </Text>

        <View style={styles.styleGrid}>
          {VENUE_STYLES.map((s) => {
            const on = venueStyle === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setVenueStyle(s.id)}
                style={[
                  styles.styleTile,
                  { backgroundColor: s.hue },
                  on && styles.styleTileOn,
                ]}
              >
                <View style={styles.styleTileIconWrap}>
                  <Ionicons name={s.ionicon} size={30} color="white" />
                </View>
                <Text style={styles.styleTileLbl}>{t(`venue_style.${s.id}`)}</Text>
                <Text style={styles.styleTileSub}>{t(`venue_style.${s.id}_sub`)}</Text>
                {on && (
                  <View style={styles.styleTileCheck}>
                    <Feather name="check" size={14} color="white" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Positions section */}
        <Text
          style={[
            styles.h1,
            { marginTop: 22, fontSize: 24, textAlign: "center" },
          ]}
        >
          <Text style={{ color: "#F0531C" }}>
            {t("positions.title").charAt(0)}
          </Text>
          {t("positions.title").slice(1)}
        </Text>
        <Text style={[styles.sub, { textAlign: "center" }]}>
          {t("positions.sub")}
        </Text>

        <View style={styles.rolesGrid}>
          {ROLES.map((r) => {
            const on = pickedRoles.includes(r.id);
            return (
              <Pressable
                key={r.id}
                onPress={() => toggleRole(r.id)}
                style={[styles.roleTile, on && styles.roleTileOn]}
              >
                <Image
                  source={r.image}
                  style={styles.roleTileImg}
                  resizeMode="cover"
                />
                <View style={styles.roleTileScrim} pointerEvents="none" />
                <Text
                  style={styles.roleTileLbl}
                  numberOfLines={1}
                >
                  {localizeRole(r.id)}
                </Text>
                {on && (
                  <View style={styles.roleCheck}>
                    <Feather name="check" size={11} color="white" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Custom positions — freeform text input for specialized roles */}
        <View style={styles.customRoleWrap}>
          <Feather name="plus-circle" size={18} color="#F0531C" />
          <TextInput
            value={customRoleInput}
            onChangeText={setCustomRoleInput}
            onSubmitEditing={() => {
              const v = customRoleInput.trim();
              if (v && !customRoles.includes(v)) {
                setCustomRoles((cur) => [...cur, v]);
              }
              setCustomRoleInput("");
            }}
            placeholder={t("positions.custom_placeholder")}
            placeholderTextColor="#9CA3AF"
            style={styles.customRoleInput}
            returnKeyType="done"
            autoCapitalize="words"
          />
        </View>
        {customRoles.length > 0 && (
          <View style={styles.customRoleChips}>
            {customRoles.map((r) => (
              <Pressable
                key={r}
                onPress={() =>
                  setCustomRoles((cur) => cur.filter((x) => x !== r))
                }
                style={styles.customRoleChip}
              >
                <Text style={styles.customRoleChipTxt}>{r}</Text>
                <Feather name="x" size={12} color="#F7F4EE" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Pay schedule section */}
        <Text
          style={[
            styles.h1,
            { marginTop: 22, fontSize: 24, textAlign: "center" },
          ]}
        >
          <Text style={{ color: "#F0531C" }}>
            {t("pay_schedule.title").charAt(0)}
          </Text>
          {t("pay_schedule.title").slice(1)}
        </Text>
        <Text style={[styles.sub, { textAlign: "center" }]}>
          {t("pay_schedule.sub")}
        </Text>

        <View style={styles.styleGrid}>
          {SCHEDULES.map((s) => {
            const on = schedule === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSchedule(s.id)}
                style={[
                  styles.styleTile,
                  { backgroundColor: s.hue },
                  on && styles.styleTileOn,
                ]}
              >
                <View style={styles.styleTileIconWrap}>
                  <Feather name={s.icon} size={28} color="white" />
                </View>
                <Text style={styles.styleTileLbl}>{t(`pay_schedule.${SCHEDULE_KEYS[s.id] ?? s.id}`)}</Text>
                {on && (
                  <View style={styles.styleTileCheck}>
                    <Feather name="check" size={14} color="white" />
                  </View>
                )}
              </Pressable>
            );
          })}

          {/* Custom option */}
          <Pressable
            onPress={() => {
              setSchedule("custom");
              setCustomScheduleOpen(true);
            }}
            style={[
              styles.styleTile,
              { backgroundColor: "#6B7280" },
              schedule === "custom" && styles.styleTileOn,
            ]}
          >
            <View style={styles.styleTileIconWrap}>
              <Feather name="more-horizontal" size={28} color="white" />
            </View>
            <Text style={styles.styleTileLbl}>
              {schedule === "custom" && customSchedule ? customSchedule : t("pay_schedule.other")}
            </Text>
            {schedule === "custom" && (
              <View style={styles.styleTileCheck}>
                <Feather name="check" size={14} color="white" />
              </View>
            )}
          </Pressable>
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Custom schedule input modal */}
      <Modal
        visible={customScheduleOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomScheduleOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
          onPress={() => setCustomScheduleOpen(false)}
        />
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
      </Modal>

      {errorMsg && <Text style={styles.errorTxt}>{errorMsg}</Text>}

      <View style={styles.bottom}>
        <Pressable
          disabled={busy}
          onPress={onContinue}
          style={[styles.cta, busy && styles.ctaDisabled]}
        >
          {busy ? (
            <ActivityIndicator color="#F7F4EE" />
          ) : (
            <>
              <Text style={styles.ctaTxt}>Continue</Text>
              <Feather name="arrow-right" size={20} color="#F7F4EE" />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.progress}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.progDot, i <= step && styles.progDotActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F4EE" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  iconBtn: { padding: 4 },
  progress: { flexDirection: "row", gap: 5 },
  progDot: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(11,15,26,0.15)",
  },
  progDotActive: { backgroundColor: "#0E1A24" },

  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  h1: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.6,
  },
  sub: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  tile: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#0E1A24",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  tileActive: { borderColor: "#F0531C" },
  tileImg: { width: "100%", height: "100%" },
  tilePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  tilePhTxt: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600",
  },
  tileCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
  },

  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  uploadTxt: { fontSize: 14, fontWeight: "600", color: "#0E1A24" },

  uploadCard: {
    marginTop: 16,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#F0531C",
    borderStyle: "dashed",
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  uploadCardIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "#FFF4EE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  uploadCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0E1A24",
  },
  uploadCardSub: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 240,
  },

  uploadedWrap: {
    marginTop: 14,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    aspectRatio: 4 / 3,
    backgroundColor: "#0E1A24",
  },
  uploadedImg: { width: "100%", height: "100%" },
  uploadedBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#3B6D11",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  uploadedBadgeTxt: { color: "white", fontSize: 11, fontWeight: "700" },
  uploadedReplaceBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  uploadedReplaceTxt: { color: "#F7F4EE", fontSize: 12, fontWeight: "700" },

  customRoleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0531C",
    borderStyle: "dashed",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  customRoleInput: {
    flex: 1,
    fontSize: 15,
    color: "#0E1A24",
    padding: 0,
  },
  customRoleChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  customRoleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0531C",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  customRoleChipTxt: {
    color: "#F7F4EE",
    fontSize: 13,
    fontWeight: "700",
  },

  venueStyleSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 16,
  },

  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  styleTile: {
    width: "47.5%",
    aspectRatio: 1.15,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "transparent",
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  styleTileOn: { borderColor: "#F0531C" },
  styleTileIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  styleTileLbl: {
    fontSize: 16,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    letterSpacing: -0.2,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  styleTileSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 3,
    letterSpacing: 0.2,
  },
  styleTileCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
  },

  rolesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  roleTile: {
    width: ROLE_TILE_SIZE,
    height: ROLE_TILE_SIZE,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  roleTileOn: { borderColor: "#F0531C" },
  roleTileImg: { width: "100%", height: "100%" },
  roleTileScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  roleTileLbl: {
    position: "absolute",
    bottom: 8,
    left: 4,
    right: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  roleCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#F0531C",
    justifyContent: "center",
    alignItems: "center",
  },

  scheduleCol: { gap: 8, marginTop: 14 },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  scheduleRowOn: {
    borderColor: "#F0531C",
    borderWidth: 2,
    backgroundColor: "#FFF4EE",
  },
  scheduleRowCustom: {
    borderStyle: "dashed",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  scheduleIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1EFE8",
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleIconOn: { backgroundColor: "#0E1A24" },
  scheduleLbl: { flex: 1, fontSize: 15, fontWeight: "600", color: "#0E1A24" },
  scheduleLblOn: { color: "#0E1A24", fontWeight: "700" },

  errorTxt: {
    color: "#B91C1C",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  bottom: { padding: 20 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0531C",
    borderRadius: 999,
    paddingVertical: 18,
  },
  ctaDisabled: { backgroundColor: "rgba(11,15,26,0.15)" },
  ctaTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },
});
