export type QuestionType = "single" | "multi";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  sub?: string;
  options: string[];
  flag?: (value: string | string[]) => string | null;
  skip?: (answers: Answers) => boolean;
}

export type Answers = Record<string, string | string[]>;

export type Tier = "strong" | "promising" | "unlikely";

export interface CaseQualifierConfig {
  formWebhookUrl: string;
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
