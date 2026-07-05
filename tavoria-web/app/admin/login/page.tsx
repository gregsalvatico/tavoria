// Admin login screen — single password field.

import { redirect } from "next/navigation";
import { checkPassword, setAdminCookie, isAdminAuthed } from "@/lib/admin-auth";

// Server action: verify password, set cookie, redirect to /admin
async function login(formData: FormData) {
  "use server";
  const pw = String(formData.get("password") ?? "");
  if (!checkPassword(pw)) {
    redirect("/admin/login?error=1");
  }
  await setAdminCookie();
  redirect("/admin");
}

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Already logged in? Skip the form.
  if (await isAdminAuthed()) {
    redirect("/admin");
  }
  const sp = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-100 p-6">
      <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 mb-1">
          <span className="text-orange-600">G</span>igi admin
        </h1>
        <p className="text-sm text-stone-500 mb-6">
          Enter the admin password to continue.
        </p>
        <form action={login} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold uppercase tracking-wide text-stone-500 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full border border-stone-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          {sp.error && (
            <p className="text-sm text-red-600 text-center">
              Wrong password. Try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 transition text-white font-bold py-3 rounded-full"
          >
            Log in
          </button>
        </form>
      </div>
    </main>
  );
}
