import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Generic multi-step qualifier engine (the "King" network standard).
//
// One component, configured per site/vertical. Everything that varies — the
// question set, the result/scoring logic, theme tokens, intro copy, and lead
// routing — is passed in as config. Modeled on the Property Damage King
// qualifier UX (dedicated page, opens straight into the first question, soft
// progress bar, "Preliminary assessment" result).
// ---------------------------------------------------------------------------

export type Answers = Record<string, string | string[]>;

export type FieldKind = "text" | "tel" | "email" | "number" | "money" | "select";

export interface QField {
  key: string;
  label?: string;
  placeholder?: string;
  kind?: FieldKind; // default "text"
  options?: string[]; // for kind="select"
  required?: boolean;
  /** Layout hint — render in a responsive 2-up grid with its neighbours. */
  half?: boolean;
}

export type QType = "single" | "multi" | "fields" | "contact";

export interface QQuestion {
  id: string;
  type: QType;
  eyebrow: string;
  heading: string;
  sub?: string;
  /** single | multi */
  options?: string[];
  /** fields */
  fields?: QField[];
  /** Hide this question when it doesn't apply to the answers so far. */
  skip?: (a: Answers) => boolean;
}

export interface QResult {
  type: string;
  qualifies: boolean;
  summary: string;
  note?: string;
  /** Optional headline value row, e.g. "Potential gap to recover" + a number. */
  gapLabel?: string;
  gap?: number;
  /** "What happens next" steps shown on the result screen. */
  nextSteps?: string[];
}

export interface QualifierTheme {
  pageGradFrom: string;
  pageGradTo: string;
  accent: string; // primary action / highlights
  accentHover: string;
  accentText: string; // text on accent buttons
  accentSoft: string; // selected-option / highlight background
  bodyText?: string; // default "#C2CCDA"
  mutedText?: string; // default "#9FB0C9"
}

export interface QualifierIntro {
  eyebrow?: string;
  headline: string;
  subhead: string;
  badges?: string[];
}

export interface QualifierBrand {
  /** Header text lockup. Omit when `crown` carries the full logo image. */
  name?: ReactNode;
  homeHref?: string; // default "/"
  exitLabel?: string; // default "Exit"
  /** Brand mark / logo (e.g. a next/image crest) shown in the header. */
  crown?: ReactNode;
}

export interface QualifierConfig {
  source: string;
  campaign: string;
  practiceArea?: string;
  /** Same-origin POST endpoint. Must fail loud (non-2xx) so we can fall back. */
  submitUrl: string;
  fallbackPhone?: { display: string; href: string };
  questions: QQuestion[];
  classify: (a: Answers) => QResult;
  intro: QualifierIntro;
  brand: QualifierBrand;
  consentText?: string;
  legalFooter?: string;
  /** App-supplied attribution payload (UTM/click-ids/GA) merged into the lead. */
  getAttribution?: () => Record<string, unknown>;
  /** App-supplied analytics hook (GA events). */
  onEvent?: (name: string, params?: Record<string, unknown>) => void;
}

export interface QualifierProps {
  config: QualifierConfig;
  theme: QualifierTheme;
}
