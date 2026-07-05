import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Section, { Divider } from "@/components/Section";

export const metadata: Metadata = {
  title: "Stampa — Tavoria sui media",
  description:
    "Articoli, interviste e menzioni di Tavoria. Per richieste stampa scrivi a hello@tavoriapp.com.",
};

export default function Stampa() {
  return (
    <>
      <Nav />
      <main>
        <Section
          tone="cream"
          eyebrow="Stampa"
          heading={
            <>
              Ci hanno menzionato. <em className="italic">Presto.</em>
            </>
          }
          lede="Stiamo iniziando. Le prime menzioni stampa arriveranno con il lancio pubblico a Milano."
        >
          <div className="rounded-2xl border border-dashed border-ink/15 bg-surface/60 p-10 text-center">
            <p className="font-serif text-2xl text-navy">Coming soon.</p>
            <p className="mt-3 text-sm text-mute">
              Per richieste stampa o interviste scrivi a{" "}
              <a
                href="mailto:hello@tavoriapp.com"
                className="font-medium text-orange underline-offset-4 transition-colors hover:underline"
              >
                hello@tavoriapp.com
              </a>
              .
            </p>
          </div>
        </Section>

        <Divider />

        <Section tone="surface" tight eyebrow="Risorse stampa" heading="Materiali">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-cream p-6 ring-1 ring-ink/5">
              <h3 className="font-serif text-lg text-navy">Logo</h3>
              <p className="mt-2 text-sm text-mute">
                Disponibile su richiesta a hello@tavoriapp.com (SVG, PNG).
              </p>
            </div>
            <div className="rounded-2xl bg-cream p-6 ring-1 ring-ink/5">
              <h3 className="font-serif text-lg text-navy">Bio fondatore</h3>
              <p className="mt-2 text-sm text-mute">
                Bio breve e lunga di Greg Salvatico, fondatore. Su richiesta.
              </p>
            </div>
            <div className="rounded-2xl bg-cream p-6 ring-1 ring-ink/5">
              <h3 className="font-serif text-lg text-navy">Dati e numeri</h3>
              <p className="mt-2 text-sm text-mute">
                Locali pilota, candidature, città. Forniti su richiesta
                editoriale.
              </p>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
