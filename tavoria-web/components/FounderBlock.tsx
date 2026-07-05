/**
 * Founder section — Greg as the hero.
 *
 * 40% portrait / 60% bio. Portrait is a tall navy-gradient panel with a
 * brass "GS" centered (placeholder for a real photo). Bio uses the
 * editorial serif for the opening line, then sans for body. A script
 * signature anchors the bottom.
 */

export default function FounderBlock() {
  return (
    <div className="grid items-stretch gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
      {/* Portrait */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="relative aspect-[4/5] w-full max-w-[360px] overflow-hidden rounded-[20px] bg-gradient-to-br from-navy via-[#102a44] to-[#0B1B2B] ring-1 ring-brass/30"
        >
          {/* Soft brass corner glow */}
          <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-brass/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-orange/20 blur-2xl" />

          {/* Monogram */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-serif font-medium leading-none text-brass"
              style={{ fontSize: "clamp(96px, 18vw, 168px)" }}
            >
              GS
            </span>
          </div>

          {/* Frame ornament */}
          <div className="absolute inset-4 rounded-[16px] border border-brass/15" />

          {/* Caption */}
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-brass/80">
              Greg Salvatico · 2026
            </p>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="flex flex-col justify-center">
        <p className="eyebrow mb-5">Fondatore</p>

        <p className="font-serif text-[28px] leading-[1.2] font-medium text-navy sm:text-[36px]">
          Costruito da chi
          <br />
          <em className="italic font-semibold">conosce il settore.</em>
        </p>

        <div className="mt-7 max-w-xl space-y-4 text-[15px] leading-[1.65] text-ink/80 sm:text-base">
          <p>
            Dopo anni nella ristorazione a Milano, ho fondato Tavoria per
            togliere la frustrazione dell&apos;assunzione. Niente CV, niente
            settimane di ricerca, niente agenzie che prendono il 20%.
          </p>
          <p>
            Solo persone reali che vogliono lavorare oggi, viste in faccia,
            sentite con la propria voce. Un QR sulla porta, trenta secondi di
            video, e una decisione fatta dal proprietario — non da un
            algoritmo.
          </p>
        </div>

        {/* Signature */}
        <div className="mt-8 flex items-end gap-6">
          <span className="font-script text-[42px] leading-none text-navy">
            Greg Salvatico
          </span>
        </div>

        {/* Contact */}
        <div className="mt-8 flex flex-col gap-2 text-sm text-mute sm:flex-row sm:items-center sm:gap-6">
          <a
            href="mailto:hello@tavoriapp.com"
            className="link-underline group inline-flex items-center text-navy"
          >
            <span className="font-medium">hello@tavoriapp.com</span>
          </a>
          <span className="hidden text-brass/50 sm:inline">·</span>
          <span className="text-mute/80 tnum">
            K3Y Solutions S.r.l. · Milano
          </span>
        </div>
      </div>
    </div>
  );
}
