import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Section, { Divider } from "@/components/Section";

export const metadata: Metadata = {
  title: "Prezzi — Gratis durante il lancio, €19 per assunzione da settembre",
  description:
    "Per il staff: sempre gratis. Per i locali: gratis fino a settembre 2026, poi €19 ogni volta che assumi. Niente abbonamenti, niente fee nascoste.",
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
  "Nessuna fee. Mai.",
];

export default function Prezzi() {
  return (
    <>
      <Nav />
      <main>
        <Section
          tone="cream"
          eyebrow="Prezzi"
          heading={
            <>
              Trasparente. <em className="italic">Niente sorprese.</em>
            </>
          }
          lede="Paghi solo se assumi. Niente abbonamenti, niente fee per pubblicare un turno."
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
                Gratis.
              </p>
              <p className="mt-2 font-serif text-2xl italic text-navy/80">
                Per sempre.
              </p>
              <p className="mt-6 text-base leading-relaxed text-mute">
                Niente costi nascosti. Mai. Trovi lavoro e basta.
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
                Lancio Milano
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">
                Per i locali
              </p>
              <p className="mt-6 font-serif text-6xl leading-none">€0</p>
              <p className="mt-2 font-serif text-xl italic text-cream/80">
                fino a settembre 2026
              </p>
              <p className="mt-6 text-base leading-relaxed text-cream/80">
                Poi{" "}
                <span className="font-semibold text-cream">
                  €19 per assunzione
                </span>
                . Paghi solo se assumi davvero. Niente abbonamenti.
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

        {/* Small print */}
        <Section
          tone="cream"
          tight
          eyebrow="Domande frequenti sul prezzo"
          heading="Quello che ti chiedi prima di firmare."
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="font-serif text-lg text-navy">
                Cosa conta come &ldquo;assunzione&rdquo;?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">
                Quando premi &ldquo;Assumi&rdquo; nell&apos;app su un candidato
                e quel candidato accetta. Conferma esplicita da entrambe le
                parti. Niente trucchi.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg text-navy">
                E se il candidato non si presenta?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">
                Hai 7 giorni per segnalarlo. Se il candidato non si presenta o
                non risponde, annulliamo la fee. Zero rischio.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg text-navy">
                Posso annullare in qualsiasi momento?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">
                Sì. Non c&apos;è nessun contratto. Cancelli l&apos;account
                quando vuoi. Niente penali.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg text-navy">
                Fatturazione e IVA?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">
                Fattura elettronica al tuo P. IVA, IVA italiana inclusa.
                Tutto in regola con K3Y Solutions S.r.l.
              </p>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
