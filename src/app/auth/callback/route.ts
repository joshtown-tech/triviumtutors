import { NextResponse } from "next/server";
import { authEnabled, safeNext, supabaseServer } from "@/lib/supabaseAuth";

// The link in a confirmation or password-reset email lands here with a one-time
// code. We swap it for a session cookie, then send the person on their way.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  if (!authEnabled || !code) return NextResponse.redirect(new URL("/login?error=link", url));
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth] callback exchange failed", error.code, error.message);
    // Typically the link was opened in a different browser than the one that signed up.
    return NextResponse.redirect(new URL("/login?error=link", url));
  }
  return NextResponse.redirect(new URL(next, url));
}
