import type { CaseQualifierConfig, CaseQualifierTheme } from "./types";

export type SeverityTier = "mild" | "moderate" | "severe" | "catastrophic";

export type DisqualifyReason =
  | "homeowner"
  | "workplace"
  | "hoa"
  | "out-of-state"
  | "hotel-str"
  | "no-unit-access"
  | "sol-expired";

export interface CalculatorInputs {
  property_type:
    | "rental"
    | "workplace"
    | "owned"
    | "hoa"
    | "hotel-str"
    | "other";
  // Full state name from the state dropdown. We list all 50 + DC now, so this
  // is a plain string rather than the old covered-states-only union.
  state: string;
  unit_access: "living-there" | "moved-but-access" | "report-only" | "no-access";
  notice: "written" | "verbal" | "none";
  severity: SeverityTier;
  medical_treatment:
    | "none"
    | "pcp"
    | "specialist"
    | "hospitalized"
    | "ongoing";
  vulnerable: "none" | "child" | "elderly" | "immunocompromised" | "multiple";
  inspection: "phase1" | "basic" | "none";
  documentation: "comprehensive" | "some" | "none";
  medical_records: "explicit" | "partial" | "none";
  samples: "climate-controlled" | "stored" | "none";
  landlord_response: "ignored" | "cosmetic" | "professional" | "denied";
  retaliation: "eviction" | "rent-increase" | "services" | "none";
  admission: "email-text" | "work-order" | "none";
  past_medical_usd: number;
  lost_wages_usd: number;
  property_damage_usd: number;
}

export interface LineItem {
  label: string;
  low: number;
  high: number;
  note?: string;
}

export interface AppliedMultiplier {
  label: string;
  percent: number;
  reason: string;
}

export interface StateMoldLaw {
  abbrev: string;
  statuteOfLimitations: string;
  habitabilityCitation: string;
  retaliationCitation: string;
  notes: string;
}

export type CalculatorResult =
  | {
      type: "estimate";
      tier: SeverityTier;
      range: { low: number; high: number };
      breakdown: LineItem[];
      multipliers: AppliedMultiplier[];
      stateInfo: StateMoldLaw | null;
      /** Property is outside AZ/CA/CO/KS — show the honest coverage note and
       *  submit as a referral lead, but still give them the estimate. */
      outOfCoverage: boolean;
      summary: string;
    }
  | {
      type: "unlikely-case";
      reason: DisqualifyReason;
      title: string;
      message: string;
    }
  | {
      type: "borderline-needs-review";
      tier: SeverityTier;
      title: string;
      message: string;
    };

export interface CaseCalculatorProps {
  config: CaseQualifierConfig;
  theme?: CaseQualifierTheme;
  headline?: string;
  subhead?: string;
  consentText?: string;
  legalFooter?: string;
  /** Copy for the mandatory acknowledgement checkbox shown before the estimate. */
  acknowledgementText?: string;
  /** Persistent one-line disclosure shown on every screen. */
  perScreenDisclaimer?: string;
  /** Where "talk to an attorney" links (per brand). */
  consultHref?: string;
  /**
   * Where the case qualifier lives (per brand). When set, the post-submit screen
   * becomes a hand-off to it rather than a thank-you.
   *
   * An estimate is a range; the qualifier is what establishes whether there is a
   * claim, and downstream steps are gated on its answers (os-conduit only
   * provisions a mold document portal for a real qualifier submission). So
   * finishing the calculator is the middle of the funnel, not the end. The lead
   * is already captured, so nothing is lost if the visitor stops here.
   */
  qualifierHref?: string;
}
