// All venues — table view with counts

import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getVenues() {
  const { data, error } = await supabaseAdmin
    .from("venues")
    .select(
      "id, name, type, city, address, email, phone, venue_style, photo_url, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export default async function VenuesPage() {
  const venues = await getVenues();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
            Venues
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {venues.length} {venues.length === 1 ? "venue" : "venues"} signed up
          </p>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-600 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Style</th>
              <th className="text-left px-4 py-3">City</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {venues.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-stone-400">
                  No venues yet. They&apos;ll appear here as they sign up.
                </td>
              </tr>
            )}
            {venues.map((v) => (
              <tr
                key={v.id}
                className="border-t border-stone-100 hover:bg-stone-50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/venues/${v.id}`}
                    className="font-semibold text-stone-900 hover:text-orange-600 flex items-center gap-3"
                  >
                    {v.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.photo_url}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-stone-200" />
                    )}
                    {v.name || "(no name)"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-stone-700">{v.type || "—"}</td>
                <td className="px-4 py-3 text-stone-700">
                  {v.venue_style || "—"}
                </td>
                <td className="px-4 py-3 text-stone-700">{v.city || "—"}</td>
                <td className="px-4 py-3 text-stone-500 text-xs">
                  {v.email || "—"}
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs">
                  {formatDate(v.created_at)}
                </td>
              </tr>
            ))}
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
