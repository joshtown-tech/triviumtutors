import Image from "next/image";
import { TEAM } from "@/lib/team";

export function Team() {
  if (TEAM.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="team-h">
      <h2 id="team-h" className="text-4xl text-ink">Meet your tutors and editors</h2>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">Real people with real credentials. You will know who you are working with before you start.</p>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TEAM.map((m) => (
          <li key={m.name} className="rounded-2xl border border-line bg-paper p-6">
            <div className="flex items-center gap-4">
              {m.photo ? (
                <Image src={m.photo} alt={m.name} width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-full bg-ink font-serif text-2xl text-gold" aria-hidden="true">{m.name[0]}</span>
              )}
              <div>
                <h3 className="text-xl text-ink">{m.name}</h3>
                <p className="text-sm text-ink-soft">{m.role}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-ink">{m.degree}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{m.bio}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {m.subjects.map((s) => <li key={s} className="rounded-full bg-sand px-3 py-1 text-xs text-ink-soft">{s}</li>)}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
