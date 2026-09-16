import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  Share,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { clearVenueProfile, getVenueProfile } from "../lib/venueProfile";
import { clearWorkerProfile } from "../lib/workerProfile";
import { getCachedHomeContext, setCachedHomeContext, subscribeToHomeContext, type HomeContext } from "../lib/homeContextCache";
import { supabase } from "../lib/supabase";
import { setLanguage, t, useLanguage } from "../lib/i18n";
import { downloadVenueQRPoster } from "../lib/qrPoster";
import { TAVORIA } from "../lib/designTokens";
import { PageHeader, RefreshIconButton } from "./PagePrimitives";
import MobileAccountMenu from "./MobileAccountMenu";

type ActiveView = "candidates" | "inbox" | "shifts";

type Props = {
  title: string;
  active: ActiveView;
  onBack?: () => void;
  onRefresh?: () => void;
  refreshable?: boolean;
  refreshing?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function VenueScreenHeader({ title, active, onBack, onRefresh, refreshable = false, refreshing = false, style }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  useLanguage();
  const [context, setContext] = useState<HomeContext>(() => getCachedHomeContext() ?? { hasVenue: true, hasWorker: false });

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

  const shareTavoria = async () => {
    try {
      await Share.share({
        message: `${t("share_tavoria_modal.message")}\nhttps://tavoriapp.com`,
        url: "https://tavoriapp.com",
      });
    } catch {}
  };

  const printQr = async () => {
    const venue = getVenueProfile();
    const venueId = context.venueId ?? venue?.id;
    if (!venueId) return;
    try {
      await downloadVenueQRPoster({
        venueId,
        venueName: context.venueName ?? venue?.name ?? "",
        venueCity: context.venueCity ?? venue?.city,
      });
    } catch (error) {
      Alert.alert(t("home_in.print_qr"), String((error as Error)?.message ?? error));
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        showLeftOnDesktop={Boolean(onBack)}
        left={onBack ? (
          <Pressable
            accessibilityLabel={t("common.back")}
            accessibilityRole="button"
            hitSlop={10}
            onPress={onBack}
            style={({ hovered, pressed }) => [
              styles.headerIconButton,
              hovered && styles.headerIconButtonHovered,
              pressed && styles.headerIconButtonPressed,
            ]}
          >
            <Feather name="chevron-left" size={24} color={TAVORIA.color.navy} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel="Open venue menu"
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
        )}
        right={onRefresh && refreshable ? (
          <RefreshIconButton
            label={t("talent.retry")}
            loading={refreshing}
            onPress={onRefresh}
          />
        ) : null}
        style={style}
      />

      <MobileAccountMenu
        visible={menuOpen}
        role="venue"
        context={{ ...context, hasVenue: true, hasWorker: false }}
        onClose={() => setMenuOpen(false)}
        onNavigate={(path) => router.replace(path as never)}
        onChangeLanguage={async (language) => {
          await setLanguage(language);
        }}
        onPrintQr={printQr}
        onShare={shareTavoria}
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
