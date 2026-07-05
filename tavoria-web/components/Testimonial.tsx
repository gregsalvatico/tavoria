/**
 * Full-width testimonial — promoted out of the hero so it carries its own weight.
 * Brass divider on top, italic serif quote, attribution in tracked small caps,
 * five brass stars + tabular "5,0 / 5" rating.
 */

function Star() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M7 1l1.8 3.95L13 5.6l-3.1 2.9.8 4.2L7 10.8 3.3 12.7l.8-4.2L1 5.6l4.2-.65L7 1z"
        fill="#C9A961"
      />
    </svg>
  );
}

export default function Testimonial() {
  return (
    <section className="relative bg-cream">
      <div className="mx-auto w-full max-w-page px-6 py-20 sm:px-10 sm:py-28">
        {/* Brass divider */}
        <div className="mx-auto mb-12 h-px w-24 bg-brass/60" aria-hidden="true" />

        <p className="text-center text-[11px] uppercase tracking-[0.25em] text-brass font-semibold mb-10">
          I primi locali su Tavoria. Le loro parole.
        </p>

        {/* Stars + rating */}
        <div className="mx-auto mb-10 flex items-center justify-center gap-3">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} />
            ))}
          </div>
          <span className="text-sm text-mute tnum">
            <span className="font-serif text-navy">5,0</span>
            <span className="text-mute/60"> / 5</span>
          </span>
        </div>

        {/* Quote */}
        <blockquote className="mx-auto max-w-3xl text-center">
          <p className="font-serif text-[26px] leading-[1.35] font-medium italic text-navy sm:text-[32px] sm:leading-[1.3]">
            <span aria-hidden="true" className="text-brass not-italic">«&nbsp;</span>
            24 ore dopo aver scaricato l&apos;app, abbiamo assunto due camerieri.
            Niente CV, niente agenzie. Una ragazza si è candidata mentre passava
            davanti al locale.
            <span aria-hidden="true" className="text-brass not-italic">&nbsp;»</span>
          </p>
        </blockquote>

        {/* Attribution */}
        <div className="mt-10 flex flex-col items-center gap-1">
          <p className="text-[11px] uppercase tracking-[0.25em] text-brass font-semibold">
            Marco Moroni — Cinelandia, Milano
          </p>
          <p className="text-xs text-mute/70 font-serif italic">
            Bistrot, sala 60 coperti
          </p>
        </div>
      </div>
    </section>
  );
}
