import Link from "next/link";
import { SERVICES } from "@/lib/services";
import { FAQ } from "@/lib/faq";
import { Team } from "@/components/Team";
import { Reviews } from "@/components/Reviews";

const STEPS = [
  { n: "1", title: "Tell us what you need", body: "Pick a service and answer a few quick questions. It takes about two minutes." },
  { n: "2", title: "A person replies", body: "We read every request ourselves. Tutoring and coaching start with a short intro call. Editing and reviews show a live price estimate, confirmed by us before any work starts." },
  { n: "3", title: "Work together", body: "You agree the price and plan before anything starts. Sessions and feedback fit around your timezone." },
];

const TRUST = [
  { title: "A person reads every request", body: "A real person reads and replies, within one business day." },
  { title: "Your work stays yours", body: "We teach, coach and edit. We never write it for you." },
  { title: "Price confirmed first", body: "See a live estimate, and agree the final price before any work starts." },
  { title: "Fits your timezone", body: "Online sessions for the US, UK, Europe, Australia and Latin America." },
];

const ARTS = [
  { name: "Grammar", line: "Say it correctly. Clear, precise writing." },
  { name: "Logic", line: "Think it through. Sound, well-structured arguments." },
  { name: "Rhetoric", line: "Make it land. Writing that persuades." },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold-deep">Tutoring · Editing · Writing support</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl">
              Learn it. Write it. <span className="text-gold-deep">Own it.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              One-to-one tutoring, editing and writing coaching that helps you do your best work, in your own words. Online, wherever you study.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/request" className="rounded-full bg-ink px-7 py-3.5 font-medium text-cream transition hover:bg-ink-soft">
                Make a request
              </Link>
              <Link href="#services" className="rounded-full border border-ink px-7 py-3.5 font-medium text-ink transition hover:bg-sand">
                See services
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted">A person replies within one business day.</p>
          </div>

          <div className="rounded-3xl bg-ink p-8 text-cream" aria-label="The three arts of the trivium">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Why &ldquo;Trivium&rdquo;</p>
            <p className="mt-3 font-serif text-2xl leading-snug">The classical foundation of learning, in three arts.</p>
            <ul className="mt-6 space-y-4">
              {ARTS.map((a, i) => (
                <li key={a.name} className="flex items-start gap-4">
                  <span className="mt-1 flex h-9 shrink-0 items-end gap-0.5" aria-hidden="true">
                    {[0, 1, 2].map((b) => (
                      <span key={b} className={`w-1.5 rounded-sm ${b <= i ? (b === i ? "bg-gold" : "bg-cream") : "bg-cream/20"}`} style={{ height: `${(b + 1) * 11}px` }} />
                    ))}
                  </span>
                  <span>
                    <span className="block font-serif text-xl">{a.name}</span>
                    <span className="block text-sm text-cream/75">{a.line}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-label="Why students choose us" className="border-y border-line bg-paper">
        <ul className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {TRUST.map((t) => (
            <li key={t.title} className="flex gap-3">
              <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold text-xs font-bold text-ink" aria-hidden="true">✓</span>
              <span>
                <span className="block font-semibold text-ink">{t.title}</span>
                <span className="block text-sm leading-relaxed text-ink-soft">{t.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section id="services" className="scroll-mt-20 bg-sand/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-4xl text-ink">What we help with</h2>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">Support that builds your skills and improves your own work.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <Link
                key={s.id}
                href={`/request?service=${s.id}`}
                className="group flex flex-col rounded-2xl border border-line bg-paper p-6 transition hover:border-ink hover:shadow-sm"
              >
                <h3 className="text-2xl text-ink">{s.title}</h3>
                <p className="mt-2 flex-1 leading-relaxed text-ink-soft">{s.blurb}</p>
                <span className="mt-5 text-sm font-semibold text-ink group-hover:text-gold-deep">Request this →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-4xl text-ink">How it works</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-ink font-serif text-xl text-gold">{s.n}</span>
              <h3 className="mt-4 text-2xl text-ink">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <Team />
      <Reviews />

      <section className="bg-ink py-16 text-cream sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[1fr_1.2fr] md:items-center">
          <h2 className="text-4xl">Your work stays yours.</h2>
          <div>
            <p className="text-lg leading-relaxed text-cream/85">
              We teach, coach, review and proofread. We do not sit exams, attend classes for you, or write assignments for you to hand in as your own. That keeps your grades, your degree and your reputation safe.
            </p>
            <Link href="/integrity" className="mt-5 inline-block font-semibold text-gold underline-offset-4 hover:underline">
              Read how we work →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-4xl text-ink">Questions</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl text-ink">
                {f.q}
                <span className="text-gold-deep transition group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 rounded-2xl bg-sand p-8 text-center">
          <h2 className="text-3xl text-ink">Ready when you are.</h2>
          <p className="mt-2 text-ink-soft">Tell us what you need. It takes about two minutes.</p>
          <Link href="/request" className="mt-5 inline-block rounded-full bg-ink px-7 py-3.5 font-medium text-cream hover:bg-ink-soft">
            Make a request
          </Link>
        </div>
      </section>
    </>
  );
}
