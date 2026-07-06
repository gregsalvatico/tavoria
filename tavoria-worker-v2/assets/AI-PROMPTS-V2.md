# AI Prompts Batch 2 — Venue Styles + Positions

Same painterly style as the venue type tiles (Studio Ghibli meets Wes Anderson, soft brushstrokes, atmospheric lighting). Square 1:1, 1024×1024. No people unless noted.

---

# VENUE STYLES (4 images) — icon-style illustrations

Clean, flat-ish modern illustration style — like premium app icons or editorial flat illustrations. One iconic element per vibe. Easy to read at a glance. Soft pastel gradient background, gentle drop shadow on the main element. Square 1:1, 1024×1024. No text, no people.

## casual → `venue-style-casual.png`

> Minimal flat illustration of a single warm beige coffee cup with steam curling up, sitting on a small wooden saucer, soft yellow sun rays in the background, one tiny green leaf floating beside it, calm cream-and-pastel-orange gradient background, gentle soft drop shadow, modern app-icon style with slight texture, friendly inviting feel, conveys relaxed unhurried morning vibe, square 1:1, no text, no people

## busy → `venue-style-busy.png`

> Minimal flat illustration of three plates of food flying through the air in motion, slight motion-blur streaks behind them, one fork mid-spin, energetic warm orange-and-pink gradient background, gentle soft drop shadow, modern app-icon style with slight texture, conveys speed and high-energy rush, dynamic playful feel, square 1:1, no text, no people

## upscale → `venue-style-upscale.png`

> Minimal flat illustration of a single tall stemmed wine glass filled with deep red wine, a small black bow tie resting at the base, a soft golden candle glow beside it, refined cream-and-deep-navy gradient background, gentle soft drop shadow, modern app-icon style with slight texture, conveys elegance and refined service, sophisticated feel, square 1:1, no text, no people

## luxury → `venue-style-luxury.png`

> Minimal flat illustration of a single five-point gold Michelin-style star with a small sparkle, sitting on top of a gold-rimmed white china plate viewed from a slight angle, a small piece of caviar in the center, rich deep-burgundy-and-gold gradient background, gentle soft drop shadow, modern app-icon style with slight texture, conveys top-tier luxury and exclusivity, premium feel, square 1:1, no text, no people

---

# POSITIONS (9 images)

These would replace or accent the position-picker icons on both worker and venue sides. Each shows a hospitality worker doing their thing, in the same painterly style. Tight, focused composition — should read well at small sizes.

**Naming:** `position-{id}.png` (e.g. `position-barista.png`).

## barista → `position-barista.png`

> Painterly square illustration of a barista's hands pulling a perfect espresso shot, focused close-up on a brass-and-chrome espresso machine with rich crema dripping into a small white cup, steam wisp rising, a tamper and ground beans visible on the side, warm overhead pendant light reflecting on the machine, painterly illustrated style with soft brushstrokes, warm coffee-brown palette with brass accents, Studio Ghibli meets Wes Anderson aesthetic, square 1:1 composition

## waiter → `position-waiter.png`

> Painterly square illustration of a waiter in a crisp white apron and black bow tie, carrying a silver tray with two glasses of red wine and a small plate of bruschetta, walking through a softly lit Italian restaurant, motion captured mid-step with confidence, only torso and hands visible (no facial features), warm interior lighting in the background, painterly illustrated style with soft brushstrokes, elegant warm palette, Studio Ghibli meets Wes Anderson aesthetic, square 1:1 composition

## runner → `position-runner.png`

> Painterly square illustration of a food runner in motion, carrying two large plates of pasta through a busy restaurant doorway, sleeves rolled up, body angled forward with focus and speed, only torso and hands visible (no facial features), motion-blurred warm kitchen light behind, painterly illustrated style with dynamic brushstrokes, warm amber palette, Studio Ghibli meets Wes Anderson aesthetic but with a sense of speed, square 1:1 composition

## cashier → `position-cashier.png`

> Painterly square illustration close-up of cashier's hands at a wooden café counter, handing a small white paper receipt and change across a sleek vintage brass cash register, a tip jar with coins beside it, blurred pastries and coffee cups in the warm background, only hands visible, painterly illustrated style with soft brushstrokes, warm coffee-brown palette with brass accents, Studio Ghibli meets Wes Anderson aesthetic, square 1:1 composition

## host → `position-host.png`

> Painterly square illustration of a host's hands holding a small leather-bound reservation book and a pen, standing at a polished wooden hostess stand at the entrance of an elegant restaurant, warm interior light spilling from behind, small floral arrangement on the stand, only hands and book visible, sense of warm welcome, painterly illustrated style with soft brushstrokes, refined warm palette, Studio Ghibli meets Wes Anderson aesthetic, square 1:1 composition

## bartender → `position-bartender.png`

> Painterly square illustration of a bartender's hands shaking a polished metal cocktail shaker, motion-blurred shake, behind the counter of a moody Italian bar at night, backlit liquor shelves glowing amber, a coupe glass and citrus peel waiting, only hands and arms visible, painterly illustrated style with dynamic brushstrokes, deep burgundy and gold palette, Studio Ghibli meets Wes Anderson aesthetic, square 1:1 composition

## cook → `position-cook.png`

> Painterly square illustration of a cook's hands tossing pasta in a sauté pan over a gas flame in a busy Italian restaurant kitchen, fire flaring up from the pan, fresh herbs scattering, only hands and arms visible (wearing a white sleeve), background of stainless-steel kitchen with hanging copper pots in soft focus, painterly illustrated style with dynamic brushstrokes, warm amber palette with orange flame accents, Studio Ghibli meets Wes Anderson aesthetic, square 1:1 composition

## chef → `position-chef.png`

> Painterly square illustration of a chef plating a refined dish, hands holding tweezers placing a microherb on top of a beautifully composed plate, sauce dotted around the edge, single warm overhead light, marble work surface, sense of precision and artistry, only hands visible (wearing a white chef's coat sleeve), painterly illustrated style with refined brushstrokes, sophisticated cream-and-gold palette, Studio Ghibli meets Wes Anderson aesthetic at its most refined, square 1:1 composition

## cleaner → `position-cleaner.png`

> Painterly square illustration of a hospitality cleaner's hands wiping down a marble café table with a soft white cloth, a small spray bottle visible, morning sunlight streaming in through the window, chairs already neatly arranged in the background, sense of care and pride in detail, only hands visible, painterly illustrated style with soft brushstrokes, warm morning palette of cream, white, and gentle gold, Studio Ghibli meets Wes Anderson aesthetic, square 1:1 composition

---

## After you generate them

Drop the files into this `assets/` folder with the exact filenames listed above. Once you've got even a few (start with the 4 venue styles — most visible), tell me and I'll uncomment the `image: require(...)` lines in the code so they show up.

## Recommendations

- **ChatGPT (GPT-4o / DALL-E)** for the venue styles (handles interiors and atmosphere well)
- **Midjourney** with `--ar 1:1 --style raw` for the positions (better at hands and motion)
- **Ideogram** if you want any text in signage
- Reference image: attach `venue-cafe.png` or `venue-bar.png` to keep style consistent
