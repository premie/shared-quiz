import type { CaseQualifierConfig, CaseQualifierTheme } from "./types";

export type SeverityTier = "mild" | "moderate" | "severe" | "catastrophic";

export type DisqualifyReason =
  | "homeowner"
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
  state: "Arizona" | "California" | "Colorado" | "Kansas" | "Other";
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
  abbrev: "AZ" | "CA" | "CO" | "KS";
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
}
