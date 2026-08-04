import { supabase } from "./supabase";

// Local-only reviewer account for checking protected candidate content without
// creating a real application. This is deliberately disabled in production.
const QA_REVIEWER_EMAIL = "tavoria-qa-venue-8m2k@gigi.local";

export async function hasLocalQaReviewAccess(): Promise<boolean> {
  if (typeof __DEV__ !== "undefined" && !__DEV__) return false;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.email?.toLowerCase() === QA_REVIEWER_EMAIL;
}
