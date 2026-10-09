import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RequestForm } from "@/components/RequestForm";
import { authEnabled, currentUser, displayName } from "@/lib/supabaseAuth";

export const metadata: Metadata = {
  title: "Make a request",
  description: "Tell us what you need help with. A person replies within one business day.",
};

export default async function RequestPage({ searchParams }: PageProps<"/request">) {
  const { service, words } = await searchParams;
  const user = await currentUser();
  if (authEnabled && !user) redirect("/signup?next=/request");
  const wc = typeof words === "string" && /^\d{1,6}$/.test(words) ? words : undefined;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-4xl text-ink sm:text-5xl">Make a request</h1>
      <p className="mt-3 mb-8 text-lg text-ink-soft">Three short steps. A person reads every request and replies within one business day.</p>
      <RequestForm initialService={typeof service === "string" ? service : undefined} initialWords={wc} account={user ? { name: displayName(user), email: user.email ?? "" } : undefined} />
    </div>
  );
}
