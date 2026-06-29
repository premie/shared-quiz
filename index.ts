// Generic qualifier engine (the King-network standard; config-driven per site).
export { Qualifier } from "./Qualifier";
export type {
  QualifierConfig,
  QualifierTheme,
  QualifierProps,
  QualifierIntro,
  QualifierBrand,
  QQuestion,
  QField,
  QType,
  FieldKind,
  QResult,
  Answers as EngineAnswers,
} from "./engine-types";

// Legacy mold-specific qualifier (still vendored by mold-law-king until migrated).
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
