import { Feather } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { t } from "../lib/i18n";
import { PayScheduleId } from "../lib/venueProfile";
import {
  PAY_SCHEDULE_OPTIONS,
  VENUE_STYLE_OPTIONS,
} from "../lib/venueOptions";
import { TAVORIA } from "../lib/designTokens";

export type VenueProfileFieldsSection = "style" | "schedule" | "all";

type Props = {
  section?: VenueProfileFieldsSection;
  venueStyle: string | null;
  paySchedule: PayScheduleId | null;
  customSchedule: string;
  onVenueStyleChange: (value: string) => void;
  onPayScheduleChange: (value: PayScheduleId) => void;
  onCustomScheduleChange: (value: string) => void;
  onOpenCustomSchedule: () => void;
};

export default function VenueProfileFields({
  section = "all",
  venueStyle,
  paySchedule,
  customSchedule,
  onVenueStyleChange,
  onPayScheduleChange,
  onCustomScheduleChange,
  onOpenCustomSchedule,
}: Props) {
  const showStyle = section === "style" || section === "all";
  const showSchedule = section === "schedule" || section === "all";

  return (
    <View style={styles.root}>
      {showStyle ? (
        <Section title={t("venue_style.title")} subtitle={t("venue_style.sub")}>
          <View style={styles.optionList}>
            {VENUE_STYLE_OPTIONS.map((option) => {
              const selected = venueStyle === option.id;
              return (
                <ChoiceRow
                  key={option.id}
                  icon={option.icon}
                  title={t(option.labelKey)}
                  subtitle={t(option.subKey)}
                  selected={selected}
                  onPress={() => onVenueStyleChange(option.id)}
                />
              );
            })}
          </View>
        </Section>
      ) : null}

      {showSchedule ? (
        <Section title={t("pay_schedule.title")} subtitle={t("pay_schedule.sub")}>
          <View style={styles.optionList}>
            {PAY_SCHEDULE_OPTIONS.map((option) => (
              <ChoiceRow
                key={option.id}
                icon={option.icon}
                title={t(option.labelKey)}
                selected={paySchedule === option.id}
                onPress={() => onPayScheduleChange(option.id)}
              />
            ))}
            <ChoiceRow
              icon="more-horizontal"
              title={customSchedule || t("pay_schedule.other")}
              selected={paySchedule === "custom"}
              onPress={() => {
                onPayScheduleChange("custom");
                onOpenCustomSchedule();
              }}
            />
          </View>
          {paySchedule === "custom" ? (
            <TextInput
              value={customSchedule}
              onChangeText={onCustomScheduleChange}
              placeholder={t("pay_schedule.other")}
              placeholderTextColor="#8A929B"
              style={styles.inlineScheduleInput}
            />
          ) : null}
        </Section>
      ) : null}
    </View>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

function ChoiceRow({
  icon,
  title,
  subtitle,
  selected,
  disabled = false,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.choiceRow,
        selected && styles.choiceRowSelected,
        hovered && !selected && styles.choiceRowHovered,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>
        <Feather name={icon} size={16} color={selected ? TAVORIA.color.orange : TAVORIA.color.muted} />
      </View>
      <View style={styles.choiceCopy}>
        <Text style={styles.choiceTitle}>{title}</Text>
        {subtitle ? <Text style={styles.choiceSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: TAVORIA.space.lg },
  section: { gap: TAVORIA.space.sm },
  sectionTitle: { color: TAVORIA.color.navy, fontSize: 18, fontWeight: "800" },
  sectionSubtitle: { color: TAVORIA.color.muted, fontSize: 13, lineHeight: 18 },
  optionList: { backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, overflow: "hidden" },
  choiceRow: { alignItems: "center", borderBottomColor: TAVORIA.color.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: TAVORIA.space.sm, minHeight: 58, paddingHorizontal: TAVORIA.space.sm },
  choiceRowSelected: { backgroundColor: TAVORIA.surface.selected },
  choiceRowHovered: { backgroundColor: TAVORIA.color.paperDeep },
  choiceIcon: { alignItems: "center", backgroundColor: TAVORIA.color.paperDeep, borderRadius: TAVORIA.radius.small, height: 34, justifyContent: "center", width: 34 },
  choiceIconSelected: { backgroundColor: TAVORIA.color.white },
  choiceCopy: { flex: 1, gap: 2 },
  choiceTitle: { color: TAVORIA.color.navy, fontSize: 14, fontWeight: "700" },
  choiceSubtitle: { color: TAVORIA.color.muted, fontSize: 12 },
  radio: { alignItems: "center", borderColor: TAVORIA.color.borderStrong, borderRadius: TAVORIA.radius.pill, borderWidth: 1, height: 20, justifyContent: "center", width: 20 },
  radioSelected: { borderColor: TAVORIA.color.orange },
  radioDot: { backgroundColor: TAVORIA.color.orange, borderRadius: TAVORIA.radius.pill, height: 10, width: 10 },
  inlineScheduleInput: { backgroundColor: TAVORIA.color.white, borderColor: TAVORIA.color.border, borderRadius: TAVORIA.radius.medium, borderWidth: 1, color: TAVORIA.color.navy, fontSize: 14, minHeight: 48, paddingHorizontal: TAVORIA.space.sm },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.42 },
});
