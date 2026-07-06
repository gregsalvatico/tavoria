// Tiny module-level store for the "currently posted shift".
// Used to pass data from the post-shift form to the discover screen
// so the venue can preview how their post looks to workers.

export type PostedShift = {
  roles: string[];
  contractLabel: string | null; // e.g. "Part-time" or "Write your own" text
  days: number[]; // 0 = Mon … 6 = Sun
  shifts: { fromMins: number; toMins: number }[];
  startWhen: "now" | "asap" | "pickdate" | null;
  pickedDate: string | null; // ISO
  payUnit: "hour" | "day" | "week" | "month" | "later";
  pay: number;
};

let current: PostedShift | null = null;

export function setPostedShift(s: PostedShift) {
  current = s;
}

export function getPostedShift(): PostedShift | null {
  return current;
}

export function clearPostedShift() {
  current = null;
}
