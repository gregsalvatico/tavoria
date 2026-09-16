export type MediaKind = "photo" | "video";

export type MediaItem = {
  url: string;
  kind: MediaKind;
};

export function uniqueMediaItems<T extends MediaItem>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.kind + ":" + item.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

