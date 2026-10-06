// A small in-memory limiter. On a serverless host each instance keeps its own
// counts, so this is a speed bump rather than a hard wall; the real defences
// are Turnstile and the AI screen. Good enough for an MVP, and it needs no
// database. Swap for a shared store (Upstash, Supabase) if abuse shows up.

const hits = new Map<string, number[]>();

/** True while within `limit` calls per `windowSeconds` for this key. */
export function withinLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const cutoff = now - windowSeconds * 1000;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => t <= cutoff)) hits.delete(k);
  }
  return true;
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
