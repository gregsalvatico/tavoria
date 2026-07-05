import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Section, { Divider } from "@/components/Section";
import StepCard from "@/components/StepCard";

export const metadata: Metadata = {
  title: "Per locali — Assumi camerieri, baristi e cuochi in 24 ore",
  description:
    "Pubblica un turno in 2 minuti. Stampa il QR. I candidati si registrano col tuo telefono. Vedi i video. Assumi entro la giornata. Gratis fino a settembre 2026.",
};

const STEPS = [
  {
    n: "01",
    title: "Pubblica un turno",
    body: "Ruolo, ore, paga. 2 minuti dal telefono. Niente CV, niente burocrazia.",
  },
  {
    n: "02",
    title: "Stampa il QR",
    body: "Lo trovi nell'app, formato A4 pronto da stampare. Mettilo sulla porta o sul bancone.",
  },
  {
    n: "03",
    title: "Vedi i video",
    body: "Apri Tavoria. Guarda 30 secondi di ogni candidato. Premi Assumi su chi ti convince.",
  },
];

const BENEFITS = [
  {
    title: "Zero CV",
    body: "Vedi e senti la persona. Capisci in 30 secondi se è la persona giusta per il tuo locale.",
  },
  {
    title: "Solo locali",
    body: "I candidati arrivano dal QR sulla tua porta. Sono già davanti al tuo locale. Conoscono il quartiere.",
  },
  {
    title: "Identità verificata",
    body: "Verifichiamo documento d'identità e diritto al lavoro in Italia. Nessuna sorpresa.",
  },
  {
    title: "Paghi solo se assumi",
    body: "Niente abbonamenti. Niente fee per pubblicare. €19 solo quando assumi davvero.",
  },
  {
    title: "Pronto in 24 ore",
    body: "I nostri locali pilota assumono in media entro 24 ore dalla prima candidatura.",
  },
  {
    title: "WhatsApp diretto",
    body: "Quando assumi, parli direttamente con il candidato su WhatsApp. Nessun intermediario.",
  },
];

export default function PerLocali() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <Section
          tone="cream"
          eyebrow="Per i locali"
          heading={
            <>
              Personale di sala, bar e cucina.{" "}
              <em className="italic">Pronto in 24 ore.</em>
            </>
          }
          lede="Stampa un QR. I candidati si presentano col tuo telefono. Tu scegli e assumi nella stessa giornata. Senza agenzie, senza CV."
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              href="https://app.tavoriapp.com/signup?role=venue"
              external
              variant="orange"
              size="lg"
            >
              Inizia gratis →
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

        {/* How it works */}
        <Section
          tone="surface"
          eyebrow="Come funziona"
          heading={
            <>
              Tre passaggi. <em className="italic">Una giornata.</em>
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

        {/* Why Tavoria */}
        <Section
          tone="cream"
          eyebrow="Perché Tavoria"
          heading="Sei cose che cambiano."
        >
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl bg-surface p-7 ring-1 ring-ink/5 transition-shadow hover:shadow-lg"
              >
                <div className="mb-3 h-1 w-8 rounded-full bg-brass" />
                <h3 className="font-serif text-xl text-navy">{b.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Divider />

        {/* Testimonial block */}
        <Section tone="navy">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-serif text-2xl leading-relaxed text-cream sm:text-3xl">
              &ldquo;24 ore dopo aver scaricato l&apos;app, abbiamo assunto due
              camerieri. Nessuna agenzia. Nessun CV. Solo gente che voleva
              davvero lavorare.&rdquo;
            </p>
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-brass">
              Marco · Cinelandia Milano
            </p>
          </div>
        </Section>

        <Divider />

        {/* CTA */}
        <Section tone="cream" centered heading="Pronti a provare?">
          <div className="flex flex-col items-center gap-4">
            <Button
              href="https://app.tavoriapp.com/signup?role=venue"
              external
              variant="orange"
              size="lg"
            >
              Inizia gratis →
            </Button>
            <p className="text-sm text-mute">
              Gratis fino a settembre 2026. Poi €19 per assunzione.
            </p>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
