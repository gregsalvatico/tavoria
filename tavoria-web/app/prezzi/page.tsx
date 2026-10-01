import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Section, { Divider } from "@/components/Section";

export const metadata: Metadata = {
  title: "Tavoria — Gratis per i locali fino al 2027",
  description:
    "Tavoria è gratis per i locali fino al 2027. Da allora, Pro a 19 € al mese sblocca tutti i profili e i contatti.",
};

const VENUE_INCLUDED = [
  "QR personalizzato per il tuo locale",
  "Pubblica turni gratis",
  "Candidati arrivati dal QR del tuo locale",
  "Dal 2027, candidature tramite app con profilo e contatti bloccati",
  "Tavoria Pro sblocca tutti i profili e i contatti",
  "Dal 2027, Tavoria Pro costa 19 € al mese",
];

const STAFF_INCLUDED = [
  "Profilo con video",
  "Candidature illimitate",
  "Notifiche quando ti scelgono",
  "Contatto diretto col locale",
  "Sempre gratis per chi cerca lavoro",
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
              Un prezzo chiaro. <em className="italic">Più candidati.</em>
            </>
          }
          lede="Gratis per i locali fino al 2027. Dal 2027, Pro a 19 € al mese sblocca tutti i profili e i contatti."
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
                Sempre.
              </p>
              <p className="mt-6 text-base leading-relaxed text-mute">
                Crea il tuo profilo, candidati e parla con i locali: per chi cerca lavoro è sempre gratis.
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
                  href="https://app.tavoriapp.com/signin?role=worker"
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
              <p className="mt-6 font-serif text-5xl leading-none">Gratis fino al 2027.</p>
              <p className="mt-2 font-serif text-xl italic text-cream/80">Poi Pro a 19 € al mese.</p>
              <p className="mt-6 text-base leading-relaxed text-cream/80">
                Nel piano gratuito, le candidature inviate tramite app restano bloccate. Pro sblocca tutti i profili e i contatti.
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
                  href="https://app.tavoriapp.com/signin?role=venue"
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
            <Info title="Quanto costa per un locale?" body="Tavoria è gratis fino al 2027. Dal 2027, Tavoria Pro costa 19 € al mese e sblocca tutti i profili e i contatti." />
            <Info title="Cosa include il piano gratuito dal 2027?" body="Puoi vedere i candidati arrivati dal QR del tuo locale. Le candidature inviate tramite app restano bloccate: per vedere i profili e contattare tutti i candidati serve Tavoria Pro." />
            <Info title="Cosa sblocca Tavoria Pro?" body="A 19 € al mese, puoi vedere tutti i profili dei candidati, comprese le candidature inviate tramite app, e contattarli." />
            <Info title="Posso mettere in pausa o disdire?" body="Sì. Puoi mettere in pausa per uno o due mesi oppure disdire liberamente." />
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
