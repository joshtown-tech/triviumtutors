import Link from "next/link";
import { Logo } from "@/components/Logo";

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@triviumtutors.com";

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/75">
            Tutoring, editing and writing support for students and professionals. We help you learn and improve your own work.
          </p>
        </div>
        <div>
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-gold">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm text-cream/85">
            <li><Link href="/#services" className="hover:text-gold">Services</Link></li>
            <li><Link href="/#how" className="hover:text-gold">How it works</Link></li>
            <li><Link href="/integrity" className="hover:text-gold">Our approach</Link></li>
            <li><Link href="/request" className="hover:text-gold">Make a request</Link></li>
            <li><Link href="/tools/word-counter" className="hover:text-gold">Free word counter</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-gold">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm text-cream/85">
            <li><a href={`mailto:${CONTACT}`} className="hover:text-gold">{CONTACT}</a></li>
            <li><Link href="/privacy" className="hover:text-gold">Privacy</Link></li>
            <li><Link href="/refunds" className="hover:text-gold">Revisions and refunds</Link></li>
            <li><Link href="/terms" className="hover:text-gold">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/15 px-4 py-5 text-center text-xs text-cream/60">
        © {new Date().getFullYear()} Trivium Tutors. We do not sit exams or write work to be submitted under someone else&apos;s name.
      </div>
    </footer>
  );
}
