import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  QUESTIONS,
  TIER_CONFIG,
  OUT_OF_COVERAGE_RESULT,
  WORKPLACE_EXPOSURE_RESULT,
  computeFlags,
  getTier,
  resolveResultConfig,
} from "./questions";
import { computeResult } from "./calculator-logic";
import type { CalculatorInputs } from "./calculator-types";

const rentalAnswers = {
  property_type: "Apartment or rental home",
  state: "Colorado",
  noticed_when: "Within the last few months",
  injury: "Yes — I personally have symptoms",
  doctor: "Yes — I have medical records",
  notified: "Yes — in writing (I can show the email, text, or letter)",
  unit_access: "Yes — I still live there",
  evidence: ["Photos or videos of mold"],
};

describe("workplace mold qualifier copy", () => {
  it("flags Workplace or office as WORKPLACE_EXPOSURE", () => {
    const flags = computeFlags({
      ...rentalAnswers,
      property_type: "Workplace or office",
    });
    assert.ok(flags.includes("WORKPLACE_EXPOSURE"));
  });

  it("flags I-work-there unit access as WORKPLACE_EXPOSURE", () => {
    const flags = computeFlags({
      ...rentalAnswers,
      unit_access: "Yes — I work there (it's not my home)",
    });
    assert.ok(flags.includes("WORKPLACE_EXPOSURE"));
  });

  it("routes workplace to unlikely tier", () => {
    assert.equal(getTier(["WORKPLACE_EXPOSURE"], 10), "unlikely");
  });

  it("uses dedicated workplace result copy, not the generic unlikely line", () => {
    const result = resolveResultConfig(["WORKPLACE_EXPOSURE"], "unlikely");
    assert.equal(result, WORKPLACE_EXPOSURE_RESULT);
    assert.equal(result.title, "We Don't Handle Workplace Mold");
    assert.match(result.body, /not a case we take|will not be able to take the case/i);
    assert.match(result.body, /residential tenants/i);
    assert.notEqual(result.body, TIER_CONFIG.unlikely.body);
  });

  it("workplace copy wins over out-of-coverage copy", () => {
    const result = resolveResultConfig(
      ["WORKPLACE_EXPOSURE", "OUT_OF_COVERAGE"],
      "strong",
    );
    assert.equal(result, WORKPLACE_EXPOSURE_RESULT);
    assert.notEqual(result, OUT_OF_COVERAGE_RESULT);
  });

  it("keeps generic unlikely copy for other hard flags", () => {
    const result = resolveResultConfig(["HOMEOWNER_NO_LANDLORD"], "unlikely");
    assert.equal(result, TIER_CONFIG.unlikely);
  });

  it("states the workplace limit on the first question", () => {
    const q1 = QUESTIONS.find((q) => q.id === "property_type");
    assert.ok(q1?.sub);
    assert.match(q1.sub, /Workplace mold is not a case we take/i);
  });
});

function baseCalculatorInputs(
  overrides: Partial<CalculatorInputs> = {},
): CalculatorInputs {
  return {
    property_type: "rental",
    state: "Colorado",
    unit_access: "living-there",
    notice: "written",
    severity: "moderate",
    medical_treatment: "pcp",
    vulnerable: "none",
    inspection: "basic",
    documentation: "some",
    medical_records: "partial",
    samples: "stored",
    landlord_response: "ignored",
    retaliation: "none",
    admission: "none",
    past_medical_usd: 0,
    lost_wages_usd: 0,
    property_damage_usd: 0,
    ...overrides,
  };
}

describe("workplace mold calculator path", () => {
  it("does not produce a dollar estimate for workplace exposure", () => {
    const result = computeResult(
      baseCalculatorInputs({ property_type: "workplace" }),
    );
    assert.equal(result.type, "unlikely-case");
    if (result.type !== "unlikely-case") return;
    assert.equal(result.reason, "workplace");
    assert.equal(result.title, "We Don't Handle Workplace Mold");
    assert.match(result.message, /will not put a value/i);
    assert.match(result.message, /leave your info/i);
  });

  it("still estimates a covered rental", () => {
    const result = computeResult(baseCalculatorInputs());
    assert.equal(result.type, "estimate");
  });
});
