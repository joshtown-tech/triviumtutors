"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EDIT_MAX_WORDS, EDIT_MIN_WORDS, estimate, usd } from "@/lib/pricing";

// Everything here runs in the browser. The text is never sent anywhere.

function stats(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const sentences = trimmed ? (trimmed.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? []).filter((s) => s.trim()).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  return {
    words,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    sentences,
    paragraphs,
    readMin: words / 238, // average adult silent reading speed
    speakMin: words / 130, // typical presentation pace
  };
}

function minutes(m: number): string {
  if (m < 0.5) return "under 1 min";
  if (m < 60) return `${Math.round(m)} min`;
  return `${Math.floor(m / 60)} h ${Math.round(m % 60)} min`;
}

export function WordCounter() {
  const [text, setText] = useState("");
  const s = useMemo(() => stats(text), [text]);
  const quote = useMemo(
    () => (s.words >= EDIT_MIN_WORDS && s.words <= EDIT_MAX_WORDS ? estimate({ service: "editing", editLevel: "edit", wordCount: s.words, turnaround: "d5" }) : null),
    [s.words],
  );

  const cells: [string, string][] = [
    ["Words", s.words.toLocaleString("en")],
    ["Characters", s.characters.toLocaleString("en")],
    ["Without spaces", s.charactersNoSpaces.toLocaleString("en")],
    ["Sentences", s.sentences.toLocaleString("en")],
    ["Paragraphs", s.paragraphs.toLocaleString("en")],
    ["Reading time", minutes(s.readMin)],
    ["Speaking time", minutes(s.speakMin)],
  ];

  return (
    <div>
      <label htmlFor="wc-text" className="mb-1.5 block text-sm font-medium text-ink">Paste or type your text</label>
      <textarea
        id="wc-text"
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-lg border border-line bg-paper px-3.5 py-3 text-base text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-gold"
        placeholder="Start typing or paste your draft here."
      />
      <p className="mt-1 text-xs text-muted">Your text stays in your browser. Nothing is uploaded or saved.</p>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-live="polite">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line bg-paper p-4">
            <dt className="text-xs uppercase tracking-widest text-muted">{k}</dt>
            <dd className="mt-1 font-serif text-2xl text-ink tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {s.words > 0 && (
        <div className="mt-8 rounded-2xl bg-sand p-6">
          {quote ? (
            <>
              <p className="font-serif text-2xl text-ink">Want a second pair of eyes on it?</p>
              <p className="mt-2 text-ink-soft">
                A full edit of {s.words.toLocaleString("en")} words with a standard turnaround would be about <strong className="text-ink">{usd(quote.total)}</strong>. You can change the options and see the exact estimate in the request form.
              </p>
              <Link href={`/request?service=editing&words=${s.words}`} className="mt-4 inline-block rounded-full bg-ink px-6 py-3 font-medium text-cream hover:bg-ink-soft">
                Get an editing estimate
              </Link>
            </>
          ) : (
            <p className="text-ink-soft">
              {s.words < EDIT_MIN_WORDS
                ? `Editing starts at ${EDIT_MIN_WORDS} words.`
                : "That is a long document. Tell us about it in the request form and we will quote you directly."}{" "}
              <Link href="/request" className="font-semibold text-ink underline">Make a request</Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
