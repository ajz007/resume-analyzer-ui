# Phase 1 Scope Freeze (As Implemented)

## Phase 1 user journey (as implemented)
1. User lands on `/` and is routed to `/app/analyzer` inside the AppShell nav layout.
2. User uploads a PDF/DOC/DOCX resume (<=5MB) via dropzone; upload is sent to `/documents`.
3. User pastes a job description (>=300 chars) and clicks Analyze; analysis starts via `/documents/{id}/analyze` and polls `/analyses/{id}` (or mock mode).
4. User views results in `/app/results/:analysisId` with match score, keyword gaps, ATS checks, rule-based bullet suggestions and predefined next-step templates; result is cached in localStorage.
5. User can start a new analysis, analyze another JD, or view history; history requires login and fetches `/analyses`.

## Included features (as implemented)
- Analyzer flow with file validation, JD min length, and submit gating.
- Document upload and current document fetch.
- Async analysis with polling and mock fallback.
- Results report UI with sections for missing/weak keywords, ATS checks, rule-based bullet suggestions and predefined next-step templates.
- Usage/quota display and enforcement with upgrade CTA.
- Optional authenticated preview flow enabling history listing; authentication is non-production and not security-guaranteed.
- Pricing, Privacy, and Terms pages.
- Basic auth token capture from URL and sign-in/out UI.
- Toast notifications and global error handling.

## Explicit non-goals (scope creep to postpone despite existing)
- Google OAuth UI and token handling: freeze; no further auth flows until core analyzer stability is proven.
- Pricing and legal content iteration: freeze; no expansion until backend billing exists.
- Demo-only mock API mode: keep as-is; no additional mock behaviors.
- History login-gated flow: freeze UX improvements until authentication is production-ready.

## Success criteria checklist
- [ ] Resume upload accepts PDF/DOC/DOCX and blocks >5MB files.
- [ ] JD input enforces 300+ chars and blocks Analyze when too short.
- [ ] Analyze starts, shows loading state, and handles API errors with a visible message/toast.
- [ ] Results page renders match score, keyword gaps, ATS checks, rule-based bullet suggestions and predefined next-step templates.
- [ ] Usage quota is visible and Analyze is blocked at limit with pricing CTA.
- [ ] History loads (when logged in), displays recent analyses, and links to results.
- [ ] App routes work for `/app/analyzer`, `/app/results/:analysisId`, `/app/history`, `/pricing`, `/privacy`, `/terms`.
- [ ] Mock mode functions without backend for demo use.

## Phase 1 Guardrails
- All analysis outputs are deterministic and rule-based.
- No AI reasoning, inference, or resume rewriting is performed.
- Authentication flows are preview-only and not production-grade.
- Results content must be explainable and repeatable.
