import Link from "next/link";
import { deleteUserAction } from "@/app/admin/actions";
import { supabaseAdmin } from "@/lib/supabase";
import AdminDeleteButton from "../AdminDeleteButton";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLocaleLowerCase();
  const [users, workersResult, venuesResult] = await Promise.all([
    getUsers(),
    supabaseAdmin
      .from("workers")
      .select("id, user_id, first_name, last_name, photo_url"),
    supabaseAdmin.from("venues").select("id, user_id, name, type, city"),
  ]);

  if (workersResult.error) throw workersResult.error;
  if (venuesResult.error) throw venuesResult.error;

  const workersByUser = new Map(
    (workersResult.data ?? []).map((worker) => [worker.user_id, worker]),
  );
  const venuesByUser = new Map(
    (venuesResult.data ?? []).map((venue) => [venue.user_id, venue]),
  );
  const rows = users.map((user) => ({
    user,
    worker: workersByUser.get(user.id),
    venue: venuesByUser.get(user.id),
  }));
  const filtered = rows.filter(({ user, worker, venue }) => {
    if (!query) return true;
    const profileName = [worker?.first_name, worker?.last_name, venue?.name]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return `${user.email ?? ""} ${user.id} ${profileName}`
      .toLocaleLowerCase()
      .includes(query);
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
          Users
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {filtered.length} of {users.length} accounts
        </p>
      </header>

      {params.deleted && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Account and associated profiles, applications, shifts, and media were deleted. Existing access tokens may remain valid until they expire.
        </p>
      )}

      <form method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Search email, name, or user ID"
          aria-label="Search users"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700">
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-600">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Profiles</th>
              <th className="px-4 py-3">Last active</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-stone-400">
                  No accounts found.
                </td>
              </tr>
            ) : (
              filtered.map(({ user, worker, venue }) => (
                <tr key={user.id} className="border-t border-stone-100 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-stone-900">
                      {user.email || "No email"}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-stone-500">
                      {user.id}
                    </div>
                  </td>
                  <td className="space-y-1 px-4 py-3">
                    {worker ? (
                      <Link
                        href={`/admin/workers/${worker.id}`}
                        className="block text-stone-700 hover:text-orange-700"
                      >
                        Worker: {[worker.first_name, worker.last_name]
                          .filter(Boolean)
                          .join(" ") || "Unnamed"}
                      </Link>
                    ) : null}
                    {venue ? (
                      <Link
                        href={`/admin/venues/${venue.id}`}
                        className="block text-stone-700 hover:text-orange-700"
                      >
                        Venue: {venue.name || venue.type || "Unnamed"}
                      </Link>
                    ) : null}
                    {!worker && !venue && (
                      <span className="text-stone-400">No profile</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {formatDate(user.last_sign_in_at)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end">
                      <AdminDeleteButton
                        action={deleteUserAction}
                        id={user.id}
                        label="Delete account"
                        confirmation={`Permanently delete ${user.email || "this account"}, all of its worker/venue profiles, applications, shifts, documents, and uploaded media? Existing access tokens may remain valid until they expire. This cannot be undone.`}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function getUsers() {
  const users = [];
  const perPage = 500;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < perPage) return users;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
