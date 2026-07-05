import type { ReactNode } from "react";

export type Step = {
  n: string;
  title: string;
  body: string;
  illustration: ReactNode;
};

type Props = {
  steps: Step[];
  /** Tones the alternation so two adjacent spreads on the same page don't repeat */
  startSide?: "left" | "right";
};

/**
 * Editorial spread of the 3-step funnel.
 *
 * Each step is its own row. Numeral hangs huge on the outer edge, the
 * illustration sits in a paper-style frame, the copy gets editorial breathing
 * room. Rows alternate sides. A brass hairline separates rows.
 */
export default function StepSpread({ steps, startSide = "left" }: Props) {
  return (
    <div className="space-y-16 sm:space-y-24">
      {steps.map((s, i) => {
        // Imageleft means the illustration is on the left at desktop
        const imageLeft =
          startSide === "left" ? i % 2 === 0 : i % 2 === 1;

        return (
          <div key={s.n}>
            {i > 0 && (
              <div className="hairline mb-16 sm:mb-24" aria-hidden="true" />
            )}
            <div
              className={`grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16 ${
                imageLeft ? "" : "lg:[&>*:first-child]:order-2"
              }`}
            >
              {/* Illustration */}
              <div className="lg:col-span-6">
                <div className="relative">
                  {/* Massive numeral hanging behind/over the frame */}
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute -top-6 font-serif font-medium leading-none tnum text-brass/90 ${
                      imageLeft ? "-left-2 sm:-left-4" : "-right-2 sm:-right-4"
                    }`}
                    style={{
                      fontSize: "clamp(72px, 11vw, 160px)",
                      zIndex: 2,
                    }}
                  >
                    {s.n}
                  </div>

                  <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[20px] bg-surface ring-1 ring-ink/5">
                    {s.illustration}
                  </div>
                </div>
              </div>

              {/* Copy */}
              <div className="lg:col-span-5 lg:col-start-auto flex flex-col justify-center">
                <p className="eyebrow mb-4 tnum">
                  Passaggio {s.n}
                </p>
                <h3 className="font-serif text-3xl font-medium leading-[1.1] text-navy sm:text-4xl">
                  {s.title}
                </h3>
                <p className="mt-5 max-w-md text-lg leading-[1.55] text-mute">
                  {s.body}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
