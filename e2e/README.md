# Guided review browser checks

Run `npm ci`, `npx playwright install --with-deps chromium`, then `npm run test:review-browser`.

The script starts a temporary Vite server on localhost port 8818 and closes it and the browser on completion. It uses fictional data and an injected review-session transport. External browser requests are blocked. It never submits an analysis, calls a model, or downloads a real candidate resume.

Checks cover initial edits, saved keep-original choices across an answer, answer confirmation reset, draft preservation while navigating, additive/no-change/needs-detail answers, focus after answer completion, shared and locked views, switching analyses, failed choice saves, failed initial loads, pending-answer export guards, keyboard section navigation, and horizontal overflow at 1280, 390 and 320 pixels.

Set `REVIEW_SCREENSHOT_DIR` to retain screenshots. These are component-level browser checks; they do not replace acceptance of real sign-in, payment/unlock, production answer quality, or DOCX contents and formatting. The fixture is outside the production entry point and is not part of the production bundle.
