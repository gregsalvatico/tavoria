import Button from "./Button";

/**
 * Editorial hero — pattern (b) from the brief.
 *
 * Left column (~62%): tracked uppercase brass eyebrow, a tall serif headline
 * that breaks across three lines with italic emphasis on the promise line,
 * a single subdued lede, and two CTAs.
 *
 * Right column (~38%): a single enormous brass numeral "01" sits in the
 * negative space — it is intentionally cropped at the top so the eye reads
 * it as a wayfinder for the funnel below, not as decoration. A faint
 * vertical hairline separates the columns at desktop only.
 *
 * Bottom: a thin ticker line (single statement, no marquee) and an
 * animated scroll cue.
 */
export default function HeroEditorial() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="mx-auto w-full max-w-page px-6 sm:px-10">
        <div className="grid items-stretch gap-12 pt-16 pb-10 sm:pt-24 sm:pb-12 lg:grid-cols-[1.6fr_1fr] lg:gap-20 lg:pt-32 lg:pb-16">
          {/* Headline column */}
          <div className="flex min-h-[58vh] flex-col justify-between lg:min-h-[64vh]">
            <div>
              <p className="eyebrow mb-8">
                Hospitality · Milano · MMXXVI
              </p>
              <h1 className="font-serif text-[44px] font-medium leading-[1.02] text-navy sm:text-[64px] lg:text-[88px]">
                Personale di sala,
                <br />
                bar e cucina.
                <br />
                <em className="italic font-semibold text-navy/95">
                  Pronto in 24 ore.
                </em>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-[1.55] text-mute sm:text-xl">
                Stampa il QR. I candidati si registrano col tuo telefono.
                Vedi 30 secondi di video. Assumi entro la giornata.
              </p>

              <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Button
                  href="https://app.tavoriapp.com/signup?role=venue"
                  external
                  variant="orange"
                  size="lg"
                >
                  Sono un locale →
                </Button>
                <Button
                  href="https://app.tavoriapp.com/signup?role=worker"
                  external
                  variant="navy-outline"
                  size="lg"
                >
                  Cerco lavoro →
                </Button>
              </div>
            </div>

            {/* Ticker line — single confident statement */}
            <div className="mt-14 lg:mt-0">
              <div className="hairline mb-5" />
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[12px] uppercase tracking-[0.18em] text-navy/65 tnum">
                <span className="text-brass">●</span>
                <span>Già scelti da 4 locali a Milano.</span>
                <span className="text-mute/70 normal-case tracking-normal italic font-serif">
                  In espansione.
                </span>
              </p>
            </div>
          </div>

          {/* Numeral column */}
          <div className="relative hidden lg:block">
            {/* faint vertical hairline */}
            <div
              aria-hidden="true"
              className="absolute left-0 top-6 bottom-12 w-px bg-gradient-to-b from-transparent via-brass/30 to-transparent"
            />
            <div className="relative h-full pl-14">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <p className="eyebrow mb-4">Capitolo</p>
                  <div
                    aria-hidden="true"
                    className="font-serif text-brass leading-[0.82] tnum"
                    style={{ fontSize: "min(28vw, 320px)" }}
                  >
                    01
                  </div>
                  <p className="mt-6 max-w-[18ch] font-serif text-2xl italic text-navy/80">
                    Tre passaggi.
                    <br />
                    Nessuna agenzia.
                  </p>
                </div>

                {/* Mini meta block — gives the column weight at the bottom */}
                <div className="mt-10 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-mute/80">
                      Tempo medio
                    </p>
                    <p className="mt-1 font-serif text-2xl text-navy tnum">
                      24h
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-mute/80">
                      Video candidatura
                    </p>
                    <p className="mt-1 font-serif text-2xl text-navy tnum">
                      30s
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="flex flex-col items-center pb-10 sm:pb-14">
          <span className="eyebrow mb-3 !text-[10px] !tracking-[0.3em]">
            Scorri
          </span>
          <div className="animate-scroll-cue text-brass" aria-hidden="true">
            <svg
              width="14"
              height="22"
              viewBox="0 0 14 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 1v18M1.5 13.5L7 20l5.5-6.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
