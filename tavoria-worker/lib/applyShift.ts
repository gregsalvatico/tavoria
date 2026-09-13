import {
  createApplication,
  getCurrentWorkerApplicationForShift,
  getCurrentWorkerFull,
} from "./db";

type ShiftLike = {
  id: string;
  venue_id?: string;
  venue?: { name?: string };
};

export type ShiftApplicationResult =
  | { kind: "existing"; application: any }
  | { kind: "created"; venueName: string }
  | { kind: "signup"; shiftId: string; venueId?: string; venueName: string };

/** Keeps direct application and signup routing identical across shift surfaces. */
export async function applyToShift(shift: ShiftLike): Promise<ShiftApplicationResult> {
  const venueName = shift.venue?.name ?? "";
  const worker = await getCurrentWorkerFull();

  if (!worker?.id) {
    return {
      kind: "signup",
      shiftId: shift.id,
      venueId: shift.venue_id,
      venueName,
    };
  }

  const existing = await getCurrentWorkerApplicationForShift(shift.id);
  if (existing) return { kind: "existing", application: existing };

  await createApplication({
    worker_id: worker.id,
    venue_id: shift.venue_id,
    shift_id: shift.id,
  });

  return { kind: "created", venueName };
}
