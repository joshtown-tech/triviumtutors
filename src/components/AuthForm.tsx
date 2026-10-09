"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Turnstile, turnstileOn } from "@/components/Turnstile";

type Mode = "signup" | "login" | "forgot" | "reset";

const field =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-3 text-base text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-2 focus:ring-gold";
const label = "mb-1.5 block text-sm font-medium text-ink";

const COPY: Record<Mode, { title: string; lead: string; button: string }> = {
  signup: {
    title: "Create your free account",
    lead: "An account keeps requests genuine and lets us reply to an address we know is yours. It takes under a minute.",
    button: "Create account",
  },
  login: { title: "Welcome back", lead: "Sign in to send a request.", button: "Sign in" },
  forgot: { title: "Reset your password", lead: "Enter your email and we will send you a link to choose a new password.", button: "Send reset link" },
  reset: { title: "Choose a new password", lead: "Use at least 8 characters.", button: "Save new password" },
};

export function AuthForm({ mode, next, notice }: { mode: Mode; next: string; notice?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [token, setToken] = useState("");
  const [tokenReset, setTokenReset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [done, setDone] = useState<"confirm" | "sent" | "updated" | "resent" | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const c = COPY[mode];
  const needsCaptcha = mode === "signup" || mode === "forgot";

  async function call(action: string, payload: Record<string, unknown>) {
    const res = await fetch(`/api/auth/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string; code?: string; next?: string };
    return { ok: res.ok, data };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setUnconfirmed(false);
    if (mode === "signup" && name.trim().length < 2) return setError("Please tell us your name.");
    if (mode !== "reset" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError("Please enter a valid email address.");
    if ((mode === "signup" || mode === "reset") && password.length < 8) return setError("Please choose a password of at least 8 characters.");
    if (mode === "login" && !password) return setError("Please enter your password.");
    if (mode === "signup" && !terms) return setError("Please accept the terms and privacy policy to continue.");
    if (needsCaptcha && turnstileOn && !token) return setError("Please complete the security check.");

    setBusy(true);
    try {
      const action = mode === "reset" ? "update-password" : mode;
      const { ok, data } = await call(action, { name, email, password, next, acceptTerms: terms, website, startedAt: startedAt.current, turnstileToken: token });
      if (!ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setUnconfirmed(data.code === "unconfirmed");
        if (needsCaptcha) {
          setToken("");
          setTokenReset((n) => n + 1);
        }
        return;
      }
      if (mode === "signup") {
        if (data.status === "signed_in") return window.location.assign(next);
        return setDone("confirm");
      }
      if (mode === "login") return window.location.assign(data.next || next);
      if (mode === "forgot") return setDone("sent");
      if (mode === "reset") return setDone("updated");
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError("");
    const { ok, data } = await call("resend", { email, next });
    setBusy(false);
    if (!ok) return setError(data.error || "We could not send that just now. Please try again shortly.");
    setDone("resent");
  }

  if (done === "confirm" || done === "resent") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
        <h2 className="text-3xl text-ink">Check your email</h2>
        <p className="mt-3 text-lg leading-relaxed text-ink-soft">
          We sent a confirmation link to <strong className="text-ink">{email}</strong>. Open it on this device to finish creating your account.
        </p>
        <p className="mt-3 text-sm text-muted">Nothing there after a few minutes? Check your spam folder.</p>
        {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
        <button type="button" onClick={resend} disabled={busy} className="mt-5 rounded-full border border-ink px-5 py-2.5 text-sm font-medium text-ink hover:bg-sand disabled:opacity-60">
          {busy ? "Sending..." : done === "resent" ? "Sent again. Send once more" : "Send the email again"}
        </button>
      </div>
    );
  }

  if (done === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
        <h2 className="text-3xl text-ink">Check your email</h2>
        <p className="mt-3 text-lg leading-relaxed text-ink-soft">If an account exists for that address, a link to reset your password is on its way. It can take a few minutes.</p>
        <Link href="/login" className="mt-5 inline-block font-semibold text-ink underline">Back to sign in</Link>
      </div>
    );
  }

  if (done === "updated") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
        <h2 className="text-3xl text-ink">Password updated</h2>
        <p className="mt-3 text-lg text-ink-soft">You are signed in and ready to go.</p>
        <Link href="/request" className="mt-5 inline-block rounded-full bg-ink px-6 py-3 font-medium text-cream hover:bg-ink-soft">Make a request</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-line bg-paper p-6 sm:p-8" aria-label={c.title}>
      <h1 className="text-3xl text-ink sm:text-4xl">{c.title}</h1>
      <p className="mt-2 text-ink-soft">{c.lead}</p>

      {notice && <p role="status" className="mt-5 rounded-lg border border-gold/50 bg-[#fff9e8] px-4 py-3 text-sm text-ink-soft">{notice}</p>}

      <div className="mt-6 space-y-5">
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className={label}>Your name</label>
            <input id="name" autoComplete="name" className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
        )}
        {mode !== "reset" && (
          <div>
            <label htmlFor="email" className={label}>Email</label>
            <input id="email" type="email" autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} />
          </div>
        )}
        {mode !== "forgot" && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-ink">{mode === "reset" ? "New password" : "Password"}</label>
              {mode === "login" && <Link href="/forgot" className="text-sm text-ink-soft underline hover:text-ink">Forgot password?</Link>}
            </div>
            <div className="relative">
              <input
                id="password"
                type={show ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={`${field} pr-16`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={72}
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-ink-soft hover:text-ink" aria-pressed={show}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
            {mode !== "login" && <p className="mt-1 text-xs text-muted">At least 8 characters.</p>}
          </div>
        )}

        {mode === "signup" && (
          <>
            {/* Honeypot: invisible to people, tempting to bots. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
            </div>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-soft">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#14284b]" />
              <span>
                I agree to the <Link href="/terms" target="_blank" className="underline hover:text-ink">terms</Link> and <Link href="/privacy" target="_blank" className="underline hover:text-ink">privacy policy</Link>, and I understand Trivium Tutors helps me with my <strong>own</strong> work and never does it for me.
              </span>
            </label>
          </>
        )}

        {needsCaptcha && <Turnstile onToken={setToken} resetKey={tokenReset} />}
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
          {unconfirmed && (
            <button type="button" onClick={resend} className="ml-2 font-semibold underline">Send the email again</button>
          )}
        </p>
      )}

      <button type="submit" disabled={busy} className="mt-6 w-full rounded-full bg-ink px-7 py-3.5 font-medium text-cream transition hover:bg-ink-soft disabled:opacity-60">
        {busy ? "Please wait..." : c.button}
      </button>

      <p className="mt-5 text-center text-sm text-ink-soft">
        {mode === "signup" && <>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline">Sign in</Link></>}
        {mode === "login" && <>New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-ink underline">Create a free account</Link></>}
        {mode === "forgot" && <Link href="/login" className="font-semibold text-ink underline">Back to sign in</Link>}
      </p>
    </form>
  );
}
