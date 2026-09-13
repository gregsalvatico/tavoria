import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LANGUAGES, type Language, t, useLanguage } from "../lib/i18n";
import type { HomeContext } from "../lib/homeContextCache";
import { openExternalLink } from "../lib/externalLinks";
import { getAccountMenuSections } from "../lib/accountNavigation";

type NavigationItem = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  selected?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  role: "venue" | "worker";
  context: HomeContext;
  avatarFallback?: ImageSourcePropType;
  navigationItems?: NavigationItem[];
  onClose: () => void;
  onNavigate: (path: string) => void;
  onChangeLanguage: (language: Language) => Promise<void>;
  onPrintQr?: () => Promise<void>;
  onShare?: () => void | Promise<void>;
  onSignOut: () => Promise<void>;
};

export default function MobileAccountMenu({
  visible,
  role,
  context,
  avatarFallback,
  navigationItems = [],
  onClose,
  onNavigate,
  onChangeLanguage,
  onPrintQr,
  onShare,
  onSignOut,
}: Props) {
  const currentLanguage = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const menu = getAccountMenuSections(role);
  const displayName = role === "venue"
    ? context.venueName || t("home_in.continue_venue")
    : context.workerName || t("home_in.continue_worker");
  const city = role === "venue" ? context.venueCity : context.workerCity;
  const photoUrl = role === "venue" ? context.venuePhotoUrl : context.workerPhotoUrl;
  const closeAnd = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.drawerRoot}>
          <SafeAreaView style={styles.drawer} edges={["top", "bottom"]}>
            <ScrollView contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false}>
              <View style={styles.drawerProfile}>
                <View style={styles.drawerAvatarWrap}>
                  <View style={styles.avatar}>
                    {photoUrl ? (
                      <Image source={{ uri: photoUrl }} style={styles.avatarImage} resizeMode="cover" />
                    ) : avatarFallback ? (
                      <Image source={avatarFallback} style={styles.avatarImage} resizeMode="cover" />
                    ) : (
                      <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.drawerProfileText}>
                  <Text style={styles.drawerName} numberOfLines={1}>{displayName}</Text>
                  {context.username ? <Text style={styles.drawerUsername} numberOfLines={1}>@{context.username}</Text> : null}
                  <Text style={styles.drawerMeta} numberOfLines={1}>
                    {role === "venue" ? t("auth_pin.role_venue") : t("auth_pin.role_worker")}
                    {city ? ` · ${city}` : ""}
                  </Text>
                </View>
              </View>

              {navigationItems.length ? (
                <DrawerSection>
                  {navigationItems.map((item) => (
                    <DrawerAction
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      selected={item.selected}
                      onPress={() => closeAnd(item.onPress)}
                    />
                  ))}
                </DrawerSection>
              ) : null}

              <DrawerSection>
                {role === "venue" && onPrintQr ? (
                  <DrawerAction icon="printer" label={t("home_in.print_qr")} onPress={() => closeAnd(() => void onPrintQr())} />
                ) : null}
                {role === "worker" ? (
                  <DrawerAction icon="maximize" label={t("home.scan_qr")} onPress={() => closeAnd(() => onNavigate("/scan"))} />
                ) : null}
                {menu.roleActions.map((item) => (
                  <DrawerAction
                    key={item.id}
                    icon={item.icon}
                    label={t(item.labelKey)}
                    detail={item.detailKey ? t(item.detailKey) : undefined}
                    onPress={() => closeAnd(() => {
                      if (item.id === "share") void onShare?.();
                    })}
                  />
                ))}
              </DrawerSection>

              <DrawerSection>
                {menu.commonActions.map((item) => (
                  <DrawerAction
                    key={item.id}
                    icon={item.icon}
                    label={t(item.labelKey)}
                    detail={item.id === "language" ? currentLanguage.toUpperCase() : item.detailKey ? t(item.detailKey) : undefined}
                    onPress={() => {
                      onClose();
                      if (item.id === "language") setLanguageOpen(true);
                      else if (item.id === "change_pin") onNavigate("/change-pin");
                      else setContactOpen(true);
                    }}
                  />
                ))}
                <DrawerAction icon="log-out" label={t("common.sign_out")} danger onPress={() => closeAnd(() => void onSignOut())} />
              </DrawerSection>
            </ScrollView>
          </SafeAreaView>
          <Pressable style={styles.drawerBackdrop} onPress={onClose} />
        </View>
      </Modal>

      <Modal visible={languageOpen} transparent animationType="fade" onRequestClose={() => setLanguageOpen(false)}>
        <View style={styles.overlayRoot}>
          <Pressable style={styles.languageBackdrop} onPress={() => setLanguageOpen(false)} />
          <View style={styles.languageSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.languageTitle}>{t("language.pick")}</Text>
            {LANGUAGES.map((option) => (
              <Pressable
                key={option.code}
                style={({ hovered, pressed }) => [
                  styles.languageRow,
                  option.code === currentLanguage && styles.languageRowActive,
                  hovered && styles.languageRowHovered,
                  pressed && styles.languageRowPressed,
                ]}
                onPress={async () => {
                  await onChangeLanguage(option.code);
                  setLanguageOpen(false);
                }}
              >
                <Text style={styles.languageFlag}>{option.flag}</Text>
                <Text style={styles.languageLabel}>{option.label}</Text>
                <View style={styles.languageCheck}>
                  {option.code === currentLanguage ? <Feather name="check-circle" size={20} color="#F0531C" /> : null}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={contactOpen} transparent animationType="fade" onRequestClose={() => setContactOpen(false)}>
        <View style={styles.overlayRoot}>
          <Pressable style={styles.contactBackdrop} onPress={() => setContactOpen(false)}>
            <Pressable style={styles.contactSheet} onPress={(event) => event.stopPropagation()}>
              <View style={styles.sheetHandle} />
              <Text style={styles.contactTitle}>{t("team_contact.title")}</Text>
              <Text style={styles.contactSub}>{t("team_contact.subtitle")}</Text>
              <Pressable
                style={({ hovered, pressed }) => [
                  styles.contactOption,
                  hovered && styles.contactOptionHovered,
                  pressed && styles.contactOptionPressed,
                ]}
                onPress={() => {
                  setContactOpen(false);
                  void openExternalLink("mailto:hello@tavoriapp.com", t("external_link.email"));
                }}
              >
                <View style={styles.contactOptionIcon}><Feather name="mail" size={19} color="#0E1A24" /></View>
                <View style={styles.contactOptionText}>
                  <Text style={styles.contactOptionTitle}>{t("team_contact.email")}</Text>
                  <Text style={styles.contactOptionDetail}>{t("team_contact.email_detail")}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#6B7280" />
              </Pressable>
              <Pressable
                style={({ hovered, pressed }) => [
                  styles.contactOption,
                  hovered && styles.contactOptionHovered,
                  pressed && styles.contactOptionPressed,
                ]}
                onPress={() => {
                  setContactOpen(false);
                  void openExternalLink("https://www.instagram.com/tavoriapp/", t("team_contact.instagram"));
                }}
              >
                <View style={styles.contactOptionIcon}><Feather name="instagram" size={19} color="#0E1A24" /></View>
                <View style={styles.contactOptionText}>
                  <Text style={styles.contactOptionTitle}>{t("team_contact.instagram")}</Text>
                  <Text style={styles.contactOptionDetail}>{t("team_contact.instagram_detail")}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#6B7280" />
              </Pressable>
              <Pressable
                onPress={() => setContactOpen(false)}
                style={({ hovered, pressed }) => [
                  styles.cancelContactBtn,
                  hovered && styles.cancelContactBtnHovered,
                  pressed && styles.cancelContactBtnPressed,
                ]}
              >
                <Text style={styles.cancelContactText}>{t("team_contact.cancel")}</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

function DrawerSection({ children }: { children: React.ReactNode }) {
  return <View style={styles.drawerSection}><View style={styles.drawerSectionCard}>{children}</View></View>;
}

function DrawerAction({
  icon,
  label,
  detail,
  danger,
  selected,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  detail?: string;
  danger?: boolean;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ hovered, pressed }) => [
        styles.drawerAction,
        selected && styles.drawerActionSelected,
        hovered && styles.drawerActionHovered,
        pressed && styles.drawerActionPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.drawerActionIcon, danger && styles.drawerActionIconDanger, selected && styles.drawerActionIconSelected]}>
        <Feather name={icon} size={17} color={danger ? "#B91C1C" : selected ? "#F0531C" : "#0E1A24"} />
      </View>
      <View style={styles.drawerActionText}>
        <Text style={[styles.drawerActionLabel, danger && styles.drawerActionLabelDanger, selected && styles.drawerActionLabelSelected]}>{label}</Text>
        {detail ? <Text style={styles.drawerActionDetail}>{detail}</Text> : null}
      </View>
      <Feather name="chevron-right" size={18} color={selected ? "#F0531C" : "#A0A5AB"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  drawerRoot: { flex: 1, flexDirection: "row", zIndex: 10, elevation: 10 },
  drawer: { backgroundColor: "#F7F4EE", maxWidth: 380, width: "86%" },
  drawerBackdrop: { backgroundColor: "rgba(14,26,36,0.46)", flex: 1 },
  drawerContent: { paddingBottom: 28, paddingHorizontal: 16 },
  drawerProfile: { alignItems: "center", paddingBottom: 18, paddingHorizontal: 4, paddingTop: 10 },
  drawerAvatarWrap: { marginBottom: 10 },
  avatar: { alignItems: "center", backgroundColor: "#F1EEE8", borderRadius: 999, height: 64, justifyContent: "center", overflow: "hidden", width: 64 },
  avatarImage: { height: "100%", width: "100%" },
  avatarInitial: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 27 },
  drawerProfileText: { alignItems: "center", width: "100%" },
  drawerName: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 24, lineHeight: 27, textAlign: "center" },
  drawerUsername: { color: "#F0531C", fontFamily: "DMMono_500Medium", fontSize: 12, marginTop: 3, textAlign: "center" },
  drawerMeta: { color: "#6B7280", fontSize: 12, marginTop: 7, textAlign: "center", textTransform: "uppercase" },
  drawerSection: { marginTop: 12 },
  drawerSectionCard: { backgroundColor: "white", borderColor: "rgba(14,26,36,0.08)", borderRadius: 17, borderWidth: 1, overflow: "hidden" },
  drawerAction: { alignItems: "center", borderBottomColor: "rgba(14,26,36,0.07)", borderBottomWidth: 1, flexDirection: "row", gap: 11, minHeight: 58, paddingHorizontal: 12, paddingVertical: 9 },
  drawerActionHovered: { backgroundColor: "#F1EFE8" },
  drawerActionPressed: { opacity: 0.72 },
  drawerActionSelected: { backgroundColor: "#FFF1E8" },
  drawerActionIcon: { alignItems: "center", backgroundColor: "#F1EEE8", borderRadius: 10, height: 34, justifyContent: "center", width: 34 },
  drawerActionIconSelected: { backgroundColor: "#FFF8F2" },
  drawerActionIconDanger: { backgroundColor: "#FDECEC" },
  drawerActionText: { flex: 1 },
  drawerActionLabel: { color: "#0E1A24", fontSize: 14, fontWeight: "700" },
  drawerActionLabelSelected: { color: "#F0531C" },
  drawerActionLabelDanger: { color: "#B91C1C" },
  drawerActionDetail: { color: "#8A8F98", fontSize: 11, marginTop: 2 },
  overlayRoot: { flex: 1, justifyContent: "flex-end", zIndex: 100, elevation: 100 },
  languageBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(14,26,36,0.46)" },
  languageSheet: { backgroundColor: "white", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: { alignSelf: "center", backgroundColor: "#D7D9DC", borderRadius: 999, height: 4, marginBottom: 16, width: 36 },
  languageTitle: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 24, marginBottom: 14 },
  languageRow: { alignItems: "center", backgroundColor: "#F7F4EE", borderRadius: 16, flexDirection: "row", gap: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 13 },
  languageRowHovered: { backgroundColor: "#F1EFE8" },
  languageRowPressed: { opacity: 0.72 },
  languageRowActive: { backgroundColor: "#FFF1E8", borderColor: "#F0531C", borderWidth: 1 },
  languageFlag: { fontSize: 22, textAlign: "center", width: 26 },
  languageLabel: { color: "#0E1A24", flex: 1, fontSize: 16, fontWeight: "700" },
  languageCheck: { alignItems: "center", justifyContent: "center", width: 20 },
  contactBackdrop: { backgroundColor: "rgba(14,26,36,0.46)", flex: 1, justifyContent: "flex-end" },
  contactSheet: { backgroundColor: "white", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 12 },
  contactTitle: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 24, marginBottom: 5 },
  contactSub: { color: "#6B7280", fontSize: 13, lineHeight: 19, marginBottom: 14 },
  contactOption: { alignItems: "center", backgroundColor: "#F7F4EE", borderRadius: 16, flexDirection: "row", gap: 12, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 13 },
  contactOptionHovered: { backgroundColor: "#F1EFE8" },
  contactOptionPressed: { opacity: 0.72 },
  contactOptionIcon: { alignItems: "center", backgroundColor: "#FFF1E8", borderRadius: 11, height: 38, justifyContent: "center", width: 38 },
  contactOptionText: { flex: 1 },
  contactOptionTitle: { color: "#0E1A24", fontSize: 15, fontWeight: "700" },
  contactOptionDetail: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  cancelContactBtn: { alignItems: "center", marginTop: 8, paddingVertical: 10 },
  cancelContactBtnHovered: { backgroundColor: "rgba(14,26,36,0.07)", borderRadius: 10 },
  cancelContactBtnPressed: { opacity: 0.72 },
  cancelContactText: { color: "#6B7280", fontSize: 14, fontWeight: "700" },
});
