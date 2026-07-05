// All applications — table view with worker + venue join

import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getApplications() {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select(
      `
      id, status, message, created_at, updated_at,
      worker_id, venue_id, shift_id,
      worker:workers(id, first_name, last_name, photo_url, positions, city),
      venue:venues(id, name, type, city),
      shift:shifts(id, roles, hours_start, hours_end, pay_amount, pay_unit)
      `
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-stone-100 text-stone-700",
  declined: "bg-red-100 text-red-700",
  interview_requested: "bg-blue-100 text-blue-700",
  hired: "bg-green-100 text-green-700",
  starred: "bg-amber-100 text-amber-700",
};

export default async function ApplicationsPage() {
  const apps = await getApplications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
          Applications
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {apps.length} {apps.length === 1 ? "application" : "applications"}{" "}
          total
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-600 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Worker</th>
              <th className="text-left px-4 py-3">Venue</th>
              <th className="text-left px-4 py-3">Position</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Applied</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-stone-400">
                  No applications yet.
                </td>
              </tr>
            )}
            {apps.map((a) => {
              const worker = (a as any).worker as
                | {
                    id: string;
                    first_name: string;
                    last_name: string;
                    photo_url?: string;
                    positions?: string[];
                    city?: string;
                  }
                | null;
              const venue = (a as any).venue as
                | { id: string; name: string; type?: string; city?: string }
                | null;
              const shift = (a as any).shift as
                | { roles?: string[] }
                | null;
              const wname =
                [worker?.first_name, worker?.last_name]
                  .filter(Boolean)
                  .join(" ") || "(unknown)";
              return (
                <tr
                  key={a.id}
                  className="border-t border-stone-100 hover:bg-stone-50"
                >
                  <td className="px-4 py-3">
                    {worker ? (
                      <Link
                        href={`/admin/workers/${worker.id}`}
                        className="font-semibold text-stone-900 hover:text-orange-600 flex items-center gap-2"
                      >
                        {worker.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={worker.photo_url}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-stone-200" />
                        )}
                        {wname}
                      </Link>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {venue ? (
                      <Link
                        href={`/admin/venues/${venue.id}`}
                        className="text-stone-900 hover:text-orange-600"
                      >
                        {venue.name}{" "}
                        <span className="text-xs text-stone-500">
                          · {venue.type || venue.city}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {(shift?.roles ?? worker?.positions ?? [])
                      .slice(0, 2)
                      .join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded ${
                        STATUS_COLOR[a.status] ?? "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {a.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {formatDate(a.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
