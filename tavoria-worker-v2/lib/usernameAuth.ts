// Username + 4-digit PIN auth, layered on top of Supabase email auth.
//
// User-facing: pick a 4-digit PIN, get auto-generated username (maria-kp7x).
// Internally: we synthesize an email like "maria-kp7x@gigi.local" and use
// "{pin}{salt}" as the password (padded to meet Supabase's 6-char minimum).

import { supabase } from "./supabase";

const PASSWORD_SALT = "gigi-2026";
const SYNTHETIC_EMAIL_DOMAIN = "gigi.local";

// Sanitize a free-form name into a username-safe slug
export function nameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

// Random 4-char suffix: letter + digit + letter + digit
function randomSuffix(): string {
  const letters = "abcdefghjkmnpqrstuvwxyz"; // skip i, l, o (look like 1, l, 0)
  const digits = "23456789"; // skip 0, 1 (look like O, l)
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const d1 = digits[Math.floor(Math.random() * digits.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const d2 = digits[Math.floor(Math.random() * digits.length)];
  return `${l1}${d1}${l2}${d2}`;
}

// Generate a username from a first name. Suffix is random to avoid collisions.
// e.g. "Maria" → "maria-k7p2"
export function generateUsername(firstName: string): string {
  const slug = nameToSlug(firstName) || "user";
  return `${slug}-${randomSuffix()}`;
}

// Internal: convert username to the synthetic email we store in Supabase
export function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

// Internal: convert a 4-digit PIN to the padded password Supabase requires
function pinToPassword(pin: string): string {
  return `${pin}-${PASSWORD_SALT}`;
}

// Sign up with username + PIN. Returns the username actually used (in case
// of collision we generated a new one). Caller should display this to the user.
export async function signUpWithUsernamePin(params: {
  username: string;
  pin: string;
  firstName: string;
}): Promise<{ username: string }> {
  let { username } = params;
  // Try up to 5 times to handle collision on the synthetic email
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password: pinToPassword(params.pin),
    });
    if (!error) return { username };
    const msg = (error.message || "").toLowerCase();
    const isCollision =
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists");
    if (!isCollision) throw error;
    // Collision — regenerate suffix and retry
    username = generateUsername(params.firstName);
  }
  throw new Error("Could not pick a unique username. Try again.");
}

// Sign in with username + PIN
export async function signInWithUsernamePin(params: {
  username: string;
  pin: string;
}): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(params.username),
    password: pinToPassword(params.pin),
  });
  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("invalid") || msg.includes("credentials")) {
      throw new Error("Username or PIN doesn't match. Try again.");
    }
    throw error;
  }
}
