"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STORAGE_BUCKETS = [
  "worker-photos",
  "worker-videos",
  "worker-documents",
  "venue-photos",
  "venue-videos",
  "venue-shift-media",
];

async function requireAdmin() {
  if (!(await isAdminAuthed())) redirect("/admin/login");
}

function readId(formData: FormData, key: string) {
  const id = String(formData.get(key) ?? "");
  if (!UUID_PATTERN.test(id)) throw new Error("Invalid record id.");
  return id;
}

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

async function listStoragePaths(bucket: string, folder: string): Promise<string[]> {
  const paths: string[] = [];
  const pageSize = 100;

  async function walk(path: string, depth = 0): Promise<void> {
    if (depth > 8) throw new Error(`Storage folder nesting is too deep in ${bucket}.`);

    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(path, { limit: pageSize, offset });
      assertNoError(error);

      for (const entry of data ?? []) {
        const entryPath = `${path}/${entry.name}`;
        if (entry.id == null && entry.metadata == null) {
          await walk(entryPath, depth + 1);
        } else {
          paths.push(entryPath);
        }
      }

      if (!data || data.length < pageSize) break;
    }
  }

  await walk(folder);
  return paths;
}

async function removeStorageFolder(bucket: string, folder: string) {
  const paths = await listStoragePaths(bucket, folder);
  for (let start = 0; start < paths.length; start += 100) {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove(paths.slice(start, start + 100));
    assertNoError(error);
  }
}

async function removeUserStorage(userId: string) {
  for (const bucket of STORAGE_BUCKETS) {
    await removeStorageFolder(bucket, userId);
  }
}

async function deleteApplicationsForUser(
  userId: string,
  workerIds: string[],
  venueIds: string[],
  shiftIds: string[],
) {
  const { error: userAppsError } = await supabaseAdmin
    .from("applications")
    .delete()
    .or(`worker_user_id.eq.${userId},venue_user_id.eq.${userId}`);
  assertNoError(userAppsError);

  for (let start = 0; start < workerIds.length; start += 100) {
    const { error } = await supabaseAdmin
      .from("applications")
      .delete()
      .in("worker_id", workerIds.slice(start, start + 100));
    assertNoError(error);
  }
  for (let start = 0; start < venueIds.length; start += 100) {
    const { error } = await supabaseAdmin
      .from("applications")
      .delete()
      .in("venue_id", venueIds.slice(start, start + 100));
    assertNoError(error);
  }
  for (let start = 0; start < shiftIds.length; start += 100) {
    const { error } = await supabaseAdmin
      .from("applications")
      .delete()
      .in("shift_id", shiftIds.slice(start, start + 100));
    assertNoError(error);
  }
}

export async function setShiftStatusAction(formData: FormData) {
  await requireAdmin();
  const id = readId(formData, "id");
  const status = String(formData.get("status") ?? "");
  if (status !== "live" && status !== "paused") {
    throw new Error("Invalid shift status.");
  }

  const { error } = await supabaseAdmin
    .from("shifts")
    .update({ status })
    .eq("id", id);
  assertNoError(error);
  revalidatePath("/admin");
  revalidatePath("/admin/shifts");
}

export async function deleteShiftAction(formData: FormData) {
  await requireAdmin();
  const id = readId(formData, "id");
  const { data: shift, error: shiftError } = await supabaseAdmin
    .from("shifts")
    .select("id, venue_id")
    .eq("id", id)
    .maybeSingle();
  assertNoError(shiftError);
  if (!shift) redirect("/admin/shifts");

  const { data: venue, error: venueError } = await supabaseAdmin
    .from("venues")
    .select("user_id")
    .eq("id", shift.venue_id)
    .maybeSingle();
  assertNoError(venueError);

  if (venue?.user_id) {
    await removeStorageFolder(
      "venue-shift-media",
      `${venue.user_id}/${shift.id}`,
    );
  }

  const { error: applicationsError } = await supabaseAdmin
    .from("applications")
    .delete()
    .eq("shift_id", shift.id);
  assertNoError(applicationsError);

  const { error } = await supabaseAdmin.from("shifts").delete().eq("id", id);
  assertNoError(error);
  revalidatePath("/admin");
  revalidatePath("/admin/shifts");
  revalidatePath(`/admin/venues/${shift.venue_id}`);
  redirect("/admin/shifts?deleted=1");
}

export async function deleteVenueAction(formData: FormData) {
  await requireAdmin();
  const id = readId(formData, "id");
  const { data: venue, error: venueError } = await supabaseAdmin
    .from("venues")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();
  assertNoError(venueError);
  if (!venue) redirect("/admin/venues");

  const { data: shifts, error: shiftsError } = await supabaseAdmin
    .from("shifts")
    .select("id")
    .eq("venue_id", id);
  assertNoError(shiftsError);
  const shiftIds = (shifts ?? []).map((shift) => shift.id);

  if (venue.user_id) {
    await removeStorageFolder("venue-photos", `${venue.user_id}/${id}`);
    await removeStorageFolder("venue-videos", `${venue.user_id}/${id}`);
    for (const shiftId of shiftIds) {
      await removeStorageFolder(
        "venue-shift-media",
        `${venue.user_id}/${shiftId}`,
      );
    }
  }

  const { error: venueApplicationsError } = await supabaseAdmin
    .from("applications")
    .delete()
    .eq("venue_id", id);
  assertNoError(venueApplicationsError);
  for (let start = 0; start < shiftIds.length; start += 100) {
    const { error } = await supabaseAdmin
      .from("applications")
      .delete()
      .in("shift_id", shiftIds.slice(start, start + 100));
    assertNoError(error);
  }

  const { error: deleteShiftsError } = await supabaseAdmin
    .from("shifts")
    .delete()
    .eq("venue_id", id);
  assertNoError(deleteShiftsError);
  const { error } = await supabaseAdmin.from("venues").delete().eq("id", id);
  assertNoError(error);

  revalidatePath("/admin");
  revalidatePath("/admin/venues");
  revalidatePath("/admin/shifts");
  redirect("/admin/venues?deleted=1");
}

export async function deleteUserAction(formData: FormData) {
  await requireAdmin();
  const userId = readId(formData, "id");

  const [workersResult, venuesResult] = await Promise.all([
    supabaseAdmin.from("workers").select("id").eq("user_id", userId),
    supabaseAdmin.from("venues").select("id").eq("user_id", userId),
  ]);
  assertNoError(workersResult.error);
  assertNoError(venuesResult.error);
  const workerIds = (workersResult.data ?? []).map((worker) => worker.id);
  const venueIds = (venuesResult.data ?? []).map((venue) => venue.id);

  let shiftIds: string[] = [];
  if (venueIds.length) {
    const { data, error } = await supabaseAdmin
      .from("shifts")
      .select("id")
      .in("venue_id", venueIds);
    assertNoError(error);
    shiftIds = (data ?? []).map((shift) => shift.id);
  }

  // Storage ownership can prevent Auth deletion, so remove every account-owned
  // object before changing relational data.
  await removeUserStorage(userId);
  await deleteApplicationsForUser(userId, workerIds, venueIds, shiftIds);

  const { error: documentsError } = await supabaseAdmin
    .from("worker_documents")
    .delete()
    .eq("user_id", userId);
  assertNoError(documentsError);

  for (let start = 0; start < venueIds.length; start += 100) {
    const { error } = await supabaseAdmin
      .from("shifts")
      .delete()
      .in("venue_id", venueIds.slice(start, start + 100));
    assertNoError(error);
  }

  const { error: workerError } = await supabaseAdmin
    .from("workers")
    .delete()
    .eq("user_id", userId);
  assertNoError(workerError);
  const { error: venueError } = await supabaseAdmin
    .from("venues")
    .delete()
    .eq("user_id", userId);
  assertNoError(venueError);

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  assertNoError(authError);

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/workers");
  revalidatePath("/admin/venues");
  revalidatePath("/admin/shifts");
  redirect("/admin/users?deleted=1");
}
