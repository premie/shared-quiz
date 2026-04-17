export { CaseQualifier, default } from "./CaseQualifier";
export {
  QUESTIONS,
  TIER_CONFIG,
  STATE_CODES,
  computeFlags,
  computeScore,
  getTier,
} from "./questions";
export { submitLead } from "./submit";
export type {
  Answers,
  Question,
  QuestionType,
  Tier,
  CaseQualifierConfig,
  CaseQualifierTheme,
  CaseQualifierProps,
} from "./types";

export { CaseCalculator } from "./CaseCalculator";
export { computeResult as computeCalculatorResult } from "./calculator-logic";
export { submitCalculatorLead } from "./calculator-submit";
export type {
  CalculatorInputs,
  CalculatorResult,
  SeverityTier,
  DisqualifyReason,
  LineItem,
  AppliedMultiplier,
  StateMoldLaw,
  CaseCalculatorProps,
} from "./calculator-types";
