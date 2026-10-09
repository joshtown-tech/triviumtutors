"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CONTACT_PREFS, COUNTRIES, LEVELS, SERVICES, STYLES, serviceById, type ServiceId } from "@/lib/services";
import {
  CAREER_ITEMS, DOC_TYPES, EDIT_LEVELS, EDIT_MAX_WORDS, EDIT_MIN_WORDS, HOUR_DISCOUNTS, HOURLY, MAX_HOURS, PAYMENT_METHODS, TURNAROUNDS,
  addonsFor, estimate, turnaroundProblem, usd,
} from "@/lib/pricing";
import { Turnstile, turnstileOn } from "@/components/Turnstile";

type Form = {
  service: ServiceId | "";
  subject: string;
  level: string;
  deadline: string;
  details: string;
  docType: string;
  editLevel: string;
  wordCount: string;
  style: string;
  turnaround: string;
  addons: string[];
  hours: string;
  careerItem: string;
  fileLink: string;
  paymentPref: string;
  name: string;
  email: string;
  country: string;
  contactPref: "email" | "whatsapp";
  whatsapp: string;
  website: string; // honeypot
  integrityAck: boolean;
};

const EMPTY: Form = {
  service: "", subject: "", level: "", deadline: "", details: "", docType: "", editLevel: "edit", wordCount: "", style: "",
  turnaround: "d5", addons: [], hours: "1", careerItem: "", fileLink: "", paymentPref: "",
  name: "", email: "", country: "", contactPref: "email", whatsapp: "", website: "", integrityAck: false,
};

const input =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-3 text-base text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none focus:ring-2 focus:ring-gold";
const label = "mb-1.5 block text-sm font-medium text-ink";
const hint = "mt-1 text-xs text-muted";
const optionCard = "cursor-pointer rounded-xl border p-3.5 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold";

type Result = { status: "received" | "declined"; id: string; route: "call" | "quote"; estimate: number | null } | null;

function Estimate({ f }: { f: Form }) {
  if (!f.service) return null;
  const est = estimate({
    service: f.service,
    editLevel: f.editLevel,
    wordCount: f.wordCount ? Number(f.wordCount) : null,
    turnaround: f.turnaround,
    addons: f.addons,
    hours: f.hours ? Number(f.hours) : null,
    careerItem: f.careerItem,
  });
  return (
    <div className="rounded-xl border border-gold/50 bg-[#fff9e8] p-4" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-widest text-gold-deep">Your estimate</p>
      {est ? (
        <>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft">
            {est.lines.map((l) => (
              <li key={l.label} className="flex justify-between gap-4">
                <span>{l.label}</span>
                <span className="shrink-0 tabular-nums">{usd(l.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-gold/40 pt-3 font-serif text-xl text-ink">
            <span>Estimated total</span>
            <span className="tabular-nums">{usd(est.total)}</span>
          </p>
          <p className="mt-2 text-xs text-muted">In US dollars. This is an estimate, not an invoice. We confirm the final price with you before any work starts, and you pay nothing on this form.</p>
        </>
      ) : (
        <p className="mt-1 text-sm text-ink-soft">Fill in the details above and your estimate appears here.</p>
      )}
    </div>
  );
}

export function RequestForm({ initialService, initialWords }: { initialService?: string; initialWords?: string }) {
  const start = serviceById(initialService ?? "")?.id ?? "";
  const [f, setF] = useState<Form>({ ...EMPTY, service: start, wordCount: start === "editing" && initialWords ? initialWords : "" });
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
  const words = f.wordCount ? Number(f.wordCount) : null;
  const toggleAddon = (id: string) => set("addons", f.addons.includes(id) ? f.addons.filter((a) => a !== id) : [...f.addons, id]);

  function pickService(id: ServiceId) {
    // Switching service clears the choices that only made sense for the old one.
    setF((p) => ({ ...EMPTY, service: id, subject: p.subject, level: p.level, details: p.details }));
    setError("");
  }

  function goto(n: 1 | 2 | 3) {
    setError("");
    setStep(n);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function checkStep2(): string {
    if (!service) return "Please choose a service.";
    if (service.id === "editing") {
      if (!f.docType) return "Please choose the type of document.";
      if (!words || words < EDIT_MIN_WORDS) return `Please enter the word count (at least ${EDIT_MIN_WORDS}).`;
      if (words > EDIT_MAX_WORDS) return "For documents this long, please tell us the length in the details and we will quote you directly.";
    }
    if (service.id === "career" && !f.careerItem) return "Please choose what you would like reviewed.";
    if (service.route === "call") {
      const h = Number(f.hours);
      if (!Number.isInteger(h) || h < 1 || h > MAX_HOURS) return `Please choose between 1 and ${MAX_HOURS} hours.`;
    } else {
      const p = turnaroundProblem(f.turnaround, words);
      if (p) return p;
    }
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
    if (!f.paymentPref) return "Please choose how you would prefer to pay.";
    if (!f.integrityAck) return "Please confirm that you have read how we work.";
    if (turnstileOn && !token) return "Please complete the security check.";
    return "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = checkStep2() || checkStep3();
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
          hours: f.hours ? Number(f.hours) : null,
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
            : "A person on our team will read your request and get back to you to confirm the price and turnaround."}
        </p>
        {result.estimate !== null && (
          <p className="mt-3 text-ink-soft">
            Your estimate was <strong className="text-ink">{usd(result.estimate)}</strong>. Nothing has been charged. We confirm the final price with you first.
          </p>
        )}
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

  const addons = service ? addonsFor(service.id) : [];

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
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${on ? "bg-ink text-cream" : done ? "bg-gold text-ink" : "bg-sand text-muted"}`}>
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
                <label key={s.id} className={`${optionCard} p-4 ${on ? "border-ink bg-sand" : "border-line hover:border-ink-soft"}`}>
                  <input type="radio" name="service" value={s.id} checked={on} onChange={() => pickService(s.id)} className="sr-only" />
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
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl text-ink">{service.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{service.next}</p>
          </div>

          {service.id === "editing" && (
            <>
              <fieldset>
                <legend className={label}>What would you like us to do?</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {EDIT_LEVELS.map((l) => (
                    <label key={l.id} className={`${optionCard} ${f.editLevel === l.id ? "border-ink bg-sand" : "border-line hover:border-ink-soft"}`}>
                      <input type="radio" name="editLevel" checked={f.editLevel === l.id} onChange={() => set("editLevel", l.id)} className="sr-only" />
                      <span className="block font-semibold text-ink">{l.label}</span>
                      <span className="mt-0.5 block text-sm text-ink-soft">{l.blurb}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="docType" className={label}>Type of document</label>
                  <select id="docType" className={input} value={f.docType} onChange={(e) => set("docType", e.target.value)}>
                    <option value="">Choose one</option>
                    {DOC_TYPES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="wordCount" className={label}>Word count</label>
                  <input id="wordCount" type="number" inputMode="numeric" min={EDIT_MIN_WORDS} max={EDIT_MAX_WORDS} className={`${input} min-w-0`} value={f.wordCount} onChange={(e) => set("wordCount", e.target.value)} placeholder="e.g. 3000" />
                  <p className={hint}>Of the draft you want edited. Minimum {EDIT_MIN_WORDS}.</p>
                </div>
              </div>
            </>
          )}

          {service.id === "career" && (
            <fieldset>
              <legend className={label}>What would you like reviewed?</legend>
              <div className="grid gap-3">
                {CAREER_ITEMS.map((c) => (
                  <label key={c.id} className={`${optionCard} flex items-center justify-between gap-4 ${f.careerItem === c.id ? "border-ink bg-sand" : "border-line hover:border-ink-soft"}`}>
                    <input type="radio" name="careerItem" checked={f.careerItem === c.id} onChange={() => set("careerItem", c.id)} className="sr-only" />
                    <span className="font-medium text-ink">{c.label}</span>
                    <span className="text-sm tabular-nums text-ink-soft">{usd(c.price)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {service.route === "call" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="hours" className={label}>Hours you would like to book</label>
                <input id="hours" type="number" inputMode="numeric" min={1} max={MAX_HOURS} className={`${input} min-w-0`} value={f.hours} onChange={(e) => set("hours", e.target.value)} />
                <p className={hint}>
                  ${HOURLY[service.id]}/hour. {HOUR_DISCOUNTS.map((d) => `${Math.round(d.off * 100)}% off ${d.minHours}+ hours`).reverse().join(", ")}.
                </p>
              </div>
              <div>
                <label htmlFor="deadline" className={label}>Want to start by <span className="font-normal text-muted">(optional)</span></label>
                <input id="deadline" type="date" min={today} className={`${input} min-w-0`} value={f.deadline} onChange={(e) => set("deadline", e.target.value)} />
                <p className={hint}>Leave blank if you are flexible.</p>
              </div>
            </div>
          )}

          {(service.id === "editing" || service.id === "career") && (
            <fieldset>
              <legend className={label}>How soon do you need it back?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {TURNAROUNDS.map((t) => {
                  const blocked = service.id === "editing" && words !== null && words > t.maxWords;
                  return (
                    <label key={t.id} className={`${optionCard} flex items-center justify-between gap-3 ${blocked ? "cursor-not-allowed opacity-45" : ""} ${f.turnaround === t.id ? "border-ink bg-sand" : "border-line hover:border-ink-soft"}`}>
                      <input type="radio" name="turnaround" disabled={blocked} checked={f.turnaround === t.id} onChange={() => set("turnaround", t.id)} className="sr-only" />
                      <span className="text-sm font-medium text-ink">{t.label}</span>
                      <span className="text-xs text-muted">{t.surcharge > 0 ? `+${Math.round(t.surcharge * 100)}%` : "standard"}</span>
                    </label>
                  );
                })}
              </div>
              {service.id === "editing" && <p className={hint}>Shorter turnarounds are only offered for shorter documents.</p>}
            </fieldset>
          )}

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
            <textarea id="details" rows={5} className={input} value={f.details} onChange={(e) => set("details", e.target.value)} placeholder={service.detailsPrompt} maxLength={3000} />
            <p className={hint}>{f.details.trim().length}/3000. Please do not paste the full document or personal details here.</p>
          </div>

          {(service.id === "editing" || service.id === "career") && (
            <div>
              <label htmlFor="fileLink" className={label}>Link to your document <span className="font-normal text-muted">(optional)</span></label>
              <input id="fileLink" type="url" inputMode="url" className={input} value={f.fileLink} onChange={(e) => set("fileLink", e.target.value)} placeholder="https://drive.google.com/..." maxLength={600} />
              <p className={hint}>Google Drive, Dropbox, OneDrive, Box, iCloud or WeTransfer. Make sure anyone with the link can view it. You can also send it later.</p>
            </div>
          )}

          {addons.length > 0 && (
            <fieldset>
              <legend className={label}>Extras <span className="font-normal text-muted">(optional)</span></legend>
              <div className="grid gap-2">
                {addons.map((a) => (
                  <label key={a.id} className={`${optionCard} flex items-start gap-3 ${f.addons.includes(a.id) ? "border-ink bg-sand" : "border-line hover:border-ink-soft"}`}>
                    <input type="checkbox" checked={f.addons.includes(a.id)} onChange={() => toggleAddon(a.id)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#14284b]" />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-ink">{a.label}</span>
                      <span className="block text-xs text-ink-soft">{a.blurb}</span>
                    </span>
                    <span className="text-sm tabular-nums text-ink-soft">{usd(a.price)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <Estimate f={f} />
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
          <div>
            <label htmlFor="payment" className={label}>How would you prefer to pay?</label>
            <select id="payment" className={input} value={f.paymentPref} onChange={(e) => set("paymentPref", e.target.value)}>
              <option value="">Choose one</option>
              {PAYMENT_METHODS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <p className={hint}>Nothing is charged here. We send an invoice or payment link once we have agreed the price, and work starts when payment arrives. We never ask for card details or passwords on this form. See our <Link href="/refunds" target="_blank" className="underline hover:text-ink">revisions and refunds</Link>.</p>
          </div>

          {/* Honeypot: invisible to people, tempting to bots. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} /></label>
          </div>

          <Estimate f={f} />

          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-sand p-4 text-sm leading-relaxed text-ink-soft">
            <input type="checkbox" checked={f.integrityAck} onChange={(e) => set("integrityAck", e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#14284b]" />
            <span>
              I understand Trivium Tutors helps me learn and improve my <strong>own</strong> work. It does not sit exams, attend classes for me, or write work for me to submit as mine. Any document I send is a draft I wrote myself.{" "}
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
