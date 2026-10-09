import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { authEnabled, safeNext } from "@/lib/supabaseAuth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function Page({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined);
  const notice =
    sp.error === "link"
      ? "That link did not work. It may have expired, or been opened on a different device from the one you signed up on. Sign in, or ask for a new link."
      : undefined;
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      {authEnabled ? (
        <AuthForm mode="login" next={next} notice={notice} />
      ) : (
        <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
          <h1 className="text-3xl text-ink">Accounts open soon</h1>
          <p className="mt-3 text-ink-soft">You do not need one yet. You can make a request right now.</p>
          <Link href="/request" className="mt-5 inline-block rounded-full bg-ink px-6 py-3 font-medium text-cream hover:bg-ink-soft">Make a request</Link>
        </div>
      )}
    </div>
  );
}
