// QR scan landing page. When someone scans the printed QR sticker on a venue
// door, they land here. We try to deep-link straight into the Tavoria native
// app; if it's not installed, we show install buttons + a brief venue card.

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

type Venue = {
  id: string;
  name: string | null;
  type: string | null;
  city: string | null;
  photo_url: string | null;
  address: string | null;
};

async function loadVenue(venueId: string): Promise<Venue | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase
      .from("venues")
      .select("id, name, type, city, photo_url, address")
      .eq("id", venueId)
      .maybeSingle();
    if (error || !data) return null;
    return data as Venue;
  } catch {
    return null;
  }
}

export default async function VenueLanding({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const venue = await loadVenue(venueId);

  // After the DNS split, the actual Tavoria app lives at app.tavoriapp.com.
  // Both the "Apri Tavoria" button and the noscript fallback point there.
  // We deliberately do NOT auto-redirect — workers should see the venue card
  // first (proves they scanned the right place), then tap to enter the app.
  const appUrl = `https://app.tavoriapp.com/v/${venueId}`;
  const fallbackUrl = appUrl;

  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            Tavoria<span className="text-gigi-accent">.</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-wider text-gigi-mute hover:text-gigi-ink"
          >
            Cos'è Tavoria
          </Link>
        </header>

        {/* Venue card */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gigi-ink/10">
          {venue?.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={venue.photo_url}
              alt={venue.name ?? "Venue"}
              className="mb-4 h-40 w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="mb-4 flex h-40 items-center justify-center rounded-2xl bg-gigi-paper">
              <span className="text-3xl">🏪</span>
            </div>
          )}
          <h1 className="text-2xl font-black tracking-tight">
            {venue?.name ?? "Locale"}
          </h1>
          {venue?.type || venue?.city ? (
            <p className="mt-1 text-sm text-gigi-mute">
              {[venue?.type, venue?.city].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {venue?.address ? (
            <p className="mt-2 text-sm text-gigi-mute">{venue.address}</p>
          ) : null}
        </section>

        <section className="mt-8">
          <p className="text-base font-semibold uppercase tracking-wider text-gigi-accent">
            Sta assumendo
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight">
            Apri Tavoria per candidarti
          </h2>
          <p className="mt-3 text-gigi-mute">
            Tavoria mostra i turni aperti, le posizioni e la paga. Ti candidi in
            2 minuti con un video di 30 secondi.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <a
              href={appUrl}
              className="inline-flex items-center justify-center rounded-full bg-gigi-ink px-6 py-4 text-base font-semibold text-gigi-paper transition hover:bg-black"
            >
              Apri Tavoria
            </a>
            <a
              href="https://apps.apple.com/app/id-coming-soon"
              className="inline-flex items-center justify-center rounded-full border border-gigi-ink/15 px-6 py-3 text-sm font-semibold text-gigi-ink transition hover:bg-gigi-ink/5"
            >
              Scarica per iPhone (App Store)
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.k3ysolutions.gigi"
              className="inline-flex items-center justify-center rounded-full border border-gigi-ink/15 px-6 py-3 text-sm font-semibold text-gigi-ink transition hover:bg-gigi-ink/5"
            >
              Scarica per Android (Play Store)
            </a>
          </div>

          <p className="mt-6 text-xs text-gigi-mute">
            Se hai già installato Tavoria, l&apos;app si aprirà automaticamente.
            Altrimenti scarica gratis dal tuo store.
          </p>
        </section>

        <footer className="mt-12 border-t border-gigi-ink/10 pt-6 text-xs text-gigi-mute">
          <p>
            © {new Date().getFullYear()} K3Y Solutions — Tavoria ·{" "}
            <a href="/terms" className="underline hover:text-gigi-ink">
              Termini e Privacy
            </a>
          </p>
        </footer>
      </main>
      <noscript>
        <a href={fallbackUrl}>{fallbackUrl}</a>
      </noscript>
    </>
  );
}
