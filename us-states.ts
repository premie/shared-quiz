// Canonical U.S. jurisdiction list (50 states + DC), shared by the mold
// qualifier and the settlement calculator.
//
// Why this exists: intake used to offer only the four states we practice in
// (AZ/CA/CO/KS) plus a single "Other" bucket, so out-of-area prospects either
// dead-ended or landed with no usable state. That made referring them out
// impossible. We now list every state and capture the real one on every lead,
// even when it's outside our footprint, so those cases can be referred to local
// counsel (or associated in on a strong case).

export interface UsState {
  name: string;
  abbrev: string;
}

export const US_STATES: UsState[] = [
  { name: "Alabama", abbrev: "AL" },
  { name: "Alaska", abbrev: "AK" },
  { name: "Arizona", abbrev: "AZ" },
  { name: "Arkansas", abbrev: "AR" },
  { name: "California", abbrev: "CA" },
  { name: "Colorado", abbrev: "CO" },
  { name: "Connecticut", abbrev: "CT" },
  { name: "Delaware", abbrev: "DE" },
  { name: "District of Columbia", abbrev: "DC" },
  { name: "Florida", abbrev: "FL" },
  { name: "Georgia", abbrev: "GA" },
  { name: "Hawaii", abbrev: "HI" },
  { name: "Idaho", abbrev: "ID" },
  { name: "Illinois", abbrev: "IL" },
  { name: "Indiana", abbrev: "IN" },
  { name: "Iowa", abbrev: "IA" },
  { name: "Kansas", abbrev: "KS" },
  { name: "Kentucky", abbrev: "KY" },
  { name: "Louisiana", abbrev: "LA" },
  { name: "Maine", abbrev: "ME" },
  { name: "Maryland", abbrev: "MD" },
  { name: "Massachusetts", abbrev: "MA" },
  { name: "Michigan", abbrev: "MI" },
  { name: "Minnesota", abbrev: "MN" },
  { name: "Mississippi", abbrev: "MS" },
  { name: "Missouri", abbrev: "MO" },
  { name: "Montana", abbrev: "MT" },
  { name: "Nebraska", abbrev: "NE" },
  { name: "Nevada", abbrev: "NV" },
  { name: "New Hampshire", abbrev: "NH" },
  { name: "New Jersey", abbrev: "NJ" },
  { name: "New Mexico", abbrev: "NM" },
  { name: "New York", abbrev: "NY" },
  { name: "North Carolina", abbrev: "NC" },
  { name: "North Dakota", abbrev: "ND" },
  { name: "Ohio", abbrev: "OH" },
  { name: "Oklahoma", abbrev: "OK" },
  { name: "Oregon", abbrev: "OR" },
  { name: "Pennsylvania", abbrev: "PA" },
  { name: "Rhode Island", abbrev: "RI" },
  { name: "South Carolina", abbrev: "SC" },
  { name: "South Dakota", abbrev: "SD" },
  { name: "Tennessee", abbrev: "TN" },
  { name: "Texas", abbrev: "TX" },
  { name: "Utah", abbrev: "UT" },
  { name: "Vermont", abbrev: "VT" },
  { name: "Virginia", abbrev: "VA" },
  { name: "Washington", abbrev: "WA" },
  { name: "West Virginia", abbrev: "WV" },
  { name: "Wisconsin", abbrev: "WI" },
  { name: "Wyoming", abbrev: "WY" },
];

/** Full state name -> USPS abbreviation. Lets submit payloads carry a real,
 *  structured state code for every lead instead of null for out-of-area ones. */
export const STATE_ABBREV: Record<string, string> = US_STATES.reduce(
  (acc, s) => {
    acc[s.name] = s.abbrev;
    return acc;
  },
  {} as Record<string, string>
);

/** The full state names we offer as intake options, in list order. */
export const US_STATE_NAMES: string[] = US_STATES.map((s) => s.name);

/** States where we're licensed and take mold cases directly. Everything else is
 *  captured as an out-of-coverage referral lead (still worth reviewing — a
 *  strong case can justify associating local counsel / pro hac vice). */
export const COVERED_STATES = [
  "Arizona",
  "California",
  "Colorado",
  "Kansas",
] as const;

export function isCoveredState(name: string | null | undefined): boolean {
  return !!name && (COVERED_STATES as readonly string[]).includes(name);
}
