// Cloud sync endpoint for the family kids' webapp at /oli-blu.
// GET  /api/kids-progress?profile=blu  → returns { data, updated_at }
// POST /api/kids-progress              → body { profile, data }, upserts
//
// We use the service_role key server-side so the table can stay locked down
// behind RLS — anonymous browser JS can NOT bypass this endpoint and write
// directly to Supabase.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Cache control: never cache. Each kid request must be fresh.
export const dynamic = "force-dynamic";

function isValidProfile(p: unknown): p is "blu" | "oli" {
  return p === "blu" || p === "oli";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const profile = searchParams.get("profile");

  if (!isValidProfile(profile)) {
    return NextResponse.json(
      { error: "profile must be 'blu' or 'oli'" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("kids_progress")
    .select("data, updated_at")
    .eq("profile", profile)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data?.data ?? {},
    updated_at: data?.updated_at ?? null,
  });
}

export async function POST(req: Request) {
  let body: { profile?: unknown; data?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { profile, data } = body;

  if (!isValidProfile(profile)) {
    return NextResponse.json(
      { error: "profile must be 'blu' or 'oli'" },
      { status: 400 }
    );
  }
  if (typeof data !== "object" || data === null) {
    return NextResponse.json(
      { error: "data must be a JSON object" },
      { status: 400 }
    );
  }

  // Safety cap: 64 KB per profile. Way more than the app would ever need;
  // prevents accidental DoS if something writes a runaway payload.
  const size = JSON.stringify(data).length;
  if (size > 64 * 1024) {
    return NextResponse.json(
      { error: `payload too large: ${size} bytes` },
      { status: 413 }
    );
  }

  const { error } = await supabaseAdmin
    .from("kids_progress")
    .upsert({ profile, data }, { onConflict: "profile" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
