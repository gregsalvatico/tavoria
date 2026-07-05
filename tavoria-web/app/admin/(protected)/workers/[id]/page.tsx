// Worker detail — everything we know about a worker, all visible.

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function WorkerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: worker }, { data: apps }] = await Promise.all([
    supabaseAdmin.from("workers").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin
      .from("applications")
      .select(
        "id, status, created_at, updated_at, venue:venues(id, name, type, city)"
      )
      .eq("worker_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!worker) notFound();

  const fullName =
    [worker.first_name, worker.last_name].filter(Boolean).join(" ") ||
    "(no name)";

  return (
    <div className="space-y-8">
      <Link
        href="/admin/workers"
        className="text-sm text-stone-500 hover:text-orange-600"
      >
        ← All workers
      </Link>

      {/* Hero */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <div className="md:flex">
          {/* Photo */}
          <div className="md:w-64 md:flex-shrink-0">
            {worker.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={worker.photo_url}
                alt={fullName}
                className="w-full h-64 md:h-full object-cover"
              />
            ) : (
              <div className="w-full h-64 md:h-full bg-stone-200 flex items-center justify-center text-stone-400 text-sm">
                No photo
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 flex-1 space-y-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
                {fullName}
              </h1>
              <div className="text-stone-500 text-sm mt-1">
                {[
                  worker.age_range ? `${worker.age_range}y` : null,
                  worker.years_exp ? `${worker.years_exp} exp` : null,
                  worker.city || worker.country,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {(worker.positions ?? []).map((p: string) => (
                <span
                  key={p}
                  className="text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full"
                >
                  {p}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 text-sm">
              <Field label="Email" value={worker.email} />
              <Field label="Phone" value={worker.phone} />
              <Field
                label="Languages"
                value={(worker.languages ?? []).join(" · ") || "—"}
              />
              <Field
                label="City / Country"
                value={[worker.city, worker.country].filter(Boolean).join(", ")}
              />
            </div>

            <div className="pt-3 flex flex-wrap gap-2 text-xs">
              {worker.photo_url && (
                <Badge color="green">Photo uploaded</Badge>
              )}
              {worker.video_url && <Badge color="blue">Video recorded</Badge>}
              {(worker.personality ?? []).length > 0 && (
                <Badge color="purple">Personality test done</Badge>
              )}
              {(worker.interview_answers ?? []).length > 0 && (
                <Badge color="amber">Interview answered</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Intro video — HTML5 player */}
      {worker.video_url && (
        <Section title="Intro video">
          <video
            src={worker.video_url}
            controls
            className="w-full max-h-[480px] rounded-xl bg-black"
            playsInline
          />
        </Section>
      )}

      {/* Interview QCM answers */}
      {(worker.interview_answers ?? []).length > 0 && (
        <Section title={`Interview answers (${(worker.interview_answers as any[]).length})`}>
          <p className="text-xs text-stone-500 mb-4">
            Worker chose these multiple-choice answers to scenario questions
            tailored to their roles. Shows how they think — no right or wrong.
          </p>
          <ol className="space-y-5">
            {(worker.interview_answers as Array<{
              q_id: string;
              q_text: string;
              role: string;
              a_id: string;
              a_text: string;
            }>).map((qa, i) => (
              <li
                key={qa.q_id}
                className="border-l-4 border-orange-300 pl-4 py-1"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-orange-600">
                    Q{i + 1}
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold">
                    {qa.role}
                  </span>
                </div>
                <div className="text-sm font-semibold text-stone-900">
                  {qa.q_text}
                </div>
                <div className="mt-2 inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <span className="text-orange-600 font-bold">→</span>
                  <span className="text-sm text-stone-900">{qa.a_text}</span>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Personality test report */}
      {(worker.personality ?? []).length > 0 ||
      (worker.strengths ?? []).length > 0 ? (
        <Section title="Personality test — full report">
          <div className="bg-gradient-to-br from-purple-50 to-orange-50 border border-purple-100 rounded-xl p-5 mb-5">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2">
              Test completed
            </div>
            <div className="text-sm text-stone-700">
              16 scenario-based questions analysed →{" "}
              <span className="font-bold">
                {(worker.personality ?? []).length +
                  (worker.strengths ?? []).length}{" "}
                traits
              </span>{" "}
              identified
            </div>
            {(worker.personality ?? []).length > 0 && (
              <div className="text-sm text-stone-700 mt-1">
                Dominant trait:{" "}
                <span className="font-bold text-orange-700">
                  ★ {(worker.personality as string[])[0]}
                </span>
              </div>
            )}
          </div>

          {(worker.personality ?? []).length > 0 && (
            <>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                Strong in (top traits)
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {(worker.personality as string[]).map((trait, i) => (
                  <span
                    key={i}
                    className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                      i === 0
                        ? "bg-orange-600 text-white"
                        : i < 3
                        ? "bg-purple-200 text-purple-800"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {i === 0 && "★ "}
                    {trait}
                  </span>
                ))}
              </div>
            </>
          )}

          {(worker.strengths ?? []).length > 0 && (
            <>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                Also you (secondary traits)
              </div>
              <div className="flex flex-wrap gap-2">
                {(worker.strengths as string[]).map((s) => (
                  <span
                    key={s}
                    className="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}

          <p className="text-xs text-stone-400 mt-5 leading-relaxed">
            Note: the quiz aggregates trait counts across 16 scenarios.
            Individual answers are not stored — only the resulting trait
            profile. Each scenario presents 4 options, each tagged with 2-3
            traits. Most-selected traits appear in &quot;Strong in&quot;, next
            tier in &quot;Also you&quot;.
          </p>
        </Section>
      ) : (
        <Section title="Personality test">
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-center">
            <div className="text-sm text-stone-500">
              This worker hasn&apos;t taken the personality test yet.
            </div>
            <div className="text-xs text-stone-400 mt-1">
              It&apos;s an optional bonus step (16 scenario questions, ~2 min).
            </div>
          </div>
        </Section>
      )}

      {/* Applications history */}
      <Section title={`Applications (${apps?.length ?? 0})`}>
        {!apps || apps.length === 0 ? (
          <Empty msg="No applications yet" />
        ) : (
          <ul className="divide-y divide-stone-100">
            {apps.map((a) => {
              const v = (a as any).venue as
                | { id: string; name: string; type?: string; city?: string }
                | null;
              return (
                <li
                  key={a.id}
                  className="py-3 flex items-center gap-4"
                >
                  <div className="flex-1">
                    {v ? (
                      <Link
                        href={`/admin/venues/${v.id}`}
                        className="font-semibold text-stone-900 hover:text-orange-600"
                      >
                        {v.name}
                      </Link>
                    ) : (
                      <span className="text-stone-500">No venue</span>
                    )}
                    <div className="text-xs text-stone-500">
                      {[v?.type, v?.city].filter(Boolean).join(" · ")} ·{" "}
                      {formatDate(a.created_at)}
                    </div>
                  </div>
                  <StatusPill status={a.status} />
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* Raw record collapsed */}
      <details className="bg-white border border-stone-200 rounded-xl p-5">
        <summary className="cursor-pointer text-sm font-semibold text-stone-700">
          Raw record (all fields, JSON)
        </summary>
        <pre className="mt-4 text-xs bg-stone-50 p-4 rounded-lg overflow-x-auto text-stone-700">
          {JSON.stringify(worker, null, 2)}
        </pre>
      </details>

      <div className="text-xs text-stone-400">
        Created {formatDate(worker.created_at)} · Updated{" "}
        {formatDate(worker.updated_at)}
      </div>
    </div>
  );
}

// ----- helpers -----

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
        {label}
      </div>
      <div className="text-stone-900 mt-1">{value || "—"}</div>
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
    <div className="bg-white border border-stone-200 rounded-2xl p-6">
      <h2 className="font-bold text-stone-900 mb-4 text-lg">{title}</h2>
      {children}
    </div>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "green" | "blue" | "purple" | "amber" | "red";
}) {
  const map = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded ${map[color]}`}
    >
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-stone-100 text-stone-700",
    declined: "bg-red-100 text-red-700",
    interview_requested: "bg-blue-100 text-blue-700",
    hired: "bg-green-100 text-green-700",
    starred: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded ${
        map[status] ?? "bg-stone-100 text-stone-700"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="py-6 text-center text-sm text-stone-400">{msg}</div>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
