# shared-quiz

Mold case qualifier quiz, shared between [mold-law-king](https://moldlawking.com)
and [conduit.law](https://conduit.law). Single source of truth: edit here once,
bump the submodule SHA in each consuming site to ship changes.

## Files

- `CaseQualifier.tsx` — the React component (client). Theme + webhook URLs are
  passed as props so each site brands and routes leads independently.
- `questions.ts` — `QUESTIONS` array, flag/score/tier logic.
- `submit.ts` — `submitLead()`: posts to Make.com (await) + os-conduit
  (`navigator.sendBeacon`).
- `types.ts` — shared TypeScript types.
- `index.ts` — barrel export.

## Usage

```tsx
import { CaseQualifier } from "shared-quiz";

<CaseQualifier
  config={{
    formWebhookUrl: process.env.NEXT_PUBLIC_MAKE_QUIZ_WEBHOOK!,
    conduitWebhookUrl: "https://os-conduit-production.up.railway.app/webhooks/inbound?source=conduit&event_type=lead.created",
    source: "conduit",          // "mlk" | "conduit"
    campaign: "conduit-mold-qualifier",
  }}
  theme={{
    headerGradientFrom: "#046BD2",
    headerGradientTo: "#034F9E",
    accentBg: "#046BD2",
    accentBgHover: "#045CB4",
    accentText: "#FFFFFF",
    accentSoftBg: "rgba(4, 107, 210, 0.10)",
  }}
  legalFooter="By submitting, you agree to be contacted by Conduit Law, LLC."
/>
```

Defaults match Mold Law King branding (purple header, gold accent).

## Consuming as a git submodule

```bash
# Add to a site repo
git submodule add git@github.com:premie/shared-quiz.git path/to/shared-quiz

# Bump to latest after a change
git submodule update --remote path/to/shared-quiz
git add path/to/shared-quiz && git commit -m "bump shared-quiz"
```

In `next.config.{ts,js}` add:
```js
transpilePackages: ["shared-quiz"],
```

In `tailwind.config.ts` `content` array, add the submodule path:
```js
"./path/to/shared-quiz/**/*.{ts,tsx}",
```

## Dev workflow

1. Make changes here, commit, push.
2. In each consuming site: `git submodule update --remote && git commit && push`.
3. Vercel auto-deploys both sites.
