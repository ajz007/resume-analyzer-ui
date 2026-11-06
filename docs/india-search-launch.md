# India Search pilot

## Connect Google Analytics and Google Ads

1. In GA4, create or select the Rethink Resume property. Under Admin, Data streams, add a Web stream for `https://app.rethinkresume.com` and copy its `G-…` Measurement ID.
2. Turn off Enhanced measurement for the stream before deploying. The app sends selected page views manually, so automatic measurement could collect private route URLs. Leave Google signals and personalized advertising off for this pilot.
3. Set the UI repository's Actions variable `VITE_GA_MEASUREMENT_ID` and deploy the API purchase-receipt change before the UI. When the variable is empty, the Google tag is not loaded. The tag also waits for the visitor's choice.
4. Link the GA4 property to Google Ads and enable Ads auto-tagging. Import GA4 `purchase` as the one primary purchase conversion. Use the recorded event value and currency and count every distinct transaction. Keep `preview_completed` diagnostic. Do not also fire a separate Ads tag for the same purchase.
5. Validate the live destination and consent with Tag Assistant and GA4 Realtime. Check a controlled checkout with the owner: no purchase on a pending or failed payment, one purchase with the confirmed amount and a stable transaction ID, and no private result URL. Compare Analytics with the payment ledger. Consent, blockers, and customers leaving before browser confirmation can cause Analytics to undercount, so the ledger remains the sales total.

Google guides: [GA4 ecommerce](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce), [import GA4 conversions](https://support.google.com/analytics/answer/10632359), and [create a Search campaign](https://support.google.com/google-ads/answer/9510373).

## Campaign draft

- Name: India Search | Job Match Review. Objective: Sales. Campaign type: Search. Start with Google Search only, India presence targeting, English creative, and a budget the owner approves.
- Final URL: `https://app.rethinkresume.com/app/analyzer?mode=job-match`. Confirm this page displays ₹169 before upload and that the offer is live.
- Start with phrase and exact versions of “match resume to job description”, “resume job match review”, and “tailor resume to job description”. Review search terms. Exclude clearly unrelated queries such as resume templates, jobs near me, and resume writing services as they appear. Keep preview-oriented searches relevant to the offer.
- Example headlines: “Match Your Resume to a Job”, “Free Job Match Preview”, “Full Job Review ₹169”, “See What Your Resume Proves”.
- Example descriptions: “See where your resume fits and what’s missing. Free preview. Full review ₹169.” and “Get a breakdown by job requirement and suggested changes based on your experience.”
- Keep the campaign as a draft until the owner approves the budget and live purchase measurement is verified. Compare confirmed purchases, cost per purchase, and AI cost including free previews. Use the payment ledger for confirmed and refunded sales.
