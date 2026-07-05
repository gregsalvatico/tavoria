import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Section, { Divider } from "@/components/Section";

export const metadata: Metadata = {
  title: "Fondatori — Chi c'è dietro Tavoria",
  description:
    "Tavoria è costruito a Milano da Greg Salvatico e il team di K3Y Solutions. Anni nella ristorazione, una sola idea: togliere la frustrazione dell'assunzione.",
};

export default function Fondatori() {
  return (
    <>
      <Nav />
      <main>
        <Section
          tone="cream"
          eyebrow="Fondatori"
          heading={
            <>
              Costruito a Milano da chi{" "}
              <em className="italic">conosce il settore.</em>
            </>
          }
        >
          <div className="grid gap-12 md:grid-cols-[200px_1fr] md:gap-16">
            {/* TODO: replace with Greg's photo */}
            <div
              aria-hidden="true"
              className="relative h-[180px] w-[180px] overflow-hidden rounded-full bg-gradient-to-br from-navy via-navy to-[#1a3550] ring-4 ring-cream shadow-xl"
            >
              <div className="absolute inset-0 flex items-center justify-center font-serif text-6xl text-brass">
                GS
              </div>
            </div>
            <div>
              <p className="font-serif text-3xl text-navy">Greg Salvatico</p>
              <p className="mt-1 text-sm uppercase tracking-[0.15em] text-brass">
                Fondatore · K3Y Solutions S.r.l.
              </p>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-ink/85">
                <p>
                  Dopo anni nella ristorazione, ho fondato Tavoria per togliere
                  la frustrazione dell&apos;assunzione. Niente CV, niente
                  settimane di ricerca. Solo persone reali che vogliono
                  lavorare oggi.
                </p>
                <p>
                  L&apos;idea è nata davanti alla porta di un ristorante con il
                  cartello &ldquo;cercasi cameriere&rdquo;. Mi sono chiesto:
                  perché un passante che vuole lavorare non può candidarsi sul
                  momento, dal telefono, in 30 secondi? Tavoria è la risposta.
                </p>
                <p>
                  Siamo una squadra piccola: ingegneri, designer, e gente che
                  ha passato anni dietro al bancone. Costruiamo Tavoria a
                  Milano, per Milano. Poi il resto d&apos;Italia.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <a
                  href="mailto:hello@tavoriapp.com"
                  className="rounded-full border border-ink/15 px-4 py-2 font-medium text-ink transition-colors hover:border-orange hover:text-orange"
                >
                  hello@tavoriapp.com
                </a>
                <a
                  href="https://wa.me/393331234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-ink/15 px-4 py-2 font-medium text-ink transition-colors hover:border-orange hover:text-orange"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </Section>

        <Divider />

        <Section
          tone="surface"
          eyebrow="L'azienda"
          heading="K3Y Solutions S.r.l."
        >
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="font-serif text-lg text-navy">Sede</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">
                Milano, Italia. Operiamo principalmente nell&apos;area
                metropolitana lombarda.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg text-navy">Missione</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">
                Rendere l&apos;assunzione nell&apos;hospitality immediata, umana
                e senza burocrazia. Per locali e per chi ci lavora.
              </p>
            </div>
            <div>
              <h3 className="font-serif text-lg text-navy">Dati legali</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">
                K3Y Solutions S.r.l. · Milano, Italia
                <br />
                P. IVA IT-XX XXX XXX XXX
              </p>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
