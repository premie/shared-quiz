import type { Answers, CaseQualifierConfig, Tier } from "./types";
import { STATE_CODES } from "./questions";

export interface ContactData {
  name: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
}

export interface SubmitArgs {
  config: CaseQualifierConfig;
  answers: Answers;
  contact: ContactData;
  consentShare: boolean;
  tier: Tier;
  score: number;
  flags: string[];
}

export async function submitLead({
  config,
  answers,
  contact,
  consentShare,
  tier,
  score,
  flags,
}: SubmitArgs): Promise<void> {
  const flatAnswers: Record<string, string> = {};
  for (const [key, val] of Object.entries(answers)) {
    flatAnswers[`q_${key}`] = Array.isArray(val) ? val.join(", ") : val;
  }

  const descLines = [
    `Tier: ${tier} (score ${score}/10)`,
    flags.length > 0 ? `Flags: ${flags.join(", ")}` : "Flags: None",
    `Consent to share with expert: ${consentShare ? "Yes" : "No"}`,
    "",
    `Property: ${answers.property_type || "—"}`,
    `State: ${answers.state || "—"}`,
    `Timeline: ${answers.noticed_when || "—"}`,
    `Health injury: ${answers.injury || "—"}`,
    answers.doctor ? `Seen doctor: ${answers.doctor}` : null,
    `Notified party: ${answers.notified || "—"}`,
    answers.response ? `Response: ${answers.response}` : null,
    `Unit access: ${answers.unit_access || "—"}`,
    `Evidence: ${
      Array.isArray(answers.evidence)
        ? answers.evidence.join(", ")
        : answers.evidence || "—"
    }`,
    contact.notes ? `\nAdditional notes: ${contact.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const stateCode = STATE_CODES[answers.state as string] || null;

  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;

  const sharedMeta = {
    submitted_at: new Date().toISOString(),
    landing_page:
      typeof window !== "undefined" ? window.location.pathname : "",
    referrer:
      typeof document !== "undefined" ? document.referrer || "(direct)" : "",
    page_url: typeof window !== "undefined" ? window.location.href : "",
    utm_source: searchParams?.get("utm_source") || "",
    utm_medium: searchParams?.get("utm_medium") || "",
    utm_campaign: searchParams?.get("utm_campaign") || "",
    utm_content: searchParams?.get("utm_content") || "",
  };

  const makePayload = {
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    city: contact.city,
    notes: contact.notes,
    ...flatAnswers,
    consent_expert_share: consentShare ? "Yes" : "No",
    tier,
    tier_color:
      tier === "strong"
        ? "#16a34a"
        : tier === "promising"
          ? "#d97706"
          : "#6b7280",
    priority_score: score,
    flags: flags.join(", ") || "None",
    flag_count: flags.length,
    // Legacy field — Make.com scenario filters on this exact value.
    // Don't change without updating the scenario.
    source: "website_qualifier",
    site: config.source,
    campaign: config.campaign,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    ...sharedMeta,
  };

  const conduitPayload = {
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    city: contact.city,
    state: stateCode,
    practice_area: "mold",
    injury_type: "mold_exposure",
    description: descLines,
    campaign: config.campaign,
    ...sharedMeta,
    quiz_answers: answers,
    tier,
    priority_score: score,
    flags,
    consent_expert_share: consentShare,
  };

  try {
    await fetch(config.formWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(makePayload),
    });
  } catch (err) {
    console.warn("Make.com webhook error:", err);
  }

  try {
    const blob = new Blob([JSON.stringify(conduitPayload)], {
      type: "application/json",
    });
    navigator.sendBeacon(config.conduitWebhookUrl, blob);
  } catch (err) {
    console.warn("os-conduit beacon error:", err);
  }
}
