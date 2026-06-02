import type { Answers, CaseQualifierConfig, Tier } from "./types";
import { STATE_CODES } from "./questions";

export interface ContactData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  unitAddress: string;
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
    `Contaminated unit address: ${contact.unitAddress.trim() || "—"}`,
    `Timeline: ${answers.noticed_when || "—"}`,
    `Health injury: ${answers.injury || "—"}`,
    answers.doctor ? `Seen doctor: ${answers.doctor}` : null,
    `Notified party: ${answers.notified || "—"}`,
    answers.response ? `Response: ${answers.response}` : null,
    `Unit access: ${answers.unit_access || "—"}`,
    answers.unit_access_loss_date
      ? `Unit access loss date: ${answers.unit_access_loss_date}`
      : null,
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

  const fullName = `${contact.firstName.trim()} ${contact.lastName.trim()}`
    .replace(/\s+/g, " ")
    .trim();
  const cityClean = contact.city.trim();
  // The lead email renders a single location line from `city`. Append the state
  // already captured by the quiz so it reads "Brighton, CO" instead of a
  // half-typed free-text string.
  const cityState =
    cityClean && stateCode ? `${cityClean}, ${stateCode}` : cityClean;

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
    name: fullName,
    first_name: contact.firstName.trim(),
    last_name: contact.lastName.trim(),
    phone: contact.phone,
    email: contact.email,
    address: contact.unitAddress.trim(),
    property_address: contact.unitAddress.trim(),
    contaminated_unit_address: contact.unitAddress.trim(),
    city: cityState,
    state: stateCode,
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
    unit_access: answers.unit_access || "",
    unit_access_loss_date: answers.unit_access_loss_date || "",
    // Legacy field — Make.com scenario filters on this exact value.
    // Don't change without updating the scenario.
    source: "website_qualifier",
    site: config.source,
    campaign: config.campaign,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    ...sharedMeta,
  };

  const conduitPayload = {
    name: fullName,
    first_name: contact.firstName.trim(),
    last_name: contact.lastName.trim(),
    phone: contact.phone,
    email: contact.email,
    address: contact.unitAddress.trim(),
    property_address: contact.unitAddress.trim(),
    contaminated_unit_address: contact.unitAddress.trim(),
    city: cityClean,
    state: stateCode,
    practice_area: "mold",
    injury_type: "mold_exposure",
    description: descLines,
    unit_access: answers.unit_access || null,
    unit_access_loss_date: answers.unit_access_loss_date || null,
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

  // Use fetch with keepalive (not sendBeacon): sendBeacon silently drops
  // cross-origin JSON posts because it can't issue the CORS preflight that
  // Content-Type: application/json requires, and there is no return-value
  // check / retry. keepalive: true survives page unload like a beacon would.
  try {
    await fetch(config.conduitWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(conduitPayload),
      keepalive: true,
    });
  } catch (err) {
    console.warn("os-conduit webhook error:", err);
  }
}
