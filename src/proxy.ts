import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs before /request, /signup and /login. It keeps the customer's session
// fresh and sends people where they should be:
//   signed out on /request          -> /signup (and back to /request afterwards)
//   signed in on /signup or /login  -> straight on to /request
// It does nothing at all until SUPABASE_ANON_KEY is set.

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON = process.env.SUPABASE_ANON_KEY || "";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.startsWith("/api/") || raw.startsWith("/auth/")) return "/request";
  return raw.slice(0, 300);
}

export async function proxy(request: NextRequest) {
  if (!URL || !ANON) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(URL, ANON, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, httpOnly: true, secure: process.env.NODE_ENV === "production" }));
      },
    },
  });

  let signedIn = false;
  try {
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } catch {
    signedIn = false;
  }

  const { pathname, search } = request.nextUrl;

  if (!signedIn && pathname.startsWith("/request")) {
    const to = request.nextUrl.clone();
    to.pathname = "/signup";
    to.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(to);
  }

  if (signedIn && (pathname === "/signup" || pathname === "/login")) {
    const to = request.nextUrl.clone();
    const next = safeNext(request.nextUrl.searchParams.get("next"));
    const [p, q] = next.split("?");
    to.pathname = p;
    to.search = q ? `?${q}` : "";
    return NextResponse.redirect(to);
  }

  return response;
}

export const config = { matcher: ["/request/:path*", "/signup", "/login"] };
