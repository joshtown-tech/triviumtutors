import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = {
  title: "How we work",
  description: "What Trivium Tutors does, and what we will never do. Your work stays yours.",
};

export default function Integrity() {
  return (
    <Prose title="How we work: your work stays yours">
      <p>
        Trivium Tutors exists to help you get better at learning and writing. Everything we do is meant to leave you more capable, not to replace you.
      </p>

      <h2>What we do</h2>
      <ul>
        <li>One-to-one tutoring to help you understand a subject and prepare for assessments you sit yourself.</li>
        <li>Writing coaching: planning, structuring and arguing, with feedback on your drafts.</li>
        <li>Editing and proofreading of work you wrote: grammar, clarity, flow and referencing.</li>
        <li>Research guidance: finding sources, choosing methods, organising a literature review.</li>
        <li>Review and coaching on your CV, personal statement or cover letter.</li>
      </ul>

      <h2>What we will not do</h2>
      <ul>
        <li>Sit or take an exam, test or quiz for you.</li>
        <li>Attend, log in to, or complete an online class or course as you.</li>
        <li>Write an essay, assignment, thesis or other assessed work for you to submit as your own.</li>
        <li>Help work get past plagiarism or AI-detection tools.</li>
      </ul>

      <h2>Why this matters</h2>
      <p>
        Submitting work that someone else did is academic misconduct at virtually every university. The penalties can include failing the module, losing your place, or having a degree withdrawn later. In some countries, including Australia, providing or advertising cheating services is also against the law. We will not put you or ourselves in that position.
      </p>

      <h2>How requests are checked</h2>
      <p>
        Every request is checked by an automated system and then read by a person. It helps us filter spam and spot requests for things we do not do. If a request is declined by mistake, email us and a person will review it.
      </p>

      <p>
        Ready to get started?{" "}
        <Link href="/request">Make a request</Link>.
      </p>
    </Prose>
  );
}
