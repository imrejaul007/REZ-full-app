# Dashboard Cards

This directory holds the extracted dashboard cards used by the registry-driven
`DashboardScreen`. Each file is one card, one default export.

See:
- `types.ts` — `DashboardCardConfig`, `DashboardCardProps`, visibility context
- `docs/sprint-minus-1a/DASHBOARD_SPLIT_PLAN.md` — full plan + card inventory
- `utils/dashboardFormatters.ts` — shared helpers (lifted out of index.tsx)

## Extraction status (Sprint -1a)

| # | Card | Size | File | Status |
|---|---|---|---|---|
| 1 | ErrorBanner | S | `ErrorBannerCard.tsx` | ✅ extracted (exemplar) |
| 2 | StoreSuspension | S | `StoreSuspensionBanner.tsx` | ✅ extracted (exemplar) |
| 3 | StoreInactive | S | `StoreInactiveBanner.tsx` | 🚧 |
| 4 | HealthScore | S | `StoreHealthScoreCard.tsx` | 🚧 |
| 5 | MonthlyStory | S | `MonthlyStoryCard.tsx` | 🚧 |
| 6 | TopItemsToday | S | `TopItemsTodayCard.tsx` | 🚧 |
| 7 | CustomerReturnRate | S | `CustomerReturnRateCard.tsx` | 🚧 |
| 8 | BasketTrend | S | `BasketSizeTrendCard.tsx` | 🚧 |
| 9 | QuickActionGrid | S | `QuickActionGridCard.tsx` | 🚧 |
| 10-14 | Already-external (5) | S | — | ✅ register-only |
| 15 | DashboardHeader | M | `DashboardHeaderCard.tsx` | 🚧 |
| 16 | TodayAtAGlance | M | `TodayAtAGlanceCard.tsx` | 🚧 |
| 17 | AIRecommendations | M | `AIRecommendationsCard.tsx` | 🚧 |
| 18 | TodaysHighlightsStrip | M | `TodaysHighlightsStrip.tsx` | 🚧 |
| 19 | TodayRevenueROI | M | `TodayRevenueROICard.tsx` ⚠️ | 🚧 name-collision fix (see plan) |
| 20 | ActionItems | M | `ActionItemsCard.tsx` | 🚧 |
| 21 | CampaignROI | M | `CampaignROICard.tsx` | 🚧 |
| 22 | QuickActionsPremiumGrid | M | `QuickActionsPremiumGrid.tsx` | 🚧 |
| 23 | CustomerPayments | M | `CustomerPaymentsCard.tsx` | 🚧 |
| 24 | RecentActivity | M | `RecentActivityCard.tsx` | 🚧 |
| 25 | AnalyticsOverview | L | `AnalyticsOverviewCard.tsx` | 🚧 |
| 26 | StorePerformance | L | `StorePerformanceCard.tsx` | 🚧 |

## Rules for new card files

1. **No closure over DashboardScreen state.** Cards receive what they need
   via props. The shell owns the fetch pipeline.
2. **Use formatters from `utils/dashboardFormatters.ts`.** Don't redefine
   `formatCurrency`/`formatPercentage`/`formatNumber` inline.
3. **Include `testID="dashboard-card-<id>"` on the root element.** The
   smoke test in `docs/sprint-minus-1a/dashboard-smoke.test.template.tsx`
   asserts presence.
4. **Don't import from `app/(dashboard)/index.tsx`.** That file will shrink
   drastically; any dependency creates a circular risk.
5. **One default export per file**, named to match the filename.

## Registry pattern

```tsx
// Sprint -1b: index.tsx consumes this registry
import { DASHBOARD_CARDS } from '@/components/dashboard/cards/registry';

return (
  <ScrollView>
    {DASHBOARD_CARDS
      .filter((c) => !c.modes || c.modes.includes(mode))
      .filter((c) => !c.verticals || c.verticals.includes(vertical))
      .filter((c) => !c.isVisible || c.isVisible(ctx))
      .map((c) => <c.component key={c.id} {...cardProps} />)}
  </ScrollView>
);
```

The `registry.ts` file (not yet written — Sprint -1b) will be the single
import site.
