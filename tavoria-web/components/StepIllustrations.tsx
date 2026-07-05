/**
 * Three inline-SVG illustrations for the funnel spread.
 *
 * Drawn flat / editorial — not skeuomorphic. Brass/navy/cream only.
 * They sit inside a paper-frame container in StepSpread.
 */

const NAVY = "#0B1B2B";
const BRASS = "#C9A961";
const CREAM = "#FAFAF7";
const ORANGE = "#FF5A1F";
const INK_15 = "rgba(11,27,43,0.15)";
const INK_08 = "rgba(11,27,43,0.08)";

/** Step 1 — Phone showing the post-shift form */
export function PostShiftIllustration() {
  return (
    <svg
      viewBox="0 0 500 400"
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="500" height="400" fill={CREAM} />

      {/* Diagonal warm wash */}
      <defs>
        <linearGradient id="warm1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4EBD8" stopOpacity="0.45" />
          <stop offset="100%" stopColor={CREAM} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="500" height="400" fill="url(#warm1)" />

      {/* Faint paper grid */}
      <g stroke={INK_08} strokeWidth="0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={i * 60} y1="0" x2={i * 60} y2="400" />
        ))}
      </g>

      {/* Phone — tilted, off-center */}
      <g transform="translate(150 40) rotate(-4 100 170)">
        {/* outer device */}
        <rect
          x="0"
          y="0"
          width="200"
          height="340"
          rx="28"
          fill={NAVY}
        />
        {/* screen */}
        <rect
          x="8"
          y="8"
          width="184"
          height="324"
          rx="22"
          fill={CREAM}
        />
        {/* status bar */}
        <rect x="80" y="14" width="40" height="6" rx="3" fill={NAVY} opacity="0.12" />

        {/* eyebrow */}
        <text
          x="24"
          y="56"
          fontFamily="'Inter Tight', sans-serif"
          fontSize="8"
          letterSpacing="1.5"
          fill={BRASS}
          fontWeight="600"
        >
          NUOVO TURNO
        </text>

        {/* form title */}
        <text
          x="24"
          y="80"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="18"
          fontWeight="600"
          fill={NAVY}
        >
          Pubblica un turno
        </text>

        {/* form fields */}
        <g transform="translate(24 100)">
          {/* Ruolo */}
          <text fontSize="7" letterSpacing="1" fill={NAVY} opacity="0.5" fontFamily="'Inter Tight', sans-serif" fontWeight="600">RUOLO</text>
          <rect x="0" y="6" width="152" height="28" rx="6" fill="white" stroke={INK_15} />
          <text x="10" y="24" fontSize="11" fill={NAVY} fontFamily="'Inter Tight', sans-serif">Cameriere di sala</text>

          {/* Quando */}
          <g transform="translate(0 50)">
            <text fontSize="7" letterSpacing="1" fill={NAVY} opacity="0.5" fontFamily="'Inter Tight', sans-serif" fontWeight="600">QUANDO</text>
            <rect x="0" y="6" width="72" height="28" rx="6" fill="white" stroke={INK_15} />
            <text x="10" y="24" fontSize="11" fill={NAVY} fontFamily="'Inter Tight', sans-serif" fontWeight="500">Stasera</text>
            <rect x="80" y="6" width="72" height="28" rx="6" fill="white" stroke={INK_15} />
            <text x="90" y="24" fontSize="11" fill={NAVY} fontFamily="'Inter Tight', sans-serif" fontWeight="500">19–24</text>
          </g>

          {/* Paga */}
          <g transform="translate(0 100)">
            <text fontSize="7" letterSpacing="1" fill={NAVY} opacity="0.5" fontFamily="'Inter Tight', sans-serif" fontWeight="600">PAGA</text>
            <rect x="0" y="6" width="152" height="36" rx="6" fill={NAVY} />
            <text x="14" y="29" fontSize="16" fontFamily="'Playfair Display', Georgia, serif" fontWeight="600" fill={BRASS}>€12</text>
            <text x="48" y="29" fontSize="9" fill={CREAM} opacity="0.7" fontFamily="'Inter Tight', sans-serif">/ ora · netto</text>
          </g>

          {/* CTA */}
          <rect x="0" y="160" width="152" height="36" rx="18" fill={ORANGE} />
          <text x="76" y="183" fontSize="11" fill="white" fontFamily="'Inter Tight', sans-serif" fontWeight="600" textAnchor="middle">Pubblica →</text>
        </g>
      </g>

      {/* Annotation tag — floating */}
      <g transform="translate(28 290)">
        <rect width="120" height="44" rx="6" fill="white" stroke={INK_15} />
        <text x="12" y="18" fontSize="7" letterSpacing="1.5" fill={BRASS} fontFamily="'Inter Tight', sans-serif" fontWeight="600">2 MINUTI</text>
        <text x="12" y="35" fontSize="11" fill={NAVY} fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic">Niente CV.</text>
      </g>
    </svg>
  );
}

/** Step 2 — QR poster on a restaurant door */
export function QRPosterIllustration() {
  return (
    <svg
      viewBox="0 0 500 400"
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="doorWash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B1B2B" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#0B1B2B" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <rect width="500" height="400" fill={CREAM} />

      {/* Wall */}
      <rect width="500" height="400" fill="url(#doorWash)" />

      {/* Door */}
      <rect x="120" y="40" width="260" height="340" rx="4" fill={NAVY} opacity="0.08" />
      <rect x="132" y="52" width="236" height="316" rx="2" fill="white" stroke={INK_15} />
      {/* Door panel inset */}
      <rect x="148" y="68" width="204" height="284" rx="2" fill="none" stroke={INK_15} strokeWidth="0.5" />

      {/* Door handle */}
      <circle cx="156" cy="220" r="5" fill={BRASS} />
      <circle cx="156" cy="220" r="2.5" fill={NAVY} opacity="0.4" />

      {/* QR poster, taped on slightly askew */}
      <g transform="translate(180 100) rotate(-1.6 70 90)">
        {/* tape strips */}
        <rect x="20" y="-6" width="40" height="10" rx="1" fill={BRASS} opacity="0.35" />
        <rect x="80" y="-6" width="40" height="10" rx="1" fill={BRASS} opacity="0.35" />

        {/* paper */}
        <rect width="140" height="180" rx="2" fill="white" stroke={INK_15} />

        {/* poster header */}
        <text x="70" y="22" fontFamily="'Inter Tight', sans-serif" fontSize="7" letterSpacing="2" textAnchor="middle" fill={BRASS} fontWeight="600">
          CERCASI PERSONALE
        </text>
        <line x1="20" y1="30" x2="120" y2="30" stroke={BRASS} opacity="0.4" strokeWidth="0.5" />

        {/* QR */}
        <g transform="translate(20 40)">
          <rect width="100" height="100" fill="white" />
          {/* Corners */}
          <rect x="0" y="0" width="28" height="28" fill={NAVY} />
          <rect x="5" y="5" width="18" height="18" fill="white" />
          <rect x="10" y="10" width="8" height="8" fill={NAVY} />

          <rect x="72" y="0" width="28" height="28" fill={NAVY} />
          <rect x="77" y="5" width="18" height="18" fill="white" />
          <rect x="82" y="10" width="8" height="8" fill={NAVY} />

          <rect x="0" y="72" width="28" height="28" fill={NAVY} />
          <rect x="5" y="77" width="18" height="18" fill="white" />
          <rect x="10" y="82" width="8" height="8" fill={NAVY} />

          {/* QR modules */}
          {[
            [36, 4], [44, 4], [52, 12], [60, 4], [36, 16], [44, 20], [56, 24],
            [40, 32], [52, 36], [64, 40], [36, 44], [48, 48], [60, 52],
            [4, 36], [12, 44], [20, 36], [28, 48], [4, 56], [16, 60], [24, 68],
            [36, 56], [48, 60], [60, 64], [40, 72], [52, 76], [64, 80],
            [72, 36], [80, 44], [88, 36], [92, 52], [80, 56], [72, 64], [88, 72],
            [40, 84], [52, 88], [60, 92], [44, 92],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="4" height="4" fill={NAVY} />
          ))}
        </g>

        {/* footer */}
        <text x="70" y="160" fontFamily="'Playfair Display', Georgia, serif" fontSize="13" fontStyle="italic" textAnchor="middle" fill={NAVY} fontWeight="500">
          Scansiona.
        </text>
        <text x="70" y="172" fontFamily="'Inter Tight', sans-serif" fontSize="6" letterSpacing="1.5" textAnchor="middle" fill={NAVY} opacity="0.6">
          TAVORIA · MILANO
        </text>
      </g>

      {/* Window light pool on floor */}
      <ellipse cx="250" cy="392" rx="180" ry="6" fill={BRASS} opacity="0.12" />
    </svg>
  );
}

/** Step 3 — Three video thumbnails stacked */
export function VideoThumbsIllustration() {
  return (
    <svg
      viewBox="0 0 500 400"
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="500" height="400" fill={CREAM} />

      <defs>
        <linearGradient id="thumb1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2f48" />
          <stop offset="100%" stopColor={NAVY} />
        </linearGradient>
        <linearGradient id="thumb2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a4a25" />
          <stop offset="100%" stopColor="#3a2210" />
        </linearGradient>
        <linearGradient id="thumb3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3f2a" />
          <stop offset="100%" stopColor="#162216" />
        </linearGradient>
      </defs>

      {/* Subtle background grid */}
      <g stroke={INK_08} strokeWidth="0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={i * 60} y1="0" x2={i * 60} y2="400" />
        ))}
      </g>

      {/* Cards — fanned stack, top one most prominent */}
      {/* Card 3 (back) */}
      <g transform="translate(140 80) rotate(-3 90 110)" opacity="0.85">
        <rect width="180" height="220" rx="14" fill="white" stroke={INK_15} />
        <rect x="10" y="10" width="160" height="160" rx="8" fill="url(#thumb3)" />
        <circle cx="90" cy="90" r="22" fill="white" opacity="0.92" />
        <polygon points="84,80 84,100 102,90" fill={NAVY} />
        <text x="14" y="190" fontFamily="'Playfair Display', Georgia, serif" fontSize="11" fontWeight="600" fill={NAVY}>Alessia, 24</text>
        <text x="14" y="205" fontFamily="'Inter Tight', sans-serif" fontSize="8" fill={NAVY} opacity="0.6">Cameriera · Brera</text>
      </g>

      {/* Card 2 (middle) */}
      <g transform="translate(180 60) rotate(2 90 110)" opacity="0.95">
        <rect width="180" height="220" rx="14" fill="white" stroke={INK_15} />
        <rect x="10" y="10" width="160" height="160" rx="8" fill="url(#thumb2)" />
        <circle cx="90" cy="90" r="22" fill="white" opacity="0.92" />
        <polygon points="84,80 84,100 102,90" fill={NAVY} />
        <text x="14" y="190" fontFamily="'Playfair Display', Georgia, serif" fontSize="11" fontWeight="600" fill={NAVY}>Matteo, 28</text>
        <text x="14" y="205" fontFamily="'Inter Tight', sans-serif" fontSize="8" fill={NAVY} opacity="0.6">Barista · Navigli</text>
      </g>

      {/* Card 1 (front) */}
      <g transform="translate(220 40)">
        <rect width="180" height="220" rx="14" fill="white" stroke={INK_15} />
        <rect x="10" y="10" width="160" height="160" rx="8" fill="url(#thumb1)" />
        {/* Live tag */}
        <rect x="20" y="20" width="58" height="18" rx="9" fill={ORANGE} />
        <circle cx="30" cy="29" r="3" fill="white" />
        <text x="40" y="32" fontFamily="'Inter Tight', sans-serif" fontSize="8" fill="white" fontWeight="600" letterSpacing="0.5">JUST RECORDED</text>
        {/* Play */}
        <circle cx="90" cy="100" r="22" fill="white" opacity="0.92" />
        <polygon points="84,90 84,110 102,100" fill={NAVY} />
        {/* Length */}
        <rect x="140" y="155" width="22" height="12" rx="2" fill={NAVY} opacity="0.7" />
        <text x="151" y="164" fontFamily="'Inter Tight', sans-serif" fontSize="7" fill="white" textAnchor="middle">0:28</text>

        <text x="14" y="190" fontFamily="'Playfair Display', Georgia, serif" fontSize="13" fontWeight="600" fill={NAVY}>Sofia, 22</text>
        <text x="14" y="206" fontFamily="'Inter Tight', sans-serif" fontSize="9" fill={NAVY} opacity="0.65">Cameriera · 3 anni · Milano</text>
      </g>

      {/* Tag — disponibile ora */}
      <g transform="translate(40 312)">
        <rect width="140" height="36" rx="18" fill="white" stroke={INK_15} />
        <circle cx="18" cy="18" r="4" fill="#3FB47C" />
        <text x="30" y="22" fontFamily="'Inter Tight', sans-serif" fontSize="10" fill={NAVY} fontWeight="500">Disponibile oggi</text>
      </g>
    </svg>
  );
}

/** Worker-side, Step 1 — phone scanning a QR poster (camera viewfinder framing) */
export function ScanQRIllustration() {
  return (
    <svg
      viewBox="0 0 500 400"
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="500" height="400" fill={CREAM} />
      <defs>
        <linearGradient id="scanWash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0E5CC" stopOpacity="0.4" />
          <stop offset="100%" stopColor={CREAM} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="500" height="400" fill="url(#scanWash)" />

      {/* Phone — held in portrait, slight perspective */}
      <g transform="translate(160 30) rotate(3 90 170)">
        <rect width="180" height="340" rx="26" fill={NAVY} />
        <rect x="8" y="8" width="164" height="324" rx="20" fill={NAVY} opacity="0.9" />
        {/* viewfinder content */}
        <rect x="8" y="8" width="164" height="324" rx="20" fill="black" opacity="0.4" />

        {/* Camera "scene": glimpse of door + QR */}
        <g transform="translate(8 8)">
          <rect width="164" height="324" rx="20" fill="#1a2a3a" />
          {/* Door silhouette */}
          <rect x="30" y="40" width="104" height="244" rx="2" fill={NAVY} opacity="0.6" />
          {/* QR on door */}
          <g transform="translate(58 130)">
            <rect width="48" height="48" fill="white" />
            <rect x="0" y="0" width="14" height="14" fill={NAVY} />
            <rect x="3" y="3" width="8" height="8" fill="white" />
            <rect x="5" y="5" width="4" height="4" fill={NAVY} />
            <rect x="34" y="0" width="14" height="14" fill={NAVY} />
            <rect x="37" y="3" width="8" height="8" fill="white" />
            <rect x="39" y="5" width="4" height="4" fill={NAVY} />
            <rect x="0" y="34" width="14" height="14" fill={NAVY} />
            <rect x="3" y="37" width="8" height="8" fill="white" />
            <rect x="5" y="39" width="4" height="4" fill={NAVY} />
            {/* modules */}
            {[[18,4],[24,8],[20,16],[28,20],[16,24],[30,28],[18,32],[26,36],[22,42],[34,18],[40,22],[38,30],[42,40],[6,18],[10,24],[14,42]].map(([x,y],i) => (
              <rect key={i} x={x} y={y} width="2" height="2" fill={NAVY} />
            ))}
          </g>
        </g>

        {/* Viewfinder corners */}
        <g stroke={BRASS} strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M50 80 L50 60 L70 60" />
          <path d="M130 80 L130 60 L110 60" />
          <path d="M50 240 L50 260 L70 260" />
          <path d="M130 240 L130 260 L110 260" />
        </g>

        {/* Scan hint */}
        <text x="90" y="290" fontFamily="'Inter Tight', sans-serif" fontSize="8" fill={CREAM} letterSpacing="1.5" textAnchor="middle" fontWeight="600" opacity="0.9">
          INQUADRA IL QR
        </text>
      </g>
    </svg>
  );
}

/** Worker-side, Step 2 — recording a 30s video */
export function RecordVideoIllustration() {
  return (
    <svg
      viewBox="0 0 500 400"
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="500" height="400" fill={CREAM} />

      {/* Phone with camera screen */}
      <g transform="translate(150 30)">
        <rect width="200" height="340" rx="28" fill={NAVY} />
        <rect x="8" y="8" width="184" height="324" rx="22" fill="black" />

        {/* Portrait subject (abstract bust silhouette) */}
        <g transform="translate(8 8)">
          {/* warm interior glow */}
          <defs>
            <radialGradient id="glow1" cx="50%" cy="60%" r="60%">
              <stop offset="0%" stopColor="#3a2a1a" />
              <stop offset="100%" stopColor="#0a0a14" />
            </radialGradient>
          </defs>
          <rect width="184" height="324" rx="22" fill="url(#glow1)" />
          {/* Shoulders */}
          <path d="M0 324 C 30 250, 60 230, 92 230 C 124 230, 154 250, 184 324 Z" fill={NAVY} opacity="0.7" />
          {/* Head */}
          <circle cx="92" cy="180" r="42" fill="#3a2a1a" />
          <circle cx="92" cy="180" r="42" fill="url(#glow1)" opacity="0.4" />
          {/* Subtle face — just rim light */}
          <path d="M55 180 a37 37 0 0 0 74 0" fill="none" stroke={BRASS} strokeWidth="0.5" opacity="0.6" />
        </g>

        {/* REC dot */}
        <g transform="translate(22 28)">
          <circle r="5" fill={ORANGE} />
          <text x="12" y="4" fontFamily="'Inter Tight', sans-serif" fontSize="9" fill="white" fontWeight="700" letterSpacing="1">REC</text>
        </g>

        {/* Timer */}
        <text x="178" y="32" fontFamily="'Inter Tight', sans-serif" fontSize="10" fill="white" textAnchor="end" fontWeight="600">0:24</text>

        {/* Question prompt */}
        <g transform="translate(20 60)">
          <rect width="160" height="48" rx="8" fill="white" opacity="0.92" />
          <text x="12" y="18" fontFamily="'Inter Tight', sans-serif" fontSize="7" letterSpacing="1.5" fill={BRASS} fontWeight="600">DOMANDA 2 / 3</text>
          <text x="12" y="38" fontFamily="'Playfair Display', Georgia, serif" fontSize="12" fontStyle="italic" fill={NAVY}>Da quanto lavori in sala?</text>
        </g>

        {/* Record button */}
        <g transform="translate(100 310)">
          <circle r="22" fill="white" />
          <circle r="16" fill={ORANGE} />
        </g>
      </g>

      {/* Side annotation */}
      <g transform="translate(28 290)">
        <rect width="110" height="44" rx="6" fill="white" stroke={INK_15} />
        <text x="12" y="18" fontSize="7" letterSpacing="1.5" fill={BRASS} fontFamily="'Inter Tight', sans-serif" fontWeight="600">30 SECONDI</text>
        <text x="12" y="35" fontSize="11" fill={NAVY} fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic">Mostrati.</text>
      </g>
    </svg>
  );
}

/** Worker-side, Step 3 — hired confirmation / WhatsApp ping */
export function HiredIllustration() {
  return (
    <svg
      viewBox="0 0 500 400"
      className="absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="500" height="400" fill={CREAM} />

      {/* Background grid */}
      <g stroke={INK_08} strokeWidth="0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={i * 60} y1="0" x2={i * 60} y2="400" />
        ))}
      </g>

      {/* Phone with notification */}
      <g transform="translate(140 50) rotate(-2 110 160)">
        <rect width="220" height="320" rx="28" fill={NAVY} />
        <rect x="8" y="8" width="204" height="304" rx="22" fill={CREAM} />

        {/* Status */}
        <text x="20" y="32" fontFamily="'Inter Tight', sans-serif" fontSize="8" letterSpacing="1.5" fill={NAVY} opacity="0.5" fontWeight="600">12:47</text>

        {/* Title */}
        <text x="20" y="60" fontFamily="'Inter Tight', sans-serif" fontSize="7" letterSpacing="1.5" fill={BRASS} fontWeight="600">CINELANDIA · MILANO</text>
        <text x="20" y="86" fontFamily="'Playfair Display', Georgia, serif" fontSize="20" fontWeight="600" fill={NAVY}>Sei stato</text>
        <text x="20" y="110" fontFamily="'Playfair Display', Georgia, serif" fontSize="20" fontStyle="italic" fill={NAVY} fontWeight="600">assunto.</text>

        {/* Body */}
        <text x="20" y="138" fontFamily="'Inter Tight', sans-serif" fontSize="10" fill={NAVY} opacity="0.7">Inizi stasera alle 19:00.</text>

        {/* Confirmed badge */}
        <g transform="translate(20 160)">
          <rect width="180" height="50" rx="10" fill={NAVY} />
          <circle cx="22" cy="25" r="10" fill={BRASS} />
          <path d="M18 25 l3 3 l6 -6" stroke={NAVY} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="40" y="22" fontFamily="'Inter Tight', sans-serif" fontSize="8" letterSpacing="1" fill={BRASS} fontWeight="600">CONFERMATO</text>
          <text x="40" y="38" fontFamily="'Inter Tight', sans-serif" fontSize="10" fill={CREAM}>€12 · 19–24 · sala</text>
        </g>

        {/* WhatsApp CTA */}
        <g transform="translate(20 224)">
          <rect width="180" height="40" rx="20" fill="#25D366" />
          <text x="90" y="26" fontFamily="'Inter Tight', sans-serif" fontSize="11" fill="white" textAnchor="middle" fontWeight="600">Apri WhatsApp →</text>
        </g>

        <text x="110" y="284" fontFamily="'Playfair Display', Georgia, serif" fontSize="10" fontStyle="italic" fill={NAVY} opacity="0.55" textAnchor="middle">
          Il locale ti scrive direttamente.
        </text>
      </g>
    </svg>
  );
}
