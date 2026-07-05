# Gigi — Product Spec

## The core experience

### Worker side (mobile app)

1. **Find a venue** — scan a QR sticker on a venue's door OR browse open shifts in the app
2. **Apply in 60 seconds** — create account (phone + name), record a 30s coached video, submit
3. **Get matched** — push notification when a venue is interested
4. **Chat** — message the venue inside the app (or WhatsApp deeplink)

### Worker profile contents

| Slot          | Required | Max | Notes                                                  |
| ------------- | -------- | --- | ------------------------------------------------------ |
| Profile photo | ✅       | 1   | Auto-cropped to square, used everywhere                |
| Extra photos  | ⬜       | 4   | Action shots, work environment, attire, smile          |
| Coached video | ✅       | 1   | The 30-second guided intro — primary video everywhere  |
| Extra videos  | ⬜       | 2   | Free-form (longer pitch, prior work, language demo)    |

Total cap per candidate: **5 photos + 3 videos**. Anything beyond that is rejected at upload time.

### Venue side (mobile app)

1. **Post a shift** — what role, when, how much, in 3 taps
2. **Review candidates one at a time** — full-screen card stack of applicants
   - Photo (full-bleed)
   - Name, age, nationality
   - Languages (with AI-rated fluency: A1–C2)
   - 30-second video (auto-plays muted, tap to unmute)
   - Quick info: "available now", distance, past experience
3. **Four actions per candidate** (no swipe — explicit buttons, no misclicks)
   - ❌ **Decline** — candidate removed from this shift's pile, no notification
   - ⭐ **Star** *(paid subscription only)* — save to "Shortlist" tab to revisit later. Free venues see this button with a lock icon; tapping shows an upgrade prompt.
   - 🎥 **Request interview** — sends a video-call request. Candidate gets push: "[Venue] wants a 5-min interview." Candidate accepts → Jitsi link generated → call starts in browser.
   - ✅ **Hire** — instant offer. Candidate gets push: "🎉 [Venue] wants to hire you for [shift]. Tap to confirm." Candidate confirms → shift is booked, both parties get details.
4. **Message anytime** — open chat with candidate (WhatsApp deeplink in Phase 1, in-app messaging in Phase 2)

## Content moderation

Every photo and video uploaded to Gigi (worker profile photos, coached videos, extra videos, venue photos) passes through a 4-layer moderation pipeline before it goes live.

### Layer 1 — On-device pre-check (iOS only, free)

Uses Apple's `CommunicationSafety` / `Vision` framework to do a quick on-device scan for explicit nudity. Runs in <100ms, no network. Blocks obvious bad content before it ever leaves the worker's phone.

### Layer 2 — Server-side AI moderation (Sightengine)

When the file lands on the backend (Supabase Storage), it's sent to **Sightengine** for a deeper check. Sightengine returns confidence scores (0-1) for each category:

| Category | Action if score > 0.9 | Action if 0.6 – 0.9 |
|---|---|---|
| Explicit nudity / sexual | Auto-reject | Queue for human review |
| Suggestive / partial nudity | Queue for human review | Accept (tuned for hospitality — uniforms, swimwear at beach clubs) |
| Violence / gore | Auto-reject | Auto-reject |
| Hate symbols | Auto-reject | Auto-reject |
| Drugs / paraphernalia | Auto-reject | Queue for human review |
| Visible PII (phone, address in image) | Auto-reject | Queue for human review |

Cost: ~$0.001 per photo, ~$0.01 per minute of video. At 10k workers × (5 photos + 3 videos avg) = ~$350/mo.

### Layer 3 — Report button

Every candidate card and every venue card has a small "•••" menu with a "Report this profile" option. Both workers and venues can report. Reports trigger an immediate human review.

### Layer 4 — Human moderation queue

Anything queued or reported gets reviewed by a Gigi moderator (initially Greg, later outsourced) within 24h. Approved → goes live. Rejected → worker/venue is notified, content removed, repeat offenders banned.

### Worker-facing UX

- Tap "Upload photo" → small "Checking…" spinner (~1.5s)
- 95% of the time → ✅ accepted, photo appears in the slot
- 5% borderline → friendly message: "We're reviewing this — it'll be live in a few hours" (queued)
- Rejected → "This photo can't be used on Gigi. Try a different one." (no reason given to avoid teaching workarounds)

### Compliance

Required for App Store guideline 1.2 (User Generated Content). Without it, Gigi can't ship to the App Store. Built-in from day one.

## Pay format

Pay can be quoted in two ways depending on the contract type:

| Contract type           | Pay format example   |
| ----------------------- | -------------------- |
| ONE-OFF SHIFT           | €14/h                |
| ONE WEEK / ONE MONTH    | €14/h or €450/week   |
| SEASONAL                | €14/h or fixed total |
| PART-TIME (permanent)   | €14/h or €700/mo     |
| FULL-TIME (permanent)   | €1,300/mo            |
| TRIAL→FT                | €14/h trial, €1,300/mo once permanent |

Workers see the headline number on the card (e.g. "€1,300/mo"). The full venue profile shows the breakdown plus benefits (tips, meals, transport, accommodation if any).

## Position duration / contract type

Every shift posting carries a contract type. Workers see it as a prominent orange badge on the venue card (top-right of the photo, balancing the "Hiring now" badge). Venues pick when posting:

| Badge          | When to use                                       |
| -------------- | ------------------------------------------------- |
| ONE-OFF SHIFT  | Single shift, like "tonight 18-23"                |
| ONE WEEK       | Short-term cover (vacation, sick leave)           |
| ONE MONTH      | Seasonal peak, project work                       |
| SEASONAL       | Summer/winter season                              |
| PART-TIME      | Permanent role, < 30h/week                        |
| FULL-TIME      | Permanent role, 30h+/week                         |
| TRIAL→FT       | Trial shift that may convert to full-time         |

Color of the badge encodes the commitment level — orange for one-off/short-term (Gigi's bread and butter), green for permanent contracts. Workers can filter by contract type in the discovery feed (Pro filter).

## Venue photos — AI library + custom upload

When a venue signs up, they choose how their venue is visually represented to workers in the discovery feed and on QR-landing screens. Two paths:

1. **Pick from the Gigi AI library** — pre-generated stylized exteriors by category:
   - Café
   - Bar / cocktails
   - Restaurant
   - Hotel
   - Fast service / counter
   - Beach club
   - Cinema
   - Retail / boutique (Phase 2)
   - Salon (Phase 2)

   Each category has 4–6 visual variants in different palettes/moods so venues can pick one that feels like them without commissioning a photographer.

2. **Upload their own photo** — exterior shot, interior, team photo, whatever they want. Optional second/third photo for a small gallery.

Auto-fallback: if a venue uploads nothing, Gigi picks the matching category's most popular AI image.

This solves the cold-start problem (every venue card looks polished from day one) without forcing a real photo upload. Premium venues that upload real photos get a small "Real photo" badge — subtle authenticity signal for workers.

## Freemium gates — worker side (symmetric to venue side)

| Feature                                                             | Free worker | Pro worker |
| ------------------------------------------------------------------- | ----------- | ---------- |
| Scan QR + apply to that venue                                       | ✅ unlimited | ✅         |
| Browse all venues with open shifts (discovery feed)                 | 15/day      | unlimited  |
| Apply via discovery feed                                            | 5/day       | unlimited  |
| See full venue profile                                              | 1/day       | unlimited  |
| See which venues viewed your profile                                | ❌ locked    | ✅         |
| Filters (pay, hours, role, languages)                               | ❌ sort only | ✅         |
| Boost — appear at top of venue searches for 24h                     | ❌ locked    | ✅ 1/week  |

**Pricing (proposed):** €2.99/week or €9.99/month. Low friction for early adoption — easy to raise later once we have hire data.

## Two-level candidate view

Two screens, one model:

1. **Compact card** — the swipe-style decision screen. Photo, video, key info, 4 action buttons. Fits one viewport, no scrolling. Goal: 5-second decision per candidate.
2. **Full profile** — opened via a "View full profile" link on the compact card. Scrollable. Shows everything: all 5 photos in a gallery, all 3 videos, documents (CV, ID, references), verified/vouched badges, employment history, languages with proficiency, full bio. Same 4 action buttons pinned at the bottom so the venue can decide without going back.

Documents section in the full profile:
- **Verified badge** (free, ID upload, encrypted, never shown — just the badge)
- **Vouched badge** (auto-generated from 2+ verified references)
- **CV / Resume** — viewable to Pro venues by default, or via consent-based "Request" for Free venues
- **Reference letters** — same rules as CV
- **Right-to-work doc** (for EU compliance) — visible only after Hire is confirmed

## Freemium gates — venue side

The principle: **free is enough to hire fast.** Pro is for venues who want to manage a pipeline, do deep due diligence, and proactively recruit beyond their inbound QR applicants.

| Feature                                                            | Free tier        | Pro tier  |
| ------------------------------------------------------------------ | ---------------- | --------- |
| Post shifts                                                        | ✅ unlimited     | ✅        |
| See all candidates who scanned MY QR / applied to MY shift         | ✅ unlimited     | ✅        |
| Compact candidate card (photo, coached video, jobs, languages, experience) | ✅       | ✅        |
| Hire button                                                        | ✅               | ✅        |
| Interview button (video call via Jitsi/WhatsApp)                   | ✅               | ✅        |
| Decline button                                                     | ✅               | ✅        |
| "Request by email" — candidate emails CV / extra info on consent   | ✅               | ✅        |
| View full profile (drill-down screen)                              | **1 per day**    | unlimited |
| Browse the wider pool (workers who haven't applied to me)          | 15 nearest only  | unlimited |
| See all 5 candidate photos                                         | ❌ locked        | ✅        |
| See all 3 candidate videos                                         | ❌ locked        | ✅        |
| Star to Shortlist                                                  | ❌ locked        | ✅        |
| Shortlist tab                                                      | ❌ locked        | ✅        |

When a free venue hits the 1-profile-per-day cap and tries to open another, they see: *"You've used today's full-profile view. Want me to ask [candidate] to email you their CV instead?"* — one tap, candidate gets a push, candidate decides whether to send. Friction-free workaround.

Pro tier pricing TBD (target ~€39/mo per venue).

**Positioning:** even capped, free Gigi is dramatically faster than today's solutions (job boards = days to weeks; Gigi = same day hire from QR + video). The cap drives upgrade without crippling utility.

## Match semantics — DECIDED

Three explicit actions from venue side, candidate confirms on their side:

- **Decline** → silent, candidate never knows
- **Star** → saved to venue's "Shortlist" tab, candidate never knows *(paid tier only)*
- **Request interview** → candidate gets push, accepts → Jitsi video call link sent to both
- **Hire** → candidate gets push, confirms → shift booked

Candidate confirmation always happens on the worker side. From the venue's perspective: tap a button, get a response (accepted / declined / no reply). No back-and-forth swiping required.

## Card UI mockup (mental model)

```
┌─────────────────────────────────────┐
│  Bar Centrale — barista shift   ⭐  │
│  ───────────────────────────────────│
│  [Photo full-bleed]                 │
│  ▶ 0:24 video, plays muted          │
│  • Available now                    │
│                                     │
│  Maria, 24 — Spain                  │
│  🗣 ES native · EN B2 · IT A2       │
│  📍 0.4 km · 3 restaurants prior    │
│                                     │
│  [ ❌ ]  [ ⭐ ]  [ 🎥 ]  [ ✅ ]      │
│  decline star  interview  hire       │
└─────────────────────────────────────┘
```

⭐ star is locked behind paid subscription for venues (free tier sees a lock icon).

## What makes Gigi different from a hiring website

| Standard hiring site            | Gigi                              |
| ------------------------------- | --------------------------------- |
| CV upload                       | 30-second video, no CV needed     |
| Pages of filters                | Swipe through faces in 5 seconds  |
| Email-based                     | Push notification + WhatsApp      |
| Hire in days                    | Hire same shift                   |
| Generic across industries       | Built for HORECA + Retail only    |

## In-app messaging vs WhatsApp deeplink

Phase 1: WhatsApp deeplink (zero infra, candidates already use it).
Phase 2: In-app chat (better data, retention, can ship notifications).

Start with WhatsApp. Migrate later.

## Video interview — implementation options

| Option                     | Cost   | UX                                  | When to ship    |
| -------------------------- | ------ | ----------------------------------- | --------------- |
| WhatsApp video call link   | Free   | Leaves Gigi for call                | Phase 1 (MVP)   |
| Auto-generated Jitsi link  | Free   | Browser-based, no install needed    | Phase 1 (MVP)   |
| Daily.co / LiveKit in-app  | ~$0.004/min | Stays in Gigi, branded            | Phase 2 (post-launch) |
| Twilio Video in-app        | ~$0.004/min | Same, more enterprise-y           | Phase 2 (post-launch) |

> **Recommendation**: Phase 1 use Jitsi (no account, instant link, works on any phone). Phase 2 swap for Daily.co for the polished in-app experience.

## Tech notes (for the build)

- **Card layout**: simple flex layout with 4 action buttons — no swipe library needed (simpler, more accessible, no misclicks)
- **Video playback**: `expo-av` (auto-mute, tap-to-unmute)
- **Push notifications**: Expo Notifications (free, works on iOS + Android)
- **Phone OTP auth**: Supabase Auth or Twilio Verify
- **Video calls**: Jitsi link generation (Phase 1), Daily.co SDK (Phase 2)
- **Paid subscription gating**: feature flag on venue profile (`tier: "free" | "pro"`), checked in app before showing/enabling star button
