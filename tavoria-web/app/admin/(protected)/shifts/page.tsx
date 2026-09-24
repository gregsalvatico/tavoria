import Link from "next/link";
import { deleteShiftAction, setShiftStatusAction } from "@/app/admin/actions";
import { supabaseAdmin } from "@/lib/supabase";
import AdminDeleteButton from "../AdminDeleteButton";

export const dynamic = "force-dynamic";

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLocaleLowerCase();
  const { data: shifts, error } = await supabaseAdmin
    .from("shifts")
    .select(
      "id, venue_id, roles, status, days, hours_start, hours_end, pay_amount, pay_unit, contract_type, start_when, start_date, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  const venueIds = [...new Set((shifts ?? []).map((shift) => shift.venue_id))];
  const { data: venues, error: venuesError } = venueIds.length
    ? await supabaseAdmin
        .from("venues")
        .select("id, name, type, city")
        .in("id", venueIds)
    : { data: [], error: null };
  if (venuesError) throw venuesError;
  const venuesById = new Map((venues ?? []).map((venue) => [venue.id, venue]));

  const rows = (shifts ?? []).map((shift) => ({
    shift,
    venue: venuesById.get(shift.venue_id),
  }));
  const filtered = rows.filter(({ shift, venue }) => {
    if (!query) return true;
    return [
      venue?.name,
      venue?.city,
      ...(shift.roles ?? []),
      shift.status,
      shift.id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase()
      .includes(query);
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
          Shifts
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {filtered.length} of {rows.length} posted shifts
        </p>
      </header>

      {params.deleted && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Shift and its applications were deleted.
        </p>
      )}

      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Search venue, position, city, or ID"
          aria-label="Search shifts"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700">
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-600">
            <tr>
              <th className="px-4 py-3">Shift</th>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3">Schedule / pay</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Posted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-stone-400">
                  No shifts found.
                </td>
              </tr>
            ) : (
              filtered.map(({ shift, venue }) => {
                const status = shift.status || "live";
                const nextStatus = status === "paused" ? "live" : "paused";
                return (
                  <tr key={shift.id} className="border-t border-stone-100 align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-stone-900">
                        {(shift.roles ?? []).join(" · ") || "Shift"}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-stone-500">
                        {shift.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {venue ? (
                        <Link
                          href={`/admin/venues/${venue.id}`}
                          className="font-medium text-stone-800 hover:text-orange-700"
                        >
                          {venue.name || "Unnamed venue"}
                        </Link>
                      ) : (
                        <span className="text-stone-400">Venue unavailable</span>
                      )}
                      <div className="text-xs text-stone-500">
                        {venue?.city || venue?.type || ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      <div>
                        {[shift.hours_start, shift.hours_end]
                          .filter(Boolean)
                          .join("–") || shift.start_when || "Schedule not set"}
                      </div>
                      <div className="text-xs text-stone-500">
                        {shift.pay_amount
                          ? `€${shift.pay_amount} / ${shift.pay_unit || "period"}`
                          : "Pay not set"}
                        {shift.contract_type ? ` · ${shift.contract_type}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          status === "live"
                            ? "bg-green-50 text-green-700"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {formatDate(shift.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <form action={setShiftStatusAction}>
                          <input type="hidden" name="id" value={shift.id} />
                          <input type="hidden" name="status" value={nextStatus} />
                          <button className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                            {status === "paused" ? "Publish" : "Pause"}
                          </button>
                        </form>
                        <AdminDeleteButton
                          action={deleteShiftAction}
                          id={shift.id}
                          confirmation={`Permanently delete this ${
                            (shift.roles ?? []).join(", ") || "shift"
                          } at ${venue?.name || "this venue"}, including its applications?`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
