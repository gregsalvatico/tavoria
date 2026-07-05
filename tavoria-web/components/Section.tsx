import type { ReactNode } from "react";

type Props = {
  id?: string;
  children?: ReactNode;
  className?: string;
  /** Tighter padding for short sections */
  tight?: boolean;
  /** Optional eyebrow + heading + lede displayed at the top of the section */
  eyebrow?: string;
  heading?: ReactNode;
  lede?: ReactNode;
  /** Center heading block */
  centered?: boolean;
  /** Background tone */
  tone?: "cream" | "surface" | "navy";
};

const TONES: Record<NonNullable<Props["tone"]>, string> = {
  cream: "bg-cream",
  surface: "bg-surface",
  navy: "bg-navy text-cream",
};

export default function Section({
  id,
  children,
  className = "",
  tight,
  eyebrow,
  heading,
  lede,
  centered,
  tone = "cream",
}: Props) {
  const pad = tight ? "py-16 sm:py-20" : "py-16 sm:py-24 lg:py-28";
  return (
    <section id={id} className={`${TONES[tone]} ${className}`}>
      <div className={`mx-auto w-full max-w-page px-6 sm:px-10 ${pad}`}>
        {(eyebrow || heading || lede) && (
          <div
            className={`mb-14 sm:mb-20 ${
              centered ? "text-center mx-auto max-w-2xl" : "max-w-3xl"
            }`}
          >
            {eyebrow && (
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brass tnum">
                {eyebrow}
              </p>
            )}
            {heading && (
              <h2
                className={`font-serif font-medium leading-[1.06] text-[40px] sm:text-[56px] lg:text-[64px] ${
                  tone === "navy" ? "text-cream" : "text-navy"
                }`}
              >
                {heading}
              </h2>
            )}
            {lede && (
              <p
                className={`mt-6 max-w-2xl text-[17px] leading-[1.55] sm:text-lg ${
                  tone === "navy" ? "text-cream/80" : "text-mute"
                } ${centered ? "mx-auto" : ""}`}
              >
                {lede}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function Divider() {
  return (
    <div className="mx-auto w-full max-w-page px-6 sm:px-10">
      <div
        aria-hidden="true"
        className="h-px w-full bg-gradient-to-r from-transparent via-brass/30 to-transparent"
      />
    </div>
  );
}
