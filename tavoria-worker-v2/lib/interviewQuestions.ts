// Per-role interview QCM bank.
// Each question has 5-6 options. No "wrong" answer — venues read the thinking.
//
// IMPORTANT: the strings in this file are the canonical English source.
// At render time, screens should pass questions through `localizeQuestions()`
// below, which swaps in the active-locale text from `lib/locales/<lang>.ts`
// under the `interview_q.<id>` namespace. If a translation key is missing,
// the English fallback is used automatically.

import { t } from "./i18n";

export type InterviewOption = { id: string; text: string };

export type InterviewQuestion = {
  id: string;
  role: string; // matches worker-positions.tsx ids: Barista, Waiter, etc.; or 'Universal'
  text: string;
  options: InterviewOption[];
};

// ---- Question banks per role ----

const BARISTA: InterviewQuestion[] = [
  {
    id: "ba1",
    role: "Barista",
    text: "Your espresso is pulling too fast (15 sec). What do you do?",
    options: [
      { id: "a", text: "Grind finer and re-dose" },
      { id: "b", text: "Tamp harder and try again" },
      { id: "c", text: "Check the dose weight first, then grind" },
      { id: "d", text: "Pull another shot, see if it's consistent" },
      { id: "e", text: "Call the head barista before doing anything" },
    ],
  },
  {
    id: "ba2",
    role: "Barista",
    text: "A regular orders 'the usual' but you've never met them. What do you do?",
    options: [
      { id: "a", text: "Smile, admit it's my first time, ask what they usually have" },
      { id: "b", text: "Quickly ask a colleague who knows them" },
      { id: "c", text: "Suggest your favorite drink to start a conversation" },
      { id: "d", text: "Ask them to describe it in detail" },
      { id: "e", text: "Make a guess based on the time of day" },
    ],
  },
  {
    id: "ba3",
    role: "Barista",
    text: "Mid-rush, the espresso machine pump fails. Line of 8 people. What do you do?",
    options: [
      { id: "a", text: "Tell the line, switch to filter/drip alternatives" },
      { id: "b", text: "Apologize, call the manager, keep the line calm" },
      { id: "c", text: "Try a quick fix while a colleague takes orders" },
      { id: "d", text: "Comp drinks for the wait, suggest pastries" },
      { id: "e", text: "Politely close the bar until it's resolved" },
    ],
  },
  {
    id: "ba4",
    role: "Barista",
    text: "A customer says their latte is 'not as good as yesterday's'. What do you do?",
    options: [
      { id: "a", text: "Apologize, remake it personally, ask what was different" },
      { id: "b", text: "Offer to remake or refund — their choice" },
      { id: "c", text: "Taste it myself to compare, then decide" },
      { id: "d", text: "Apologize and remake without questioning" },
      { id: "e", text: "Ask them what they'd like me to adjust" },
    ],
  },
  {
    id: "ba5",
    role: "Barista",
    text: "Slow morning, all prep done. What do you do?",
    options: [
      { id: "a", text: "Deep clean the steam wands and grinder" },
      { id: "b", text: "Practice latte art" },
      { id: "c", text: "Chat with the regulars who are in" },
      { id: "d", text: "Restock cups, lids, syrups" },
      { id: "e", text: "Calibrate the grinder for the new bean batch" },
    ],
  },
];

const WAITER: InterviewQuestion[] = [
  {
    id: "wa1",
    role: "Waiter",
    text: "A guest sends back a perfectly cooked dish saying it's overcooked. What do you do?",
    options: [
      { id: "a", text: "Apologize, take it back, offer a replacement" },
      { id: "b", text: "Politely ask what they'd prefer instead" },
      { id: "c", text: "Bring the chef out to discuss" },
      { id: "d", text: "Apologize and offer a complimentary dessert" },
      { id: "e", text: "Replace it without question, never mention it again" },
    ],
  },
  {
    id: "wa2",
    role: "Waiter",
    text: "Two tables flag you down at the same time during a rush. What do you do?",
    options: [
      { id: "a", text: "Acknowledge both, attend whoever flagged me first" },
      { id: "b", text: "Quickly ask each what they need, prioritize urgency" },
      { id: "c", text: "Take the closer table, signal 'one minute' to the other" },
      { id: "d", text: "Call a colleague to cover one" },
      { id: "e", text: "Handle the one with kids/elderly first" },
    ],
  },
  {
    id: "wa3",
    role: "Waiter",
    text: "A guest asks about an allergen you're not 100% sure about. What do you do?",
    options: [
      { id: "a", text: "Tell them to wait, go check with the kitchen" },
      { id: "b", text: "Suggest a dish I know is safe instead" },
      { id: "c", text: "Be honest I'm not sure, ask the chef directly" },
      { id: "d", text: "Never guess — always verify with the kitchen" },
      { id: "e", text: "Check the allergen sheet if there's one" },
    ],
  },
  {
    id: "wa4",
    role: "Waiter",
    text: "You spilled red wine on a guest. What's your first move?",
    options: [
      { id: "a", text: "Apologize sincerely, grab cleaning supplies" },
      { id: "b", text: "Call the manager immediately" },
      { id: "c", text: "Offer to pay for dry cleaning" },
      { id: "d", text: "Apologize and let them lead — some want privacy" },
      { id: "e", text: "Comp their meal and let manager handle the rest" },
    ],
  },
  {
    id: "wa5",
    role: "Waiter",
    text: "A guest wants wine pairing advice. You're not a sommelier. What do you do?",
    options: [
      { id: "a", text: "Suggest something I know well and explain why" },
      { id: "b", text: "Ask them what they usually like, recommend from there" },
      { id: "c", text: "Be honest I'm learning, suggest the best-seller" },
      { id: "d", text: "Bring out the wine list and walk through together" },
      { id: "e", text: "Ask the sommelier or senior server to come over" },
    ],
  },
];

const RUNNER: InterviewQuestion[] = [
  {
    id: "ru1",
    role: "Runner",
    text: "Three dishes ready at the pass, all different tables. How do you decide what goes first?",
    options: [
      { id: "a", text: "Hottest dish first, always" },
      { id: "b", text: "Whichever table ordered first" },
      { id: "c", text: "Closest table first, then the others" },
      { id: "d", text: "Ask the chef which is most time-sensitive" },
      { id: "e", text: "Take all three together in one trip" },
    ],
  },
  {
    id: "ru2",
    role: "Runner",
    text: "You drop a plate on your way to a table. What do you do?",
    options: [
      { id: "a", text: "Apologize to the table, call the kitchen for a remake" },
      { id: "b", text: "Clean it up fast, then tell the chef" },
      { id: "c", text: "Signal a colleague to bring a backup while I clean" },
      { id: "d", text: "Tell the table their dish needs 5 more minutes" },
      { id: "e", text: "Handle the cleanup first, then update everyone" },
    ],
  },
  {
    id: "ru3",
    role: "Runner",
    text: "You don't know which table ordered a dish you're picking up. What do you do?",
    options: [
      { id: "a", text: "Ask the chef or the server who took the order" },
      { id: "b", text: "Walk it to the floor and announce the dish loudly" },
      { id: "c", text: "Check the order ticket on the rail" },
      { id: "d", text: "Hold it until the server can confirm" },
      { id: "e", text: "Pick the most likely table and confirm with them" },
    ],
  },
  {
    id: "ru4",
    role: "Runner",
    text: "The kitchen is way behind. Guests are getting frustrated. What do you do?",
    options: [
      { id: "a", text: "Update each table honestly, give a realistic time" },
      { id: "b", text: "Bring water/bread to apologize while they wait" },
      { id: "c", text: "Tell the manager so they can decide on comps" },
      { id: "d", text: "Push the kitchen for priority on the longest-waiting" },
      { id: "e", text: "Stay calm and just keep running what's ready" },
    ],
  },
  {
    id: "ru5",
    role: "Runner",
    text: "A server is overwhelmed and asks you to take a table's drink order. What do you do?",
    options: [
      { id: "a", text: "Take it — we're a team" },
      { id: "b", text: "Take it but flag the manager so they know" },
      { id: "c", text: "Help once but stay focused on running food" },
      { id: "d", text: "Take it only if the kitchen isn't backed up" },
      { id: "e", text: "Politely ask another server to help instead" },
    ],
  },
];

const CASHIER: InterviewQuestion[] = [
  {
    id: "ca1",
    role: "Cashier",
    text: "At end-of-shift you're €15 short in the till. What do you do?",
    options: [
      { id: "a", text: "Recount carefully, then report to the manager" },
      { id: "b", text: "Check the day's voids and refunds first" },
      { id: "c", text: "Cover it from my own pocket to avoid trouble" },
      { id: "d", text: "Report immediately, transparent about the gap" },
      { id: "e", text: "Review camera footage with the manager" },
    ],
  },
  {
    id: "ca2",
    role: "Cashier",
    text: "A customer claims they paid in cash but you have no record. What do you do?",
    options: [
      { id: "a", text: "Stay calm, check the till and recent receipts" },
      { id: "b", text: "Call the manager to handle it" },
      { id: "c", text: "Apologize and ask them to recall the exact amount" },
      { id: "d", text: "Trust them and refund — customer first" },
      { id: "e", text: "Check security cameras with the manager" },
    ],
  },
  {
    id: "ca3",
    role: "Cashier",
    text: "Card terminal is down and there's a queue. What do you do?",
    options: [
      { id: "a", text: "Announce the issue, accept cash only" },
      { id: "b", text: "Call IT and the manager immediately" },
      { id: "c", text: "Note IOUs for regulars who can pay later" },
      { id: "d", text: "Offer to walk customers to the nearest ATM" },
      { id: "e", text: "Suggest mobile payment apps if available" },
    ],
  },
  {
    id: "ca4",
    role: "Cashier",
    text: "A regular asks for a discount you don't usually give. What do you do?",
    options: [
      { id: "a", text: "Politely decline, explain it's policy" },
      { id: "b", text: "Ask the manager before responding" },
      { id: "c", text: "Apply a small comp like a coffee on the house" },
      { id: "d", text: "Give it — keeping regulars happy matters" },
      { id: "e", text: "Suggest the loyalty program instead" },
    ],
  },
  {
    id: "ca5",
    role: "Cashier",
    text: "Slow moment at the till. What do you do?",
    options: [
      { id: "a", text: "Tidy the area, restock receipt rolls, sanitize" },
      { id: "b", text: "Greet anyone passing the counter" },
      { id: "c", text: "Help on the floor — runner, busser" },
      { id: "d", text: "Reconcile mid-shift cash so closing is faster" },
      { id: "e", text: "Restock the impulse-buy items by the till" },
    ],
  },
];

const HOST: InterviewQuestion[] = [
  {
    id: "ho1",
    role: "Host",
    text: "A walk-in shows up. Your reservation book is full but you spot an empty table. What do you do?",
    options: [
      { id: "a", text: "Seat them if no reservation needs that table for 90+ min" },
      { id: "b", text: "Offer the bar with menu, take their number for cancellations" },
      { id: "c", text: "Check with the manager before deciding" },
      { id: "d", text: "Politely decline and offer to call when one opens" },
      { id: "e", text: "Seat them and hope no one shows for the reservation" },
    ],
  },
  {
    id: "ho2",
    role: "Host",
    text: "A guest with a reservation is 30 min late. Another walk-in wants the table. What do you do?",
    options: [
      { id: "a", text: "Call the reservation first to confirm they're coming" },
      { id: "b", text: "Give the table to the walk-in if no answer" },
      { id: "c", text: "Wait 15 more min, then release the table" },
      { id: "d", text: "Check the venue's policy on no-shows" },
      { id: "e", text: "Seat the walk-in, prepare to apologize if reservation arrives" },
    ],
  },
  {
    id: "ho3",
    role: "Host",
    text: "A guest is loudly complaining at the entrance. What do you do?",
    options: [
      { id: "a", text: "Move them somewhere quieter, listen, then act" },
      { id: "b", text: "Apologize, call the manager immediately" },
      { id: "c", text: "Stay calm, mirror their concern, offer a solution" },
      { id: "d", text: "Take ownership, don't blame the kitchen or staff" },
      { id: "e", text: "Offer a drink at the bar while we sort it out" },
    ],
  },
  {
    id: "ho4",
    role: "Host",
    text: "A regular VIP arrives without a reservation on a full night. What do you do?",
    options: [
      { id: "a", text: "Greet warmly, offer the bar, get them a drink while we work it out" },
      { id: "b", text: "Check with the manager before making promises" },
      { id: "c", text: "Find them a small table even if it's tight" },
      { id: "d", text: "Honestly explain it's full, suggest another night" },
      { id: "e", text: "Ask another table if they'd shift to free up space" },
    ],
  },
  {
    id: "ho5",
    role: "Host",
    text: "A guest asks 'how long?' and the real wait is 45 min. What do you do?",
    options: [
      { id: "a", text: "Give the truth — 45 min — let them decide" },
      { id: "b", text: "Say 45 min but offer the bar to wait" },
      { id: "c", text: "Take their number, text them when ready" },
      { id: "d", text: "Round up to 60 min so they're pleasantly surprised" },
      { id: "e", text: "Offer a menu so they can decide if they want to stay" },
    ],
  },
];

const BARTENDER: InterviewQuestion[] = [
  {
    id: "bt1",
    role: "Bartender",
    text: "A customer orders a cocktail you've never made. What do you do?",
    options: [
      { id: "a", text: "Admit it, ask them how they like it" },
      { id: "b", text: "Check the recipe book or app quickly" },
      { id: "c", text: "Ask a senior bartender" },
      { id: "d", text: "Improvise with a similar classic, explain" },
      { id: "e", text: "Suggest something I make really well instead" },
    ],
  },
  {
    id: "bt2",
    role: "Bartender",
    text: "A customer is clearly getting too drunk. What do you do?",
    options: [
      { id: "a", text: "Offer water, slow the pace, no more strong drinks" },
      { id: "b", text: "Politely cut them off, offer a ride or food" },
      { id: "c", text: "Tell the security or manager immediately" },
      { id: "d", text: "Make their next drink weaker without telling them" },
      { id: "e", text: "Refuse service entirely, calmly explain why" },
    ],
  },
  {
    id: "bt3",
    role: "Bartender",
    text: "It's packed. 4 people at the bar wave for drinks at the same time. What do you do?",
    options: [
      { id: "a", text: "Acknowledge all, serve in the order they arrived" },
      { id: "b", text: "Take all orders at once, batch the drinks" },
      { id: "c", text: "Start with the simplest orders to clear them fast" },
      { id: "d", text: "Pull the next bartender from the back" },
      { id: "e", text: "Serve regulars first — they tip" },
    ],
  },
  {
    id: "bt4",
    role: "Bartender",
    text: "A customer says their cocktail is 'too sour'. What do you do?",
    options: [
      { id: "a", text: "Apologize, taste it myself, remake with adjusted ratios" },
      { id: "b", text: "Offer to remake or swap for something else" },
      { id: "c", text: "Add a touch of syrup and ask if it's better" },
      { id: "d", text: "Explain the classic recipe but offer to adjust" },
      { id: "e", text: "Remake immediately, no questions" },
    ],
  },
  {
    id: "bt5",
    role: "Bartender",
    text: "Slow night. What do you do?",
    options: [
      { id: "a", text: "Polish glasses, organize the back bar" },
      { id: "b", text: "Practice new cocktail techniques" },
      { id: "c", text: "Chat with regulars, build relationships" },
      { id: "d", text: "Restock everything for tomorrow's rush" },
      { id: "e", text: "Update the menu chalkboard or seasonal specials" },
    ],
  },
];

const COOK: InterviewQuestion[] = [
  {
    id: "co1",
    role: "Cook",
    text: "Mid-service, you realize you're out of a key ingredient for a dish. What do you do?",
    options: [
      { id: "a", text: "Tell the head chef immediately, suggest a substitute" },
      { id: "b", text: "Improvise with what's available, flag it to the server" },
      { id: "c", text: "Pull the dish from the menu until restocked" },
      { id: "d", text: "Send a runner to a nearby shop if it's urgent" },
      { id: "e", text: "Continue and apologize when we run out completely" },
    ],
  },
  {
    id: "co2",
    role: "Cook",
    text: "A new colleague is much slower and your station is suffering. What do you do?",
    options: [
      { id: "a", text: "Help them, explain technique, build them up" },
      { id: "b", text: "Switch tasks so the rush isn't blocked" },
      { id: "c", text: "Tell the head chef so they can reassign" },
      { id: "d", text: "Quietly take over their station for the rush" },
      { id: "e", text: "Coach them after service, push through for now" },
    ],
  },
  {
    id: "co3",
    role: "Cook",
    text: "You burn yourself badly mid-service. What do you do?",
    options: [
      { id: "a", text: "Call out, get covered, treat it properly" },
      { id: "b", text: "Quick rinse, wrap it, push through service" },
      { id: "c", text: "Tell the chef, decide together whether to leave the line" },
      { id: "d", text: "Whatever it takes to get through service, treat after" },
      { id: "e", text: "Go to A&E immediately if it's serious — health first" },
    ],
  },
  {
    id: "co4",
    role: "Cook",
    text: "A dish goes out wrong (over/undercooked). The server brings it back. What do you do?",
    options: [
      { id: "a", text: "Apologize, remake it priority, learn from it" },
      { id: "b", text: "Remake it without making a fuss" },
      { id: "c", text: "Investigate what went wrong before remaking" },
      { id: "d", text: "Take responsibility even if it wasn't me" },
      { id: "e", text: "Tell the chef so they can address it" },
    ],
  },
  {
    id: "co5",
    role: "Cook",
    text: "Slow Monday. All prep done. What do you do?",
    options: [
      { id: "a", text: "Deep clean the station — fridge, ovens, surfaces" },
      { id: "b", text: "Prep further ahead for the week's busier days" },
      { id: "c", text: "Practice new techniques, try a special" },
      { id: "d", text: "Help other stations with their prep" },
      { id: "e", text: "Inventory everything, build a restock list" },
    ],
  },
];

const CHEF: InterviewQuestion[] = [
  {
    id: "ch1",
    role: "Chef",
    text: "Your sous-chef calls in sick 1 hour before a busy service. What do you do?",
    options: [
      { id: "a", text: "Cover the station myself, brief the line" },
      { id: "b", text: "Call standby staff, offer a bonus to come in" },
      { id: "c", text: "Cut the menu, focus on what we can execute well" },
      { id: "d", text: "Promote the strongest cook to step up" },
      { id: "e", text: "Reduce reservations if possible" },
    ],
  },
  {
    id: "ch2",
    role: "Chef",
    text: "A guest with severe allergies asks if a dish is safe. You're 90% sure but not 100%. What do you do?",
    options: [
      { id: "a", text: "Say no — and offer a dish I'm 100% sure about" },
      { id: "b", text: "Inspect the dish and supply chain personally" },
      { id: "c", text: "Make a custom dish for them from scratch" },
      { id: "d", text: "Explain my uncertainty, let them decide" },
      { id: "e", text: "Never serve when uncertain — no exceptions" },
    ],
  },
  {
    id: "ch3",
    role: "Chef",
    text: "A line cook keeps making the same mistake. What do you do?",
    options: [
      { id: "a", text: "Pull them aside, demonstrate, coach calmly" },
      { id: "b", text: "Document the mistakes, give a formal warning" },
      { id: "c", text: "Pair them with the best cook to learn" },
      { id: "d", text: "Move them to a station that suits them better" },
      { id: "e", text: "Have a frank conversation about fit" },
    ],
  },
  {
    id: "ch4",
    role: "Chef",
    text: "A regular guest sends back a dish you personally made. What do you do?",
    options: [
      { id: "a", text: "Walk out, apologize personally, ask what's wrong" },
      { id: "b", text: "Remake it differently based on their feedback" },
      { id: "c", text: "Send a complimentary course as apology" },
      { id: "d", text: "Take it back, make sure it never happens again" },
      { id: "e", text: "Ask the server first what the issue was" },
    ],
  },
  {
    id: "ch5",
    role: "Chef",
    text: "Food cost is up 8% this month. Investors want it down. What's your first move?",
    options: [
      { id: "a", text: "Audit waste — where are we losing product?" },
      { id: "b", text: "Renegotiate with suppliers" },
      { id: "c", text: "Tighten portion sizes on the highest-cost dishes" },
      { id: "d", text: "Adjust the menu to seasonal/cheaper ingredients" },
      { id: "e", text: "Train the team on waste-conscious technique" },
    ],
  },
];

const CLEANER: InterviewQuestion[] = [
  {
    id: "cl1",
    role: "Cleaner",
    text: "You're cleaning a guest area and a customer asks where the restroom is. What do you do?",
    options: [
      { id: "a", text: "Stop, smile, walk them halfway" },
      { id: "b", text: "Point clearly, smile, continue working" },
      { id: "c", text: "Give clear directions verbally" },
      { id: "d", text: "Walk them all the way to be sure" },
      { id: "e", text: "Politely flag a server to help if I'm mid-task" },
    ],
  },
  {
    id: "cl2",
    role: "Cleaner",
    text: "You find what looks like a lost wallet under a table. What do you do?",
    options: [
      { id: "a", text: "Hand it directly to the manager, no opening" },
      { id: "b", text: "Photograph the spot, then hand it in" },
      { id: "c", text: "Open just enough to find ID, then to the manager" },
      { id: "d", text: "Tell the host in case the guest returns" },
      { id: "e", text: "Log it in the lost-and-found book myself" },
    ],
  },
  {
    id: "cl3",
    role: "Cleaner",
    text: "A guest spills a glass of red wine on a white sofa. What do you do?",
    options: [
      { id: "a", text: "Blot immediately with cold water, no rubbing" },
      { id: "b", text: "Reassure the guest, apologize for the spot" },
      { id: "c", text: "Get the manager involved for compensation" },
      { id: "d", text: "Use the proper stain treatment from the cleaning kit" },
      { id: "e", text: "Tell housekeeping to handle it after service" },
    ],
  },
  {
    id: "cl4",
    role: "Cleaner",
    text: "You're done early. What do you do?",
    options: [
      { id: "a", text: "Re-do high-touch surfaces — handles, taps, switches" },
      { id: "b", text: "Restock supplies for tomorrow" },
      { id: "c", text: "Ask the manager what else needs attention" },
      { id: "d", text: "Deep-clean an area that usually gets rushed" },
      { id: "e", text: "Help set up for the next service" },
    ],
  },
  {
    id: "cl5",
    role: "Cleaner",
    text: "You see a colleague NOT washing hands after touching dirty dishes. What do you do?",
    options: [
      { id: "a", text: "Mention it directly but politely" },
      { id: "b", text: "Tell the manager quietly" },
      { id: "c", text: "Demonstrate myself, hope they catch on" },
      { id: "d", text: "Bring it up in the team meeting generally" },
      { id: "e", text: "It's hygiene — call it out immediately, no delay" },
    ],
  },
];

const UNIVERSAL: InterviewQuestion[] = [
  {
    id: "u1",
    role: "Universal",
    text: "You disagree with a manager's decision mid-shift. What do you do?",
    options: [
      { id: "a", text: "Follow the decision, raise it after the shift" },
      { id: "b", text: "Ask clarifying questions in the moment" },
      { id: "c", text: "Push back politely, suggest alternative" },
      { id: "d", text: "Follow it silently — it's their call" },
      { id: "e", text: "Talk to a colleague first to sense-check" },
    ],
  },
  {
    id: "u2",
    role: "Universal",
    text: "You realize mid-shift you made a mistake that affects a guest. What do you do?",
    options: [
      { id: "a", text: "Own it immediately with the guest, fix it" },
      { id: "b", text: "Tell my manager first, then fix it" },
      { id: "c", text: "Fix it quietly, mention it after" },
      { id: "d", text: "Apologize, offer something to make up for it" },
      { id: "e", text: "Tell the team so we all learn from it" },
    ],
  },
  {
    id: "u3",
    role: "Universal",
    text: "A coworker is consistently late. How do you handle it?",
    options: [
      { id: "a", text: "Talk to them privately first" },
      { id: "b", text: "Cover for them once, mention it to the manager" },
      { id: "c", text: "Bring it up in a team huddle generally" },
      { id: "d", text: "Quietly tell the manager" },
      { id: "e", text: "Lead by example, hope they catch up" },
    ],
  },
  {
    id: "u4",
    role: "Universal",
    text: "You're offered a higher-paying shift at another venue the same day. What do you do?",
    options: [
      { id: "a", text: "Honor the commitment, decline the other" },
      { id: "b", text: "Ask my venue if they can match — be transparent" },
      { id: "c", text: "Find a covering worker for my original shift" },
      { id: "d", text: "Take the higher one — money matters" },
      { id: "e", text: "Decide based on the relationship with each venue" },
    ],
  },
];

// ---- Bank lookup ----

const BANKS: Record<string, InterviewQuestion[]> = {
  Barista: BARISTA,
  Waiter: WAITER,
  Runner: RUNNER,
  Cashier: CASHIER,
  Host: HOST,
  Bartender: BARTENDER,
  Cook: COOK,
  Chef: CHEF,
  Cleaner: CLEANER,
};

// ---- Mixer: 7 questions distributed across the worker's picked roles ----

// Distribution patterns by number of roles picked.
// Total always = 7.
const DISTRIBUTION: Record<number, number[]> = {
  1: [7],
  2: [4, 3],
  3: [3, 2, 2],
};

/**
 * Pick 7 questions for a worker, distributed across their roles.
 * - 1 role  → 7 from that role bank
 * - 2 roles → 4 + 3
 * - 3 roles → 3 + 2 + 2
 * - Custom-only (no standard roles) → 7 universal
 * - Fallback: pad from Universal if a role bank doesn't have enough questions
 */
export function pickQuestionsForRoles(
  positions: string[]
): InterviewQuestion[] {
  const standardRoles = positions.filter((p) => BANKS[p]);
  if (standardRoles.length === 0) {
    return UNIVERSAL.concat(WAITER, BARISTA).slice(0, 7);
  }
  const limited = standardRoles.slice(0, 3);
  const dist = DISTRIBUTION[limited.length] ?? [7];

  const picked: InterviewQuestion[] = [];
  limited.forEach((role, i) => {
    const bank = BANKS[role] ?? [];
    const n = dist[i];
    // Shuffle the bank for variety on each retake
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    picked.push(...shuffled.slice(0, n));
  });

  // Pad from Universal if any role bank was too small
  if (picked.length < 7) {
    const universalShuffled = [...UNIVERSAL].sort(() => Math.random() - 0.5);
    for (const q of universalShuffled) {
      if (picked.length >= 7) break;
      picked.push(q);
    }
  }

  return picked.slice(0, 7);
}

export const UNIVERSAL_QUESTIONS = UNIVERSAL;

// ---- Localization ----
//
// `interviewQuestions.ts` is the canonical English source of truth, but at
// render time we look up the active-locale text from the `interview_q.<id>`
// namespace in each locale file. If a translation is missing, i18n-js returns
// a string like `[missing "interview_q.ba1.text" translation]` (or just the
// key) — we detect that and fall back to the English baked into this file.

function safeTranslate(key: string, fallback: string): string {
  try {
    const v = t(key);
    if (!v || typeof v !== "string") return fallback;
    // i18n-js missing-translation marker, or the raw key bouncing back
    if (v.startsWith("[missing ") || v === key) return fallback;
    return v;
  } catch {
    return fallback;
  }
}

export function localizeQuestion(q: InterviewQuestion): InterviewQuestion {
  return {
    ...q,
    text: safeTranslate(`interview_q.${q.id}.text`, q.text),
    options: q.options.map((o) => ({
      ...o,
      text: safeTranslate(`interview_q.${q.id}.opt_${o.id}`, o.text),
    })),
  };
}

export function localizeQuestions(
  qs: InterviewQuestion[]
): InterviewQuestion[] {
  return qs.map(localizeQuestion);
}
