# AI Image Prompts — Gigi Venue Type Tiles

Goal: one painterly illustration per venue type, matching the existing `venue-cafe.png` style. These show up on the "What kind of place are you?" screen.

**Save filenames:** `venue-bar.png`, `venue-restaurant.png`, `venue-hotel.png`, `venue-club.png`, `venue-beach.png` — all in this `assets/` folder.

**Aspect ratio:** square (1:1) — the tiles are square. 1024×1024 works perfectly.

**Reference style:** `venue-cafe.png` — painterly, Studio Ghibli meets Wes Anderson, frontal storefront view, warm interior glow, atmospheric lighting, charming details, no people in frame.

---

## Bar → `venue-bar.png`

> Painterly square illustration of a moody intimate Italian cocktail bar storefront at night, deep pink and burgundy painted facade, mullioned windows revealing a warm interior with backlit liquor shelves, brass bar rail, and pendant lights, "Bar" written in neon pink cursive script on a vintage hanging sign, brass door handles, two small marble bistro tables with velvet stools on the sidewalk, wrought-iron lanterns flanking the entrance, a single potted fig tree, deep blue-purple night sky, painterly illustrated style with soft brushstrokes, Studio Ghibli meets Wes Anderson aesthetic, romantic European nightlife atmosphere, no people in frame, square 1:1 composition

---

## Restaurant → `venue-restaurant.png`

> Painterly square illustration of a warm cozy Italian trattoria storefront at golden hour, terracotta-and-cream painted exterior with wooden shutters, large windows revealing a candlelit interior with checkered tablecloths and wine bottles, hand-painted "Trattoria" in vintage red script on the awning, a chalkboard menu out front, climbing wisteria above the entrance, wooden tables with woven chairs on a cobbled sidewalk, terracotta pots with rosemary and basil, soft amber light spilling onto the street, painterly illustrated style with soft brushstrokes, Studio Ghibli meets Wes Anderson aesthetic, romantic Italian neighborhood vibe, no people in frame, square 1:1 composition

---

## Hotel → `venue-hotel.png`

> Painterly square illustration of an elegant boutique Italian hotel entrance at blue hour, classic cream-and-pale-blue stone facade with arched windows and a small balcony, ornate wrought-iron gate-style entrance doors, hand-painted "Albergo" or "Hotel" in elegant gold lettering on a vintage signboard above the door, brass lanterns lit on either side, marble steps leading up, large terracotta urns with topiaries flanking the entrance, warm interior glow visible through windows showing a small reception with a chandelier, deep blue twilight sky, painterly illustrated style with soft brushstrokes, Studio Ghibli meets Wes Anderson aesthetic, refined European hotel atmosphere, no people in frame, square 1:1 composition

---

## Club → `venue-club.png`

> Painterly square illustration of a sleek underground Milan nightclub entrance at night, deep purple and black exposed-concrete facade, narrow metal-clad doorway with a single neon-purple sign reading "Club" in modern script glowing above, faint magenta and violet light pulsing from inside, two metal stanchions with a velvet rope, exposed brick wall textures, urban graffiti as accent on one side, a few stylish potted aloe plants, glossy wet sidewalk reflecting the neon, deep midnight blue sky above, painterly illustrated style with soft brushstrokes, Studio Ghibli meets Wes Anderson aesthetic but with a moody nightlife edge, no people in frame, square 1:1 composition

---

## Beach club → `venue-beach.png`

> Painterly square illustration of a breezy Italian beach club entrance during late golden afternoon, weathered white-washed wood and natural rattan facade, sun-bleached open archway leading to a sandy patio, hand-painted "Bagno" or "Beach Club" in turquoise script on a driftwood sign, palm-frond awning, two wooden sun loungers with cream cushions and a striped beach umbrella visible inside, terracotta pots with palm fronds and bougainvillea, glimpses of turquoise sea and pale sand in the background, golden sunlight, soft sea breeze atmosphere, painterly illustrated style with soft brushstrokes, Studio Ghibli meets Wes Anderson aesthetic, relaxed Mediterranean coastal vibe, no people in frame, square 1:1 composition

---

## After you generate them

1. Save the five PNG files as listed above into this `assets/` folder
2. Tell me they're saved — I'll update venue-type.tsx to reference each one
3. (Once these are in, your "What kind of place are you?" screen will look gorgeous)

## Tools that work well

- **ChatGPT (GPT-4o / DALL-E)** — paste prompt, "make it 1:1 square"
- **Claude / Anthropic image gen** — paste prompt, attach `venue-cafe.png` as style reference
- **Midjourney** — paste prompt + `--ar 1:1 --style raw`
- **Ideogram** — handles text in signage best
