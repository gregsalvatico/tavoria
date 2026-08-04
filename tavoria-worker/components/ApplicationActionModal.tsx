import { Feather } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { t } from "../lib/i18n";

export type ApplicationAction = "decline" | "star" | "interview" | "hire";
export type InterviewSchedule = { scheduledAt: string; location: string };
export type InterviewLocationType = "venue" | "phone" | "video" | "other";
const DEFAULT_LOCATION_OPTIONS: InterviewLocationType[] = ["venue", "phone", "video"];

const META: Record<
  ApplicationAction,
  { icon: keyof typeof Feather.glyphMap; color: string; background: string }
> = {
  decline: { icon: "x-circle", color: "#993556", background: "#FCEBEB" },
  star: { icon: "star", color: "#854F0B", background: "#FCF6E8" },
  interview: { icon: "video", color: "#185FA5", background: "#E6F1FB" },
  hire: { icon: "check-circle", color: "#3B6D11", background: "#EAF3DE" },
};

export default function ApplicationActionModal({
  action,
  visible,
  loading,
  venueAddress,
  availableLocationTypes,
  onCancel,
  onConfirm,
}: {
  action: ApplicationAction | null;
  visible: boolean;
  loading: boolean;
  venueAddress?: string;
  availableLocationTypes?: InterviewLocationType[];
  onCancel: () => void;
  onConfirm: (interview?: InterviewSchedule) => void;
}) {
  const [date, setDate] = useState(defaultInterviewDate);
  const [time, setTime] = useState("10:00");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => monthStart(dateFromKey(defaultInterviewDate())));
  const [locationType, setLocationType] = useState<InterviewLocationType>("venue");
  const [customLocation, setCustomLocation] = useState("");
  const locationOptions = (availableLocationTypes?.filter((option): option is InterviewLocationType =>
    ["venue", "phone", "video", "other"].includes(option)
  ).length ? availableLocationTypes : DEFAULT_LOCATION_OPTIONS) as InterviewLocationType[];

  useEffect(() => {
    if (!visible || action !== "interview") return;
    setDate(defaultInterviewDate());
    setTime("10:00");
    setDatePickerOpen(false);
    setCalendarMonth(monthStart(dateFromKey(defaultInterviewDate())));
    setLocationType(locationOptions.includes("venue") ? "venue" : locationOptions[0]);
    setCustomLocation("");
  }, [action, visible, availableLocationTypes]);

  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth]);
  if (!action) return null;
  const meta = META[action];
  const interviewLocation = locationType === "venue"
    ? venueAddress || t("candidate_actions.location_venue")
    : locationType === "phone"
    ? t("candidate_actions.location_phone")
    : locationType === "video"
    ? t("candidate_actions.location_video")
    : customLocation.trim();
  const parsedInterviewDate = new Date(`${date}T${time}:00`);
  const interviewValid =
    action !== "interview" ||
    (/^\d{4}-\d{2}-\d{2}$/.test(date) &&
      /^\d{2}:\d{2}$/.test(time) &&
      !Number.isNaN(parsedInterviewDate.getTime()) &&
      parsedInterviewDate.getTime() > Date.now() &&
      !!interviewLocation);
  const minDateKey = defaultInterviewDate();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {
        if (!loading) onCancel();
      }}
    >
      <View style={styles.overlay}>
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.card}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.icon, { backgroundColor: meta.background }]}>
            <Feather name={meta.icon} size={27} color={meta.color} />
          </View>
          <Text style={styles.title}>
            {t(`candidate_actions.confirm_${action}_title`)}
          </Text>
          <Text style={styles.body}>
            {t(`candidate_actions.confirm_${action}_body`)}
          </Text>

          {action === "interview" ? (
            <View style={styles.scheduleForm}>
              <Text style={styles.formLabel}>{t("candidate_actions.interview_date")}</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={styles.compactLabel}>Date</Text>
                  <Pressable
                    style={styles.datePickerButton}
                    onPress={() => {
                      setCalendarMonth(monthStart(dateFromKey(date)));
                      setDatePickerOpen((open) => !open);
                    }}
                  >
                    <Feather name="calendar" size={16} color="#46505A" />
                    <Text style={styles.datePickerText}>{formatInterviewDate(date)}</Text>
                    <Feather name="chevron-down" size={16} color="#6B7280" />
                  </Pressable>
                </View>
                <View style={styles.timeField}>
                  <Text style={styles.compactLabel}>Time</Text>
                  <TextInput value={time} onChangeText={setTime} placeholder="10:00" placeholderTextColor="#9CA3AF" style={styles.formInput} keyboardType="numbers-and-punctuation" />
                </View>
              </View>

              {datePickerOpen ? (
                <View style={styles.calendar}>
                  <View style={styles.calendarHeader}>
                    <Pressable
                      style={styles.calendarArrow}
                      onPress={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    >
                      <Feather name="chevron-left" size={18} color="#0E1A24" />
                    </Pressable>
                    <Text style={styles.calendarMonth}>
                      {calendarMonth.toLocaleDateString([], { month: "long", year: "numeric" })}
                    </Text>
                    <Pressable
                      style={styles.calendarArrow}
                      onPress={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    >
                      <Feather name="chevron-right" size={18} color="#0E1A24" />
                    </Pressable>
                  </View>
                  <View style={styles.weekdays}>
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                      <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>
                    ))}
                  </View>
                  <View style={styles.calendarGrid}>
                    {calendarDays.map((day) => {
                      const key = dateKey(day);
                      const disabled = day.getMonth() !== calendarMonth.getMonth() || key < minDateKey;
                      const selected = key === date;
                      return (
                        <Pressable
                          key={key}
                          disabled={disabled}
                          onPress={() => {
                            setDate(key);
                            setDatePickerOpen(false);
                          }}
                          style={[styles.calendarDay, selected && styles.calendarDaySelected, disabled && styles.calendarDayDisabled]}
                        >
                          <Text style={[styles.calendarDayText, selected && styles.calendarDayTextSelected, disabled && styles.calendarDayTextDisabled]}>{day.getDate()}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <Text style={styles.formLabel}>{t("candidate_actions.interview_location")}</Text>
              <View style={styles.locationOptions}>
                {locationOptions.map((option) => {
                  const active = option === locationType;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.locationOption, active && styles.locationOptionActive]}
                      onPress={() => setLocationType(option)}
                    >
                      <Feather
                        name={option === "venue" ? "map-pin" : option === "phone" ? "phone" : option === "video" ? "video" : "edit-3"}
                        size={14}
                        color={active ? "#F0531C" : "#6B7280"}
                      />
                      <Text style={[styles.locationOptionText, active && styles.locationOptionTextActive]}>
                        {t(`candidate_actions.location_${option}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {locationType === "venue" && venueAddress ? (
                <Text style={styles.addressPreview}>{venueAddress}</Text>
              ) : null}
              {locationType === "other" ? (
                <TextInput
                  value={customLocation}
                  onChangeText={setCustomLocation}
                  placeholder={t("candidate_actions.location_other_placeholder")}
                  placeholderTextColor="#9CA3AF"
                  style={styles.formInput}
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.workerNotice}>
            <Feather name="mail" size={17} color="#0E1A24" />
            <View style={{ flex: 1 }}>
              <Text style={styles.workerNoticeTitle}>
                {t("candidate_actions.worker_notice_title")}
              </Text>
              <Text style={styles.workerNoticeBody}>
                {t(`candidate_actions.confirm_${action}_worker`)}
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.confirm, { backgroundColor: meta.color }]}
            onPress={() =>
              onConfirm(
                action === "interview"
                  ? {
                      scheduledAt: parsedInterviewDate.toISOString(),
                      location: interviewLocation,
                    }
                  : undefined
              )
            }
            disabled={loading || !interviewValid}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.confirmText}>
                {t(`candidate_actions.confirm_${action}_cta`)}
              </Text>
            )}
          </Pressable>
          <Pressable
            style={styles.cancel}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelText}>{t("common.cancel")}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(14,26,36,0.58)",
  },
  card: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 22,
  },
  modalScroll: { maxHeight: "92%", width: "100%" },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "InstrumentSerif_400Regular",
    color: "#0E1A24",
    fontSize: 27,
    lineHeight: 31,
  },
  body: {
    color: "#46505A",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  scheduleForm: { marginTop: 18 },
  formLabel: { color: "#0E1A24", fontSize: 12, fontWeight: "700", marginBottom: 7, marginTop: 12 },
  dateRow: { flexDirection: "row", gap: 8 },
  dateField: { flex: 1, minWidth: 0 },
  timeField: { flexBasis: 92, flexGrow: 0, flexShrink: 1, minWidth: 0 },
  compactLabel: { color: "#6B7280", fontSize: 10, fontWeight: "800", letterSpacing: 0.5, marginBottom: 5, textTransform: "uppercase" },
  formInput: { backgroundColor: "#F7F4EE", borderColor: "rgba(14,26,36,0.14)", borderRadius: 12, borderWidth: 1, color: "#0E1A24", fontSize: 14, minHeight: 47, paddingHorizontal: 10 },
  datePickerButton: { alignItems: "center", backgroundColor: "#F7F4EE", borderColor: "rgba(14,26,36,0.14)", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 7, minHeight: 47, paddingHorizontal: 10 },
  datePickerText: { color: "#0E1A24", flex: 1, fontSize: 13, fontWeight: "700" },
  calendar: { backgroundColor: "#F7F4EE", borderColor: "rgba(14,26,36,0.12)", borderRadius: 14, borderWidth: 1, marginTop: 9, padding: 10 },
  calendarHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  calendarArrow: { alignItems: "center", height: 32, justifyContent: "center", width: 32 },
  calendarMonth: { color: "#0E1A24", fontSize: 14, fontWeight: "800" },
  weekdays: { flexDirection: "row", marginTop: 6 },
  weekday: { color: "#8A8F98", flex: 1, fontSize: 10, fontWeight: "800", textAlign: "center" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 5 },
  calendarDay: { alignItems: "center", height: 34, justifyContent: "center", width: "14.2857%" },
  calendarDaySelected: { backgroundColor: "#F0531C", borderRadius: 999 },
  calendarDayDisabled: { opacity: 0.28 },
  calendarDayText: { color: "#0E1A24", fontSize: 12, fontWeight: "700" },
  calendarDayTextSelected: { color: "white" },
  calendarDayTextDisabled: { color: "#8A8F98" },
  locationOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  locationOption: { alignItems: "center", backgroundColor: "#F7F4EE", borderColor: "rgba(14,26,36,0.12)", borderRadius: 11, borderWidth: 1, flexDirection: "row", flexGrow: 1, flexBasis: "45%", gap: 6, minHeight: 42, paddingHorizontal: 10, paddingVertical: 8 },
  locationOptionActive: { backgroundColor: "#FFF0E7", borderColor: "#F0531C" },
  locationOptionText: { color: "#5D6670", fontSize: 11, fontWeight: "700" },
  locationOptionTextActive: { color: "#F0531C" },
  addressPreview: { color: "#6B7280", fontSize: 12, lineHeight: 17, marginTop: 8 },
  workerNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 18,
    marginBottom: 20,
    padding: 13,
    borderRadius: 13,
    backgroundColor: "#F1EFE8",
  },
  workerNoticeTitle: {
    color: "#0E1A24",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  workerNoticeBody: { color: "#5D6670", fontSize: 12, lineHeight: 17 },
  confirm: {
    width: "100%",
    minHeight: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  confirmText: { color: "white", fontSize: 15, fontWeight: "700" },
  cancel: {
    width: "100%",
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 7,
  },
  cancelText: { color: "#46505A", fontSize: 14, fontWeight: "600" },
});

function defaultInterviewDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function formatInterviewDate(key: string) {
  return dateFromKey(key).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}
