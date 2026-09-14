// Supabase Edge Function: send-product-update-email
// Sends a Tavoria product-update email using the same visual language as the
// existing transactional emails. Keep this endpoint operator-only: it is not
// a public app action and requires PRODUCT_UPDATE_EMAIL_SECRET.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-product-update-secret",
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

async function sameSecret(left: string, right: string) {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(left)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  if (leftBytes.length !== rightBytes.length) return false;
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

type UpdatePayload = {
  to: string | string[];
  subject: string;
  eyebrow?: string;
  title: string;
  body: string;
  detail?: string;
  cta?: string;
  url?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const configuredSecret = Deno.env.get("PRODUCT_UPDATE_EMAIL_SECRET");
  const requestSecret = req.headers.get("x-product-update-secret") ?? "";
  if (!configuredSecret || !(await sameSecret(requestSecret, configuredSecret))) {
    return json({ error: "Unauthorized" }, 401);
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from) return json({ error: "Email service is not configured" }, 500);

  try {
    const payload = await req.json() as Partial<UpdatePayload>;
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const to = recipients
      .map((email) => String(email ?? "").trim().toLowerCase())
      .filter(Boolean);
    const subject = String(payload.subject ?? "").trim();
    const eyebrow = String(payload.eyebrow ?? "Product update").trim();
    const title = String(payload.title ?? "").trim();
    const body = String(payload.body ?? "").trim();
    const detail = String(payload.detail ?? "").trim();
    const cta = String(payload.cta ?? "Open Tavoria").trim();
    const url = String(payload.url ?? "https://app.tavoriapp.com/").trim();

    if (!to.length || to.length > 50 || !subject || !title || !body) {
      return json({ error: "to, subject, title and body are required; maximum 50 recipients" }, 400);
    }

    const safeEyebrow = escapeHtml(eyebrow);
    const safeSubject = escapeHtml(subject);
    const safeTitle = escapeHtml(title);
    const safeBody = escapeHtml(body);
    const safeDetail = escapeHtml(detail);
    const safeCta = escapeHtml(cta);
    const safeUrl = escapeHtml(url);
    const text = [title, "", body, detail, "", `${cta}: ${url}`, "", "Il team Tavoria"].filter(Boolean).join("\n\n");
    const html = `
      <div style="margin:0;background:#f7f4ee;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0e1a24">
        <table role="presentation" style="width:100%;max-width:560px;margin:0 auto;border-collapse:collapse">
          <tr><td style="padding:8px 0 24px;font-size:28px;font-weight:700">Tavoria<span style="color:#f0531c">.</span></td></tr>
          <tr><td style="background:#fff;border:1px solid #e6e1d8;border-radius:16px;padding:34px 30px">
            <p style="margin:0 0 8px;color:#f0531c;font-size:12px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase">${safeEyebrow}</p>
            <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2">${safeTitle}</h1>
            <p style="margin:0 0 16px;color:#46505a;font-size:16px;line-height:1.6">${safeBody}</p>
            ${safeDetail ? `<div style="margin:0 0 24px;background:#f1efe8;border-radius:12px;padding:16px;color:#46505a;font-size:14px;line-height:1.6">${safeDetail}</div>` : ""}
            <a href="${safeUrl}" style="display:inline-block;background:#f0531c;border-radius:999px;padding:14px 24px;color:#fff;font-size:15px;font-weight:700;text-decoration:none">${safeCta} &rarr;</a>
            <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #eee9e1;color:#6b7280;font-size:12px;line-height:1.6">Ricevi questa email perché usi Tavoria. Per assistenza, scrivi a hello@tavoriapp.com.</p>
          </td></tr>
          <tr><td style="padding:22px 8px 8px;color:#8b9198;font-size:12px;text-align:center">Il team Tavoria · Milano, Italia</td></tr>
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
        to,
        subject: `Tavoria · ${subject}`,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Resend rejected product update", response.status, details);
      return json({ error: "Email provider rejected the message" }, 502);
    }

    return json({ sent: true, recipients: to.length, subject: safeSubject });
  } catch (error) {
    console.error("send-product-update-email failed", error);
    return json({ error: "Could not send email" }, 500);
  }
});
