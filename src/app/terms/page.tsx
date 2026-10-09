import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/Prose";

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@triviumtutors.com";

export const metadata: Metadata = { title: "Terms", description: "The terms for using Trivium Tutors." };

export default function Terms() {
  return (
    <Prose title="Terms" updated="October 2026">
      <p>By sending a request or using our services you agree to these terms. They sit alongside the rights you have under your local consumer law, which they do not reduce.</p>

      <h2>Our services</h2>
      <p>Trivium Tutors provides tutoring, writing coaching, editing and proofreading, research guidance, and review of application documents. The details and price of each engagement are agreed with you before work begins.</p>

      <h2>Academic integrity</h2>
      <p>You agree to use our services only to learn and to improve your own work. We do not sit exams, attend classes for you, or write work for you to submit as your own, and you agree not to ask us to. We may decline or end an engagement that breaks this rule.</p>

      <h2>Your work</h2>
      <p>Your documents and ideas remain yours. You are responsible for how you use our feedback and for following your institution&apos;s rules about acceptable help. Editing and feedback are suggestions; the decisions and the final submission are yours.</p>

      <h2>Your account</h2>
      <p>You need a free account to send a request. Give us accurate details, keep your password to yourself, and tell us if you think someone else has used your account. One account is for one person. We may close an account that is used to send spam or to ask for work we do not do.</p>

      <h2>Requests and pricing</h2>
      <p>Sending a request is not a contract. A booking is confirmed when we agree scope, price and timing with you in writing. We will tell you the price before any work starts.</p>

      <h2>Revisions and refunds</h2>
      <p>Free revisions and refunds are set out on our <Link href="/refunds">revisions and refunds page</Link>, which forms part of these terms. Payment is requested before work starts.</p>

      <h2>Results</h2>
      <p>We work hard to help you improve, but we cannot guarantee a particular grade, admission or outcome, because those depend on you and on decisions we do not control.</p>

      <h2>Liability</h2>
      <p>To the extent the law allows, our liability to you for any claim related to our services is limited to the fees you paid us for the service in question. Nothing in these terms excludes liability that cannot be excluded by law, or your statutory consumer rights.</p>

      <h2>Changes</h2>
      <p>We may update these terms. The version on this page applies when you make a request.</p>

      <h2>Contact</h2>
      <p><a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </Prose>
  );
}
