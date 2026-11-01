# Surrounding-page checks

Run `npm ci`, `npx playwright install --with-deps chromium`, then `npm run test:pages-browser`.

The runner starts a temporary Vite server on port 8820 and closes it and its browser afterwards. All API data is fictional and intercepted; external browser requests are blocked. Razorpay is replaced with a fictional checkout callback. No real authentication, payment, analysis, or model call occurs.

Checks cover:

- Explicit new-job actions clear job and run state but keep the selected source; normal back navigation preserves an in-progress draft.
- Pricing loading, request failure/retry, disabled paywall, enabled paywall without prices, and enabled paywall with prices.
- Independent source/history loading failures on Home; an available route to a new review; empty-source state.
- Saved uploads alongside an empty optional draft section, and persistent draft-load errors with retry.
- Interrupted payment verification, checking existing entitlement even if verification is unavailable, reusing the same confirmation payload without creating another order, and a successful checkout.
- A per-tab pending marker survives reload. After reload, only saved review access can be checked until server confirmation arrives; checkout proof is held in memory and is not stored. This is not a provider payment-status lookup or a guarantee across tabs/devices. Support remains the recovery path when the receipt and server state cannot be reconciled in this UI.
- Thirty-three signed-in route/viewport checks at 1440/390/320px plus three guest routes at 320px. Long source filenames and company/role labels are included. Guest mobile navigation is exercised.

Set `PAGE_SCREENSHOT_DIR` to retain screenshots. These checks do not replace live sign-in, payment-provider, migration or downloaded-document acceptance.

The guided-review regression runner remains available as `npm run test:review-browser`. Set `REVIEW_TEST_PORT` if 8818 is already serving a preview; for example use 8822. Runners wait for their own server to start and fail if their port is occupied rather than testing an unrelated running preview.


Purchase recovery coverage now includes the owner-scoped recovery endpoint, recovery without tab storage, unknown/pending confirmation, temporary recovery failure, saved currency/price after pricing changes, an interrupted order response, checkout dismissal and resume, captured confirmation and refunded-purchase blocking. Provider checkout and every API response are simulated; no real payment is made. Deploy the companion API with migration 0026 before this UI.
