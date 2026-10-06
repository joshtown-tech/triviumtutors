"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export const turnstileOn = Boolean(SITE_KEY);

/** Cloudflare's "are you a person" widget. Renders nothing when no site key is configured. */
export function Turnstile({ onToken, resetKey }: { onToken: (t: string) => void; resetKey: number }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const cb = useRef(onToken);
  useEffect(() => {
    cb.current = onToken;
  });

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let cancelled = false;

    function mount() {
      if (cancelled || !box.current || !window.turnstile) return;
      if (widget.current) window.turnstile.remove(widget.current);
      widget.current = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => cb.current(t),
        "expired-callback": () => cb.current(""),
        "error-callback": () => cb.current(""),
        theme: "light",
      });
    }

    if (window.turnstile) {
      mount();
    } else {
      if (!document.getElementById("cf-turnstile-script")) {
        const s = document.createElement("script");
        s.id = "cf-turnstile-script";
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        document.head.appendChild(s);
      }
      const t = window.setInterval(() => {
        if (window.turnstile) {
          window.clearInterval(t);
          mount();
        }
      }, 150);
      return () => {
        cancelled = true;
        window.clearInterval(t);
      };
    }
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={box} className="min-h-[65px]" />;
}
