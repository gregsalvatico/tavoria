// Protected admin layout — auth gate + navbar.
// Wraps everything inside /admin/(protected)/ which renders at /admin/*
// EXCEPT /admin/login (lives outside this folder).

import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed, clearAdminCookie } from "@/lib/admin-auth";

async function logout() {
  "use server";
  await clearAdminCookie();
  redirect("/admin/login");
}

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin" className="font-extrabold text-xl tracking-tight">
            <span className="text-orange-600">G</span>igi
            <span className="text-stone-400 font-normal ml-2 text-sm">admin</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-semibold text-stone-700">
            <Link href="/admin" className="hover:text-orange-600">
              Dashboard
            </Link>
            <Link href="/admin/venues" className="hover:text-orange-600">
              Venues
            </Link>
            <Link href="/admin/workers" className="hover:text-orange-600">
              Workers
            </Link>
            <Link href="/admin/applications" className="hover:text-orange-600">
              Applications
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-stone-500 hover:text-red-600 text-sm"
              >
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
