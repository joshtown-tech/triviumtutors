"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CONTACT_PREFS, COUNTRIES, LEVELS, SERVICES, STYLES, serviceById, type ServiceId } from "@/lib/services";
import { Turnstile, turnstileOn } from "@/components/Turnstile";

type Form = {
  service: ServiceId | "";
  subject: string;
  level: string;
  deadline: string;
  details: string;
  wordCount: string;
  style: string;
  name: string;
  email: string;
  country: string;
  contactPref: "email" | "whatsapp";
  whatsapp: string;
  website: string; // honeypot
  integrityAck: boolean;
};

const EMPTY: Form = {
  service: "", subject: "", level: "", deadline: "", details: "", wordCount: "", style: "",
  name: "", email: "", country: "", contactPref: "email", whatsapp: "", website: "", integrityAck: false,
};

const input =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-3 text-base text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-2 focus:ring-gold";
const label = "mb-1.5 block text-sm font-medium text-ink";
const hint = "mt-1 text-xs text-muted";

type Result = { status: "received" | "declined"; id: string; route: "call" | "quote" } | null;

export function RequestForm({ initialService }: { initialService?: string }) {
  const start = serviceById(initialService ?? "")?.id ?? "";
  const [f, setF] = useState<Form>({ ...EMPTY, service: start });
  const [step, setStep] = useState<1 | 2 | 3>(start ? 2 : 1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [token, setToken] = useState("");
  const [tokenReset, setTokenReset] = useState(0);
  const startedAt = useRef(0);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const service = f.service ? serviceById(f.service) : undefined;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const today = new Date().toISOString().slice(0, 10);

  function goto(n: 1 | 2 | 3) {
    setError("");
    setStep(n);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function checkStep2(): string {
    if (f.subject.trim().length < 2) return "Please tell us the subject or topic.";
    if (!f.level) return "Please choose your level.";
    if (f.details.trim().length < 30) return "Please give us a little more detail (at least a couple of sentences).";
    return "";
  }

  function checkStep3(): string {
    if (f.name.trim().length < 2) return "Please tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) return "Please enter a valid email address.";
    if (!f.country) return "Please choose your country.";
    if (f.contactPref === "whatsapp" && f.whatsapp.replace(/\D/g, "").length < 7) return "Please enter your WhatsApp number with the country code.";
    if (!f.integrityAck) return "Please confirm that you have read how we work.";
    if (turnstileOn && !token) return "Please complete the security check.";
    return "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = checkStep3();
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          wordCount: f.wordCount ? Number(f.wordCount) : null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          startedAt: startedAt.current,
          turnstileToken: token,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setToken("");
        setTokenReset((n) => n + 1);
        return;
      }
      setResult(data as Result);
      requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setError("We could not reach the server. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (result?.status === "received") {
    return (
      <div ref={top} className="rounded-2xl border border-line bg-paper p-6 sm:p-10" role="status">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold-deep">Request {result.id}</p>
        <h2 className="mt-2 text-3xl text-ink">Thank you, we have it.</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          {result.route === "call"
            ? "A person on our team will read your request and get back to you to arrange a short intro call and agree a plan."
            : "A person on our team will read your request and get back to you with a quote and turnaround time."}
        </p>
        <p className="mt-3 text-ink-soft">Check your inbox for a confirmation. If you do not see it, look in your spam folder.</p>
        <Link href="/" className="mt-8 inline-block rounded-full bg-ink px-6 py-3 font-medium text-cream hover:bg-ink-soft">
          Back to home
        </Link>
      </div>
    );
  }

  if (result?.status === "declined") {
    return (
      <div ref={top} className="rounded-2xl border border-line bg-paper p-6 sm:p-10" role="status">
        <h2 className="text-3xl text-ink">We cannot help with this one.</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          It sounds like you want someone to complete assessed work for you, such as an exam, a class, or an essay you would hand in as your own. We do not do that, because it is academic misconduct and could put your place or your degree at risk.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-ink-soft">
          What we can do is help you get there yourself: tutoring so you understand the material, coaching on how to plan and write, and feedback and proofreading on your own draft.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setF({ ...EMPTY, service: "tutoring" });
              goto(2);
            }}
            className="rounded-full bg-ink px-6 py-3 font-medium text-cream hover:bg-ink-soft"
          >
            Ask for tutoring instead
          </button>
          <Link href="/integrity" className="rounded-full border border-ink px-6 py-3 font-medium text-ink hover:bg-sand">
            How we work
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted">If you think we misread your request, email us and a person will take a look.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-line bg-paper p-5 sm:p-8" aria-label="Request form">
      <div ref={top} className="scroll-mt-24" />
      <ol className="mb-8 flex items-center gap-2 text-sm" aria-label="Progress">
        {["Service", "Details", "You"].map((s, i) => {
          const n = i + 1;
          const on = n === step;
          const done = n < step;
          return (
            <li key={s} className="flex flex-1 items-center gap-2" aria-current={on ? "step" : undefined}>
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  on ? "bg-ink text-cream" : done ? "bg-gold text-ink" : "bg-sand text-muted"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className={`hidden sm:inline ${on ? "font-semibold text-ink" : "text-muted"}`}>{s}</span>
              {n < 3 && <span className="h-px flex-1 bg-line" />}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <fieldset>
          <legend className="font-serif text-2xl text-ink">What do you need help with?</legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {SERVICES.map((s) => {
              const on = f.service === s.id;
              return (
                <label
                  key={s.id}
                  className={`cursor-pointer rounded-xl border p-4 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${
                    on ? "border-ink bg-sand" : "border-line hover:border-ink-soft"
                  }`}
                >
                  <input
                    type="radio"
                    name="service"
                    value={s.id}
                    checked={on}
                    onChange={() => {
                      set("service", s.id);
                      setError("");
                    }}
                    className="sr-only"
                  />
                  <span className="block font-semibold text-ink">{s.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{s.blurb}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted">
            We do not sit exams, attend classes for you, or write work to be handed in under your name.{" "}
            <Link href="/integrity" className="underline hover:text-ink">Why</Link>
          </p>
        </fieldset>
      )}

      {step === 2 && service && (
        <div className="space-y-5">
          <div>
            <h2 className="font-serif text-2xl text-ink">{service.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{service.next}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="subject" className={label}>Subject or topic</label>
              <input id="subject" className={input} value={f.subject} onChange={(e) => set("subject", e.target.value)} placeholder="e.g. Organic chemistry, Contract law" maxLength={120} />
            </div>
            <div>
              <label htmlFor="level" className={label}>Your level</label>
              <select id="level" className={input} value={f.level} onChange={(e) => set("level", e.target.value)}>
                <option value="">Choose one</option>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="deadline" className={label}>{service.route === "call" ? "Want to start by" : "Deadline"} <span className="font-normal text-muted">(optional)</span></label>
              <input id="deadline" type="date" min={today} className={`${input} min-w-0`} value={f.deadline} onChange={(e) => set("deadline", e.target.value)} />
              <p className={hint}>Leave blank if you are flexible.</p>
            </div>
            {service.id === "editing" && (
              <div>
                <label htmlFor="wordCount" className={label}>Approximate word count <span className="font-normal text-muted">(optional)</span></label>
                <input id="wordCount" type="number" inputMode="numeric" min={1} className={`${input} min-w-0`} value={f.wordCount} onChange={(e) => set("wordCount", e.target.value)} placeholder="e.g. 3000" />
              </div>
            )}
          </div>
          {(service.id === "editing" || service.id === "coaching") && (
            <div>
              <label htmlFor="style" className={label}>Referencing style <span className="font-normal text-muted">(optional)</span></label>
              <select id="style" className={input} value={f.style} onChange={(e) => set("style", e.target.value)}>
                <option value="">Not sure or not applicable</option>
                {STYLES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="details" className={label}>Tell us more</label>
            <textarea id="details" rows={6} className={input} value={f.details} onChange={(e) => set("details", e.target.value)} placeholder={service.detailsPrompt} maxLength={3000} />
            <p className={hint}>{f.details.trim().length}/3000. Please do not paste personal documents here; we will arrange sharing safely.</p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <h2 className="font-serif text-2xl text-ink">How do we reach you?</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={label}>Your name</label>
              <input id="name" autoComplete="name" className={input} value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
            </div>
            <div>
              <label htmlFor="email" className={label}>Email</label>
              <input id="email" type="email" autoComplete="email" className={input} value={f.email} onChange={(e) => set("email", e.target.value)} maxLength={254} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="country" className={label}>Country</label>
              <select id="country" autoComplete="country-name" className={input} value={f.country} onChange={(e) => set("country", e.target.value)}>
                <option value="">Choose one</option>
                {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="pref" className={label}>Best way to reply</label>
              <select id="pref" className={input} value={f.contactPref} onChange={(e) => set("contactPref", e.target.value as Form["contactPref"])}>
                {CONTACT_PREFS.map((c) => <option key={c} value={c}>{c === "email" ? "Email" : "WhatsApp"}</option>)}
              </select>
            </div>
          </div>
          {f.contactPref === "whatsapp" && (
            <div>
              <label htmlFor="whatsapp" className={label}>WhatsApp number</label>
              <input id="whatsapp" type="tel" autoComplete="tel" className={input} value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+44 7700 900123" maxLength={25} />
              <p className={hint}>Include the country code.</p>
            </div>
          )}

          {/* Honeypot: invisible to people, tempting to bots. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} /></label>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 text-sm leading-relaxed text-ink-soft">
            <input type="checkbox" checked={f.integrityAck} onChange={(e) => set("integrityAck", e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#14284b]" />
            <span>
              I understand Trivium Tutors helps me learn and improve my <strong>own</strong> work. It does not sit exams, attend classes for me, or write work for me to submit as mine.{" "}
              <Link href="/integrity" target="_blank" className="underline hover:text-ink">How we work</Link>
            </span>
          </label>

          <Turnstile onToken={setToken} resetKey={tokenReset} />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-5 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 1 ? (
          <button type="button" onClick={() => goto((step - 1) as 1 | 2)} className="rounded-full px-5 py-3 font-medium text-ink-soft hover:bg-sand">
            Back
          </button>
        ) : <span />}
        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1) return f.service ? goto(2) : setError("Please choose a service to continue.");
              const p = checkStep2();
              return p ? setError(p) : goto(3);
            }}
            className="rounded-full bg-ink px-7 py-3 font-medium text-cream transition hover:bg-ink-soft"
          >
            Continue
          </button>
        ) : (
          <button type="submit" disabled={busy} className="rounded-full bg-ink px-7 py-3 font-medium text-cream transition hover:bg-ink-soft disabled:opacity-60">
            {busy ? "Sending..." : "Send my request"}
          </button>
        )}
      </div>
    </form>
  );
}
