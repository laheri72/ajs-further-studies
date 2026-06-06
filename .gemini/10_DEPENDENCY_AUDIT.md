# Dependency Audit

## Core Dependencies (`package.json`)

| Dependency | Purpose | Risk Level | Notes |
| :--- | :--- | :--- | :--- |
| `firebase` (^10.14.1) | Core Backend SDK (Auth, Firestore) | Low | Essential to architecture. Needs monitoring for major v11 breaking changes. |
| `react` / `react-dom` (^18.3.1) | Core UI Framework | Low | Standard industry choice. |
| `react-router-dom` (^6.28.1) | Client-side Routing | Low | Standard routing. |
| `framer-motion` (^11.18.2) | UI Animations | Medium | High bundle size impact. Used primarily for step transitions. Consider evaluating if standard CSS transitions could replace it to reduce payload. |
| `lucide-react` (^0.468.0) | Icon Library | Low | Modern, lightweight SVG icon set. |
| `zod` (^3.24.1) | Schema Validation | Low | Actively used in `src/utils/validation.js` for strict schema definitions and custom error reporting. Essential for data integrity. |

## Development Dependencies

- `@vitejs/plugin-react`, `vite`: Fast build tooling. Standard and low risk.
- `vitest`, `@testing-library/react`, `jsdom`: Testing stack. Excellent modern choices replacing Jest.
- `eslint`, `stylelint`: Code quality enforcement.

## Unused / Questionable Dependencies
- **None found.** A V1.1 audit confirmed that all core dependencies, including `zod`, are actively utilized within the application's critical paths.

## Technical Debt / Replacement Candidates
- **Bundle Impact:** `framer-motion` is the heaviest UI dependency. If performance becomes an issue on low-end devices in areas with poor connectivity, replacing `framer-motion` with native CSS transitions is the first step.