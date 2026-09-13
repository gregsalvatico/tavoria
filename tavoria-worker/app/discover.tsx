// Kept as a compatibility route for old bookmarks and shared links.
// The signed-in worker home and public entry point now live at "/".

import { Redirect } from "expo-router";

export default function DiscoverRedirect() {
  return <Redirect href="/" />;
}
