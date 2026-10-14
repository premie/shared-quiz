"use client";

import { useEffect, useRef } from "react";

// Minimal Cloudflare Turnstile widget for the shared quiz. Opt-in: a site passes
// `turnstileSiteKey` in CaseQualifierConfig and the form posts to its own server
// relay, which verifies the token (a browser-to-receiver post can't be checked).
// Tokens are single-use: remount this component (change its `key`) to get a
// fresh one after a failed submit.

// Accessed through a local cast rather than `declare global`, so this file can
// coexist with a host site's own Window.turnstile typing.
type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
const turnstileApi = (): TurnstileApi | undefined =>
  typeof window === "undefined"
    ? undefined
    : (window as unknown as { turnstile?: TurnstileApi }).turnstile;

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (turnstileApi()) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("Turnstile script failed to load"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export function TurnstileField({
  siteKey,
  onToken,
  action,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  action?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;
    loadScript()
      .then(() => {
        const api = turnstileApi();
        if (cancelled || !ref.current || !api) return;
        widgetId = api.render(ref.current, {
          sitekey: siteKey,
          appearance: "interaction-only",
          action,
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => onTokenRef.current(""),
        });
      })
      // No widget = no token; the relay's captcha policy decides what that
      // means. Never block the visitor from submitting.
      .catch(() => onTokenRef.current(""));
    return () => {
      cancelled = true;
      const api = turnstileApi();
      if (widgetId && api) {
        try {
          api.remove(widgetId);
        } catch {
          /* already gone */
        }
      }
    };
  }, [siteKey, action]);

  return <div ref={ref} className="flex justify-center my-2" />;
}
