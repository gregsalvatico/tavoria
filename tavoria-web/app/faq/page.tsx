import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Section from "@/components/Section";

export const metadata: Metadata = {
  title: "FAQ — Domande frequenti su Tavoria",
  description:
    "Quanto costa? Come funziona il QR? I candidati sono verificati? Risposte chiare alle domande più comuni su Tavoria.",
};

const ITEMS = [
  {
    q: "Tavoria è gratis?",
    a: "Sì, per il staff sempre gratis. Per i locali è gratis fino a settembre 2026, poi €19 ogni volta che assumi una persona.",
  },
  {
    q: "Come funziona il QR?",
    a: "Stampi il poster con il QR del tuo locale dalla tua app. Lo metti sulla porta. I passanti lo scansionano col telefono, si candidano in 30 secondi, tu vedi i video nell'app.",
  },
  {
    q: "I candidati sono verificati?",
    a: "Verifichiamo l'identità, il diritto al lavoro in Italia, e l'esperienza dichiarata nel video. Tu vedi tutto prima di decidere.",
  },
  {
    q: "I miei dati sono al sicuro?",
    a: "Tutto su server in UE, conformi al GDPR. Puoi cancellare il tuo account in 1 clic. Privacy completa nei nostri Termini.",
  },
  {
    q: "Chi c'è dietro?",
    a: "K3Y Solutions S.r.l., azienda con sede a Milano. Siamo un piccolo team con esperienza in ristorazione e tech.",
  },
  {
    q: "In quali città funziona?",
    a: "Stiamo lanciando a Milano. Ci espanderemo gradualmente nelle altre città italiane. Se vuoi essere tra i primi locali della tua città, scrivici.",
  },
  {
    q: "Posso pubblicare turni anche brevi (un solo giorno)?",
    a: "Sì. Pubblichi turni di qualsiasi durata: una serata, un weekend, una stagione, o un contratto a tempo indeterminato. Lo specifichi quando crei l'annuncio.",
  },
  {
    q: "Cosa succede se il candidato non si presenta?",
    a: "Hai 7 giorni per segnalarlo. Se il candidato non si presenta o non risponde dopo l'assunzione, annulliamo la fee di €19. Zero rischio.",
  },
];

export default function FAQ() {
  return (
    <>
      <Nav />
      <main>
        <Section
          tone="cream"
          eyebrow="FAQ"
          heading={
            <>
              Domande comuni. <em className="italic">Risposte dirette.</em>
            </>
          }
          lede="Se non trovi la risposta qui sotto, scrivici a hello@tavoriapp.com."
        >
          <div className="divide-y divide-ink/10 rounded-2xl bg-surface ring-1 ring-ink/5">
            {ITEMS.map((item, i) => (
              <details key={i} className="group px-6 py-5 sm:px-8">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                  <span className="font-serif text-lg text-navy sm:text-xl">
                    {item.q}
                  </span>
                  <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/15 text-mute transition-transform group-open:rotate-45">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M7 2.5v9M2.5 7h9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-base leading-relaxed text-mute">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
