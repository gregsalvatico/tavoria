// Tavoria v2 component kit
//
// Every new screen built in the v2 rewrite composes from these primitives.
// Goal: a screen file should be ~50-150 lines of layout, with all visual
// language (typography, colours, spacing, radii) coming from this kit.
//
// Design system: Hanken Grotesk body, Instrument Serif italic headlines,
// DM Mono labels/numerals, cream paper #F7F4EE, ink #0E1A24, tangerine
// #F0531C. See lib/theme.ts for the colour + font name tokens.

import { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "../lib/theme";

// ─── Container ──────────────────────────────────────────────────────────────
// Standard padded screen wrapper. Wraps content in a SafeAreaView with cream
// background. Use this as the root of every v2 screen.

export function Screen({
  children,
  scroll = false,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.screenInner, style]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screenInner, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {inner}
    </SafeAreaView>
  );
}

// ─── Typography ─────────────────────────────────────────────────────────────
// All text components inherit Hanken Grotesk from the global default
// (see app/_layout.tsx). These wrappers add weight + size + colour.

export function H1({ children, italic, style, ...rest }: TextProps & { italic?: boolean }) {
  return (
    <Text
      {...rest}
      style={[
        styles.h1,
        italic ? { fontFamily: fonts.serifItalic, fontStyle: "italic" } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function H2({ children, italic, style, ...rest }: TextProps & { italic?: boolean }) {
  return (
    <Text
      {...rest}
      style={[
        styles.h2,
        italic ? { fontFamily: fonts.serifItalic, fontStyle: "italic" } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function H3({ children, italic, style, ...rest }: TextProps & { italic?: boolean }) {
  return (
    <Text
      {...rest}
      style={[
        styles.h3,
        italic ? { fontFamily: fonts.serifItalic, fontStyle: "italic" } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({ children, muted, style, ...rest }: TextProps & { muted?: boolean }) {
  return (
    <Text {...rest} style={[styles.body, muted && { color: colors.mute }, style]}>
      {children}
    </Text>
  );
}

export function Caption({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.caption, style]}>
      {children}
    </Text>
  );
}

// Eyebrow: small uppercase tracked label in DM Mono. Use above headlines
// or to tag sections. Defaults to mute colour; pass `accent` for tangerine.
export function Eyebrow({
  children,
  accent,
  style,
  ...rest
}: TextProps & { accent?: boolean }) {
  return (
    <Text
      {...rest}
      style={[styles.eyebrow, accent && { color: colors.tangerine }, style]}
    >
      {children}
    </Text>
  );
}

// Mono: for numerals (prices, counters, time-to-hire) and uppercase labels
// like NEW SHIFT, STEP 01. Use `large` for hero numerals (24h, 30s, €0).
export function Mono({
  children,
  large,
  style,
  ...rest
}: TextProps & { large?: boolean }) {
  return (
    <Text {...rest} style={[styles.mono, large && styles.monoLarge, style]}>
      {children}
    </Text>
  );
}

// ─── Buttons ────────────────────────────────────────────────────────────────
// Three variants: primary (tangerine fill), secondary (ink outline), and
// ghost (no border, just text). Size: `lg` for hero CTAs, default for inline.

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "default" | "lg";

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "default",
  disabled,
  style,
  testID,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const base: ViewStyle = styles.btnBase;
  const variantStyle =
    variant === "primary"
      ? styles.btnPrimary
      : variant === "secondary"
      ? styles.btnSecondary
      : styles.btnGhost;
  const sizeStyle = size === "lg" ? styles.btnLg : styles.btnMd;
  const labelColor =
    variant === "primary"
      ? colors.surface
      : variant === "secondary"
      ? colors.ink
      : colors.ink;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[base, variantStyle, sizeStyle, disabled && styles.btnDisabled, style]}
      testID={testID}
    >
      <Text
        style={[
          styles.btnLabel,
          size === "lg" && styles.btnLabelLg,
          { color: labelColor },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────
// White surface card on cream paper. Subtle hairline border + soft radius.
// `tone` darker variant for promotional sections (ink background, cream text).

export function Card({
  children,
  tone = "light",
  style,
  ...rest
}: ViewProps & { tone?: "light" | "dark"; children: ReactNode }) {
  return (
    <View
      {...rest}
      style={[
        styles.card,
        tone === "dark" ? styles.cardDark : styles.cardLight,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ─── Pill ───────────────────────────────────────────────────────────────────
// Small pill — used for status badges (LIVE, HIRED, NEW SHIFT). Mono font,
// 11px, tight padding, full radius.

export function Pill({
  children,
  variant = "default",
  style,
}: {
  children: ReactNode;
  variant?: "default" | "accent" | "dark" | "success";
  style?: StyleProp<ViewStyle>;
}) {
  const variantStyle =
    variant === "accent"
      ? styles.pillAccent
      : variant === "dark"
      ? styles.pillDark
      : variant === "success"
      ? styles.pillSuccess
      : styles.pillDefault;
  const textColor =
    variant === "dark" || variant === "accent"
      ? colors.surface
      : variant === "success"
      ? colors.success
      : colors.mute;
  return (
    <View style={[styles.pill, variantStyle, style]}>
      <Text style={[styles.pillTxt, { color: textColor }]}>{children}</Text>
    </View>
  );
}

// ─── Hairline ───────────────────────────────────────────────────────────────
// 0.5px ink-tinted divider with 30% opacity. Use generously instead of full
// borders to keep the editorial feel clean.

export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.hairline, style]} />;
}

// ─── StepCard ───────────────────────────────────────────────────────────────
// Editorial step card: big brass-tone numeral on the left ("01" / "02" / "03"),
// title + body on the right. Used in How-it-works sections.

export function StepCard({
  number,
  title,
  body,
  style,
}: {
  number: string;
  title: string;
  body: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.stepCard, style]}>
      <Text style={styles.stepNumber}>{number}</Text>
      <View style={{ flex: 1 }}>
        <H3 style={{ marginBottom: 6 }}>{title}</H3>
        <Body muted>{body}</Body>
      </View>
    </View>
  );
}

// ─── Stats Strip ─────────────────────────────────────────────────────────────
// Horizontal strip of big numerals + small captions. Used near hero. Pass an
// array of {value, label, accent?} — accent makes that value tangerine.

export function StatsStrip({
  items,
  style,
}: {
  items: { value: string; label: string; accent?: boolean }[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.statsStrip, style]}>
      {items.map((item, i) => (
        <View key={i} style={styles.statItem}>
          <Mono large style={item.accent ? { color: colors.tangerine } : null}>
            {item.value}
          </Mono>
          <Caption style={styles.statLabel}>{item.label}</Caption>
        </View>
      ))}
    </View>
  );
}

// ─── TextField ──────────────────────────────────────────────────────────────
// Form input with editorial-style label (DM Mono uppercase eyebrow above)
// and a thin hairline beneath the text. No card chrome, no boxy borders —
// the input feels like writing on paper.

export function TextField({
  label,
  optional,
  hint,
  error,
  style,
  ...rest
}: TextInputProps & {
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
}) {
  return (
    <View style={[styles.fieldWrap, style]}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {optional ? <Text style={styles.fieldOptional}>opzionale</Text> : null}
      </View>
      <TextInput
        {...rest}
        placeholderTextColor={colors.mute}
        style={[styles.fieldInput, error && styles.fieldInputError]}
      />
      {hint && !error ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// ─── PhoneField ─────────────────────────────────────────────────────────────
// Phone input with a left "🇮🇹 +39" prefix block, visually attached to the
// main number input but with a vertical divider. For Italian launch the prefix
// is hardcoded; future PR adds a country picker.

export function PhoneField({
  label,
  optional,
  flag = "🇮🇹",
  dial = "+39",
  hint,
  error,
  style,
  ...rest
}: TextInputProps & {
  label: string;
  optional?: boolean;
  flag?: string;
  dial?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <View style={[styles.fieldWrap, style]}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {optional ? <Text style={styles.fieldOptional}>opzionale</Text> : null}
      </View>
      <View
        style={[
          styles.phoneInputWrap,
          error && { borderColor: colors.danger },
        ]}
      >
        <View style={styles.phonePrefix}>
          <Text style={styles.phoneFlag}>{flag}</Text>
          <Text style={styles.phoneDial}>{dial}</Text>
        </View>
        <View style={styles.phoneDivider} />
        <TextInput
          {...rest}
          placeholderTextColor={colors.mute}
          style={styles.phoneNumberInput}
          keyboardType="phone-pad"
        />
      </View>
      {hint && !error ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// ─── PinBoxes ───────────────────────────────────────────────────────────────
// 4 individual boxes, one digit each. Tap any box → keyboard opens → digits
// auto-fill left-to-right. Active box shows a tangerine border with a thin
// cursor; filled boxes show a centred dot.

export function PinBoxes({
  value,
  onChange,
  label,
  hint,
  error,
  length = 4,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  length?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.fieldWrap, style]}>
      {label ? (
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>{label}</Text>
        </View>
      ) : null}
      <View style={styles.pinRow}>
        {Array.from({ length }).map((_, i) => {
          const filled = value.length > i;
          const active = value.length === i;
          return (
            <Pressable
              key={i}
              onPress={() => onChange(value.slice(0, i))}
              style={[
                styles.pinBox,
                active && styles.pinBoxActive,
                error && styles.pinBoxError,
              ]}
            >
              {filled ? (
                <View style={styles.pinFilled} />
              ) : active ? (
                <View style={styles.pinCursor} />
              ) : null}
            </Pressable>
          );
        })}
        {/* Hidden input drives the value via the box presses */}
        <TextInput
          value={value}
          onChangeText={(v) =>
            onChange(v.replace(/[^0-9]/g, "").slice(0, length))
          }
          keyboardType="number-pad"
          maxLength={length}
          autoFocus={false}
          style={styles.pinHiddenInput}
        />
      </View>
      {hint && !error ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// ─── TrustCard ──────────────────────────────────────────────────────────────
// Soft-green card with a shield icon — used for GDPR / EU-server messaging
// near the bottom of the signup. Reduces friction by saying the quiet part
// loud: "your data is safe."

export function TrustCard({
  title,
  body,
  style,
}: {
  title: string;
  body: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.trustCard, style]}>
      <View style={styles.trustShield}>
        <Text style={styles.trustShieldIcon}>⛨</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.trustTitle}>{title}</Text>
        <Text style={styles.trustBody}>{body}</Text>
      </View>
    </View>
  );
}

// ─── ProgressBar ────────────────────────────────────────────────────────────
// Slim horizontal progress indicator. Use at the top of multi-step flows
// instead of dot steppers when you want a more linear, intentional feel.

export function ProgressBar({
  current,
  total,
  style,
}: {
  current: number;
  total: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pct = Math.max(0, Math.min(1, current / total));
  return (
    <View style={[styles.progressBar, style]}>
      <View
        style={[styles.progressBarFill, { width: `${pct * 100}%` }]}
      />
    </View>
  );
}

// ─── Stepper ────────────────────────────────────────────────────────────────
// Small progress indicator — N dashes, the active ones ink, the inactive
// ones a hairline. Sits at the top of multi-step flows.

export function Stepper({
  total,
  current,
  style,
}: {
  total: number;
  current: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.stepperRow, style]}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepperBar,
            i < current && styles.stepperBarActive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Checkbox ───────────────────────────────────────────────────────────────
// Compact checkbox with label. Used for T&C acceptance, phone visibility, etc.
// Pass children for the label content (can include <Pressable> links).

export function Checkbox({
  checked,
  onToggle,
  children,
  style,
}: {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={6}
      style={[styles.checkboxRow, style]}
    >
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxOn]}>
        {checked && <Text style={styles.checkboxTick}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

// ─── BackBar ────────────────────────────────────────────────────────────────
// Editorial top bar with a back arrow + step indicator + optional skip link.
// Use at the top of multi-step screens.

export function BackBar({
  onBack,
  step,
  totalSteps,
  onSkip,
  skipLabel,
  style,
}: {
  onBack?: () => void;
  step?: number;
  totalSteps?: number;
  onSkip?: () => void;
  skipLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.backBar, style]}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
      </Pressable>
      {step != null && totalSteps != null ? (
        <Stepper total={totalSteps} current={step} />
      ) : (
        <View />
      )}
      {onSkip ? (
        <Pressable onPress={onSkip} hitSlop={8}>
          <Text style={styles.skipLink}>{skipLabel ?? "Salta"}</Text>
        </Pressable>
      ) : (
        <View style={{ width: 28 }} />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Screen
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  screenInner: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Typography
  h1: {
    fontFamily: fonts.serif,
    fontSize: 48,
    lineHeight: 50,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  h2: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  h3: {
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.2,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mute,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.mute,
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.ink,
  },
  monoLarge: {
    fontFamily: fonts.serif,
    fontSize: 44,
    lineHeight: 46,
    color: colors.ink,
  },

  // Buttons
  btnBase: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    flexDirection: "row",
  },
  btnPrimary: {
    backgroundColor: colors.tangerine,
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.ink,
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  btnMd: {
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  btnLg: {
    paddingVertical: 18,
    paddingHorizontal: 28,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnLabel: {
    fontFamily: fonts.sansSemibold,
    fontSize: 15,
    letterSpacing: -0.1,
  },
  btnLabelLg: {
    fontSize: 17,
  },

  // Card
  card: {
    borderRadius: 22,
    padding: 22,
  },
  cardLight: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  cardDark: {
    backgroundColor: colors.ink,
  },

  // Pill
  pill: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  pillDefault: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
  },
  pillAccent: {
    backgroundColor: colors.tangerine,
  },
  pillDark: {
    backgroundColor: colors.ink,
  },
  pillSuccess: {
    backgroundColor: "rgba(15,110,86,0.12)",
  },
  pillTxt: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  // Hairline
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairlineStrong,
  },

  // StepCard
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
  },
  stepNumber: {
    fontFamily: fonts.serif,
    fontSize: 60,
    lineHeight: 60,
    color: colors.tangerine,
    letterSpacing: -2,
    minWidth: 70,
  },

  // TextField — card-style: white surface, rounded, soft border. Mono uppercase
  // label sits above. Generous height so it feels intentional, not cramped.
  fieldWrap: { marginBottom: 18 },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.mute,
  },
  fieldOptional: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.mute2,
    opacity: 0.7,
  },
  fieldInput: {
    fontFamily: fonts.sans,
    fontSize: 17,
    color: colors.ink,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  fieldInputError: { borderColor: colors.danger },
  fieldHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mute,
    marginTop: 6,
    lineHeight: 18,
  },
  fieldError: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.danger,
    marginTop: 6,
  },

  // PhoneField — country prefix block on the left
  phoneInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    borderRadius: 14,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  phonePrefix: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  phoneFlag: { fontSize: 18 },
  phoneDial: {
    fontFamily: fonts.sans,
    fontSize: 17,
    color: colors.ink,
  },
  phoneDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: colors.hairlineStrong,
  },
  phoneNumberInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 17,
    color: colors.ink,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },

  // PinBoxes — 4 separate squares
  pinRow: {
    flexDirection: "row",
    gap: 10,
    position: "relative",
  },
  pinBox: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 76,
    borderWidth: 1.5,
    borderColor: colors.hairlineStrong,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pinBoxActive: {
    borderColor: colors.tangerine,
    borderWidth: 2,
  },
  pinBoxError: {
    borderColor: colors.danger,
  },
  pinFilled: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.ink,
  },
  pinCursor: {
    width: 2,
    height: 24,
    backgroundColor: colors.tangerine,
    borderRadius: 1,
  },
  pinHiddenInput: {
    position: "absolute",
    opacity: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // TrustCard — soft green tinted card with shield
  trustCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(15,110,86,0.08)",
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.18)",
    marginBottom: 18,
  },
  trustShield: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  trustShieldIcon: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.paper,
    lineHeight: 16,
  },
  trustTitle: {
    fontFamily: fonts.sansSemibold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 2,
  },
  trustBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mute,
  },

  // ProgressBar — slim horizontal bar
  progressBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.hairlineStrong,
    overflow: "hidden",
    marginBottom: 24,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.tangerine,
  },

  // Stepper
  stepperRow: { flexDirection: "row", gap: 6 },
  stepperBar: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.hairlineStrong,
  },
  stepperBarActive: {
    backgroundColor: colors.ink,
  },

  // Checkbox
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.mute,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    backgroundColor: colors.surface,
  },
  checkboxBoxOn: {
    backgroundColor: colors.tangerine,
    borderColor: colors.tangerine,
  },
  checkboxTick: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.surface,
    lineHeight: 16,
  },

  // BackBar
  backBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontFamily: fonts.sans,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 22,
  },
  skipLink: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.mute,
  },

  // StatsStrip — each item gets its own column with flex: 1 and a gap so
  // labels don't crash into each other on narrow phones. Center-aligned per
  // column, 11px caption font, line-height that allows wrapping inside.
  statsStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 24,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 14,
    color: colors.mute,
  },
});
