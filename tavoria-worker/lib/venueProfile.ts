// Tiny module-level store for the venue's profile collected during onboarding.

export type PayScheduleId = "sameday" | "weekly" | "monthly" | "custom";

export type VenueProfile = {
  id?: string; // Supabase row id (uuid) once inserted
  name: string;
  address: string;
  city: string;
  type?: string; // "Café" | "Bar" | "Restaurant" | …
  email?: string;
  phone?: string;
  photoId?: string;
  photoUrl?: string; // Supabase Storage public URL (real uploaded photo)
  roles?: string[]; // positions this venue typically hires for
  payScheduleId?: PayScheduleId;
  payScheduleLabel?: string; // display label (incl. the custom-typed text)
  venueStyle?: string; // "casual" | "busy" | "upscale" | "luxury" | "nightlife"
  venueStyleLabel?: string;
  preferredInterviewAnswers?: VenuePreferredAnswer[];
  preferredInterviewCompletedAt?: string;
};

// Same shape as worker InterviewAnswer — venue picks what their ideal candidate
// would answer for each question. Used for matching.
export type VenuePreferredAnswer = {
  q_id: string;
  q_text: string;
  role: string;
  a_id: string;
  a_text: string;
};

let current: VenueProfile | null = null;

export function setVenueProfile(p: VenueProfile) {
  current = p;
}

export function patchVenueProfile(p: Partial<VenueProfile>) {
  current = { ...(current ?? ({} as VenueProfile)), ...p } as VenueProfile;
}

export function getVenueProfile(): VenueProfile | null {
  return current;
}

export function clearVenueProfile() {
  current = null;
}
