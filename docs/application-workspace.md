# Connected application workspace

The primary journey is Home → saved upload + target job → application review → selected-resume export → return through Applications. Existing structured resume workspaces remain available under My resumes.

## Included in this increment

- Three main destinations: Home, Applications and My resumes, plus a new-job-review action. Builder routes remain available; they are no longer the primary navigation action.
- A Home page that starts with an existing saved upload and continues recent reviews.
- Owner-scoped saved-upload selection and server-saved primary-upload preference. Each review retains its original document ID. Choosing a different primary does not rewrite old analyses.
- Optional company and target-position inputs. Labels are saved after the analysis ID is returned, independently of the report. A label-save failure does not retry generation and can be recovered by editing the saved review's labels.
- Application history organized by confirmed company/role, with legacy posting excerpts when labels are absent, server-side search, pagination and retry states. History contains no private answers.
- Owner-only application context and label editing on results, including queued/processing/failed states. Pending results are checked read-only; the user is not told to submit again.
- Backend-driven queued/processing status and elapsed time instead of time-inferred completed steps.
- No legacy jump targets or duplicate outer score badge on V3 reports. V3's submitted-resume scores remain inside the report.
- Account-aware data loading and stale-request guards. Results loading verifies the current owner with the API rather than trusting legacy, unscoped browser-cache entries.

## API dependency

Requires the companion API's application-workspace routes and additive migration `0025_application_workspace.sql`. Release the API/migration before this UI. No production changes were made while preparing these changes.

## Deliberately separate work

This is the first implementation slice, not the entire visual redesign. The detailed V3 overview/edit/question hierarchy still needs the next design increment. Grouped source versions, named-upload aliases, reusable copies of exported resumes and a direct structured-resume-to-analysis source contract remain future work. No GitHub/LinkedIn/Medium integrations, job discovery or interview tools are added.

## Validation

98 frontend tests and the production build passed. Tests cover optional/legacy application headings, clearing labels for another job while preserving the source, ignoring stale analysis completions after reset, label-save recovery without another generation request, queued status, navigation and existing V3 behavior.

TypeScript reports six existing diagnostics, compared with 14 on a clean current-main baseline. Touched form refs, quota-refresh calls, unused analyzer code and a test fixture were corrected; unrelated TypeScript debt remains. The current ESLint configuration does not match TypeScript files, so the targeted lint invocation was not a meaningful TypeScript lint check.

Fresh desktop/mobile browser, keyboard and screenshot verification remains outstanding. Local automated checks do not establish end-to-end sign-in, payment/unlock, second-job behavior or Word-download fidelity. No paid model experiments were run.
