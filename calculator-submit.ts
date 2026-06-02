import type { CaseQualifierConfig } from "./types";
import type { CalculatorInputs, CalculatorResult } from "./calculator-types";
import { STATE_LAW } from "./calculator-logic";

export interface CalculatorContact {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
}

export interface CalculatorSubmitArgs {
  config: CaseQualifierConfig;
  inputs: CalculatorInputs;
  result: CalculatorResult;
  contact: CalculatorContact;
  consentShare: boolean;
}

export async function submitCalculatorLead({
  config,
  inputs,
  result,
  contact,
  consentShare,
}: CalculatorSubmitArgs): Promise<void> {
  const stateCode = STATE_LAW[inputs.state]?.abbrev || null;

  const fullName = `${contact.firstName.trim()} ${contact.lastName.trim()}`
    .replace(/\s+/g, " ")
    .trim();
  // os-conduit receives city + state separately and composes the location line.
  const cityClean = contact.city.trim();

  const rangeLow = result.type === "estimate" ? result.range.low : null;
  const rangeHigh = result.type === "estimate" ? result.range.high : null;
  const tier = "tier" in result ? result.tier : null;

  const descLines = [
    `Mold settlement calculator result: ${result.type}`,
    tier ? `Severity tier: ${tier}` : null,
    rangeLow && rangeHigh
      ? `Estimated range: $${rangeLow.toLocaleString()} – $${rangeHigh.toLocaleString()}`
      : null,
    `Consent to share with expert: ${consentShare ? "Yes" : "No"}`,
    "",
    `Property: ${inputs.property_type}`,
    `State: ${inputs.state}`,
    `Unit access: ${inputs.unit_access}`,
    `Notice: ${inputs.notice}`,
    `Medical treatment: ${inputs.medical_treatment}`,
    `Vulnerable: ${inputs.vulnerable}`,
    `Inspection: ${inputs.inspection}`,
    `Documentation: ${inputs.documentation}`,
    `Medical records: ${inputs.medical_records}`,
    `Samples: ${inputs.samples}`,
    `Landlord response: ${inputs.landlord_response}`,
    `Retaliation: ${inputs.retaliation}`,
    `Admission: ${inputs.admission}`,
    inputs.past_medical_usd
      ? `Past medical: $${inputs.past_medical_usd.toLocaleString()}`
      : null,
    inputs.lost_wages_usd
      ? `Lost wages: $${inputs.lost_wages_usd.toLocaleString()}`
      : null,
    inputs.property_damage_usd
      ? `Property damage: $${inputs.property_damage_usd.toLocaleString()}`
      : null,
    contact.notes ? `\nAdditional notes: ${contact.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

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

  const conduitPayload = {
    name: fullName,
    first_name: contact.firstName.trim(),
    last_name: contact.lastName.trim(),
    phone: contact.phone,
    email: contact.email,
    city: cityClean,
    state: stateCode,
    practice_area: "mold",
    injury_type: "mold_exposure",
    description: descLines,
    campaign: config.campaign,
    ...sharedMeta,
    calculator_inputs: inputs,
    calculator_result: result,
    consent_expert_share: consentShare,
  };

  try {
    const blob = new Blob([JSON.stringify(conduitPayload)], {
      type: "application/json",
    });
    navigator.sendBeacon(config.conduitWebhookUrl, blob);
  } catch (err) {
    console.warn("os-conduit beacon error:", err);
  }
}
