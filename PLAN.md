# Gigi — Build Plan

## Product surfaces — DECIDED

1. **Gigi Worker (mobile app)** — primary product, built first. iOS + Android via React Native (Expo).
2. **Gigi Venue (mobile app)** — built second. Venue managers post shifts, swipe candidates, message via WhatsApp deeplink — all from their phone.
3. **Marketing landing page** (`gigi-venue` Next.js, already built) — public website to capture early signups before launch. Hosted on Vercel.
4. **Venue web dashboard** — only if real venues demand it later. Not a day-one priority.

## Phase 0 — Foundation (this week)

Goal: get the marketing landing page deployed AND the worker mobile app running on Greg's phone via Expo Go.

### Today's steps

1. ✅ Mac setup confirmed (Node v26, Cursor 3.4.20, iTerm2)
2. ✅ Project folder created at `~/Desktop/gigi`
3. ✅ Marketing landing page scaffolded (`gigi-venue`)
4. ✅ Landing page running locally at http://localhost:3000
5. ⏳ Install Expo Go on Greg's phone (App Store / Play Store, free)
6. ⏳ Scaffold Expo project `gigi-worker`
7. ⏳ See the mobile app running on Greg's phone via QR scan

### Step-by-step for Greg (run in iTerm2)

```bash
cd ~/Desktop/gigi
npx create-next-app@latest gigi-venue --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm
```

When it asks "Would you like to use Turbopack?" — pick **Yes**.

Once that finishes (2–5 min):

```bash
cd gigi-venue
npm run dev
```

Open http://localhost:3000 in your browser. You should see the default Next.js welcome page.

Stop the server with `Ctrl+C` once you've seen it work.

### Then

Open the folder in Cursor:

```bash
cursor ~/Desktop/gigi
```

That gives Claude full access to the codebase inside Cursor.

---

## Phase 1 — Worker mobile app skeleton (next 2 weeks)

- Expo project running on Greg's phone via Expo Go
- Welcome screen + QR scan flow
- Phone-number signup (no password)
- Browse shift cards (mock data)
- Deploy to TestFlight / Play Store internal track

## Phase 2 — Venue mobile app (June 2026)

- Second Expo project, shared design system with Worker app
- Venue manager creates a shift
- Swipe-to-shortlist candidates (Tinder-style)
- WhatsApp deeplink to message candidate

## Phase 3 — Backend wiring (June 2026)

- Supabase auth (phone OTP)
- Database schema: venues, workers, shifts, applications
- Real-time updates (worker applies → venue gets push)
- File storage for candidate videos

## Phase 3.5 — Landing page evolution

- Polish marketing site (already scaffolded)
- "Download the app" buttons → App Store / Play Store links
- Capture early venue signups
- Deploy to Vercel with gigi.app domain

## Phase 4 — Coached video infra (June 2026)

- Pre-record the prompt videos (Greg or actor): 19 questions × 5 languages × 2 verticals = 190 videos
- Language detection + fluency rating (Whisper + GPT call)
- Storage in Supabase

## Phase 5 — Milan launch (July 2026)

- QR stickers printed
- Ambassador rollout (Greg in Milan, family in Bordeaux + Ibiza)
- First 50 venues onboarded
- Press / social push

## Phase 6 — Gigi Retail (Oct–Nov 2026)

- Same codebase, new theme/colors/copy
- Open the retail vertical (shops, beauty, etc.)

---

## DON'T DO list (from prior chat — still applies)

- ❌ Watch YouTube React Native tutorials — we learn by building
- ❌ Spend hours customizing Cursor — defaults are fine
- ❌ Rename the brand again
- ❌ Add more verticals before HORECA is launched
