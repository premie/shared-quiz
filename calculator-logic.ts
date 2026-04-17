import type {
  AppliedMultiplier,
  CalculatorInputs,
  CalculatorResult,
  LineItem,
  SeverityTier,
  StateMoldLaw,
} from "./calculator-types";

const TIER_RANGES: Record<SeverityTier, { low: number; high: number }> = {
  mild: { low: 10_000, high: 50_000 },
  moderate: { low: 50_000, high: 150_000 },
  severe: { low: 150_000, high: 500_000 },
  catastrophic: { low: 500_000, high: 1_000_000 },
};

const STATE_LAW: Record<string, StateMoldLaw> = {
  Arizona: {
    abbrev: "AZ",
    statuteOfLimitations: "2 years (A.R.S. §12-542) with Gust discovery rule",
    habitabilityCitation: "A.R.S. §33-1324 (ARLTA)",
    retaliationCitation: "A.R.S. §33-1381",
    notes:
      "ARLTA notice rules: 5-day cure for health/safety under §33-1324(C), 10 days otherwise. Non-compliant notice defeats most remedies.",
  },
  California: {
    abbrev: "CA",
    statuteOfLimitations: "2 years (CCP §335.1) with discovery rule",
    habitabilityCitation: "Cal. Civ. Code §1941.1",
    retaliationCitation: "Cal. Civ. Code §1942.5",
    notes:
      "SB 732 disclosure requirements; strongest tenant protections. Punitive damages possible for willful non-disclosure.",
  },
  Colorado: {
    abbrev: "CO",
    statuteOfLimitations: "2 years (C.R.S. §13-80-102) with discovery rule",
    habitabilityCitation: "C.R.S. §38-12-503",
    retaliationCitation: "C.R.S. §38-12-509",
    notes:
      "Warranty of Habitability is non-waivable. Discovery rule often extends window in mold cases.",
  },
  Kansas: {
    abbrev: "KS",
    statuteOfLimitations: "2 years (K.S.A. §60-513(a)(4)) with Moon discovery rule",
    habitabilityCitation: "K.S.A. §58-2553 (KRLTA)",
    retaliationCitation: "K.S.A. §58-2572",
    notes:
      "KRLTA §58-2559 notice is 14-day cure / 30-day termination. Written notice almost always required.",
  },
};

// Cap the total multiplier adjustment at ±70% so estimates stay within
// defensible bounds no matter what combination triggers.
const MULTIPLIER_FLOOR = -0.7;
const MULTIPLIER_CEILING = 0.7;

function computeMultipliers(i: CalculatorInputs): AppliedMultiplier[] {
  const m: AppliedMultiplier[] = [];

  if (i.inspection === "phase1") {
    m.push({
      label: "Phase 1 environmental report",
      percent: 15,
      reason: "Certified industrial hygienist inspection with lab analysis",
    });
  }
  if (i.medical_records === "explicit") {
    m.push({
      label: "Medical records document exposure",
      percent: 10,
      reason: "Provider chart notes explicitly reference the mold exposure",
    });
  }
  if (i.admission !== "none") {
    m.push({
      label: "Landlord written admission",
      percent: 10,
      reason: "Email, text, or work order acknowledging the mold problem",
    });
  }
  if (i.retaliation !== "none") {
    m.push({
      label: "Landlord retaliation",
      percent: 20,
      reason: "Retaliation conduct supports enhanced damages theories",
    });
  }
  if (i.landlord_response === "cosmetic") {
    m.push({
      label: "Cosmetic-only remediation",
      percent: 10,
      reason: "Paint-over or partial fix without addressing moisture source",
    });
  }
  if (i.landlord_response === "professional") {
    m.push({
      label: "Quick professional remediation",
      percent: -10,
      reason: "Timely remediation reduces ongoing-harm component",
    });
  }
  if (i.notice === "none") {
    m.push({
      label: "No written notice",
      percent: -30,
      reason:
        "Statutory remedies require written notice under ARLTA/KRLTA/CO §38-12-503",
    });
  }
  if (
    i.samples === "none" &&
    i.inspection === "none" &&
    i.unit_access !== "living-there"
  ) {
    m.push({
      label: "No preserved evidence, tenant moved out",
      percent: -50,
      reason:
        "Reconstruction is expensive and produces weaker expert testimony",
    });
  }
  if (
    i.vulnerable === "child" ||
    i.vulnerable === "elderly" ||
    i.vulnerable === "immunocompromised"
  ) {
    m.push({
      label: "Vulnerable occupant affected",
      percent: 15,
      reason: "Medical causation is clearer for vulnerable populations",
    });
  }
  if (i.vulnerable === "multiple") {
    m.push({
      label: "Multiple household members affected",
      percent: 10,
      reason: "Co-occupant illness is persuasive circumstantial evidence",
    });
  }

  return m;
}

function clampTotalPercent(multipliers: AppliedMultiplier[]): number {
  const total = multipliers.reduce((s, m) => s + m.percent / 100, 0);
  return Math.max(MULTIPLIER_FLOOR, Math.min(MULTIPLIER_CEILING, total));
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

export function computeResult(i: CalculatorInputs): CalculatorResult {
  // ── Disqualifying paths ──
  if (i.property_type === "owned") {
    return {
      type: "unlikely-case",
      reason: "homeowner",
      title: "We May Not Be the Right Fit",
      message:
        "Mold cases need a landlord or business liability policy to collect against. Homeowner-own situations typically don't have a liable third party. A consultation can still confirm whether any other theory applies, but this falls outside our typical case profile.",
    };
  }
  if (i.property_type === "hoa") {
    return {
      type: "unlikely-case",
      reason: "hoa",
      title: "HOA Disputes Fall Outside Our Practice",
      message:
        "HOA-managed property disputes typically don't involve a landlord liability policy to collect against. We focus on tenant cases where there's a clear third-party defendant and insurance coverage.",
    };
  }
  if (i.property_type === "hotel-str") {
    return {
      type: "unlikely-case",
      reason: "hotel-str",
      title: "Short-Term Rentals Are Hard to Sample",
      message:
        "Short-term rentals (hotels, Airbnb, vacation rentals) rarely produce viable mold cases because you've checked out by the time symptoms connect to the exposure — and you can't get environmental samples after you leave. We may still be able to help; a brief consultation will tell us.",
    };
  }
  if (i.state === "Other") {
    return {
      type: "unlikely-case",
      reason: "out-of-state",
      title: "Outside Our Coverage Area",
      message:
        "We currently handle mold cases in Arizona, California, Colorado, and Kansas. For other states we can help connect you to a local firm that specializes in mold litigation.",
    };
  }
  if (i.unit_access === "no-access") {
    return {
      type: "unlikely-case",
      reason: "no-unit-access",
      title: "Unit Access Is Critical",
      message:
        "Mold cases rely heavily on environmental samples and expert inspection of the unit. Without access, reconstruction is expensive and produces weaker expert testimony. A consultation can still evaluate whether the medical and documentary evidence is strong enough to proceed.",
    };
  }

  // ── Borderline path: no evidence + moved out + no notice ──
  if (
    i.samples === "none" &&
    i.inspection === "none" &&
    i.documentation === "none" &&
    i.notice === "none" &&
    i.unit_access !== "living-there"
  ) {
    return {
      type: "borderline-needs-review",
      tier: i.severity,
      title: "Case Needs Attorney Review Before Estimating Value",
      message:
        "Without written notice and without preserved evidence, a meaningful value estimate would be misleading. A free consultation can evaluate whether reconstruction is viable in your specific circumstances before we try to put a number on it.",
    };
  }

  // ── Estimate path ──
  const base = TIER_RANGES[i.severity];
  const multipliers = computeMultipliers(i);
  const totalPercent = clampTotalPercent(multipliers);

  const multipliedLow = base.low * (1 + totalPercent);
  const multipliedHigh = base.high * (1 + totalPercent);

  const additive =
    (i.past_medical_usd || 0) +
    (i.lost_wages_usd || 0) +
    (i.property_damage_usd || 0);

  const finalLow = roundTo(multipliedLow + additive, 5_000);
  const finalHigh = roundTo(multipliedHigh + additive, 5_000);

  const breakdown: LineItem[] = [
    {
      label: `Base range (${i.severity} severity)`,
      low: base.low,
      high: base.high,
      note: "Tier-based starting range for pain & suffering and core damages",
    },
  ];
  if (totalPercent !== 0) {
    const adjLow = multipliedLow - base.low;
    const adjHigh = multipliedHigh - base.high;
    breakdown.push({
      label: `Multiplier adjustment (${totalPercent > 0 ? "+" : ""}${Math.round(totalPercent * 100)}%)`,
      low: Math.round(adjLow),
      high: Math.round(adjHigh),
      note: `${multipliers.length} factor${multipliers.length === 1 ? "" : "s"} applied`,
    });
  }
  if (i.past_medical_usd > 0) {
    breakdown.push({
      label: "Past medical expenses",
      low: i.past_medical_usd,
      high: i.past_medical_usd,
    });
  }
  if (i.lost_wages_usd > 0) {
    breakdown.push({
      label: "Lost wages",
      low: i.lost_wages_usd,
      high: i.lost_wages_usd,
    });
  }
  if (i.property_damage_usd > 0) {
    breakdown.push({
      label: "Property damage / relocation",
      low: i.property_damage_usd,
      high: i.property_damage_usd,
    });
  }

  const summary = buildSummary(i, totalPercent, multipliers.length);

  return {
    type: "estimate",
    tier: i.severity,
    range: { low: finalLow, high: finalHigh },
    breakdown,
    multipliers,
    stateInfo: STATE_LAW[i.state] || null,
    summary,
  };
}

function buildSummary(
  i: CalculatorInputs,
  totalPercent: number,
  multiplierCount: number,
): string {
  const parts: string[] = [];
  parts.push(
    `Based on ${i.severity} severity and the factors you described, the estimated settlement range reflects tier-based pain & suffering damages plus ${multiplierCount} applied multiplier${multiplierCount === 1 ? "" : "s"} (${totalPercent > 0 ? "+" : ""}${Math.round(totalPercent * 100)}% net).`,
  );
  if (i.past_medical_usd || i.lost_wages_usd || i.property_damage_usd) {
    parts.push(
      "Your documented economic damages (medical, wages, property) are added on top of that range at face value.",
    );
  }
  parts.push(
    "This is a rough model — actual settlement value depends on specifics only an attorney can evaluate.",
  );
  return parts.join(" ");
}

export function getTierRange(tier: SeverityTier) {
  return TIER_RANGES[tier];
}

export { STATE_LAW };
