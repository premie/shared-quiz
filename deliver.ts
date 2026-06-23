// Single hardened delivery path for every lead form (qualifier + calculator,
// across all sites). Posts to the one central receiver (os-conduit
// /webhooks/inbound), which handles CORS and durably stores the submission in
// its events table before processing.
//
// "Never lose a lead silently" contract:
//  - await the response and verify response.ok (receiver returns 200 once the
//    submission is durably stored),
//  - retry transient failures (network error, timeout, 5xx) with backoff,
//  - stop early on a permanent 4xx,
//  - THROW on final failure so the caller shows a real fallback instead of a
//    false "thank you".
//
// We intentionally do NOT use sendBeacon/keepalive: both forgo any delivery
// confirmation, and sendBeacon can't issue the CORS preflight that a JSON POST
// requires — that was the original silent-loss bug. We stay on the page to show
// the result, so a verified fetch is what we want.
export async function deliverLead(
  url: string,
  payload: unknown,
  { maxAttempts = 3, timeoutMs = 10000 }: { maxAttempts?: number; timeoutMs?: number } = {},
): Promise<void> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (res.ok) return; // delivered + durably stored by the receiver
      // 4xx = permanent rejection (won't succeed on retry); 5xx = transient.
      lastError = new Error(`Lead receiver responded HTTP ${res.status}`);
      if (res.status < 500) break;
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, attempt * 800));
    }
  }

  console.error("Lead delivery failed after retries:", lastError);
  throw lastError instanceof Error ? lastError : new Error("Lead delivery failed");
}
