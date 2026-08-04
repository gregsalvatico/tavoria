export type HomeContext = {
  username?: string;
  hasVenue: boolean;
  venueName?: string;
  venueId?: string;
  venueCity?: string;
  venueType?: string;
  venuePhotoUrl?: string;
  hasWorker: boolean;
  workerName?: string;
  workerId?: string;
  workerCity?: string;
  workerPhotoUrl?: string;
};

type Listener = (context: HomeContext | null) => void;

let cachedContext: HomeContext | null = null;
const listeners = new Set<Listener>();

export function getCachedHomeContext() {
  return cachedContext;
}

export function setCachedHomeContext(context: HomeContext | null) {
  cachedContext = context;
  listeners.forEach((listener) => listener(context));
}

export function subscribeToHomeContext(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
