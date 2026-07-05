import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Instrument_Serif, DM_Mono } from "next/font/google";
import "./globals.css";

// Body — Hanken Grotesk, exposed as --font-sans
const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

// Editorial headlines + numerals — Instrument Serif (italic 400 only),
// exposed as --font-serif
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400"],
  style: ["italic", "normal"],
});

// Eyebrows / monospace meta / step numbers — DM Mono, exposed as --font-mono
const dmMono = DM_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tavoriapp.com"),
  title: {
    default:
      "Tavoria — Personale di sala, bar e cucina in 24 ore",
    template: "%s · Tavoria",
  },
  description:
    "Stampa il QR. I candidati si registrano col telefono. Vedi 30 secondi di video. Assumi entro la giornata.",
  keywords: [
    "personale ristorante",
    "lavoro sala",
    "lavoro bar",
    "lavoro cucina",
    "assumere camerieri Milano",
    "lavoro hospitality Milano",
    "Tavoria",
  ],
  openGraph: {
    title: "Tavoria — Personale di sala, bar e cucina in 24 ore",
    description:
      "Stampa il QR. I candidati si registrano col telefono. Vedi 30 secondi di video. Assumi entro la giornata.",
    url: "https://tavoriapp.com",
    siteName: "Tavoria",
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tavoria — Personale per ristoranti, bar e hotel",
    description:
      "Stampa il QR. I candidati si registrano col telefono. Assumi in giornata.",
  },
  alternates: {
    canonical: "https://tavoriapp.com",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F4EE",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${hankenGrotesk.variable} ${instrumentSerif.variable} ${dmMono.variable}`}
    >
      <body className="min-h-screen bg-cream font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
