import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Trivium Tutors home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-6 text-sm font-medium text-ink-soft">
          <Link href="/#services" className="hidden rounded px-2 py-2 hover:text-ink sm:block">Services</Link>
          <Link href="/#how" className="hidden rounded px-2 py-2 hover:text-ink sm:block">How it works</Link>
          <Link href="/integrity" className="hidden rounded px-2 py-2 hover:text-ink sm:block">Our approach</Link>
          <Link href="/request" className="rounded-full bg-ink px-4 py-2.5 text-cream transition hover:bg-ink-soft">
            Make a request
          </Link>
        </nav>
      </div>
    </header>
  );
}
