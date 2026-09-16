import ProfileMediaSection from "./ProfileMediaSection";
import type { MediaItem } from "./mediaTypes";

export default function VenueMediaGallery({ photoUrls = [], videoUrls = [] }: { photoUrls?: (string | null)[]; videoUrls?: (string | null)[] }) {
  const media: MediaItem[] = [
    ...photoUrls.filter((url): url is string => Boolean(url)).map((url) => ({ url, kind: "photo" as const })),
    ...videoUrls.filter((url): url is string => Boolean(url)).map((url) => ({ url, kind: "video" as const })),
  ];
  if (!media.length) return null;
  return <ProfileMediaSection media={media} />;
}
