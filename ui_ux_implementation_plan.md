# Resume Analyzer – UI/UX Implementation Plan (Internal Confidence + Demo-Ready)

> **Objective**: Deliver a polished, credible, demo-ready product that feels intentional, reliable, and valuable — even with incomplete backend features (e.g. DOCX export).

This plan prioritizes:

* Clear user journeys
* Trustworthy UX
* Strong demo narratives
* Tight UI ↔ backend contract alignment

---

## Phase 0 – Guardrails & Freeze Rules (Very Important)

### Goals

* Prevent scope creep
* Avoid backend churn
* Keep UI stable while iterating

### Rules

* Backend APIs are treated as **read-only contracts** unless a UI blocker exists
* DOCX generation is explicitly **out of scope** for UI polish
* Any feature added must:

  * Improve clarity OR
  * Improve confidence OR
  * Improve demo storytelling

---

## Phase 1 – UI Foundation & Visual Consistency

### Outcome

The app looks like **one product**, not a collection of pages.

### Scope

#### 1. Design Tokens & UI Primitives

Create or formalize:

* Button (primary / secondary / ghost / disabled)
* Card (default / outlined)
* Input & Textarea
* Badge (success / warning / error / info)
* Spinner / Loading state
* Empty state

**Acceptance Criteria**:

* No raw Tailwind classes in pages
* Pages only consume primitives

---

#### 2. AppShell & Layout Polish

* Header: product name + auth state
* Footer: visually de-emphasized, always bottom
* Main content uses consistent vertical rhythm

**Acceptance Criteria**:

* Footer never floats mid-screen
* App feels app-like, not page-like

---

## Phase 2 – Analyzer Flow (Core Demo Experience)

### Outcome

A smooth, confident, step-by-step analysis experience.

### Scope

#### 1. Step-Based Analyzer UX

**Steps**:

1. Upload Resume
2. (Optional) Paste Job Description
3. Start Analysis

**UX Rules**:

* File selection immediately updates UI
* Upload progress is visible
* Retry does not reset state

---

#### 2. Async Analysis UX

* Analysis treated as a background job

* Status shown clearly:

  * Queued
  * Running
  * Completed
  * Failed

* Poll analysis status

* Persist state on refresh

**Acceptance Criteria**:

* User can refresh and continue
* Demo can pause on “Running” and explain async design

---

## Phase 3 – Results Page (Report-Grade Output)

### Outcome

Results feel like a **professional evaluation report**.

### Scope

#### 1. Results Summary

* Overall score
* Strengths count
* Gaps count

---

#### 2. Section-Level Breakdown

* Experience
* Skills
* Projects
* Formatting / ATS

Each section shows:

* Score
* Key feedback

---

#### 3. Recommendations Panel

* Prioritized list
* Copy-ready suggestions where possible

---

#### 4. Generated Resume Actions (Honest UX)

* “Generate improved resume (Beta)”
* Download disabled with tooltip

**Acceptance Criteria**:

* No false promises
* Demo clearly explains roadmap

---

## Phase 4 – History & Progress Tracking

### Outcome

User sees progress over time.

### Scope

* List of analyses
* Status badges
* Scores
* Timestamp
* Click-through to results

**Acceptance Criteria**:

* History tells a story
* Demo can show iteration

---

## Phase 5 – Usage, Limits & SaaS Signals

### Outcome

Product clearly feels like a SaaS.

### Scope

* Usage indicator (e.g. 3 / 10 analyses used)
* Soft blocking when exceeded
* Clear upgrade messaging (even if pricing page is basic)

**Acceptance Criteria**:

* Limits are visible
* No surprise failures

---

## Phase 6 – Demo Hardening

### Outcome

The product demos confidently without apologies.

### Scope

* Friendly empty states
* Clear error messages
* Loading states everywhere
* Mock mode clearly supported

---

## What We Will NOT Do in This Plan

* Fix DOCX Word compatibility
* Build auto-apply flows
* Add recruiter-facing features
* Optimize for SEO

---

## Demo Narrative This Plan Supports

> “Upload a resume → analyze it → understand strengths and gaps → match it to a job → get actionable improvements → iterate.”

This narrative must work **without explaining the backend**.

---

## Validation Checklist (Use Before Adding Any Feature)

* Does this improve user clarity?
* Does this increase confidence in results?
* Does this help explain value in a demo?

If **no** to all three → do not build.
