import type { Metadata } from "next";
import { WordCounter } from "@/components/WordCounter";

export const metadata: Metadata = {
  title: "Free word counter",
  description: "Count words, characters, sentences and paragraphs, and see reading and speaking time. Free, private, runs in your browser.",
};

export default function WordCounterPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-4xl text-ink sm:text-5xl">Free word counter</h1>
      <p className="mt-3 mb-8 text-lg text-ink-soft">Check your length against your assignment brief, and see how long it takes to read or present.</p>
      <WordCounter />
    </div>
  );
}
