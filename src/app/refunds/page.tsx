import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/Prose";
import { POLICY as P } from "@/lib/policy";

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@triviumtutors.com";

export const metadata: Metadata = {
  title: "Revisions and refunds",
  description: "How payment, free revisions and refunds work at Trivium Tutors.",
};

export default function Refunds() {
  return (
    <Prose title="Revisions and refunds" updated="October 2026">
      <p>We want you to be happy with the help you get. Here is exactly how payment, revisions and refunds work, so there are no surprises.</p>

      <h2>When you pay</h2>
      <p>
        Nothing is charged on the request form. After a person on our team reads your request, we confirm the price and timing with you, then send an invoice or payment link for the method you prefer. Work starts when payment arrives. We never ask for card details, passwords or logins in the request form or by message.
      </p>

      <h2>Free revision on editing and reviews</h2>
      <p>
        Editing, proofreading and application reviews include {P.freeRevisions === 1 ? "one free follow-up pass" : `${P.freeRevisions} free follow-up passes`} on the same document. Ask within {P.revisionWindowDays} days of delivery and tell us what you would like looked at again. A revision covers the work we agreed. If you add new material or change what you want, such as a different level of edit or a new section, we will quote that separately.
      </p>

      <h2>When we refund you</h2>
      <ul>
        <li><strong>Before work starts:</strong> a full refund if you cancel.</li>
        <li><strong>After work has started:</strong> a refund of the part not yet done, if you cancel.</li>
        <li><strong>If we are late:</strong> if we deliver more than {P.lateHours} hours after the agreed time, and the delay was not caused by waiting for files or answers from you, we refund the rush surcharge you paid.</li>
        <li><strong>If it missed what we agreed:</strong> if you are still not satisfied after the free revision, tell us within {P.disputeWindowDays} days of delivery. A person will review the work against what we agreed and refund the fair part of the fee where it fell short.</li>
        <li><strong>If we cannot do it:</strong> a full refund if we cannot start or complete your request.</li>
      </ul>

      <h2>Tutoring sessions</h2>
      <ul>
        <li>You can cancel or move a session without charge with at least {P.sessionNoticeHours} hours notice. Later than that, the session may be charged.</li>
        <li>Unused hours in a prepaid block can be refunded within {P.unusedHoursDays} days of payment. Any block discount is recalculated for the hours you used.</li>
      </ul>

      <h2>What a refund does not cover</h2>
      <p>
        We cannot refund because of a grade or an outcome, because those depend on you and on decisions we do not control. We also do not refund for requests that break our academic integrity rules, because we will not do that work in the first place.{" "}
        <Link href="/integrity">How we work</Link>.
      </p>

      <h2>How to ask</h2>
      <p>
        Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a> with your request number, which starts with TT. A person replies within one business day. Approved refunds go back to your original payment method and usually arrive within {P.refundPayoutDays} days.
      </p>

      <p>These terms sit alongside the rights you already have under consumer law where you live, which they do not reduce.</p>
    </Prose>
  );
}
