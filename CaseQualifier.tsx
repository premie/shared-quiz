"use client";

import { useState, useCallback, type CSSProperties } from "react";
import {
  QUESTIONS,
  TIER_CONFIG,
  computeFlags,
  computeScore,
  getTier,
} from "./questions";
import { submitLead } from "./submit";
import type {
  Answers,
  CaseQualifierProps,
  CaseQualifierTheme,
  QuestionType,
} from "./types";

const DEFAULT_THEME: Required<CaseQualifierTheme> = {
  headerGradientFrom: "#4A1C6F",
  headerGradientTo: "#2D1045",
  accentBg: "#D4AF37",
  accentBgHover: "#B8960C",
  accentText: "#FFFFFF",
  accentSoftBg: "rgba(212, 175, 55, 0.10)",
};

const DEFAULT_HEADLINE = "Do You Have a Mold Case?";
const DEFAULT_SUBHEAD =
  "Answer a few quick questions to find out if you may have a case. Takes under 2 minutes.";
const DEFAULT_CONSENT =
  "I authorize the firm to share my case information with a qualified mold assessment expert. Without an expert evaluation, we are unable to properly assess your case for potential settlement value.";
const DEFAULT_LEGAL =
  "By submitting, you agree to be contacted by Conduit Law, LLC. This does not create an attorney–client relationship.";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, "").length === 10;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function CaseQualifier({
  config,
  theme,
  headline = DEFAULT_HEADLINE,
  subhead = DEFAULT_SUBHEAD,
  consentText = DEFAULT_CONSENT,
  legalFooter = DEFAULT_LEGAL,
}: CaseQualifierProps) {
  const t = { ...DEFAULT_THEME, ...theme };

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<"quiz" | "contact" | "done">("quiz");
  const [submitting, setSubmitting] = useState(false);
  const [contactData, setContactData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    notes: "",
  });
  const [consentShare, setConsentShare] = useState(false);

  const activeQuestions = QUESTIONS.filter((q) => !q.skip || !q.skip(answers));
  const totalSteps = activeQuestions.length;
  const currentQ = activeQuestions[step];
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;

  const progressPct =
    phase === "quiz"
      ? Math.round((step / totalSteps) * 100)
      : phase === "contact"
        ? 95
        : 100;

  const progressLabel =
    phase === "quiz"
      ? `Question ${step + 1} of ${totalSteps}`
      : phase === "contact"
        ? "Last step!"
        : "Complete";

  const selectOption = useCallback(
    (questionId: string, type: QuestionType, option: string) => {
      setAnswers((prev) => {
        if (type === "multi") {
          const current = (prev[questionId] as string[]) || [];
          const updated = current.includes(option)
            ? current.filter((o) => o !== option)
            : [...current, option];
          return { ...prev, [questionId]: updated };
        }
        return { ...prev, [questionId]: option };
      });

      if (type === "single") {
        setTimeout(() => {
          setStep((prev) => {
            const qs = QUESTIONS.filter(
              (q) => !q.skip || !q.skip({ ...answers, [questionId]: option }),
            );
            if (prev + 1 >= qs.length) {
              setPhase("contact");
              return prev;
            }
            return prev + 1;
          });
        }, 300);
      }
    },
    [answers],
  );

  const isSelected = (option: string): boolean => {
    if (!currentQ) return false;
    if (currentQ.type === "multi") {
      return ((currentAnswer as string[]) || []).includes(option);
    }
    return currentAnswer === option;
  };

  const canAdvance =
    currentQ?.type === "multi"
      ? ((currentAnswer as string[]) || []).length > 0
      : !!currentAnswer;

  const goNext = () => {
    if (step + 1 >= totalSteps) {
      setPhase("contact");
    } else {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (phase === "contact") {
      setPhase("quiz");
      return;
    }
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!contactData.name || !contactData.phone || !contactData.email) return;
    setSubmitting(true);

    const flags = computeFlags(answers);
    const score = computeScore(flags);
    const tier = getTier(flags, score);

    await submitLead({
      config,
      answers,
      contact: contactData,
      consentShare,
      tier,
      score,
      flags,
    });

    setPhase("done");
    setSubmitting(false);
  };

  const flags = computeFlags(answers);
  const score = computeScore(flags);
  const tier = getTier(flags, score);
  const tierConfig = TIER_CONFIG[tier];

  const letters = "ABCDEFGHIJ";

  // Inline styles driven by theme prop — keeps the component independent of
  // each consuming site's Tailwind config.
  const headerStyle: CSSProperties = {
    background: `linear-gradient(to right, ${t.headerGradientFrom}, ${t.headerGradientTo})`,
  };
  const accentBarStyle: CSSProperties = { backgroundColor: t.accentBg };
  const accentTextStyle: CSSProperties = { color: t.accentBg };
  const selectedOptionStyle: CSSProperties = {
    borderColor: t.accentBg,
    backgroundColor: t.accentSoftBg,
  };
  const selectedBadgeStyle: CSSProperties = {
    backgroundColor: t.accentBg,
    color: t.accentText,
    borderColor: t.accentBg,
  };
  const submitBtnStyle: CSSProperties = {
    backgroundColor: t.accentBg,
    color: t.accentText,
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div
            className="rounded-t-2xl px-8 py-7 text-white"
            style={headerStyle}
          >
            <h2 className="font-display font-bold text-2xl mb-1">{headline}</h2>
            <p className="text-sm text-gray-300">{subhead}</p>
            <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ ...accentBarStyle, width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{progressLabel}</p>
          </div>

          {/* Body */}
          <div className="bg-white border border-t-0 border-gray-200 rounded-b-2xl shadow-lg">
            {/* Quiz Phase */}
            {phase === "quiz" && currentQ && (
              <div className="p-8">
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={accentTextStyle}
                >
                  Question {step + 1} of {totalSteps}
                </p>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {currentQ.text}
                </h3>
                {currentQ.sub && (
                  <p className="text-sm text-gray-500 mb-6">{currentQ.sub}</p>
                )}

                <div className="flex flex-col gap-3">
                  {currentQ.options.map((opt, i) => {
                    const selected = isSelected(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() =>
                          selectOption(currentQ.id, currentQ.type, opt)
                        }
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                          selected
                            ? "text-gray-900"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                        style={selected ? selectedOptionStyle : undefined}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                            selected
                              ? ""
                              : "border-2 border-gray-300 text-gray-400"
                          }`}
                          style={selected ? selectedBadgeStyle : undefined}
                        >
                          {letters[i]}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center mt-7">
                  {step > 0 ? (
                    <button
                      onClick={goBack}
                      className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      &larr; Back
                    </button>
                  ) : (
                    <div />
                  )}
                  {currentQ.type === "multi" && (
                    <button
                      onClick={goNext}
                      disabled={!canAdvance}
                      className="font-bold py-3 px-7 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={submitBtnStyle}
                    >
                      {step === totalSteps - 1 ? "Continue →" : "Next →"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Contact Capture Phase */}
            {phase === "contact" && (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">{tierConfig.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {tierConfig.title}
                </h3>
                <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                  {tierConfig.body}
                </p>

                <div className="text-left space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        ["--tw-ring-color" as string]: t.accentSoftBg,
                      }}
                      placeholder="Your full name"
                      value={contactData.name}
                      onChange={(e) =>
                        setContactData({ ...contactData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={14}
                        className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                          contactData.phone && !isValidPhone(contactData.phone)
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            : "border-gray-300"
                        }`}
                        placeholder="(555) 123-4567"
                        value={contactData.phone}
                        onChange={(e) =>
                          setContactData({
                            ...contactData,
                            phone: formatPhone(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                          contactData.email && !isValidEmail(contactData.email)
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            : "border-gray-300"
                        }`}
                        placeholder="you@example.com"
                        value={contactData.email}
                        onChange={(e) =>
                          setContactData({
                            ...contactData,
                            email: e.target.value.trim(),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      City &amp; State of Property
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 transition-all outline-none"
                      placeholder="Denver, CO"
                      value={contactData.city}
                      onChange={(e) =>
                        setContactData({ ...contactData, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Anything else? (optional)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 transition-all outline-none resize-none"
                      placeholder="Any additional details about your situation..."
                      value={contactData.notes}
                      onChange={(e) =>
                        setContactData({
                          ...contactData,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentShare}
                        onChange={(e) => setConsentShare(e.target.checked)}
                        className="mt-0.5 w-5 h-5 rounded border-gray-300 cursor-pointer flex-shrink-0"
                        style={{ accentColor: t.accentBg }}
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                        <strong>Required:</strong> {consentText}
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      !contactData.name ||
                      !isValidPhone(contactData.phone) ||
                      !isValidEmail(contactData.email) ||
                      !consentShare
                    }
                    className="w-full text-center font-bold py-3.5 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={submitBtnStyle}
                  >
                    {submitting
                      ? "Submitting..."
                      : "Submit My Case Information →"}
                  </button>

                  <div className="flex justify-between items-center mt-2">
                    <button
                      onClick={goBack}
                      className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      &larr; Back to questions
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 text-center mt-2">
                    {legalFooter}
                  </p>
                </div>
              </div>
            )}

            {/* Done Phase */}
            {phase === "done" && (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  We&apos;ve Got Your Info
                </h3>
                <p className="text-gray-600 mb-6">
                  Thank you, {contactData.name.split(" ")[0]}. A member of our
                  team will review your answers and reach out within{" "}
                  <strong>1 business day</strong>.
                </p>
                <p className="text-sm text-gray-400">
                  In the meantime, start gathering any photos, medical records,
                  or written communications you have — they&apos;ll help us
                  build your case faster.
                </p>
                <div className="mt-8">
                  <p className="text-sm text-gray-400">
                    We review every submission personally — expect to hear from
                    us soon.
                  </p>
                </div>
              </div>
            )}
          </div>

          {phase === "quiz" && (
            <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> 100% Free
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> No Fee Unless We Win
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> Confidential
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CaseQualifier;
