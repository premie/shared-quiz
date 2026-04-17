"use client";

import { useState, type CSSProperties } from "react";
import type { CaseQualifierTheme } from "./types";
import type {
  CalculatorInputs,
  CalculatorResult,
  CaseCalculatorProps,
} from "./calculator-types";
import { computeResult } from "./calculator-logic";
import { submitCalculatorLead } from "./calculator-submit";

const DEFAULT_THEME: Required<CaseQualifierTheme> = {
  headerGradientFrom: "#4A1C6F",
  headerGradientTo: "#2D1045",
  accentBg: "#D4AF37",
  accentBgHover: "#B8960C",
  accentText: "#FFFFFF",
  accentSoftBg: "rgba(212, 175, 55, 0.10)",
};

const DEFAULT_HEADLINE = "What Could Your Mold Case Be Worth?";
const DEFAULT_SUBHEAD =
  "Answer a few questions to see a rough settlement range based on your situation. Takes about 3 minutes.";
const DEFAULT_CONSENT =
  "I authorize the firm to share my case information with a qualified mold assessment expert. Without an expert evaluation, we are unable to properly assess your case for potential settlement value.";
const DEFAULT_LEGAL =
  "By submitting, you agree to be contacted by Conduit Law, LLC. Estimated ranges are illustrative and not a guarantee. Actual settlement value depends on specifics only an attorney can evaluate.";

type RadioQuestion = {
  kind: "radio";
  id: keyof CalculatorInputs;
  text: string;
  sub?: string;
  options: { value: string; label: string }[];
};

type NumberQuestion = {
  kind: "number";
  id: keyof CalculatorInputs;
  text: string;
  sub?: string;
  placeholder?: string;
};

type StepDef = {
  title: string;
  questions: (RadioQuestion | NumberQuestion)[];
};

const STEPS: StepDef[] = [
  {
    title: "1. Property & Eligibility",
    questions: [
      {
        kind: "radio",
        id: "property_type",
        text: "Where did the mold exposure happen?",
        options: [
          { value: "rental", label: "Apartment or rental home" },
          { value: "workplace", label: "Workplace or office" },
          { value: "owned", label: "A home I own" },
          { value: "hoa", label: "HOA-managed property" },
          { value: "hotel-str", label: "Hotel or short-term rental" },
          { value: "other", label: "Other" },
        ],
      },
      {
        kind: "radio",
        id: "state",
        text: "Which state was the property in?",
        options: [
          { value: "Arizona", label: "Arizona" },
          { value: "California", label: "California" },
          { value: "Colorado", label: "Colorado" },
          { value: "Kansas", label: "Kansas" },
          { value: "Other", label: "Other state" },
        ],
      },
      {
        kind: "radio",
        id: "unit_access",
        text: "Do you still have access to the property?",
        sub: "Sample collection requires access. This strongly affects viable case value.",
        options: [
          { value: "living-there", label: "Yes — I still live or work there" },
          { value: "moved-but-access", label: "Yes — moved out but can still access" },
          { value: "report-only", label: "No — but I have an inspection report" },
          { value: "no-access", label: "No — I no longer have access" },
        ],
      },
      {
        kind: "radio",
        id: "notice",
        text: "Did you give the landlord or employer written notice?",
        options: [
          { value: "written", label: "Yes — in writing (text, email, letter)" },
          { value: "verbal", label: "Yes — but verbally only" },
          { value: "none", label: "No, not yet" },
        ],
      },
    ],
  },
  {
    title: "2. Health Severity",
    questions: [
      {
        kind: "radio",
        id: "severity",
        text: "Overall severity of your health impact",
        options: [
          { value: "mild", label: "Mild — allergy-type symptoms, sinus issues that resolved" },
          { value: "moderate", label: "Moderate — chronic sinusitis, new-onset asthma, ongoing respiratory issues" },
          { value: "severe", label: "Severe — permanent lung damage, aspergillosis, neurological effects" },
          { value: "catastrophic", label: "Catastrophic — pulmonary fibrosis, permanent cognitive impairment" },
        ],
      },
      {
        kind: "radio",
        id: "medical_treatment",
        text: "What level of medical treatment have you received?",
        options: [
          { value: "none", label: "None" },
          { value: "pcp", label: "Primary care visits" },
          { value: "specialist", label: "Specialist (pulmonologist, allergist, etc.)" },
          { value: "hospitalized", label: "Hospitalized / ER visits" },
          { value: "ongoing", label: "Ongoing long-term care" },
        ],
      },
      {
        kind: "radio",
        id: "vulnerable",
        text: "Was anyone in a vulnerable population affected?",
        sub: "Children, elderly, immunocompromised, or multiple household members strengthen causation.",
        options: [
          { value: "none", label: "No — only healthy adult(s)" },
          { value: "child", label: "Yes — a child" },
          { value: "elderly", label: "Yes — an elderly household member" },
          { value: "immunocompromised", label: "Yes — an immunocompromised person" },
          { value: "multiple", label: "Multiple household members affected" },
        ],
      },
    ],
  },
  {
    title: "3. Evidence Strength",
    questions: [
      {
        kind: "radio",
        id: "inspection",
        text: "Do you have a professional mold inspection report?",
        options: [
          { value: "phase1", label: "Yes — Phase 1 report with lab analysis" },
          { value: "basic", label: "Yes — basic inspection without lab work" },
          { value: "none", label: "No" },
        ],
      },
      {
        kind: "radio",
        id: "documentation",
        text: "How much photo/video documentation do you have?",
        options: [
          { value: "comprehensive", label: "Comprehensive — multiple angles, dated, moisture sources too" },
          { value: "some", label: "Some photos or video" },
          { value: "none", label: "Little to none" },
        ],
      },
      {
        kind: "radio",
        id: "medical_records",
        text: "Do your medical records mention the mold exposure?",
        options: [
          { value: "explicit", label: "Yes — explicitly documented by the provider" },
          { value: "partial", label: "Partially — provider notes reference environmental exposure" },
          { value: "none", label: "No — only symptoms, no exposure reference" },
        ],
      },
      {
        kind: "radio",
        id: "samples",
        text: "Did you preserve physical samples from the unit?",
        options: [
          { value: "climate-controlled", label: "Yes — stored in climate-controlled conditions" },
          { value: "stored", label: "Yes — stored somewhere" },
          { value: "none", label: "No" },
        ],
      },
    ],
  },
  {
    title: "4. Landlord Conduct",
    questions: [
      {
        kind: "radio",
        id: "landlord_response",
        text: "How did the landlord or property owner respond?",
        options: [
          { value: "ignored", label: "Ignored my complaint entirely" },
          { value: "cosmetic", label: "Cosmetic fix (paint over, partial repair)" },
          { value: "professional", label: "Quick professional remediation" },
          { value: "denied", label: "Denied the problem exists" },
        ],
      },
      {
        kind: "radio",
        id: "retaliation",
        text: "Did they retaliate after you complained?",
        options: [
          { value: "none", label: "No retaliation" },
          { value: "eviction", label: "Filed or threatened eviction" },
          { value: "rent-increase", label: "Raised rent unexpectedly" },
          { value: "services", label: "Reduced services / ignored other requests" },
        ],
      },
      {
        kind: "radio",
        id: "admission",
        text: "Did the landlord admit the mold problem in writing?",
        sub: "Text, email, or a written work order that acknowledges the issue.",
        options: [
          { value: "email-text", label: "Yes — email or text" },
          { value: "work-order", label: "Yes — written work order" },
          { value: "none", label: "No written admission" },
        ],
      },
    ],
  },
  {
    title: "5. Financial Damages",
    questions: [
      {
        kind: "number",
        id: "past_medical_usd",
        text: "Past medical expenses so far (USD)",
        sub: "Roughly — include co-pays, specialist visits, prescriptions.",
        placeholder: "5000",
      },
      {
        kind: "number",
        id: "lost_wages_usd",
        text: "Lost wages (USD)",
        sub: "Sick days, medical appointments, time off work.",
        placeholder: "2500",
      },
      {
        kind: "number",
        id: "property_damage_usd",
        text: "Property damage + relocation costs (USD)",
        sub: "Belongings you had to throw out, moving costs, temp housing.",
        placeholder: "3000",
      },
    ],
  },
];

function stepComplete(step: number, inputs: Partial<CalculatorInputs>): boolean {
  const def = STEPS[step];
  return def.questions.every((q) => {
    const v = inputs[q.id];
    if (q.kind === "radio") return typeof v === "string" && v.length > 0;
    // number inputs can be 0 — treat explicit entry as complete once set
    return typeof v === "number" && !Number.isNaN(v);
  });
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

function isValidPhone(v: string): boolean {
  return v.replace(/\D/g, "").length === 10;
}

function formatPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function fmtMoney(n: number): string {
  return `$${n.toLocaleString()}`;
}

export function CaseCalculator({
  config,
  theme,
  headline = DEFAULT_HEADLINE,
  subhead = DEFAULT_SUBHEAD,
  consentText = DEFAULT_CONSENT,
  legalFooter = DEFAULT_LEGAL,
}: CaseCalculatorProps) {
  const t = { ...DEFAULT_THEME, ...theme };

  const [inputs, setInputs] = useState<Partial<CalculatorInputs>>({
    past_medical_usd: 0,
    lost_wages_usd: 0,
    property_damage_usd: 0,
  });
  const [phase, setPhase] = useState<"form" | "contact" | "done">("form");
  const [visibleSteps, setVisibleSteps] = useState(1);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [contact, setContact] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    notes: "",
  });
  const [consentShare, setConsentShare] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allStepsComplete = STEPS.every((_, i) => stepComplete(i, inputs));

  const headerStyle: CSSProperties = {
    background: `linear-gradient(to right, ${t.headerGradientFrom}, ${t.headerGradientTo})`,
  };
  const accentStyle: CSSProperties = { color: t.accentBg };
  const primaryBtnStyle: CSSProperties = {
    backgroundColor: t.accentBg,
    color: t.accentText,
  };
  const selectedOptionStyle: CSSProperties = {
    borderColor: t.accentBg,
    backgroundColor: t.accentSoftBg,
  };
  const selectedBadgeStyle: CSSProperties = {
    backgroundColor: t.accentBg,
    color: t.accentText,
    borderColor: t.accentBg,
  };

  const setRadio = (id: keyof CalculatorInputs, value: string) => {
    setInputs((prev) => {
      const next = { ...prev, [id]: value };
      // reveal next step if current one becomes complete
      STEPS.forEach((_, i) => {
        if (i < visibleSteps) return;
        if (stepComplete(i - 1, next) && i === visibleSteps) {
          // noop — handled below via effect-free reveal
        }
      });
      return next;
    });
  };

  const setNumber = (id: keyof CalculatorInputs, value: string) => {
    const n = value === "" ? 0 : Math.max(0, parseInt(value, 10) || 0);
    setInputs((prev) => ({ ...prev, [id]: n }));
  };

  // Reveal logic: after each render, expand visibleSteps to include any
  // step whose predecessor is complete. Computed inline to avoid useEffect.
  let maxVisible = 1;
  for (let i = 0; i < STEPS.length; i++) {
    if (stepComplete(i, inputs)) maxVisible = Math.min(STEPS.length, i + 2);
    else break;
  }
  if (maxVisible !== visibleSteps) {
    // schedule a state update on next tick
    queueMicrotask(() => setVisibleSteps(maxVisible));
  }

  const handleCompute = () => {
    if (!allStepsComplete) return;
    const r = computeResult(inputs as CalculatorInputs);
    setResult(r);
    setPhase("contact");
  };

  const handleSubmit = async () => {
    if (
      !contact.name ||
      !isValidPhone(contact.phone) ||
      !isValidEmail(contact.email) ||
      !consentShare ||
      !result
    )
      return;
    setSubmitting(true);
    await submitCalculatorLead({
      config,
      inputs: inputs as CalculatorInputs,
      result,
      contact,
      consentShare,
    });
    setPhase("done");
    setSubmitting(false);
  };

  const renderStep = (def: StepDef, idx: number) => (
    <div key={idx} className="p-8 border-t border-gray-200 first:border-t-0">
      <p
        className="text-xs font-bold uppercase tracking-wider mb-3"
        style={accentStyle}
      >
        {def.title}
      </p>
      <div className="space-y-6">
        {def.questions.map((q) => (
          <div key={q.id}>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {q.text}
            </h3>
            {q.sub && (
              <p className="text-sm text-gray-500 mb-3">{q.sub}</p>
            )}
            {q.kind === "radio" ? (
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => {
                  const selected = inputs[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRadio(q.id, opt.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left text-sm font-medium transition-all ${
                        selected
                          ? "text-gray-900"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                      style={selected ? selectedOptionStyle : undefined}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          selected ? "" : "border-2 border-gray-300"
                        }`}
                        style={selected ? selectedBadgeStyle : undefined}
                      >
                        {selected && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder={q.placeholder}
                  value={
                    inputs[q.id] === 0
                      ? ""
                      : (inputs[q.id] as number | undefined) ?? ""
                  }
                  onChange={(e) => setNumber(q.id, e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none transition-all"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderResult = () => {
    if (!result) return null;
    if (result.type !== "estimate") {
      return (
        <div className="p-8 text-center">
          <div className="text-5xl mb-4">
            {result.type === "unlikely-case" ? "📋" : "⚠️"}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {result.title}
          </h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            {result.message}
          </p>
        </div>
      );
    }
    const tierLabels: Record<string, string> = {
      mild: "Mild Exposure",
      moderate: "Moderate Exposure",
      severe: "Severe Exposure",
      catastrophic: "Catastrophic Exposure",
    };
    return (
      <div className="p-8">
        <div
          className="rounded-xl p-6 mb-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${t.headerGradientFrom}, ${t.headerGradientTo})`,
          }}
        >
          <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">
            {tierLabels[result.tier]}
          </p>
          <p className="text-3xl font-extrabold mb-2">
            {fmtMoney(result.range.low)} – {fmtMoney(result.range.high)}
          </p>
          <p className="text-sm opacity-90">Estimated settlement range</p>
        </div>

        <p className="text-sm text-gray-600 mb-6">{result.summary}</p>

        {result.breakdown.length > 0 && (
          <div className="mb-6">
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={accentStyle}
            >
              How we got there
            </p>
            <table className="w-full text-sm">
              <tbody>
                {result.breakdown.map((b, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-700">{b.label}</td>
                    <td className="py-2 text-right font-medium text-gray-900 whitespace-nowrap">
                      {b.low === b.high
                        ? fmtMoney(b.low)
                        : `${fmtMoney(b.low)} – ${fmtMoney(b.high)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.multipliers.length > 0 && (
          <div className="mb-6">
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={accentStyle}
            >
              Factors applied
            </p>
            <ul className="space-y-2">
              {result.multipliers.map((m, i) => (
                <li key={i} className="text-sm">
                  <span className="font-semibold">
                    {m.percent > 0 ? "+" : ""}
                    {m.percent}%
                  </span>{" "}
                  <span className="text-gray-700">{m.label}</span>
                  <span className="block text-xs text-gray-500 ml-8">
                    {m.reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.stateInfo && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p
              className="text-xs font-bold uppercase tracking-wider mb-1"
              style={accentStyle}
            >
              {result.stateInfo.abbrev} law notes
            </p>
            <p className="text-sm text-gray-700">
              <strong>SOL:</strong> {result.stateInfo.statuteOfLimitations}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Habitability:</strong>{" "}
              {result.stateInfo.habitabilityCitation}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Anti-retaliation:</strong>{" "}
              {result.stateInfo.retaliationCitation}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {result.stateInfo.notes}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-t-2xl px-8 py-7 text-white" style={headerStyle}>
            <h2 className="font-display font-bold text-2xl mb-1">{headline}</h2>
            <p className="text-sm text-gray-300">{subhead}</p>
          </div>

          <div className="bg-white border border-t-0 border-gray-200 rounded-b-2xl shadow-lg">
            {phase === "form" && (
              <>
                {STEPS.slice(0, visibleSteps).map((def, idx) =>
                  renderStep(def, idx),
                )}
                {allStepsComplete && (
                  <div className="p-8 border-t border-gray-200">
                    <button
                      onClick={handleCompute}
                      className="w-full font-bold py-4 px-6 rounded-lg transition-all shadow-lg"
                      style={primaryBtnStyle}
                    >
                      Calculate My Estimated Range →
                    </button>
                  </div>
                )}
              </>
            )}

            {phase === "contact" && (
              <>
                {renderResult()}
                <div className="p-8 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Get a free attorney evaluation
                  </h3>
                  <p className="text-sm text-gray-600 mb-5">
                    Enter your info and an attorney from our team will reach
                    out to walk through your specific facts.
                  </p>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Full name *"
                      value={contact.name}
                      onChange={(e) =>
                        setContact({ ...contact, name: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none"
                    />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={14}
                        placeholder="Phone *"
                        value={contact.phone}
                        onChange={(e) =>
                          setContact({
                            ...contact,
                            phone: formatPhone(e.target.value),
                          })
                        }
                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none ${
                          contact.phone && !isValidPhone(contact.phone)
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        value={contact.email}
                        onChange={(e) =>
                          setContact({
                            ...contact,
                            email: e.target.value.trim(),
                          })
                        }
                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none ${
                          contact.email && !isValidEmail(contact.email)
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="City & state of the property (optional)"
                      value={contact.city}
                      onChange={(e) =>
                        setContact({ ...contact, city: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none"
                    />
                    <textarea
                      rows={3}
                      placeholder="Anything else we should know? (optional)"
                      value={contact.notes}
                      onChange={(e) =>
                        setContact({ ...contact, notes: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none resize-none"
                    />

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentShare}
                          onChange={(e) => setConsentShare(e.target.checked)}
                          className="mt-0.5 w-5 h-5 rounded border-gray-300 cursor-pointer flex-shrink-0"
                          style={{ accentColor: t.accentBg }}
                        />
                        <span className="text-sm text-gray-700">
                          <strong>Required:</strong> {consentText}
                        </span>
                      </label>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={
                        submitting ||
                        !contact.name ||
                        !isValidPhone(contact.phone) ||
                        !isValidEmail(contact.email) ||
                        !consentShare
                      }
                      className="w-full font-bold py-3.5 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={primaryBtnStyle}
                    >
                      {submitting ? "Submitting..." : "Send My Information →"}
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                      {legalFooter}
                    </p>
                  </div>
                </div>
              </>
            )}

            {phase === "done" && (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  We&apos;ve Got Your Info
                </h3>
                <p className="text-gray-600 mb-6">
                  Thank you, {contact.name.split(" ")[0]}. A member of our team
                  will review your answers and reach out within{" "}
                  <strong>1 business day</strong>.
                </p>
                <p className="text-sm text-gray-400">
                  In the meantime, start gathering any photos, medical records,
                  or written communications you have — they&apos;ll help us
                  build your case faster.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CaseCalculator;
