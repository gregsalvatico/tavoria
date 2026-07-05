// All workers — table view

import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getWorkers() {
  const { data, error } = await supabaseAdmin
    .from("workers")
    .select(
      "id, first_name, last_name, email, city, country, age_range, years_exp, positions, languages, photo_url, video_url, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export default async function WorkersPage() {
  const workers = await getWorkers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
          Workers
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          {workers.length} {workers.length === 1 ? "worker" : "workers"} signed up
        </p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-600 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Positions</th>
              <th className="text-left px-4 py-3">Exp.</th>
              <th className="text-left px-4 py-3">City</th>
              <th className="text-left px-4 py-3">Languages</th>
              <th className="text-left px-4 py-3">Media</th>
              <th className="text-left px-4 py-3">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-stone-400">
                  No workers yet.
                </td>
              </tr>
            )}
            {workers.map((w) => {
              const name =
                [w.first_name, w.last_name].filter(Boolean).join(" ") ||
                "(no name)";
              return (
                <tr
                  key={w.id}
                  className="border-t border-stone-100 hover:bg-stone-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/workers/${w.id}`}
                      className="font-semibold text-stone-900 hover:text-orange-600 flex items-center gap-3"
                    >
                      {w.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={w.photo_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-stone-200" />
                      )}
                      <span>
                        {name}
                        <span className="block text-xs text-stone-500 font-normal">
                          {w.age_range || ""}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {(w.positions ?? []).slice(0, 3).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {w.years_exp || "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {w.city || "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {(w.languages ?? []).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {w.photo_url && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          Photo
                        </span>
                      )}
                      {w.video_url && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          Video
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {formatDate(w.created_at)}
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
