import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { RequestInput } from "@/lib/request";
import type { Screening } from "@/lib/screening";

// A backup record of every request in Supabase, written with the service role
// key (server only; the table has row level security on and no public
// policies). It never throws, and it stays off until both env vars are set, so
// the site still runs without it. The email and Slack messages are what the
// team acts on; this is what makes sure a request survives if both are down.

let client: SupabaseClient | null | undefined;

function db(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}

export const storeEnabled = (): boolean => db() !== null;

/** Inserts the request. Returns true if it was saved. */
export async function saveRequest(id: string, input: RequestInput, screening: Screening, notified: boolean): Promise<boolean> {
  const supabase = db();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("requests").upsert({
      id,
      verdict: screening.verdict,
      score: screening.score,
      reasons: screening.reasons,
      summary: screening.summary || null,
      notified,
      service: input.service,
      subject: input.subject,
      level: input.level,
      deadline: input.deadline || null,
      details: input.details,
      word_count: input.wordCount,
      style: input.style || null,
      name: input.name,
      email: input.email,
      country: input.country,
      timezone: input.timezone || null,
      contact_pref: input.contactPref,
      whatsapp: input.whatsapp || null,
    });
    if (error) {
      console.error("[store] insert failed", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[store] insert threw", err);
    return false;
  }
}
