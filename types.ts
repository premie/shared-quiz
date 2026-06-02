export type QuestionType = "single" | "multi" | "date";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  sub?: string;
  options?: string[];
  flag?: (value: string | string[]) => string | null;
  skip?: (answers: Answers) => boolean;
}

export type Answers = Record<string, string | string[]>;

export type Tier = "strong" | "promising" | "unlikely";

export interface CaseQualifierConfig {
  /**
   * @deprecated Make.com lead notification was retired 2026-06-01 — leads now
   * flow only to os-conduit (conduitWebhookUrl), which sends the notification.
   * No longer read by submit.ts / calculator-submit.ts; kept optional so
   * existing callers don't break.
   */
  formWebhookUrl?: string;
  conduitWebhookUrl: string;
  source: "mlk" | "conduit";
  campaign: string;
}

export interface CaseQualifierTheme {
  headerGradientFrom?: string;
  headerGradientTo?: string;
  accentBg?: string;
  accentBgHover?: string;
  accentText?: string;
  accentSoftBg?: string;
}

export interface CaseQualifierProps {
  config: CaseQualifierConfig;
  theme?: CaseQualifierTheme;
  headline?: string;
  subhead?: string;
  consentText?: string;
  legalFooter?: string;
}
