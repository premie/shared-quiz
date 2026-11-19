import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS } from "./questions";
import { PREFILL_NOTICE, fetchPrefill, readLeadToken, sanitizePrefill } from "./prefill";

// What os-conduit GET /api/mold-qualifier/prefill returns for a typical MCC
// referral (lib/mcc-intake-summary.js mapMccAnswersToQualifier).
const SERVER_ANSWERS = {
  property_type: "Apartment or rental home",
  state: "Arizona",
  noticed_when: "Within the last few months",
  notified: "Yes — in writing (I can show the email, text, or letter)",
  notice_date: "2026-09-18",
  unit_access: "Yes — I still live there",
  evidence: ["Written complaints (texts, emails)"],
};

function fakeFetch(status: number, body: unknown, calls: string[] = []): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
}

describe("readLeadToken", () => {
  it("reads ?token= and ?qualifier_token=", () => {
    assert.equal(readLeadToken("?token=abc.def"), "abc.def");
    assert.equal(readLeadToken("?qualifier_token=abc.def&utm_source=x"), "abc.def");
  });
  it("is null without a token", () => {
    assert.equal(readLeadToken(""), null);
    assert.equal(readLeadToken("?utm_source=sms"), null);
    assert.equal(readLeadToken(`?token=${"x".repeat(2000)}`), null);
  });
});

describe("sanitizePrefill", () => {
  it("keeps every valid server answer", () => {
    assert.deepEqual(sanitizePrefill(SERVER_ANSWERS, QUESTIONS), SERVER_ANSWERS);
  });

  it("drops values that are not current options, and unknown keys", () => {
    const out = sanitizePrefill(
      {
        property_type: "Rental",
        state: "AZ",
        unit_access: "Yes — I still live there",
        evidence: ["Written complaints (texts, emails)", "Bogus", "Written complaints (texts, emails)"],
        landlord_email: "lee@landlord.test",
      },
      QUESTIONS,
    );
    assert.deepEqual(out, {
      unit_access: "Yes — I still live there",
      evidence: ["Written complaints (texts, emails)"],
    });
  });

  it("never pre-fills free-text questions", () => {
    const out = sanitizePrefill({ ...SERVER_ANSWERS, notice_excerpt: "Dear landlord" }, QUESTIONS);
    assert.equal(out.notice_excerpt, undefined);
  });

  it("rejects malformed dates and drops follow-ups whose parent does not show them", () => {
    assert.equal(sanitizePrefill({ ...SERVER_ANSWERS, notice_date: "2026-02-30" }, QUESTIONS).notice_date, undefined);
    const verbal = sanitizePrefill(
      { notified: "Yes — but only verbally or in person (no written record)", notice_date: "2026-09-18" },
      QUESTIONS,
    );
    assert.deepEqual(verbal, { notified: "Yes — but only verbally or in person (no written record)" });
  });

  it("returns {} for junk", () => {
    assert.deepEqual(sanitizePrefill(null, QUESTIONS), {});
    assert.deepEqual(sanitizePrefill([1, 2], QUESTIONS), {});
    assert.deepEqual(sanitizePrefill("x", QUESTIONS), {});
  });
});

describe("fetchPrefill", () => {
  it("GETs the prefill URL with the token and returns sanitized answers", async () => {
    const calls: string[] = [];
    const out = await fetchPrefill(
      "https://os.conduit.law/api/mold-qualifier/prefill",
      "abc.def",
      QUESTIONS,
      fakeFetch(200, { answers: { ...SERVER_ANSWERS, state: "Narnia" } }, calls),
    );
    assert.deepEqual(calls, ["https://os.conduit.law/api/mold-qualifier/prefill?token=abc.def"]);
    const { state: _dropped, ...rest } = SERVER_ANSWERS;
    assert.deepEqual(out, rest);
  });

  it("opens blank on a 404 (bad or expired token) or a network error", async () => {
    assert.deepEqual(await fetchPrefill("https://x.test/p", "t", QUESTIONS, fakeFetch(404, { error: "Not found" })), {});
    const boom = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    assert.deepEqual(await fetchPrefill("https://x.test/p", "t", QUESTIONS, boom), {});
  });
});

describe("prefill notice copy", () => {
  it("has no em dashes", () => {
    assert.ok(!PREFILL_NOTICE.includes("—"));
  });
});
