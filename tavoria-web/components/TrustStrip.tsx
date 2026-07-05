const VENUES = [
  { name: "Cinelandia" },
  { name: "SushiKa" },
  { name: "Bar Brera" },
  { name: "Hotel Diana" },
];

/**
 * Lightweight grayscale placeholder logos. Inline SVG rectangles with a serif
 * label inside — not real logo files. Swap with real client logos later.
 */
export default function TrustStrip() {
  return (
    <div className="mt-16 sm:mt-24">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-mute">
        Già su Tavoria
      </p>
      <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-10">
        {VENUES.map((v) => (
          <div
            key={v.name}
            className="flex h-12 items-center justify-center opacity-60 grayscale transition-opacity hover:opacity-90"
            aria-label={v.name}
          >
            <svg
              viewBox="0 0 160 40"
              className="h-full w-auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0"
                y="0"
                width="160"
                height="40"
                rx="6"
                fill="none"
                stroke="#0B1B2B"
                strokeOpacity="0.15"
                strokeWidth="1"
              />
              <text
                x="80"
                y="26"
                textAnchor="middle"
                fontFamily="'Playfair Display', Georgia, serif"
                fontSize="16"
                fontWeight="700"
                fill="#0B1B2B"
                fillOpacity="0.7"
              >
                {v.name}
              </text>
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
