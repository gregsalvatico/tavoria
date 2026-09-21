import { Feather } from "@expo/vector-icons";
import { Image, ImageSourcePropType, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { t } from "../lib/i18n";
import { mapsUrl, websiteLabel, websiteUrl } from "../lib/contact";
import { openExternalLink } from "../lib/externalLinks";
import AvatarActionModal from "./AvatarActionModal";
import Chip from "./Chip";
import ProfileMediaSection from "./ProfileMediaSection";
import type { MediaItem } from "./mediaTypes";

const VENUE_TYPE_PHOTOS: Record<string, number> = {
  cafe: require("../assets/venue-cafe.png"),
  bar: require("../assets/venue-bar.png"),
  restaurant: require("../assets/venue-restaurant.png"),
  hotel: require("../assets/venue-hotel.png"),
  club: require("../assets/venue-club.png"),
  beach_club: require("../assets/venue-beach.png"),
};

export type VenueProfileHeaderData = {
  name?: string;
  type?: string;
  city?: string;
  address?: string;
  website_url?: string;
  venue_style?: string;
  photo_url?: string;
  photo_urls?: (string | null)[];
  video_urls?: (string | null)[];
};

export default function VenueProfileHeader({ venue, onEdit, onAvatarReplace }: { venue: VenueProfileHeaderData; onEdit?: () => void; onAvatarReplace?: () => void }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [avatarActionsOpen, setAvatarActionsOpen] = useState(false);
  const venuePhotos = (venue.photo_urls ?? []).filter((url): url is string => Boolean(url));
  // Keep the profile image separate from the additional media grid. Older
  // rows may still repeat it in photo_urls, so dedupe that legacy value below.
  const primaryPhoto = venue.photo_url ?? venue.photo_urls?.find(Boolean);
  const hasPrimaryPhoto = Boolean(primaryPhoto);
  const image = primaryPhoto
    ? { uri: primaryPhoto }
    : VENUE_TYPE_PHOTOS[(venue.type || "cafe").toLowerCase()] ?? VENUE_TYPE_PHOTOS.cafe;
  const website = websiteUrl(venue.website_url);
  const websiteText = websiteLabel(venue.website_url);
  const profilePhotos = Array.from(new Set(venuePhotos.filter((url) => url !== primaryPhoto)));
  const profileMedia: MediaItem[] = [
    ...profilePhotos.map((url) => ({ url, kind: "photo" as const })),
    ...(venue.video_urls ?? []).filter((url): url is string => Boolean(url)).map((url) => ({ url, kind: "video" as const })),
  ];
  const styleLabel = venue.venue_style
    ? t(`venue_style.${venue.venue_style.toLowerCase()}`)
    : "";
  const typeKey = (venue.type || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace("café", "cafe");
  const typeTranslation = typeKey ? t(`venue_type.${typeKey}`) : "";
  const typeLabel = typeTranslation && !typeTranslation.includes(".")
    ? typeTranslation
    : venue.type || t("talent.worker");
  const meta = [venue.city, styleLabel && !styleLabel.includes(".") ? styleLabel : null].filter(Boolean).join(" · ");

  return (
    <View style={styles.wrap}>
      <View style={styles.identity}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("talent.photos")}
          onPress={() => setAvatarActionsOpen(true)}
          style={styles.avatarButton}
        >
          {hasPrimaryPhoto ? (
            <Image source={image} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Image source={image} style={styles.avatarPlaceholderImage} resizeMode="cover" />
              <View style={styles.avatarPlaceholderScrim} />
              <View style={styles.avatarPlaceholderLabel}>
                <Feather name="camera" size={13} color="#FFFFFF" />
                <Text style={styles.avatarPlaceholderText}>{t("profile.add_photo")}</Text>
              </View>
            </View>
          )}
        </Pressable>
        <View style={styles.identityBody}>
          <Text style={styles.eyebrow}>{typeLabel}</Text>
          <Text style={styles.name} numberOfLines={2}>{venue.name || t("talent.worker")}</Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
        {onEdit ? (
          <Pressable
            accessibilityLabel={t("talent.edit")}
            onPress={onEdit}
            style={styles.edit}
          >
            <Feather name="edit-2" size={15} color="#0E1A24" />
          </Pressable>
        ) : null}
      </View>

      {(venue.address || website) ? (
        <View style={styles.infoChips}>
          {venue.address ? (
            <Chip
              label={venue.address}
              icon="map-pin"
              trailingIcon="arrow-up-right"
              size="compact"
              accessibilityRole="link"
              onPress={() => void openExternalLink(mapsUrl(venue.address!), t("external_link.maps"))}
            />
          ) : null}
          {website ? (
            <Chip
              label={websiteText}
              icon="globe"
              trailingIcon="arrow-up-right"
              size="compact"
              accessibilityRole="link"
              onPress={() => void openExternalLink(website, t("external_link.website"))}
            />
          ) : null}
        </View>
      ) : null}

      <ProfileMediaSection media={profileMedia} />

      <AvatarActionModal
        visible={avatarActionsOpen}
        canReplace={Boolean(onAvatarReplace)}
        onClose={() => setAvatarActionsOpen(false)}
        onPreview={() => {
          setAvatarActionsOpen(false);
          setPreviewOpen(true);
        }}
        onReplace={onAvatarReplace ? () => {
          setAvatarActionsOpen(false);
          onAvatarReplace();
        } : undefined}
      />

      <Modal visible={previewOpen} transparent onRequestClose={() => setPreviewOpen(false)}>
        <View style={styles.previewModal}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("talent.close")}
            onPress={() => setPreviewOpen(false)}
            style={styles.previewClose}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
          <Image source={image as ImageSourcePropType} resizeMode="contain" style={styles.previewImage} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  identity: { alignItems: "center", flexDirection: "row", gap: 14 },
  avatarButton: { borderRadius: 14, overflow: "hidden" },
  avatar: { backgroundColor: "#E6E4DC", borderRadius: 14, height: 88, width: 88 },
  avatarPlaceholder: { backgroundColor: "#0E1A24", borderRadius: 14, height: 88, overflow: "hidden", position: "relative", width: 88 },
  avatarPlaceholderImage: { height: "100%", opacity: 0.48, width: "100%" },
  avatarPlaceholderScrim: { backgroundColor: "rgba(14,26,36,0.34)", ...StyleSheet.absoluteFillObject },
  avatarPlaceholderLabel: { alignItems: "center", bottom: 9, flexDirection: "row", gap: 5, left: 6, position: "absolute", right: 6 },
  avatarPlaceholderText: { color: "#FFFFFF", flex: 1, fontSize: 10, fontWeight: "700", textAlign: "center" },
  identityBody: { flex: 1, gap: 4, minWidth: 0 },
  eyebrow: { color: "#626B78", fontFamily: "DMMono_500Medium", fontSize: 10, letterSpacing: 0.9, textTransform: "uppercase" },
  name: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 30, lineHeight: 34 },
  meta: { color: "#626B78", fontSize: 13 },
  edit: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "rgba(14,26,36,0.16)", borderRadius: 22, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  infoChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  previewModal: { alignItems: "center", backgroundColor: "rgba(14,26,36,.96)", flex: 1, justifyContent: "center", padding: 24 },
  previewClose: { padding: 12, position: "absolute", right: 24, top: 24, zIndex: 2 },
  previewImage: { height: "82%", maxWidth: 960, width: "100%" },
});
