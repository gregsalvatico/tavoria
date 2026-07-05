import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Section, { Divider } from "@/components/Section";
import StepCard from "@/components/StepCard";

export const metadata: Metadata = {
  title: "Per staff — Trova lavoro in sala, bar o cucina a Milano",
  description:
    "Niente CV. Niente settimane di attesa. Scansiona un QR, registra 30 secondi di video, ti chiamano lo stesso giorno. Gratis, sempre.",
};

const STEPS = [
  {
    n: "01",
    title: "Scansiona un QR",
    body: "Lo trovi sulla porta dei locali a Milano. Si apre Tavoria col profilo del locale.",
  },
  {
    n: "02",
    title: "30 secondi di video",
    body: "Niente CV. Il locale ti vede in faccia, sente la tua voce, capisce subito chi sei.",
  },
  {
    n: "03",
    title: "Assunto oggi stesso",
    body: "Se ti scelgono, ti chiamano su WhatsApp. Inizi il turno la stessa giornata o quella dopo.",
  },
];

const PERKS = [
  {
    title: "Sempre gratis",
    body: "Per il staff non si paga nulla. Mai. Trovi lavoro e basta.",
  },
  {
    title: "Niente CV",
    body: "Il tuo video è il tuo CV. Mostri chi sei, non quello che scrivi su un foglio.",
  },
  {
    title: "Lavoro vicino",
    body: "Vedi turni nel tuo quartiere. Niente trasferte assurde. Niente tempo perso in metro.",
  },
  {
    title: "WhatsApp diretto",
    body: "Quando ti scelgono, il locale ti chiama direttamente. Niente intermediari, niente attese.",
  },
  {
    title: "Pagamento dichiarato",
    body: "Vedi la paga prima di candidarti. Niente sorprese a fine turno.",
  },
  {
    title: "Il tuo profilo, una volta sola",
    body: "Registri il video una volta. Si applica a tutti i locali. Niente di ripetere.",
  },
];

export default function PerStaff() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <Section
          tone="cream"
          eyebrow="Per il staff"
          heading={
            <>
              Lavoro in sala, bar o cucina.{" "}
              <em className="italic">In giornata.</em>
            </>
          }
          lede="Scansiona un QR davanti a un locale di Milano. Registra 30 secondi di video. Se ti scelgono, lavori oggi. Niente CV. Niente attese."
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              href="https://app.tavoriapp.com/signup?role=worker"
              external
              variant="orange"
              size="lg"
            >
              Cerco lavoro →
            </Button>
            <Button
              href="https://app.tavoriapp.com"
              external
              variant="navy-outline"
              size="lg"
            >
              Apri l&apos;app
            </Button>
          </div>
        </Section>

        <Divider />

        {/* How */}
        <Section
          tone="surface"
          eyebrow="Come funziona"
          heading={
            <>
              Tre passaggi. <em className="italic">30 secondi.</em>
            </>
          }
        >
          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((s) => (
              <StepCard key={s.n} {...s} />
            ))}
          </div>
        </Section>

        <Divider />

        {/* Perks */}
        <Section
          tone="cream"
          eyebrow="Perché Tavoria"
          heading="Sei cose che funzionano davvero."
        >
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {PERKS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl bg-surface p-7 ring-1 ring-ink/5 transition-shadow hover:shadow-lg"
              >
                <div className="mb-3 h-1 w-8 rounded-full bg-brass" />
                <h3 className="font-serif text-xl text-navy">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Divider />

        {/* CTA */}
        <Section tone="cream" centered heading="Pronti a iniziare?">
          <div className="flex flex-col items-center gap-4">
            <Button
              href="https://app.tavoriapp.com/signup?role=worker"
              external
              variant="orange"
              size="lg"
            >
              Crea il mio profilo →
            </Button>
            <p className="text-sm text-mute">
              Gratis. Per sempre. Solo persone reali, solo lavoro reale.
            </p>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
