import { supabase } from "./supabase";

/** Sends a non-critical transactional email through the Supabase Edge Function. */
export async function sendVenueWelcomeEmail(params: {
  email: string;
  username: string;
  venueName: string;
}) {
  const { error } = await supabase.functions.invoke("send-welcome-email", {
    body: {
      kind: "venue",
      email: params.email,
      username: params.username,
      displayName: params.venueName,
    },
  });

  if (error) throw error;
}
