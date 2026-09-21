import type { WorkerRequirements } from "./workerMatching";

export type PostShiftStartWhen = "now" | "asap" | "pickdate" | null;

export type PostShiftDraft = {
  roles: string[];
  requirements: WorkerRequirements;
  contracts: string[];
  days: number[];
  shifts: { fromMins: number; toMins: number }[];
  startWhen: PostShiftStartWhen;
  pickedDate: Date | null;
  customContract: string;
  payUnit: "hour" | "day" | "week" | "month" | "later";
  payInput: string;
  skipPay: boolean;
  payUnitTouched: boolean;
};

let current: PostShiftDraft | null = null;

function emptyDraft(): PostShiftDraft {
  return {
    roles: [],
    requirements: {},
    contracts: [],
    days: [],
    shifts: [{ fromMins: 0, toMins: 0 }],
    startWhen: null,
    pickedDate: null,
    customContract: "",
    payUnit: "hour",
    payInput: "",
    skipPay: false,
    payUnitTouched: false,
  };
}

// Return a copy so screen state cannot mutate the shared draft accidentally.
export function getPostShiftDraft(): PostShiftDraft {
  const draft = current ?? emptyDraft();
  current = draft;
  const legacySkipPay = draft.payUnit === "later";
  return {
    ...draft,
    payUnit: legacySkipPay ? "hour" : draft.payUnit,
    skipPay: draft.skipPay ?? legacySkipPay,
    roles: [...draft.roles],
    requirements: { ...draft.requirements },
    contracts: [...draft.contracts],
    days: [...draft.days],
    shifts: draft.shifts.map((shift) => ({ ...shift })),
    pickedDate: draft.pickedDate ? new Date(draft.pickedDate) : null,
  };
}

export function patchPostShiftDraft(patch: Partial<PostShiftDraft>) {
  current = { ...getPostShiftDraft(), ...patch };
}

export function clearPostShiftDraft() {
  current = null;
}
