# Article analytics setup

Both cafe and blog use js/article-analytics.js. Collection is disabled until the
site.ga4Id in each blog-data.js is set to the same existing store measurement ID.
Do not add another Google tag or GTM GA4 configuration in parallel.

Events (per page load): article_view, article_scroll (25/50/75/90),
article_active_time (30/60/120/180/300 seconds), article_read (60 seconds and
25/50/75 body milestones exposed), article_complete (120 seconds and all four
milestones exposed), product_click, article_engagement (15-second batches and exit).
Active time requires visible and focused page. Timer gaps are capped at 2 seconds.
These are reading estimates, not proof of attention. Refresh starts a new visit.

GA4 custom dimensions: article_id, page_type, scroll_percent,
time_threshold_seconds, product_destination. Custom metric:
active_time_delta_seconds (seconds). Do not sum cumulative active_seconds.
Use a closed session-scoped funnel article_view -> article_read -> product_click
-> purchase; require events in the same session and filter page_type at the first
step (purchase events on the store will not carry page_type).

Store work is required: same GA4 web stream on cafe-never.com and
100yearhealth.co.kr; configure cross-domain measurement in GA4 Admin; verify _gl
survives the /surl/P/31 redirect; verify a real order sends purchase with unique
transaction_id, value, currency and items exactly once. Refunds and external
payments require separate validation. Never infer a purchase from an outbound
click or fabricate transaction IDs. Existing product UTM parameters are preserved.
Campaign attribution and a cross-domain session funnel are distinct reports.

Check DebugView before release, then Events/Pages and screens and Explorations.
No GA4 account, ID, store purchase integration or report configuration has been
created by this code change. Dable conversion tags are also not installed.
