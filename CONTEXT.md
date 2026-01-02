# Resume Analyzer – V1 Context

This repository contains the UI for a Resume / Job Description AI Matcher SaaS.

The goal of this product is NOT to build resumes.
The goal is to help candidates understand WHY their resume gets rejected
and WHAT they should fix before applying.

This file exists to provide persistent context to AI coding tools
(Codex, Copilot, ChatGPT) and future contributors.

---

## Product Goal

Help job seekers quickly diagnose resume–JD mismatch issues
that cause ATS or recruiter rejection.

The core promise:
"Upload your resume + job description → see why you’ll be rejected and how to fix it."

---

## Core User Flow (V1)

1. User opens the app
2. Uploads resume (PDF or DOCX)
3. Pastes job description text
4. Clicks "Analyze"
5. Receives a structured analysis:
   - Match score
   - Missing keywords / skills
   - ATS-related warnings
   - Bullet improvement suggestions
6. User can run a limited number of analyses per month

---

## V1 Feature Scope (Strict)

### Included
- Resume upload (PDF/DOCX)
- Job description text input
- AI-based resume vs JD analysis
- Match score (0–100)
- Missing / weak keywords
- Skill gap list
- Suggested bullet improvements (limited, not full rewrite)
- Analysis result display
- Basic analysis history (recent runs)

### Explicitly Excluded (V1)
- Resume builder or editor
- Resume templates
- Cover letter generation
- Job board integrations
- Interview preparation
- Multiple resume versions
- Collaboration or sharing

---

## Design Principles

- Diagnosis > Generation
- Clarity > Fancy UI
- Minimal screens
- Fast feedback loop
- Professional tone (career-impacting tool)

The UI should feel:
- Simple
- Trustworthy
- Focused on actionable feedback

---

## Technical Context (UI)

- React + Vite
- Tailwind CSS
- API-driven (no heavy logic in UI)
- Backend exposed via REST API
- API base URL injected via environment variable

The UI should:
- Validate inputs
- Handle loading / error states
- Render structured API responses cleanly
- Avoid embedding business rules or prompts

---

## Integration Expectations

The UI integrates with:
- Resume Analyzer API
- Endpoint: POST /v1/analyze
- Payload: resume file + job description text
- Response: structured JSON analysis

The UI should treat the API as the source of truth.

---

## Non-Goals

This repository is NOT responsible for:
- AI prompt design
- Scoring algorithms
- Resume parsing heuristics
- Cost management
- Billing logic (except UI hooks)

Those belong to the API/service layer.

---

## How AI tools should use this file

When modifying or generating code:
- Do NOT add features outside V1 scope
- Prefer simple, readable components
- Favor composition over complexity
- Respect the diagnosis-first philosophy
