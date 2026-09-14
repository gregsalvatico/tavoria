export type JobPreferences = {
  openToWork?: boolean;
  days?: string[];
  from?: string;
  to?: string;
  availableFrom?: string;
  minimumMonthlyPay?: number;
  roleExperience?: Record<string, number>;
};

export type WorkerRequirements = { minimumExperience?: number; languages?: string[] };
export type MatchWorker = {
  id: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  country?: string;
  age_range?: string;
  nationality?: string;
  positions?: string[];
  languages?: string[];
  years_exp?: string;
  photo_url?: string;
  video_url?: string;
  photo_urls?: (string | null)[];
  video_urls?: (string | null)[];
  job_preferences?: JobPreferences;
  created_at?: string;
  last_seen_at?: string;
};
export type MatchRequest = {
  id?: string;
  roles?: string[];
  city?: string;
  days?: string[];
  hours_start?: string;
  hours_end?: string;
  start_date?: string;
  start_when?: string;
  pay_unit?: string;
  pay_amount?: number;
  worker_requirements?: WorkerRequirements;
};
export type MatchReason = "role" | "city" | "schedule" | "experience" | "languages" | "availability_unknown" | "schedule_conflict" | "pay_conflict" | "start_conflict";
export type WorkerMatch = { worker: MatchWorker; score: number; group: "strong" | "good" | "review"; reasons: MatchReason[] };
export const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

type LegacyJobPreferences = JobPreferences & { travelRadiusKm?: number; minimumHourlyPay?: number };
const MONTHLY_PAY_MULTIPLIERS: Record<string, number> = { hour: 173.33, day: 21.67, week: 4.33, month: 1 };

export function normalizeJobPreferences(value: JobPreferences | LegacyJobPreferences = {}): JobPreferences {
  const { travelRadiusKm: _radius, minimumHourlyPay, ...cleaned } = value as LegacyJobPreferences;
  if (cleaned.minimumMonthlyPay === undefined && Number.isFinite(minimumHourlyPay)) {
    cleaned.minimumMonthlyPay = Math.round((minimumHourlyPay as number) * MONTHLY_PAY_MULTIPLIERS.hour);
  }
  return cleaned;
}

export function monthlyPayForRequest(request: MatchRequest): number | null {
  if (!request.pay_unit || request.pay_amount === undefined || !Number.isFinite(request.pay_amount)) return null;
  const multiplier = MONTHLY_PAY_MULTIPLIERS[request.pay_unit];
  return multiplier ? request.pay_amount * multiplier : null;
}

const normalize = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const DAY_ALIASES: Record<string, string> = {
  monday: "mon", mon: "mon", lunedi: "mon", lun: "mon",
  tuesday: "tue", tue: "tue", martedi: "tue", mar: "tue",
  wednesday: "wed", wed: "wed", mercoledi: "wed", mer: "wed",
  thursday: "thu", thu: "thu", giovedi: "thu", gio: "thu",
  friday: "fri", fri: "fri", venerdi: "fri", ven: "fri",
  saturday: "sat", sat: "sat", sabato: "sat", sab: "sat",
  sunday: "sun", sun: "sun", domenica: "sun", dom: "sun",
};
const dayCode = (value?: string) => {
  const normalized = value ? normalize(value) : "";
  return DAY_ALIASES[normalized] ?? DAY_ALIASES[normalized.slice(0, 3)] ?? "";
};

// Older profiles store experience as labels such as "1-2 years" or "5+".
// Use the highest stated value as a conservative matching signal when a
// worker has not entered role-specific experience yet.
export function parseExperienceYears(value?: string | number): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const normalized = normalize(value).replace(",", ".");
  const plus = normalized.match(/(\d+(?:\.\d+)?)\s*\+/);
  if (plus) return Number(plus[1]);
  const range = normalized.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (range) return Number(range[2]);
  if (/^<\s*1/.test(normalized)) return 0;
  const number = normalized.match(/\d+(?:\.\d+)?/);
  return number ? Number(number[0]) : null;
}

export const canonicalCity = (s: string) => ({ milan: "milano", rome: "roma", florence: "firenze", turin: "torino", naples: "napoli" }[normalize(s)] ?? normalize(s));
const minutes = (s?: string) => {
  if (!s || !/^\d{2}:\d{2}(:\d{2})?$/.test(s)) return null;
  const [h, m] = s.split(":").map(Number);
  return h < 24 && m < 60 ? h * 60 + m : null;
};

// Compare complete weekly intervals, including shifts crossing midnight/Sunday.
export function coversSchedule(p: JobPreferences, r: MatchRequest): boolean | null {
  const start = minutes(r.hours_start), end = minutes(r.hours_end);
  const from = minutes(p.from), to = minutes(p.to);
  const requestedDays = r.days?.length ? r.days.map(dayCode).filter(Boolean) :
    r.start_date ? [WEEK_DAYS[(new Date(`${r.start_date}T12:00:00Z`).getUTCDay() + 6) % 7]] : [];
  if (!requestedDays.length || !p.days?.length || start === null || end === null || from === null || to === null) return null;
  const intervals = p.days.flatMap(day => {
    const i = WEEK_DAYS.indexOf(dayCode(day));
    if (i < 0) return [];
    const a = i * 1440 + from, b = i * 1440 + to + (to <= from ? 1440 : 0);
    return [[a - 10080, b - 10080], [a, b], [a + 10080, b + 10080]];
  }).sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (last && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]);
    else merged.push([...interval]);
  }
  return requestedDays.every(day => {
    const i = WEEK_DAYS.indexOf(day);
    if (i < 0) return false;
    const a = i * 1440 + start, b = i * 1440 + end + (end <= start ? 1440 : 0);
    return merged.some(([x, y]) => x <= a && y >= b);
  });
}

export function matchWorker(worker: MatchWorker, request: MatchRequest, today = new Date().toISOString().slice(0, 10)): WorkerMatch {
  const p = normalizeJobPreferences(worker.job_preferences ?? {});
  const reasons: MatchReason[] = [];
  let earned = 0, possible = 0, unknown = false, conflict = false;
  const roles = (request.roles ?? []).map(normalize);
  const matchingRoles = (worker.positions ?? []).filter(role => roles.includes(normalize(role)));
  if (roles.length) {
    possible += 40;
    if (matchingRoles.length) { earned += 40; reasons.push("role"); }
    else conflict = true;
  }
  if (request.city) {
    possible += 15;
    if (worker.city && canonicalCity(worker.city) === canonicalCity(request.city)) { earned += 15; reasons.push("city"); }
    else unknown = true;
  }
  const scheduleRequested = !!(request.days?.length || request.start_date) && !!request.hours_start && !!request.hours_end;
  if (scheduleRequested) {
    possible += 30;
    const schedule = coversSchedule(p, request);
    if (schedule === true) { earned += 30; reasons.push("schedule"); }
    else if (schedule === false) { conflict = true; reasons.push("schedule_conflict"); }
    else { unknown = true; reasons.push("availability_unknown"); }
  }
  const minExperience = request.worker_requirements?.minimumExperience;
  if (minExperience !== undefined && minExperience > 0) {
    possible += 10;
    const roleValues = matchingRoles
      .map(role => Object.entries(p.roleExperience ?? {}).find(([k]) => normalize(k) === normalize(role))?.[1])
      .map(value => parseExperienceYears(value))
      .filter((value): value is number => value !== null);
    const experience = roleValues.length ? Math.max(...roleValues) : parseExperienceYears(worker.years_exp);
    if (experience !== null && experience >= minExperience) { earned += 10; reasons.push("experience"); }
    else if (experience !== null) conflict = true;
    else unknown = true;
  }
  const languages = request.worker_requirements?.languages ?? [];
  if (languages.length) {
    possible += 5;
    if (languages.every(language => (worker.languages ?? []).some(l => normalize(l) === normalize(language)))) { earned += 5; reasons.push("languages"); }
    else if (worker.languages?.length) conflict = true;
    else unknown = true;
  }
  const requestedMonthlyPay = monthlyPayForRequest(request);
  if (p.minimumMonthlyPay && requestedMonthlyPay !== null && requestedMonthlyPay < p.minimumMonthlyPay) {
    conflict = true; reasons.push("pay_conflict");
  }
  const requestedStart = request.start_date || (["now", "asap"].includes(request.start_when ?? "") ? today : undefined);
  if (p.availableFrom && requestedStart && p.availableFrom > requestedStart) { conflict = true; reasons.push("start_conflict"); }
  const score = possible ? earned / possible : 0;
  const group = conflict || !possible || score < 0.5 ? "review" : !unknown && score >= 0.85 ? "strong" : "good";
  return { worker, score, group, reasons };
}

export function rankWorkers(workers: MatchWorker[], request: MatchRequest): WorkerMatch[] {
  const groups = { strong: 0, good: 1, review: 2 };
  const mediaRank = (worker: MatchWorker) => {
    const hasPhoto = !!worker.photo_url || (worker.photo_urls ?? []).some(Boolean);
    const hasVideo = !!worker.video_url || (worker.video_urls ?? []).some(Boolean);
    return hasPhoto && hasVideo ? 3 : hasVideo ? 2 : hasPhoto ? 1 : 0;
  };
  const profileDataRank = (worker: MatchWorker) => [
    worker.last_name?.trim(),
    worker.city?.trim(),
    worker.age_range?.trim(),
    worker.nationality?.trim(),
    worker.positions?.length,
    worker.languages?.length,
    worker.years_exp?.trim(),
    worker.job_preferences?.days?.length,
  ].filter(Boolean).length;
  return workers.filter(w => w.job_preferences?.openToWork !== false)
    .map(w => matchWorker(w, request)).sort((a, b) =>
      mediaRank(b.worker) - mediaRank(a.worker) ||
      profileDataRank(b.worker) - profileDataRank(a.worker) ||
      groups[a.group] - groups[b.group] || b.score - a.score ||
      (Date.parse(b.worker.last_seen_at ?? b.worker.created_at ?? "") || 0) - (Date.parse(a.worker.last_seen_at ?? a.worker.created_at ?? "") || 0) ||
      a.worker.id.localeCompare(b.worker.id));
}
