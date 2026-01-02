# Resume Analyzer – Product Definition (V1)

This document defines the product intent, boundaries, and roadmap
for the Resume / JD AI Matcher SaaS.

It is written for founders, engineers, and AI coding assistants.

---

## Problem Statement

Most resumes are rejected not because candidates lack ability,
but because resumes fail to match the job description language
used by ATS systems and recruiters.

Candidates do not know:
- Which keywords are missing
- How their experience is misaligned
- What exactly needs to be changed

This creates anxiety, wasted applications, and low confidence.

---

## Target Users

Primary:
- Software engineers
- Tech professionals
- White-collar job seekers applying online

Secondary (later):
- Fresh graduates
- Career switchers
- International applicants

---

## Value Proposition

"Know why your resume gets rejected before you apply."

The product provides:
- Clarity
- Actionable fixes
- Fast feedback
- Confidence

This is a **diagnostic tool**, not a resume generator.

---

## Version 1 Capabilities

### Inputs
- Resume file (PDF / DOCX)
- Job description text

### Outputs
- Resume–JD match score
- Missing or weak keywords
- Skill gaps
- ATS compatibility warnings
- Bullet-level improvement suggestions

All outputs must be:
- Structured
- Explainable
- Actionable

---

## User Experience Principles

- One primary action per screen
- Clear progress states
- No unnecessary choices
- Minimal cognitive load
- Results should feel “consultant-like”, not “AI spam”

---

## Monetization Strategy

### Initial Pricing (Validation Phase)
- $9/month
- 10 analyses per month
- Optional: 1 free analysis for trial

### Later Pricing (Growth Phase)
- Starter: $9 (10 analyses)
- Pro: $19 (50 analyses)
- Power: $29 (fair-use unlimited)

The product charges for **clarity and confidence**, not AI usage.

---

## Cost Awareness

- Each analysis has an AI cost
- Usage must be capped and enforced
- The UI must respect limits and show usage clearly

No unlimited free usage.

---

## Roadmap (High Level)

### V1 (Now)
- Resume + JD analysis
- Match score
- Gaps & suggestions
- Simple UI
- Paid access

### V2 (Later)
- Resume rewriting mode
- Role-specific advice
- Country-specific ATS checks
- Interview prep add-ons

### V3 (Optional)
- Recruiter-facing tools
- Bulk resume analysis
- Enterprise plans

---

## What This Product Is NOT

- Not a resume builder
- Not a generic AI writing tool
- Not a job board
- Not a career coaching platform (yet)

Focus is key.

---

## Guidance for Contributors & AI Tools

When making changes:
- Protect the V1 scope
- Prefer shipping over perfection
- Avoid feature creep
- Align with the core promise

If a feature does not directly help users understand
*why they are being rejected*, it does not belong in V1.
