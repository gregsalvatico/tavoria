// Module-level store for the signed-up worker's profile.

export type InterviewAnswer = {
  q_id: string;
  q_text: string;
  role: string;
  a_id: string;
  a_text: string;
};

export type WorkerProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneVisible?: boolean;
  ageRange?: string; // "18–20" | "21–25" | "26–30" | "31–40" | "41–50" | "50+"
  country?: string;
  city?: string;
  nationality?: string; // ISO 3166-1 alpha-2 code, e.g. "IT", "FR"
  workEligibilityIT?:
    | "eu_citizen"
    | "permit"
    | "pending"
    | "need_help"
    | "not_eligible";
  yearsExperience?: number;
  positions?: string[]; // up to 3
  languages?: string[]; // ["FR", "EN", "IT"]
  photoUploaded?: boolean;
  photoUrl?: string; // Supabase Storage public URL
  videoUrl?: string; // Supabase Storage public URL
  personality?: string[]; // e.g. "Bubbly", "Calm", "Patient"
  strengths?: string[]; // e.g. "Teamwork", "Customer service"
  interviewAnswers?: InterviewAnswer[]; // 7 QCM answers
  interviewCompletedAt?: string; // ISO timestamp
  // Supabase row IDs
  workerId?: string; // workers.id
  applicationId?: string; // applications.id (latest)
};

let current: WorkerProfile | null = null;

export function setWorkerProfile(p: WorkerProfile) {
  current = p;
}
export function patchWorkerProfile(p: Partial<WorkerProfile>) {
  current = { ...(current ?? {}), ...p };
}
export function getWorkerProfile(): WorkerProfile | null {
  return current;
}
export function clearWorkerProfile() {
  current = null;
}
