// Deep-link entry point for tavoria://venue/{venueId} (custom scheme).
// The web fallback page at tavoriapp.com/v/{id} attempts this URL first to
// jump into the app if installed.
import { Redirect, useLocalSearchParams } from "expo-router";

export default function VenueCustomSchemeAlias() {
  const { venueId } = useLocalSearchParams<{ venueId?: string }>();
  if (!venueId) return <Redirect href="/" />;
  return <Redirect href={{ pathname: "/venue-board", params: { venueId } }} />;
}
