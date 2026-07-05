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
//             declined            → (no push, by design)
//
// Copy is selected from the row's `language` column (it/en/fr/es); falls
// back to Italian.
//
// Required Supabase Edge Function secrets:
//   SUPABASE_URL              (project URL, e.g. https://xyz.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY (service-role key — keep secret)
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

// ---- Localized copy ----------------------------------------------------------

type Lang = "en" | "it" | "fr" | "es" | "zh";

const COPY = {
  en: {
    new_application_title: "New application",
    new_application_body: (workerName: string) =>
      `${workerName || "A candidate"} applied to one of your shifts.`,
    interview_title: "Interview request",
    interview_body: (venueName: string) =>
      `${venueName || "A venue"} wants to interview you.`,
    hired_title: "You've been hired!",
    hired_body: (venueName: string) =>
      `${venueName || "A venue"} hired you. Open Tavoria for the details.`,
    starred_title: "You've been starred",
    starred_body: (venueName: string) =>
      `${venueName || "A venue"} added you to their favourites.`,
  },
  it: {
    new_application_title: "Nuova candidatura",
    new_application_body: (workerName: string) =>
      `${workerName || "Un candidato"} si è candidato a uno dei tuoi turni.`,
    interview_title: "Richiesta di colloquio",
    interview_body: (venueName: string) =>
      `${venueName || "Un locale"} vuole farti un colloquio.`,
    hired_title: "Sei stato assunto!",
    hired_body: (venueName: string) =>
      `${venueName || "Un locale"} ti ha assunto. Apri Tavoria per i dettagli.`,
    starred_title: "Sei nei preferiti",
    starred_body: (venueName: string) =>
      `${venueName || "Un locale"} ti ha messo nei preferiti.`,
  },
  fr: {
    new_application_title: "Nouvelle candidature",
    new_application_body: (workerName: string) =>
      `${workerName || "Un candidat"} s'est candidaté à l'un de tes shifts.`,
    interview_title: "Demande d'entretien",
    interview_body: (venueName: string) =>
      `${venueName || "Un lieu"} veut te rencontrer.`,
    hired_title: "Tu es embauché·e !",
    hired_body: (venueName: string) =>
      `${venueName || "Un lieu"} t'a embauché·e. Ouvre Tavoria pour les détails.`,
    starred_title: "Tu es en favori",
    starred_body: (venueName: string) =>
      `${venueName || "Un lieu"} t'a ajouté·e à ses favoris.`,
  },
  es: {
    new_application_title: "Nueva candidatura",
    new_application_body: (workerName: string) =>
      `${workerName || "Un candidato"} se postuló a uno de tus turnos.`,
    interview_title: "Solicitud de entrevista",
    interview_body: (venueName: string) =>
      `${venueName || "Un local"} quiere entrevistarte.`,
    hired_title: "¡Te han contratado!",
    hired_body: (venueName: string) =>
      `${venueName || "Un local"} te ha contratado. Abre Tavoria para los detalles.`,
    starred_title: "Estás en favoritos",
    starred_body: (venueName: string) =>
      `${venueName || "Un local"} te ha añadido a sus favoritos.`,
  },
  zh: {
    new_application_title: "新申请",
    new_application_body: (workerName: string) =>
      `${workerName || "有候选人"}申请了你发布的一个班次。`,
    interview_title: "面试邀请",
    interview_body: (venueName: string) =>
      `${venueName || "有门店"}想和你面试。`,
    hired_title: "你被录用了!",
    hired_body: (venueName: string) =>
      `${venueName || "有门店"}录用了你。打开 Tavoria 查看详情。`,
    starred_title: "你被收藏了",
    starred_body: (venueName: string) =>
      `${venueName || "有门店"}把你加入了收藏。`,
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

// ---- Edge entrypoint --------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const payload = await req.json();
  // Supabase Webhook payload shape:
  //   { type: "INSERT" | "UPDATE" | "DELETE", table, schema, record, old_record }
  const eventType = payload?.type as string | undefined;
  const record = payload?.record;
  const oldRecord = payload?.old_record;

  if (!record) {
    return new Response("no record", { status: 200 });
  }

  // ---- INSERT (worker applied → notify the venue) ---------------------------
  if (eventType === "INSERT") {
    const venueId = record.venue_id as string | null;
    if (!venueId) return new Response("no venue_id", { status: 200 });

    const { data: venue } = await supabase
      .from("venues")
      .select("push_token, language, name")
      .eq("id", venueId)
      .maybeSingle();
    if (!venue?.push_token) {
      return new Response("venue has no push token", { status: 200 });
    }

    const workerId = record.worker_id as string | null;
    let workerName = "";
    if (workerId) {
      const { data: worker } = await supabase
        .from("workers")
        .select("first_name")
        .eq("id", workerId)
        .maybeSingle();
      workerName = worker?.first_name ?? "";
    }

    const copy = COPY[pickLang(venue.language)];
    const title = copy.new_application_title;
    const body = copy.new_application_body(workerName);

    const result = await sendExpoPush(venue.push_token, title, body, {
      applicationId: record.id,
      venueId,
      kind: "new_application",
    });
    return Response.json(result);
  }

  // ---- UPDATE (status changed → notify the worker) -------------------------
  if (eventType === "UPDATE") {
    const newStatus = record.status as string | undefined;
    const oldStatus = oldRecord?.status as string | undefined;
    if (!newStatus || newStatus === oldStatus) {
      return new Response("status unchanged", { status: 200 });
    }
    if (newStatus === "pending" || newStatus === "declined") {
      // We deliberately don't ping the worker on a decline.
      return new Response("status not push-worthy", { status: 200 });
    }

    const workerId = record.worker_id as string | null;
    if (!workerId) return new Response("no worker_id", { status: 200 });

    const { data: worker } = await supabase
      .from("workers")
      .select("push_token, language")
      .eq("id", workerId)
      .maybeSingle();
    if (!worker?.push_token) {
      return new Response("worker has no push token", { status: 200 });
    }

    let venueName = "";
    const venueId = record.venue_id as string | null;
    if (venueId) {
      const { data: venue } = await supabase
        .from("venues")
        .select("name")
        .eq("id", venueId)
        .maybeSingle();
      venueName = venue?.name ?? "";
    }

    const copy = COPY[pickLang(worker.language)];
    let title = "";
    let body = "";
    if (newStatus === "interview_requested") {
      title = copy.interview_title;
      body = copy.interview_body(venueName);
    } else if (newStatus === "hired") {
      title = copy.hired_title;
      body = copy.hired_body(venueName);
    } else if (newStatus === "starred") {
      title = copy.starred_title;
      body = copy.starred_body(venueName);
    } else {
      return new Response("status not push-worthy", { status: 200 });
    }

    const result = await sendExpoPush(worker.push_token, title, body, {
      applicationId: record.id,
      venueId,
      kind: "status_change",
      status: newStatus,
    });
    return Response.json(result);
  }

  return new Response("ignored", { status: 200 });
});
