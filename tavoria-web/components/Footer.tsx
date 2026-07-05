import Link from "next/link";
import Wordmark from "./Wordmark";

const PAGES = [
  { href: "/per-locali", label: "Per locali" },
  { href: "/per-staff", label: "Per staff" },
  { href: "/prezzi", label: "Prezzi" },
  { href: "/fondatori", label: "Fondatori" },
  { href: "/stampa", label: "Stampa" },
  { href: "/faq", label: "FAQ" },
];

const LEGAL = [
  { href: "/terms", label: "Privacy" },
  { href: "/terms", label: "Termini" },
];

const LANGS = [
  { code: "IT", flag: "it", active: true },
  { code: "EN", flag: "gb" },
  { code: "FR", flag: "fr" },
  { code: "ES", flag: "es" },
  { code: "中文", flag: "cn" },
];

/** Flat-style inline SVG flags. Tiny, brass-bordered. */
function Flag({ code }: { code: string }) {
  const w = 18;
  const h = 13;
  switch (code) {
    case "it":
      return (
        <svg width={w} height={h} viewBox="0 0 18 13" aria-hidden="true">
          <rect width="6" height="13" fill="#009246" />
          <rect x="6" width="6" height="13" fill="#FFFFFF" />
          <rect x="12" width="6" height="13" fill="#CE2B37" />
        </svg>
      );
    case "gb":
      return (
        <svg width={w} height={h} viewBox="0 0 18 13" aria-hidden="true">
          <rect width="18" height="13" fill="#012169" />
          <path d="M0 0 L18 13 M18 0 L0 13" stroke="#FFFFFF" strokeWidth="1.6" />
          <path d="M0 0 L18 13 M18 0 L0 13" stroke="#C8102E" strokeWidth="0.8" />
          <path d="M9 0 V13 M0 6.5 H18" stroke="#FFFFFF" strokeWidth="2.4" />
          <path d="M9 0 V13 M0 6.5 H18" stroke="#C8102E" strokeWidth="1.2" />
        </svg>
      );
    case "fr":
      return (
        <svg width={w} height={h} viewBox="0 0 18 13" aria-hidden="true">
          <rect width="6" height="13" fill="#002395" />
          <rect x="6" width="6" height="13" fill="#FFFFFF" />
          <rect x="12" width="6" height="13" fill="#ED2939" />
        </svg>
      );
    case "es":
      return (
        <svg width={w} height={h} viewBox="0 0 18 13" aria-hidden="true">
          <rect width="18" height="3.5" fill="#AA151B" />
          <rect y="3.5" width="18" height="6" fill="#F1BF00" />
          <rect y="9.5" width="18" height="3.5" fill="#AA151B" />
        </svg>
      );
    case "cn":
      return (
        <svg width={w} height={h} viewBox="0 0 18 13" aria-hidden="true">
          <rect width="18" height="13" fill="#DE2910" />
          <polygon points="4,2 4.7,3.6 6.4,3.6 5,4.7 5.6,6.3 4,5.4 2.4,6.3 3,4.7 1.6,3.6 3.3,3.6" fill="#FFDE00" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Footer() {
  return (
    <footer className="bg-navy text-cream">
      <div className="mx-auto w-full max-w-page px-6 py-16 sm:px-10 sm:py-20">
        {/* Editorial page-number line */}
        <p className="mb-12 text-[11px] uppercase tracking-[0.28em] text-brass tnum">
          <span className="text-brass/60">01 —</span>{" "}
          Tavoria · Milano · IT
        </p>

        <div className="grid gap-12 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Wordmark light className="text-2xl" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
              Personale per ristoranti, bar e hotel. Pronto in 24 ore.
            </p>
            <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-brass">
              Milano · Italia
            </p>
          </div>

          {/* Site links */}
          <div>
            <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cream/50">
              Navigazione
            </h3>
            <ul className="space-y-3">
              {PAGES.map((p) => (
                <li key={p.label}>
                  <Link
                    href={p.href}
                    className="text-sm text-cream/80 transition-colors hover:text-brass"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cream/50">
              Contatti
            </h3>
            <ul className="space-y-3 text-sm text-cream/80">
              <li>
                <a
                  href="mailto:hello@tavoriapp.com"
                  className="link-underline transition-colors hover:text-brass"
                >
                  hello@tavoriapp.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+393331234567"
                  className="link-underline transition-colors hover:text-brass tnum"
                >
                  +39 333 123 4567
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/393331234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline transition-colors hover:text-brass"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Language picker */}
        <div className="mt-16">
          <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-cream/50">
            Lingua
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {LANGS.map((l, i) => (
              <div key={l.code} className="flex items-center gap-5">
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="overflow-hidden rounded-[2px] ring-1 ring-brass/30">
                    <Flag code={l.flag} />
                  </span>
                  <span
                    className={`tnum tracking-wide ${
                      l.active
                        ? "text-brass"
                        : "text-cream/60 hover:text-brass cursor-pointer"
                    }`}
                  >
                    {l.code}
                  </span>
                </span>
                {i < LANGS.length - 1 && (
                  <span className="text-brass/30" aria-hidden="true">·</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hairline + closing editorial line */}
        <div className="mt-14 border-t border-brass/20 pt-8">
          <p className="text-center font-serif text-base italic text-cream/70 sm:text-lg">
            Fatto a Milano. Per chi lavora a Milano.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-3 text-[11px] text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p className="tnum">
            © 2026 K3Y Solutions S.r.l. · Milano, Italia · P. IVA IT-XX XXX XXX XXX
          </p>
          <p className="tnum">
            {LEGAL.map((l, i) => (
              <span key={l.label}>
                <Link
                  href={l.href}
                  className="transition-colors hover:text-brass"
                >
                  {l.label}
                </Link>
                {i < LEGAL.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
