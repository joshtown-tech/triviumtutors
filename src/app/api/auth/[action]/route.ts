import { NextResponse } from "next/server";
import { authEnabled, displayName, safeNext, supabaseServer } from "@/lib/supabaseAuth";
import { clientIp, withinLimit } from "@/lib/rateLimit";
import { verifyTurnstile } from "@/lib/turnstile";

// One route for every account action: signup, login, logout, forgot (send a
// reset email), update-password, resend (the confirmation email) and me.
// Errors are deliberately vague where being specific would let a stranger find
// out who has an account.

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
const fail = (error: string, status = 400) => json({ error }, status);
const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

function text(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function badPassword(p: string): string | null {
  if (p.length < 8) return "Please choose a password of at least 8 characters.";
  if (p.length > 72) return "That password is too long. Please use 72 characters or fewer.";
  if (/^(.)\1+$/.test(p)) return "Please choose a less repetitive password.";
  return null;
}

export async function POST(req: Request, ctx: RouteContext<"/api/auth/[action]">) {
  const { action } = await ctx.params;
  if (!authEnabled) return fail("Accounts are not switched on yet. Please check back soon.", 503);

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const ip = clientIp(req);
  const origin = process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === "production" ? process.env.NEXT_PUBLIC_SITE_URL : new URL(req.url).origin;
  const supabase = await supabaseServer();

  if (action === "me") {
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    return json({ user: u ? { email: u.email ?? "", name: displayName(u) } : null });
  }

  if (action === "logout") {
    await supabase.auth.signOut();
    return json({ ok: true });
  }

  if (action === "signup") {
    if (!withinLimit(`signup:ip:${ip}`, 5, 3600)) return fail(TOO_MANY, 429);
    // Bots: a field no person sees, and a form submitted faster than a person can fill it in.
    const tooFast = !(typeof body.startedAt === "number") || Date.now() - body.startedAt < 3000;
    if (text(body.website, 100) || tooFast) return json({ status: "confirm" }); // looks like success, does nothing
    const name = text(body.name, 80);
    const email = text(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (name.length < 2) return fail("Please tell us your name.");
    if (!EMAIL_RE.test(email)) return fail("Please enter a valid email address.");
    const weak = badPassword(password);
    if (weak) return fail(weak);
    if (body.acceptTerms !== true) return fail("Please accept the terms and privacy policy to continue.");
    if (!(await verifyTurnstile(text(body.turnstileToken, 2048), ip))) return fail("The security check did not pass. Please refresh the page and try again.");
    if (!withinLimit(`signup:email:${email}`, 3, 3600)) return fail(TOO_MANY, 429);

    const next = safeNext(body.next);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      console.error("[auth] signup failed", error.status, error.code, error.message);
      if (error.code === "weak_password") return fail("That password is too easy to guess. Please choose a stronger one.");
      if (error.status === 429 || error.code === "over_email_send_rate_limit") return fail("We cannot send emails right now. Please try again in a little while.", 429);
      return fail("We could not create your account. Please check your details and try again.");
    }
    // Email confirmation on: no session yet. Off: they are signed in already.
    // For an address that already has an account Supabase also returns success without a session, so this never reveals who is registered.
    return json({ status: data.session ? "signed_in" : "confirm" });
  }

  if (action === "login") {
    const email = text(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!withinLimit(`login:ip:${ip}`, 20, 900) || !withinLimit(`login:email:${email}`, 8, 900)) return fail(TOO_MANY, 429);
    if (!EMAIL_RE.test(email) || !password) return fail("Please enter your email and password.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === "email_not_confirmed") return json({ error: "Please confirm your email first. Check your inbox for our message.", code: "unconfirmed" }, 400);
      if (error.status === 429) return fail(TOO_MANY, 429);
      return fail("That email and password do not match.", 400);
    }
    return json({ status: "signed_in", next: safeNext(body.next) });
  }

  if (action === "resend") {
    const email = text(body.email, 254).toLowerCase();
    if (!EMAIL_RE.test(email)) return fail("Please enter a valid email address.");
    if (!withinLimit(`resend:ip:${ip}`, 5, 3600) || !withinLimit(`resend:email:${email}`, 3, 3600)) return fail(TOO_MANY, 429);
    await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(body.next))}` } });
    return json({ status: "sent" }); // same answer whether or not the address exists
  }

  if (action === "forgot") {
    const email = text(body.email, 254).toLowerCase();
    if (!EMAIL_RE.test(email)) return fail("Please enter a valid email address.");
    if (!withinLimit(`forgot:ip:${ip}`, 5, 3600) || !withinLimit(`forgot:email:${email}`, 3, 3600)) return fail(TOO_MANY, 429);
    if (!(await verifyTurnstile(text(body.turnstileToken, 2048), ip))) return fail("The security check did not pass. Please refresh the page and try again.");
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset")}` });
    return json({ status: "sent" }); // same answer whether or not the address exists
  }

  if (action === "update-password") {
    const password = typeof body.password === "string" ? body.password : "";
    const weak = badPassword(password);
    if (weak) return fail(weak);
    const { data } = await supabase.auth.getUser();
    if (!data.user) return fail("This reset link has expired. Please ask for a new one.", 401);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      if (error.code === "weak_password") return fail("That password is too easy to guess. Please choose a stronger one.");
      console.error("[auth] update-password failed", error.code, error.message);
      return fail("We could not change your password. Please ask for a new reset link.");
    }
    return json({ status: "updated" });
  }

  return fail("Not found.", 404);
}
