import { supabase } from "./supabase";

/** Sends a non-critical transactional email through the Supabase Edge Function. */
export async function sendWelcomeEmail(params: {
  kind: "worker" | "venue";
  email: string;
  username: string;
  displayName: string;
}) {
  const { error } = await supabase.functions.invoke("send-welcome-email", {
    body: {
      kind: params.kind,
      email: params.email,
      username: params.username,
      displayName: params.displayName,
    },
  });

  if (error) throw error;
}

export function sendVenueWelcomeEmail(params: {
  email: string;
  username: string;
  venueName: string;
}) {
  return sendWelcomeEmail({
    kind: "venue",
    email: params.email,
    username: params.username,
    displayName: params.venueName,
  });
}
