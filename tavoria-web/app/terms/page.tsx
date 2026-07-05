// Public Terms & Privacy page — required by App Store + GDPR.
// Italian primary copy, mirroring the in-app /terms screen text.

import Link from "next/link";

export const metadata = {
  title: "Termini e Privacy — Tavoria",
  description:
    "Termini di servizio e Informativa Privacy di Tavoria. Aggiornati 27 maggio 2026.",
};

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold tracking-tight">{heading}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-gigi-ink/85">
        {children}
      </div>
    </section>
  );
}

export default function Terms() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:px-10 sm:py-16">
      <header className="mb-10">
        <Link href="/" className="text-sm font-semibold uppercase tracking-wider text-gigi-mute hover:text-gigi-ink">
          ← Tavoria
        </Link>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
          Termini e Privacy
        </h1>
        <p className="mt-2 text-sm text-gigi-mute">
          Ultimo aggiornamento: 27 maggio 2026 · v1.0
        </p>
      </header>

      <p className="mb-10 text-[15px] leading-relaxed text-gigi-ink/85">
        Benvenuto su Tavoria. Questi Termini regolano l&apos;uso dell&apos;app e
        dei servizi Tavoria, forniti da K3Y Solutions (&quot;Tavoria&quot;,
        &quot;noi&quot;). Creando un account o utilizzando Tavoria confermi di
        aver letto, compreso e accettato questi Termini e la Privacy riportata
        di seguito.
      </p>

      <Section heading="1. Cos'è Tavoria">
        <p>
          Tavoria è una piattaforma mobile che mette in contatto lavoratori
          della ristorazione e dell&apos;ospitalità (&quot;Staff&quot;) con
          locali, ristoranti, bar, hotel e altre strutture (&quot;Locali&quot;)
          per consentire loro di trovarsi e organizzare il lavoro direttamente.
          Tavoria non è un datore di lavoro, non è un&apos;agenzia per il lavoro
          o di somministrazione, non è un&apos;agenzia di reclutamento, non è un
          service di paghe e contributi, non è un mediatore di pagamenti né un
          garante.
        </p>
      </Section>

      <Section heading="2. Chi può usare Tavoria">
        <p>
          Per usare Tavoria devi avere almeno 18 anni e la capacità giuridica di
          concludere un contratto vincolante. Lo Staff che cerca lavoro in
          Italia deve avere, o poter ottenere, il diritto al lavoro in Italia
          ai sensi della normativa applicabile. I Locali devono essere imprese
          o lavoratori autonomi regolarmente costituiti.
        </p>
      </Section>

      <Section heading="3. Account e PIN">
        <p>
          Ogni persona o Locale può avere un solo account, identificato da un
          nome utente e da un PIN di 4 cifre che scegli tu. Sei responsabile
          della riservatezza del tuo PIN. Non conserviamo il PIN in chiaro e
          non possiamo recuperarlo per te.
        </p>
      </Section>

      <Section heading="4. Hiring e pagamenti">
        <p>
          Qualsiasi accordo di lavoro è esclusivamente tra Staff e Locale.
          Tavoria facilita solo l&apos;incontro. Retribuzioni, mance, imposte e
          contributi sono dovuti direttamente dal Locale allo Staff. Eventuali
          contestazioni di pagamento sono tra Staff e Locale.
        </p>
      </Section>

      <Section heading="5. Uso accettabile">
        <p>
          Ti impegni a non: usare Tavoria per finalità illecite; pubblicare
          contenuti falsi, ingannevoli, offensivi, diffamatori, sessualmente
          espliciti, di odio, discriminatori o molesti; impersonare
          un&apos;altra persona o impresa; raschiare dati di altri utenti.
        </p>
      </Section>

      <Section heading="6. Limitazione di responsabilità">
        <p>
          Nei limiti massimi consentiti dalla legge, Tavoria non è responsabile
          per danni indiretti. La nostra responsabilità complessiva massima è
          limitata al maggiore tra €100 e l&apos;importo da te versato a
          Tavoria nei dodici mesi precedenti. Nulla limita i diritti che ti
          spettano in qualità di consumatore ai sensi del Codice del Consumo
          (D.lgs. 206/2005).
        </p>
      </Section>

      <Section heading="7. Privacy in breve">
        <p>
          Trattiamo dati personali (nome, contatti, foto, video, città,
          cronologia candidature, dati del dispositivo) per gestire il servizio
          e abbinare Staff e Locali. Agiamo come titolare del trattamento ai
          sensi del Regolamento (UE) 2016/679 (&quot;GDPR&quot;). Hai diritto di
          accedere, rettificare, cancellare, limitare, portare e opporti al
          trattamento, e di proporre reclamo al Garante per la protezione dei
          dati personali (www.garanteprivacy.it). Per esercitare i tuoi diritti
          scrivi a{" "}
          <a className="underline" href="mailto:hello@tavoriapp.com">
            hello@tavoriapp.com
          </a>
          .
        </p>
      </Section>

      <Section heading="8. Legge applicabile e foro competente">
        <p>
          Questi Termini sono regolati dalla legge italiana. Foro competente:
          Milano. Se utilizzi Tavoria come consumatore puoi inoltre adire il
          giudice del luogo della tua residenza abituale.
        </p>
      </Section>

      <Section heading="9. Contatti">
        <p>
          Tavoria è gestita da K3Y Solutions. Per qualsiasi domanda scrivi a{" "}
          <a className="underline" href="mailto:hello@tavoriapp.com">
            hello@tavoriapp.com
          </a>
          .
        </p>
      </Section>

      <footer className="mt-16 border-t border-gigi-ink/10 pt-6 text-xs text-gigi-mute">
        <p>© {new Date().getFullYear()} K3Y Solutions — Tavoria</p>
        <p className="mt-2">
          Versione completa con tutte le 18 sezioni disponibile in-app dopo
          l&apos;installazione di Tavoria.
        </p>
      </footer>
    </main>
  );
}
