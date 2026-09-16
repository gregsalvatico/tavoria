import { useRouter } from "expo-router";
import { useState } from "react";
import { t } from "../lib/i18n";
import { useIsDesktop } from "../lib/responsive";
import StickyFooter from "../components/StickyFooter";
import ActionButton from "../components/ActionButton";
import { FormFlowHeader } from "../components/PagePrimitives";
import { getVenueProfile, patchVenueProfile } from "../lib/venueProfile";
import { ScrollView, StyleSheet } from "react-native";
import VenueTypePicker, { venueTypeId, venueTypeLabel } from "../components/VenueTypePicker";

import { SafeAreaView } from "react-native-safe-area-context";

export default function VenueType() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [picked, setPicked] = useState<string | null>(() => venueTypeId(getVenueProfile()?.type));
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FormFlowHeader
        title={t("venue_type.title")}
        onBack={() => {
          if (router.canGoBack()) { router.back(); return; }
          router.replace("/");
        }}
        step={0}
        total={5}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <VenueTypePicker value={picked} onChange={setPicked} />
      </ScrollView>
      <StickyFooter desktopRow fullBleed backgroundColor="#F7F4EE">
        <ActionButton
          label={t("common.continue")}
          icon="arrow-right"
          disabled={!picked}
          onPress={() => {
            const chosen = venueTypeLabel(picked);
            if (chosen) patchVenueProfile({ type: chosen });
            router.push("/venue-info");
          }}
          style={styles.fullWidthButton}
        />
      </StickyFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F4EE" },
  container: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  containerDesktop: { alignSelf: "center", maxWidth: 840, paddingHorizontal: 24, width: "100%" },
  fullWidthButton: { width: "100%" },
});
