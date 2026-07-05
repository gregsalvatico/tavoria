import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // New Tavoria brand palette
        navy: "#0B1B2B",
        brass: "#C9A961",
        orange: "#FF5A1F",
        cream: "#FAFAF7",
        ink: "#0B0F1A",
        mute: "#6B7280",
        surface: "#FFFFFF",
        // Editorial landing palette (new, approved 2026-06)
        // Use these on the homepage and migrate other pages later.
        paper: "#F7F4EE",
        ink2: "#0E1A24",
        accent: "#F0531C",
        accentDark: "#D8420F",
        mute2: "#46505A",
        mute3: "#5C6670",
        green: "#1F9D6B",
        // Legacy aliases kept so /v/[venueId], /terms, /admin keep compiling
        background: "var(--background)",
        foreground: "var(--foreground)",
        gigi: {
          ink: "#0B0F1A",
          paper: "#FAFAF7",
          accent: "#FF5A1F",
          accentDark: "#D9410D",
          mute: "#6B7280",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter Tight",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif)",
          "Cormorant Garamond",
          "Playfair Display",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        script: ["var(--font-script)", "Caveat", "ui-serif", "cursive"],
        mono: [
          "var(--font-mono)",
          "DM Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      maxWidth: {
        page: "1200px",
      },
      letterSpacing: {
        editorial: "-0.011em",
      },
      keyframes: {
        "scroll-cue": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.55" },
          "50%": { transform: "translateY(6px)", opacity: "1" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "scroll-cue": "scroll-cue 2.2s ease-in-out infinite",
        ticker: "ticker 38s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
