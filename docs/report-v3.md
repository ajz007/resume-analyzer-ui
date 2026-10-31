# Job-specific review UI

V3 reports open with the initial assessment and edits. A prominent job-diagnosis disclosure shows evidence, gaps, preferred criteria and linked edits. Answering a job-specific question can add a separately labeled edit to the same review; earlier choices remain. The original score and evidence rating are not automatically recalculated. None/not_sure may result in no edit.

The UI loads/saves owner review sessions, preserves original/new edit choices, polls pending answer jobs and recovers committed results after a lost response. Answered questions appear in history; follow-ups retain the previous response for candidate reconfirmation. Shared reports are read-only and do not load owner answer history.

The companion API must provide `/analyses/:id/review-session` and its `/choices` and `/answers` routes, plus reviewed-resume export with `reviewVersion`. Deploy the API worker supporting `review_answer` before enabling this flow. Legacy reports retain their renderer.

## Local examples

Run the existing Vite dev command, then open `/dev/report-fixtures.html` for sanitized report scenarios or `/dev/review-session.html` for the fictional scripted answer walkthrough. These examples do not invoke a model. Walkthrough state stays in browser storage and can be reset. Only the supplied fictional answer produces the scripted example edit; custom text is not evaluated by AI.

## Validation

`npm test -- --run` passes 91 tests; `npm run build` passes. `npx tsc --noEmit` retains 14 diagnostics that exactly match the current main-branch baseline. Browser checks cover report diagnosis, navigation, background completion, preservation of first edits and choices, reload, no-change responses, lost-response recovery and mobile layout. The private candidate evaluation pages and artifacts are excluded from this repository change.
