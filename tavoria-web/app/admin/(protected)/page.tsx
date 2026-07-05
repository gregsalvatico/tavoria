// Admin dashboard — top-level numbers + recent activity

import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic"; // always fresh

async function getStats() {
  const [venues, workers, applications, shifts] = await Promise.all([
    supabaseAdmin.from("venues").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("workers").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("applications")
      .select("id", { count: "exact", head: true }),
    supabaseAdmin.from("shifts").select("id", { count: "exact", head: true }),
  ]);

  // Recent counts (last 24h)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [v24, w24, a24] = await Promise.all([
    supabaseAdmin
      .from("venues")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    supabaseAdmin
      .from("workers")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    supabaseAdmin
      .from("applications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);

  return {
    venues: venues.count ?? 0,
    workers: workers.count ?? 0,
    applications: applications.count ?? 0,
    shifts: shifts.count ?? 0,
    venues24: v24.count ?? 0,
    workers24: w24.count ?? 0,
    applications24: a24.count ?? 0,
  };
}

async function getRecent() {
  const [venues, workers, applications] = await Promise.all([
    supabaseAdmin
      .from("venues")
      .select("id, name, city, type, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("workers")
      .select("id, first_name, last_name, city, positions, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("applications")
      .select("id, worker_id, venue_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    venues: venues.data ?? [],
    workers: workers.data ?? [],
    applications: applications.data ?? [],
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const recent = await getRecent();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
          Dashboard
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          Snapshot of everything happening on Tavoria right now.
        </p>
      </div>

      {/* Top-level stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Venues" value={stats.venues} delta={stats.venues24} />
        <StatCard
          label="Workers"
          value={stats.workers}
          delta={stats.workers24}
        />
        <StatCard
          label="Applications"
          value={stats.applications}
          delta={stats.applications24}
        />
        <StatCard label="Shifts posted" value={stats.shifts} />
      </div>

      {/* Three columns of recent activity */}
      <div className="grid md:grid-cols-3 gap-6">
        <RecentCard title="Latest venues" href="/admin/venues">
          {recent.venues.length === 0 ? (
            <Empty />
          ) : (
            recent.venues.map((v) => (
              <Link
                key={v.id}
                href={`/admin/venues/${v.id}`}
                className="block py-3 border-b border-stone-100 last:border-b-0 hover:bg-stone-50 -mx-3 px-3 rounded"
              >
                <div className="font-semibold text-stone-900 text-sm">
                  {v.name || "(no name)"}
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  {[v.type, v.city].filter(Boolean).join(" · ") || "—"} ·{" "}
                  {formatWhen(v.created_at)}
                </div>
              </Link>
            ))
          )}
        </RecentCard>

        <RecentCard title="Latest workers" href="/admin/workers">
          {recent.workers.length === 0 ? (
            <Empty />
          ) : (
            recent.workers.map((w) => (
              <Link
                key={w.id}
                href={`/admin/workers/${w.id}`}
                className="block py-3 border-b border-stone-100 last:border-b-0 hover:bg-stone-50 -mx-3 px-3 rounded"
              >
                <div className="font-semibold text-stone-900 text-sm">
                  {[w.first_name, w.last_name].filter(Boolean).join(" ") ||
                    "(no name)"}
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  {(w.positions ?? []).slice(0, 2).join(" · ") || "—"} ·{" "}
                  {w.city || "?"} · {formatWhen(w.created_at)}
                </div>
              </Link>
            ))
          )}
        </RecentCard>

        <RecentCard title="Latest applications" href="/admin/applications">
          {recent.applications.length === 0 ? (
            <Empty />
          ) : (
            recent.applications.map((a) => (
              <div
                key={a.id}
                className="py-3 border-b border-stone-100 last:border-b-0"
              >
                <div className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
                  {a.status}
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  {formatWhen(a.created_at)}
                </div>
              </div>
            ))
          )}
        </RecentCard>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: number;
  delta?: number;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
        {label}
      </div>
      <div className="text-3xl font-extrabold mt-2 text-stone-900">{value}</div>
      {delta !== undefined && delta > 0 && (
        <div className="text-xs text-green-600 mt-1 font-semibold">
          +{delta} in last 24h
        </div>
      )}
    </div>
  );
}

function RecentCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-stone-900">{title}</h2>
        <Link
          href={href}
          className="text-xs font-semibold text-orange-600 hover:text-orange-700"
        >
          View all →
        </Link>
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="py-6 text-center text-sm text-stone-400">No data yet</div>;
}

function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
