import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { clearVenueProfile } from "../lib/venueProfile";
import { clearWorkerProfile } from "../lib/workerProfile";
import { getCachedHomeContext, setCachedHomeContext, subscribeToHomeContext, type HomeContext } from "../lib/homeContextCache";
import { setLanguage, t, useLanguage } from "../lib/i18n";
import { supabase } from "../lib/supabase";
import { TAVORIA } from "../lib/designTokens";
import { PageHeader, RefreshIconButton } from "./PagePrimitives";
import MobileAccountMenu from "./MobileAccountMenu";

type ActiveView = "home" | "applications" | "profile";

type Props = {
  title: string;
  active: ActiveView;
  onRefresh?: () => void;
  refreshable?: boolean;
  refreshing?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function WorkerScreenHeader({ title, active, onRefresh, refreshable = false, refreshing = false, style }: Props) {
  const router = useRouter();
  useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [context, setContext] = useState<HomeContext>(() => getCachedHomeContext() ?? { hasVenue: false, hasWorker: true });

  useEffect(() => subscribeToHomeContext((next) => {
    if (next) setContext(next);
  }), []);

  const signOut = async () => {
    setMenuOpen(false);
    clearVenueProfile();
    clearWorkerProfile();
    setCachedHomeContext({ hasVenue: false, hasWorker: false });
    await supabase.auth.signOut().catch(() => {});
    router.replace("/");
  };

  return (
    <>
      <PageHeader
        title={title}
        left={
          <Pressable
            accessibilityLabel="Open account menu"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setMenuOpen(true)}
            style={({ hovered, pressed }) => [
              styles.headerIconButton,
              hovered && styles.headerIconButtonHovered,
              pressed && styles.headerIconButtonPressed,
            ]}
          >
            <Feather name="menu" size={21} color={TAVORIA.color.navy} />
          </Pressable>
        }
        right={onRefresh && refreshable ? (
          <RefreshIconButton label={t("talent.retry")} loading={refreshing} onPress={onRefresh} />
        ) : null}
        style={style}
      />

      <MobileAccountMenu
        visible={menuOpen}
        role="worker"
        context={{ ...context, hasVenue: false, hasWorker: true }}
        onClose={() => setMenuOpen(false)}
        onNavigate={(path) => router.replace(path as never)}
        onChangeLanguage={async (nextLanguage) => { await setLanguage(nextLanguage); }}
        onSignOut={signOut}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerIconButton: { alignItems: "center", borderRadius: 10, height: 36, justifyContent: "center", width: 36 },
  headerIconButtonHovered: { backgroundColor: "rgba(14,26,36,0.07)" },
  headerIconButtonPressed: { opacity: 0.72 },
});
