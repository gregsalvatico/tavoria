import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { setPostedShift } from "../lib/postedShift";
import { getVenueProfile, patchVenueProfile } from "../lib/venueProfile";
import { getCurrentVenueRow, insertShift } from "../lib/db";
import { t } from "../lib/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAY_CODES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const fmtHHMM = (mins: number) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const ROLES = [
  "Barista",
  "Waiter",
  "Runner",
  "Cashier",
  "Host",
  "Bartender",
  "Cook",
  "Chef",
  "Kitchen helper",
  "Cleaner",
];

const CONTRACTS: {
  id: string;
  label: string;
  defaultUnit: "hour" | "month";
  icon: keyof typeof Feather.glyphMap;
  hue: string;
}[] = [
  { id: "oneoff", label: "One-off", defaultUnit: "hour", icon: "zap", hue: "#F59E0B" },
  { id: "twodays", label: "2 days", defaultUnit: "hour", icon: "calendar", hue: "#EC4899" },
  { id: "pt", label: "Part-time", defaultUnit: "hour", icon: "clock", hue: "#06B6D4" },
  { id: "ft", label: "Full-time", defaultUnit: "month", icon: "briefcase", hue: "#A855F7" },
  { id: "seasonal", label: "Seasonal", defaultUnit: "hour", icon: "sun", hue: "#10B981" },
  { id: "custom", label: "Other", defaultUnit: "hour", icon: "more-horizontal", hue: "#6B7280" },
];

const PAY_UNITS: {
  id: "hour" | "day" | "week" | "month";
  label: string;
  unitTxt: string;
  icon: keyof typeof Feather.glyphMap;
  hue: string;
}[] = [
  { id: "hour", label: "Per hour", unitTxt: "hour", icon: "clock", hue: "#F59E0B" },
  { id: "day", label: "Per day", unitTxt: "day", icon: "sun", hue: "#10B981" },
  { id: "week", label: "Per week", unitTxt: "week", icon: "calendar", hue: "#EC4899" },
  { id: "month", label: "Per month", unitTxt: "month", icon: "credit-card", hue: "#3B82F6" },
];

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const PAY_ACCESSORY_ID = "pay-accessory";

type Shift = { fromMins: number; toMins: number };

// Format minutes-since-midnight to "HH:MM"
const fmt = (mins: number) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// Common hospitality positions venues can post for — used as a fallback when
// the venue's profile doesn't yet have its own positions saved.
const COMMON_ROLES = [
  "Barista",
  "Waiter",
  "Runner",
  "Cashier",
  "Host",
  "Bartender",
  "Cook",
  "Chef",
  "Cleaner",
];

export default function PostShift() {
  const router = useRouter();
  const venueRoles = getVenueProfile()?.roles ?? [];
  // Shifts inherit the venue's saved positions automatically.
  // If a venue wants to change which positions a shift covers, they edit
  // their venue profile on /venue-photo.
  const [roles, setRoles] = useState<string[]>(venueRoles);
  const [contract, setContract] = useState<string | null>(null);
  const [days, setDays] = useState<number[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([{ fromMins: 0, toMins: 0 }]);
  const [startWhen, setStartWhen] = useState<"now" | "asap" | "pickdate" | null>(null);
  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customContract, setCustomContract] = useState("");
  const [customContractOpen, setCustomContractOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const contractObj = useMemo(
    () => CONTRACTS.find((c) => c.id === contract) ?? null,
    [contract]
  );
  const [payUnit, setPayUnit] = useState<"hour" | "day" | "week" | "month" | "later">("hour");
  const [pay, setPay] = useState<number>(0);

  // When the contract type changes, just snap payUnit (don't auto-fill amount —
  // venue picks that on purpose)
  const onPickContract = (id: string) => {
    setContract(id);
    const c = CONTRACTS.find((x) => x.id === id)!;
    if (payUnit !== "later") setPayUnit(c.defaultUnit);
  };

  const onPickPayUnit = (u: "hour" | "day" | "week" | "month" | "later") => {
    setPayUnit(u);
    if (u === "later") setPay(0);
  };

  // Which time field is being edited (e.g. "0-from", "1-to") — controls the modal
  const [editing, setEditing] = useState<string | null>(null);

  const setShiftTime = (idx: number, which: "from" | "to", date: Date) => {
    const mins = date.getHours() * 60 + date.getMinutes();
    setShifts((cur) =>
      cur.map((s, i) =>
        i !== idx
          ? s
          : { ...s, [which === "from" ? "fromMins" : "toMins"]: mins }
      )
    );
  };

  const minsToDate = (mins: number) => {
    const d = new Date();
    d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    return d;
  };

  const toggleRole = (r: string) =>
    setRoles((cur) =>
      cur.includes(r)
        ? cur.filter((x) => x !== r)
        : cur.length >= 3
        ? cur
        : [...cur, r]
    );

  const toggleDay = (i: number) =>
    setDays((cur) =>
      cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort()
    );

  const addShift = () =>
    setShifts((cur) =>
      cur.length >= 2
        ? cur
        : [...cur, { fromMins: 11 * 60, toMins: 15 * 60 }]
    );
  const removeShift = (i: number) =>
    setShifts((cur) => cur.filter((_, idx) => idx !== i));

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <Feather name="chevron-left" size={26} color="#0E1A24" />
        </Pressable>
        <Text style={styles.title}>{t("post_shift.title")}</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Contract */}
        <Section title={t("post_shift.contract")}>
          <View style={styles.tileGrid}>
            {CONTRACTS.filter((c) => c.id !== "custom").map((c) => {
              const on = contract === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => onPickContract(c.id)}
                  style={[
                    styles.tileSm,
                    { backgroundColor: c.hue },
                    on && styles.tileOn,
                  ]}
                >
                  <View style={styles.tileIconWrapSm}>
                    <Feather name={c.icon} size={18} color="white" />
                  </View>
                  <Text style={styles.tileLblSm}>{c.label}</Text>
                  {on && (
                    <View style={styles.tileCheck}>
                      <Feather name="check" size={10} color="white" />
                    </View>
                  )}
                </Pressable>
              );
            })}

            {/* Custom contract tile */}
            <Pressable
              onPress={() => {
                onPickContract("custom");
                setCustomContractOpen(true);
              }}
              style={[
                styles.tileSm,
                { backgroundColor: "#6B7280" },
                contract === "custom" && styles.tileOn,
              ]}
            >
              <View style={styles.tileIconWrapSm}>
                <Feather name="more-horizontal" size={18} color="white" />
              </View>
              <Text style={styles.tileLblSm}>
                {contract === "custom" && customContract.length > 0
                  ? customContract
                  : "Other"}
              </Text>
              {contract === "custom" && (
                <View style={styles.tileCheck}>
                  <Feather name="check" size={10} color="white" />
                </View>
              )}
            </Pressable>
          </View>
        </Section>

        {/* Days */}
        <Section title={t("post_shift.days")} sub={t("post_shift.days_sub")}>
          <View style={styles.daysRow}>
            {DAYS.map((d, i) => {
              const on = days.includes(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => toggleDay(i)}
                  style={[styles.dayPill, on && styles.dayPillOn]}
                >
                  <Text style={[styles.dayPillTxt, on && styles.dayPillTxtOn]}>
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Hours */}
        <Section title={t("post_shift.hours")} sub={t("post_shift.hours_sub")}>
          <View style={{ gap: 8 }}>
            {shifts.map((s, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: "white",
                  borderRadius: 12,
                  borderWidth: 0.5,
                  borderColor: "rgba(0,0,0,0.10)",
                }}
              >
                <View style={{ width: 30 }}>
                  <Feather
                    name={i === 0 ? "sun" : "moon"}
                    size={18}
                    color="#854F0B"
                  />
                </View>
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Pressable
                    onPress={() => setEditing(`${i}-from`)}
                    style={styles.timePillTap}
                  >
                    <Text style={styles.timePillTapTxt}>{fmt(s.fromMins)}</Text>
                  </Pressable>
                  <Text style={{ fontSize: 16, color: "#6B7280" }}>—</Text>
                  <Pressable
                    onPress={() => setEditing(`${i}-to`)}
                    style={styles.timePillTap}
                  >
                    <Text style={styles.timePillTapTxt}>{fmt(s.toMins)}</Text>
                  </Pressable>
                </View>
                <View style={{ width: 30, alignItems: "flex-end" }}>
                  {shifts.length > 1 && (
                    <Pressable onPress={() => removeShift(i)} hitSlop={8}>
                      <Feather name="x" size={18} color="#993556" />
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
            {shifts.length < 2 && (
              <Pressable onPress={addShift} style={styles.addRow}>
                <Feather name="plus" size={16} color="#0E1A24" />
                <Text style={styles.addRowTxt}>{t("post_shift.add_second")}</Text>
              </Pressable>
            )}
          </View>
        </Section>

        {/* When */}
        <Section title={t("post_shift.when")}>
          {/* Need someone now — full width, urgent red (emergency: sick call) */}
          <Pressable
            onPress={() => {
              setStartWhen("now");
              setPickedDate(null);
            }}
            style={[
              styles.asapTile,
              startWhen === "now" && styles.tileOn,
            ]}
          >
            <View style={styles.asapIconWrap}>
              <Feather name="zap" size={24} color="#E24B4A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.asapLbl}>{t("post_shift.need_now")}</Text>
              <Text style={styles.asapSub}>
                {t("post_shift.need_now_sub")}
              </Text>
            </View>
            {startWhen === "now" && (
              <Feather name="check-circle" size={22} color="white" />
            )}
          </Pressable>

          <View style={styles.tileGrid}>
            <Pressable
              onPress={() => {
                setStartWhen("asap");
                setPickedDate(null);
              }}
              style={[
                styles.tileLg,
                { backgroundColor: "#F59E0B" },
                startWhen === "asap" && styles.tileOn,
              ]}
            >
              <View style={styles.tileIconWrap}>
                <Feather name="clock" size={28} color="white" />
              </View>
              <Text style={styles.tileLbl}>{t("post_shift.asap")}</Text>
              {startWhen === "asap" && (
                <View style={styles.tileCheck}>
                  <Feather name="check" size={12} color="white" />
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                setStartWhen("pickdate");
                setCalendarOpen(true);
              }}
              style={[
                styles.tileLg,
                { backgroundColor: "#3B82F6" },
                startWhen === "pickdate" && styles.tileOn,
              ]}
            >
              <View style={styles.tileIconWrap}>
                <Feather name="calendar" size={28} color="white" />
              </View>
              <Text style={styles.tileLbl}>
                {pickedDate
                  ? pickedDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })
                  : t("post_shift.pick_date")}
              </Text>
              {startWhen === "pickdate" && (
                <View style={styles.tileCheck}>
                  <Feather name="check" size={12} color="white" />
                </View>
              )}
            </Pressable>
          </View>
        </Section>

        {/* Pay */}
        <Section title={t("post_shift.pay")}>
          {/* Unit selector — colored tiles to match the rest of the page */}
          <View style={styles.tileGrid}>
            {PAY_UNITS.map((u) => {
              const on = payUnit === u.id;
              return (
                <Pressable
                  key={u.id}
                  onPress={() => onPickPayUnit(u.id)}
                  style={[
                    styles.tile,
                    { backgroundColor: u.hue },
                    on && styles.tileOn,
                  ]}
                >
                  <View style={styles.tileIconWrapPay}>
                    <Feather name={u.icon} size={16} color="white" />
                  </View>
                  <Text style={styles.tileLbl}>{u.label}</Text>
                  {on && (
                    <View style={styles.tileCheck}>
                      <Feather name="check" size={12} color="white" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Amount input — big card, dynamic unit, hidden when "Discussed later" */}
          {payUnit !== "later" ? (
            <>
              <View style={styles.payCard}>
                <View style={styles.payCardTop}>
                  <Text style={styles.payCardCurrency}>€</Text>
                  <TextInput
                    value={pay > 0 ? String(pay) : ""}
                    onChangeText={(t) => {
                      const n = parseInt(t.replace(/[^0-9]/g, ""), 10);
                      setPay(isNaN(n) ? 0 : n);
                    }}
                    keyboardType="number-pad"
                    style={styles.payCardInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    maxLength={5}
                    selectTextOnFocus
                    inputAccessoryViewID={
                      Platform.OS === "ios" ? PAY_ACCESSORY_ID : undefined
                    }
                  />
                </View>
                <View style={styles.payCardUnitWrap}>
                  <Text style={styles.payCardUnit}>
                    per{" "}
                    {payUnit === "hour"
                      ? "hour"
                      : payUnit === "day"
                      ? "day"
                      : payUnit === "week"
                      ? "week"
                      : "month"}
                  </Text>
                </View>
              </View>
              <Text style={styles.payHint}>
                {payUnit === "month"
                  ? "Monthly gross — what the worker takes home before tax."
                  : payUnit === "week"
                  ? "Weekly gross — paid every week."
                  : payUnit === "day"
                  ? "Daily rate — full day of work."
                  : "Hourly rate — workers see this on the card."}
              </Text>
              <Pressable
                onPress={() => onPickPayUnit("later")}
                style={styles.discussLaterLink}
              >
                <Feather name="message-circle" size={13} color="#6B7280" />
                <Text style={styles.discussLaterTxt}>
                  {t("post_shift.skip_pay")}
                </Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.payLaterBox}>
              <Feather name="message-circle" size={16} color="#6B7280" />
              <Text style={styles.payLaterTxt}>
                Pay will be discussed when you and the candidate talk.
              </Text>
            </View>
          )}
        </Section>

        <View style={{ height: 12 }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {errorMsg && <Text style={styles.errorTxt}>{errorMsg}</Text>}

      <View style={styles.bottom}>
        <Pressable
          disabled={busy}
          style={[styles.cta, busy && { opacity: 0.45 }]}
          onPress={async () => {
            if (roles.length === 0) {
              Alert.alert(
                "No positions on your venue",
                "Add the positions you hire for to your venue profile first.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Edit venue",
                    onPress: () => router.push("/venue-photo"),
                  },
                ]
              );
              return;
            }
            setErrorMsg(null);
            setBusy(true);
            const contractLabel =
              contract === "custom"
                ? customContract.trim() || "Custom"
                : contractObj?.label ?? null;
            // Resolve the venue_id. Use the in-memory cache first; if missing
            // (after sign-in / app restart), hydrate it from Supabase.
            let venueId = getVenueProfile()?.id;
            if (!venueId) {
              try {
                const v = await getCurrentVenueRow();
                if (v?.id) {
                  venueId = v.id as string;
                  patchVenueProfile({ id: v.id, name: v.name, type: v.type });
                }
              } catch (e) {
                console.warn("[post-shift] hydrate venue failed:", e);
              }
            }
            if (!venueId) {
              setErrorMsg(
                "We couldn't find your venue. Sign up your venue first."
              );
              setBusy(false);
              return;
            }
            const firstShift = shifts[0];
            const dayCodes = days.map((d) => DAY_CODES[d]);
            try {
              await insertShift({
                venue_id: venueId,
                roles,
                contract_type: contractLabel ?? undefined,
                days: dayCodes,
                hours_start: firstShift
                  ? fmtHHMM(firstShift.fromMins)
                  : undefined,
                hours_end: firstShift
                  ? fmtHHMM(firstShift.toMins)
                  : undefined,
                start_when: startWhen ?? undefined,
                start_date: pickedDate
                  ? pickedDate.toISOString().slice(0, 10)
                  : undefined,
                pay_unit: payUnit,
                pay_amount: payUnit === "later" ? undefined : pay,
              });
              setPostedShift({
                roles,
                contractLabel,
                days,
                shifts,
                startWhen,
                pickedDate: pickedDate ? pickedDate.toISOString() : null,
                payUnit,
                pay,
              });
              // After posting, send venues to the bonus screen with interview
              // tile + "post another / see my shifts" options.
              router.replace("/venue-bonus");
            } catch (e: any) {
              setErrorMsg(e?.message || "Could not save shift. Try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? (
            <ActivityIndicator color="#F7F4EE" />
          ) : (
            <>
              <Text style={styles.ctaTxt}>{t("post_shift.post")}</Text>
              <Feather name="arrow-right" size={20} color="#F7F4EE" />
            </>
          )}
        </Pressable>
      </View>

      {/* iOS keyboard "Done" toolbar — appears above numeric keypad */}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={PAY_ACCESSORY_ID}>
          <View style={styles.kbBar}>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={() => Keyboard.dismiss()}
              hitSlop={8}
              style={styles.kbDoneBtn}
            >
              <Text style={styles.kbDoneTxt}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}

      {/* Calendar modal */}
      <Modal
        visible={calendarOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCalendarOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCalendarOpen(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setCalendarOpen(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Pick a date</Text>
            <Pressable onPress={() => setCalendarOpen(false)}>
              <Text style={styles.modalDone}>Done</Text>
            </Pressable>
          </View>
          <Calendar
            value={pickedDate ?? new Date()}
            onChange={(d) => {
              setPickedDate(d);
            }}
          />
        </View>
      </Modal>

      {/* Custom contract type modal */}
      <Modal
        visible={customContractOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomContractOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCustomContractOpen(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setCustomContractOpen(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Custom contract</Text>
            <Pressable onPress={() => setCustomContractOpen(false)}>
              <Text style={styles.modalDone}>Done</Text>
            </Pressable>
          </View>
          <View style={{ padding: 16, paddingBottom: 24 }}>
            <TextInput
              value={customContract}
              onChangeText={setCustomContract}
              placeholder="e.g. 3 months · summer 2026 · weekends only"
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

      {/* JS wheel time picker (works in Expo Go) */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setEditing(null)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setEditing(null)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {editing?.endsWith("from") ? "Start time" : "End time"}
            </Text>
            <Pressable onPress={() => setEditing(null)}>
              <Text style={styles.modalDone}>Done</Text>
            </Pressable>
          </View>

          {editing !== null && (
            <TimeWheel
              hour={Math.floor(
                (editing.endsWith("from")
                  ? shifts[Number(editing.split("-")[0])].fromMins
                  : shifts[Number(editing.split("-")[0])].toMins) / 60
              )}
              minute={
                (editing.endsWith("from")
                  ? shifts[Number(editing.split("-")[0])].fromMins
                  : shifts[Number(editing.split("-")[0])].toMins) % 60
              }
              onChange={(h, m) => {
                const [idxStr, which] = editing.split("-");
                const d = new Date();
                d.setHours(h, m, 0, 0);
                setShiftTime(
                  Number(idxStr),
                  which as "from" | "to",
                  d
                );
              }}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- Custom JS wheel picker (works in Expo Go) ---

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5; // odd → centered selection row

function TimeWheel({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
}) {
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  // Minutes in 5-minute steps
  const minutes = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i * 5),
    []
  );
  const nearestMinIdx = Math.round(minute / 5);

  return (
    <View style={wheelStyles.row}>
      <Wheel
        items={hours}
        initialIndex={hour}
        format={(n) => String(n).padStart(2, "0")}
        onSettle={(idx) => onChange(hours[idx], minutes[nearestMinIdx])}
      />
      <Text style={wheelStyles.sep}>:</Text>
      <Wheel
        items={minutes}
        initialIndex={nearestMinIdx}
        format={(n) => String(n).padStart(2, "0")}
        onSettle={(idx) => onChange(hour, minutes[idx])}
      />
    </View>
  );
}

function Wheel({
  items,
  initialIndex,
  format,
  onSettle,
}: {
  items: number[];
  initialIndex: number;
  format: (n: number) => string;
  onSettle: (idx: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const lastIdxRef = useRef<number>(initialIndex);
  // Guard so programmatic scrollTo doesn't fire another settle handler
  const programmaticRef = useRef<boolean>(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: initialIndex * ITEM_HEIGHT,
        animated: false,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Ignore the event that our own scrollTo({animated:true}) generates
    if (programmaticRef.current) {
      programmaticRef.current = false;
      return;
    }

    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));

    // If we're more than a couple pixels off the snap point, nudge into place.
    const targetY = clamped * ITEM_HEIGHT;
    if (Math.abs(y - targetY) > 1) {
      programmaticRef.current = true;
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    }

    // Only fire onSettle when the index actually changed — avoids re-render loops.
    if (clamped !== lastIdxRef.current) {
      lastIdxRef.current = clamped;
      onSettle(clamped);
    }
  };

  const padding = ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT;

  return (
    <View style={wheelStyles.wheelContainer}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: padding }}
        onMomentumScrollEnd={handleEnd}
      >
        {items.map((n, i) => (
          <View key={i} style={wheelStyles.item}>
            <Text style={wheelStyles.itemTxt}>{format(n)}</Text>
          </View>
        ))}
      </ScrollView>
      {/* Selection rails (lines above and below the centered row) */}
      <View
        pointerEvents="none"
        style={[
          wheelStyles.rail,
          { top: ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT, height: ITEM_HEIGHT },
        ]}
      />
    </View>
  );
}

// --- Calendar (JS-only, works in Expo Go) ---

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_LBL = ["M", "T", "W", "T", "F", "S", "S"];

function Calendar({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  const [view, setView] = useState(new Date(value));

  const year = view.getFullYear();
  const month = view.getMonth();

  // First day of month (0=Sun..6=Sat) — shift to Mon-first
  const firstDayRaw = new Date(year, month, 1).getDay();
  const firstDay = (firstDayRaw + 6) % 7; // Mon=0

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);

  const pickDay = (d: number) => {
    const next = new Date(year, month, d);
    onChange(next);
  };

  const isSelected = (d: number) =>
    value.getFullYear() === year &&
    value.getMonth() === month &&
    value.getDate() === d;

  const isToday = (d: number) => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === d
    );
  };

  const isPast = (d: number) => {
    const dt = new Date(year, month, d);
    return dt < today;
  };

  return (
    <View style={calStyles.container}>
      <View style={calStyles.head}>
        <Pressable
          onPress={() => setView(new Date(year, month - 1, 1))}
          hitSlop={8}
          style={calStyles.navBtn}
        >
          <Feather name="chevron-left" size={20} color="#0E1A24" />
        </Pressable>
        <Text style={calStyles.title}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable
          onPress={() => setView(new Date(year, month + 1, 1))}
          hitSlop={8}
          style={calStyles.navBtn}
        >
          <Feather name="chevron-right" size={20} color="#0E1A24" />
        </Pressable>
      </View>

      <View style={calStyles.dayLabels}>
        {DAY_LBL.map((d, i) => (
          <Text key={i} style={calStyles.dayLabel}>
            {d}
          </Text>
        ))}
      </View>

      <View style={calStyles.grid}>
        {cells.map((d, i) => {
          if (d === null) {
            return <View key={i} style={calStyles.cell} />;
          }
          const sel = isSelected(d);
          const tod = isToday(d);
          const past = isPast(d);
          return (
            <Pressable
              key={i}
              disabled={past}
              onPress={() => pickDay(d)}
              style={[
                calStyles.cell,
                calStyles.cellBtn,
                sel && calStyles.cellSelected,
                tod && !sel && calStyles.cellToday,
              ]}
            >
              <Text
                style={[
                  calStyles.cellTxt,
                  sel && calStyles.cellTxtSel,
                  past && calStyles.cellTxtPast,
                ]}
              >
                {d}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: { paddingHorizontal: 14, paddingBottom: 18, paddingTop: 4 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#F1EFE8",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#0E1A24" },
  dayLabels: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.6,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cellBtn: {},
  cellSelected: {
    backgroundColor: "#F0531C",
    borderRadius: 999,
  },
  cellToday: {
    borderWidth: 1,
    borderColor: "#0E1A24",
    borderRadius: 999,
  },
  cellTxt: { fontSize: 15, fontWeight: "500", color: "#0E1A24" },
  cellTxtSel: { color: "white", fontWeight: "700" },
  cellTxtPast: { color: "#C8C6BE" },
});

const wheelStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  sep: {
    fontSize: 28,
    fontWeight: "600",
    color: "#0E1A24",
    marginHorizontal: 4,
  },
  wheelContainer: {
    width: 90,
    height: VISIBLE_ITEMS * ITEM_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  itemTxt: {
    fontSize: 26,
    fontWeight: "600",
    color: "#0E1A24",
  },
  rail: {
    position: "absolute",
    left: 6,
    right: 6,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "rgba(0,0,0,0.18)",
  },
});

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  const first = title.charAt(0);
  const rest = title.slice(1);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        <Text style={styles.sectionTitleFirst}>{first}</Text>
        {rest}
      </Text>
      {sub && <Text style={styles.sectionSub}>{sub}</Text>}
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F1EFE8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconBtn: { padding: 4, width: 32 },
  title: { fontSize: 16, fontWeight: "700", color: "#0E1A24" },

  scroll: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 120 },

  inheritedRoles: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    backgroundColor: "#FAEEDA",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 14,
  },
  inheritedRolesTxt: { color: "#854F0B", fontSize: 13 },
  inheritedRolesBold: { fontWeight: "800" },

  section: { marginTop: 22 },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0E1A24",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  sectionTitleFirst: { color: "#F0531C" },
  sectionSub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 18,
  },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  chipOn: { backgroundColor: "#0E1A24", borderColor: "#0E1A24" },
  chipPrimary: { backgroundColor: "#F0531C", borderColor: "#F0531C" },
  chipTxt: { fontSize: 13, fontWeight: "600", color: "#0E1A24" },
  chipTxtOn: { color: "white" },
  chipTxtPrimary: { color: "white" },

  chipCustom: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
    borderStyle: "dashed",
  },
  chipCustomOn: {
    backgroundColor: "#0E1A24",
    borderColor: "#0E1A24",
    borderStyle: "solid",
  },
  chipCustomTxt: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  chipCustomTxtOn: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },

  contractRow: { gap: 6, paddingRight: 16 },
  contractPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  contractPillOn: { backgroundColor: "#0E1A24", borderColor: "#0E1A24" },
  contractTxt: { fontSize: 13, fontWeight: "600", color: "#0E1A24" },
  contractTxtOn: { color: "white" },

  daysRow: { flexDirection: "row", gap: 6 },
  dayPill: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },
  dayPillOn: { backgroundColor: "#0E1A24", borderColor: "#0E1A24" },
  dayPillTxt: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
  dayPillTxtOn: { color: "white" },

  shiftBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  shiftTimes: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  timePillTap: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FAEEDA",
  },
  timePillTapTxt: {
    fontSize: 15,
    fontWeight: "700",
    color: "#854F0B",
  },
  timeDash: { fontSize: 14, color: "#6B7280" },

  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.20)",
  },
  addRowTxt: { fontSize: 13, fontWeight: "600", color: "#0E1A24" },

  unitRow: {
    flexDirection: "row",
    backgroundColor: "rgba(11,15,26,0.06)",
    borderRadius: 999,
    padding: 4,
    marginBottom: 12,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  tile: {
    width: "47.5%",
    aspectRatio: 1.15,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  tileOn: { borderColor: "#F0531C" },
  tileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  tileIconWrapPay: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  tileLbl: {
    fontSize: 15,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    letterSpacing: -0.2,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Role chips — pill toggles for picking which position(s) the shift is for
  roleChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(11,15,26,0.15)",
  },
  roleChipOn: {
    backgroundColor: "#F0531C",
    borderColor: "#F0531C",
  },
  roleChipTxt: { fontSize: 14, fontWeight: "700", color: "#0E1A24" },
  roleChipTxtOn: { color: "white" },
  rolesEmpty: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
    paddingHorizontal: 20,
  },
  tileCheck: {
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

  // Small variant — 3 per row for Contract type and Pay
  tileSm: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tileIconWrapSm: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  tileLblSm: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    letterSpacing: -0.1,
  },

  // Big rate input card
  payCard: {
    marginTop: 10,
    backgroundColor: "white",
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  payCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  payCardCurrency: {
    fontSize: 40,
    fontWeight: "800",
    color: "#0E1A24",
  },
  payCardInput: {
    fontSize: 52,
    fontWeight: "900",
    color: "#0E1A24",
    minWidth: 80,
    textAlign: "center",
    padding: 0,
    letterSpacing: -1,
  },
  payCardUnitWrap: {
    marginTop: 6,
    backgroundColor: "#FFF4EE",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  payCardUnit: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F0531C",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  discussLaterLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
  },
  discussLaterTxt: { color: "#6B7280", fontSize: 13, fontWeight: "600" },

  asapTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#E24B4A",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "transparent",
    shadowColor: "#E24B4A",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  asapIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  asapLbl: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  asapSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  // Large variant — for "When does it start" (2 per row, square, bigger)
  tileLg: {
    width: "47.5%",
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "transparent",
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  unitPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
  },
  unitPillOn: { backgroundColor: "white" },
  unitPillTxt: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  unitPillTxtOn: { color: "#0E1A24" },

  payInputWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  payCurrency: { fontSize: 26, fontWeight: "800", color: "#0E1A24" },
  payInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: "800",
    color: "#0E1A24",
    padding: 0,
  },
  payUnit: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  payHint: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  payLaterBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "rgba(11,15,26,0.04)",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  payLaterTxt: { flex: 1, fontSize: 13, color: "#6B7280" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  modalCancel: { color: "#6B7280", fontSize: 15 },
  modalTitle: { fontSize: 15, fontWeight: "600", color: "#0E1A24" },
  modalDone: { color: "#F0531C", fontSize: 15, fontWeight: "700" },

  // Keyboard "Done" toolbar above numeric keypad
  kbBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1EFE8",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.10)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  kbDoneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F0531C",
  },
  kbDoneTxt: { color: "white", fontSize: 15, fontWeight: "700" },

  errorTxt: {
    color: "#B91C1C",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  bottom: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0531C",
    borderRadius: 999,
    paddingVertical: 18,
  },
  ctaTxt: { color: "#F7F4EE", fontSize: 16, fontWeight: "700" },
});
