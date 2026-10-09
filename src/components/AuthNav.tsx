"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { email: string; name: string } | null;

/** Sign in / sign out in the header. Shows nothing until accounts are switched on. */
export function AuthNav() {
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [on, setOn] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 503) return setOn(false);
        setOn(true);
        setMe(((await r.json()) as { user: Me }).user);
      })
      .catch(() => alive && setOn(false));
    return () => {
      alive = false;
    };
  }, []);

  if (!on || me === undefined) return null;

  if (!me) {
    return <Link href="/login" className="whitespace-nowrap rounded px-2 py-2 text-sm font-medium text-ink-soft hover:text-ink">Sign in</Link>;
  }
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        window.location.href = "/";
      }}
      className="whitespace-nowrap rounded px-2 py-2 text-sm font-medium text-ink-soft hover:text-ink"
      title={me.email}
    >
      Sign out
    </button>
  );
}
