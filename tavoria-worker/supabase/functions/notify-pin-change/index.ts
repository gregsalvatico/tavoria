import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char] ?? char);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth.user) return json({ error: "Unauthorized" }, 401);

  const [workerResult, venueResult] = await Promise.all([
    supabase.from("workers").select("first_name,last_name,email").eq("user_id", auth.user.id).maybeSingle(),
    supabase.from("venues").select("name,email").eq("user_id", auth.user.id).maybeSingle(),
  ]);
  const profile = workerResult.data ?? venueResult.data;
  const email = String(profile?.email ?? "").trim();
  if (!email || email.endsWith("@gigi.local")) return json({ sent: false, reason: "no_contact_email" });

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from) return json({ sent: false, reason: "email_not_configured" });

  const displayName = String(workerResult.data?.first_name ?? venueResult.data?.name ?? "there");
  const safeName = escapeHtml(displayName);
  const appUrl = "https://app.tavoriapp.com/change-pin";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Tavoria - your PIN was changed",
      text: `Hi ${displayName},\n\nYour Tavoria PIN was changed. If this was not you, contact hello@tavoriapp.com immediately.\n\n${appUrl}`,
      html: `<div style="margin:0;background:#f7f4ee;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0e1a24"><table role="presentation" style="width:100%;max-width:560px;margin:0 auto"><tr><td style="padding:8px 0 24px;font-size:28px;font-weight:700">Tavoria<span style="color:#f0531c">.</span></td></tr><tr><td style="background:#fff;border:1px solid #e6e1d8;border-radius:16px;padding:34px 30px"><p style="margin:0 0 8px;color:#f0531c;font-size:12px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase">Account security</p><h1 style="margin:0 0 14px;font-size:28px">Your PIN was changed</h1><p style="margin:0 0 16px;color:#46505a;font-size:16px;line-height:1.6">Hi ${safeName}, your Tavoria PIN was changed.</p><div style="margin:0 0 24px;background:#f1efe8;border-radius:12px;padding:16px;color:#46505a;font-size:14px;line-height:1.6">If this was not you, contact <a href="mailto:hello@tavoriapp.com" style="color:#0e1a24">hello@tavoriapp.com</a> immediately.</div><a href="${appUrl}" style="display:inline-block;background:#f0531c;border-radius:999px;padding:14px 24px;color:#fff;font-size:15px;font-weight:700;text-decoration:none">Open Tavoria &rarr;</a></td></tr></table></div>`,
    }),
  });
  if (!response.ok) return json({ sent: false, reason: "delivery_failed" }, 502);
  return json({ sent: true });
});
