import type { ServiceId } from "@/lib/services";

// Every price on the site comes from this file, and it is used twice: by the
// form to show a live estimate, and by the server to recompute the same
// estimate from the submitted fields (the browser's number is never trusted).
//
// THE NUMBERS BELOW ARE PLACEHOLDER DEFAULTS, NOT MARKET RESEARCH. Set them to
// what the business actually wants to charge before the domain goes live. All
// prices are in US dollars.

export const CURRENCY = "USD";

export const EDIT_LEVELS = [
  { id: "proofread", label: "Proofreading", blurb: "Spelling, grammar, punctuation and typos.", perWord: 0.02 },
  { id: "edit", label: "Full edit", blurb: "Proofreading plus clarity, flow, structure and tone.", perWord: 0.035 },
] as const;
export type EditLevelId = (typeof EDIT_LEVELS)[number]["id"];

export const EDIT_MINIMUM = 15;
export const EDIT_MIN_WORDS = 100;
export const EDIT_MAX_WORDS = 60000;

export const DOC_TYPES = ["Essay", "Research paper", "Thesis or dissertation chapter", "Report", "Journal article or manuscript", "Other"] as const;

/** Faster turnaround costs more. `maxWords` stops a 20,000 word job being booked for tomorrow. */
export const TURNAROUNDS = [
  { id: "urgent", label: "Urgent, under 24 hours", surcharge: 0.3, maxWords: 3000 },
  { id: "d1", label: "24 hours", surcharge: 0.2, maxWords: 5000 },
  { id: "d2", label: "48 hours", surcharge: 0.1, maxWords: 10000 },
  { id: "d3", label: "3 days", surcharge: 0, maxWords: 20000 },
  { id: "d5", label: "5 days", surcharge: 0, maxWords: Infinity },
  { id: "d7", label: "7 days or more", surcharge: 0, maxWords: Infinity },
] as const;
export type TurnaroundId = (typeof TURNAROUNDS)[number]["id"];

export const ADDONS = [
  { id: "references", label: "Reference list check", blurb: "We check your citations and bibliography against your style guide.", price: 9, services: ["editing"] },
  { id: "formatting", label: "Formatting to your style guide", blurb: "Headings, margins, spacing and layout.", price: 12, services: ["editing"] },
  { id: "summary", label: "Written feedback summary", blurb: "A short note on your main strengths and what to work on next.", price: 10, services: ["editing", "career"] },
  { id: "second", label: "Second review pass", blurb: "A second read after you have made changes.", price: 15, services: ["editing", "career"] },
] as const satisfies readonly { id: string; label: string; blurb: string; price: number; services: readonly ServiceId[] }[];
export type AddonId = (typeof ADDONS)[number]["id"];

export const CAREER_ITEMS = [
  { id: "cv", label: "CV review", price: 35 },
  { id: "statement", label: "Personal statement or cover letter review", price: 40 },
  { id: "both", label: "CV and personal statement together", price: 65 },
] as const;
export type CareerItemId = (typeof CAREER_ITEMS)[number]["id"];

/** Hourly work. Bigger blocks get a small discount. */
export const HOURLY: Partial<Record<ServiceId, number>> = { tutoring: 45, coaching: 50, research: 55 };
export const HOUR_DISCOUNTS = [
  { minHours: 10, off: 0.1 },
  { minHours: 5, off: 0.05 },
];
export const MAX_HOURS = 40;

export const PAYMENT_METHODS = ["Card (secure payment link)", "PayPal", "Bank transfer", "Wise"] as const;

export type EstimateLine = { label: string; amount: number };
export type Estimate = { lines: EstimateLine[]; total: number };

type Basis = {
  service: ServiceId;
  editLevel?: string;
  wordCount?: number | null;
  turnaround?: string;
  addons?: readonly string[];
  hours?: number | null;
  careerItem?: string;
};

const money = (n: number) => Math.round(n * 100) / 100;

export function addonsFor(service: ServiceId) {
  return ADDONS.filter((a) => (a.services as readonly string[]).includes(service));
}

export function turnaroundById(id: string | undefined) {
  return TURNAROUNDS.find((t) => t.id === id);
}

/** Why this word count cannot be booked with this turnaround, or null when it is fine. */
export function turnaroundProblem(turnaround: string | undefined, wordCount: number | null | undefined): string | null {
  const t = turnaroundById(turnaround);
  if (!t || !wordCount) return null;
  if (wordCount > t.maxWords) return `For ${wordCount.toLocaleString("en")} words, please choose a longer turnaround than "${t.label}".`;
  return null;
}

/** The estimate for what has been filled in so far, or null while it cannot be worked out yet. */
export function estimate(b: Basis): Estimate | null {
  const lines: EstimateLine[] = [];

  if (b.service === "editing") {
    const level = EDIT_LEVELS.find((l) => l.id === b.editLevel);
    const t = turnaroundById(b.turnaround);
    const words = b.wordCount ?? 0;
    if (!level || !t || words < EDIT_MIN_WORDS) return null;
    const raw = words * level.perWord;
    const base = Math.max(EDIT_MINIMUM, raw);
    lines.push({ label: `${level.label}, ${words.toLocaleString("en")} words`, amount: money(base) });
    if (t.surcharge > 0) lines.push({ label: `${t.label} turnaround (+${Math.round(t.surcharge * 100)}%)`, amount: money(base * t.surcharge) });
    for (const a of addonsFor("editing")) if (b.addons?.includes(a.id)) lines.push({ label: a.label, amount: a.price });
  } else if (b.service === "career") {
    const item = CAREER_ITEMS.find((c) => c.id === b.careerItem);
    const t = turnaroundById(b.turnaround);
    if (!item || !t) return null;
    lines.push({ label: item.label, amount: item.price });
    if (t.surcharge > 0) lines.push({ label: `${t.label} turnaround (+${Math.round(t.surcharge * 100)}%)`, amount: money(item.price * t.surcharge) });
    for (const a of addonsFor("career")) if (b.addons?.includes(a.id)) lines.push({ label: a.label, amount: a.price });
  } else {
    const rate = HOURLY[b.service];
    const hours = b.hours ?? 0;
    if (!rate || !Number.isInteger(hours) || hours < 1 || hours > MAX_HOURS) return null;
    const base = rate * hours;
    lines.push({ label: `${hours} hour${hours === 1 ? "" : "s"} at $${rate}/hour`, amount: money(base) });
    const d = HOUR_DISCOUNTS.find((x) => hours >= x.minHours);
    if (d) lines.push({ label: `Block discount (${Math.round(d.off * 100)}% off)`, amount: -money(base * d.off) });
  }

  return { lines, total: money(lines.reduce((s, l) => s + l.amount, 0)) };
}

export function usd(n: number): string {
  const abs = Math.abs(n);
  const text = `$${abs.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(abs) ? 0 : 2, maximumFractionDigits: 2 })}`;
  return n < 0 ? `-${text}` : text;
}
