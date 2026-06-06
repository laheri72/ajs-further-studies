# Dependency Audit

## Core Dependencies (`package.json`)

| Dependency | Purpose | Risk Level | Notes |
| :--- | :--- | :--- | :--- |
| `firebase` (^10.14.1) | Core Backend SDK (Auth, Firestore) | Low | Essential to architecture. Needs monitoring for major v11 breaking changes. |
| `react` / `react-dom` (^18.3.1) | Core UI Framework | Low | Standard industry choice. |
| `react-router-dom` (^6.28.1) | Client-side Routing | Low | Standard routing. |
| `framer-motion` (^11.18.2) | UI Animations | Medium | High bundle size impact. Used primarily for step transitions. Consider evaluating if standard CSS transitions could replace it to reduce payload. |
| `lucide-react` (^0.468.0) | Icon Library | Low | Modern, lightweight SVG icon set. |
| `zod` (^3.24.1) | Schema Validation | Low | Powerful validation, though currently usage might be limited based on the `utils/validation.js` structure. |

## Development Dependencies

- `@vitejs/plugin-react`, `vite`: Fast build tooling. Standard and low risk.
- `vitest`, `@testing-library/react`, `jsdom`: Testing stack. Excellent modern choices replacing Jest.
- `eslint`, `stylelint`: Code quality enforcement.

## Unused / Questionable Dependencies
- **`zod`:** While an excellent library, if `src/utils/validation.js` relies mostly on manual `if/else` statements rather than strict Zod schemas, it might be dead weight. Needs a code review to confirm its depth of integration.

## Technical Debt / Replacement Candidates
- **Bundle Impact:** `framer-motion` is the heaviest UI dependency. If performance becomes an issue on low-end devices in areas with poor connectivity, replacing `framer-motion` with native CSS transitions is the first step.