# Trivium Tutors

Request-intake website for triviumtutors.com. A visitor picks a service, answers a few questions, and the team is notified by email and/or Slack. Spam and out-of-scope requests are filtered before anyone is bothered.

Next.js 16 (App Router), Tailwind 4, Resend, Cloudflare Turnstile, OpenAI, Supabase. Email and Slack tell the team; Supabase keeps a backup copy of every request.

## How a request flows

`POST /api/request` (src/app/api/request/route.ts)

1. Validate the fields (src/lib/request.ts)
2. Rate limit: 5 an hour per IP, 3 a day per email (src/lib/rateLimit.ts, in memory)
3. Cloudflare Turnstile check (src/lib/turnstile.ts)
4. Screening (src/lib/screening.ts): rules, then an AI read of the message
   - `qualified` goes to the team
   - `review` goes to the team marked "Needs a look" (uncertain, or AI unavailable)
   - `declined` is a real person asking for exam taking or work to submit as their own. They see a polite explanation and are pointed at tutoring. Team is not notified.
   - `reject` is spam. Dropped silently, the bot still sees "received".
5. Team notified by email and Slack (src/lib/notify.ts), customer gets a receipt email

Services live in one file, src/lib/services.ts.

## Scope decision

The site offers tutoring, editing of the customer's own writing, coaching, research guidance and CV review. It deliberately does not offer exam taking, attending classes as the student, or writing assessed work for submission. That is contract cheating: illegal to provide or advertise in Australia, banned by most universities, and a reason payment and ad platforms close accounts. The screening step enforces it on incoming requests.

## Go-live checklist

1. Deploy (Vercel works), point triviumtutors.com at it.
2. Copy `.env.example` to `.env.local` (or set the vars in the host) and fill in:
   - Resend: verify triviumtutors.com in Resend, set `RESEND_API_KEY`, `MAIL_FROM`, `NOTIFY_EMAIL`
   - Slack: create an incoming webhook, set `SLACK_WEBHOOK_URL`
   - Turnstile: create a widget in Cloudflare, set both keys
   - OpenAI: set `OPENAI_API_KEY`
3. Create the real mailbox for `hello@triviumtutors.com`. Replies and the footer contact point at it.
4. Have a lawyer review /privacy and /terms for the company's legal entity and jurisdiction. They are sensible drafts, not legal advice.
5. Send a real test request and confirm email, Slack and the receipt all arrive.

## Promises the site makes that the team must keep

- "A person replies within one business day" (`RESPONSE_PROMISE` env, and the hero and FAQ copy)
- "If a request is declined by mistake, a person will review it" (needs someone reading hello@)
- Requests are deleted on request, within 30 days

## Known limits

- Rate limiting is per server instance, so it is a speed bump, not a wall. Turnstile and the AI screen are the real defences.
- WhatsApp is a one-tap link in each notification (the team opens a chat), not an automated WhatsApp message. Automated WhatsApp needs a Meta Business account and approved templates.
- The AI screen's judgement has not been tested against the real model, only the plumbing (against a mock). Read the first batch of `review` and `declined` outcomes and tune the prompt in screening.ts.
