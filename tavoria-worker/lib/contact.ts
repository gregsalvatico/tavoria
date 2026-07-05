// Contact helpers — build phone-call and WhatsApp deep links from raw user
// input. We normalise the number for wa.me: digits only, default +39 if no
// country code is present.

export function normaliseForWhatsApp(raw: string | null | undefined): string {
  if (!raw) return "";
  let digits = raw.replace(/\D+/g, "");
  if (!digits) return "";
  // If it starts with 00 (international from europe) drop the 00
  if (digits.startsWith("00")) digits = digits.slice(2);
  // If it doesn't already start with a likely country code, default to Italy
  // (mobile numbers in IT start with 3, so prepend 39 to those).
  if (digits.length === 9 || digits.length === 10) {
    if (digits.startsWith("3")) digits = "39" + digits;
  }
  return digits;
}

export function whatsAppUrl(phoneRaw: string, message?: string): string {
  const digits = normaliseForWhatsApp(phoneRaw);
  if (!digits) return "";
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function telUrl(phoneRaw: string): string {
  // tel: accepts +, spaces, dashes — keep it close to what the user typed.
  // Strip whitespace just to be safe.
  const clean = (phoneRaw ?? "").trim().replace(/\s+/g, "");
  return clean ? `tel:${clean}` : "";
}

export function fillTemplate(
  tpl: string,
  vars: Record<string, string>
): string {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out
      .replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g"), v)
      .replace(/\[missing "[^"]*" value\]/g, v);
  }
  return out;
}
