import { REVIEWS } from "@/lib/team";

export function Reviews() {
  if (REVIEWS.length === 0) return null;
  return (
    <section className="bg-sand/60 py-16 sm:py-20" aria-labelledby="reviews-h">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="reviews-h" className="text-4xl text-ink">What students say</h2>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <li key={`${r.name}-${r.date}`} className="rounded-2xl border border-line bg-paper p-6">
              <blockquote className="leading-relaxed text-ink-soft">&ldquo;{r.quote}&rdquo;</blockquote>
              <p className="mt-4 text-sm font-medium text-ink">{r.name}, {r.country}</p>
              <p className="text-xs text-muted">{r.service} · {r.date}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
