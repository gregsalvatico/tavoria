// Passthrough layout for /admin/*.
// Auth + chrome lives in /admin/(protected)/layout.tsx so that
// /admin/login doesn't get caught in a redirect loop.

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
