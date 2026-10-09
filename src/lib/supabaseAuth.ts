import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

// Customer accounts, on Supabase Auth. Everything here is server-only: the
// anon key is read from a plain (non NEXT_PUBLIC) variable and the browser
// never talks to Supabase directly. It stays OFF until SUPABASE_ANON_KEY is
// set, so the site keeps working exactly as before without it.

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON = process.env.SUPABASE_ANON_KEY || "";

// The session cookie is HttpOnly: no script on the page can read it, because nothing in the
// browser ever talks to Supabase directly. Every account action goes through our own routes.
export const authEnabled = Boolean(URL && ANON);

/** A Supabase client bound to this request's cookies (reads and refreshes the session). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === "production" }));
        } catch {
          // Called from a Server Component, which cannot set cookies. The proxy refreshes the session instead.
        }
      },
    },
  });
}

/** The signed-in customer, or null. Always asks Supabase to verify the session, never trusts the cookie alone. */
export async function currentUser(): Promise<User | null> {
  if (!authEnabled) return null;
  try {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function displayName(user: User): string {
  const n = user.user_metadata?.full_name;
  return typeof n === "string" && n.trim() ? n.trim() : "";
}

/** Only ever redirect to a path on this site, never to another host. */
export function safeNext(raw: unknown, fallback = "/request"): string {
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  if (raw.startsWith("/api/") || raw.startsWith("/auth/")) return fallback;
  return raw.slice(0, 300);
}

export const SUPABASE_URL = URL;
export const SUPABASE_ANON_KEY = ANON;
