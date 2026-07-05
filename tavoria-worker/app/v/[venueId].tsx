// Deep-link entry point for https://tavoriapp.com/v/{venueId}
// (Universal Links on iOS, App Links on Android). When the user opens a
// tavoriapp.com/v/... URL on a device with the app installed, the OS routes
// it here and we forward to the existing venue-board screen.
import { Redirect, useLocalSearchParams } from "expo-router";

export default function VenueDeepLinkAlias() {
  const { venueId } = useLocalSearchParams<{ venueId?: string }>();
  if (!venueId) return <Redirect href="/" />;
  return <Redirect href={{ pathname: "/venue-board", params: { venueId } }} />;
}
