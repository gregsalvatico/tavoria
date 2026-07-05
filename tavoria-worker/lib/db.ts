// Database helpers — thin wrappers around Supabase queries.
// All venue/worker writes go through here so screens stay clean.

import { supabase } from "./supabase";

// Make sure we have an auth session (anonymous for venues today,
// real email-OTP for workers via signup.tsx).
export async function ensureSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

// ---- VENUES ----

export type VenueInsert = {
  name: string;
  type?: string;
  address?: string;
  city?: string;
  email: string;
  phone?: string;
  terms_accepted_at?: string;
  terms_version?: string;
};

export async function insertVenue(input: VenueInsert) {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) throw new Error("No auth session");

  const { data, error } = await supabase
    .from("venues")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function updateVenue(
  id: string,
  patch: {
    photo_variant?: number;
    roles?: string[];
    pay_schedule?: string;
    venue_style?: string;
    preferred_interview_answers?: unknown[];
    preferred_interview_completed_at?: string;
  }
) {
  const { error } = await supabase.from("venues").update(patch).eq("id", id);
  if (error) throw error;
}

// ---- SHIFTS ----

export type ShiftInsert = {
  venue_id: string;
  roles: string[];
  contract_type?: string;
  days?: string[];
  hours_start?: string;
  hours_end?: string;
  start_when?: string;
  start_date?: string;
  pay_unit?: string;
  pay_amount?: number;
};

export async function insertShift(input: ShiftInsert) {
  await ensureSession();
  const { data, error } = await supabase
    .from("shifts")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as { id: string };
}

// Update a shift's status: 'live' (visible to workers) or 'paused' (hidden).
export async function updateShiftStatus(
  shiftId: string,
  status: "live" | "paused"
) {
  const { error } = await supabase
    .from("shifts")
    .update({ status })
    .eq("id", shiftId);
  if (error) throw error;
}

// ---- WORKERS ----

export type WorkerInsert = {
  phone?: string;
  phone_visible?: boolean;
  email?: string;
  first_name?: string;
  last_name?: string;
  age_range?: string;
  city?: string;
  country?: string;
  nationality?: string;
  work_eligibility_it?: string;
  years_exp?: string;
  positions?: string[];
  languages?: string[];
  personality?: string[];
  strengths?: string[];
  interview_answers?: unknown[];
  interview_completed_at?: string;
  // Allow photo/video URL updates via the same helper
  photo_url?: string;
  video_url?: string;
  // T&C acceptance audit trail
  terms_accepted_at?: string;
  terms_version?: string;
};

// Patch the workers row for the current auth.uid with any subset of columns.
// Use this for bonus-profile updates (personality, interview_answers, etc.)
// after the worker has already been created via upsertWorker.
export async function updateCurrentWorker(patch: WorkerInsert) {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) throw new Error("No auth session");

  const { error } = await supabase
    .from("workers")
    .update(patch)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function upsertWorker(input: WorkerInsert) {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) throw new Error("No auth session");

  // Upsert on user_id so re-running onboarding overwrites
  const { data, error } = await supabase
    .from("workers")
    .upsert({ ...input, user_id: userId }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data as { id: string };
}

// Persist T&C acceptance immediately after signup, before the rest of
// onboarding. We upsert on user_id so we have an audit row even if the
// user abandons the rest of the flow.
export async function recordWorkerTermsAcceptance(version: string) {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) return;
  await supabase
    .from("workers")
    .upsert(
      {
        user_id: userId,
        terms_accepted_at: new Date().toISOString(),
        terms_version: version,
      },
      { onConflict: "user_id" }
    );
}

export async function recordVenueTermsAcceptance(
  venueId: string,
  version: string
) {
  if (!venueId) return;
  await supabase
    .from("venues")
    .update({
      terms_accepted_at: new Date().toISOString(),
      terms_version: version,
    })
    .eq("id", venueId);
}

// ---- APPLICATIONS ----

export type ApplicationStatus =
  | "pending"
  | "declined"
  | "interview_requested"
  | "hired"
  | "starred";

export type ApplicationInsert = {
  worker_id?: string;
  shift_id?: string;
  venue_id?: string;
  message?: string;
};

// Worker (signed in via anon session) creates an application
export async function createApplication(input: ApplicationInsert) {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) throw new Error("No auth session");

  const { data, error } = await supabase
    .from("applications")
    .insert({ ...input, worker_user_id: userId, status: "pending" })
    .select()
    .single();
  if (error) throw error;
  return data as { id: string };
}

// Update an application's status (typically by venue: decline / interview / hire / star)
// We .select() back the updated row so we can verify the UPDATE actually
// affected something. With RLS, an UPDATE that doesn't match any policy
// returns success + 0 rows — silent failure. By calling .single() we turn
// 0 rows into a thrown error that the UI can surface to the user.
export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
) {
  await ensureSession();
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Update failed — no row affected (permission?)");
  return data;
}

// Browse feed for venues — all workers, ordered by recent.
// Tightening pass later: filter by city radius, by positions overlap, etc.
export async function getDiscoverWorkers() {
  await ensureSession();
  const { data, error } = await supabase
    .from("workers")
    .select(
      `
      id, first_name, last_name, photo_url, video_url,
      positions, languages, city, country, nationality, work_eligibility_it,
      age_range, years_exp,
      personality, strengths, interview_answers, created_at
      `
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

// Get the current user's venue (by auth.uid). Returns null if no venue exists.
// Use this when the in-memory venueProfile cache might be empty (e.g. after a
// fresh sign-in or app restart).
export async function getCurrentVenueRow() {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Public venue board — venue info + all live shifts for that venue.
// Used by the QR-scan landing page (/venue-board?venueId=...).
export async function getVenueBoard(venueId: string) {
  await ensureSession();
  const [venueRes, shiftsRes] = await Promise.all([
    supabase
      .from("venues")
      .select(
        `id, name, type, city, address, venue_style, photo_url, pay_schedule`
      )
      .eq("id", venueId)
      .maybeSingle(),
    supabase
      .from("shifts")
      .select(
        `
        id, roles, contract_type, hours_start, hours_end,
        pay_amount, pay_unit, days, start_when, start_date, created_at, status
        `
      )
      .eq("venue_id", venueId)
      .or("status.eq.live,status.is.null")
      .order("created_at", { ascending: false }),
  ]);
  if (venueRes.error) throw venueRes.error;
  if (shiftsRes.error) throw shiftsRes.error;
  return {
    venue: venueRes.data,
    shifts: shiftsRes.data ?? [],
  };
}

// All shifts posted by venues owned by the current user.
// Pass `localVenueId` to also include the venue that was just created in this
// session (covers the case where the venue's user_id no longer matches the
// signed-in user — e.g. after migrating from anonymous to username+PIN auth).
export async function getCurrentVenueShifts(localVenueId?: string) {
  const session = await ensureSession();
  const userId = session?.user.id;

  // Collect venue IDs from two sources:
  //   1. The venues table joined on the current user_id
  //   2. The locally-cached venue (just created in this session)
  const venueIds = new Set<string>();
  if (localVenueId) venueIds.add(localVenueId);

  if (userId) {
    const { data: venues, error: vErr } = await supabase
      .from("venues")
      .select("id")
      .eq("user_id", userId);
    if (!vErr && venues) {
      for (const v of venues) venueIds.add(v.id);
    }
  }

  if (venueIds.size === 0) return [];

  const { data, error } = await supabase
    .from("shifts")
    .select(
      `
      id, roles, contract_type, hours_start, hours_end,
      pay_amount, pay_unit, days, start_when, start_date, created_at, status,
      venue:venues(id, name, type, city, venue_style, photo_url)
      `
    )
    .in("venue_id", Array.from(venueIds))
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Fetch a single worker by id (for direct profile navigation)
export async function getWorkerById(id: string) {
  const { data, error } = await supabase
    .from("workers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Browse feed for workers — only LIVE shifts joined to their venue.
// Paused shifts are hidden from /discover.
export async function getDiscoverShifts() {
  await ensureSession();
  const { data, error } = await supabase
    .from("shifts")
    .select(
      `
      id, roles, contract_type, hours_start, hours_end,
      pay_amount, pay_unit, days, start_when, start_date, created_at, status,
      venue:venues(id, name, type, city, venue_style, photo_url, photo_variant)
      `
    )
    .or("status.eq.live,status.is.null")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

// Whether the current authenticated user has any venues / workers
// Used by the home screen to show "Continue as ..." shortcuts.
export async function getCurrentUserContext(): Promise<{
  hasVenue: boolean;
  venueName?: string;
  venueId?: string;
  hasWorker: boolean;
  workerName?: string;
  workerId?: string;
}> {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) {
    return { hasVenue: false, hasWorker: false };
  }
  const [venues, workers] = await Promise.all([
    supabase
      .from("venues")
      .select("id, name")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workers")
      .select("id, first_name")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    hasVenue: !!venues.data,
    venueName: venues.data?.name,
    venueId: venues.data?.id,
    hasWorker: !!workers.data,
    workerName: workers.data?.first_name,
    workerId: workers.data?.id,
  };
}

// All applications for venues the current user owns
// Returns each application with the joined worker basics
export async function getApplicationsForCurrentVenueOwner() {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) return [];

  // Fetch venues this user owns first
  const { data: venues, error: vErr } = await supabase
    .from("venues")
    .select("id, name")
    .eq("user_id", userId);
  if (vErr) throw vErr;
  if (!venues || venues.length === 0) return [];

  const venueIds = venues.map((v) => v.id);
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      id, status, created_at, message,
      worker_id, venue_id, shift_id,
      worker:workers(
        id, first_name, last_name, photo_url, video_url,
        positions, languages, city, age_range, years_exp,
        personality, strengths, interview_answers
      ),
      shift:shifts(id, roles, hours_start, hours_end, pay_amount, pay_unit)
      `
    )
    .in("venue_id", venueIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Worker side: most recent positive status change on any of their applications.
// "Positive" = hired | interview_requested | starred. Returns the single most
// recent one + the venue name, so the home screen can show a hero card like
// "🎉 You've been hired by Bar Centrale!".
export async function getLatestWorkerStatusUpdate() {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("applications")
    .select(
      `id, status, updated_at, venue:venues(id, name)`
    )
    .eq("worker_user_id", userId)
    .in("status", ["hired", "interview_requested", "starred"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as
    | {
        id: string;
        status: "hired" | "interview_requested" | "starred";
        updated_at: string;
        venue: { id: string; name: string } | null;
      }
    | null;
}

// Worker side: count of applications by status. Drives the status strip
// on the home screen. `new*` counts apps updated since `sinceISO` (the
// last time the worker visited /worker-applications).
export type WorkerStatusCounts = {
  hired: number;
  interview: number;
  starred: number;
  total: number;
  newHired: number;
  newInterview: number;
  newStarred: number;
  newTotal: number;
};

export async function getWorkerStatusCounts(
  sinceISO?: string | null
): Promise<WorkerStatusCounts> {
  const session = await ensureSession();
  const userId = session?.user.id;
  const empty: WorkerStatusCounts = {
    hired: 0,
    interview: 0,
    starred: 0,
    total: 0,
    newHired: 0,
    newInterview: 0,
    newStarred: 0,
    newTotal: 0,
  };
  if (!userId) return empty;

  const { data, error } = await supabase
    .from("applications")
    .select("status, updated_at")
    .eq("worker_user_id", userId)
    .in("status", ["hired", "interview_requested", "starred"]);
  if (error || !data) return empty;

  const sinceTime = sinceISO ? Date.parse(sinceISO) : 0;
  const counts = { ...empty };
  for (const row of data as { status: string; updated_at: string }[]) {
    const isNew = sinceTime > 0 && Date.parse(row.updated_at) > sinceTime;
    if (row.status === "hired") {
      counts.hired += 1;
      if (isNew) counts.newHired += 1;
    } else if (row.status === "interview_requested") {
      counts.interview += 1;
      if (isNew) counts.newInterview += 1;
    } else if (row.status === "starred") {
      counts.starred += 1;
      if (isNew) counts.newStarred += 1;
    }
  }
  counts.total = counts.hired + counts.interview + counts.starred;
  counts.newTotal = counts.newHired + counts.newInterview + counts.newStarred;
  return counts;
}

// Legacy alias kept so older callers don't break — returns total only.
export async function getWorkerActionedCount(): Promise<number> {
  const c = await getWorkerStatusCounts();
  return c.total;
}

// Count pending applications across all venues owned by the current user.
// Used by the home screen badge on the "Messaggi" button.
export async function getPendingApplicationsCount(): Promise<number> {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) return 0;

  // Find venue ids owned by this user
  const { data: venues, error: vErr } = await supabase
    .from("venues")
    .select("id")
    .eq("user_id", userId);
  if (vErr || !venues || venues.length === 0) return 0;
  const venueIds = venues.map((v) => v.id);

  // Count pending applications across those venues
  const { count, error } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .in("venue_id", venueIds)
    .eq("status", "pending");
  if (error) return 0;
  return count ?? 0;
}

// Fetch a single application by id (for venue → candidate detail navigation)
export async function getApplicationById(id: string) {
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      worker:workers(
        id, first_name, last_name, photo_url, video_url,
        positions, languages, city, country, age_range, years_exp,
        personality, strengths, interview_answers, email
      ),
      venue:venues(id, name, type, city, preferred_interview_answers)
      `
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Just the shift_ids that the current worker has already applied to
// (for "hide already applied" filter on discover)
export async function getAppliedShiftIdsForCurrentWorker(): Promise<string[]> {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("applications")
    .select("shift_id")
    .eq("worker_user_id", userId);
  if (error) throw error;
  return (data ?? [])
    .map((r) => r.shift_id as string | null)
    .filter((id): id is string => !!id);
}

// Read the current worker's own profile (city, positions) for filters
export async function getCurrentWorkerSummary(): Promise<{
  id?: string;
  city?: string;
  positions?: string[];
} | null> {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("workers")
    .select("id, city, positions")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Full worker row for the current signed-in user.
// Used by /profile (owner mode) to render the real data instead of demo Greg.
export async function getCurrentWorkerFull() {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("workers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// All applications submitted by the current worker user.
// Each row joins the venue + shift so we can show "you applied to Bar X for Barista on Friday".
export async function getApplicationsForCurrentWorker() {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      id, status, created_at, updated_at,
      venue_id, shift_id,
      venue:venues(
        id, name, type, city, photo_url, venue_style, phone
      ),
      shift:shifts(
        id, roles, hours_start, hours_end, pay_amount, pay_unit,
        start_when, start_date
      )
      `
    )
    .eq("worker_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Get the most recent application for the current user (for demo: show worker's own card)
export async function getLatestApplicationForCurrentUser() {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("worker_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---- STORAGE / MEDIA ----

// Upload a venue logo/storefront photo to Supabase Storage and patch
// the matching venues row with the public URL.
export async function uploadVenuePhoto(
  venueId: string,
  uri: string,
  mimeType?: string
): Promise<string> {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) throw new Error("No auth session");

  let ext = "jpg";
  let contentType = mimeType ?? "image/jpeg";
  if (uri.toLowerCase().endsWith(".png")) {
    ext = "png";
    contentType = mimeType ?? "image/png";
  } else if (uri.toLowerCase().endsWith(".heic")) {
    ext = "heic";
    contentType = mimeType ?? "image/heic";
  }

  const path = `${userId}/venue-${Date.now()}.${ext}`;

  const res = await fetch(uri);
  const arrayBuffer = await res.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from("venue-photos")
    .upload(path, arrayBuffer, { contentType, upsert: true });
  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from("venue-photos").getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  const { error: updErr } = await supabase
    .from("venues")
    .update({ photo_url: publicUrl })
    .eq("id", venueId);
  if (updErr) throw updErr;

  return publicUrl;
}

// Upload a local file URI (file:///...) to Supabase Storage and patch
// the matching workers row column with the public URL.
//
// kind: "photo" → bucket "worker-photos" → workers.photo_url
// kind: "video" → bucket "worker-videos" → workers.video_url
export async function uploadWorkerMedia(
  kind: "photo" | "video",
  uri: string,
  mimeType?: string
): Promise<string> {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) throw new Error("No auth session");

  const bucket = kind === "photo" ? "worker-photos" : "worker-videos";

  // Infer extension/content-type
  let ext = "jpg";
  let contentType = mimeType ?? "image/jpeg";
  if (kind === "video") {
    ext = uri.toLowerCase().endsWith(".mov") ? "mov" : "mp4";
    contentType = mimeType ?? (ext === "mov" ? "video/quicktime" : "video/mp4");
  } else {
    if (uri.toLowerCase().endsWith(".png")) {
      ext = "png";
      contentType = mimeType ?? "image/png";
    } else if (uri.toLowerCase().endsWith(".heic")) {
      ext = "heic";
      contentType = mimeType ?? "image/heic";
    }
  }

  const path = `${userId}/${kind}-${Date.now()}.${ext}`;

  // RN-safe: fetch the local file and read as ArrayBuffer
  const res = await fetch(uri);
  const arrayBuffer = await res.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    });
  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  // Upsert workers row — handles the fresh-signup case where the worker row
  // doesn't exist yet (record.tsx runs photo+video upload BEFORE upsertWorker
  // is called in worker-positions.tsx). With user_id as the conflict key,
  // this either inserts a stub row or updates the existing one with the URL.
  const col = kind === "photo" ? "photo_url" : "video_url";
  const { error: upsertErr } = await supabase
    .from("workers")
    .upsert(
      { user_id: userId, [col]: publicUrl },
      { onConflict: "user_id" }
    );
  if (upsertErr) throw upsertErr;

  return publicUrl;
}
