import { Resend } from "resend";
import { serviceById } from "@/lib/services";
import type { RequestInput } from "@/lib/request";
import type { Screening } from "@/lib/screening";

// Tells the team about a request (email and Slack, whichever are configured)
// and sends the customer a receipt. Nothing here throws: a failed
// notification must never turn into an error for the customer, so each
// channel logs its own failure and the caller learns whether anything landed.
//
// Requests are not stored in a database. The email and the Slack message ARE
// the record, which is why both channels exist: if one is down the other still
// carries the request, and the caller is told when neither did.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://triviumtutors.com";
const FROM = process.env.MAIL_FROM || "Trivium Tutors <hello@triviumtutors.com>";
const TEAM_REPLY_TO = process.env.MAIL_REPLY_TO || "hello@triviumtutors.com";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function slackEsc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function teamEmails(): string[] {
  return (process.env.NOTIFY_EMAIL ?? "").split(",").map((e) => e.trim()).filter(Boolean);
}

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function whatsappLink(input: RequestInput): string | null {
  const digits = input.whatsapp.replace(/\D/g, "");
  return digits.length >= 7 ? `https://wa.me/${digits}` : null;
}

function nextStep(input: RequestInput): string {
  const s = serviceById(input.service);
  return s?.route === "call"
    ? "Reply to arrange an intro call (suggest two or three times in their timezone)."
    : "Review the description, ask for the document if needed, and send a quote and turnaround.";
}

type Lead = { id: string; input: RequestInput; screening: Screening };

function lines(l: Lead): [string, string][] {
  const { input } = l;
  const service = serviceById(input.service);
  const rows: [string, string][] = [
    ["Request", l.id],
    ["Service", `${service?.title ?? input.service} (${service?.route === "call" ? "call first" : "quote"})`],
    ["Subject", input.subject],
    ["Level", input.level],
    ["Deadline", input.deadline || "Flexible"],
  ];
  if (input.wordCount) rows.push(["Word count", input.wordCount.toLocaleString("en")]);
  if (input.style) rows.push(["Referencing style", input.style]);
  rows.push(
    ["Name", input.name],
    ["Email", input.email],
    ["Country", `${input.country}${input.timezone ? ` (${input.timezone})` : ""}`],
    ["Prefers", input.contactPref === "whatsapp" ? `WhatsApp ${input.whatsapp}` : "Email"],
  );
  return rows;
}

function teamHtml(l: Lead): string {
  const flagged = l.screening.verdict === "review";
  const wa = whatsappLink(l.input);
  const rows = lines(l)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#5b6577;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0;color:#14284b">${esc(v)}</td></tr>`)
    .join("");
  const reasons = l.screening.reasons.length ? `<ul style="margin:6px 0 0 18px;padding:0">${l.screening.reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;font-size:14px;line-height:1.5;color:#14284b">
  <p style="margin:0 0 12px;font-size:16px"><strong>${flagged ? "Needs a look: " : ""}New ${esc(serviceById(l.input.service)?.title ?? "request")} request</strong></p>
  ${flagged ? `<div style="background:#fff4d6;border:1px solid #e8c766;border-radius:8px;padding:10px 12px;margin-bottom:12px"><strong>Flagged for review.</strong> Screen score ${l.screening.score}/100.${reasons}</div>` : `<p style="margin:0 0 12px;color:#5b6577">Screened as genuine (${l.screening.score}/100).</p>`}
  ${l.screening.summary ? `<p style="margin:0 0 12px"><em>${esc(l.screening.summary)}</em></p>` : ""}
  <table style="border-collapse:collapse">${rows}</table>
  <p style="margin:14px 0 4px"><strong>Their message</strong></p>
  <div style="white-space:pre-wrap;background:#f6f2ea;border-radius:8px;padding:10px 12px">${esc(l.input.details)}</div>
  <p style="margin:14px 0 4px"><strong>Next step</strong></p>
  <p style="margin:0">${esc(nextStep(l.input))}</p>
  <p style="margin:14px 0 0">Reply to this email to answer them directly.${wa ? ` Or <a href="${esc(wa)}">open WhatsApp</a>.` : ""}</p>
  </div>`;
}

function slackText(l: Lead): string {
  const flagged = l.screening.verdict === "review";
  const service = serviceById(l.input.service);
  const wa = whatsappLink(l.input);
  const head = `${flagged ? ":warning: *Needs a look*" : ":inbox_tray: *New request*"}  ${slackEsc(service?.title ?? l.input.service)} · ${l.id}`;
  const body = lines(l)
    .filter(([k]) => k !== "Request" && k !== "Service")
    .map(([k, v]) => `*${k}:* ${slackEsc(v)}`)
    .join("\n");
  const flags = flagged ? `\n:mag: Screen ${l.screening.score}/100: ${slackEsc(l.screening.reasons.join("; ") || "no detail")}` : "";
  const summary = l.screening.summary ? `\n_${slackEsc(l.screening.summary)}_` : "";
  const msg = `\n>${slackEsc(l.input.details).replace(/\n/g, "\n>")}`;
  const contact = `\n:arrow_right: ${slackEsc(nextStep(l.input))}  <mailto:${l.input.email}|Email>${wa ? `  <${wa}|WhatsApp>` : ""}`;
  return `${head}${flags}${summary}\n${body}${msg}${contact}`;
}

/** Returns true if at least one channel took the request. */
export async function notifyTeam(l: Lead): Promise<boolean> {
  let delivered = false;
  const flagged = l.screening.verdict === "review";
  const subject = `${flagged ? "[Review] " : ""}${serviceById(l.input.service)?.title ?? "Request"}: ${l.input.name} (${l.id})`;

  const resend = resendClient();
  const to = teamEmails();
  if (resend && to.length) {
    try {
      const { error } = await resend.emails.send({ from: FROM, to, subject, html: teamHtml(l), replyTo: l.input.email });
      if (error) console.error("[notify] team email rejected", error);
      else delivered = true;
    } catch (err) {
      console.error("[notify] team email failed", err);
    }
  }

  const hook = process.env.SLACK_WEBHOOK_URL;
  if (hook) {
    try {
      const res = await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: slackText(l) }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) delivered = true;
      else console.error("[notify] Slack returned", res.status);
    } catch (err) {
      console.error("[notify] Slack failed", err);
    }
  }

  if (!resend && !hook && process.env.NODE_ENV !== "production") {
    // Local development with nothing configured: show what would have been sent.
    // Never in production, where "nobody was told" must not look like success.
    console.log(`\n[notify] (no email or Slack configured) ${subject}\n${slackText(l)}\n`);
    return true;
  }
  return delivered;
}

export async function sendReceipt(l: Lead): Promise<void> {
  const resend = resendClient();
  if (!resend) return;
  const first = l.input.name.split(" ")[0];
  const service = serviceById(l.input.service);
  const promise = process.env.RESPONSE_PROMISE || "one business day";
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;font-size:15px;line-height:1.6;color:#14284b">
  <p>Hi ${esc(first)},</p>
  <p>Thanks for getting in touch. We have your request (<strong>${esc(l.id)}</strong>) for <strong>${esc(service?.title ?? "support")}</strong>, and a person on our team will read it and reply within ${esc(promise)}.</p>
  <p>${esc(service?.next ?? "")}</p>
  <p>If anything changes, such as your deadline, just reply to this email.</p>
  <p style="margin-top:24px">Trivium Tutors<br><a href="${esc(SITE)}" style="color:#14284b">${esc(SITE.replace(/^https?:\/\//, ""))}</a></p>
  <p style="font-size:12px;color:#5b6577;margin-top:24px">We help students learn and improve their own work. We do not sit exams or write work to be submitted under someone else's name.</p>
  </div>`;
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: l.input.email,
      subject: `We got your request (${l.id})`,
      html,
      replyTo: TEAM_REPLY_TO,
    });
    if (error) console.error("[notify] receipt rejected", error);
  } catch (err) {
    console.error("[notify] receipt failed", err);
  }
}
