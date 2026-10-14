export type QuestionType = "single" | "multi" | "date" | "select" | "text";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  sub?: string;
  options?: string[];
  /** Optional questions can be advanced past without an answer. */
  optional?: boolean;
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
  /**
   * Per-site fallback contact shown if a submission can't be delivered after
   * retries, so a lead is never silently lost — the visitor is told how to
   * reach this site's office directly. Optional; omit to show a generic prompt.
   */
  fallbackPhone?: string;
  fallbackEmail?: string;
  /**
   * Cloudflare Turnstile site key. Opt-in: when set, the form renders an
   * interaction-only Turnstile widget plus a hidden honeypot field and sends
   * `captchaToken` / `honeypot` with the lead. Only set it when
   * `conduitWebhookUrl` points at the site's OWN server relay that verifies the
   * token; the central receiver ignores both fields.
   */
  turnstileSiteKey?: string;
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
