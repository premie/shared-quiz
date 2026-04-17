import type { Answers, Question, Tier } from "./types";

export const QUESTIONS: Question[] = [
  {
    id: "property_type",
    type: "single",
    text: "Where were you exposed to mold?",
    sub: "Select the type of property where the mold exposure occurred.",
    options: [
      "Apartment or rental home",
      "Home I own",
      "Workplace or office",
      "Hotel or vacation rental",
      "HOA-managed property",
      "Other",
    ],
    flag: (v) => {
      if (v === "Home I own") return "HOMEOWNER_NO_LANDLORD";
      if (v === "HOA-managed property") return "HOA_DISPUTE";
      if (v === "Other") return "UNUSUAL_PROPERTY_TYPE";
      return null;
    },
  },
  {
    id: "state",
    type: "single",
    text: "Which state is the property located in?",
    sub: "We handle mold cases in Arizona, California, Colorado, and Kansas.",
    options: ["Arizona", "California", "Colorado", "Kansas", "Other state"],
    flag: (v) => (v === "Other state" ? "OUT_OF_STATE" : null),
  },
  {
    id: "noticed_when",
    type: "single",
    text: "When did you first suspect mold was affecting your health?",
    sub: "An approximate timeframe is fine — this helps us understand your situation.",
    options: [
      "Within the last few months",
      "About 6 months to a year ago",
      "About 1 – 2 years ago",
      "More than 2 years ago",
      "I'm not sure",
    ],
    flag: (v) => {
      if (v === "More than 2 years ago") return "SOL_LIKELY_EXPIRED";
      return null;
    },
  },
  {
    id: "injury",
    type: "single",
    text: "Have you or someone in your household experienced health issues from the mold?",
    sub: "Examples: respiratory problems, skin rashes, chronic cough, headaches, fatigue, asthma flares.",
    options: [
      "Yes — I personally have symptoms",
      "Yes — a family member or co-occupant",
      "Both — multiple people affected",
      "No health symptoms, property damage only",
    ],
    flag: (v) =>
      v === "No health symptoms, property damage only"
        ? "NO_PERSONAL_INJURY"
        : null,
  },
  {
    id: "doctor",
    type: "single",
    text: "Have you seen a doctor for these symptoms?",
    sub: "Medical documentation significantly strengthens a mold case.",
    options: [
      "Yes — I have medical records",
      "Yes — but I don't have records yet",
      "No — I haven't seen a doctor",
    ],
    flag: (v) =>
      v === "No — I haven't seen a doctor" ? "NO_MEDICAL_TREATMENT" : null,
    skip: (a) => a.injury === "No health symptoms, property damage only",
  },
  {
    id: "notified",
    type: "single",
    text: "Did you notify the responsible party about the mold?",
    sub: "Written notice (text, email, letter) is much stronger than a verbal complaint.",
    options: [
      "Yes — in writing (text, email, or letter)",
      "Yes — verbally only",
      "No — not yet",
      "No — I moved out before notifying them",
    ],
    flag: (v) => {
      if (v === "No — not yet" || v === "No — I moved out before notifying them")
        return "NO_NOTICE";
      if (v === "Yes — verbally only") return "VERBAL_NOTICE_ONLY";
      return null;
    },
  },
  {
    id: "response",
    type: "single",
    text: "How did they respond?",
    sub: "Inaction or denial by the responsible party is a key element of your claim.",
    options: [
      "They ignored me or didn't respond",
      "They acknowledged it but took no action",
      "They attempted a fix but mold returned",
      "They denied there was a problem",
      "They remediated it fully — problem resolved",
      "I haven't notified them yet",
    ],
    skip: (a) =>
      a.notified === "No — not yet" ||
      a.notified === "No — I moved out before notifying them",
    flag: (v) =>
      v === "They remediated it fully — problem resolved"
        ? "FULLY_REMEDIATED"
        : null,
  },
  {
    id: "unit_access",
    type: "single",
    text: "Do you still have access to the property where the mold is?",
    sub: "Our mold expert may need to inspect the property to evaluate your case and document conditions.",
    options: [
      "Yes — I still live or work there",
      "Yes — I moved out but can still access it",
      "No — but I have a mold inspection report",
      "No — I no longer have access",
      "Not sure",
    ],
    flag: (v) => (v === "No — I no longer have access" ? "NO_UNIT_ACCESS" : null),
  },
  {
    id: "evidence",
    type: "multi",
    text: "What evidence do you currently have?",
    sub: "Select all that apply. Don't worry if you don't have everything — this helps us prepare.",
    options: [
      "Photos or videos of mold",
      "Written complaints (texts, emails)",
      "Medical records or doctor's notes",
      "Mold inspection or test results",
      "Witness statements",
      "Nothing yet",
    ],
    flag: (v) =>
      Array.isArray(v) && v.length === 1 && v[0] === "Nothing yet"
        ? "NO_EVIDENCE"
        : null,
  },
];

const FLAG_WEIGHTS: Record<string, number> = {
  HOMEOWNER_NO_LANDLORD: 10,
  OUT_OF_STATE: 5,
  HOA_DISPUTE: 5,
  SOL_LIKELY_EXPIRED: 4,
  NO_PERSONAL_INJURY: 3,
  SOL_BORDERLINE: 2,
  FULLY_REMEDIATED: 2,
  NO_MEDICAL_TREATMENT: 1,
  NO_NOTICE: 1,
  VERBAL_NOTICE_ONLY: 1,
  NO_UNIT_ACCESS: 2,
  NO_EVIDENCE: 1,
  UNUSUAL_PROPERTY_TYPE: 1,
};

export function computeFlags(answers: Answers): string[] {
  return QUESTIONS.reduce<string[]>((acc, q) => {
    if (!q.flag) return acc;
    const val = answers[q.id];
    if (val === undefined || val === null) return acc;
    const f = q.flag(val);
    if (f) acc.push(f);
    return acc;
  }, []);
}

export function computeScore(flags: string[]): number {
  const totalWeight = flags.reduce(
    (sum, f) => sum + (FLAG_WEIGHTS[f] || 1),
    0
  );
  return Math.max(0, 10 - totalWeight);
}

export function getTier(flags: string[], score: number): Tier {
  if (
    flags.includes("HOMEOWNER_NO_LANDLORD") ||
    flags.includes("OUT_OF_STATE") ||
    flags.includes("HOA_DISPUTE")
  )
    return "unlikely";
  if (score >= 7) return "strong";
  if (score >= 4) return "promising";
  return "unlikely";
}

export const TIER_CONFIG: Record<
  Tier,
  { icon: string; title: string; body: string }
> = {
  strong: {
    icon: "✅",
    title: "Your Case Looks Strong",
    body: "Based on your answers, you appear to have a solid mold injury claim. Enter your contact info and an attorney from our team will reach out within 1 business day.",
  },
  promising: {
    icon: "👍",
    title: "Let's Talk About Your Case",
    body: "Based on your answers, there are some factors we'd like to discuss with you. Enter your info and we'll follow up to evaluate your situation in more detail.",
  },
  unlikely: {
    icon: "📋",
    title: "We May Not Be the Right Fit",
    body: "Based on your answers, this may fall outside our current practice area. Enter your info anyway — we review every submission and can point you to the right resources if we can't help directly.",
  },
};

export const STATE_CODES: Record<string, string> = {
  Arizona: "AZ",
  California: "CA",
  Colorado: "CO",
  Kansas: "KS",
};
