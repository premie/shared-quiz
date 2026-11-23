// Pre-filled mold qualifier (opt-in via CaseQualifierConfig.prefillUrl).
//
// A referral partner (Mold Case Consulting) already asked the client most of
// these questions. When the qualifier is opened with ?token=<lead token>, the
// site fetches the answers the firm mapped from that intake and pre-selects
// them. The client still walks every question and submits the qualifier
// themselves; nothing here submits or skips a step.
//
// Everything that comes back is checked against the qualifier's own questions:
// an answer that is not one of the current options (or a question that would
// be skipped given the other answers) is dropped, so server/option drift fails
// closed to a blank question rather than a wrong one.

import type { Answers, Question } from "./types";

export const PREFILL_NOTICE =
  "We filled in what you told Mold Case Consulting. Please check each answer and correct anything that is wrong.";

/** The lead token from the page URL (`?token=`, or `?qualifier_token=`). */
export function readLeadToken(search: string): string | null {
  const params = new URLSearchParams(search || "");
  const token = (params.get("token") || params.get("qualifier_token") || "").trim();
  return token && token.length <= 1024 ? token : null;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Keep only answers that are valid for `questions` as they stand today. */
export function sanitizePrefill(raw: unknown, questions: Question[]): Answers {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const input = raw as Record<string, unknown>;
  const out: Answers = {};
  for (const q of questions) {
    const value = input[q.id];
    if (value === undefined || value === null) continue;
    const options = q.options || [];
    if (q.type === "single" || q.type === "select") {
      if (typeof value === "string" && options.includes(value)) out[q.id] = value;
    } else if (q.type === "multi") {
      if (!Array.isArray(value)) continue;
      const picked = [...new Set(value.filter((v): v is string => typeof v === "string" && options.includes(v)))];
      if (picked.length) out[q.id] = picked;
    } else if (q.type === "date") {
      if (typeof value === "string" && isValidIsoDate(value)) out[q.id] = value;
    }
    // "text" questions are never pre-filled: they are the client's own words.
  }
  // A follow-up only makes sense if its parent answer shows it.
  for (const q of questions) {
    if (q.skip && out[q.id] !== undefined && q.skip(out)) delete out[q.id];
  }
  return out;
}

/**
 * Fetch and sanitize the prefill. Any failure (network, 404 for a bad or
 * expired token, bad JSON) resolves to {} so the qualifier simply opens blank.
 */
export async function fetchPrefill(
  prefillUrl: string,
  token: string,
  questions: Question[],
  fetchImpl: typeof fetch = fetch,
): Promise<Answers> {
  try {
    const base = typeof window !== "undefined" ? window.location.href : undefined;
    const url = new URL(prefillUrl, base);
    url.searchParams.set("token", token);
    const res = await fetchImpl(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return {};
    const body = (await res.json()) as { answers?: unknown } | null;
    return sanitizePrefill(body && body.answers, questions);
  } catch {
    return {};
  }
}
