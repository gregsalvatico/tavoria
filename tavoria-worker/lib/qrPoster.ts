// Branded printable A4 QR poster generator.
//
// Generates a 210mm × 297mm PDF poster the venue owner can print and stick
// on their restaurant door. The poster encodes
// `https://tavoriapp.com/v/{venueId}` so workers can scan, see live shifts,
// and apply in under 30 seconds.
//
// Two execution paths:
//   - Web (Expo Web): build the PDF in-browser with `jspdf` and trigger a
//     download via a Blob URL.
//   - Native (iOS/Android): render an HTML string, hand it to `expo-print`
//     which produces a PDF file, then open the system share sheet so the
//     owner can AirDrop / email / save to Files.
//
// Italian copy is hard-coded because the launch market is Milan — the
// venue's UI language is separate from the language printed on the door.
//
// The QR matrix is generated with the `qrcode` package (pure JS, works in
// both runtimes). For the web path we paint the matrix onto an off-screen
// canvas to get a PNG data URL for jsPDF's `addImage`. For native we embed
// it as an inline SVG inside the HTML — sharper and avoids a canvas
// dependency in the native bundle.

import { Platform } from "react-native";
import { Asset } from "expo-asset";

// QRCode is lazy-loaded inside each generator function so module load
// of this file doesn't pull in the qrcode package on app boot. The package
// has Node.js-leaning entry resolution that can crash Metro's web bundle
// (Buffer undefined) when imported at top level.
type QRCodeMod = typeof import("qrcode");

const HANKEN_REGULAR = require("@expo-google-fonts/hanken-grotesk/400Regular/HankenGrotesk_400Regular.ttf");
const HANKEN_BOLD = require("@expo-google-fonts/hanken-grotesk/700Bold/HankenGrotesk_700Bold.ttf");
const INSTRUMENT_SERIF = require("@expo-google-fonts/instrument-serif/400Regular/InstrumentSerif_400Regular.ttf");
const HANKEN_FAMILY = "HankenGrotesk";
const DISPLAY_FAMILY = "InstrumentSerif";

// Brand
const ORANGE = "#F0531C";
const NEAR_BLACK = "#0E1A24";
const GRAY_700 = "#374151";
const GRAY_500 = "#6B7280";
const PAPER = "#FFFFFF"; // pure white prints better than cream

// A4 portrait, in millimetres
const PAGE_W = 210;
const PAGE_H = 297;
// QR target size — large enough to scan from ~1.5m
const QR_SIZE_MM = 118;

export type PosterOpts = {
  venueId: string;
  venueName: string;
  venueCity?: string;
};

export async function downloadVenueQRPoster(opts: PosterOpts): Promise<void> {
  const { venueId } = opts;
  if (!venueId) {
    throw new Error("downloadVenueQRPoster: venueId is required");
  }
  const url = `https://tavoriapp.com/v/${venueId}`;
  if (Platform.OS === "web") {
    await generatePosterWeb(url, opts);
  } else {
    await generatePosterNative(url, opts);
  }
}

async function loadFontBase64(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const response = await fetch(asset.localUri ?? asset.uri);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return globalThis.btoa(binary);
}

async function loadPosterFonts(): Promise<{ regular: string; bold: string; display: string }> {
  const [regular, bold, display] = await Promise.all([
    loadFontBase64(HANKEN_REGULAR),
    loadFontBase64(HANKEN_BOLD),
    loadFontBase64(INSTRUMENT_SERIF),
  ]);
  return { regular, bold, display };
}

// -------- Web: jsPDF --------------------------------------------------------

async function generatePosterWeb(url: string, opts: PosterOpts): Promise<void> {
  // Lazy-load jspdf + qrcode so the native bundle doesn't try to resolve them.
  const { jsPDF } = await import("jspdf");
  const QRCode: QRCodeMod = await import("qrcode");

  // QR as high-res PNG data URL — 1000px is well above print DPI for a 110mm
  // square (~230 DPI at A4), QR ECC level H so a small logo overlay still
  // scans reliably.
  const qrDataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 1000,
    color: { dark: NEAR_BLACK, light: "#FFFFFF" },
  });

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const fonts = await loadPosterFonts();
  doc.addFileToVFS("HankenGrotesk-Regular.ttf", fonts.regular);
  doc.addFileToVFS("HankenGrotesk-Bold.ttf", fonts.bold);
  doc.addFileToVFS("InstrumentSerif-Regular.ttf", fonts.display);
  doc.addFont("HankenGrotesk-Regular.ttf", HANKEN_FAMILY, "normal");
  doc.addFont("HankenGrotesk-Bold.ttf", HANKEN_FAMILY, "bold");
  doc.addFont("InstrumentSerif-Regular.ttf", DISPLAY_FAMILY, "normal");

  // Paper background
  doc.setFillColor(PAPER);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // --- Venue name AT THE VERY TOP, biggest element on the poster.
  //     This is what people walking past see first; it anchors the whole
  //     thing as "this specific restaurant" rather than a generic ad.
  doc.setFont(DISPLAY_FAMILY, "normal");
  doc.setFontSize(48);
  doc.setTextColor(NEAR_BLACK);
  doc.text(opts.venueName || "", PAGE_W / 2, 38, { align: "center" });

  if (opts.venueCity) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    doc.setTextColor(GRAY_500);
    doc.text(`${opts.venueCity}, Italia`, PAGE_W / 2, 51, { align: "center" });
  }

  // --- "CERCASI STAFF" black band just below the venue name.
  //     Italian "wanted/hiring" signal. Black-on-white (not orange) so it
  //     prints cleanly on any office b&w printer — venues will often print
  //     these on the cheapest available device. Sized BIG so it reads as a
  //     hiring notice from across the street.
  doc.setFont(HANKEN_FAMILY, "bold");
  doc.setFontSize(24);
  doc.setTextColor(ORANGE);
  doc.text("CERCASI STAFF", PAGE_W / 2, 67, { align: "center" });

  doc.setFont(HANKEN_FAMILY, "normal");
  doc.setFontSize(12);
  doc.setTextColor(NEAR_BLACK);
  doc.text("Non è il menù — è un’offerta di lavoro.", PAGE_W / 2, 78, {
    align: "center",
  });

  // --- QR code ----------------------------------------------------------
  const qrX = (PAGE_W - QR_SIZE_MM) / 2;
  const qrY = 90;
  doc.addImage(
    qrDataUrl,
    "PNG",
    qrX,
    qrY,
    QR_SIZE_MM,
    QR_SIZE_MM,
    undefined,
    "FAST"
  );

  // Small orange "T" overlay in the centre of the QR (ECC level H tolerates
  // up to ~30% obstruction). Square white background so the T pops.
  const logoSize = 16;
  const logoX = (PAGE_W - logoSize) / 2;
  const logoY = qrY + (QR_SIZE_MM - logoSize) / 2;
  doc.setFillColor("#FFFFFF");
  doc.rect(logoX, logoY, logoSize, logoSize, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(ORANGE);
  doc.text("T", PAGE_W / 2, logoY + logoSize - 4, { align: "center" });

  // --- Sub-copy (Italian) ----------------------------------------------
  const subY = qrY + QR_SIZE_MM + 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(GRAY_700);
  doc.text("Inquadra il QR. Registrati in 5 minuti.", PAGE_W / 2, subY, {
    align: "center",
  });
  doc.text("Lavora in giornata.", PAGE_W / 2, subY + 7, { align: "center" });

  // --- Tavoria wordmark at the bottom (the credit / where it came from) ---
  doc.setFont(DISPLAY_FAMILY, "normal");
  doc.setFontSize(34);
  const tWidth = doc.getTextWidth("T");
  const restWidth = doc.getTextWidth("avoria.");
  const wordmarkTotal = tWidth + restWidth;
  const wordmarkX = (PAGE_W - wordmarkTotal) / 2;
  const wordmarkY = PAGE_H - 37;
  doc.setTextColor(ORANGE);
  doc.text("T", wordmarkX, wordmarkY);
  doc.setTextColor(NEAR_BLACK);
  doc.text("avoria.", wordmarkX + tWidth, wordmarkY);

  // --- URL line — black so it prints cleanly on b&w too. The Tavoria T
  //     above already carries the brand colour; the URL just needs to be
  //     readable from a metre away.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(NEAR_BLACK);
  doc.text("tavoriapp.com", PAGE_W / 2, PAGE_H - 27, { align: "center" });

  // Trigger browser download
  const filename = sanitizeFilename(`tavoria-qr-${opts.venueName || "venue"}.pdf`);
  doc.save(filename);
}

// -------- Native: expo-print ------------------------------------------------

async function generatePosterNative(url: string, opts: PosterOpts): Promise<void> {
  // Lazy-load native modules.
  const Print = await import("expo-print");
  const QRCode: QRCodeMod = await import("qrcode");
  // Sharing is optional — if the module isn't available we fall back to
  // returning silently after the file is generated (the URI is still
  // logged so the user knows where it landed).
  let Sharing: typeof import("expo-sharing") | null = null;
  try {
    Sharing = await import("expo-sharing");
  } catch {
    Sharing = null;
  }

  // QR as SVG string — sharp at any size, no canvas needed.
  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 1,
    color: { dark: NEAR_BLACK, light: "#FFFFFF" },
  });

  const fonts = await loadPosterFonts();
  const html = buildPosterHtml({ qrSvg, opts, fonts });

  // @page rule + 0 margins keeps the HTML scaled to a true A4 surface.
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
    width: 595, // A4 width in PDF points (72dpi)
    height: 842, // A4 height in PDF points
  });

  if (Sharing && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Tavoria — Poster QR",
      UTI: "com.adobe.pdf",
    });
  } else {
    // Last-resort fallback: log the path so we don't silently swallow the work.
    console.log("[qrPoster] PDF written to:", uri);
  }
}

function buildPosterHtml({
  qrSvg,
  opts,
  fonts,
}: {
  qrSvg: string;
  opts: PosterOpts;
  fonts: { regular: string; bold: string; display: string };
}): string {
  // The SVG comes with its own width/height; strip those so CSS sizing wins.
  const sizedSvg = qrSvg
    .replace(/width="[^"]*"/, 'width="100%"')
    .replace(/height="[^"]*"/, 'height="100%"');

  const city = opts.venueCity ? `${escapeHtml(opts.venueCity)}, Italia` : "";

  return `
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <style>
    @font-face {
      font-family: "Hanken Grotesk";
      src: url("data:font/ttf;base64,${fonts.regular}") format("truetype");
      font-style: normal;
      font-weight: 400;
    }
    @font-face {
      font-family: "Hanken Grotesk";
      src: url("data:font/ttf;base64,${fonts.bold}") format("truetype");
      font-style: normal;
      font-weight: 700 900;
    }
    @font-face {
      font-family: "Instrument Serif";
      src: url("data:font/ttf;base64,${fonts.display}") format("truetype");
      font-style: normal;
      font-weight: 400;
    }
    @page { size: A4; margin: 0; }
    html, body {
      margin: 0;
      padding: 0;
      background: ${PAPER};
      color: ${NEAR_BLACK};
      font-family: "Hanken Grotesk", Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      height: 297mm;
      /* Generous print-safe margins keep the design clear when venues tape
         the poster to a door or place it in a frame. */
      padding: 22mm 24mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    /* Tavoria wordmark — now smaller, sits at the footer as the credit */
    .wordmark {
      font-family: "Instrument Serif", Georgia, serif;
      font-size: 34pt;
      font-weight: 400;
      letter-spacing: -1pt;
      line-height: 1;
      color: ${NEAR_BLACK};
      margin: 0;
    }
    .wordmark .t { color: ${ORANGE}; }
    .rule {
      width: 100%;
      height: 1px;
      background: #DCDCD6;
      margin: 10mm 0 6mm;
    }
    .headline {
      font-size: 28pt;
      font-weight: 900;
      letter-spacing: -0.5pt;
      line-height: 1.1;
      color: ${NEAR_BLACK};
      margin: 6mm 0 0;
    }
    .qr-wrap {
      position: relative;
      width: ${QR_SIZE_MM}mm;
      height: ${QR_SIZE_MM}mm;
      margin: 10mm auto 8mm;
    }
    .qr-wrap svg { display: block; width: 100%; height: 100%; }
    .qr-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 16mm;
      height: 16mm;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28pt;
      font-weight: 900;
      color: ${ORANGE};
      line-height: 1;
    }
    .sub {
      font-size: 16pt;
      color: ${GRAY_700};
      line-height: 1.35;
      margin: 4mm 0 0;
    }
    .spacer { flex: 1; }
    .footer { width: 100%; }
    .footer .rule { margin: 0 0 6mm; }
    /* Venue name — the biggest thing on the poster, at the very top */
    .venue {
      font-family: "Instrument Serif", Georgia, serif;
      font-size: 48pt;
      font-weight: 400;
      letter-spacing: -1pt;
      color: ${NEAR_BLACK};
      margin: 0 0 2mm;
      text-align: center;
    }
    .city {
      font-size: 13pt;
      color: ${GRAY_500};
      margin: 0 0 9mm;
      text-align: center;
    }
    .url {
      font-size: 12pt;
      font-weight: 700;
      color: ${NEAR_BLACK};
      margin: 8mm 0 0;
      letter-spacing: 0.4pt;
    }
    /* "CERCASI STAFF" black band — sits below the venue name as the
       anti-menu disambiguator. Black-on-white instead of orange so it
       prints cleanly on b&w office printers. Sized BIG so it reads from
       across the street. */
    .staff-band {
      width: 100%;
      color: ${ORANGE};
      text-align: center;
      font-size: 24pt;
      font-weight: 900;
      letter-spacing: 0;
      padding: 0;
      margin: 0;
    }
    /* Italian anti-menu disclaimer below the QR — black italic so it
       survives b&w printing. */
    .not-menu {
      font-size: 12pt;
      color: ${NEAR_BLACK};
      margin: 3mm 0 0;
    }
  </style>
</head>
<body>
  <div class="page">
    <p class="venue">${escapeHtml(opts.venueName || "")}</p>
    ${city ? `<p class="city">${city}</p>` : ""}
    <div class="staff-band">CERCASI STAFF</div>
    <p class="not-menu">Non è il menù — è un'offerta di lavoro.</p>
    <div class="qr-wrap">
      ${sizedSvg}
      <div class="qr-logo">T</div>
    </div>
    <p class="sub">Inquadra il QR. Registrati in 5 minuti.<br/>Lavora in giornata.</p>
    <div class="spacer"></div>
    <div class="footer">
      <h1 class="wordmark"><span class="t">T</span>avoria<span class="t">.</span></h1>
      <p class="url">tavoriapp.com</p>
    </div>
  </div>
</body>
</html>`;
}

// -------- helpers ----------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
}
