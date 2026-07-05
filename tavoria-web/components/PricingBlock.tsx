import Button from "./Button";

const STAFF_ROWS = [
  "Profilo gratuito, sempre",
  "Candidatura video in 30 secondi",
  "Contatto diretto col locale",
  "Nessuna commissione, nessuna trattenuta",
];

const VENUE_ROWS = [
  "Annunci illimitati",
  "QR poster brandizzato",
  "Video di ogni candidato",
  "Verifica identità + diritto al lavoro",
  "Paghi solo quando assumi",
];

function Check({ className = "" }: { className?: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" className={className} aria-hidden="true">
      <path
        d="M1.5 5.5l2.5 2.5L9.5 2"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CornerOrnament() {
  // Small brass corner mark — gives the venue card the "this is THE card" feel
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      className="absolute right-6 top-6 text-brass"
      aria-hidden="true"
    >
      <path
        d="M2 2 H 22 M 2 2 V 22"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <circle cx="2" cy="2" r="2" fill="currentColor" />
    </svg>
  );
}

export default function PricingBlock() {
  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-8">
      {/* STAFF — cream */}
      <div className="relative rounded-[20px] bg-surface p-10 ring-1 ring-ink/5 transition-shadow hover:shadow-xl">
        <p className="eyebrow tnum">Per il staff</p>

        <div className="mt-8 flex items-baseline gap-3">
          <span className="font-serif text-[72px] font-medium leading-none text-navy tnum sm:text-[88px]">
            €0
          </span>
          <span className="font-serif text-2xl italic text-navy/70">per sempre.</span>
        </div>

        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-mute">
          Niente costi nascosti. Mai. Trovi lavoro e basta.
        </p>

        <ul className="mt-10 space-y-0">
          {STAFF_ROWS.map((row, i) => (
            <li
              key={row}
              className={`flex items-start gap-3 py-3 text-[14px] text-navy/85 ${
                i < STAFF_ROWS.length - 1 ? "border-b border-brass/20" : ""
              }`}
            >
              <Check className="mt-1 shrink-0 text-brass" />
              <span>{row}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Button
            href="https://app.tavoriapp.com/signup?role=worker"
            external
            variant="navy-outline"
            size="md"
            className="!h-11 !px-5 !text-sm"
          >
            Crea il mio profilo →
          </Button>
        </div>
      </div>

      {/* VENUE — navy, the hero card */}
      <div className="relative rounded-[20px] bg-navy p-10 text-cream shadow-2xl ring-1 ring-brass/40">
        <CornerOrnament />

        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brass tnum">
          Per i locali
        </p>

        <div className="mt-8 flex items-baseline gap-3">
          <span className="font-serif text-[72px] font-medium leading-none text-cream tnum sm:text-[88px]">
            €19
          </span>
          <span className="font-serif text-xl italic text-cream/70">
            per assunzione.
          </span>
        </div>

        <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-cream/75">
          <span className="font-semibold text-brass">Gratis fino a settembre 2026.</span>{" "}
          Poi paghi solo quando assumi. Niente abbonamenti, niente sorprese.
        </p>

        <ul className="mt-10 space-y-0">
          {VENUE_ROWS.map((row, i) => (
            <li
              key={row}
              className={`flex items-start gap-3 py-3 text-[14px] text-cream/90 ${
                i < VENUE_ROWS.length - 1 ? "border-b border-brass/20" : ""
              }`}
            >
              <Check className="mt-1 shrink-0 text-brass" />
              <span>{row}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Button
            href="https://app.tavoriapp.com/signup?role=venue"
            external
            variant="orange"
            size="md"
            className="!h-11 !px-5 !text-sm"
          >
            Inizia gratis →
          </Button>
        </div>
      </div>
    </div>
  );
}
