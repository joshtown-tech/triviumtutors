import { CONTACT_PREFS, COUNTRIES, LEVELS, STYLES, serviceById, type ContactPref, type ServiceId } from "@/lib/services";

// The shape of a submitted request and the server-side checks on it. The form
// validates too, for a friendly experience, but this is the check that counts.

export type RequestInput = {
  service: ServiceId;
  subject: string;
  level: string;
  deadline: string; // YYYY-MM-DD, or "" when flexible
  details: string;
  wordCount: number | null;
  style: string;
  name: string;
  email: string;
  country: string;
  timezone: string;
  contactPref: ContactPref;
  whatsapp: string;
};

/** Fields that exist only to catch bots and are never shown to the team. */
export type RequestMeta = {
  website: string; // honeypot: real people never see or fill it
  startedAt: number; // when the form was opened, ms since epoch
  turnstileToken: string;
};

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function multiline(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim().slice(0, max) : "";
}

export function parseRequest(body: unknown): { ok: true; input: RequestInput; meta: RequestMeta } | { ok: false; error: string } {
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

  let deadline = str(b.deadline, 10);
  if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) deadline = "";

  const wc = typeof b.wordCount === "number" ? b.wordCount : Number(str(b.wordCount, 8));
  const wordCount = Number.isFinite(wc) && wc > 0 && wc < 1_000_000 ? Math.round(wc) : null;

  const styleRaw = str(b.style, 30);
  const style = STYLES.find((s) => s === styleRaw) ?? "";

  return {
    ok: true,
    input: {
      service: service.id,
      subject,
      level,
      deadline,
      details,
      wordCount,
      style,
      name,
      email,
      country,
      timezone: str(b.timezone, 60),
      contactPref,
      whatsapp,
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
