// Supabase Edge Function: notify-on-application
//
// Called by a Supabase Database Webhook on every INSERT or UPDATE of the
// `public.applications` table.
//
// INSERT  → push to the venue ("Nuova candidatura — Maria si è candidata…")
// UPDATE  → push to the worker if status changed
//             interview_requested → "Richiesta di colloquio…"
//             hired               → "Sei stato assunto!"
//             starred             → "Sei nei preferiti…"
//             declined            → email only (no disruptive push)
//
// Copy is selected from the row's `language` column (it/en/fr/es); falls
// back to Italian.
//
// Required Supabase Edge Function secrets:
//   SUPABASE_URL              (project URL, e.g. https://xyz.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY (service-role key — keep secret)
//   RESEND_API_KEY            (transactional email delivery)
//   RESEND_FROM_EMAIL         (for example: Tavoria <hello@tavoriapp.com>)
//
// Deploy with:
//   supabase functions deploy notify-on-application
//
// Hook up via Supabase Dashboard → Database → Webhooks:
//   Table:    public.applications
//   Events:   INSERT, UPDATE
//   Type:     Supabase Edge Functions
//   Function: notify-on-application
//   Method:   POST

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function text(body: string, status = 200) {
  return new Response(body, { status, headers: corsHeaders });
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

// ---- Localized copy ----------------------------------------------------------

type Lang = "en" | "it" | "fr" | "es" | "zh";

const COPY = {
  en: {
    new_application_title: "New application",
    new_application_body: (workerName: string) =>
      `${workerName || "A candidate"} applied to one of your shifts.`,
    new_application_detail: "Review the application in Tavoria. Contact details stay private until you request an interview or hire the candidate.",
    interview_title: "Interview request",
    interview_body: (venueName: string) =>
      `${venueName || "A venue"} wants to interview you.`,
    interview_detail: "Open My applications and contact the venue by phone or WhatsApp to arrange the interview time.",
    interview_venue_title: "Interview request sent",
    interview_venue_body: (workerName: string) => `Your interview request for ${workerName || "the candidate"} is confirmed.`,
    contacts_visible: "You can now see each other's shared contact details in Tavoria.",
    hired_title: "You've been hired!",
    hired_body: (venueName: string) =>
      `${venueName || "A venue"} hired you. Open Tavoria for the details.`,
    hired_detail: "Contact the venue to confirm pay, schedule and contract details. Tavoria facilitates the connection but does not create an employment agreement.",
    starred_title: "You've been starred",
    starred_body: (venueName: string) =>
      `${venueName || "A venue"} added you to their favourites.`,
    starred_detail: "This means the venue saved your profile. It is not yet an interview request or a job offer.",
    declined_title: "Application update",
    declined_body: (venueName: string) =>
      `${venueName || "A venue"} will not continue with this application.`,
    declined_detail: "This affects only this application. You can continue applying to other shifts on Tavoria.",
    email_cta: "Open Tavoria",
  },
  it: {
    new_application_title: "Nuova candidatura",
    new_application_body: (workerName: string) =>
      `${workerName || "Un candidato"} si è candidato a uno dei tuoi turni.`,
    new_application_detail: "Valuta la candidatura su Tavoria. I contatti restano privati finché non richiedi un colloquio o assumi il candidato.",
    interview_title: "Richiesta di colloquio",
    interview_body: (venueName: string) =>
      `${venueName || "Un locale"} vuole farti un colloquio.`,
    interview_detail: "Apri Le mie candidature e contatta il locale via telefono o WhatsApp per concordare l'orario del colloquio.",
    interview_venue_title: "Richiesta di colloquio inviata",
    interview_venue_body: (workerName: string) => `La richiesta di colloquio per ${workerName || "il candidato"} è confermata.`,
    contacts_visible: "Ora potete vedere i contatti condivisi dell'altra parte su Tavoria.",
    hired_title: "Sei stato assunto!",
    hired_body: (venueName: string) =>
      `${venueName || "Un locale"} ti ha assunto. Apri Tavoria per i dettagli.`,
    hired_detail: "Contatta il locale per confermare paga, orari e contratto. Tavoria facilita il contatto ma non crea un rapporto di lavoro.",
    starred_title: "Sei nei preferiti",
    starred_body: (venueName: string) =>
      `${venueName || "Un locale"} ti ha messo nei preferiti.`,
    starred_detail: "Il locale ha salvato il tuo profilo. Non è ancora una richiesta di colloquio o un'offerta di lavoro.",
    declined_title: "Aggiornamento candidatura",
    declined_body: (venueName: string) =>
      `${venueName || "Un locale"} non proseguirà con questa candidatura.`,
    declined_detail: "Questo riguarda solo questa candidatura. Puoi continuare a candidarti ad altri turni su Tavoria.",
    email_cta: "Apri Tavoria",
  },
  fr: {
    new_application_title: "Nouvelle candidature",
    new_application_body: (workerName: string) =>
      `${workerName || "Un candidat"} s'est candidaté à l'un de tes shifts.`,
    new_application_detail: "Consulte la candidature dans Tavoria. Les coordonnées restent privées jusqu'à une demande d'entretien ou une embauche.",
    interview_title: "Demande d'entretien",
    interview_body: (venueName: string) =>
      `${venueName || "Un lieu"} veut te rencontrer.`,
    interview_detail: "Ouvre Mes candidatures et contacte le lieu par téléphone ou WhatsApp pour fixer l'heure de l'entretien.",
    interview_venue_title: "Demande d'entretien envoyée",
    interview_venue_body: (workerName: string) => `La demande d'entretien pour ${workerName || "le candidat"} est confirmée.`,
    contacts_visible: "Vous pouvez maintenant voir les coordonnées partagées de l'autre partie dans Tavoria.",
    hired_title: "Tu es embauché·e !",
    hired_body: (venueName: string) =>
      `${venueName || "Un lieu"} t'a embauché·e. Ouvre Tavoria pour les détails.`,
    hired_detail: "Contacte le lieu pour confirmer salaire, horaires et contrat. Tavoria facilite la mise en relation sans créer de contrat de travail.",
    starred_title: "Tu es en favori",
    starred_body: (venueName: string) =>
      `${venueName || "Un lieu"} t'a ajouté·e à ses favoris.`,
    starred_detail: "Le lieu a enregistré ton profil. Ce n'est pas encore une demande d'entretien ni une offre d'emploi.",
    declined_title: "Mise à jour de candidature",
    declined_body: (venueName: string) =>
      `${venueName || "Un lieu"} ne poursuivra pas cette candidature.`,
    declined_detail: "Cela concerne uniquement cette candidature. Tu peux continuer à postuler à d'autres shifts sur Tavoria.",
    email_cta: "Ouvrir Tavoria",
  },
  es: {
    new_application_title: "Nueva candidatura",
    new_application_body: (workerName: string) =>
      `${workerName || "Un candidato"} se postuló a uno de tus turnos.`,
    new_application_detail: "Revisa la candidatura en Tavoria. Los datos de contacto siguen privados hasta solicitar una entrevista o contratar.",
    interview_title: "Solicitud de entrevista",
    interview_body: (venueName: string) =>
      `${venueName || "Un local"} quiere entrevistarte.`,
    interview_detail: "Abre Mis candidaturas y contacta al local por teléfono o WhatsApp para acordar la hora de la entrevista.",
    interview_venue_title: "Solicitud de entrevista enviada",
    interview_venue_body: (workerName: string) => `La entrevista con ${workerName || "el candidato"} está confirmada.`,
    contacts_visible: "Ahora podéis ver los datos de contacto compartidos de la otra parte en Tavoria.",
    hired_title: "¡Te han contratado!",
    hired_body: (venueName: string) =>
      `${venueName || "Un local"} te ha contratado. Abre Tavoria para los detalles.`,
    hired_detail: "Contacta al local para confirmar pago, horario y contrato. Tavoria facilita el contacto pero no crea una relación laboral.",
    starred_title: "Estás en favoritos",
    starred_body: (venueName: string) =>
      `${venueName || "Un local"} te ha añadido a sus favoritos.`,
    starred_detail: "El local guardó tu perfil. Aún no es una solicitud de entrevista ni una oferta de trabajo.",
    declined_title: "Actualización de candidatura",
    declined_body: (venueName: string) =>
      `${venueName || "Un local"} no continuará con esta candidatura.`,
    declined_detail: "Esto afecta solo a esta candidatura. Puedes seguir solicitando otros turnos en Tavoria.",
    email_cta: "Abrir Tavoria",
  },
  zh: {
    new_application_title: "新申请",
    new_application_body: (workerName: string) =>
      `${workerName || "有候选人"}申请了你发布的一个班次。`,
    new_application_detail: "请在 Tavoria 中查看申请。在请求面试或录用前，联系方式将保持私密。",
    interview_title: "面试邀请",
    interview_body: (venueName: string) =>
      `${venueName || "有门店"}想和你面试。`,
    interview_detail: "打开“我的申请”，通过电话或 WhatsApp 联系门店以确定面试时间。",
    interview_venue_title: "面试邀请已发送",
    interview_venue_body: (workerName: string) => `与${workerName || "候选人"}的面试邀请已确认。`,
    contacts_visible: "双方现在可以在 Tavoria 中查看对方已共享的联系方式。",
    hired_title: "你被录用了!",
    hired_body: (venueName: string) =>
      `${venueName || "有门店"}录用了你。打开 Tavoria 查看详情。`,
    hired_detail: "请联系门店确认薪酬、时间和合同。Tavoria 仅促成联系，不建立雇佣关系。",
    starred_title: "你被收藏了",
    starred_body: (venueName: string) =>
      `${venueName || "有门店"}把你加入了收藏。`,
    starred_detail: "门店已保存你的资料。这还不是面试邀请或录用通知。",
    declined_title: "申请状态更新",
    declined_body: (venueName: string) =>
      `${venueName || "有门店"}不会继续此申请。`,
    declined_detail: "这只影响此申请。你仍可以在 Tavoria 申请其他班次。",
    email_cta: "打开 Tavoria",
  },
} satisfies Record<Lang, unknown>;

function pickLang(raw: unknown): Lang {
  if (raw === "en" || raw === "it" || raw === "fr" || raw === "es" || raw === "zh") return raw;
  return "it"; // launch market default
}

// ---- Expo Push --------------------------------------------------------------

async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
) {
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      title,
      body,
      sound: "default",
      priority: "high",
      channelId: "default",
      data,
    }),
  });
  return res.ok ? await res.json() : { error: `expo push HTTP ${res.status}` };
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

async function sendEmail(options: {
  to: string;
  title: string;
  body: string;
  detail: string;
  cta: string;
  url?: string;
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from) return { skipped: "email service is not configured" };

  const appUrl = options.url ?? "https://app.tavoriapp.com/worker-applications";
  const safeTitle = escapeHtml(options.title);
  const safeBody = escapeHtml(options.body);
  const safeDetail = escapeHtml(options.detail);
  const safeCta = escapeHtml(options.cta);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: `Tavoria · ${options.title}`,
      text: `${options.title}\n\n${options.body}\n\n${options.detail}\n\n${appUrl}`,
      html: `
        <div style="margin:0;background:#f7f4ee;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0e1a24">
          <table role="presentation" style="width:100%;max-width:560px;margin:0 auto;border-collapse:collapse">
            <tr><td style="padding:8px 0 24px;font-size:28px;font-weight:700">Tavoria<span style="color:#f0531c">.</span></td></tr>
            <tr><td style="background:#fff;border:1px solid #e6e1d8;border-radius:16px;padding:34px 30px">
              <p style="margin:0 0 8px;color:#f0531c;font-size:12px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase">Application update</p>
              <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2">${safeTitle}</h1>
              <p style="margin:0 0 16px;color:#46505a;font-size:16px;line-height:1.6">${safeBody}</p>
              <div style="margin:0 0 24px;background:#f1efe8;border-radius:12px;padding:16px;color:#46505a;font-size:14px;line-height:1.6">${safeDetail}</div>
              <a href="${appUrl}" style="display:inline-block;background:#f0531c;border-radius:999px;padding:14px 24px;color:#fff;font-size:15px;font-weight:700;text-decoration:none">${safeCta} &rarr;</a>
              <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #eee9e1;color:#6b7280;font-size:12px;line-height:1.6">This is a transactional message about your Tavoria account.</p>
            </td></tr>
            <tr><td style="padding:22px 8px 8px;color:#8b9198;font-size:12px;text-align:center">The Tavoria team · Milan, Italy</td></tr>
          </table>
        </div>`,
    }),
  });

  if (!response.ok) {
    return { error: `Resend email HTTP ${response.status}`, details: await response.text() };
  }
  return await response.json();
}

// ---- Edge entrypoint --------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return text("ok");
  if (req.method !== "POST") {
    return text("Method Not Allowed", 405);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  let payload = await req.json();

  // The app invokes this path after a venue changes an application status.
  // Do not trust client-supplied recipient data: resolve the application on the
  // server and verify the signed-in user owns its venue before notifying.
  if (payload?.kind === "application_status_changed" || payload?.kind === "application_created") {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return text("missing authorization", 401);
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return text("invalid authorization", 401);

    const applicationId = String(payload.applicationId ?? "");
    if (!applicationId) return text("missing applicationId", 400);
    const { data: application } = await supabase
      .from("applications")
      .select("id, status, worker_id, worker_user_id, venue_id, interview_scheduled_at, interview_location")
      .eq("id", applicationId)
      .maybeSingle();
    if (!application?.venue_id) return text("application not found", 404);

    if (payload.kind === "application_created") {
      if (application.worker_user_id !== auth.user.id) return text("forbidden", 403);
      payload = { type: "INSERT", record: application };
    } else {
      const { data: owningVenue } = await supabase
        .from("venues")
        .select("user_id")
        .eq("id", application.venue_id)
        .maybeSingle();
      if (!owningVenue || owningVenue.user_id !== auth.user.id) return text("forbidden", 403);
      payload = {
        type: "UPDATE",
        record: application,
        old_record: { status: payload.oldStatus ?? null },
      };
    }
  }
  // Supabase Webhook payload shape:
  //   { type: "INSERT" | "UPDATE" | "DELETE", table, schema, record, old_record }
  const eventType = payload?.type as string | undefined;
  const record = payload?.record;
  const oldRecord = payload?.old_record;

  if (!record) {
    return text("no record");
  }

  // ---- INSERT (worker applied → notify the venue) ---------------------------
  if (eventType === "INSERT") {
    const venueId = record.venue_id as string | null;
    if (!venueId) return text("no venue_id");

    const { data: venue } = await supabase
      .from("venues")
      .select("push_token, language, name, email")
      .eq("id", venueId)
      .maybeSingle();
    if (!venue) return text("venue not found");

    const worker = await getWorkerForApplication(supabase, record);
    const workerName = worker?.first_name ?? "";

    const copy = COPY[pickLang(venue.language)];
    const title = copy.new_application_title;
    const body = copy.new_application_body(workerName);
    const [push, email] = await Promise.all([
      venue.push_token
        ? sendExpoPush(venue.push_token, title, body, {
            applicationId: record.id,
            venueId,
            kind: "new_application",
          })
        : Promise.resolve({ skipped: "venue has no push token" }),
      venue.email
        ? sendEmail({
            to: venue.email,
            title,
            body,
            detail: copy.new_application_detail,
            cta: copy.email_cta,
            url: "https://app.tavoriapp.com/venue-inbox",
          })
        : Promise.resolve({ skipped: "venue has no email" }),
    ]);
    return json({ push, email });
  }

  // ---- UPDATE (status changed → notify the worker) -------------------------
  if (eventType === "UPDATE") {
    const newStatus = record.status as string | undefined;
    const oldStatus = oldRecord?.status as string | undefined;
    if (!newStatus || newStatus === oldStatus) {
      return text("status unchanged");
    }
    if (newStatus === "pending") return text("status not notification-worthy");

    const worker = await getWorkerForApplication(supabase, record);
    if (!worker) return text("worker not found");

    let venueName = "";
    let venue: { name?: string; email?: string; language?: string } | null = null;
    const venueId = record.venue_id as string | null;
    if (venueId) {
      const { data: venueRow } = await supabase
        .from("venues")
        .select("name, email, language")
        .eq("id", venueId)
        .maybeSingle();
      venue = venueRow;
      venueName = venueRow?.name ?? "";
    }

    const copy = COPY[pickLang(worker.language)];
    let title = "";
    let body = "";
    let detail = "";
    if (newStatus === "interview_requested") {
      title = copy.interview_title;
      body = copy.interview_body(venueName);
      const scheduledAt = record.interview_scheduled_at as string | null;
      const location = record.interview_location as string | null;
      const locale = pickLang(worker.language) === "zh" ? "zh-CN" : pickLang(worker.language);
      const schedule = scheduledAt
        ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" }).format(new Date(scheduledAt))
        : "";
      detail = [schedule, location, copy.contacts_visible, copy.interview_detail].filter(Boolean).join(" · ");
    } else if (newStatus === "hired") {
      title = copy.hired_title;
      body = copy.hired_body(venueName);
      detail = copy.hired_detail;
    } else if (newStatus === "starred") {
      title = copy.starred_title;
      body = copy.starred_body(venueName);
      detail = copy.starred_detail;
    } else if (newStatus === "declined") {
      title = copy.declined_title;
      body = copy.declined_body(venueName);
      detail = copy.declined_detail;
    } else {
      return text("status not notification-worthy");
    }

    const venueCopy = COPY[pickLang(venue?.language)];
    const scheduledAt = record.interview_scheduled_at as string | null;
    const location = record.interview_location as string | null;
    const venueLocale = pickLang(venue?.language) === "zh" ? "zh-CN" : pickLang(venue?.language);
    const venueSchedule = scheduledAt
      ? new Intl.DateTimeFormat(venueLocale, { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" }).format(new Date(scheduledAt))
      : "";

    const [push, email, venueEmail] = await Promise.all([
      worker.push_token && newStatus !== "declined"
        ? sendExpoPush(worker.push_token, title, body, {
            applicationId: record.id,
            venueId,
            kind: "status_change",
            status: newStatus,
          })
        : Promise.resolve({
            skipped: newStatus === "declined"
              ? "declines are delivered in-app and by email"
              : "worker has no push token",
          }),
      worker.email
        ? sendEmail({
            to: worker.email,
            title,
            body,
            detail,
            cta: copy.email_cta,
          })
        : Promise.resolve({ skipped: "worker has no email" }),
      newStatus === "interview_requested" && venue?.email
        ? sendEmail({
            to: venue.email,
            title: venueCopy.interview_venue_title,
            body: venueCopy.interview_venue_body(worker.first_name ?? ""),
            detail: [venueSchedule, location, venueCopy.contacts_visible].filter(Boolean).join(" · "),
            cta: venueCopy.email_cta,
            url: "https://app.tavoriapp.com/venue-inbox",
          })
        : Promise.resolve({ skipped: "venue confirmation email not required or unavailable" }),
    ]);
    return json({ push, email, venueEmail });
  }

  return text("ignored");
});

async function getWorkerForApplication(supabase: ReturnType<typeof createClient>, record: Record<string, unknown>) {
  const workerId = record.worker_id as string | null;
  if (workerId) {
    const { data: worker } = await supabase
      .from("workers")
      .select("push_token, language, email, first_name")
      .eq("id", workerId)
      .maybeSingle();
    if (worker) return worker;
  }

  const workerUserId = record.worker_user_id as string | null;
  if (!workerUserId) return null;
  const { data: worker } = await supabase
    .from("workers")
    .select("push_token, language, email, first_name")
    .eq("user_id", workerUserId)
    .maybeSingle();
  return worker;
}
