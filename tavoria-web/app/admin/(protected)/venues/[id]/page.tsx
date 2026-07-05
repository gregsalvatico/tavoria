// Venue detail — full record + shifts + applications

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function VenueDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: venue }, { data: shifts }, { data: apps }] = await Promise.all([
    supabaseAdmin.from("venues").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin
      .from("shifts")
      .select("*")
      .eq("venue_id", id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("applications")
      .select(
        "id, status, created_at, worker:workers(id, first_name, last_name, photo_url, interview_answers)"
      )
      .eq("venue_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!venue) notFound();

  return (
    <div className="space-y-8">
      <Link
        href="/admin/venues"
        className="text-sm text-stone-500 hover:text-orange-600"
      >
        ← All venues
      </Link>

      {/* Hero */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        {venue.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={venue.photo_url}
            alt=""
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-6 space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
            {venue.name}
          </h1>
          <div className="text-stone-500 text-sm">
            {[venue.type, venue.venue_style, venue.city]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <div className="text-stone-500 text-sm">{venue.address}</div>
          <div className="text-stone-500 text-sm">
            {venue.email}
            {venue.phone ? ` · ${venue.phone}` : ""}
          </div>
        </div>
      </div>

      {/* Hires positions + pay */}
      <div className="grid md:grid-cols-2 gap-4">
        <InfoCard label="Positions hired for">
          {(venue.roles ?? []).length === 0 ? (
            "—"
          ) : (
            <div className="flex flex-wrap gap-2">
              {(venue.roles as string[]).map((r) => (
                <span
                  key={r}
                  className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded"
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </InfoCard>
        <InfoCard label="Pay schedule">{venue.pay_schedule || "—"}</InfoCard>
      </div>

      {/* Shifts */}
      <Section title={`Shifts posted (${shifts?.length ?? 0})`}>
        {!shifts || shifts.length === 0 ? (
          <Empty />
        ) : (
          <ul className="divide-y divide-stone-100">
            {shifts.map((s) => (
              <li key={s.id} className="py-3 text-sm">
                <div className="font-semibold text-stone-900">
                  {(s.roles ?? []).join(" · ") || "Shift"}
                </div>
                <div className="text-xs text-stone-500">
                  {s.hours_start && s.hours_end
                    ? `${s.hours_start}–${s.hours_end}`
                    : ""}{" "}
                  · {s.pay_amount ? `€${s.pay_amount}/${s.pay_unit}` : "—"} ·{" "}
                  {s.contract_type || "—"} ·{" "}
                  {(s.days ?? []).join(",") || "any day"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Preferred interview answers (for matching) */}
      {(venue.preferred_interview_answers ?? []).length > 0 && (
        <Section
          title={`Ideal candidate profile (${(venue.preferred_interview_answers as any[]).length} answers)`}
        >
          <p className="text-xs text-stone-500 mb-4">
            Venue picked these as their perfect candidate&apos;s answers.
            Workers whose answers match get a higher match score.
          </p>
          <ol className="space-y-5">
            {(venue.preferred_interview_answers as Array<{
              q_id: string;
              q_text: string;
              role: string;
              a_id: string;
              a_text: string;
            }>).map((qa, i) => (
              <li
                key={qa.q_id}
                className="border-l-4 border-blue-300 pl-4 py-1"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600">
                    Q{i + 1}
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold">
                    {qa.role}
                  </span>
                </div>
                <div className="text-sm font-semibold text-stone-900">
                  {qa.q_text}
                </div>
                <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="text-blue-600 font-bold">★</span>
                  <span className="text-sm text-stone-900">{qa.a_text}</span>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Applications received */}
      <Section title={`Applicants (${apps?.length ?? 0})`}>
        {!apps || apps.length === 0 ? (
          <Empty />
        ) : (
          <ul className="divide-y divide-stone-100">
            {apps.map((a) => {
              const w = (a as any).worker as
                | {
                    id: string;
                    first_name: string;
                    last_name: string;
                    photo_url?: string;
                    interview_answers?: Array<{ q_id: string; a_id: string }>;
                  }
                | null;
              const match = computeMatch(
                venue.preferred_interview_answers as
                  | Array<{ q_id: string; a_id: string }>
                  | undefined,
                w?.interview_answers
              );
              return (
                <li key={a.id} className="py-3 flex items-center gap-3">
                  {w?.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.photo_url}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-stone-200" />
                  )}
                  <div className="flex-1">
                    {w ? (
                      <Link
                        href={`/admin/workers/${w.id}`}
                        className="font-semibold text-stone-900 hover:text-orange-600"
                      >
                        {[w.first_name, w.last_name].filter(Boolean).join(" ")}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </div>
                  {match && (
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${matchColor(match.pct)}`}
                      title={`${match.matches} / ${match.total} answers match`}
                    >
                      {match.pct}% match
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded bg-stone-100 text-stone-700`}
                  >
                    {a.status.replace("_", " ")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

function InfoCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
        {label}
      </div>
      <div className="text-stone-900 text-sm">{children}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <h2 className="font-bold text-stone-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="py-6 text-center text-sm text-stone-400">None yet</div>;
}

// Compute % match between venue's preferred answers and a worker's actual answers.
// Returns null if either side hasn't filled the QCM.
function computeMatch(
  preferred?: Array<{ q_id: string; a_id: string }>,
  worker?: Array<{ q_id: string; a_id: string }>
): { matches: number; total: number; pct: number } | null {
  if (!preferred || preferred.length === 0) return null;
  if (!worker || worker.length === 0) return null;
  const workerMap = new Map(worker.map((a) => [a.q_id, a.a_id]));
  let matches = 0;
  let total = 0;
  for (const p of preferred) {
    const w = workerMap.get(p.q_id);
    if (w !== undefined) {
      total++;
      if (w === p.a_id) matches++;
    }
  }
  if (total === 0) return null;
  return { matches, total, pct: Math.round((matches / total) * 100) };
}

function matchColor(pct: number): string {
  if (pct >= 70) return "bg-green-100 text-green-700";
  if (pct >= 40) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}
