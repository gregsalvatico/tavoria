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

    return error || !data ? null : (data as Venue);
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
  const appUrl = `https://app.tavoriapp.com/venue-board?venueId=${venueId}`;
  const venueName = venue?.name ?? "Questo locale";
  const venueMeta = [venue?.type, venue?.city].filter(Boolean).join(" / ");

  return (
    <main className="min-h-screen bg-paper px-5 py-6 text-ink2 sm:px-8 sm:py-8">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Tavoria<span className="text-accent">.</span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute2">
            Hai scansionato
          </span>
        </header>

        <section className="mt-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            Opportunita vicino a te
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-[0.94] tracking-[-0.035em] text-ink2">
            {venueName} sta assumendo.
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-6 text-mute2">
            Guarda le posizioni aperte e candidati direttamente dal tuo telefono.
          </p>
        </section>

        <section className="mt-8 rounded-[24px] border border-ink2/10 bg-white p-4 shadow-[0_10px_30px_rgba(14,26,36,0.07)]">
          <div className="flex items-center gap-4">
            {venue?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={venue.photo_url}
                alt={venueName}
                className="h-20 w-20 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#FFE1D0] font-serif text-3xl text-accent">
                {venueName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute2">
                Il tuo locale
              </p>
              <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-ink2">
                {venueName}
              </h2>
              {venueMeta ? (
                <p className="mt-1 text-sm text-mute2">{venueMeta}</p>
              ) : null}
              {venue?.address ? (
                <p className="mt-1 truncate text-sm text-mute2">{venue.address}</p>
              ) : null}
            </div>
          </div>
        </section>

        <a
          href={appUrl}
          className="mt-7 inline-flex min-h-14 items-center justify-center rounded-2xl bg-accent px-6 text-center text-[15px] font-semibold text-white transition hover:bg-accentDark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          Vedi le posizioni aperte
        </a>
        <p className="mt-4 text-center text-sm text-mute2">
          Candidati in pochi minuti, senza scaricare nulla.
        </p>
      </div>
    </main>
  );
}
