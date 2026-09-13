import { Feather } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { t } from "../lib/i18n";
import { mapsUrl, websiteLabel, websiteUrl } from "../lib/contact";
import { openExternalLink } from "../lib/externalLinks";
import MediaGrid from "./MediaGrid";

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

export default function VenueProfileHeader({ venue, onEdit }: { venue: VenueProfileHeaderData; onEdit?: () => void }) {
  const venuePhotos = (venue.photo_urls ?? []).filter((url): url is string => Boolean(url));
  // Keep the profile image separate from the additional media grid. Older
  // rows may still repeat it in photo_urls, so dedupe that legacy value below.
  const primaryPhoto = venue.photo_url;
  const image = primaryPhoto
    ? { uri: primaryPhoto }
    : VENUE_TYPE_PHOTOS[(venue.type || "cafe").toLowerCase()] ?? VENUE_TYPE_PHOTOS.cafe;
  const website = websiteUrl(venue.website_url);
  const websiteText = websiteLabel(venue.website_url);
  const profilePhotos = Array.from(new Set(venuePhotos.filter((url) => url !== primaryPhoto)));
  const styleLabel = venue.venue_style
    ? t(`venue_style.${venue.venue_style.toLowerCase()}`)
    : "";
  const meta = [venue.city, styleLabel && !styleLabel.includes(".") ? styleLabel : null].filter(Boolean).join(" · ");

  return (
    <View style={styles.wrap}>
      <View style={styles.identity}>
        <Image source={image} style={styles.avatar} resizeMode="cover" />
        <View style={styles.identityBody}>
          <Text style={styles.eyebrow}>{venue.type || "Venue"}</Text>
          <Text style={styles.name} numberOfLines={2}>{venue.name || "Venue"}</Text>
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
        <View style={styles.infoList}>
          {venue.address ? (
            <Pressable
              accessibilityRole="link"
              style={styles.infoRow}
              onPress={() => void openExternalLink(mapsUrl(venue.address!), t("external_link.maps"))}
            >
              <Feather name="map-pin" size={16} color="#F0531C" />
              <View style={styles.infoBody}>
                <View style={styles.infoLabelRow}>
                  <Text style={styles.infoLabel}>{t("venue_card.directions")}</Text>
                  <Feather name="arrow-up-right" size={14} color="#626B78" />
                </View>
                <Text style={styles.infoText} numberOfLines={1}>{venue.address}</Text>
              </View>
            </Pressable>
          ) : null}
          {website ? (
            <Pressable
              accessibilityRole="link"
              style={[styles.infoRow, venue.address && styles.infoDivider]}
              onPress={() => void openExternalLink(website, t("external_link.website"))}
            >
              <Feather name="globe" size={16} color="#F0531C" />
              <View style={styles.infoBody}>
                <View style={styles.infoLabelRow}>
                  <Text style={styles.infoLabel}>{t("venue_card.website")}</Text>
                  <Feather name="arrow-up-right" size={14} color="#626B78" />
                </View>
                <Text style={styles.infoText} numberOfLines={1}>{websiteText}</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {profilePhotos.length || (venue.video_urls ?? []).some(Boolean) ? (
        <View style={styles.mediaSection}>
          <MediaGrid photos={profilePhotos} videos={venue.video_urls} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  identity: { alignItems: "center", flexDirection: "row", gap: 14, paddingBottom: 18 },
  avatar: { backgroundColor: "#E6E4DC", borderRadius: 14, height: 112, width: 112 },
  identityBody: { flex: 1, gap: 4, minWidth: 0 },
  eyebrow: { color: "#626B78", fontFamily: "DMMono_500Medium", fontSize: 10, letterSpacing: 0.9, textTransform: "uppercase" },
  name: { color: "#0E1A24", fontFamily: "InstrumentSerif_400Regular", fontSize: 30, lineHeight: 34 },
  meta: { color: "#626B78", fontSize: 13 },
  edit: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "rgba(14,26,36,0.16)", borderRadius: 22, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  mediaSection: { marginBottom: 16, maxWidth: 900, width: "100%" },
  infoList: { borderBottomColor: "rgba(14,26,36,0.12)", borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(14,26,36,0.12)", borderTopWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
  infoRow: { alignItems: "center", flexDirection: "row", gap: 11, minHeight: 58, paddingHorizontal: 0 },
  infoDivider: { borderTopColor: "rgba(14,26,36,0.08)", borderTopWidth: 1 },
  infoBody: { flex: 1, minWidth: 0 },
  infoLabelRow: { alignItems: "center", flexDirection: "row", gap: 5 },
  infoLabel: { color: "#7A818B", fontFamily: "DMMono_500Medium", fontSize: 9, letterSpacing: 0.7, textTransform: "uppercase" },
  infoText: { color: "#0E1A24", fontSize: 13, fontWeight: "600", marginTop: 3 },
});
