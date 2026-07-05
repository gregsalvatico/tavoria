/**
 * Stylized phone+QR illustration. Pure inline SVG, no photos. Replace with a
 * real hero photo when one exists.
 */
export default function HeroVisual() {
  return (
    // TODO: replace with real hero photo
    <div className="relative mx-auto w-full max-w-md">
      <div className="relative aspect-[3/4] rounded-[2.5rem] border-[6px] border-navy bg-gradient-to-br from-cream to-white p-4 shadow-2xl">
        {/* Door + QR */}
        <svg
          viewBox="0 0 320 420"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Background wall */}
          <rect x="0" y="0" width="320" height="420" rx="16" fill="#FAFAF7" />

          {/* Door frame */}
          <rect
            x="60"
            y="40"
            width="200"
            height="340"
            rx="6"
            fill="#0B1B2B"
            opacity="0.06"
          />
          <rect
            x="72"
            y="52"
            width="176"
            height="316"
            rx="4"
            fill="#FFFFFF"
            stroke="#0B1B2B"
            strokeOpacity="0.15"
          />

          {/* Door handle */}
          <circle cx="92" cy="220" r="4" fill="#C9A961" />

          {/* QR sticker on the door */}
          <g transform="translate(122 120)">
            <rect
              x="-8"
              y="-8"
              width="116"
              height="140"
              rx="6"
              fill="#FFFFFF"
              stroke="#0B1B2B"
              strokeOpacity="0.2"
            />
            <text
              x="50"
              y="6"
              textAnchor="middle"
              fontFamily="'Playfair Display', Georgia, serif"
              fontSize="9"
              fontWeight="700"
              fill="#0B1B2B"
            >
              SCANSIONA
            </text>
            {/* Simple QR-style grid */}
            <g transform="translate(10 16)">
              <rect width="80" height="80" fill="#FFFFFF" />
              {/* Corner finders */}
              <rect x="0" y="0" width="22" height="22" fill="#0B1B2B" />
              <rect x="4" y="4" width="14" height="14" fill="#FFFFFF" />
              <rect x="8" y="8" width="6" height="6" fill="#0B1B2B" />
              <rect x="58" y="0" width="22" height="22" fill="#0B1B2B" />
              <rect x="62" y="4" width="14" height="14" fill="#FFFFFF" />
              <rect x="66" y="8" width="6" height="6" fill="#0B1B2B" />
              <rect x="0" y="58" width="22" height="22" fill="#0B1B2B" />
              <rect x="4" y="62" width="14" height="14" fill="#FFFFFF" />
              <rect x="8" y="66" width="6" height="6" fill="#0B1B2B" />
              {/* Random modules */}
              {[
                [28, 4], [36, 8], [44, 4], [52, 12], [28, 16], [40, 20],
                [48, 28], [32, 32], [44, 40], [56, 44], [4, 32], [12, 40],
                [20, 28], [28, 48], [40, 52], [52, 60], [4, 52], [16, 64],
                [32, 68], [48, 64], [60, 72], [68, 28], [72, 40], [68, 52],
              ].map(([x, y], i) => (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width="4"
                  height="4"
                  fill="#0B1B2B"
                />
              ))}
            </g>
            <text
              x="50"
              y="115"
              textAnchor="middle"
              fontFamily="'Inter', sans-serif"
              fontSize="7"
              fontWeight="600"
              fill="#6B7280"
              letterSpacing="1.5"
            >
              TAVORIA · MILANO
            </text>
          </g>

          {/* Person silhouette with phone */}
          <g transform="translate(180 260)">
            {/* Phone */}
            <rect
              x="0"
              y="0"
              width="56"
              height="92"
              rx="10"
              fill="#0B1B2B"
              transform="rotate(-8 28 46)"
            />
            <rect
              x="4"
              y="4"
              width="48"
              height="84"
              rx="6"
              fill="#FF5A1F"
              transform="rotate(-8 28 46)"
              opacity="0.95"
            />
            <text
              x="28"
              y="50"
              textAnchor="middle"
              fontFamily="'Playfair Display', Georgia, serif"
              fontSize="11"
              fontWeight="700"
              fill="#FFFFFF"
              transform="rotate(-8 28 46)"
            >
              Tavoria
            </text>
          </g>

          {/* Floor line */}
          <line
            x1="0"
            y1="394"
            x2="320"
            y2="394"
            stroke="#0B1B2B"
            strokeOpacity="0.1"
          />
        </svg>
      </div>

      {/* Floating annotation card */}
      <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-surface px-5 py-4 shadow-xl ring-1 ring-ink/5 sm:block">
        <p className="text-xs font-semibold uppercase tracking-widest text-brass">
          30 secondi
        </p>
        <p className="mt-1 font-serif text-lg text-navy">Candidatura inviata.</p>
      </div>
    </div>
  );
}
