// Attribution capture for quiz/calculator lead submissions.
//
// Captures paid-ads click IDs (the join keys for offline conversion import) and
// the GA4 client_id (so server-side Measurement Protocol conversions stitch to
// the same GA4 session). Shared by both consuming sites (moldlawking.com,
// conduit.law) — cookies are per-domain so the cookie name is safe to share.

const CLICK_KEYS = ["gclid", "gbraid", "wbraid", "fbclid", "msclkid"] as const;
const CLICK_COOKIE = "qz_click_ids";
const CLICK_TTL_DAYS = 90; // Google Ads default conversion window

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : "";
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Capture click IDs + GA client_id for inclusion in a lead payload.
 * Click IDs: URL (freshest) merged over a 90-day cookie, re-persisted when seen.
 * Call this on page mount too (it persists the cookie) for cross-page coverage.
 */
export function captureAttribution(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof window === "undefined") return out;

  const sp = new URLSearchParams(window.location.search);
  let stored: Record<string, string> = {};
  try { stored = JSON.parse(getCookie(CLICK_COOKIE) || "{}"); } catch { /* ignore */ }

  const fromUrl: Record<string, string> = {};
  CLICK_KEYS.forEach((k) => { const v = sp.get(k); if (v) fromUrl[k] = v; });

  const merged = { ...stored, ...fromUrl };
  if (Object.keys(fromUrl).length) {
    try { setCookie(CLICK_COOKIE, JSON.stringify(merged), CLICK_TTL_DAYS); } catch { /* ignore */ }
  }
  Object.assign(out, merged);

  // GA4 client_id from the _ga cookie (format: GA1.<ver>.<client_id>).
  const ga = getCookie("_ga");
  const m = ga.match(/^GA1\.\d+\.(.+)$/);
  if (m) out.ga_client_id = m[1];

  return out;
}
