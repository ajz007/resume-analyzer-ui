# UI Architecture – Resume Analyzer UI (V1)

This document defines the UI architecture for the Resume Analyzer / JD Matcher SaaS.
It is optimized for AI coding tools (Codex/Copilot) to make consistent changes.

This UI is diagnosis-first:
- Collect inputs (resume + JD)
- Call API
- Render structured results
- Track usage/history

The UI should stay thin: no prompt logic, no scoring algorithms, no heavy parsing logic.
All business logic belongs to the API.

---

## Tech Stack

- React (TypeScript preferred; JS acceptable if repo is JS currently)
- Vite
- Tailwind CSS
- Routing: React Router
- State management: Zustand (preferred) OR React Context (acceptable for small scope)
- Data fetching: Fetch API (fine) OR React Query (optional)
- Forms: simple controlled components (avoid heavy form libs in V1)
- Notifications: lightweight toast library (or custom)
- File upload: react-dropzone (recommended)

---

## High-Level UI Modules

The UI is split into these core modules:

1) Public marketing pages
- Landing
- Pricing
- Legal pages

2) App pages (authenticated or semi-auth)
- Analyzer (main flow)
- Results (can be a route or section)
- History
- Account/Billing (stub is okay for V1)

3) Shared components
- Upload dropzone
- JD input editor
- Score card
- Keyword gap list/table
- Suggestions list
- Loading / error states
- Layout components

4) API client
- Centralized base URL
- Typed request/response DTOs
- Standard error handling
- File upload helper

---

## Repository Structure (Recommended)

Root:
- CONTEXT.md
- PRODUCT.md
- UI_ARCHITECTURE.md
- .env.example
- README.md

src/
  app/
    App.tsx                    # Top-level app component, mounts router and providers
    router.tsx                 # Route definitions
    providers.tsx              # App-wide providers (store, toasts, auth)
    env.ts                     # Reads and validates environment variables
    config.ts                  # App constants, limits, links

  pages/
    Landing/
      LandingPage.tsx
    Pricing/
      PricingPage.tsx
    Legal/
      PrivacyPage.tsx
      TermsPage.tsx

    Analyzer/
      AnalyzerPage.tsx         # Upload + JD input + submit
      components/
        ResumeDropzone.tsx
        JdTextArea.tsx
        AnalyzeButton.tsx

    Results/
      ResultsPage.tsx          # Renders analysis output for a given analysisId
      components/
        ScoreCard.tsx
        AtsChecks.tsx
        KeywordGaps.tsx
        BulletSuggestions.tsx
        NextSteps.tsx

    History/
      HistoryPage.tsx          # Recent analyses list
      components/
        HistoryList.tsx
        HistoryItem.tsx

    Account/
      AccountPage.tsx          # Minimal profile + usage info
      BillingPage.tsx          # Optional v1; can link to Stripe portal later

  components/
    layout/
      AppShell.tsx             # Top nav + container
      Navbar.tsx
      Footer.tsx
    ui/
      Button.tsx
      Card.tsx
      Input.tsx
      TextArea.tsx
      Spinner.tsx
      Skeleton.tsx
      Badge.tsx
      Alert.tsx
    feedback/
      Toast.tsx
      ErrorState.tsx
      EmptyState.tsx

  api/
    client.ts                  # fetch wrapper, baseURL, headers, error parsing
    endpoints.ts               # functions calling API routes
    types.ts                   # request/response types
    upload.ts                  # multipart upload helper

  store/
    useAuthStore.ts            # auth state (optional v1)
    useAnalysisStore.ts        # current analysis + status + result
    useHistoryStore.ts         # recent analyses list
    useUsageStore.ts           # usage/quota info

  utils/
    format.ts                  # formatting helpers (dates, file sizes)
    validators.ts              # validate inputs (file type/size, JD min length)
    guardrails.ts              # UI-side guardrails (min JD length etc.)

  styles/
    globals.css

  main.tsx                     # Vite entry point

---

## Routing (V1)

Use React Router with these routes:

Public:
- GET /              -> LandingPage
- GET /pricing       -> PricingPage
- GET /privacy       -> PrivacyPage
- GET /terms         -> TermsPage

App:
- GET /app/analyzer  -> AnalyzerPage
- GET /app/results/:analysisId -> ResultsPage
- GET /app/history   -> HistoryPage
- GET /app/account   -> AccountPage
- GET /app/billing   -> BillingPage (optional)

Default redirect:
- /app -> /app/analyzer

Auth gating:
- V1 can be "soft auth":
  - allow analyze without login but do not store history
  - OR require login to run analysis (simpler for usage control)
Choose one and keep consistent.

Recommended for SaaS V1:
- Require login before analysis OR after first trial analysis.

---

## State Management (Zustand Recommended)

### Stores and their responsibilities

1) useAnalysisStore
- current file metadata (name, size)
- current JD text
- status: 'idle' | 'uploading' | 'analyzing' | 'success' | 'error'
- active analysisId
- last result object
- error message

Actions:
- setResumeFile(file)
- setJdText(text)
- submitAnalysis()
- resetAnalysis()

2) useHistoryStore
- list of recent analyses (id, createdAt, roleTitle, score)
- status/loading/error

Actions:
- fetchHistory()
- addToHistory(item)
- clearHistory() (optional)

3) useUsageStore
- allowed analyses per period
- used analyses
- reset date
- status/loading/error

Actions:
- fetchUsage()

4) useAuthStore (optional v1)
- user
- isAuthenticated
- login/logout actions

If auth is not implemented in v1:
- store "session id" from API if provided
- keep local storage for trial usage

---

## API Contract (UI Expectations)

The UI consumes API responses and renders them.
The UI should never implement the scoring logic.

Base URL:
- VITE_API_BASE_URL

Endpoints (suggested):
- POST /v1/analyze
  Request: multipart/form-data
    - resume: File (pdf/docx)
    - jobDescription: string
    - options: optional JSON (role/seniority)
  Response:
    - analysisId
    - createdAt
    - matchScore (0-100)
    - missingKeywords: string[]
    - weakKeywords: string[]
    - atsChecks: [{ id, title, severity, message }]
    - bulletSuggestions: [{ original, suggested, reason }]
    - summary: string
    - nextSteps: string[]

- GET /v1/analysis/:analysisId
  Response: same as above

- GET /v1/history
  Response:
    - items: [{ analysisId, createdAt, matchScore, title? }]

- GET /v1/usage
  Response:
    - plan: string
    - limit: number
    - used: number
    - resetsAt: ISO string

Error handling:
- Standardize API errors into:
  { code, message, details? }
UI should display user-friendly messages.

---

## UI Guardrails and Validation (V1)

Client-side validation:
- Resume file must be PDF or DOCX
- Max file size: 2–5 MB (configurable)
- JD must be at least N characters (e.g., 300)
- Show inline validation messages and disable Analyze button until valid

Rate limiting:
- UI should show quota/usage (from /v1/usage)
- If quota exceeded:
  - show paywall CTA (link to pricing)
  - do not spam the API

---

## Component Guidelines

- Prefer small, composable components
- Keep pages thin; move logic into store + api layer
- Avoid prop drilling: use store selectors
- Render states explicitly:
  - Loading: skeletons/spinners
  - Empty: empty states
  - Error: error components with retry action

Accessibility:
- proper labels for inputs
- keyboard navigation for file upload and buttons

---

## Styling and Design

- Tailwind for layout and spacing
- Minimal, professional, dark-friendly theme is acceptable
- Do not add flashy animations in V1
- Keep layout responsive; assume mobile usage

---

## How to Add a New Feature (Process)

When adding features:
1) Update PRODUCT.md if scope changes (avoid for V1)
2) Add/modify API types in src/api/types.ts
3) Add endpoint function in src/api/endpoints.ts
4) Add store changes if feature affects global state
5) Add or modify page/component
6) Add loading/error states
7) Ensure routing/navigation updated if new page is added

Always keep:
- API in api/
- state in store/
- rendering in pages/components/

---

## Deployment Considerations (UI)

- Keep environment variable usage centralized in src/app/env.ts
- Never hardcode API URLs in components
- Provide .env.example for developers
- Build output should be static and deployable (Amplify, S3+CloudFront, etc.)

---

## Non-Goals for UI

The UI does NOT:
- run AI prompts
- implement scoring or ranking logic
- parse resume deeply (only minimal client validation)
- store secrets

All AI and scoring belongs to backend.

---

## Definition of Done (V1 UI)

A V1 UI is complete when:
- User can upload resume + paste JD and submit
- UI shows progress/loading state
- UI renders match score, gaps, ats checks, and suggestions cleanly
- History page shows last N analyses
- Usage/quota is visible and enforced via UI
- Errors are handled gracefully
- Build + deployment are documented
