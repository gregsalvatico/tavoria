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

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const venues = await getVenues();
  const query = (params.q ?? "").trim().toLocaleLowerCase();
  const filtered = venues.filter((venue) =>
    [venue.name, venue.type, venue.venue_style, venue.city, venue.email]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase()
      .includes(query),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
            Venues
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {filtered.length} of {venues.length} venues
          </p>
        </div>
      </div>

      {params.deleted && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Venue, its shifts, applications, and uploaded venue/shift media were deleted. The account remains active.
        </p>
      )}

      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Search venue, type, or city"
          aria-label="Search venues"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700">
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-stone-400">
                  No venues found.
                </td>
              </tr>
            )}
            {filtered.map((v) => (
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
