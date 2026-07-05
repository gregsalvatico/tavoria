"use client";

import { useState, CSSProperties } from "react";

/**
 * Tavoria editorial landing — approved design, ported pixel-for-pixel
 * from /outputs/tavoria_landing_target.html. Inline styles by design
 * (the source is inline; we want fidelity, not Tailwind paraphrasing).
 *
 * Self-contained: does NOT import Nav, Footer, or any of the other
 * shared components. Other routes (/per-locali, /per-staff, etc.) keep
 * using those components — only the homepage is this single file.
 */

const FONT_SANS = "var(--font-sans), 'Hanken Grotesk', -apple-system, system-ui, sans-serif";
const FONT_SERIF = "var(--font-serif), 'Instrument Serif', serif";
const FONT_MONO = "var(--font-mono), 'DM Mono', ui-monospace, monospace";

type Audience = "venue" | "staff";

type Faq = { q: string; a: string };

const FAQS: Faq[] = [
  {
    q: "Tavoria è gratis?",
    a: "Sì — per lo staff è gratis per sempre. Per i locali è gratis fino a settembre 2026, poi €19 ogni volta che assumi qualcuno. Nessun abbonamento.",
  },
  {
    q: "Come funziona il QR?",
    a: "Stampi il poster con il QR del tuo locale dall'app e lo metti sulla porta. I passanti lo scansionano col telefono, si candidano in trenta secondi con un video, e tu vedi i video nell'app.",
  },
  {
    q: "I candidati sono verificati?",
    a: "Verifichiamo l'identità, il diritto al lavoro in Italia e l'esperienza dichiarata nel video. Vedi tutto prima di decidere.",
  },
  {
    q: "I miei dati sono al sicuro?",
    a: "Tutto su server in UE, conformi al GDPR. Puoi cancellare il tuo account in un clic. Dettagli completi nei nostri Termini.",
  },
  {
    q: "Chi c'è dietro Tavoria?",
    a: "K3Y Solutions S.r.l., azienda con sede a Milano. Siamo un piccolo team con esperienza sia in ristorazione che in tech.",
  },
  {
    q: "Posso usare Tavoria fuori Milano?",
    a: "Per ora siamo concentrati su Milano per costruire una rete densa di locali e personale. L'espansione ad altre città italiane è prevista entro fine 2026.",
  },
];

export default function Home() {
  const [audience, setAudience] = useState<Audience>("venue");
  const [openFaq, setOpenFaq] = useState<number>(0);

  const isVenue = audience === "venue";

  const tabStyle = (active: boolean): CSSProperties => ({
    background: active ? "#0E1A24" : "transparent",
    color: active ? "#F7F4EE" : "#46505A",
    border: "none",
    padding: "11px 24px",
    borderRadius: 999,
    fontFamily: FONT_SANS,
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    transition: "all .2s",
  });

  return (
    <div
      style={{
        background: "#F7F4EE",
        color: "#0E1A24",
        fontFamily: FONT_SANS,
        WebkitFontSmoothing: "antialiased",
        overflowX: "hidden",
      }}
    >
      {/* Keyframes for the floating "TIME TO HIRE" card + green pulse dot */}
      <style jsx global>{`
        @keyframes tvPulse {
          0% { transform: scale(1); opacity: .9; }
          70% { transform: scale(2.6); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes tvFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* NAV */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "saturate(140%) blur(14px)",
          WebkitBackdropFilter: "saturate(140%) blur(14px)",
          background: "rgba(247,244,238,0.78)",
          borderBottom: "1px solid rgba(14,26,36,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "14px clamp(20px, 5vw, 40px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <a
            href="#top"
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 27,
              color: "#0E1A24",
              textDecoration: "none",
              letterSpacing: "-.01em",
            }}
          >
            Tavoria<span style={{ color: "#F0531C" }}>.</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
              <a href="#venues" style={{ fontSize: 15, color: "#46505A", textDecoration: "none", fontWeight: 500 }}>
                Per i locali
              </a>
              <a href="#staff" style={{ fontSize: 15, color: "#46505A", textDecoration: "none", fontWeight: 500 }}>
                Per lo staff
              </a>
              <a href="#pricing" style={{ fontSize: 15, color: "#46505A", textDecoration: "none", fontWeight: 500 }}>
                Prezzi
              </a>
              <a href="#faq" style={{ fontSize: 15, color: "#46505A", textDecoration: "none", fontWeight: 500 }}>
                FAQ
              </a>
            </div>
            <a
              href="https://app.tavoriapp.com"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "#0E1A24",
                color: "#F7F4EE",
                padding: "10px 18px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Apri l&apos;app <span style={{ fontSize: 13 }}>↗</span>
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header
        id="top"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(48px, 7vw, 84px) clamp(20px, 5vw, 40px) clamp(40px, 6vw, 72px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "clamp(36px, 5vw, 72px)",
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1 1 440px", minWidth: 300 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontFamily: FONT_MONO,
                fontSize: 12,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "#46505A",
                border: "1px solid rgba(14,26,36,0.12)",
                padding: "7px 14px",
                borderRadius: 999,
                marginBottom: 26,
              }}
            >
              <span style={{ position: "relative", width: 7, height: 7 }}>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background: "#1F9D6B",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background: "#1F9D6B",
                    animation: "tvPulse 2.4s ease-out infinite",
                  }}
                />
              </span>
              Assunzioni hospitality · Attivo a Milano
            </div>
            <h1
              style={{
                fontFamily: FONT_SERIF,
                fontWeight: 400,
                fontSize: "clamp(44px, 6.4vw, 82px)",
                lineHeight: 0.98,
                letterSpacing: "-.015em",
                margin: "0 0 22px",
                color: "#0E1A24",
              }}
            >
              Personale per sala, bar e cucina.{" "}
              <span style={{ fontStyle: "italic", color: "#F0531C" }}>
                Pronto in 24&nbsp;ore.
              </span>
            </h1>
            <p
              style={{
                fontSize: "clamp(17px, 2vw, 21px)",
                lineHeight: 1.55,
                color: "#46505A",
                maxWidth: 540,
                margin: "0 0 34px",
              }}
            >
              Pubblica un turno in 2 minuti. I candidati scansionano un QR sulla
              tua porta, registrano un video di 30 secondi e assumi entro la
              giornata. Niente CV. Niente agenzie. Niente trattenuta del 20%.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 26 }}>
              <a
                href="https://app.tavoriapp.com/signup?role=venue"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  background: "#F0531C",
                  color: "#fff",
                  border: "none",
                  padding: "17px 30px",
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 17,
                  textDecoration: "none",
                  boxShadow: "0 12px 28px -10px rgba(240,83,28,0.6)",
                }}
              >
                Sono un locale <span>→</span>
              </a>
              <a
                href="https://app.tavoriapp.com/signup?role=worker"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  background: "transparent",
                  color: "#0E1A24",
                  border: "1px solid rgba(14,26,36,0.2)",
                  padding: "17px 28px",
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 17,
                  textDecoration: "none",
                }}
              >
                Cerco lavoro <span>→</span>
              </a>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px 20px",
                fontFamily: FONT_MONO,
                fontSize: 12.5,
                letterSpacing: ".04em",
                color: "#5C6670",
                textTransform: "uppercase",
              }}
            >
              <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                <span style={{ color: "#1F9D6B" }}>✓</span> Gratis per i locali fino a settembre 2026
              </span>
              <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                <span style={{ color: "#1F9D6B" }}>✓</span> Sempre gratis per lo staff
              </span>
              <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                <span style={{ color: "#1F9D6B" }}>✓</span> GDPR · server UE
              </span>
            </div>
          </div>

          {/* HERO MOCKUP */}
          <div
            style={{
              flex: "1 1 360px",
              minWidth: 300,
              display: "flex",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 300,
                maxWidth: "100%",
                background: "#FFFFFF",
                border: "1px solid rgba(14,26,36,0.1)",
                borderRadius: 30,
                padding: 18,
                boxShadow: "0 40px 80px -32px rgba(14,26,36,0.4)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  color: "#5C6670",
                  marginBottom: 14,
                  letterSpacing: ".06em",
                }}
              >
                <span>CANDIDATI · 3</span>
                <span style={{ color: "#1F9D6B" }}>● LIVE</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "#F7F4EE",
                    borderRadius: 16,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      background: "#0E1A24",
                      color: "#F7F4EE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: FONT_SERIF,
                      fontSize: 20,
                      flex: "none",
                    }}
                  >
                    A
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>Alessia, 24</div>
                    <div style={{ fontSize: 12.5, color: "#5C6670" }}>
                      Cameriera · Brera · 3 anni
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 10.5,
                      background: "#0E1A24",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: 7,
                    }}
                  >
                    ▶ 0:28
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "#F7F4EE",
                    borderRadius: 16,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      background: "#F0531C",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: FONT_SERIF,
                      fontSize: 20,
                      flex: "none",
                    }}
                  >
                    M
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>Matteo, 28</div>
                    <div style={{ fontSize: 12.5, color: "#5C6670" }}>
                      Barman · Navigli
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 10.5,
                      background: "#0E1A24",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: 7,
                    }}
                  >
                    ▶ 0:24
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    background: "#1F9D6B",
                    border: "none",
                    borderRadius: 16,
                    padding: "13px 14px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.22)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: FONT_SERIF,
                        fontSize: 20,
                      }}
                    >
                      S
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: "#fff" }}>
                        Sofia, 22 · Assunta
                      </div>
                      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.85)" }}>
                        Inizia stasera, 19:00
                      </div>
                    </div>
                  </div>
                  <span style={{ color: "#fff", fontSize: 18 }}>✓</span>
                </div>
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -14,
                left: 8,
                background: "#0E1A24",
                color: "#F7F4EE",
                borderRadius: 14,
                padding: "12px 16px",
                boxShadow: "0 20px 40px -16px rgba(14,26,36,0.5)",
                animation: "tvFloat 5s ease-in-out infinite",
              }}
            >
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  letterSpacing: ".1em",
                  color: "#F0531C",
                }}
              >
                TEMPO ASSUNZIONE
              </div>
              <div style={{ fontFamily: FONT_SERIF, fontSize: 30, lineHeight: 1 }}>
                24h
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* SOCIAL PROOF / STATS */}
      <section
        style={{
          borderTop: "1px solid rgba(14,26,36,0.08)",
          borderBottom: "1px solid rgba(14,26,36,0.08)",
          background: "rgba(14,26,36,0.015)",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "34px clamp(20px, 5vw, 40px)",
          }}
        >
          <p
            style={{
              textAlign: "center",
              fontFamily: FONT_MONO,
              fontSize: 12,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "#5C6670",
              margin: "0 0 26px",
            }}
          >
            Già scelto dai locali di Milano
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 20,
              textAlign: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: "clamp(34px, 4.5vw, 52px)",
                  lineHeight: 1,
                  color: "#0E1A24",
                }}
              >
                24h
              </div>
              <div style={{ fontSize: 13, color: "#5C6670", marginTop: 6 }}>
                Tempo medio di assunzione
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: "clamp(34px, 4.5vw, 52px)",
                  lineHeight: 1,
                  color: "#0E1A24",
                }}
              >
                30s
              </div>
              <div style={{ fontSize: 13, color: "#5C6670", marginTop: 6 }}>
                Per candidarsi, in video
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: "clamp(34px, 4.5vw, 52px)",
                  lineHeight: 1,
                  color: "#F0531C",
                }}
              >
                0%
              </div>
              <div style={{ fontSize: 13, color: "#5C6670", marginTop: 6 }}>
                Commissioni d&apos;agenzia
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: "clamp(34px, 4.5vw, 52px)",
                  lineHeight: 1,
                  color: "#0E1A24",
                }}
              >
                €0
              </div>
              <div style={{ fontSize: 13, color: "#5C6670", marginTop: 6 }}>
                Per lo staff, per sempre
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="venues"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding:
            "clamp(64px, 9vw, 116px) clamp(20px, 5vw, 40px) clamp(40px, 6vw, 64px)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: 680,
            margin: "0 auto clamp(36px, 5vw, 56px)",
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 12,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "#F0531C",
              marginBottom: 16,
            }}
          >
            Come funziona
          </div>
          <h2
            style={{
              fontFamily: FONT_SERIF,
              fontWeight: 400,
              fontSize: "clamp(34px, 5vw, 62px)",
              lineHeight: 1.02,
              letterSpacing: "-.01em",
              margin: "0 0 14px",
            }}
          >
            Tre passaggi. <span style={{ fontStyle: "italic" }}>Niente agenzia.</span>
          </h2>
          <p
            style={{
              fontSize: "clamp(16px, 1.8vw, 19px)",
              color: "#46505A",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Niente settimane di colloqui. Niente agenzie che si prendono il venti
            per cento. Solo persone reali che vogliono lavorare — oggi.
          </p>
        </div>

        {/* TOGGLE */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "clamp(34px, 5vw, 52px)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              background: "rgba(14,26,36,0.05)",
              border: "1px solid rgba(14,26,36,0.08)",
              borderRadius: 999,
              padding: 5,
              gap: 4,
            }}
          >
            <button onClick={() => setAudience("venue")} style={tabStyle(isVenue)}>
              Per i locali
            </button>
            <button onClick={() => setAudience("staff")} style={tabStyle(!isVenue)}>
              Per lo staff
            </button>
          </div>
        </div>

        {isVenue ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "clamp(16px, 2vw, 24px)",
              }}
            >
              {/* V1 */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(14,26,36,0.09)",
                  borderRadius: 22,
                  padding: 22,
                  boxShadow: "0 1px 2px rgba(14,26,36,0.04)",
                }}
              >
                <div
                  style={{
                    height: 188,
                    background: "#F7F4EE",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 22,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 10.5,
                      letterSpacing: ".1em",
                      color: "#5C6670",
                    }}
                  >
                    NUOVO TURNO
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: "#5C6670" }}>Ruolo</span>
                      <span style={{ fontWeight: 600 }}>Cameriere · sala</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: "#5C6670" }}>Quando</span>
                      <span style={{ fontWeight: 600 }}>Stasera · 19–24</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: "#5C6670" }}>Paga</span>
                      <span style={{ fontWeight: 600, color: "#0E1A24" }}>
                        €12/h · netto
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        background: "#F0531C",
                        color: "#fff",
                        fontSize: 12.5,
                        fontWeight: 600,
                        padding: "8px 14px",
                        borderRadius: 999,
                      }}
                    >
                      Pubblica →
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 10,
                        color: "#5C6670",
                      }}
                    >
                      2 MIN · NIENTE CV
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: ".1em",
                    color: "#F0531C",
                    marginBottom: 8,
                  }}
                >
                  PASSAGGIO 01
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
                  Pubblica un turno
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.55,
                    color: "#5C6670",
                    margin: 0,
                  }}
                >
                  In due minuti. Indica il ruolo, le ore, la paga. Niente CV,
                  niente burocrazia, niente agenzie.
                </p>
              </div>

              {/* V2 */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(14,26,36,0.09)",
                  borderRadius: 22,
                  padding: 22,
                  boxShadow: "0 1px 2px rgba(14,26,36,0.04)",
                }}
              >
                <div
                  style={{
                    height: 188,
                    background: "#0E1A24",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 22,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 10.5,
                      letterSpacing: ".18em",
                      color: "#F0531C",
                    }}
                  >
                    CERCASI STAFF
                  </div>
                  <div
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 14,
                      background: "#F7F4EE",
                      position: "relative",
                      padding: 9,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 9,
                        left: 9,
                        width: 20,
                        height: 20,
                        border: "4px solid #0E1A24",
                        borderRadius: 5,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 9,
                        right: 9,
                        width: 20,
                        height: 20,
                        border: "4px solid #0E1A24",
                        borderRadius: 5,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 9,
                        left: 9,
                        width: 20,
                        height: 20,
                        border: "4px solid #0E1A24",
                        borderRadius: 5,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 14,
                        right: 14,
                        width: 11,
                        height: 11,
                        background: "#F0531C",
                        borderRadius: 3,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 34,
                        left: 34,
                        width: 8,
                        height: 8,
                        background: "#0E1A24",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 46,
                        left: 46,
                        width: 8,
                        height: 8,
                        background: "#0E1A24",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 9.5,
                      letterSpacing: ".16em",
                      color: "#F7F4EE",
                    }}
                  >
                    TAVORIA · MILANO
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: ".1em",
                    color: "#F0531C",
                    marginBottom: 8,
                  }}
                >
                  PASSAGGIO 02
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
                  Stampa il QR
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.55,
                    color: "#5C6670",
                    margin: 0,
                  }}
                >
                  Mettilo sulla porta o sul bancone. I passanti lo scansionano
                  col telefono e si candidano in trenta secondi con un video.
                </p>
              </div>

              {/* V3 */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(14,26,36,0.09)",
                  borderRadius: 22,
                  padding: 22,
                  boxShadow: "0 1px 2px rgba(14,26,36,0.04)",
                }}
              >
                <div
                  style={{
                    height: 188,
                    background: "#F7F4EE",
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 22,
                    display: "flex",
                    flexDirection: "column",
                    gap: 9,
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "#fff",
                      borderRadius: 13,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: "#0E1A24",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: FONT_SERIF,
                      }}
                    >
                      A
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Alessia, 24</div>
                      <div style={{ fontSize: 11.5, color: "#5C6670" }}>
                        Cameriera · Brera
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 9.5,
                        background: "#0E1A24",
                        color: "#fff",
                        padding: "3px 7px",
                        borderRadius: 6,
                      }}
                    >
                      ▶0:28
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "#1F9D6B",
                      borderRadius: 13,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.25)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: FONT_SERIF,
                      }}
                    >
                      S
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>
                        Sofia, 22
                      </div>
                      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)" }}>
                        Assunta · stasera 19:00
                      </div>
                    </div>
                    <span style={{ color: "#fff" }}>✓</span>
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: ".1em",
                    color: "#F0531C",
                    marginBottom: 8,
                  }}
                >
                  PASSAGGIO 03
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
                  Vedi i candidati
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.55,
                    color: "#5C6670",
                    margin: 0,
                  }}
                >
                  Apri l&apos;app. Guarda i video di chi si è candidato. Premi
                  &ldquo;Assumi&rdquo; su chi ti convince. Subito disponibili.
                </p>
              </div>
            </div>
            <div
              id="staff"
              style={{
                textAlign: "center",
                marginTop: "clamp(34px, 4vw, 48px)",
              }}
            >
              <a
                href="https://app.tavoriapp.com/signup?role=venue"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  background: "#0E1A24",
                  color: "#F7F4EE",
                  padding: "16px 30px",
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 16,
                  textDecoration: "none",
                }}
              >
                Pubblica il tuo primo turno — gratis <span>→</span>
              </a>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "clamp(16px, 2vw, 24px)",
              }}
            >
              {/* S1 */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(14,26,36,0.09)",
                  borderRadius: 22,
                  padding: 22,
                  boxShadow: "0 1px 2px rgba(14,26,36,0.04)",
                }}
              >
                <div
                  style={{
                    height: 188,
                    background: "#0E1A24",
                    borderRadius: 16,
                    position: "relative",
                    marginBottom: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      width: 22,
                      height: 22,
                      borderTop: "3px solid #F0531C",
                      borderLeft: "3px solid #F0531C",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      width: 22,
                      height: 22,
                      borderTop: "3px solid #F0531C",
                      borderRight: "3px solid #F0531C",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 12,
                      left: 12,
                      width: 22,
                      height: 22,
                      borderBottom: "3px solid #F0531C",
                      borderLeft: "3px solid #F0531C",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 12,
                      right: 12,
                      width: 22,
                      height: 22,
                      borderBottom: "3px solid #F0531C",
                      borderRight: "3px solid #F0531C",
                    }}
                  />
                  <div
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 12,
                      background: "#F7F4EE",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 30,
                      fontFamily: FONT_MONO,
                      fontSize: 10,
                      letterSpacing: ".14em",
                      color: "#F7F4EE",
                    }}
                  >
                    INQUADRA IL QR
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: ".1em",
                    color: "#F0531C",
                    marginBottom: 8,
                  }}
                >
                  PASSAGGIO 01
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
                  Scansiona un QR
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: "#5C6670", margin: 0 }}>
                  Lo trovi sulla porta dei locali a Milano. Si apre Tavoria col
                  profilo del locale e i turni disponibili.
                </p>
              </div>

              {/* S2 */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(14,26,36,0.09)",
                  borderRadius: 22,
                  padding: 22,
                  boxShadow: "0 1px 2px rgba(14,26,36,0.04)",
                }}
              >
                <div
                  style={{
                    height: 188,
                    background: "#F7F4EE",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 22,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: FONT_MONO,
                        fontSize: 11,
                        color: "#F0531C",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: "#F0531C",
                        }}
                      />
                      REC 0:24
                    </span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#5C6670" }}>
                      D 2/3
                    </span>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: FONT_SERIF,
                        fontSize: 20,
                        lineHeight: 1.2,
                        color: "#0E1A24",
                      }}
                    >
                      &ldquo;Da quanto tempo
                      <br />
                      lavori in sala?&rdquo;
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      fontFamily: FONT_MONO,
                      fontSize: 10,
                      letterSpacing: ".14em",
                      color: "#5C6670",
                    }}
                  >
                    30 SECONDI · MOSTRATI
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: ".1em",
                    color: "#F0531C",
                    marginBottom: 8,
                  }}
                >
                  PASSAGGIO 02
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
                  Trenta secondi di video
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: "#5C6670", margin: 0 }}>
                  Niente CV. Il locale vede la tua faccia, sente la tua voce e
                  capisce chi sei prima ancora di parlarti.
                </p>
              </div>

              {/* S3 */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(14,26,36,0.09)",
                  borderRadius: 22,
                  padding: 22,
                  boxShadow: "0 1px 2px rgba(14,26,36,0.04)",
                }}
              >
                <div
                  style={{
                    height: 188,
                    background: "#F7F4EE",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 22,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 999,
                        background: "#1F9D6B",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                      }}
                    >
                      ✓
                    </div>
                    <div style={{ fontFamily: FONT_SERIF, fontSize: 22, color: "#0E1A24" }}>
                      Sei assunto.
                    </div>
                    <div style={{ fontSize: 13, color: "#5C6670" }}>
                      Inizi stasera alle 19:00
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: 12.5, color: "#5C6670" }}>
                      Cinelandia · Milano
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 10,
                        color: "#1F9D6B",
                      }}
                    >
                      WhatsApp →
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: ".1em",
                    color: "#F0531C",
                    marginBottom: 8,
                  }}
                >
                  PASSAGGIO 03
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
                  Assunto in giornata
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: "#5C6670", margin: 0 }}>
                  Se ti scelgono, ti scrivono direttamente su WhatsApp. Inizi il
                  turno la stessa giornata o quella dopo.
                </p>
              </div>
            </div>
            <div
              style={{
                textAlign: "center",
                marginTop: "clamp(34px, 4vw, 48px)",
              }}
            >
              <a
                href="https://app.tavoriapp.com/signup?role=worker"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  background: "#0E1A24",
                  color: "#F7F4EE",
                  padding: "16px 30px",
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 16,
                  textDecoration: "none",
                }}
              >
                Crea il mio profilo — gratis <span>→</span>
              </a>
            </div>
          </>
        )}
      </section>

      {/* BENEFITS */}
      <section style={{ background: "#0E1A24", color: "#F7F4EE" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "clamp(64px, 9vw, 112px) clamp(20px, 5vw, 40px)",
          }}
        >
          <div style={{ maxWidth: 620, marginBottom: "clamp(36px, 5vw, 56px)" }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "#F0531C",
                marginBottom: 16,
              }}
            >
              Perché Tavoria
            </div>
            <h2
              style={{
                fontFamily: FONT_SERIF,
                fontWeight: 400,
                fontSize: "clamp(34px, 5vw, 60px)",
                lineHeight: 1.02,
                letterSpacing: "-.01em",
                margin: 0,
              }}
            >
              Costruito per come l&apos;hospitality{" "}
              <span style={{ fontStyle: "italic", color: "#F0531C" }}>
                assume davvero.
              </span>
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "clamp(16px, 2vw, 22px)",
            }}
          >
            <div
              style={{
                border: "1px solid rgba(247,244,238,0.14)",
                borderRadius: 20,
                padding: 26,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 38,
                  color: "#F0531C",
                  marginBottom: 14,
                }}
              >
                ↯
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 8px" }}>
                Assumi in ore, non in settimane
              </h3>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: "rgba(247,244,238,0.7)",
                  margin: 0,
                }}
              >
                Il tempo medio dalla pubblicazione all&apos;assunzione è di 24
                ore. Copri il turno di stasera prima dell&apos;apertura.
              </p>
            </div>
            <div
              style={{
                border: "1px solid rgba(247,244,238,0.14)",
                borderRadius: 20,
                padding: 26,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 38,
                  color: "#F0531C",
                  marginBottom: 14,
                }}
              >
                ▶
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 8px" }}>
                Persone vere, non carta
              </h3>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: "rgba(247,244,238,0.7)",
                  margin: 0,
                }}
              >
                Trenta secondi di video ti dicono più di qualunque CV. Capisci
                l&apos;energia prima ancora di rispondere.
              </p>
            </div>
            <div
              style={{
                border: "1px solid rgba(247,244,238,0.14)",
                borderRadius: 20,
                padding: 26,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 38,
                  color: "#F0531C",
                  marginBottom: 14,
                }}
              >
                ⊘
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 8px" }}>
                Tieniti il tuo 20%
              </h3>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: "rgba(247,244,238,0.7)",
                  margin: 0,
                }}
              >
                Niente commissioni d&apos;agenzia, mai. Paghi €19 solo quando
                assumi davvero — e fino a settembre 2026 nemmeno quello.
              </p>
            </div>
            <div
              style={{
                border: "1px solid rgba(247,244,238,0.14)",
                borderRadius: 20,
                padding: 26,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 38,
                  color: "#F0531C",
                  marginBottom: 14,
                }}
              >
                ⛨
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 8px" }}>
                Verificati, ogni volta
              </h3>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: "rgba(247,244,238,0.7)",
                  margin: 0,
                }}
              >
                Identità e diritto al lavoro controllati prima di decidere. Vedi
                tutto in chiaro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(64px, 9vw, 112px) clamp(20px, 5vw, 40px)",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 13,
              letterSpacing: ".1em",
              color: "#F0531C",
              marginBottom: 22,
            }}
          >
            ★★★★★ &nbsp;5.0 / 5
          </div>
          <blockquote
            style={{
              fontFamily: FONT_SERIF,
              fontWeight: 400,
              fontSize: "clamp(26px, 3.6vw, 44px)",
              lineHeight: 1.18,
              letterSpacing: "-.01em",
              margin: "0 0 28px",
              color: "#0E1A24",
            }}
          >
            &ldquo;24 ore dopo aver scaricato l&apos;app avevamo già assunto due
            camerieri. Niente CV, niente agenzie.{" "}
            <span style={{ fontStyle: "italic", color: "#F0531C" }}>
              Uno si è candidato passando davanti alla porta.
            </span>
            &rdquo;
          </blockquote>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                background: "#0E1A24",
                color: "#F7F4EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_SERIF,
                fontSize: 20,
              }}
            >
              M
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Marco Moroni</div>
              <div style={{ fontSize: 13.5, color: "#5C6670" }}>
                Cinelandia · Bistrot, 60 coperti · Milano
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        style={{
          background: "rgba(14,26,36,0.025)",
          borderTop: "1px solid rgba(14,26,36,0.08)",
          borderBottom: "1px solid rgba(14,26,36,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "clamp(64px, 9vw, 112px) clamp(20px, 5vw, 40px)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: 620,
              margin: "0 auto clamp(36px, 5vw, 52px)",
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "#F0531C",
                marginBottom: 16,
              }}
            >
              Prezzi
            </div>
            <h2
              style={{
                fontFamily: FONT_SERIF,
                fontWeight: 400,
                fontSize: "clamp(34px, 5vw, 60px)",
                lineHeight: 1.02,
                margin: "0 0 14px",
              }}
            >
              Trasparente. <span style={{ fontStyle: "italic" }}>Niente sorprese.</span>
            </h2>
            <p
              style={{
                fontSize: "clamp(16px, 1.8vw, 19px)",
                color: "#46505A",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              Lo staff non paga mai. I locali pagano solo quando assumono — e
              fino a settembre 2026, neanche quello.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "clamp(16px, 2vw, 24px)",
              maxWidth: 840,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(14,26,36,0.09)",
                borderRadius: 22,
                padding: 30,
                boxShadow: "0 1px 2px rgba(14,26,36,0.04)",
              }}
            >
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "#5C6670",
                  marginBottom: 14,
                }}
              >
                Per lo staff
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span style={{ fontFamily: FONT_SERIF, fontSize: 54, lineHeight: 1 }}>
                  €0
                </span>
                <span style={{ fontSize: 15, color: "#5C6670" }}>per sempre</span>
              </div>
              <p
                style={{
                  fontSize: 14.5,
                  color: "#5C6670",
                  margin: "0 0 20px",
                  lineHeight: 1.5,
                }}
              >
                Nessun costo nascosto. Mai. Trovi solo lavoro.
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", gap: 10, fontSize: 14.5 }}>
                  <span style={{ color: "#1F9D6B" }}>✓</span> Profilo gratuito, sempre
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 14.5 }}>
                  <span style={{ color: "#1F9D6B" }}>✓</span> Candidatura video da 30 secondi
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 14.5 }}>
                  <span style={{ color: "#1F9D6B" }}>✓</span> Contatto diretto col locale
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 14.5 }}>
                  <span style={{ color: "#1F9D6B" }}>✓</span> Nessuna commissione, nessuna trattenuta
                </div>
              </div>
              <a
                href="https://app.tavoriapp.com/signup?role=worker"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "transparent",
                  color: "#0E1A24",
                  border: "1px solid rgba(14,26,36,0.2)",
                  padding: 14,
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: "none",
                }}
              >
                Crea il mio profilo
              </a>
            </div>
            <div
              style={{
                background: "#0E1A24",
                color: "#F7F4EE",
                borderRadius: 22,
                padding: 30,
                position: "relative",
                boxShadow: "0 30px 60px -28px rgba(14,26,36,0.5)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 22,
                  right: 22,
                  fontFamily: FONT_MONO,
                  fontSize: 10.5,
                  letterSpacing: ".08em",
                  background: "#F0531C",
                  color: "#fff",
                  padding: "5px 10px",
                  borderRadius: 999,
                }}
              >
                GRATIS FINO A SET 2026
              </span>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "rgba(247,244,238,0.6)",
                  marginBottom: 14,
                }}
              >
                Per i locali
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span style={{ fontFamily: FONT_SERIF, fontSize: 54, lineHeight: 1 }}>
                  €19
                </span>
                <span style={{ fontSize: 15, color: "rgba(247,244,238,0.7)" }}>
                  per assunzione
                </span>
              </div>
              <p
                style={{
                  fontSize: 14.5,
                  color: "rgba(247,244,238,0.7)",
                  margin: "0 0 20px",
                  lineHeight: 1.5,
                }}
              >
                Gratis fino a settembre 2026. Poi paghi solo quando assumi.
                Nessun abbonamento.
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", gap: 10, fontSize: 14.5 }}>
                  <span style={{ color: "#F0531C" }}>✓</span> Annunci illimitati
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 14.5 }}>
                  <span style={{ color: "#F0531C" }}>✓</span> Poster QR personalizzato
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 14.5 }}>
                  <span style={{ color: "#F0531C" }}>✓</span> Video da ogni candidato
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 14.5 }}>
                  <span style={{ color: "#F0531C" }}>✓</span> Identità + diritto al lavoro verificati
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 14.5 }}>
                  <span style={{ color: "#F0531C" }}>✓</span> Paghi solo quando assumi
                </div>
              </div>
              <a
                href="https://app.tavoriapp.com/signup?role=venue"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "#F0531C",
                  color: "#fff",
                  padding: 14,
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: "none",
                }}
              >
                Inizia gratis
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / FOUNDER */}
      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(64px, 9vw, 112px) clamp(20px, 5vw, 40px)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "clamp(36px, 5vw, 64px)",
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1 1 380px", minWidth: 300 }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "#F0531C",
                marginBottom: 16,
              }}
            >
              Dal settore
            </div>
            <h2
              style={{
                fontFamily: FONT_SERIF,
                fontWeight: 400,
                fontSize: "clamp(32px, 4.4vw, 54px)",
                lineHeight: 1.04,
                letterSpacing: "-.01em",
                margin: "0 0 20px",
              }}
            >
              Costruito da chi <span style={{ fontStyle: "italic" }}>conosce la sala.</span>
            </h2>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.6,
                color: "#46505A",
                margin: "0 0 16px",
              }}
            >
              Dopo anni nella ristorazione milanese, ho costruito Tavoria per
              togliere la frustrazione dall&apos;assunzione. Niente CV, niente
              settimane di ricerca, niente agenzie che si prendono il 20%.
            </p>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.6,
                color: "#46505A",
                margin: "0 0 24px",
              }}
            >
              Solo persone reali che vogliono lavorare oggi — viste in faccia,
              ascoltate con la propria voce. Un QR sulla porta, trenta secondi
              di video e una decisione presa dal proprietario, non da un
              algoritmo.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  background: "#0E1A24",
                  color: "#F7F4EE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT_SERIF,
                  fontSize: 18,
                }}
              >
                GS
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Greg Salvatico</div>
                <div style={{ fontSize: 13.5, color: "#5C6670" }}>
                  Fondatore · K3Y Solutions S.r.l. · Milano
                </div>
              </div>
            </div>
          </div>
          <div style={{ flex: "1 1 320px", minWidth: 280 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(14,26,36,0.09)",
                  borderRadius: 18,
                  padding: 22,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: 30,
                    color: "#1F9D6B",
                    marginBottom: 8,
                  }}
                >
                  ⛨
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  Conforme al GDPR
                </div>
                <div style={{ fontSize: 13.5, color: "#5C6670", lineHeight: 1.5 }}>
                  Tutti i dati su server UE.
                </div>
              </div>
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(14,26,36,0.09)",
                  borderRadius: 18,
                  padding: 22,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: 30,
                    color: "#1F9D6B",
                    marginBottom: 8,
                  }}
                >
                  ✓
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  Identità verificata
                </div>
                <div style={{ fontSize: 13.5, color: "#5C6670", lineHeight: 1.5 }}>
                  Identità e diritto al lavoro controllati.
                </div>
              </div>
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(14,26,36,0.09)",
                  borderRadius: 18,
                  padding: 22,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: 30,
                    color: "#1F9D6B",
                    marginBottom: 8,
                  }}
                >
                  ⌫
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  Cancella in un clic
                </div>
                <div style={{ fontSize: 13.5, color: "#5C6670", lineHeight: 1.5 }}>
                  I tuoi dati, sotto il tuo controllo.
                </div>
              </div>
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(14,26,36,0.09)",
                  borderRadius: 18,
                  padding: 22,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: 30,
                    color: "#1F9D6B",
                    marginBottom: 8,
                  }}
                >
                  ◷
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  Supporto reale
                </div>
                <div style={{ fontSize: 13.5, color: "#5C6670", lineHeight: 1.5 }}>
                  Un piccolo team a Milano, raggiungibile.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        style={{
          background: "rgba(14,26,36,0.025)",
          borderTop: "1px solid rgba(14,26,36,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 840,
            margin: "0 auto",
            padding: "clamp(64px, 9vw, 112px) clamp(20px, 5vw, 40px)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "clamp(34px, 5vw, 52px)" }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                letterSpacing: ".16em",
                textTransform: "uppercase",
                color: "#F0531C",
                marginBottom: 16,
              }}
            >
              FAQ
            </div>
            <h2
              style={{
                fontFamily: FONT_SERIF,
                fontWeight: 400,
                fontSize: "clamp(34px, 5vw, 58px)",
                lineHeight: 1.02,
                margin: 0,
              }}
            >
              Tutto quello che <span style={{ fontStyle: "italic" }}>vorresti sapere.</span>
            </h2>
          </div>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(14,26,36,0.09)",
              borderRadius: 22,
              overflow: "hidden",
            }}
          >
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={i}
                  style={{ borderBottom: "1px solid rgba(14,26,36,0.08)" }}
                >
                  <button
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      background: "transparent",
                      border: "none",
                      padding: "22px clamp(18px, 3vw, 28px)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: FONT_SANS,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "clamp(16px, 1.9vw, 18.5px)",
                        fontWeight: 600,
                        color: "#0E1A24",
                      }}
                    >
                      {f.q}
                    </span>
                    <span
                      style={{
                        fontSize: 24,
                        color: "#F0531C",
                        flex: "none",
                        lineHeight: 1,
                        display: "inline-block",
                        transform: open ? "rotate(45deg)" : "rotate(0deg)",
                        transition: "transform .28s ease",
                      }}
                    >
                      +
                    </span>
                  </button>
                  <div
                    style={{
                      maxHeight: open ? 260 : 0,
                      opacity: open ? 1 : 0,
                      overflow: "hidden",
                      transition: "max-height .38s ease, opacity .3s ease",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        padding: "0 clamp(18px, 3vw, 28px) 22px",
                        fontSize: 15.5,
                        lineHeight: 1.6,
                        color: "#5C6670",
                        maxWidth: 640,
                      }}
                    >
                      {f.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: "#0E1A24", color: "#F7F4EE" }}>
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "clamp(72px, 10vw, 128px) clamp(20px, 5vw, 40px)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 12,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "#F0531C",
              marginBottom: 20,
            }}
          >
            Pronto in 24 ore
          </div>
          <h2
            style={{
              fontFamily: FONT_SERIF,
              fontWeight: 400,
              fontSize: "clamp(38px, 6vw, 76px)",
              lineHeight: 1.0,
              letterSpacing: "-.015em",
              margin: "0 0 22px",
            }}
          >
            La tua prossima assunzione sta passando{" "}
            <span style={{ fontStyle: "italic", color: "#F0531C" }}>
              davanti alla porta
            </span>{" "}
            proprio adesso.
          </h2>
          <p
            style={{
              fontSize: "clamp(17px, 2vw, 20px)",
              color: "rgba(247,244,238,0.72)",
              lineHeight: 1.55,
              maxWidth: 560,
              margin: "0 auto 36px",
            }}
          >
            Pubblica un turno in due minuti. Stampa il QR. Assumi entro la
            giornata. Gratis per i locali fino a settembre 2026.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              justifyContent: "center",
            }}
          >
            <a
              href="https://app.tavoriapp.com/signup?role=venue"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                background: "#F0531C",
                color: "#fff",
                padding: "18px 34px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 17,
                textDecoration: "none",
                boxShadow: "0 14px 30px -10px rgba(240,83,28,0.7)",
              }}
            >
              Sono un locale <span>→</span>
            </a>
            <a
              href="https://app.tavoriapp.com/signup?role=worker"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                background: "transparent",
                color: "#F7F4EE",
                border: "1px solid rgba(247,244,238,0.28)",
                padding: "18px 32px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 17,
                textDecoration: "none",
              }}
            >
              Cerco lavoro <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0B141D", color: "rgba(247,244,238,0.7)" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "clamp(48px, 6vw, 72px) clamp(20px, 5vw, 40px) 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 36,
              justifyContent: "space-between",
              marginBottom: 48,
            }}
          >
            <div style={{ flex: "1 1 280px", maxWidth: 340 }}>
              <div
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 28,
                  color: "#F7F4EE",
                  marginBottom: 12,
                }}
              >
                Tavoria<span style={{ color: "#F0531C" }}>.</span>
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: "0 0 14px" }}>
                Personale per ristoranti, bar e hotel. Pronto in 24 ore.
              </p>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11.5,
                  letterSpacing: ".06em",
                  color: "rgba(247,244,238,0.45)",
                }}
              >
                MILANO · ITALIA
              </div>
            </div>
            <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
              <div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "rgba(247,244,238,0.45)",
                    marginBottom: 16,
                  }}
                >
                  Prodotto
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 11,
                    fontSize: 14.5,
                  }}
                >
                  <a href="#venues" style={{ color: "rgba(247,244,238,0.72)", textDecoration: "none" }}>
                    Per i locali
                  </a>
                  <a href="#staff" style={{ color: "rgba(247,244,238,0.72)", textDecoration: "none" }}>
                    Per lo staff
                  </a>
                  <a href="#pricing" style={{ color: "rgba(247,244,238,0.72)", textDecoration: "none" }}>
                    Prezzi
                  </a>
                  <a href="#faq" style={{ color: "rgba(247,244,238,0.72)", textDecoration: "none" }}>
                    FAQ
                  </a>
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    color: "rgba(247,244,238,0.45)",
                    marginBottom: 16,
                  }}
                >
                  Contatti
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 11,
                    fontSize: 14.5,
                  }}
                >
                  <a
                    href="mailto:hello@tavoriapp.com"
                    style={{ color: "rgba(247,244,238,0.72)", textDecoration: "none" }}
                  >
                    hello@tavoriapp.com
                  </a>
                  <a
                    href="https://wa.me/393331234567"
                    style={{ color: "rgba(247,244,238,0.72)", textDecoration: "none" }}
                  >
                    WhatsApp
                  </a>
                  <a
                    href="https://app.tavoriapp.com"
                    style={{ color: "rgba(247,244,238,0.72)", textDecoration: "none" }}
                  >
                    Apri l&apos;app ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(247,244,238,0.12)",
              paddingTop: 24,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
              color: "rgba(247,244,238,0.45)",
            }}
          >
            <span>© 2026 K3Y Solutions S.r.l. · Milano, Italia</span>
            <span style={{ display: "flex", gap: 18 }}>
              <a href="/terms" style={{ color: "rgba(247,244,238,0.45)", textDecoration: "none" }}>
                Privacy
              </a>
              <a href="/terms" style={{ color: "rgba(247,244,238,0.45)", textDecoration: "none" }}>
                Termini
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
