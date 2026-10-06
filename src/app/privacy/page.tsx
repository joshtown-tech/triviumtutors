import type { Metadata } from "next";
import { Prose } from "@/components/Prose";

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@triviumtutors.com";

export const metadata: Metadata = { title: "Privacy", description: "What Trivium Tutors collects, why, and your rights." };

export default function Privacy() {
  return (
    <Prose title="Privacy" updated="October 2026">
      <p>This page explains what we collect when you send us a request, why, who handles it, and the rights you have. We keep it short and plain on purpose.</p>

      <h2>What we collect</h2>
      <ul>
        <li>What you put in the request form: your name, email, country, timezone, optional WhatsApp number, and the details you write about what you need.</li>
        <li>Basic technical information needed to keep the form safe, such as your IP address, used for spam protection and rate limiting.</li>
      </ul>

      <h2>Why we collect it</h2>
      <ul>
        <li>To read your request, reply to you, and provide the service you asked for.</li>
        <li>To protect the site from spam and abuse, and to check that requests are for services we offer.</li>
      </ul>
      <p>Our legal basis, where that applies, is taking steps at your request before a contract, and our legitimate interest in running a safe service.</p>

      <h2>Who handles it</h2>
      <p>We use a small number of service providers to run the site. They process data only to provide their service to us:</p>
      <ul>
        <li>Cloudflare, for the Turnstile security check (and DNS for the site).</li>
        <li>OpenAI, which receives the text of your request so an automated check can tell whether it is genuine and something we offer. We do not use it to profile you or for marketing.</li>
        <li>Resend, which delivers our emails.</li>
        <li>Slack, where our team is notified of new requests.</li>
        <li>Our website hosting provider.</li>
      </ul>
      <p>Some of these providers are based outside your country, including in the United States. Where required, transfers rely on the safeguards those providers offer, such as standard contractual clauses.</p>

      <h2>Automated checks</h2>
      <p>An automated system screens each request. It can decline a request for something we do not do, such as taking an exam for you. If you think it got it wrong, email us and a person will review it.</p>

      <h2>How long we keep it</h2>
      <p>We do not keep requests in a separate database. They exist in our email and team chat. We keep them for as long as we need to handle your request and our own records, and delete them when you ask.</p>

      <h2>Your rights</h2>
      <p>Depending on where you live (for example under the UK and EU GDPR, the Australian Privacy Act, or California law), you can ask to see, correct, delete or export your information, object to how we use it, or complain to your local data protection authority. Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and we will respond within 30 days.</p>

      <h2>Cookies</h2>
      <p>We do not use advertising or analytics cookies. The Cloudflare security check may set what it needs to work.</p>

      <h2>Contact</h2>
      <p><a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </Prose>
  );
}
