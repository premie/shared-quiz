"use client";

import { useEffect, useRef, useState } from "react";
import type { Answers, QField, QualifierProps } from "./engine-types";

function parseMoney(v: string): number {
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}
function money(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

export function Qualifier({ config, theme }: QualifierProps) {
  const { questions, classify, intro, brand, fallbackPhone, consentText, legalFooter } = config;
  const bodyText = theme.bodyText ?? "#C2CCDA";
  const mutedText = theme.mutedText ?? "#9FB0C9";

  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({});
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const started = useRef(false);

  // Questions that apply given the answers so far (supports skip()).
  const active = questions.filter((q) => !q.skip?.(a));
  const total = active.length;
  const atResult = step >= total;
  const q = active[Math.min(step, total - 1)];

  const set = (k: string, v: string | string[]) => setA((p) => ({ ...p, [k]: v }));
  const next = () => setStep((s) => Math.min(s + 1, total));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const pick = (k: string, v: string) => {
    set(k, v);
    setTimeout(() => setStep((s) => Math.min(s + 1, total)), 170);
  };
  const toggle = (k: string, v: string) =>
    setA((p) => {
      const cur = Array.isArray(p[k]) ? (p[k] as string[]) : [];
      return { ...p, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
    });

  const result = classify(a);
  const name = ((a.name as string) || "").trim();
  const firstName = name.split(" ")[0];

  const str = (k: string) => ((a[k] as string) || "").trim();
  const fieldsReady = (fields?: QField[]) =>
    (fields ?? []).every((f) => !f.required || str(f.key) !== "");
  const contactReady = name !== "" && (str("phone") !== "" || str("email") !== "");
  const canContinue = !q
    ? false
    : q.type === "contact"
    ? contactReady
    : q.type === "fields"
    ? fieldsReady(q.fields)
    : true;

  function buildDescription(): string {
    return active
      .filter((x) => x.type !== "contact")
      .map((x) => {
        if (x.type === "fields") {
          const parts = (x.fields ?? [])
            .map((f) => (str(f.key) ? `${f.label ?? f.placeholder ?? f.key}: ${str(f.key)}` : null))
            .filter(Boolean);
          return parts.length ? `${x.heading}\n  ${parts.join("\n  ")}` : null;
        }
        const v = a[x.id];
        const val = Array.isArray(v) ? v.join(", ") : v;
        return val ? `${x.heading} ${val}` : null;
      })
      .filter(Boolean)
      .join("\n");
  }

  async function submit() {
    setSubmitting(true);
    setSubmitFailed(false);
    config.onEvent?.("generate_lead", {
      practice_area: config.practiceArea,
      result_type: result.type,
      value: result.gap || undefined,
    });
    const payload = {
      ...(config.getAttribution?.() ?? {}),
      name,
      phone: str("phone"),
      email: str("email"),
      description: buildDescription(),
      practice_area: config.practiceArea,
      source: config.source,
      campaign: config.campaign,
      conversion_page: typeof window !== "undefined" ? window.location.pathname : undefined,
      result_type: result.type,
      qualified: result.qualifies,
      estimated_gap: result.gap || undefined,
      consent_to_share: consentText ? consent : undefined,
      quiz_answers: a,
    };
    try {
      const r = await fetch(config.submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) setSubmitFailed(true);
    } catch {
      setSubmitFailed(true);
    } finally {
      setSubmitting(false);
      setStep(total);
    }
  }

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      config.onEvent?.("qualifier_start", { source: config.source });
    }
    if (step > 0 && step < total) {
      config.onEvent?.("qualifier_step_complete", { step, source: config.source });
    }
    if (atResult) {
      config.onEvent?.("qualifier_result", {
        result_type: result.type,
        qualified: result.qualifies,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, total]);

  const progressPct = atResult ? 100 : Math.round(((step + 1) / total) * 100);
  const stepNum = Math.min(step + 1, total);

  // ---- shared styles ----
  const inputCls =
    "w-full font-sans text-[1.05rem] text-white bg-white/[0.06] rounded-xl px-[18px] py-4 outline-none placeholder:text-[#6B7790] transition-colors";
  const inputStyle = { border: `1px solid ${theme.accent}55` } as const;
  const eyebrowCls = "text-[0.78rem] tracking-[0.18em] uppercase font-bold";
  const h2Cls = "font-display font-normal mt-3";
  const h2Style = { fontSize: "clamp(1.6rem,3.6vw,2.3rem)", lineHeight: 1.12 } as const;
  const optionStyle = (sel: boolean) =>
    ({
      border: `1px solid ${sel ? theme.accent : "rgba(255,255,255,0.12)"}`,
      background: sel ? theme.accentSoft : "rgba(255,255,255,0.05)",
    } as const);
  const accentBtn = {
    background: theme.accent,
    color: theme.accentText,
    boxShadow: `0 3px 0 ${theme.accentHover}`,
  } as const;

  function FieldInput({ f }: { f: QField }) {
    if (f.kind === "select") {
      return (
        <select value={str(f.key)} onChange={(e) => set(f.key, e.target.value)} className={inputCls + " appearance-none cursor-pointer"} style={inputStyle}>
          <option value="" className="text-navy-900">{f.placeholder ?? "Select…"}</option>
          {(f.options ?? []).map((o) => (
            <option key={o} value={o} className="text-navy-900">{o}</option>
          ))}
        </select>
      );
    }
    if (f.kind === "money") {
      return (
        <label className="flex items-center bg-white/[0.06] rounded-xl px-[18px] transition-colors" style={inputStyle}>
          <span style={{ color: mutedText }} className="text-[1.05rem]">$</span>
          <input value={str(f.key)} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} inputMode="numeric" className="flex-1 font-sans text-[1.05rem] text-white bg-transparent border-0 py-4 px-2.5 outline-none placeholder:text-[#6B7790]" />
        </label>
      );
    }
    const inputMode = f.kind === "number" ? "numeric" : f.kind === "tel" ? "tel" : f.kind === "email" ? "email" : undefined;
    return (
      <input value={str(f.key)} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} inputMode={inputMode} className={inputCls} style={inputStyle} />
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-white" style={{ background: `radial-gradient(120% 90% at 50% -10%, ${theme.pageGradFrom} 0%, ${theme.pageGradTo} 60%)` }}>
      {/* header */}
      <header className="flex items-center justify-between w-full max-w-[760px] mx-auto px-6 py-[18px]">
        <a href={brand.homeHref ?? "/"} className="flex items-center gap-2.5 no-underline text-white">
          {brand.crown}
          <span className="font-display text-[1.05rem] tracking-[0.06em]">{brand.name}</span>
        </a>
        <a href={brand.homeHref ?? "/"} className="no-underline text-[0.9rem] font-medium transition-colors hover:text-white" style={{ color: mutedText }}>
          {brand.exitLabel ?? "Exit"}
        </a>
      </header>

      {/* progress */}
      {!atResult && (
        <div className="w-full max-w-[760px] mx-auto px-6">
          <div className="flex justify-between items-center text-[0.78rem] tracking-[0.04em] mb-2.5" style={{ color: mutedText }}>
            <span>Step {stepNum} of {total}</span>
            <span>{progressPct}% complete</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg,${theme.accentHover},${theme.accent})` }} />
          </div>
        </div>
      )}

      {/* body */}
      <main className="flex-1 flex items-center justify-center px-6 pt-9 pb-14">
        <div className="w-full max-w-[640px]">
          {!atResult && q && (
            <div>
              {/* intro sits at the top of the first question — no welcome gate */}
              {step === 0 && (
                <div className="text-center mb-8">
                  {intro.eyebrow && (
                    <div className={eyebrowCls} style={{ color: theme.accent }}>{intro.eyebrow}</div>
                  )}
                  <h1 className="font-display font-normal mt-2" style={{ fontSize: "clamp(1.7rem,4vw,2.5rem)", lineHeight: 1.1 }}>
                    {intro.headline}
                  </h1>
                  <p className="text-[1.05rem] leading-[1.6] mt-3.5 mx-auto max-w-[44ch]" style={{ color: bodyText }}>
                    {intro.subhead}
                  </p>
                  {intro.badges && (
                    <div className="flex flex-wrap gap-x-[22px] gap-y-3 justify-center mt-5 text-[0.9rem]" style={{ color: mutedText }}>
                      {intro.badges.map((b) => <span key={b}>✓ {b}</span>)}
                    </div>
                  )}
                </div>
              )}

              <div className={eyebrowCls} style={{ color: theme.accent }}>{q.eyebrow}</div>
              <h2 className={h2Cls} style={h2Style}>{q.heading}</h2>
              {q.sub && <p className="mt-2.5 text-base" style={{ color: mutedText }}>{q.sub}</p>}

              {q.type === "single" && (
                <div className="flex flex-col gap-3 mt-6">
                  {(q.options ?? []).map((opt) => (
                    <button key={opt} type="button" onClick={() => pick(q.id, opt)} className="w-full text-left cursor-pointer font-sans text-[1.02rem] font-semibold text-white px-5 py-[18px] rounded-xl transition-all" style={optionStyle(a[q.id] === opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "multi" && (
                <div className="flex flex-col gap-3 mt-6">
                  {(q.options ?? []).map((opt) => {
                    const sel = Array.isArray(a[q.id]) && (a[q.id] as string[]).includes(opt);
                    return (
                      <button key={opt} type="button" onClick={() => toggle(q.id, opt)} className="w-full text-left cursor-pointer font-sans text-[1.02rem] font-semibold text-white px-5 py-[18px] rounded-xl transition-all flex items-center gap-3.5" style={optionStyle(sel)}>
                        <span className="flex-none w-6 h-6 rounded-[7px] inline-flex items-center justify-center text-[0.9rem] font-extrabold" style={{ color: theme.accentText, background: sel ? theme.accent : "transparent", border: `1px solid ${sel ? theme.accent : "rgba(255,255,255,0.3)"}` }}>
                          {sel ? "✓" : ""}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "fields" && (
                <div className="grid gap-3.5 mt-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
                  {(q.fields ?? []).map((f) => (
                    <div key={f.key} style={{ gridColumn: f.half ? "auto" : "1 / -1" }}>
                      <FieldInput f={f} />
                    </div>
                  ))}
                </div>
              )}

              {q.type === "contact" && (
                <div className="mt-6">
                  <div className="flex flex-col gap-3.5">
                    <input value={str("name")} onChange={(e) => set("name", e.target.value)} placeholder="Full name" className={inputCls} style={inputStyle} />
                    <input value={str("phone")} onChange={(e) => set("phone", e.target.value)} placeholder="Phone number" inputMode="tel" className={inputCls} style={inputStyle} />
                    <input value={str("email")} onChange={(e) => set("email", e.target.value)} placeholder="Email address" inputMode="email" className={inputCls} style={inputStyle} />
                  </div>
                  {consentText && (
                    <label className="flex items-start gap-2.5 mt-4 cursor-pointer text-[0.85rem] leading-[1.5]" style={{ color: mutedText }}>
                      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                      <span>{consentText}</span>
                    </label>
                  )}
                  {legalFooter && <p className="text-[0.8rem] leading-[1.55] mt-4" style={{ color: "#6B7790" }}>{legalFooter}</p>}
                </div>
              )}
            </div>
          )}

          {/* RESULT */}
          {atResult && (
            <div className="text-center">
              <h1 className="font-display font-normal" style={{ fontSize: "clamp(1.8rem,4.4vw,2.7rem)", lineHeight: 1.1 }}>
                {submitFailed
                  ? `Almost there${firstName ? `, ${firstName}` : ""} — let’s finish by phone.`
                  : `Thanks${firstName ? `, ${firstName}` : ""} — ${result.qualifies ? "your claim looks worth a closer look." : "we’ve got your details."}`}
              </h1>
              <p className="text-[1.1rem] leading-[1.6] mt-4 mx-auto max-w-[44ch]" style={{ color: bodyText }}>
                {submitFailed
                  ? "We couldn’t submit your details automatically — please call so we don’t miss your claim. Your assessment is below."
                  : result.qualifies
                  ? "We’ve received your details and a member of our team will reach out within one business day."
                  : "A team member will review your details and follow up — and if it’s a better fit elsewhere, we’ll point you the right way."}
              </p>
              {submitFailed && fallbackPhone && (
                <a href={fallbackPhone.href} className="inline-block mt-4 font-bold rounded-lg px-6 py-3 no-underline transition-opacity hover:opacity-90" style={accentBtn}>
                  Call {fallbackPhone.display}
                </a>
              )}

              <div className="rounded-2xl p-[26px] mt-7 text-left" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${theme.accent}4D` }}>
                <div className="text-[0.74rem] tracking-[0.18em] uppercase font-bold" style={{ color: mutedText }}>Preliminary assessment</div>
                <div className="inline-flex items-center gap-2 mt-3.5 text-[0.98rem] font-bold rounded-full px-4 py-2" style={{ color: theme.accent, background: theme.accentSoft, border: `1px solid ${theme.accent}66` }}>
                  {result.type}
                </div>
                <p className="leading-[1.6] mt-4 text-[1.02rem]" style={{ color: bodyText }}>{result.summary}</p>
                {result.note && <p className="leading-[1.55] mt-3 text-[0.92rem]" style={{ color: mutedText }}>{result.note}</p>}

                {result.qualifies && result.gap != null && result.gap > 0 && (
                  <div className="flex justify-between items-center rounded-xl px-[18px] py-4 mt-[18px]" style={{ background: theme.accentSoft }}>
                    <span className="font-semibold" style={{ color: theme.accent }}>{result.gapLabel ?? "Estimated value"}</span>
                    <span className="font-display text-[1.7rem]" style={{ color: theme.accent }}>{money(result.gap)}</span>
                  </div>
                )}

                {result.nextSteps && result.nextSteps.length > 0 && (
                  <div className="mt-5 pt-[18px]" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="font-bold text-white mb-3 text-[0.98rem]">What happens next</div>
                    {result.nextSteps.map((text, i) => (
                      <div key={i} className="flex gap-3 items-start mb-2.5">
                        <span className="flex-none font-extrabold" style={{ color: theme.accent }}>{i + 1}</span>
                        <span className="text-[0.98rem] leading-[1.5]" style={{ color: "#AEBBCC" }}>{text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <a href={brand.homeHref ?? "/"} className="inline-block mt-[26px] no-underline font-semibold transition-colors hover:text-white" style={{ color: mutedText }}>
                ← Back to home
              </a>
            </div>
          )}

          {/* nav footer */}
          {!atResult && (
            <div className={`flex items-center gap-4 mt-[34px] ${step > 0 ? "justify-between" : "justify-end"}`}>
              {step > 0 && (
                <button type="button" onClick={back} className="bg-transparent border-0 cursor-pointer font-semibold text-base py-2.5 px-1 transition-colors hover:text-white" style={{ color: mutedText }}>
                  ← Back
                </button>
              )}
              <button
                type="button"
                disabled={!canContinue || submitting}
                onClick={() => (step === total - 1 ? submit() : next())}
                className="font-bold text-[1.05rem] rounded-[9px] cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ ...accentBtn, padding: "15px 32px" }}
              >
                {step === total - 1 ? (submitting ? "Sending…" : "Get my assessment →") : "Continue →"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Qualifier;
