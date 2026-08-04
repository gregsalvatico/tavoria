import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Section, { Divider } from "@/components/Section";

export const metadata: Metadata = {
  title: "Tavoria — Gratis fino al 2027",
  description:
    "Tavoria è gratis fino al 2027. Dopo, i locali pagano €19 per assunzione. Tavoria Pro è in arrivo.",
};

const VENUE_INCLUDED = [
  "QR personalizzato per il tuo locale",
  "Turni illimitati",
  "Candidature illimitate",
  "Video di tutti i candidati",
  "Verifica identità e diritto al lavoro",
  "Contatto WhatsApp diretto con gli assunti",
];

const STAFF_INCLUDED = [
  "Profilo con video",
  "Candidature illimitate",
  "Notifiche quando ti scelgono",
  "Contatto diretto col locale",
  "Tutte le funzioni incluse fino al 2027",
];

export default function Prezzi() {
  return (
    <>
      <Nav />
      <main>
        <Section
          tone="cream"
          eyebrow="Tavoria"
          heading={
            <>
              Gratis fino al 2027. <em className="italic">Per tutti.</em>
            </>
          }
          lede="Gratis fino al 2027. Poi €19 per assunzione. Tavoria Pro è in arrivo."
          centered
        />

        {/* Pricing cards */}
        <div className="mx-auto w-full max-w-page px-6 pb-20 sm:px-10 sm:pb-28">
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            {/* Staff card */}
            <div className="rounded-3xl bg-surface p-10 ring-1 ring-ink/5 transition-shadow hover:shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
                Per il staff
              </p>
              <p className="mt-6 font-serif text-6xl leading-none text-navy">
                Tutto incluso.
              </p>
              <p className="mt-2 font-serif text-2xl italic text-navy/80">
                Fino al 2027.
              </p>
              <p className="mt-6 text-base leading-relaxed text-mute">
                Crea il tuo profilo, candidati e parla con i locali: è tutto incluso fino al 2027.
              </p>
              <ul className="mt-8 space-y-3">
                {STAFF_INCLUDED.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-ink/80"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mt-0.5 shrink-0 text-brass"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.5 9.5l3.5 3.5L14.5 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Button
                  href="https://app.tavoriapp.com/signup?role=worker"
                  external
                  variant="navy-outline"
                  size="md"
                  className="w-full"
                >
                  Crea il mio profilo →
                </Button>
              </div>
            </div>

            {/* Venue card */}
            <div className="relative rounded-3xl bg-navy p-10 text-cream shadow-xl">
              <span className="absolute -top-3 left-10 rounded-full bg-orange px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                GRATIS FINO AL 2027
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
                Per i locali
              </p>
              <p className="mt-6 font-serif text-5xl leading-none">Tutto incluso.</p>
              <p className="mt-2 font-serif text-xl italic text-cream/80">
                Fino al 2027.
              </p>
              <p className="mt-6 text-base leading-relaxed text-cream/80">
                Gratis fino al 2027. Poi €19 per assunzione. Tavoria Pro è in arrivo.
              </p>
              <ul className="mt-8 space-y-3">
                {VENUE_INCLUDED.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-cream/85"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mt-0.5 shrink-0 text-brass"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.5 9.5l3.5 3.5L14.5 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Button
                  href="https://app.tavoriapp.com/signup?role=venue"
                  external
                  variant="orange"
                  size="md"
                  className="w-full"
                >
                  Inizia gratis →
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Divider />

        <Section
          tone="cream"
          tight
          eyebrow="Tavoria Pro"
          heading="Oggi è tutto incluso."
        >
          <div className="grid gap-8 md:grid-cols-2">
            <Info title="Fino a quando Tavoria è gratis?" body="Per tutti fino al 2027: staff e locali possono usare Tavoria senza costi." />
            <Info title="Cosa succede dopo il 2027?" body="I locali pagano €19 per assunzione. Tavoria Pro è in arrivo." />
            <Info title="Posso usare Tavoria già oggi?" body="Sì. Tutte le funzioni disponibili oggi sono incluse fino al 2027." />
            <Info title="Ci sono pagamenti attivi?" body="No. Non ci sono pagamenti o abbonamenti attivi in questo momento." />
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-serif text-lg text-navy">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-mute">{body}</p>
    </div>
  );
}
