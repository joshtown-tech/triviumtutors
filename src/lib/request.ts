import { CONTACT_PREFS, COUNTRIES, LEVELS, STYLES, serviceById, type ContactPref, type ServiceId } from "@/lib/services";
import {
  CAREER_ITEMS, DOC_TYPES, EDIT_LEVELS, EDIT_MAX_WORDS, EDIT_MIN_WORDS, MAX_HOURS, PAYMENT_METHODS, TURNAROUNDS,
  addonsFor, estimate, turnaroundProblem, type Estimate,
} from "@/lib/pricing";

// The shape of a submitted request and the server-side checks on it. The form
// validates too, for a friendly experience, but this is the check that counts.
// The price estimate is computed here from the fields; a number sent by the
// browser is ignored.

export type RequestInput = {
  service: ServiceId;
  subject: string;
  level: string;
  deadline: string; // YYYY-MM-DD "start by" date for call-first services, or ""
  details: string;
  docType: string;
  editLevel: string; // "proofread" | "edit" | ""
  wordCount: number | null;
  style: string;
  turnaround: string; // a TURNAROUNDS id, for editing and career
  addons: string[];
  hours: number | null; // for hourly services
  careerItem: string;
  fileLink: string;
  paymentPref: string;
  name: string;
  email: string;
  country: string;
  timezone: string;
  contactPref: ContactPref;
  whatsapp: string;
  estimate: Estimate | null;
};

/** Fields that exist only to catch bots and are never shown to the team. */
export type RequestMeta = {
  website: string; // honeypot: real people never see or fill it
  startedAt: number; // when the form was opened, ms since epoch
  turnstileToken: string;
};

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

// The team opens these links, so only well-known file-sharing hosts are accepted.
const FILE_HOSTS = [
  "drive.google.com", "docs.google.com", "dropbox.com", "onedrive.live.com", "1drv.ms",
  "sharepoint.com", "wetransfer.com", "we.tl", "box.com", "icloud.com",
];

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function multiline(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim().slice(0, max) : "";
}

function safeFileLink(raw: string): { ok: true; url: string } | { ok: false } {
  if (!raw) return { ok: true, url: "" };
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (u.protocol !== "https:") return { ok: false };
    if (!FILE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return { ok: false };
    return { ok: true, url: u.toString().slice(0, 500) };
  } catch {
    return { ok: false };
  }
}

type Fail = { ok: false; error: string };

export function parseRequest(body: unknown): { ok: true; input: RequestInput; meta: RequestMeta } | Fail {
  if (!body || typeof body !== "object") return { ok: false, error: "Something went wrong with that request. Please try again." };
  const b = body as Record<string, unknown>;

  const service = serviceById(str(b.service, 20));
  if (!service) return { ok: false, error: "Please choose a service." };

  const name = str(b.name, 80);
  if (name.length < 2) return { ok: false, error: "Please tell us your name." };

  const email = str(b.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };

  const details = multiline(b.details, 3000);
  if (details.length < 30) return { ok: false, error: "Please give us a little more detail (at least a couple of sentences)." };

  const subject = str(b.subject, 120);
  if (subject.length < 2) return { ok: false, error: "Please tell us the subject or topic." };

  const level = LEVELS.find((l) => l === b.level);
  if (!level) return { ok: false, error: "Please choose your level." };

  const country = COUNTRIES.find((c) => c === b.country);
  if (!country) return { ok: false, error: "Please choose your country." };

  if (b.integrityAck !== true) return { ok: false, error: "Please confirm that you have read how we work." };

  const contactPref = CONTACT_PREFS.find((c) => c === b.contactPref) ?? "email";
  const whatsapp = str(b.whatsapp, 25).replace(/[^\d+ ]/g, "");
  if (contactPref === "whatsapp" && whatsapp.replace(/\D/g, "").length < 7) {
    return { ok: false, error: "Please enter your WhatsApp number with the country code." };
  }

  const paymentPref = PAYMENT_METHODS.find((p) => p === b.paymentPref);
  if (!paymentPref) return { ok: false, error: "Please choose how you would prefer to pay." };

  let deadline = str(b.deadline, 10);
  if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) deadline = "";

  const link = safeFileLink(str(b.fileLink, 600));
  if (!link.ok) return { ok: false, error: "Please share your document using a Google Drive, Dropbox, OneDrive, Box, iCloud or WeTransfer link." };

  const styleRaw = str(b.style, 30);
  const style = STYLES.find((s) => s === styleRaw) ?? "";

  // Service-specific fields. Anything that does not apply to the chosen service is cleared.
  let docType = "";
  let editLevel = "";
  let wordCount: number | null = null;
  let turnaround = "";
  let careerItem = "";
  let hours: number | null = null;
  let addons: string[] = [];

  if (service.id === "editing") {
    docType = DOC_TYPES.find((d) => d === b.docType) ?? "";
    if (!docType) return { ok: false, error: "Please choose the type of document." };
    editLevel = EDIT_LEVELS.find((l) => l.id === b.editLevel)?.id ?? "";
    if (!editLevel) return { ok: false, error: "Please choose proofreading or a full edit." };
    const wc = typeof b.wordCount === "number" ? b.wordCount : Number(str(b.wordCount, 8));
    if (!Number.isFinite(wc) || wc < EDIT_MIN_WORDS) return { ok: false, error: `Please enter the word count (at least ${EDIT_MIN_WORDS}).` };
    if (wc > EDIT_MAX_WORDS) return { ok: false, error: "For documents this long, please tell us the length in the details and we will quote you directly." };
    wordCount = Math.round(wc);
  }

  if (service.id === "editing" || service.id === "career") {
    turnaround = TURNAROUNDS.find((t) => t.id === b.turnaround)?.id ?? "";
    if (!turnaround) return { ok: false, error: "Please choose a turnaround time." };
    const problem = turnaroundProblem(turnaround, wordCount);
    if (problem) return { ok: false, error: problem };
    const allowed = new Set<string>(addonsFor(service.id).map((a) => a.id));
    addons = Array.isArray(b.addons) ? [...new Set(b.addons.filter((a): a is string => typeof a === "string" && allowed.has(a)))] : [];
  }

  if (service.id === "career") {
    careerItem = CAREER_ITEMS.find((c) => c.id === b.careerItem)?.id ?? "";
    if (!careerItem) return { ok: false, error: "Please choose what you would like reviewed." };
  }

  if (service.route === "call") {
    const h = typeof b.hours === "number" ? b.hours : Number(str(b.hours, 4));
    if (!Number.isInteger(h) || h < 1 || h > MAX_HOURS) return { ok: false, error: `Please choose between 1 and ${MAX_HOURS} hours.` };
    hours = h;
  }

  const basis = { service: service.id, editLevel, wordCount, turnaround, addons, hours, careerItem };

  return {
    ok: true,
    input: {
      service: service.id,
      subject,
      level,
      deadline: service.route === "call" ? deadline : "",
      details,
      docType,
      editLevel,
      wordCount,
      style: service.id === "editing" || service.id === "coaching" || service.id === "assignment" ? style : "",
      turnaround,
      addons,
      hours,
      careerItem,
      fileLink: link.url,
      paymentPref,
      name,
      email,
      country,
      timezone: str(b.timezone, 60),
      contactPref,
      whatsapp,
      estimate: estimate(basis),
    },
    meta: {
      website: str(b.website, 200),
      startedAt: typeof b.startedAt === "number" ? b.startedAt : 0,
      turnstileToken: str(b.turnstileToken, 2048),
    },
  };
}

export function newRequestId(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `TT-${t}${r}`;
}
