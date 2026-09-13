import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { t, useLanguage } from "../lib/i18n";
import { TAVORIA } from "../lib/designTokens";
import VenueQrFab from "./VenueQrFab";

type WorkerTab = "home" | "applications" | "profile";
type VenueTab = "home" | "inbox" | "shifts";

type Props =
  | { role: "worker"; active: WorkerTab; badge?: number }
  | { role: "venue"; active: VenueTab; badge?: number };

export default function AppBottomNav(props: Props) {
  const router = useRouter();
  useLanguage();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  const items = props.role === "worker"
    ? [
        { id: "home", icon: "home", label: t("home_in.home"), route: "/" },
        { id: "applications", icon: "send", label: t("home_in.my_applications"), route: "/worker-applications", badge: props.badge },
        { id: "profile", icon: "user", label: t("home_in.my_card"), route: "/candidate" },
      ]
    : [
        { id: "home", icon: "users", label: t("home_in.home"), route: "/" },
        { id: "inbox", icon: "inbox", label: t("home_in.inbox"), route: "/venue-inbox", badge: props.badge },
        { id: "shifts", icon: "briefcase", label: t("home_in.my_shifts"), route: "/venue-shifts" },
      ];

  if (isDesktop) return null;

  return (
    <View style={styles.root}>
      {items.map((item) => {
        const active = item.id === props.active;
        return (
          <Pressable
            key={item.id}
            style={styles.item}
            onPress={() => {
              if (!active) router.replace(item.route as never);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
          >
            <View>
              <Feather
                name={item.icon as keyof typeof Feather.glyphMap}
                size={21}
                color={active ? TAVORIA.color.orange : TAVORIA.color.muted}
              />
              {!!item.badge && item.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge > 99 ? "99+" : item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
      {props.role === "venue" ? <VenueQrFab /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    backgroundColor: TAVORIA.color.white,
    borderTopColor: TAVORIA.color.border,
    borderTopWidth: 1,
    flexDirection: "row",
    minHeight: 64,
    zIndex: 20,
    paddingBottom: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  item: {
    alignItems: "center",
    flex: 1,
    gap: 5,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 4,
  },
  label: { color: TAVORIA.color.muted, fontSize: 10, fontWeight: "700", textAlign: "center" },
  labelActive: { color: TAVORIA.color.orange },
  badge: {
    alignItems: "center",
    backgroundColor: "#F0531C",
    borderColor: "white",
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: "center",
    minWidth: 19,
    paddingHorizontal: 4,
    paddingVertical: 1,
    position: "absolute",
    right: -11,
    top: -8,
  },
  badgeText: { color: "white", fontSize: 8, fontWeight: "800" },
});
