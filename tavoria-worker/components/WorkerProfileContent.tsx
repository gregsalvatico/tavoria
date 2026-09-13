import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { type ComponentProps, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { countryNameFromCode } from "../lib/countries";
import { t } from "../lib/i18n";
import { localizeRoles } from "../lib/positions";
import { JobPreferences, WEEK_DAYS } from "../lib/workerMatching";
import MediaGrid from "./MediaGrid";

export function mediaSlots(row: any, kind: "photo" | "video"): (string | null)[] {
  const slots = row?.[`${kind}_urls`] ?? [];
  return Array.from({ length: kind === "photo" ? 5 : 3 }, (_, i) =>
    i === 0 ? row?.[`${kind}_url`] ?? null : slots[i] ?? null
  );
}

function Fact({ icon, label, value }: { icon: ComponentProps<typeof Feather>["name"]; label: string; value?: string | null }) {
  const text = value?.trim();
  if (!text) return null;
  return (
    <View style={styles.fact}>
      <Feather name={icon} size={15} color="#626B78" />
      <View style={styles.factBody}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue} numberOfLines={2}>{text}</Text>
      </View>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export default function WorkerProfileContent({ row, owner }: { row: any; owner: boolean }) {
  const router = useRouter();
  const [details, setDetails] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const p: JobPreferences = row?.job_preferences ?? {};
  const photos = mediaSlots(row, "photo").filter((url): url is string => Boolean(url));
  const primaryPhoto = photos[0] ?? null;
  const extraPhotos = photos.slice(1);
  const videos = mediaSlots(row, "video");
  const answers = (row?.interview_answers ?? []).filter((answer: any) => answer?.q_text?.trim() || answer?.a_text?.trim());
  const traits = [...(row?.personality ?? []), ...(row?.strengths ?? [])].filter((trait: unknown) => typeof trait === "string" && trait.trim());
  const name = [row?.first_name, row?.last_name].filter(Boolean).join(" ") || "—";
  const roles = localizeRoles(row?.positions ?? []).join(" · ");
  const location = [row?.city, row?.age_range].filter(Boolean).join(" · ");
  const nationality = row?.nationality ? countryNameFromCode(row.nationality) : null;
  const spokenLanguages = (row?.languages ?? []).join(" · ");
  const factValues = [row?.city, row?.age_range, nationality, row?.years_exp, spokenLanguages];
  const hasFacts = factValues.some((value) => typeof value === "string" && value.trim());
  const availableDays = WEEK_DAYS.filter((day) => p.days?.includes(day));
  const preferenceRows = [
    availableDays.length ? {
      label: t("talent.days"),
      value: `${availableDays.map((day) => t(`talent.${day}`)).join(" · ")}${p.from && p.to ? ` / ${p.from}–${p.to}` : ""}`,
    } : null,
    p.availableFrom?.trim() ? { label: t("talent.availableFrom"), value: p.availableFrom.trim() } : null,
    p.travelRadiusKm ? { label: t("talent.radius"), value: `${p.travelRadiusKm}` } : null,
    p.minimumHourlyPay ? { label: t("talent.minimumPay"), value: `${p.minimumHourlyPay}` } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const hasDetails = answers.length > 0 || traits.length > 0 || Boolean(row?.work_eligibility_it?.trim?.()) || owner;

  return (
    <View style={styles.wrap}>
      <View style={styles.identity}>
        {primaryPhoto ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("talent.photos")}
            onPress={() => setPhoto(primaryPhoto)}
            style={styles.profilePhotoWrap}
          >
            <Image source={{ uri: primaryPhoto }} style={styles.profilePhoto} />
          </Pressable>
        ) : owner ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("talent.photos")}
            onPress={() => router.push("/worker-media-edit?kind=photo" as never)}
            style={styles.addProfilePhoto}
          >
            <Feather name="camera" size={17} color="#626B78" />
            <Text style={styles.addProfilePhotoText}>{t("talent.add")}</Text>
          </Pressable>
        ) : null}
        <View style={styles.identityBody}>
          {p.openToWork !== undefined ? (
            <View style={styles.status}>
              <View style={[styles.statusDot, p.openToWork === false && styles.statusDotPaused]} />
              <Text style={styles.statusText}>{t(p.openToWork ? "talent.openToWork" : "talent.paused")}</Text>
            </View>
          ) : null}
          <Text style={styles.name}>{name}</Text>
          {roles ? <Text style={styles.roles}>{roles}</Text> : null}
          {location ? <Text style={styles.meta}>{location}</Text> : null}
        </View>
      </View>

      {hasFacts ? (
        <View style={styles.facts}>
          <Fact icon="map-pin" label={t("talent.location")} value={row?.city} />
          <Fact icon="calendar" label={t("talent.age")} value={row?.age_range} />
          <Fact icon="globe" label={t("talent.nationality")} value={nationality} />
          <Fact icon="briefcase" label={t("talent.yearsExperience")} value={row?.years_exp ? `${row.years_exp}` : null} />
          <Fact icon="message-circle" label={t("talent.spoken")} value={spokenLanguages} />
        </View>
      ) : null}

      {preferenceRows.length ? (
        <View style={styles.section}>
          <SectionLabel>{t("talent.preferences")}</SectionLabel>
          <View style={styles.detailList}>
            {preferenceRows.map((item, index) => (
              <DetailRow key={item.label} label={item.label} value={item.value} last={index === preferenceRows.length - 1} />
            ))}
          </View>
        </View>
      ) : null}

      {(extraPhotos.length > 0 || owner) ? (
        <View style={styles.section}>
          <SectionLabel>{t("talent.otherPhotos")}</SectionLabel>
          <MediaGrid
            photos={extraPhotos}
            onAdd={owner ? () => router.push("/worker-media-edit?kind=photo" as never) : undefined}
          />
        </View>
      ) : null}

      {(videos.some(Boolean) || owner) ? (
        <View style={styles.section}>
          <SectionLabel>{t("talent.videos")}</SectionLabel>
          <MediaGrid
            videos={videos}
            onAdd={owner ? () => router.push("/worker-media-edit?kind=video" as never) : undefined}
          />
        </View>
      ) : null}

      {hasDetails ? (
        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: details }}
            onPress={() => setDetails((open) => !open)}
            style={styles.detailToggle}
          >
            <SectionLabel>{t("talent.details")}</SectionLabel>
            <Feather name={details ? "chevron-up" : "chevron-down"} size={17} color="#626B78" />
          </Pressable>
          {details ? (
            <View style={styles.detailContent}>
              {row?.work_eligibility_it?.trim?.() ? <Text style={styles.body}>{t(`work_eligibility.${row.work_eligibility_it}`)}</Text> : null}
              {!!traits.length ? <Text style={styles.body}>{traits.join(" · ")}</Text> : null}
              {answers.map((answer: any) => (
                <View key={answer.q_id} style={styles.answer}>
                  <Text style={styles.body}>{answer.q_text}</Text>
                  <Text style={styles.meta}>{answer.a_text}</Text>
                </View>
              ))}
              {owner ? (
                <View style={styles.ownerLinks}>
                  {[["interview", "/worker-interview"], ["personality", "/worker-personality"], ["documents", "/worker-documents"]].map(([key, route]) => (
                    <Pressable key={key} onPress={() => { setDetails(false); router.push(route as never); }} style={styles.textAction}>
                      <Text style={styles.body}>{t(`talent.${key}`)}</Text>
                      <Feather name="arrow-up-right" size={14} color="#626B78" />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      <Modal visible={Boolean(photo)} transparent onRequestClose={() => setPhoto(null)}>
        <View style={styles.modal}>
          <Pressable accessibilityLabel={t("talent.close")} onPress={() => setPhoto(null)} style={styles.close}>
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
          {photo ? <Image source={{ uri: photo }} resizeMode="contain" style={styles.fullVideo} /> : null}
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowDivider]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  identity: { alignItems: "center", flexDirection: "row", gap: 16, paddingBottom: 22 },
  identityBody: { flex: 1, gap: 5, minWidth: 0 },
  profilePhotoWrap: { backgroundColor: "#E6E4DC", borderRadius: 14, height: 136, overflow: "hidden", width: 112 },
  profilePhoto: { height: "100%", width: "100%" },
  addProfilePhoto: { alignItems: "center", backgroundColor: "#E8E6DE", borderRadius: 14, height: 136, justifyContent: "center", width: 112 },
  addProfilePhotoText: { color: "#626B78", fontSize: 12, marginTop: 7 },
  status: { alignItems: "center", flexDirection: "row", gap: 7, marginBottom: 2 },
  statusDot: { backgroundColor: "#477354", borderRadius: 4, height: 7, width: 7 },
  statusDotPaused: { backgroundColor: "#92968E" },
  statusText: { color: "#626B78", fontSize: 12 },
  name: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 34, lineHeight: 38 },
  roles: { color: "#263542", fontSize: 16, lineHeight: 22 },
  meta: { color: "#626B78", fontSize: 13, lineHeight: 19 },
  facts: { borderBottomColor: "rgba(14,26,36,0.12)", borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(14,26,36,0.12)", borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", flexWrap: "wrap", marginBottom: 4, paddingHorizontal: 0, paddingVertical: 2 },
  fact: { alignItems: "flex-start", flexBasis: 145, flexGrow: 1, flexDirection: "row", gap: 9, minWidth: 145, paddingVertical: 12 },
  factBody: { flex: 1, minWidth: 0 },
  factLabel: { color: "#7A818B", fontFamily: "DMMono_500Medium", fontSize: 9, letterSpacing: 0.7, textTransform: "uppercase" },
  factValue: { color: "#0E1A24", fontSize: 13, fontWeight: "600", marginTop: 3 },
  section: { borderBottomColor: "rgba(14,26,36,0.12)", borderBottomWidth: 1, gap: 13, paddingVertical: 20 },
  sectionLabel: { color: "#626B78", fontFamily: "DMMono_500Medium", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  detailList: { gap: 0 },
  detailRow: { alignItems: "baseline", flexDirection: "row", gap: 14, justifyContent: "space-between", paddingVertical: 9 },
  detailRowDivider: { borderBottomColor: "rgba(14,26,36,0.08)", borderBottomWidth: 1 },
  detailLabel: { color: "#626B78", flexShrink: 1, fontSize: 13 },
  detailValue: { color: "#0E1A24", flexShrink: 1, fontSize: 13, fontWeight: "600", textAlign: "right" },
  detailToggle: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 24 },
  detailContent: { gap: 15 },
  body: { color: "#263542", fontSize: 14, lineHeight: 22 },
  answer: { gap: 4 },
  ownerLinks: { gap: 4 },
  textAction: { alignItems: "center", flexDirection: "row", gap: 8, minHeight: 34 },
  modal: { alignItems: "center", backgroundColor: "rgba(14,26,36,.96)", flex: 1, justifyContent: "center", padding: 24 },
  close: { padding: 12, position: "absolute", right: 24, top: 24, zIndex: 2 },
  fullVideo: { height: "82%", maxWidth: 960, width: "100%" },
});
