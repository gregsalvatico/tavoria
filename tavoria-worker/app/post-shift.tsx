import { Feather } from "@expo/vector-icons";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { setPostedShift } from "../lib/postedShift";
import { getVenueProfile, patchVenueProfile } from "../lib/venueProfile";
import { getCurrentVenueRow, insertShift } from "../lib/db";
import { clearPostShiftDraft, getPostShiftDraft, patchPostShiftDraft } from "../lib/postShiftDraft";
import { t, useLanguage } from "../lib/i18n";
import { formatLocalizedDate, formatLocalizedMonthYear, getLocalizedCalendarDays } from "../lib/dateFormat";
import { localizeRole } from "../lib/positions";
import { useIsDesktop } from "../lib/responsive";
import StickyFooter from "../components/StickyFooter";
import { FormFlowHeader } from "../components/PagePrimitives";
import ActionButton from "../components/ActionButton";
import ResponsiveModal from "../components/ResponsiveModal";
import { RequirementFields } from "../components/TalentFields";
import { TAVORIA } from "../lib/designTokens";
import type { WorkerRequirements } from "../lib/workerMatching";
import { serializeContractTypes } from "../lib/contractTypes";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  InputAccessoryView,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAY_CODES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const fmtHHMM = (mins: number) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const CONTRACTS: {
  id: string;
  defaultUnit: "hour" | "month";
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { id: "oneoff", defaultUnit: "hour", icon: "zap" },
  { id: "twodays", defaultUnit: "hour", icon: "calendar" },
  { id: "pt", defaultUnit: "hour", icon: "clock" },
  { id: "ft", defaultUnit: "month", icon: "briefcase" },
  { id: "seasonal", defaultUnit: "hour", icon: "sun" },
  { id: "custom", defaultUnit: "hour", icon: "more-horizontal" },
];

// Map contract id → t() key suffix under post_shift.*
const CONTRACT_KEYS: Record<string, string> = {
  oneoff: "one_off",
  twodays: "two_days",
  pt: "part_time",
  ft: "full_time",
  seasonal: "seasonal",
  custom: "other",
};

const PAY_UNITS: {
  id: "hour" | "day" | "week" | "month";
  label: string;
  unitTxt: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { id: "hour", label: "Per hour", unitTxt: "hour", icon: "clock" },
  { id: "day", label: "Per day", unitTxt: "day", icon: "sun" },
  { id: "week", label: "Per week", unitTxt: "week", icon: "calendar" },
  { id: "month", label: "Per month", unitTxt: "month", icon: "credit-card" },
];

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const PAY_ACCESSORY_ID = "pay-accessory";

// Format minutes-since-midnight to "HH:MM"
const fmt = (mins: number) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// Shift roles belong to the shift, not to the venue profile. A venue can use
// any role here and can post more roles on other shifts later.
const COMMON_ROLES = [
  "Barista",
  "Waiter",
  "Runner",
  "Cashier",
  "Rider",
  "Bartender",
  "Cook",
  "Chef",
  "Cleaner",
];
const ROLE_IMAGES: Record<string, number> = {
  Barista: require("../assets/position-barista.png"),
  Waiter: require("../assets/position-waiter.png"),
  Runner: require("../assets/position-runner.png"),
  Cashier: require("../assets/position-cashier.png"),
  Rider: require("../assets/position-rider.png"),
  Bartender: require("../assets/position-bartender.png"),
  Cook: require("../assets/position-cook.png"),
  Chef: require("../assets/position-chef.png"),
  Cleaner: require("../assets/position-cleaner.png"),
};
const POST_SHIFT_STEPS = ["roles", "contract", "schedule", "availability", "pay", "requirements", "review"] as const;
type PostShiftStep = (typeof POST_SHIFT_STEPS)[number];

export default function PostShift() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  useLanguage();
  const { focus } = useGlobalSearchParams<{ focus?: string }>();
  const focusKey = typeof focus === "string" && POST_SHIFT_STEPS.includes(focus as PostShiftStep) ? focus as PostShiftStep : "roles";
  const stepIndex = POST_SHIFT_STEPS.indexOf(focusKey);
  const availableRoles = COMMON_ROLES;
  const [roles, setRoles] = useState<string[]>(() => getPostShiftDraft().roles);
  const [requirements, setRequirements] = useState<WorkerRequirements>(() => getPostShiftDraft().requirements);
  const [contracts, setContracts] = useState<string[]>(() => getPostShiftDraft().contracts);
  const [days, setDays] = useState<number[]>(() => getPostShiftDraft().days);
  // The shifts table currently persists one interval per post. Keep the
  // creation flow honest until the schema supports multiple intervals.
  const [shifts, setShifts] = useState(() => getPostShiftDraft().shifts);
  const [startWhen, setStartWhen] = useState(() => getPostShiftDraft().startWhen);
  const [pickedDate, setPickedDate] = useState(() => getPostShiftDraft().pickedDate);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customContract, setCustomContract] = useState(() => getPostShiftDraft().customContract);
  const [customContractOpen, setCustomContractOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [payUnit, setPayUnit] = useState(() => getPostShiftDraft().payUnit);
  const [payInput, setPayInput] = useState(() => getPostShiftDraft().payInput);
  const [payUnitTouched, setPayUnitTouched] = useState(() => getPostShiftDraft().payUnitTouched);
  const defaultPayUnitApplied = useRef(false);

  const goToStep = (index: number) => {
    const next = POST_SHIFT_STEPS[index];
    if (!next) return;
    router.replace({ pathname: "/post-shift", params: { focus: next } });
  };

  // Contract defaults are only applied before the venue makes an explicit pay
  // choice. Once chosen, the amount and unit must remain stable.
  const onPickContract = (id: string) => {
    const next = contracts.includes(id)
      ? contracts.filter((value) => value !== id)
      : [...contracts, id];
    setContracts(next);
    patchPostShiftDraft({ contracts: next });
  };

  useEffect(() => {
    if (defaultPayUnitApplied.current || contracts.length === 0 || payUnitTouched || payUnit === "later") return;
    const first = CONTRACTS.find((item) => item.id === contracts[0]);
    if (!first) return;
    defaultPayUnitApplied.current = true;
    setPayUnit(first.defaultUnit);
    patchPostShiftDraft({ payUnit: first.defaultUnit });
  }, [contracts, payUnit, payUnitTouched]);

  const onPickPayUnit = (u: "hour" | "day" | "week" | "month" | "later") => {
    setPayUnit(u);
    setPayUnitTouched(true);
    const nextPayInput = u === "later" ? "" : payInput;
    if (u === "later") setPayInput(nextPayInput);
    patchPostShiftDraft({ payUnit: u, payUnitTouched: true, payInput: nextPayInput });
  };

  // Which time field is being edited (e.g. "0-from", "1-to") — controls the modal
  const [editing, setEditing] = useState<string | null>(null);

  const setShiftTime = (idx: number, which: "from" | "to", date: Date) => {
    const mins = date.getHours() * 60 + date.getMinutes();
    const next = shifts.map((shift, i) =>
      i !== idx
        ? shift
        : { ...shift, [which === "from" ? "fromMins" : "toMins"]: mins }
    );
    setShifts(next);
    patchPostShiftDraft({ shifts: next });
  };

  const toggleRole = (r: string) => {
    const next = roles.includes(r)
      ? roles.filter((x) => x !== r)
      : roles.length >= 3
        ? roles
        : [...roles, r];
    setRoles(next);
    patchPostShiftDraft({ roles: next });
  };

  const toggleDay = (i: number) => {
    const next = days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort();
    setDays(next);
    patchPostShiftDraft({ days: next });
  };

  const selectStartMode = (mode: "now" | "asap" | "pickdate") => {
    setStartWhen(mode);
    patchPostShiftDraft({ startWhen: mode });
    if (mode === "pickdate") {
      setCalendarOpen(true);
    } else {
      setPickedDate(null);
      patchPostShiftDraft({ pickedDate: null });
    }
  };

  const todayIso = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const payAmount = Number(payInput.replace(",", "."));
  const currentShift = shifts[0];
  const validContract = contracts.length > 0 && (!contracts.includes("custom") || customContract.trim().length > 0);
  const validHours = currentShift.fromMins !== currentShift.toMins;
  const validStart = Boolean(startWhen) && (startWhen !== "pickdate" || Boolean(pickedDate));
  const validSchedule = days.length > 0 || Boolean(pickedDate) || startWhen === "now" || startWhen === "asap";
  const validPay = payUnit === "later" || (Number.isFinite(payAmount) && payAmount > 0);
  const validRequirements = requirements.minimumExperience === undefined || (
    Number.isFinite(requirements.minimumExperience) &&
    requirements.minimumExperience >= 0 &&
    requirements.minimumExperience <= 80
  );
  const canSubmit = roles.length > 0 && validContract && validHours && validStart && validSchedule && validPay && validRequirements;
  const stepComplete = focusKey === "roles"
    ? roles.length > 0
    : focusKey === "contract"
      ? validContract
      : focusKey === "schedule"
        ? validHours
        : focusKey === "availability"
          ? validStart && validSchedule
          : focusKey === "pay"
            ? validPay
            : focusKey === "requirements"
              ? validRequirements
              : canSubmit;
  const isReviewStep = focusKey === "review";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FormFlowHeader
        title={t("post_shift.title")}
        subtitle={t("post_shift.intro")}
        step={stepIndex}
        total={POST_SHIFT_STEPS.length}
        contentMaxWidth={840}
        onBack={() => {
          if (stepIndex > 0) {
            goToStep(stepIndex - 1);
            return;
          }
          if (router.canGoBack()) { router.back(); return; }
          router.replace("/");
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {focusKey === "roles" ? <Section title={t("post_shift.for")} sub={t("post_shift.for_sub") + " " + t("talent.roleLimit")}>
            <View style={[styles.roleTileWrap, isDesktop && styles.roleTileWrapDesktop]}>
              {availableRoles.map((role) => {
                const selected = roles.includes(role);
                return (
                  <Pressable
                    key={role}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={localizeRole(role)}
                    onPress={() => toggleRole(role)}
                    style={({ hovered, pressed }) => [
                      styles.roleTile,
                      isDesktop && styles.roleTileDesktop,
                      selected && styles.roleTileOn,
                      hovered && !selected && styles.roleTileHovered,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <Image source={ROLE_IMAGES[role]} style={styles.roleTileImage} resizeMode="cover" />
                    <View style={styles.roleTileScrim} pointerEvents="none" />
                    <Text style={styles.roleTileTxt} numberOfLines={1}>
                      {localizeRole(role)}
                    </Text>
                    {selected ? (
                      <View style={styles.roleTileCheck}>
                        <Feather name="check" size={12} color="white" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </Section> : null}

          {focusKey === "contract" ? <Section title={t("post_shift.contract")}>
            <View style={styles.contractGrid}>
              {CONTRACTS.map((c) => {
                const selected = contracts.includes(c.id);
                const label = c.id === "custom" && customContract.trim()
                  ? customContract.trim()
                  : t(`post_shift.${CONTRACT_KEYS[c.id] ?? c.id}`);
                return (
                  <Pressable
                    key={c.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={label}
                    onPress={() => {
                      const wasSelected = contracts.includes(c.id);
                      onPickContract(c.id);
                      if (c.id === "custom" && !wasSelected) setCustomContractOpen(true);
                    }}
                    style={({ hovered, pressed }) => [
                      styles.contractTile,
                      selected && styles.contractTileOn,
                      hovered && !selected && styles.contractTileHovered,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <View style={styles.contractIconWrap}>
                      <Feather name={c.icon} size={18} color={TAVORIA.color.orange} />
                    </View>
                    <Text style={styles.contractLabel}>{label}</Text>
                    {selected ? <Feather name="check" size={18} color={TAVORIA.color.orange} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Section> : null}

          {focusKey === "schedule" ? <View>
          <Section title={t("post_shift.days")} sub={t("post_shift.days_sub")}>
            <View style={styles.daysRow}>
              {DAYS.map((day, index) => {
                const selected = days.includes(index);
                const label = t(`shift_detail.days_short.${day}`);
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={label}
                    onPress={() => toggleDay(index)}
                    style={({ hovered, pressed }) => [
                      styles.dayPill,
                      selected && styles.dayPillOn,
                      hovered && !selected && styles.dayPillHovered,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <Text style={[styles.dayPillTxt, selected && styles.dayPillTxtOn]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title={t("post_shift.hours")} sub={t("post_shift.hours_sub")}>
            <View style={styles.shiftBox}>
              <Feather name="clock" size={18} color={TAVORIA.color.muted} />
              <View style={styles.timeFields}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("shift_edit.start_time")}
                  onPress={() => setEditing("0-from")}
                  style={({ hovered, pressed }) => [styles.timeFieldButton, hovered && styles.timeFieldButtonHovered, pressed && styles.controlPressed]}
                >
                  <Text style={styles.timeFieldLabel}>{t("shift_edit.start_time")}</Text>
                  <Text style={[styles.timeFieldValue, currentShift.fromMins === 0 && currentShift.toMins === 0 && styles.timeFieldPlaceholder]}>
                    {currentShift.fromMins === 0 && currentShift.toMins === 0 ? "--:--" : fmt(currentShift.fromMins)}
                  </Text>
                </Pressable>
                <Text style={styles.timeDash}>–</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("shift_edit.end_time")}
                  onPress={() => setEditing("0-to")}
                  style={({ hovered, pressed }) => [styles.timeFieldButton, hovered && styles.timeFieldButtonHovered, pressed && styles.controlPressed]}
                >
                  <Text style={styles.timeFieldLabel}>{t("shift_edit.end_time")}</Text>
                  <Text style={[styles.timeFieldValue, currentShift.fromMins === 0 && currentShift.toMins === 0 && styles.timeFieldPlaceholder]}>
                    {currentShift.fromMins === 0 && currentShift.toMins === 0 ? "--:--" : fmt(currentShift.toMins)}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Section>
          </View> : null}

          {focusKey === "availability" ? <Section title={t("post_shift.when")}>
            <View style={styles.optionStack}>
              {([
                ["now", "zap", t("post_shift.need_now"), t("post_shift.need_now_sub")],
                ["asap", "clock", t("post_shift.asap"), t("post_shift.need_now_sub")],
                ["pickdate", "calendar", pickedDate ? formatLocalizedDate(pickedDate, { day: "2-digit", month: "short" }) : t("post_shift.pick_date"), t("common.date")],
              ] as const).map(([mode, icon, label, sub]) => {
                const selected = startWhen === mode;
                return (
                  <Pressable
                    key={mode}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={label}
                    onPress={() => selectStartMode(mode)}
                    style={({ hovered, pressed }) => [styles.optionRow, selected && styles.optionRowOn, hovered && !selected && styles.optionRowHovered, pressed && styles.controlPressed]}
                  >
                    <View style={[styles.optionIcon, selected && styles.optionIconOn]}>
                      <Feather name={icon} size={17} color={selected ? TAVORIA.color.orange : TAVORIA.color.muted} />
                    </View>
                    <View style={styles.optionCopy}>
                      <Text style={styles.optionTitle}>{label}</Text>
                      <Text style={styles.optionSub}>{sub}</Text>
                    </View>
                    {selected ? <Feather name="check-circle" size={19} color={TAVORIA.color.orange} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Section> : null}

          {focusKey === "pay" ? <Section title={t("post_shift.pay")} style={styles.paySection}>
            <View style={styles.payUnitRow}>
              {PAY_UNITS.map((unit) => {
                const selected = payUnit === unit.id;
                return (
                  <Pressable
                    key={unit.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t(`post_shift.per_${unit.id}`)}
                    onPress={() => onPickPayUnit(unit.id)}
                    style={({ hovered, pressed }) => [styles.payUnitOption, selected && styles.payUnitOptionOn, hovered && !selected && styles.payUnitOptionHovered, pressed && styles.controlPressed]}
                  >
                    <Text style={[styles.payUnitText, selected && styles.payUnitTextOn]}>{t(`post_shift.per_${unit.id}`)}</Text>
                  </Pressable>
                );
              })}
            </View>
            {payUnit !== "later" ? (
              <>
                <View style={styles.payInputRow}>
                  <Text style={styles.payCurrency}>€</Text>
                  <TextInput
                    accessibilityLabel={t("shift_edit.pay")}
                    value={payInput}
                    onChangeText={(value) => {
                      const next = value.replace(/[^0-9,.]/g, "");
                      setPayInput(next);
                      patchPostShiftDraft({ payInput: next });
                    }}
                    keyboardType="decimal-pad"
                    style={styles.payInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    maxLength={7}
                    selectTextOnFocus
                    inputAccessoryViewID={Platform.OS === "ios" ? PAY_ACCESSORY_ID : undefined}
                  />
                  <Text style={styles.payUnitLabel}>{t(`post_shift.per_${payUnit}`)}</Text>
                </View>
                <Text style={styles.payHint}>{t(`post_shift.pay_hint_${payUnit}`)}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("post_shift.skip_pay")}
                  onPress={() => onPickPayUnit("later")}
                  style={({ hovered, pressed }) => [
                    styles.discussLaterLink,
                    hovered && styles.discussLaterHovered,
                    pressed && styles.controlPressed,
                  ]}
                >
                  <View style={styles.discussLaterIcon}>
                    <Feather name="message-circle" size={14} color={TAVORIA.color.muted} />
                  </View>
                  <Text style={styles.discussLaterTxt}>{t("post_shift.skip_pay")}</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.payLaterBox}>
                <Feather name="message-circle" size={16} color={TAVORIA.color.muted} />
                <Text style={styles.payLaterTxt}>{t("post_shift.pay_later_hint")}</Text>
              </View>
            )}
          </Section> : null}

          {focusKey === "requirements" ? (
            <RequirementFields
              value={requirements}
              onChange={(next) => {
                setRequirements(next);
                patchPostShiftDraft({ requirements: next });
              }}
            />
          ) : null}

          {isReviewStep ? (
            <>
              <View style={styles.reviewBox}>
                <Text style={styles.reviewTitle}>{t("post_shift.review")}</Text>
                <Text style={styles.reviewValue}>
                  {[roles.map(localizeRole).join(" · "), contracts.map((id) => id === "custom" ? customContract.trim() : t(`post_shift.${CONTRACT_KEYS[id] ?? id}`)).filter(Boolean).join(" · ") || null, validHours ? `${fmt(currentShift.fromMins)}–${fmt(currentShift.toMins)}` : null, payUnit === "later" ? t("post_shift.pay_later_short") : payAmount > 0 ? `€${payAmount} / ${t(`post_shift.per_${payUnit}`)}` : null].filter(Boolean).join(" · ") || t("post_shift.review_empty")}
                </Text>
              </View>
              {!canSubmit && <Text style={styles.completeHint}>{validRequirements ? t("post_shift.complete_hint") : t("talent.invalid")}</Text>}
              {errorMsg && <Text style={styles.errorTxt}>{errorMsg}</Text>}
            </>
          ) : null}
        </ScrollView>

        <StickyFooter desktopRow fullBleed backgroundColor={TAVORIA.color.paperDeep}>
          <View style={styles.footerActions}>
            <ActionButton
              label={t("common.back")}
              icon="arrow-left"
              variant="secondary"
              onPress={() => {
                if (stepIndex > 0) { goToStep(stepIndex - 1); return; }
                if (router.canGoBack()) { router.back(); return; }
                router.replace("/");
              }}
              style={styles.footerButton}
            />
            <ActionButton
              label={isReviewStep ? t("post_shift.post") : t("common.continue")}
              icon={isReviewStep ? "check" : "arrow-right"}
              style={styles.footerButton}
              loading={busy}
              disabled={isReviewStep ? !canSubmit : !stepComplete}
              onPress={async () => {
              if (!isReviewStep) {
                goToStep(stepIndex + 1);
                return;
              }
              if (!canSubmit) return;
              setErrorMsg(null);
              setBusy(true);
              const contractLabel = contracts.map((id) => id === "custom" ? customContract.trim() : t(`post_shift.${CONTRACT_KEYS[id] ?? id}`)).filter(Boolean).join(" · ") || null;
              const contractValue = serializeContractTypes(contracts, customContract);
              const cachedVenue = getVenueProfile();
              let venueId: string | undefined;
              try {
                // The in-memory venue can belong to a previous account after a
                // sign-in or refresh. Prefer the row owned by the active
                // session, and only fall back to the cache for a venue created
                // moments ago whose ownership has not propagated yet.
                const v = await getCurrentVenueRow();
                if (v?.id) {
                  venueId = v.id as string;
                  patchVenueProfile({
                    id: v.id,
                    name: v.name ?? cachedVenue?.name ?? "",
                    type: v.type ?? cachedVenue?.type,
                  });
                }
              } catch (e) {
                console.warn("[post-shift] hydrate venue failed:", e);
              }
              venueId ??= cachedVenue?.id;
              if (!venueId) {
                setErrorMsg(t("post_shift.err_no_venue"));
                setBusy(false);
                return;
              }
              const dayCodes = days.map((dayIndex) => DAY_CODES[dayIndex]);
              const startDate = pickedDate
                ? `${pickedDate.getFullYear()}-${String(pickedDate.getMonth() + 1).padStart(2, "0")}-${String(pickedDate.getDate()).padStart(2, "0")}`
                : startWhen === "now" || startWhen === "asap" ? todayIso() : undefined;
              try {
                await insertShift({
                  venue_id: venueId,
                  roles,
                  worker_requirements: requirements,
                  contract_type: contractValue,
                  days: dayCodes,
                  hours_start: fmtHHMM(currentShift.fromMins),
                  hours_end: fmtHHMM(currentShift.toMins),
                  start_when: startWhen ?? undefined,
                  start_date: startDate,
                  // "later" is a UI-only state. Store no unit when pay is
                  // intentionally left for the interview.
                  pay_unit: payUnit === "later" ? undefined : payUnit,
                  pay_amount: payUnit === "later" ? undefined : payAmount,
                });
                setPostedShift({
                  roles,
                  contractLabel,
                  days,
                  shifts: [currentShift],
                  startWhen,
                  pickedDate: startDate ?? null,
                  payUnit,
                  pay: payUnit === "later" ? 0 : payAmount,
                });
                clearPostShiftDraft();
                router.replace("/venue-bonus");
              } catch (e: any) {
                setErrorMsg(e?.message || t("post_shift.err_save_shift"));
              } finally {
                setBusy(false);
              }
              }}
            />
          </View>
        </StickyFooter>
      </KeyboardAvoidingView>

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
              <Text style={styles.kbDoneTxt}>{t("common.done")}</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}

      {/* Calendar modal */}
      <ResponsiveModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      >
        <View>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setCalendarOpen(false)}>
              <Text style={styles.modalCancel}>{t("common.cancel")}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{t("post_shift.pick_date")}</Text>
            <Pressable onPress={() => setCalendarOpen(false)}>
              <Text style={styles.modalDone}>{t("common.done")}</Text>
            </Pressable>
          </View>
          <Calendar
            value={pickedDate ?? new Date()}
            onChange={(d) => {
              setPickedDate(d);
              patchPostShiftDraft({ pickedDate: d });
            }}
          />
        </View>
      </ResponsiveModal>

      {/* Custom contract type modal */}
      <ResponsiveModal
        visible={customContractOpen}
        onClose={() => setCustomContractOpen(false)}
      >
        <View>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setCustomContractOpen(false)}>
              <Text style={styles.modalCancel}>{t("common.cancel")}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{t("post_shift.other")}</Text>
            <Pressable onPress={() => setCustomContractOpen(false)}>
              <Text style={styles.modalDone}>{t("common.done")}</Text>
            </Pressable>
          </View>
          <View style={{ padding: 16, paddingBottom: 24 }}>
            <TextInput
              value={customContract}
              onChangeText={(value) => {
                setCustomContract(value);
                patchPostShiftDraft({ customContract: value });
              }}
              placeholder={t("post_shift.custom_placeholder")}
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

      {/* JS wheel time picker (works in Expo Go) */}
      <ResponsiveModal
        visible={editing !== null}
        onClose={() => setEditing(null)}
      >
        <View>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setEditing(null)}>
              <Text style={styles.modalCancel}>{t("common.cancel")}</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {editing?.endsWith("from") ? t("shift_edit.start_time") : t("shift_edit.end_time")}
            </Text>
            <Pressable onPress={() => setEditing(null)}>
              <Text style={styles.modalDone}>{t("common.done")}</Text>
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
      </ResponsiveModal>
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
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: initialIndex * ITEM_HEIGHT,
        animated: false,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, []);

  const settle = (y: number) => {
    // Ignore the event that our own scrollTo({animated:true}) generates
    if (programmaticRef.current) {
      programmaticRef.current = false;
      return;
    }

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

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // React Native Web does not consistently emit onMomentumScrollEnd. A
    // short debounce lets the wheel settle on web, while also working during
    // regular drag scrolling on native platforms.
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    const y = e.nativeEvent.contentOffset.y;
    settleTimerRef.current = setTimeout(() => settle(y), 100);
  };

  const handleEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settle(e.nativeEvent.contentOffset.y);
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
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollEndDrag={handleEnd}
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
  const monthLabel = formatLocalizedMonthYear(new Date(year, month, 1));
  const dayLabels = getLocalizedCalendarDays();

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
          {monthLabel}
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
        {dayLabels.map((d, i) => (
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
  title: {
    fontFamily: "InstrumentSerif_400Regular", fontSize: 17, fontWeight: "400", color: "#0E1A24" },
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
  style,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const first = title.charAt(0);
  const rest = title.slice(1);
  return (
    <View style={[styles.section, style]}>
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
  safe: { flex: 1, backgroundColor: TAVORIA.color.paperDeep },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomColor: TAVORIA.color.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: { fontFamily: "InstrumentSerif_400Regular", fontSize: 22, fontWeight: "400", color: TAVORIA.color.navy },

  scroll: { alignSelf: "center", paddingHorizontal: TAVORIA.space.md, paddingTop: TAVORIA.space.sm, paddingBottom: 128, width: "100%" },
  scrollDesktop: { maxWidth: 840, paddingHorizontal: TAVORIA.space.lg },
  helperText: { color: TAVORIA.color.muted, fontSize: 12, lineHeight: 17, marginTop: 10 },
  controlPressed: { opacity: 0.72 },

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

  section: { marginTop: 28 },
  sectionTitle: {
    color: TAVORIA.color.muted,
    fontFamily: "DMMono_500Medium",
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  sectionTitleFirst: { color: TAVORIA.color.orange },
  sectionSub: {
    fontSize: 13,
    color: TAVORIA.color.muted,
    marginTop: 4,
    paddingRight: 20,
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

  daysRow: { flexDirection: "row", gap: 6, width: "100%" },
  dayPill: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.10)",
    justifyContent: "center",
    alignItems: "center",
  },
  dayPillOn: { backgroundColor: "#0E1A24", borderColor: "#0E1A24" },
  dayPillHovered: { backgroundColor: "#F3F4F0" },
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
  timeFields: { alignItems: "center", flex: 1, flexDirection: "row", gap: 10 },
  timeFieldButton: { alignItems: "flex-start", borderRadius: TAVORIA.radius.small, flex: 1, justifyContent: "center", minHeight: 56, paddingHorizontal: 10 },
  timeFieldButtonHovered: { backgroundColor: "#F3F4F0" },
  timeFieldLabel: { color: TAVORIA.color.muted, fontFamily: TAVORIA.type.label, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" },
  timeFieldValue: { color: TAVORIA.color.navy, fontFamily: TAVORIA.type.medium, fontSize: 17, marginTop: 3 },
  timeFieldPlaceholder: { color: "#9CA3AF" },
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

  optionStack: { gap: 8 },
  optionRow: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.small, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 64, paddingHorizontal: 12, paddingVertical: 10 },
  optionRowOn: { backgroundColor: TAVORIA.color.orangeSoft, borderColor: TAVORIA.color.orange },
  optionRowHovered: { backgroundColor: "#F3F4F0" },
  optionIcon: { alignItems: "center", backgroundColor: TAVORIA.color.paperDeep, borderRadius: TAVORIA.radius.small, height: 34, justifyContent: "center", width: 34 },
  optionIconOn: { backgroundColor: TAVORIA.color.white },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTitle: { color: TAVORIA.color.navy, fontSize: 15, fontWeight: "700" },
  optionSub: { color: TAVORIA.color.muted, fontSize: 12, lineHeight: 16, marginTop: 2 },

  paySection: { marginTop: 18 },
  payUnitRow: { backgroundColor: TAVORIA.color.paperDeep, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, flexDirection: "row", gap: 4, padding: 4 },
  payUnitOption: { alignItems: "center", borderColor: "transparent", borderRadius: TAVORIA.radius.small, borderWidth: 1, flex: 1, height: 44, justifyContent: "center", paddingHorizontal: 8 },
  payUnitOptionOn: { backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border },
  payUnitOptionHovered: { backgroundColor: "rgba(255,255,255,0.65)" },
  payUnitText: { color: TAVORIA.color.muted, fontSize: 13, fontWeight: "600", textAlign: "center" },
  payUnitTextOn: { color: TAVORIA.color.navy },
  payInputRow: { alignItems: "center", backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, flexDirection: "row", gap: 6, marginTop: 12, minHeight: 58, paddingHorizontal: 16 },
  payCurrency: { color: TAVORIA.color.navy, fontSize: 24, fontWeight: "800" },
  payInput: { color: TAVORIA.color.navy, flex: 1, fontSize: 24, fontWeight: "700", padding: 0, textAlignVertical: "center" },
  payUnitLabel: { color: TAVORIA.color.muted, fontSize: 13 },
  discussLaterHovered: { backgroundColor: "rgba(14,26,36,0.06)" },
  reviewBox: { backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.small, borderWidth: 1, marginTop: 28, padding: 14 },
  reviewTitle: { color: TAVORIA.color.muted, fontFamily: TAVORIA.type.label, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  reviewValue: { color: TAVORIA.color.navy, fontSize: 14, lineHeight: 20, marginTop: 7 },
  completeHint: { color: TAVORIA.color.muted, fontSize: 12, lineHeight: 17, marginTop: 10 },

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
  contractGrid: { gap: 10, marginTop: 4 },
  contractTile: {
    alignItems: "center",
    backgroundColor: TAVORIA.color.white,
    borderColor: TAVORIA.color.border,
    borderRadius: TAVORIA.radius.small,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: "relative",
    width: "100%",
  },
  contractTileOn: { backgroundColor: TAVORIA.color.orangeSoft, borderColor: TAVORIA.color.orange },
  contractTileHovered: { backgroundColor: "#F3F4F0" },
  contractIconWrap: {
    alignItems: "center",
    backgroundColor: TAVORIA.color.orangeSoft,
    borderRadius: TAVORIA.radius.small,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  contractLabel: { color: TAVORIA.color.navy, flex: 1, fontSize: 15, fontWeight: "800" },
  tile: {
    width: "47.5%",
    height: 72,
    borderRadius: TAVORIA.radius.medium,
    borderWidth: 1,
    borderColor: TAVORIA.color.border,
    backgroundColor: TAVORIA.color.white,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tileOn: { backgroundColor: TAVORIA.color.orangeSoft, borderColor: TAVORIA.color.orange },
  tileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: TAVORIA.radius.small,
    backgroundColor: TAVORIA.color.orangeSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  tileIconWrapPay: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: TAVORIA.color.orangeSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  tileLbl: {
    fontSize: 15,
    fontWeight: "800",
    color: TAVORIA.color.navy,
    textAlign: "center",
    letterSpacing: -0.2,
  },

  // Role image tiles — consistent with the worker role selector
  roleTileWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  roleTileWrapDesktop: {
    gap: 10,
  },
  roleTile: {
    aspectRatio: 1,
    backgroundColor: TAVORIA.color.white,
    borderColor: TAVORIA.color.border,
    borderRadius: TAVORIA.radius.medium,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    width: "47.5%",
  },
  roleTileDesktop: {
    width: "31.5%",
  },
  roleTileOn: {
    borderColor: TAVORIA.color.orange,
    borderWidth: 2,
  },
  roleTileHovered: {
    borderColor: TAVORIA.color.navy,
  },
  roleTileImage: {
    height: "100%",
    width: "100%",
  },
  roleTileScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  roleTileTxt: {
    bottom: 10,
    color: "white",
    fontSize: 14,
    fontWeight: "800",
    left: 6,
    position: "absolute",
    right: 6,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  roleTileCheck: {
    alignItems: "center",
    backgroundColor: TAVORIA.color.orange,
    borderRadius: 999,
    height: 22,
    justifyContent: "center",
    position: "absolute",
    right: 8,
    top: 8,
    width: 22,
  },
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
    backgroundColor: TAVORIA.color.white,
    borderRadius: TAVORIA.radius.medium,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: TAVORIA.color.border,
  },
  payCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  payCardCurrency: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0E1A24",
  },
  payCardInput: {
    fontSize: 42,
    fontWeight: "900",
    color: "#0E1A24",
    minWidth: 80,
    textAlign: "center",
    padding: 0,
    letterSpacing: -1,
  },
  payCardUnitWrap: {
    marginTop: 6,
    backgroundColor: TAVORIA.color.orangeSoft,
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
    alignItems: "center",
    backgroundColor: TAVORIA.color.white,
    borderColor: TAVORIA.color.border,
    borderRadius: TAVORIA.radius.medium,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  discussLaterIcon: {
    alignItems: "center",
    backgroundColor: TAVORIA.color.paperDeep,
    borderRadius: TAVORIA.radius.small,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  discussLaterTxt: { color: TAVORIA.color.navy, flex: 1, fontSize: 13, fontWeight: "700" },

  asapTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: TAVORIA.color.white,
    borderRadius: TAVORIA.radius.medium,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: TAVORIA.color.border,
  },
  asapIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: TAVORIA.color.orangeSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  asapLbl: {
    color: TAVORIA.color.navy,
    fontSize: 15,
    fontWeight: "800",
  },
  asapSub: {
    color: TAVORIA.color.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  // Large variant — for "When does it start" (2 per row, square, bigger)
  tileLg: {
    width: "47.5%",
    height: 64,
    borderRadius: TAVORIA.radius.medium,
    borderWidth: 1,
    borderColor: TAVORIA.color.border,
    backgroundColor: TAVORIA.color.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
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
    backgroundColor: TAVORIA.color.paper,
    borderTopLeftRadius: TAVORIA.radius.large,
    borderTopRightRadius: TAVORIA.radius.large,
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
  modalTitle: {
    fontFamily: "InstrumentSerif_400Regular", fontSize: 15, fontWeight: "400", color: "#0E1A24" },
  modalDone: { color: "#F0531C", fontSize: 15, fontWeight: "400" },

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
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "white",
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  footerActions: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "center", maxWidth: 420, width: "100%" },
  footerButton: { flex: 1, width: "auto" },
});
