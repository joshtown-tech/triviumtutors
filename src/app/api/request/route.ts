import { NextResponse } from "next/server";
import { newRequestId, parseRequest } from "@/lib/request";
import { clientIp, withinLimit } from "@/lib/rateLimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { screenRequest } from "@/lib/screening";
import { notifyTeam, sendReceipt } from "@/lib/notify";
import { serviceById } from "@/lib/services";

// POST /api/request: the whole intake pipeline in one place.
//   parse -> bot checks -> rate limit -> Turnstile -> screen -> notify
// Spam gets the same friendly "received" answer as everyone else, so a bot
// cannot tell it was caught.

export const runtime = "nodejs";

const RECEIVED = (id: string, route: "call" | "quote") => NextResponse.json({ status: "received", id, route });

export async function POST(req: Request) {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > 30_000) return NextResponse.json({ error: "That request is too large." }, { status: 413 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong with that request. Please try again." }, { status: 400 });
  }

  const parsed = parseRequest(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { input, meta } = parsed;
  const route = serviceById(input.service)?.route ?? "quote";
  const ip = clientIp(req);

  // Per person: 5 an hour from one address, 3 a day for one email. Real people rarely send more than one.
  if (!withinLimit(`ip:${ip}`, 5, 3600) || !withinLimit(`email:${input.email}`, 3, 86400)) {
    return NextResponse.json({ error: "You have sent several requests already. Please wait a while, or email us directly." }, { status: 429 });
  }

  if (!(await verifyTurnstile(meta.turnstileToken, ip))) {
    return NextResponse.json({ error: "The security check did not pass. Please refresh the page and try again." }, { status: 400 });
  }

  const id = newRequestId();
  const screening = await screenRequest(input, meta);

  if (screening.verdict === "reject") {
    console.log(`[request] ${id} dropped as spam: ${screening.reasons.join("; ")}`);
    return RECEIVED(id, route);
  }

  if (screening.verdict === "declined") {
    console.log(`[request] ${id} declined (integrity): ${screening.reasons.join("; ")}`);
    return NextResponse.json({ status: "declined", id, route });
  }

  const delivered = await notifyTeam({ id, input, screening });
  if (!delivered) {
    console.error(`[request] ${id} could not be delivered to the team on any channel`);
    return NextResponse.json({ error: "We could not send your request just now. Please try again in a minute, or email us directly." }, { status: 502 });
  }

  // The receipt is a courtesy and also quietly proves the email address works.
  await sendReceipt({ id, input, screening });
  return RECEIVED(id, route);
}
