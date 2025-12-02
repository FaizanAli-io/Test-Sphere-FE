# Optimization Guide — `optimization.md`

> Purpose: give clear, step-by-step instructions (suitable for GitHub Copilot or a human reviewer) to **optimize** the frontend project without changing functionality. Each step is prescriptive, reversible, and includes verification steps to ensure behavior stays identical.

---

## How to use this document

1. Follow steps in order (Preflight → Quick wins → Deeper optimizations → QA → Deployment).
2. Each step includes an `Intent`, `What to change`, `Why`, and `How to verify` section.
3. **Important:** All changes must preserve existing functionality. If a suggested edit might alter behavior, wrap it in tests or feature-flag it and add a clear rollback commit.

---

## PRE-REQUISITES / PRE-FLIGHT

1. **Create a backup branch** (safe staging):

```bash
git checkout -b perf/optimize-preflight
```

2. **Run existing tests & make a smoke build locally**

```bash
# run unit tests
npm test

# build locally
npm run build
# run dev server and perform manual smoke check
npm run start
```

**Intent:** ensure the baseline is passing.
**Verify:** tests pass and app behavior matches production-local.

3. **Add a performance PR checklist** (use as part of PR template)

- ✅ Builds locally: `npm run build` succeeds
- ✅ No console errors in browser
- ✅ Visual regression: critical pages render identical
- ✅ Unit tests pass

---

## QUICK WINS (low risk, high impact)

Follow these first — minimal code changes and easy to revert.

### 1. Fix case-sensitivity file paths

- **Intent:** prevent Linux build failures (Vercel) due to case-only differences.
- **What to change:** Ensure all imports match file/folder names exactly. For case-only changes, use a two-step rename (temp name) so git records it.

**Commands:**

```bash
# example (rename `auth` to `Auth`)
git mv src/components/auth src/components/AuthTemp
git commit -m "temp rename auth -> AuthTemp"

git mv src/components/AuthTemp src/components/Auth
git commit -m "rename AuthTemp -> Auth (case fix)"
```

**Verify:** push and confirm build passes on Vercel.

---

### 2. Replace raw `<img>` with `next/image` for remote images

- **Intent:** enable built-in optimization, lazy-loading, and format negotiation.
- **What to change:** find usages of `<img src="..." />` in pages/components that are public-facing and replace with `next/image`.

**Example:**

```tsx
import Image from "next/image";

// BEFORE
// <img src={user.avatar} alt="avatar" />

// AFTER
<Image src={user.avatar} alt="avatar" width={48} height={48} />;
```

**Why:** automatic lazy loading, smaller network payload.

**Verify:** visually ensure images render identical and check `Network` tab for `webp` or optimized variants.

---

### 3. Add `display: "swap"` to Google fonts

- **Intent:** avoid render-blocking fonts causing FOIT.
- **What to change:** in `app/layout.tsx` (or wherever fonts are imported), set `display: "swap"` for the `Inter` and `Roboto_Mono` declarations.

**Example:**

```ts
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
```

**Verify:** run Lighthouse locally — font blocking metric should improve.

---

### 4. Remove console.\* logs from production

- **Intent:** console statements slow hydration and leak information.
- **What to change:** remove or wrap `console.log/warn/error` behind `if (process.env.NODE_ENV !== 'production')`.

**How to do it safely (automatable):**

- Use codemod or search and replace via `grep`/IDE.

**Verify:** `console` output in production build is minimal; unit tests unaffected.

---

### 5. Tailwind / CSS purge correctness

- **Intent:** remove unused CSS to shrink CSS bundle.
- **What to change:** ensure `tailwind.config.js` `content` includes all `src/**/*.{js,ts,jsx,tsx}` and any template directories.

**Verify:** run production build and inspect CSS size or `Build` output.

---

## CODE-SPLITTING & LAZY LOADING (medium risk)

These reduce initial bundle size. Keep behavior identical.

### 6. Dynamic import large components

- **Intent:** reduce initial JS by deferring heavy components (charts, editors, large forms, maps).
- **What to change:** replace direct imports with `next/dynamic` for heavy components and UI widgets.

**Example conversion:**

```tsx
import dynamic from "next/dynamic";
const BigChart = dynamic(() => import("@/components/BigChart"), {
  loading: () => <div style={{ height: 300 }}>Loading…</div>,
});
```

**Copilot prompt (suggested):**

> "Refactor this file to lazy-load the `BigChart` component using `next/dynamic`. Ensure the placeholder matches current UI height so layout doesn't shift. Keep component props and behavior identical."

**Verify:** run a production build, open the page and confirm the placeholder shows then the component hydrates with exact same functionality.

---

### 7. Disable SSR for purely client components

- **Intent:** avoid server-rendering heavy client-only modules that require browser APIs.
- **What to change:** Add `ssr: false` in dynamic imports when the component uses `window`, `localStorage`, or heavy libs (e.g., monaco/editor, maps).

**Verify:** server-rendered HTML remains unchanged for other parts; client behavior identical.

---

## REACT & STATE OPTIMIZATIONS (medium risk)

### 8. Memoize stable components

- **Intent:** prevent unnecessary re-renders.
- **What to change:** wrap presentational components with `React.memo()` and use `useCallback` / `useMemo` for handlers/derived values passed as props.

**Example:**

```tsx
export default React.memo(function Avatar({ url, size }: {url:string, size:number}) { ... });
```

**Copilot prompt (suggested):**

> "Add React.memo to this presentational component. Ensure prop equality semantics are preserved. If props are objects, suggest using primitives or stable references."

**Verify:** run React dev build with `react-devtools` and confirm reduced renders; unit tests pass.

---

### 9. Avoid lifting large objects into parent state

- **Intent:** reduce re-render breadth
- **What to change:** split combined state into smaller primitives (e.g., separate `email`, `password`, `loading` rather than one `form` object) unless there is a compelling reason.

**Verify:** behavior and controlled inputs remain identical. Run unit tests.

---

## BUNDLE ANALYSIS & TREE-SHAKING

### 10. Analyze bundle

- **Intent:** find the largest modules to target.
- **What to change:** run a bundle analyzer and focus on top offenders. If a package is large, consider dynamic import or replacing it with a lighter alternative.

**Command:**

```bash
# use next-bundle-analyzer or webpack-bundle-analyzer
ANALYZE=true npm run build
# or
npx next build && npx @next/bundle-analyzer
```

**Verify:** produce report, create issues for top 3 largest dependencies.

---

## IMAGE & ASSET STRATEGIES

### 11. Use remotePatterns for Next/Image (already present)

- **Intent:** ensure external hosts allowed for `next/image`.
- **What to change:** keep `next.config.js` `images.remotePatterns` and add any hosting domains.

**Verify:** test remote images load via `next/image`.

### 12. Optimize static assets and favicon

- Run lossless compression on PNG/SVG/JPEG.
- Prefer SVG for icons where possible.

**Tools:** `svgo`, `pngquant`.

---

## NETWORK, CACHING & HTTP

### 13. Response caching for APIs and static pages

- **Intent:** reduce backend latency and bandwidth.
- **What to change:** set appropriate Cache-Control headers and leverage ISR for pages that can be stale for short durations.

**Example:**

```ts
export const revalidate = 60; // in Next.js page
```

**Verify:** responses include `cache-control` and repeated requests are faster.

---

## VERCEL & DEPLOYMENT SETTINGS

### 14. Ensure Vercel builds match local environment

- **Intent:** prevent surprises (case-sensitivity, env vars).
- **What to change:** in Vercel project settings set `NODE_ENV=production`, add environment variables, and enable build cache.

**Verify:** redeploy and confirm build logs show the expected Next.js version and no case errors.

### 15. Use Vercel Analytics and Edge caching

- **Intent:** measure real-user metrics and cache static content at the edge.
- **What to change:** enable Vercel analytics for RUM and monitor TTFB.

**Verify:** check Vercel dashboard metrics.

---

## COPILOT/AI ASSISTANT WORKFLOW

This repository will be optimized by a sequence of small, reviewable PRs. Use Copilot (or GitHub Copilot + PR reviews) to implement the edits while ensuring no functionality change.

### How to prompt Copilot / AI to make changes safely

For each file or feature you want Copilot to refactor, use a prompt template like this:

```
/* COPILOT TASK: Performance-safe refactor
 - Goal: <short description e.g. convert to dynamic import>
 - Constraints: Do not change behavior or public API. Keep prop names and signatures identical.
 - Tests: Add/Update unit tests if necessary to prove no behavior change.
 - Verification: explain manual steps to validate.
*/
```

**Examples:**

- Dynamic import example prompt:

```
/* COPILOT TASK: convert large component to dynamic import
 Goal: Replace direct import of `BigChart` with next/dynamic lazy load.
 Constraints: Keep props and behavior identical, show a loading placeholder the same height as the chart.
 Tests: none required but describe manual visual check.
*/
```

- Memoization example prompt:

```
/* COPILOT TASK: Add React.memo to presentational component
 Goal: Wrap default export with React.memo()
 Constraints: Do not change prop types or default export name.
 Tests: None required, but add note to QA re-render count.
*/
```

---

## QA & VERIFICATION (non-negotiable)

Every PR MUST include:

1. **Local build success:** `npm run build` passes.
2. **Unit tests:** `npm test` passes.
3. **E2E or smoke test:** load these pages manually and verify behavior:
   - `/` (Auth page)
   - an authenticated dashboard page
   - pages with large assets (charts, images)

4. **Visual diff:** run a quick screenshot comparison for critical pages (Home, Login, Dashboard) between `main` and the PR branch.
5. **Bundle report:** attach a short note in the PR describing before/after sizes for top 5 bundles.
6. **Rollback plan:** include exact revert command in PR description.

---

## PR SIZING & ORDER (recommended sequence)

1. Preflight checks + case-sensitivity fixes. (small)
2. Fonts `display: swap` + console removal. (small)
3. Replace critical `<img>` with `next/image`. (small-medium)
4. Tailwind purge and CSS shrink. (small)
5. Dynamic imports of heavy components. (medium)
6. Memoization & state-splitting. (medium)
7. Bundle analysis & dependency replacements. (medium-large)
8. API caching and ISR changes. (medium)

Prefer small scoped PRs — easier to review and revert.

---

## Safety net / Rollback

If a PR introduces a regression:

```bash
# revert a specific PR commit
git revert <commit-sha>
# or hard reset to origin/main
git checkout main
git fetch origin
git reset --hard origin/main
```

---

## Appendix: Useful commands

```bash
# build and analyze
ANALYZE=true npm run build

# run tests
npm test

# run production server locally
npm run build && npm run start

# list large node modules
npx depcheck

# run svgo on svg files
npx svgo -f src/icons -o src/icons
```

---

If you want, I can:

- produce a checklist-style GitHub PR template that enforces these checks, or
- generate a series of small PR patches (diffs) for the highest-impact quick wins (case-fix, fonts swap, dynamic import of Auth) and include unit test adjustments.

End of `optimization.md`.
