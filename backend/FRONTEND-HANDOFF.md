# Frontend handoff — do not duplicate auth storage

The frontend is owned by the other session. Backend entrypoint: `npm run api` on localhost:3101; Docker PostgreSQL is on localhost:5433. See README.md for API details. No auth cookies/tokens belong in localStorage. All fetch calls need credentials:'include'; bootstrap CSRF before POST.

## Requested visual direction (not implemented by backend session)

User rejected the dark/lime dashboard and requested white/blue for the website. Confirm whether both landing page and dashboard should change before applying a global palette.

Public component references inspected:
- https://ui.shadcn.com/examples/dashboard — light sidebar/workspace navigation, restrained metric cards, chart panel and structured data table.
- https://ui.shadcn.com/examples/authentication — authentication layout reference; verify live contents before implementation.
- https://www.tremor.so/ — React dashboard/chart primitives, tables, filters, progress trackers. Use as reference; do not add Tailwind/Radix/Recharts solely for a few simple existing components.
- https://www.breakoutprop.com/ — funded-account equity chart, drawdown limits and payout controls provide product information hierarchy, not branding to copy.

Proposed palette: white canvas, slate/navy text, blue primary controls/selection, gray borders; green/red reserved for financial gain/loss. Remove decorative glows and redundant sparklines. Preserve keyboard focus, mobile tables, and explicit simulated-data labels.

Backend state: real PostgreSQL users/password hashes/session digests; dashboard account/trade/payout data synthetic. No live broker or payment execution. Frontend should use /api/auth/me to determine auth state and handle 401 by displaying sign-in, not merely hide content with a hash route.
