// Supabase Edge Function: send-welcome-email
// Sends the generated username to a newly registered venue.
// Required secrets:
//   RESEND_API_KEY
//   RESEND_FROM_EMAIL (for example: Tavoria <hello@tavoriapp.com>)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char] ?? char);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from) return json({ error: "Email service is not configured" }, 500);

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim();
    const username = String(body.username ?? "").trim();
    const displayName = String(body.displayName ?? "Tavoria venue").trim();

    if (!email || !username) return json({ error: "email and username are required" }, 400);

    const safeName = escapeHtml(displayName);
    const safeUsername = escapeHtml(username);
    const signInUrl = "https://app.tavoriapp.com/signin";
    const text = [
      `Welcome to Tavoria, ${displayName}.`,
      "",
      "Your venue account is ready.",
      `Username: ${username}`,
      "",
      "Use this username together with the 4-digit PIN you chose during registration to sign in:",
      signInUrl,
      "",
      "Keep your username and PIN private.",
      "",
      "The Tavoria team",
    ].join("\n");
    const html = `
      <div style="margin:0;background:#f7f4ee;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0e1a24">
        <table role="presentation" style="width:100%;max-width:560px;margin:0 auto;border-collapse:collapse">
          <tr><td style="padding:8px 0 24px;font-size:28px;font-weight:700;letter-spacing:-.5px">Tavoria<span style="color:#f0531c">.</span></td></tr>
          <tr><td style="background:#ffffff;border:1px solid #e6e1d8;border-radius:16px;padding:36px 32px">
            <p style="margin:0 0 8px;color:#f0531c;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Venue account</p>
            <h1 style="margin:0 0 16px;font-size:30px;line-height:1.15;font-weight:700">Welcome to Tavoria</h1>
            <p style="margin:0 0 24px;color:#46505a;font-size:16px;line-height:1.6">Hi ${safeName}, your venue account is ready. Here is the username you will use to sign in.</p>
            <div style="margin:0 0 24px;background:#f7f4ee;border:1px solid #e6e1d8;border-radius:12px;padding:20px;text-align:center">
              <p style="margin:0 0 8px;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Your username</p>
              <p style="margin:0;color:#0e1a24;font-family:Consolas,Monaco,monospace;font-size:24px;font-weight:700;letter-spacing:.5px">${safeUsername}</p>
            </div>
            <p style="margin:0 0 24px;color:#46505a;font-size:14px;line-height:1.6">Use this username together with the 4-digit PIN you chose during registration.</p>
            <a href="${signInUrl}" style="display:inline-block;background:#f0531c;border-radius:999px;padding:14px 24px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">Sign in to Tavoria &rarr;</a>
            <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #eee9e1;color:#6b7280;font-size:12px;line-height:1.6">For your security, never share your username or PIN. If you did not create this account, contact us at hello@tavoriapp.com.</p>
          </td></tr>
          <tr><td style="padding:24px 8px 8px;color:#8b9198;font-size:12px;line-height:1.5;text-align:center">The Tavoria team &middot; Milan, Italy</td></tr>
        </table>
      </div>`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Your Tavoria venue account is ready",
        text: `Welcome to Tavoria, ${displayName}. Your username is: ${username}\n\nKeep it safe — you will use it with your 4-digit PIN to sign in.`,
        html: `<p>Welcome to Tavoria, ${safeName}.</p><p>Your username is:</p><p><strong>${safeUsername}</strong></p><p>Keep it safe — you will use it with your 4-digit PIN to sign in.</p>`,
        ...{ text, html },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Resend rejected email", response.status, details);
      return json({ error: "Email provider rejected the message" }, 502);
    }

    return json({ sent: true });
  } catch (error) {
    console.error("send-welcome-email failed", error);
    return json({ error: "Could not send email" }, 500);
  }
});
