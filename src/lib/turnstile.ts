// Cloudflare Turnstile: the free, privacy-friendly "are you a person" check.
// It stays off until both keys are set, so the site works locally with
// nothing configured. When on, a missing or invalid token is rejected.

export const turnstileEnabled = Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] verification call failed", err);
    // If Cloudflare itself is unreachable, fail closed: the other layers still
    // run, but an unverified browser should not get through on a technicality.
    return false;
  }
}
