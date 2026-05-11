// @ts-nocheck
/**
 * config/routes.ts — Route registration (all app.use() calls)
 * Extracted from server.ts for maintainability.
 */
import { Express } from 'express';
import { logger } from './logger';
import { globalErrorHandler, notFoundHandler } from '../middleware/errorHandler';
import { sentryErrorHandler } from './sentry';
import { generalLimiter, adminLimiter } from '../middleware/rateLimiter';
import { adminAuditMiddleware } from '../middleware/adminAuditMiddleware';
import { authenticate as authTokenMiddleware, requireAdmin as requireAdminMiddleware } from '../middleware/auth';
import { getAllConfigs, updateConfig, setCampaign } from '../controllers/engagementConfigController';
import { Router as EngagementConfigRouter } from 'express';
import { validateCsrfToken } from '../middleware/csrf';

// ── User API Route Imports ──
import consumerHomeRoutes from '../routes/consumerHomeRoutes';
import authRoutes from '../routes/authRoutes';
import productRoutes from '../routes/productRoutes';
import cartRoutes from '../routes/cartRoutes';
import categoryRoutes from '../routes/categoryRoutes';
import storeRoutes from '../routes/storeRoutes';
import storeShoppingRoutes from '../routes/storeShoppingRoutes';
import followerStatsRoutes from '../routes/followerStatsRoutes';
import followerAnalyticsRoutes from '../routes/followerAnalyticsRoutes';
import orderRoutes from '../routes/orderRoutes';
import videoRoutes from '../routes/videoRoutes';
import ugcRoutes from '../routes/ugcRoutes';
import articleRoutes from '../routes/articleRoutes';
import projectRoutes from '../routes/projectRoutes';
import earningProjectsRoutes from '../routes/earningProjectsRoutes';
import notificationRoutes from '../routes/notificationRoutes';
import stockNotificationRoutes from '../routes/stockNotificationRoutes';
import priceTrackingRoutes from '../routes/priceTrackingRoutes';
import reviewRoutes from '../routes/reviewRoutes';
import favoriteRoutes from '../routes/favoriteRoutes';
import comparisonRoutes from '../routes/comparisonRoutes';
import productComparisonRoutes from '../routes/productComparisonRoutes';
import analyticsRoutes from '../routes/analyticsRoutes';
import recommendationRoutes from '../routes/recommendationRoutes';
import wishlistRoutes from '../routes/wishlistRoutes';
import syncRoutes from '../routes/syncRoutes';
import locationRoutes from '../routes/locationRoutes';
import walletRoutes from '../routes/walletRoutes';
import transferRoutes from '../routes/transferRoutes';
import giftRoutes from '../routes/giftRoutes';
import giftCardRoutes from '../routes/giftCardRoutes';
import offerRoutes from '../routes/offerRoutes';
import offerCommentRoutes from '../routes/offerCommentRoutes';
import offerCategoryRoutes from '../routes/offerCategoryRoutes';
import heroBannerRoutes from '../routes/heroBannerRoutes';
import whatsNewRoutes from '../routes/whatsNewRoutes';
import voucherRoutes from '../routes/voucherRoutes';
import stampRoutes from '../routes/stampRoutes';
import addressRoutes from '../routes/addressRoutes';
import paymentMethodRoutes from '../routes/paymentMethodRoutes';
import userSettingsRoutes from '../routes/userSettingsRoutes';
import consumerArticleRoutes from '../routes/consumerArticleRoutes';
import achievementRoutes from '../routes/achievementRoutes';
import activityRoutes from '../routes/activityRoutes';
import paymentRoutes from '../routes/paymentRoutes';
import storePaymentRoutes from '../routes/storePaymentRoutes';
import externalWalletRoutes from '../routes/externalWalletRoutes';
import stockRoutes from '../routes/stockRoutes';
import socialMediaRoutes from '../routes/socialMediaRoutes';
import securityRoutes from '../routes/securityRoutes';
import eventRoutes from '../routes/eventRoutes';
import referralRoutes from '../routes/referralRoutes';
import profileRoutes from '../routes/profileRoutes';
import gameRoutes from '../routes/gameRoutes';
import leaderboardRoutes from '../routes/leaderboardRoutes';
import streakRoutes from '../routes/streakRoutes';
import shareRoutes from '../routes/shareRoutes';
import photoUploadRoutes from '../routes/photoUploadRoutes';
import pollRoutes from '../routes/pollRoutes';
import adminPollRoutes from '../routes/adminPollRoutes'; // BR-C2: dedicated admin poll router
import tournamentRoutes from '../routes/tournamentRoutes';
import programRoutes from '../routes/programRoutes';
import specialProgramRoutes from '../routes/specialProgramRoutes';
import sponsorRoutes from '../routes/sponsorRoutes';
import surveyRoutes from '../routes/surveyRoutes';
import verificationRoutes from '../routes/verificationRoutes';
import scratchCardRoutes from '../routes/scratchCardRoutes';
import couponRoutes from '../routes/couponRoutes';
import offerAutomationRoutes from '../routes/offerAutomationRoutes';
import razorpayRoutes from '../routes/razorpayRoutes';
import supportRoutes from '../routes/supportRoutes';
import copilotRoutes from '../routes/copilotRoutes';
import faqRoutes from '../routes/faqRoutes';
import messageRoutes from '../routes/messageRoutes';
import cashbackRoutes from '../routes/cashbackRoutes';
import userProductRoutes from '../routes/userProductRoutes';
import discountRoutes from '../routes/discountRoutes';
import storeVoucherRoutes from '../routes/storeVoucherRoutes';
import outletRoutes from '../routes/outletRoutes';
import flashSaleRoutes from '../routes/flashSaleRoutes';
import subscriptionRoutes from '../routes/subscriptionRoutes';
import promoCodeRoutes from '../routes/promoCodeRoutes';
import billRoutes from '../routes/billRoutes';
import billPaymentRoutes from '../routes/billPaymentRoutes';
import billingRoutes from '../routes/billingRoutes';
import activityFeedRoutes from '../routes/activityFeedRoutes';
import userActivityFeedRoutes from '../routes/userActivityFeedRoutes';
import userNotificationRoutes from '../routes/userNotificationRoutes';
import merchantQrRoutes from '../routes/merchantQrRoutes';
import unifiedGamificationRoutes from '../routes/unifiedGamificationRoutes';
import creatorRoutes from '../routes/creatorRoutes';
import adminCreatorRoutes from '../routes/adminCreatorRoutes';
import socialProofRoutes from '../routes/socialProofRoutes';
import partnerRoutes from '../routes/partnerRoutes';
import earningsRoutes from '../routes/earningsRoutes';
import userBootRoutes from '../routes/userBootRoutes';
import menuRoutes from '../routes/menuRoutes';
import consumerKhataRoutes from '../routes/consumerKhataRoutes';
import billSplitRoutes from '../routes/billSplitRoutes';
import tableBookingRoutes from '../routes/tableBookingRoutes';
import tableSessionRoutes from '../routes/tableSessionRoutes';
import consultationRoutes from '../routes/consultationRoutes';
import serviceAppointmentRoutes from '../routes/serviceAppointmentRoutes';
import blockedSlotRoutes from '../routes/blockedSlotRoutes';
import automationRuleRoutes from '../routes/automationRuleRoutes';
import staffTimeRoutes from '../routes/staffTimeRoutes';
import depositPolicyRoutes from '../routes/depositPolicyRoutes';
import rendezPartnerRoutes from '../routes/rendezPartnerRoutes';
import { rendezPartnerAuth } from '../middleware/rendezPartnerAuth';
import restoPapaInternalRoutes from '../routes/restoPapaInternalRoutes';
import internalPaymentRoutes from '../routes/internalPaymentRoutes';
import cancellationPolicyRoutes from '../routes/cancellationPolicyRoutes';
import staffCommissionRoutes from '../routes/staffCommissionRoutes';
import treatmentRoomRoutes from '../routes/treatmentRoomRoutes';
import classScheduleRoutes from '../routes/classScheduleRoutes';
import servicePackageRoutes from '../routes/servicePackageRoutes';
import waitlistRoutes from '../routes/waitlistRoutes';
import serviceCategoryRoutes from '../routes/serviceCategoryRoutes';
import serviceRoutes from '../routes/serviceRoutes';
import serviceBookingRoutes from '../routes/serviceBookingRoutes';
import patchTestRoutes from '../routes/patchTestRoutes';
import fitnessRoutes from '../routes/fitnessRoutes';
import homeServicesRoutes from '../routes/homeServicesRoutes';
import travelServicesRoutes from '../routes/travelServicesRoutes';
import travelPaymentRoutes from '../routes/travelPaymentRoutes';
import travelWebhookRoutes from '../routes/travelWebhookRoutes';
import financialServicesRoutes from '../routes/financialServicesRoutes';
import healthRecordRoutes from '../routes/healthRecordRoutes';
import safeDeployHealthRoutes from '../routes/safeDeployHealthRoutes';
import emergencyRoutes from '../routes/emergencyRoutes';
import storeVisitRoutes from '../routes/storeVisitRoutes';
import homepageRoutes from '../routes/homepageRoutes';
import personaHomepageRoutes from '../routes/personaHomepageRoutes';
import personaRoutes from '../routes/personaRoutes';
import homeSnapshotRoutes from '../routes/homeSnapshotRoutes';
import liveContextRoutes from '../routes/liveContextRoutes';
import searchRoutes from '../routes/searchRoutes';
import mallRoutes from '../routes/mallRoutes';
import mallAffiliateRoutes from '../routes/mallAffiliateRoutes';
import cashStoreAffiliateRoutes from '../routes/cashStoreAffiliateRoutes';
import cashStoreRoutes from '../routes/cashStoreRoutes';
import priveRoutes from '../routes/priveRoutes';
import priveInviteRoutes from '../routes/priveInviteRoutes';
import priveCampaignRoutes from '../routes/priveCampaignRoutes';
import webhookRoutes from '../routes/webhookRoutes';
import aggregatorWebhookRoutes from '../routes/aggregatorWebhookRoutes';
import storeGalleryRoutes from '../routes/storeGallery';
import productGalleryRoutes from '../routes/productGallery';
import offersRoutes from '../routes/offersRoutes';
import zoneVerificationRoutes from '../routes/zoneVerificationRoutes';
import studentRoutes from '../routes/studentRoutes';
import campusPartnerRoutes from '../routes/campusPartnerRoutes';
import loyaltyRoutes from '../routes/loyaltyRoutes';
import statsRoutes from '../routes/statsRoutes';
import platformRoutes from '../routes/platformRoutes';
import exploreRoutes from '../routes/exploreRoutes';
import testRoutes from '../routes/testRoutes';
import insuranceRoutes from '../routes/insuranceRoutes';
import adminExploreRoutes from '../routes/adminExploreRoutes';
import goldSavingsRoutes from '../routes/goldSavingsRoutes';
import goldSipRoutes from '../routes/goldSipRoutes';
import featureFlagConfigRoutes from '../routes/featureFlagConfig';
import campaignRoutes from '../routes/campaignRoutes';
import rechargeRoutes from '../routes/rechargeRoutes';
import bonusZoneRoutes from '../routes/bonusZoneRoutes';
import lockDealRoutes from '../routes/lockDealRoutes';
import playEarnRoutes from '../routes/playEarnRoutes';
import learningRoutes from '../routes/learningRoutes';
import experienceRoutes from '../routes/experienceRoutes';
import experienceRewardRoutes from '../routes/experienceRewardRoutes';
import contentRoutes from '../routes/contentRoutes';
import earnRoutes from '../routes/earnRoutes';
import adBazaarIntegrationRoutes, { webhookRouter as adBazaarWebhookRouter } from '../routes/adBazaarIntegration';
import adBazaarPartnerRoutes from '../routes/adBazaarPartnerRoutes';
import adsRoutes from '../routes/adsRoutes';
import consultationFormRoutes from '../routes/consultationFormRoutes';
import calendarSyncRoutes from '../routes/calendarSyncRoutes';
import hotelReviewRoutes from '../routes/hotelReviewRoutes';

// ── REZ TRY (Trial) Route Imports ──
import trialRoutes from '../routes/trialRoutes';
import trialMerchantRoutes from '../routes/trialMerchantRoutes';
import trialAdminRoutes from '../routes/trialAdminRoutes';

// ── Phase 1-3: Habit Engine + Intelligence + Growth Route Imports ──
import savingsInsightsRoutes from '../routes/savingsInsights';
import insightsRoutes from '../routes/insightsRoutes';
import rezScoreRoutes from '../routes/rezScoreRoutes';
import userRezScoreRoutes from '../routes/userRezScoreRoutes';
import instantRewardRoutes from '../routes/instantRewardRoutes';
import savingsGoalRoutes from '../routes/savingsGoalRoutes';
// merchantGrowthRoutes removed (BR-C1) — all /api/merchant/* is proxied to rez-merchant-service via nginx

// ── Section 8 & 9: Daily Check-In + Visit Streak Routes ──
import dailyCheckinRoutes from '../routes/dailyCheckinRoutes';
import visitStreakRoutes from '../routes/visitStreakRoutes';

// ── Sprint 5: Streak Shield + Profile Completion ──
import gamificationRoutes from '../routes/gamificationRoutes';
import profileCompletionRoutes from '../routes/profileCompletionRoutes';

// ── Sprint 6: Store Feed + Store Reviews ──
import storeFeedRoutes from '../routes/storeFeedRoutes';
import storeReviewRoutes from '../routes/storeReviewRoutes';

// ── Sprint 7: Group Buy + Merchant Payouts/Staff/Segments/Cohorts ──
import groupBuyRoutes from '../routes/groupBuyRoutes';
import merchantPayoutSprint7Routes from '../routes/merchantPayoutRoutes';

// ── Zero-Friction QR Check-In Routes ──
import qrCheckinRoutes from '../routes/qrCheckinRoutes';
import qrResolveRoutes from '../routes/qrResolveRoutes';

// ── Admin Route Imports ──
import {
  adminDashboardRoutes,
  adminOrdersRoutes,
  adminCoinRewardsRoutes,
  adminMerchantWalletsRoutes,
  adminAuthRoutes,
  adminUsersRoutes,
  adminMerchantsRoutes,
  adminWalletRoutes,
  adminCampaignsRoutes,
  adminUploadsRoutes,
  adminExperiencesRoutes,
  adminCategoriesRoutes,
  adminStoresRoutes,
  adminHomepageDealsRoutes,
  adminZoneVerificationsRoutes,
  adminOffersRoutes,
  adminLoyaltyRoutes,
  adminDoubleCampaignsRoutes,
  adminCoinDropsRoutes,
  adminVouchersRoutes,
  adminCouponsRoutes,
  adminTravelRoutes,
  adminSystemRoutes,
  adminChallengesRoutes,
  adminGameConfigRoutes,
  adminFeatureFlagsRoutes,
  adminAchievementsRoutes,
  adminGamificationStatsRoutes,
  adminDailyCheckinConfigRoutes,
  adminSpecialProgramsRoutes,
  adminEventsRoutes,
  adminEventCategoriesRoutes,
  adminEventRewardsRoutes,
  adminTournamentsRoutes,
  adminLearningContentRoutes,
  adminLeaderboardConfigRoutes,
  adminQuickActionRoutes,
  adminValueCardRoutes,
  adminWalletConfigRoutes,
  adminUserWalletsRoutes,
  adminGiftCardsRoutes,
  adminCoinGiftsRoutes,
  adminSurpriseCoinDropsRoutes,
  adminPartnerEarningsRoutes,
  adminReferralsRoutes,
  adminFlashSalesRoutes,
  adminHotspotAreasRoutes,
  adminBankOffersRoutes,
  adminUploadBillStoresRoutes,
  adminExclusiveZonesRoutes,
  adminSpecialProfilesRoutes,
  adminLoyaltyMilestonesRoutes,
  adminSupportRoutes,
  adminSupportConfigRoutes,
  adminFaqRoutes,
  adminNotificationMgmtRoutes,
  adminFraudReportsRoutes,
  adminMembershipRoutes,
  adminAdminUsersRoutes,
  adminEconomicsRoutes,
  adminActionsRoutes,
  adminDisputesRoutes,
  adminDeviceFingerprintRoutes,
  adminIntegrationsRoutes,
  adminInstitutionsRoutes,
  adminInstituteReferralsRoutes,
  adminRewardConfigRoutes,
  adminPayrollRoutes,
  adminHealthDeepRoutes,
  adminAggregatorMonitorRoutes,
  adminDlqRoutes,
  adminPlatformSettingsRoutes,
  adminAdsRoutes,
  adminCashbackRulesRoutes,
  adminPosBillsRoutes,
} from '../routes/admin';
import disputeRoutes from '../routes/disputeRoutes';
import integrationWebhookRoutes from '../routes/integrationWebhook';
import adminBonusZoneRoutes from '../routes/admin/bonusZone';
import adminModerationRoutes from '../routes/adminModerationRoutes';
import instituteReferralsRoutes from '../routes/instituteReferrals';
import adminOffersSectionRoutes from '../routes/admin/offersSectionConfig';
import adminStoreCollectionRoutes from '../routes/admin/storeCollectionConfig';
import adminPriveRoutes from '../routes/admin/priveAdmin';
import adminGoldPriceRoutes from '../routes/admin/goldPrice';
import adminMerchantLiabilityRoutes from '../routes/admin/merchantLiability';
import adminMallBrandsRoutes from '../routes/admin/mallBrands';
import adminCashStorePurchasesRoutes from '../routes/admin/cashStorePurchases';
import adminReviewRoutes from '../routes/admin/reviews';
import adminServiceAppointmentRoutes from '../routes/admin/serviceAppointments';
import adminBbpsRoutes from '../routes/admin/bbpsAdmin';
import adminAbTestRoutes from '../routes/admin/abTests';
import adminAnalyticsRoutes from '../routes/admin/analytics';
import adminBbpsHealthRoutes from '../routes/admin/bbpsHealth';
import featureFlagAdminRoutes from '../routes/admin/featureFlags';
import systemConfigAdminRoutes from '../routes/admin/systemConfig';
import adminOrchestratorRoutes from '../routes/admin/orchestratorRoutes';
import merchantPlansAdminRoutes from '../routes/admin/merchantPlans';
import platformStatsAdminRoutes from '../routes/admin/platformStats';
import adminFraudConfigRoutes from '../routes/admin/fraudConfig';
import adminCorporateRoutes from '../routes/admin/corporate';
import adminDeliveryConfigRoutes from '../routes/admin/deliveryConfig';
import adminMarketingAnalyticsRoutes from '../routes/admin/marketingAnalytics';
import adminMerchantCampaignRulesRoutes from '../routes/admin/merchantCampaignRules';
import adminAdCampaignRoutes from '../routes/admin/adCampaigns';
import bullboardRoutes from '../routes/admin/bullboard';
import adminOtaRoutes from '../routes/admin/otaAdmin';
import adminReactionsRoutes from '../routes/admin/reactions';

// ── Merchant Route Imports ──
// NOTE: Most /api/merchant/* is proxied by nginx to rez-merchant-service.
// Merchant auth (/api/merchant/auth/*) is handled HERE because rez-merchant-service
// does not yet have auth routes implemented. Auth routes are restored (BR-AUTH-1).
import merchantAuthRoutes from '../merchantroutes/auth';
import merchantRoutes from '../merchantroutes/merchants';
import merchantExportRoutes from '../merchantroutes/exports';
import merchantWebOrderRoutes from '../routes/merchant/webOrders';
import merchantSubscriptionRoutes from '../merchantroutes/subscription';
import merchantCoinDropRoutes from '../routes/merchant/coinDrops';
import merchantBrandedCoinRoutes from '../routes/merchant/brandedCoins';
import merchantEarningAnalyticsRoutes from '../routes/merchant/earningAnalytics';
import merchantCreatorAnalyticsRoutes from '../routes/merchant/creatorAnalytics';
import merchantSocialImpactRoutes from '../routes/merchant/socialImpact';
import merchantPatchTestRoutes from '../merchantroutes/patchTests';
import rezCapitalRoutes from '../merchantroutes/rezCapital';
import aovRewardsRoutes from '../merchantroutes/aovRewards';
import adBazaarSummaryRoutes from '../merchantroutes/adBazaarSummary';
import broadcastsRoutes from '../merchantroutes/broadcasts';
import giftCardsRoutes from '../merchantroutes/giftCards';
import merchantStampCardRoutes from '../merchantroutes/stampCards';
import loyaltyConfigRoutes from '../merchantroutes/loyaltyConfig';
import campaignTemplatesRoutes from '../merchantroutes/campaignTemplates';
import dailyActionsRoutes from '../merchantroutes/dailyActions';
import roiSummaryRoutes from '../merchantroutes/roiSummary';
import growthScoreRoutes from '../merchantroutes/growthScore';
import cpaBillingRoutes from '../merchantroutes/cpaBilling';

// ── Sprint 12 Route Imports ──
import inventoryRoutes from '../routes/inventoryRoutes';
import merchantStoreRoutes from '../routes/merchantStoreRoutes';

// ── Sprint 11 Route Imports ──
import invoiceRoutes from '../routes/invoiceRoutes';
// merchantDisputeSprintRoutes removed (BR-C1/BR-L1) — disputes fully handled by rez-merchant-service
import { sprint11SettingsRouter, sprint11AccountRouter } from '../routes/userSettingsRoutes';

// ── Sprint 10 Route Imports ──
import adminDashboardSprintRoutes from '../routes/adminDashboardRoutes';
import merchantExportSprintRoutes from '../routes/merchantExportRoutes';

// ── Sprint 14 Route Imports ──
import adminReviewStoreRoutes from '../routes/adminReviewStoreRoutes';
import adminBroadcastRoutes from '../routes/adminBroadcastRoutes';

// ── Sprint 9 Route Imports ──
import transactionHistoryRoutes from '../routes/transactionHistoryRoutes';
import userSubscriptionRoutes from '../routes/userSubscriptionRoutes';
import merchantBroadcastRoutes from '../routes/merchantBroadcastRoutes';
import userConsentRoutes from '../routes/userConsentRoutes';

// ── New P3 Scaffold Routes ──
import whatsappWebhookRoutes from '../routes/whatsappWebhookRoutes';
import webOrderingRoutes from '../routes/webOrderingRoutes';
import appConfigRoutes from '../routes/appConfig';
import salonRoutes from '../routes/salonRoutes';
import aiRoutes from '../routes/aiRoutes';
import appointmentRoutes from '../routes/appointmentRoutes';
import catalogRoutes from '../routes/catalogRoutes';
import merchantBillRoutes from '../routes/merchantBillRoutes';
import reconcileRoutes from '../routes/reconcileRoutes';
import whatsappRoutes from '../routes/whatsappRoutes';

// ────────────────────────────────────────────────────────────────────
// Register all routes
// ────────────────────────────────────────────────────────────────────

export function registerRoutes(app: Express): void {
  const API_PREFIX = process.env.API_PREFIX || '/api';
  const API_V1_PREFIX = `${API_PREFIX}/v1`;

  // ── SafeDeploy Health Check Routes (no rate limit, available early for k8s probes) ──
  app.use(safeDeployHealthRoutes);

  // ── Deprecation Header Middleware for unversioned routes ──
  app.use(`${API_PREFIX}/`, (req, res, next) => {
    if (!req.path.startsWith('/v')) {
      res.setHeader('X-API-Deprecated', 'Use /api/v1/ prefix. Unversioned routes will be removed in v2.');
    }
    next();
  });

  // ── Public Config Routes (no auth required) ──
  // Available at both /api/config and /api/v1/config
  app.use(`${API_PREFIX}/config`, appConfigRoutes);
  app.use(`${API_V1_PREFIX}/config`, appConfigRoutes);

  // ── User API Routes ──
  // Sprint 15 Rate Limit Tiers:
  //   generalLimiter  — 60 req/min per user — applied globally on API_PREFIX
  //   bulkLimiter     — 100 req/min per IP  — applied on feed/search/offers endpoints
  //   strictLimiter   — 10 req/min per IP   — applied on OTP + auth endpoints (inside authRoutes)
  app.use(API_PREFIX, generalLimiter); // Tier: general (60 req/min) — covers all user routes

  // Auth — Tier: strictLimiter (10 req/min) applied inside authRoutes per-handler
  app.use(`${API_PREFIX}/user/auth`, authRoutes);
  app.use(`${API_V1_PREFIX}/user/auth`, authRoutes);

  // Products & Categories — Tier: general (60 req/min via prefix-level generalLimiter)
  app.use(`${API_PREFIX}/products`, productRoutes);
  app.use(`${API_V1_PREFIX}/products`, productRoutes);
  app.use(`${API_PREFIX}/categories`, categoryRoutes);
  app.use(`${API_V1_PREFIX}/categories`, categoryRoutes);

  // Cart — Tier: general (60 req/min)
  app.use(`${API_PREFIX}/cart`, cartRoutes);
  app.use(`${API_V1_PREFIX}/cart`, cartRoutes);

  // Stores — Sprint 6: feed and review sub-routes MUST be mounted BEFORE the
  // general storeRoutes to prevent /:storeId wildcard from absorbing /feed,
  // /recent, and /:storeId/reviews paths.
  // Sprint 15: storeFeedRoutes uses bulkLimiter (100 req/min) — high-traffic read endpoint
  //
  // SAFE: non-overlapping sub-paths across all /api/stores mounts.
  //   consumerHomeRoutes  → /recent-stores, /recent, /coins/expiring
  //   storeRoutes         → /slug/:slug, /:id/staff, /:storeId/analytics,
  //                         /:storeId/metrics, /:storeId/reviews,
  //                         /:id/active-campaigns, /:id/upcoming-drops
  //   followerStatsRoutes → /:storeId/followers/count, /list, /analytics, /top
  //   storeGalleryRoutes  → /:storeId/gallery
  // consumerHomeRoutes is first to ensure /recent and /recent-stores are matched
  // before storeRoutes' /:id wildcard can absorb them.
  app.use(`${API_PREFIX}/stores`, consumerHomeRoutes);
  app.use(`${API_PREFIX}/stores/feed`, storeFeedRoutes);
  app.use(`${API_V1_PREFIX}/stores/feed`, storeFeedRoutes);
  app.use(`${API_PREFIX}/stores/:storeId/reviews`, storeReviewRoutes);
  app.use(`${API_V1_PREFIX}/stores/:storeId/reviews`, storeReviewRoutes);

  app.use(`${API_PREFIX}/stores`, storeRoutes);
  app.use(`${API_V1_PREFIX}/stores`, storeRoutes);
  app.use(`${API_PREFIX}`, storeShoppingRoutes); // /stores/:id/combos, /stores/:id/loyalty-program, /user/store-gift-cards
  app.use(`${API_PREFIX}/stores`, followerStatsRoutes);
  app.use(`${API_V1_PREFIX}/stores`, followerStatsRoutes);
  app.use(`${API_PREFIX}/follower-analytics`, authTokenMiddleware, followerAnalyticsRoutes);

  // Orders
  app.use(`${API_PREFIX}/orders`, orderRoutes);
  app.use(`${API_V1_PREFIX}/orders`, orderRoutes);
  app.use(`${API_PREFIX}/videos`, videoRoutes);
  app.use(`${API_PREFIX}/creators`, creatorRoutes);
  app.use(`${API_PREFIX}/ugc`, ugcRoutes);
  app.use(`${API_PREFIX}/articles`, articleRoutes);
  app.use(`${API_PREFIX}/projects`, projectRoutes);
  app.use(`${API_PREFIX}/earning-projects`, earningProjectsRoutes);
  app.use(`${API_PREFIX}/notifications`, notificationRoutes);
  app.use(`${API_PREFIX}/stock-notifications`, stockNotificationRoutes);
  app.use(`${API_PREFIX}/price-tracking`, priceTrackingRoutes);
  app.use(`${API_PREFIX}/reviews`, reviewRoutes);
  app.use(`${API_PREFIX}/favorites`, favoriteRoutes);
  app.use(`${API_PREFIX}/comparisons`, comparisonRoutes);
  app.use(`${API_PREFIX}/product-comparisons`, productComparisonRoutes);
  // BR-L3 FIX: analyticsRoutes intentionally mounted at both /analytics and /t (tracking shortlink).
  // /t is a shortlink for tracking pixels and third-party attribution — it records the same
  // events as /analytics but accepts bare GET params (utm_source, etc.) without a request body.
  app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
  app.use(`${API_PREFIX}/t`, analyticsRoutes);
  app.use(`${API_PREFIX}/recommendations`, recommendationRoutes);
  app.use(`${API_PREFIX}/wishlist`, wishlistRoutes);
  app.use(`${API_PREFIX}/sync`, syncRoutes);
  app.use(`${API_PREFIX}/location`, locationRoutes);
  app.use(`${API_PREFIX}/wallet`, walletRoutes);
  app.use(`${API_PREFIX}/wallet/transfer`, transferRoutes);
  app.use(`${API_PREFIX}/wallet/gift`, giftRoutes);
  app.use(`${API_PREFIX}/wallet/gift-cards`, giftCardRoutes);
  app.use(`${API_PREFIX}/wallet/split`, billSplitRoutes);
  app.use(`${API_PREFIX}/consumer/khata`, consumerKhataRoutes);
  app.use(`${API_PREFIX}/consumer/articles`, consumerArticleRoutes);
  // Three routers share the /api/offers prefix — paths are non-overlapping:
  //   offerCommentRoutes → /commentable, /comments/*, /:offerId/comments*
  //   offerRoutes        → /featured, /trending, /search, /category/:id, /store/:id, /:id/redeem, etc.
  //   offersRoutes       → /bank, /bank/:id, /exclusive, /exclusive/:id  (Sprint 15, mounted below)
  app.use(`${API_PREFIX}/offers`, offerCommentRoutes);
  app.use(`${API_PREFIX}/offers`, offerRoutes);
  app.use(`${API_PREFIX}/zones`, zoneVerificationRoutes);
  app.use(`${API_PREFIX}/student`, studentRoutes);
  app.use(`${API_PREFIX}/campus`, campusPartnerRoutes);
  app.use(`${API_PREFIX}/offer-categories`, offerCategoryRoutes);
  app.use(`${API_PREFIX}/hero-banners`, heroBannerRoutes);
  app.use(`${API_PREFIX}/whats-new`, whatsNewRoutes);
  app.use(`${API_PREFIX}/vouchers`, voucherRoutes);
  app.use(`${API_PREFIX}/stamps`, stampRoutes); // Consumer stamp card API: earn, list, redeem
  app.use(`${API_PREFIX}/addresses`, addressRoutes);
  app.use(`${API_PREFIX}/payment-methods`, paymentMethodRoutes);
  // BR-M2 FIX: Legacy path kept for backward compatibility during client migration.
  // New canonical path is /api/user/settings (mounted at Sprint 11 block below).
  // A Deprecation header is injected here so API consumers know to migrate.
  // Remove this mount once all clients have migrated to /api/user/settings.
  app.use(
    `${API_PREFIX}/user-settings`,
    (req, res, next) => {
      res.set('Deprecation', 'true');
      res.set(
        'Link',
        `<${req.baseUrl.replace('/user-settings', '/user/settings')}${req.path}>; rel="successor-version"`,
      );
      res.set('Sunset', 'Sat, 01 Jan 2028 00:00:00 GMT');
      next();
    },
    userSettingsRoutes,
  );
  app.use(`${API_PREFIX}/achievements`, achievementRoutes);
  app.use(`${API_PREFIX}/activities`, activityRoutes);
  app.use(`${API_PREFIX}/payment`, paymentRoutes);
  app.use(`${API_PREFIX}/store-payment`, storePaymentRoutes);
  app.use(`${API_PREFIX}/wallets/external`, externalWalletRoutes);
  app.use(`${API_PREFIX}/stock`, stockRoutes);
  app.use(`${API_PREFIX}/social-media`, socialMediaRoutes);
  app.use(`${API_PREFIX}/security`, securityRoutes);
  app.use(`${API_PREFIX}/events`, eventRoutes);
  app.use(`${API_PREFIX}/referral`, referralRoutes);
  app.use(`${API_PREFIX}/user/profile`, profileRoutes);
  app.use(`${API_PREFIX}/user/rez-score`, userRezScoreRoutes);
  app.use(`${API_PREFIX}/user/boot`, userBootRoutes);
  app.use(`${API_PREFIX}/games`, gameRoutes);
  app.use(`${API_PREFIX}/leaderboard`, leaderboardRoutes);
  app.use(`${API_PREFIX}/streak`, streakRoutes);
  app.use(`${API_PREFIX}/shares`, shareRoutes);
  app.use(`${API_PREFIX}/photos`, photoUploadRoutes);
  // BR-C2 fix: Consumer poll router (no admin mutation endpoints exposed here)
  app.use(`${API_PREFIX}/polls`, pollRoutes);
  app.use(`${API_PREFIX}/tournaments`, tournamentRoutes);
  app.use(`${API_PREFIX}/programs`, programRoutes);
  app.use(`${API_PREFIX}/special-programs`, specialProgramRoutes);
  app.use(`${API_PREFIX}/sponsors`, sponsorRoutes);
  app.use(`${API_PREFIX}/surveys`, surveyRoutes);
  app.use(`${API_PREFIX}/user/verifications`, verificationRoutes);
  app.use(`${API_PREFIX}/scratch-cards`, scratchCardRoutes);
  app.use(`${API_PREFIX}/coupons`, couponRoutes);
  app.use(`${API_PREFIX}/merchants`, offerAutomationRoutes);
  app.use(`${API_PREFIX}/razorpay`, razorpayRoutes);
  // webhookRoutes handles /razorpay, /stripe, /rendez — payment-provider callbacks.
  app.use(`${API_PREFIX}/webhooks`, webhookRoutes);
  app.use(`${API_PREFIX}/webhook`, aggregatorWebhookRoutes);
  app.use(`${API_PREFIX}/support`, supportRoutes);
  app.use(`${API_PREFIX}/copilot`, copilotRoutes);
  app.use(`${API_PREFIX}/faqs`, faqRoutes);
  app.use(`${API_PREFIX}/messages`, messageRoutes);
  app.use(`${API_PREFIX}/cashback`, cashbackRoutes);
  app.use(`${API_PREFIX}/loyalty`, loyaltyRoutes);
  app.use(`${API_PREFIX}/user-products`, userProductRoutes);
  app.use(`${API_PREFIX}/discounts`, discountRoutes);
  app.use(`${API_PREFIX}/store-vouchers`, storeVoucherRoutes);
  app.use(`${API_PREFIX}/outlets`, outletRoutes);
  app.use(`${API_PREFIX}/flash-sales`, flashSaleRoutes);
  app.use(`${API_PREFIX}/subscriptions`, subscriptionRoutes);
  app.use(`${API_PREFIX}/promo-codes`, promoCodeRoutes);
  app.use(`${API_PREFIX}/billing`, billingRoutes);
  app.use(`${API_PREFIX}/bills`, billRoutes);
  app.use(`${API_PREFIX}/bill-payments`, billPaymentRoutes);
  app.use(`${API_PREFIX}/gamification`, unifiedGamificationRoutes);
  // Section 8: Daily check-in — mounted under /api/gamification so the full
  // paths become /api/gamification/daily-checkin and /api/gamification/daily-checkin/status
  app.use(`${API_PREFIX}/gamification/daily-checkin`, dailyCheckinRoutes);
  // Section 9: Visit streak — /api/users/visit-streak
  app.use(`${API_PREFIX}/users/visit-streak`, visitStreakRoutes);
  // Sprint 5: Streak Shield — /api/gamification/streak/use-shield + /api/gamification/streak/status
  app.use(`${API_PREFIX}/gamification`, gamificationRoutes);
  // Sprint 5: Profile Completion — /api/user/profile-completion
  app.use(`${API_PREFIX}/user/profile-completion`, profileCompletionRoutes);
  // Zero-Friction QR Check-In — /api/qr-checkin
  app.use(`${API_PREFIX}/qr-checkin`, qrCheckinRoutes);

  // Phase I — Unified QR scanner: GET /api/qr/resolve + POST /api/qr/shortlinks
  app.use(`${API_PREFIX}/qr`, qrResolveRoutes);
  app.use(`${API_PREFIX}/social`, activityFeedRoutes);
  // Sprint 8: User activity feed (friend activity + own activity)
  app.use(`${API_PREFIX}/user/activity-feed`, userActivityFeedRoutes);
  // Sprint 8: User notifications (paginated list + read endpoints)
  app.use(`${API_PREFIX}/user/notifications`, userNotificationRoutes);

  // ── Sprint 9: Transaction History + User Subscription ──
  app.use(`${API_PREFIX}/user/transactions`, transactionHistoryRoutes);
  app.use(`${API_PREFIX}/user/subscription`, userSubscriptionRoutes);

  // ── Phase D: DPDP consent ledger ──
  // GET /api/user/consent          — current state per category
  // POST /api/user/consent         — grant / withdraw a category
  // GET /api/user/consent/history  — audit trail (append-only)
  app.use(`${API_PREFIX}/user/consent`, userConsentRoutes);

  // ── Sprint 11: User Settings + Account Management ──
  app.use(`${API_PREFIX}/user/settings`, sprint11SettingsRouter);
  app.use(`${API_PREFIX}/user/account`, sprint11AccountRouter);
  app.use(`${API_PREFIX}/social-proof`, socialProofRoutes);
  app.use(`${API_PREFIX}/partner`, partnerRoutes);
  app.use(`${API_PREFIX}/earnings`, earningsRoutes);
  app.use(`${API_PREFIX}/learning`, learningRoutes);
  app.use(`${API_PREFIX}/menu`, menuRoutes);
  app.use(`${API_PREFIX}/table-bookings`, tableBookingRoutes);
  app.use(`${API_PREFIX}/table-sessions`, tableSessionRoutes);
  app.use(`${API_PREFIX}/service-appointments`, serviceAppointmentRoutes);
  app.use(`${API_PREFIX}/blocked-slots`, blockedSlotRoutes);
  app.use(`${API_PREFIX}/automation-rules`, automationRuleRoutes);
  app.use(`${API_PREFIX}/consultation-forms`, consultationFormRoutes);
  app.use(`${API_PREFIX}/calendar-sync`, calendarSyncRoutes);
  app.use(`${API_PREFIX}/staff-time`, staffTimeRoutes);
  app.use(`${API_PREFIX}/deposit-policy`, depositPolicyRoutes);
  app.use(`${API_PREFIX}/cancellation-policy`, cancellationPolicyRoutes);
  app.use(`${API_PREFIX}/staff-commissions`, staffCommissionRoutes);
  app.use(`${API_PREFIX}/treatment-rooms`, treatmentRoomRoutes);
  app.use(`${API_PREFIX}/class-schedules`, classScheduleRoutes);
  app.use(`${API_PREFIX}/service-packages`, servicePackageRoutes);
  app.use(`${API_PREFIX}/waitlist`, waitlistRoutes);
  app.use(`${API_PREFIX}/service-categories`, serviceCategoryRoutes);
  app.use(`${API_PREFIX}/services`, serviceRoutes);
  app.use(`${API_PREFIX}/home-services`, homeServicesRoutes);
  app.use(`${API_PREFIX}/travel-services`, travelServicesRoutes);
  app.use(`${API_PREFIX}/travel-payment`, travelPaymentRoutes);
  app.use(`${API_PREFIX}/travel-webhooks`, travelWebhookRoutes);
  // Hotel reviews — shared router mounted at two prefixes:
  //   /hotel-reviews  → submit, list, stats, respond, helpful, can-review
  //   /hotels         → /:hotelId/rating (rating summary)
  app.use(`${API_PREFIX}/hotel-reviews`, hotelReviewRoutes);
  app.use(`${API_PREFIX}/hotels`, hotelReviewRoutes);
  app.use(`${API_PREFIX}/financial-services`, financialServicesRoutes);
  app.use(`${API_PREFIX}/gold`, goldSavingsRoutes);
  app.use(`${API_PREFIX}/wallet/gold-sip`, goldSipRoutes);
  app.use(`${API_PREFIX}/fitness`, fitnessRoutes);
  app.use(`${API_PREFIX}/service-bookings`, serviceBookingRoutes);
  app.use(`${API_PREFIX}/consumer/patch-tests`, patchTestRoutes);
  app.use(`${API_PREFIX}/consultations`, consultationRoutes);
  app.use(`${API_PREFIX}/health-records`, healthRecordRoutes);
  app.use(`${API_PREFIX}/emergency`, emergencyRoutes);
  app.use(`${API_PREFIX}/store-visits`, storeVisitRoutes);
  app.use(`${API_PREFIX}/homepage`, homepageRoutes);
  app.use(`${API_PREFIX}/homepage`, personaHomepageRoutes); // persona-specific sections (campus-trending, lunch-deals, etc.)
  app.use(`${API_PREFIX}/persona`, personaRoutes);
  app.use(`${API_PREFIX}/home`, homeSnapshotRoutes);
  app.use(`${API_PREFIX}/home`, liveContextRoutes);
  app.use(`${API_PREFIX}/offers`, offersRoutes); // Sprint 15: bulkLimiter (100 req/min) recommended for this geo-query endpoint
  app.use(`${API_PREFIX}/stats`, statsRoutes);
  app.use(`${API_PREFIX}/platform`, platformRoutes);
  app.use(`${API_PREFIX}/explore`, exploreRoutes);
  // ── Consumer homepage endpoints ──
  // Dual-mounted during migration. /api/stores is the legacy path (mounted above
  // at line ~508); /api/user is the canonical path going forward.
  // Remove the /api/stores mount after all clients have migrated to /api/user.
  // consumerHomeRoutes handles /recent-stores, /recent, /coins/expiring — no
  // overlap with other /api/user/* sub-routes registered in this file.
  app.use(`${API_PREFIX}/user`, consumerHomeRoutes);

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    app.use(`${API_PREFIX}/test`, testRoutes);
  }
  app.use(`${API_PREFIX}/disputes`, disputeRoutes);

  // ── Sprint 7: Group Buy ──
  app.use(`${API_PREFIX}/group-buy`, groupBuyRoutes);

  // ── P3 Scaffold Routes ──
  app.use(`${API_PREFIX}/whatsapp`, whatsappWebhookRoutes);
  app.use(`${API_PREFIX}/web-ordering`, webOrderingRoutes);

  // ── Salon / SPA Booking Routes ──
  app.use(`${API_PREFIX}/salon`, salonRoutes);

  // ── P0-2: Previously unregistered route files ──
  app.use(`${API_PREFIX}/ai`, aiRoutes);
  app.use(`${API_PREFIX}/appointments`, appointmentRoutes);
  app.use(`${API_PREFIX}/catalog`, catalogRoutes);
  app.use(`${API_PREFIX}/merchant-bill`, merchantBillRoutes);
  app.use(`${API_PREFIX}/reconcile`, reconcileRoutes);
  app.use(`${API_PREFIX}/whatsapp`, whatsappRoutes);

  // ── Admin Routes ──
  // Consumer-facing ad endpoints — serve, impression, click
  app.use(`${API_PREFIX}/ads`, adsRoutes);

  app.use(`${API_PREFIX}/admin`, adminLimiter); // Sprint 3: 60 req/IP/min across all admin endpoints
  app.use(`${API_PREFIX}/admin`, adminAuditMiddleware);
  // Global admin auth — applied before all admin routes except /auth (login/2FA).
  // This ensures every admin endpoint is protected even if a route file omits requireAdmin.
  app.use(`${API_PREFIX}/admin`, (req, res, next) => {
    if (req.path.startsWith('/auth')) return next(); // login/refresh/2FA — public
    return authTokenMiddleware(req, res, next);
  });
  app.use(`${API_PREFIX}/admin`, (req, res, next) => {
    if (req.path.startsWith('/auth')) return next();
    return requireAdminMiddleware(req, res, next);
  });
  app.use(`${API_PREFIX}/admin/explore`, adminExploreRoutes);
  app.use(`${API_PREFIX}/admin/creators`, adminCreatorRoutes);
  app.use(`${API_PREFIX}/admin/auth`, adminAuthRoutes);
  app.use(`${API_PREFIX}/admin/dashboard`, adminDashboardRoutes);
  // BR-C2 fix: Replaced shared pollRoutes instance with dedicated adminPollRoutes (ROUTE-05)
  app.use(`${API_PREFIX}/admin/polls`, adminPollRoutes);
  app.use(`${API_PREFIX}/admin/orders`, adminOrdersRoutes);
  app.use(`${API_PREFIX}/admin/coin-rewards`, adminCoinRewardsRoutes);
  app.use(`${API_PREFIX}/admin/merchant-wallets`, adminMerchantWalletsRoutes);
  // FIX: Sprint 10 admin dashboard routes (GET /stats, GET /users, GET /fraud-queue,
  // POST /users/:id/suspend|clear-fraud-flag|reset-streak, GET /revenue, etc.) must be
  // registered BEFORE adminUsersRoutes (mounted at /admin/users) to prevent the specific
  // /admin/users mount from shadowing the bare /admin/users path in adminDashboardSprintRoutes.
  // Routes that overlap (GET /users, POST /users/:id/suspend) will be served by
  // adminDashboardSprintRoutes first; adminUsersRoutes handles all other /:id/* sub-paths.
  app.use(`${API_PREFIX}/admin`, adminDashboardSprintRoutes);
  app.use(`${API_PREFIX}/admin/users`, adminUsersRoutes);
  app.use(`${API_PREFIX}/admin/merchants`, adminMerchantsRoutes);
  app.use(`${API_PREFIX}/admin/wallet`, adminWalletRoutes);
  app.use(`${API_PREFIX}/admin/campaigns`, adminCampaignsRoutes);
  app.use(`${API_PREFIX}/admin/merchant-campaign-rules`, adminMerchantCampaignRulesRoutes);
  app.use(`${API_PREFIX}/admin/bonus-zone`, adminBonusZoneRoutes);
  app.use(`${API_PREFIX}/admin/offers-sections`, adminOffersSectionRoutes);
  app.use(`${API_PREFIX}/admin/store-collections`, adminStoreCollectionRoutes);
  app.use(`${API_PREFIX}/admin/prive`, adminPriveRoutes);
  app.use(`${API_PREFIX}/admin/uploads`, adminUploadsRoutes);
  app.use(`${API_PREFIX}/admin/experiences`, adminExperiencesRoutes);
  app.use(`${API_PREFIX}/admin/categories`, adminCategoriesRoutes);
  // FIX: Sprint 14 review/store moderation routes (GET /reviews, GET /stores,
  // PATCH /reviews/bulk-approve, PATCH /reviews/:id, PATCH /stores/:id/status) must be
  // registered BEFORE adminStoresRoutes (/admin/stores) and adminReviewRoutes (/admin/reviews)
  // to prevent those specific mounts from shadowing the GET /stores and GET /reviews paths.
  app.use(`${API_PREFIX}/admin`, adminReviewStoreRoutes);
  app.use(`${API_PREFIX}/admin/stores`, adminStoresRoutes);
  app.use(`${API_PREFIX}/admin/homepage-deals`, adminHomepageDealsRoutes);
  app.use(`${API_PREFIX}/admin/zone-verifications`, adminZoneVerificationsRoutes);
  app.use(`${API_PREFIX}/admin/offers`, adminOffersRoutes);
  app.use(`${API_PREFIX}/admin/loyalty`, adminLoyaltyRoutes);
  app.use(`${API_PREFIX}/admin/double-campaigns`, adminDoubleCampaignsRoutes);
  app.use(`${API_PREFIX}/admin/coin-drops`, adminCoinDropsRoutes);
  app.use(`${API_PREFIX}/admin/vouchers`, adminVouchersRoutes);
  app.use(`${API_PREFIX}/admin/coupons`, adminCouponsRoutes);
  app.use(`${API_PREFIX}/admin/travel`, adminTravelRoutes);
  app.use(`${API_PREFIX}/admin/system`, adminSystemRoutes);
  app.use(`${API_PREFIX}/admin/ab-tests`, adminAbTestRoutes);
  app.use(`${API_PREFIX}/admin/analytics`, adminAnalyticsRoutes);
  // SAFE: two routers share /api/admin/bbps with no overlapping paths.
  // adminBbpsHealthRoutes → GET /health, POST /seed-test-data
  // adminBbpsRoutes       → GET /providers, POST /providers, PUT /providers/:id,
  //                         PATCH /providers/:id/toggle, GET /transactions,
  //                         GET /stats, POST /transactions/:id/refund
  // Health router is mounted first so /health is always reachable.
  app.use(`${API_PREFIX}/admin/bbps`, adminBbpsHealthRoutes);
  app.use(`${API_PREFIX}/admin/challenges`, adminChallengesRoutes);
  app.use(`${API_PREFIX}/admin/game-config`, adminGameConfigRoutes);
  app.use(`${API_PREFIX}/admin/tournaments`, adminTournamentsRoutes);
  app.use(`${API_PREFIX}/admin/feature-flags`, adminFeatureFlagsRoutes);
  app.use(`${API_PREFIX}/config/feature-flags`, featureFlagConfigRoutes);
  app.use(`${API_PREFIX}/admin/achievements`, adminAchievementsRoutes);
  app.use(`${API_PREFIX}/admin/gamification-stats`, adminGamificationStatsRoutes);
  app.use(`${API_PREFIX}/admin/daily-checkin-config`, adminDailyCheckinConfigRoutes);
  app.use(`${API_PREFIX}/admin/special-programs`, adminSpecialProgramsRoutes);
  app.use(`${API_PREFIX}/admin/events`, adminEventsRoutes);
  app.use(`${API_PREFIX}/admin/event-categories`, adminEventCategoriesRoutes);
  app.use(`${API_PREFIX}/admin/event-rewards`, adminEventRewardsRoutes);
  app.use(`${API_PREFIX}/admin/learning-content`, adminLearningContentRoutes);
  app.use(`${API_PREFIX}/admin/leaderboard/configs`, adminLeaderboardConfigRoutes);
  app.use(`${API_PREFIX}/admin/quick-actions`, adminQuickActionRoutes);
  app.use(`${API_PREFIX}/admin/value-cards`, adminValueCardRoutes);
  app.use(`${API_PREFIX}/admin/wallet-config`, adminWalletConfigRoutes);
  app.use(`${API_PREFIX}/admin/reward-config`, adminRewardConfigRoutes);
  app.use(`${API_PREFIX}/admin/user-wallets`, adminUserWalletsRoutes);
  app.use(`${API_PREFIX}/admin/gift-cards`, adminGiftCardsRoutes);
  app.use(`${API_PREFIX}/admin/coin-gifts`, adminCoinGiftsRoutes);
  app.use(`${API_PREFIX}/admin/surprise-coin-drops`, adminSurpriseCoinDropsRoutes);
  app.use(`${API_PREFIX}/admin/partner-earnings`, adminPartnerEarningsRoutes);
  app.use(`${API_PREFIX}/admin/gold`, adminGoldPriceRoutes);
  app.use(`${API_PREFIX}/admin/referrals`, adminReferralsRoutes);
  app.use(`${API_PREFIX}/admin/flash-sales`, adminFlashSalesRoutes);
  app.use(`${API_PREFIX}/admin/hotspot-areas`, adminHotspotAreasRoutes);
  app.use(`${API_PREFIX}/admin/bank-offers`, adminBankOffersRoutes);
  app.use(`${API_PREFIX}/admin/upload-bill-stores`, adminUploadBillStoresRoutes);
  app.use(`${API_PREFIX}/admin/bbps`, adminBbpsRoutes);
  app.use(`${API_PREFIX}/admin/exclusive-zones`, adminExclusiveZonesRoutes);
  app.use(`${API_PREFIX}/admin/special-profiles`, adminSpecialProfilesRoutes);
  app.use(`${API_PREFIX}/admin/loyalty-milestones`, adminLoyaltyMilestonesRoutes);
  app.use(`${API_PREFIX}/admin/support-config`, adminSupportConfigRoutes);
  // FIX: /support/faq must be mounted BEFORE /support to prevent Express from
  // attempting to match the /faq segment against any future wildcard added to
  // adminSupportRoutes. More-specific paths must always be registered first.
  app.use(`${API_PREFIX}/admin/support/faq`, adminFaqRoutes);
  app.use(`${API_PREFIX}/admin/support`, adminSupportRoutes);
  app.use(`${API_PREFIX}/admin/notifications`, adminNotificationMgmtRoutes);
  app.use(`${API_PREFIX}/admin/moderation`, adminModerationRoutes);
  app.use(`${API_PREFIX}/admin/fraud-reports`, adminFraudReportsRoutes);
  app.use(`${API_PREFIX}/admin/fraud-config`, adminFraudConfigRoutes);
  app.use(`${API_PREFIX}/admin/membership`, adminMembershipRoutes);
  app.use(`${API_PREFIX}/admin/admin-users`, adminAdminUsersRoutes);
  app.use(`${API_PREFIX}/admin/merchant-liability`, adminMerchantLiabilityRoutes);
  app.use(`${API_PREFIX}/admin/economics`, adminEconomicsRoutes);
  app.use(`${API_PREFIX}/admin/mall/brands`, adminMallBrandsRoutes);
  app.use(`${API_PREFIX}/admin/cashstore/purchases`, adminCashStorePurchasesRoutes);
  app.use(`${API_PREFIX}/admin/reviews`, adminReviewRoutes);
  app.use(`${API_PREFIX}/admin/reactions`, adminReactionsRoutes);
  app.use(`${API_PREFIX}/admin/service-appointments`, adminServiceAppointmentRoutes);
  app.use(`${API_PREFIX}/admin/admin-actions`, adminActionsRoutes);
  app.use(`${API_PREFIX}/admin/disputes`, adminDisputesRoutes);
  app.use(`${API_PREFIX}/admin/devices`, adminDeviceFingerprintRoutes);
  app.use(`${API_PREFIX}/admin/integrations`, adminIntegrationsRoutes);
  app.use(`${API_PREFIX}/admin/institutions`, adminInstitutionsRoutes);
  app.use(`${API_PREFIX}/admin/institute-referrals`, adminInstituteReferralsRoutes);
  app.use(`${API_PREFIX}/admin/payroll`, adminPayrollRoutes);
  app.use(`${API_PREFIX}/admin/health-deep`, authTokenMiddleware, requireAdminMiddleware, adminHealthDeepRoutes);
  app.use(`${API_PREFIX}/admin`, adminAggregatorMonitorRoutes);

  // ── Sprint 14: Admin Broadcast (non-conflicting paths: /broadcast/send, /broadcasts) ──
  app.use(`${API_PREFIX}/admin`, adminBroadcastRoutes);

  app.use(`${API_PREFIX}/admin/trials`, trialAdminRoutes);
  // NOTE: featureFlagAdminRoutes is already mounted at /admin/feature-flags above (line ~761).
  // The bare /admin mount here was a duplicate registration of the same router — removed.
  app.use(`${API_PREFIX}/admin`, systemConfigAdminRoutes);
  app.use(`${API_PREFIX}/admin/orchestrator`, adminOrchestratorRoutes);

  // BullBoard — queue monitoring dashboard (admin-only)
  // Rate-limited + audited same as all other /api/admin/* endpoints
  app.use(
    `${API_PREFIX}/admin`,
    adminLimiter,
    authTokenMiddleware,
    requireAdminMiddleware,
    adminAuditMiddleware,
    bullboardRoutes,
  );
  // DLQ admin API — programmatic dead-letter queue management (admin auth required)
  app.use(`${API_PREFIX}/admin/dlq`, authTokenMiddleware, requireAdminMiddleware, adminDlqRoutes);
  app.use(`${API_PREFIX}/admin`, merchantPlansAdminRoutes);
  // platformStatsAdminRoutes defines router.get('/') — must be mounted at a specific prefix,
  // not bare /api/admin, to avoid creating GET /api/admin/ which shadows other admin routers.
  app.use(`${API_PREFIX}/admin/platform-stats`, platformStatsAdminRoutes);
  app.use(`${API_PREFIX}/admin`, adminCorporateRoutes);
  app.use(`${API_PREFIX}/admin/delivery-config`, adminDeliveryConfigRoutes);
  app.use(`${API_PREFIX}/admin/settings`, adminPlatformSettingsRoutes);
  app.use(`${API_PREFIX}/admin/ads`, adminAdsRoutes);
  app.use(`${API_PREFIX}/admin/cashback-rules`, adminCashbackRulesRoutes);
  // P2-C2: admin POS visibility — admins can now list/inspect PosBills
  // across the platform, see per-merchant POS history, and pull
  // platform-wide revenue stats that include the POS channel.
  app.use(`${API_PREFIX}/admin/pos`, adminPosBillsRoutes);
  app.use(`${API_PREFIX}/admin/ad-campaigns`, adminAdCampaignRoutes);
  app.use(`${API_PREFIX}/admin/marketing/analytics`, adminMarketingAnalyticsRoutes);
  app.use(`${API_PREFIX}/admin/ota`, adminOtaRoutes);

  // Integration webhook (public — secured by HMAC signature)
  app.use(`${API_PREFIX}/integrations`, integrationWebhookRoutes);

  // Admin Engagement Config Routes (inline router)
  const engagementConfigRouter = EngagementConfigRouter();
  engagementConfigRouter.get('/', getAllConfigs);
  engagementConfigRouter.patch('/:action', updateConfig);
  engagementConfigRouter.post('/:action/campaign', setCampaign);
  app.use(`${API_PREFIX}/admin/engagement-config`, authTokenMiddleware, requireAdminMiddleware, engagementConfigRouter);

  // ── Public / Campaign / Feature Routes ──
  app.use(`${API_PREFIX}/campaigns`, campaignRoutes);
  app.use(`${API_PREFIX}/recharge`, rechargeRoutes);
  app.use(`${API_PREFIX}/bonus-zone`, bonusZoneRoutes);
  app.use(`${API_PREFIX}/institute-referrals`, instituteReferralsRoutes);
  app.use(`${API_PREFIX}/lock-deals`, lockDealRoutes);
  app.use(`${API_PREFIX}/play-earn`, playEarnRoutes);
  app.use(`${API_PREFIX}/experiences`, experienceRoutes);
  app.use(`${API_PREFIX}/experience-rewards`, experienceRewardRoutes);
  app.use(`${API_PREFIX}/content`, contentRoutes);
  app.use(`${API_PREFIX}/earn`, earnRoutes);

  // ── REZ TRY (Trial) Routes ──
  app.use(`${API_PREFIX}/try`, trialRoutes);

  app.use(`${API_PREFIX}/search`, searchRoutes);
  app.use(`${API_PREFIX}/mall`, mallRoutes);
  app.use(`${API_PREFIX}/mall/affiliate`, mallAffiliateRoutes);
  app.use(`${API_PREFIX}/cashstore`, cashStoreRoutes);
  app.use(`${API_PREFIX}/cashstore/affiliate`, cashStoreAffiliateRoutes);
  app.use(`${API_PREFIX}/prive`, priveRoutes);
  app.use(`${API_PREFIX}/prive`, priveInviteRoutes);
  app.use(`${API_PREFIX}/prive/campaigns`, priveCampaignRoutes);
  app.use(`${API_PREFIX}/insurance`, insuranceRoutes);
  app.use(`${API_PREFIX}/stores`, storeGalleryRoutes);
  app.use(`${API_PREFIX}/products`, productGalleryRoutes);

  // ── Merchant API Routes ──
  // NOTE: nginx routes most /api/merchant/* to merchant-service.
  // Only routes explicitly configured in nginx (invoices, qr, subscription) reach this monolith.
  // Disputes are now fully handled by rez-merchant-service at /disputes.

  // ACTIVE: /api/merchants (no trailing slash) falls to nginx catch-all → monolith
  app.use(`${API_PREFIX}/merchants`, merchantRoutes);

  // MIGRATED: disputes now served by rez-merchant-service (/disputes route).
  // Nginx must no longer explicitly route /api/merchant/disputes to this monolith.
  // app.use('/api/merchant/disputes', merchantDisputeRoutes);           // REMOVED
  // app.use('/api/merchant/merchant-disputes', merchantDisputeSprintRoutes); // REMOVED

  // ACTIVE: nginx routes /api/merchant/qr/* explicitly → monolith (also has /marketing/templates)
  app.use(`${API_PREFIX}/merchant`, merchantQrRoutes);

  // ACTIVE: nginx routes /api/merchant/invoices explicitly → monolith
  app.use(`${API_PREFIX}/merchant/invoices`, invoiceRoutes);

  // ── Merchant API routes (/api/merchant/*) ──────────────────────────────────────
  // IMPORTANT: All /api/merchant/* routes are handled by rez-merchant-service.
  // nginx routes /api/merchant/* → rez-merchant-service:4005
  // EXCEPTION: /api/merchant/auth/* is routed to this monolith (BR-AUTH-1).
  // Active merchant routes on THIS monolith (nginx passes these through explicitly or
  // they have no equivalent in rez-merchant-service):
  //   /api/merchant/auth/*           — merchantAuthRoutes (THIS MONOLITH — auth lives here)
  //   /api/merchant/qr/*             — merchantQrRoutes (mounted above)
  //   /api/merchant/invoices          — invoiceRoutes (mounted above)
  //   /api/merchant/web-orders        — merchantWebOrderRoutes
  //   /api/merchant/subscription      — merchantSubscriptionRoutes
  //   /api/merchant/documents         — merchantExportRoutes (tally/gst/payroll — distinct from rez-merchant-service /exports)
  //   /api/merchant/patch-tests       — merchantPatchTestRoutes
  //   /api/merchant (coinDrops)       — merchantCoinDropRoutes
  //   /api/merchant (brandedCoins)    — merchantBrandedCoinRoutes
  //   /api/merchant (earningAnalytics)— merchantEarningAnalyticsRoutes
  //   /api/merchant/stores (creator)  — merchantCreatorAnalyticsRoutes
  //   /api/merchant/programs/social-impact — merchantSocialImpactRoutes
  //   /api/merchant/rez-capital       — rezCapitalRoutes
  //   /api/merchant/aov-rewards       — aovRewardsRoutes
  //   /api/merchant/adbazaar-summary  — adBazaarSummaryRoutes
  //   /api/merchant/trials            — trialMerchantRoutes
  //   /api/merchant (inventory)       — inventoryRoutes
  //   /api/merchant/multi-stores      — merchantStoreRoutes
  //   /api/merchant (exportSprint)    — merchantExportSprintRoutes
  //   /api/merchant (broadcast/send)  — merchantBroadcastRoutes
  //   /api/merchant (payoutSprint7)   — merchantPayoutSprint7Routes
  //   /api/merchant/broadcasts        — broadcastsRoutes
  //   /api/merchant/gift-cards        — giftCardsRoutes
  //   /api/merchant/loyalty-config    — loyaltyConfigRoutes
  //   /api/merchant/campaign-templates — campaignTemplatesRoutes (Phase C)
  // Do NOT add new /api/merchant/* routes here. Add them in rez-merchant-service.
  // ──────────────────────────────────────────────────────────────────────────────

  // BR-AUTH-1: Merchant auth lives on this monolith (merchant service has no auth routes)
  app.use(`${API_PREFIX}/merchant/auth`, merchantAuthRoutes);

  app.use(`${API_PREFIX}/merchant/web-orders`, merchantWebOrderRoutes);
  app.use(`${API_PREFIX}/merchant/subscription`, merchantSubscriptionRoutes);
  // rez-merchant-service /exports handles simple CSV exports; monolith /documents handles tally/gst/payroll/generate/download — different endpoints
  app.use(`${API_PREFIX}/merchant/documents`, merchantExportRoutes);
  app.use(`${API_PREFIX}/merchant/patch-tests`, merchantPatchTestRoutes);
  // rez-merchant-service has no coinDrops, brandedCoins, earningAnalytics, creatorAnalytics, or socialImpact routes
  app.use(`${API_PREFIX}/merchant`, merchantCoinDropRoutes);
  app.use(`${API_PREFIX}/merchant`, merchantBrandedCoinRoutes);
  app.use(`${API_PREFIX}/merchant`, merchantEarningAnalyticsRoutes);
  app.use(`${API_PREFIX}/merchant/stores`, merchantCreatorAnalyticsRoutes);
  app.use(`${API_PREFIX}/merchant/programs/social-impact`, merchantSocialImpactRoutes);
  // rez-merchant-service has no rez-capital, aov-rewards, or adbazaar-summary routes
  app.use(`${API_PREFIX}/merchant/rez-capital`, rezCapitalRoutes);
  app.use(`${API_PREFIX}/merchant/aov-rewards`, aovRewardsRoutes);
  app.use(`${API_PREFIX}/merchant/adbazaar-summary`, adBazaarSummaryRoutes);
  app.use(`${API_PREFIX}/merchant/trials`, trialMerchantRoutes);
  // rez-merchant-service has no inventory, multi-stores, export-sprint, broadcast-sprint, or payout-sprint7 routes
  app.use(`${API_PREFIX}/merchant`, inventoryRoutes);
  app.use(`${API_PREFIX}/merchant/multi-stores`, merchantStoreRoutes);
  app.use(`${API_PREFIX}/merchant`, merchantExportSprintRoutes);
  // merchantBroadcastRoutes defines only /broadcast/send — no /broadcasts/* paths,
  // so there is NO conflict with broadcastsRoutes mounted at /api/merchant/broadcasts below.
  app.use(`${API_PREFIX}/merchant`, merchantBroadcastRoutes);
  app.use(`${API_PREFIX}/merchant`, merchantPayoutSprint7Routes);
  app.use(`${API_PREFIX}/merchant/broadcasts`, broadcastsRoutes);
  app.use(`${API_PREFIX}/merchant/gift-cards`, giftCardsRoutes);
  app.use(`${API_PREFIX}/merchant/loyalty-config`, loyaltyConfigRoutes);
  app.use(`${API_PREFIX}/merchant/campaign-templates`, campaignTemplatesRoutes);
  app.use(`${API_PREFIX}/merchant/daily-actions`, dailyActionsRoutes);
  app.use(`${API_PREFIX}/merchant/roi-summary`, roiSummaryRoutes);
  app.use(`${API_PREFIX}/merchant/growth-score`, growthScoreRoutes);
  app.use(`${API_PREFIX}/merchant/cpa-billing`, cpaBillingRoutes);
  app.use(`${API_PREFIX}/merchant/stamp-cards`, merchantStampCardRoutes);

  // ── Phase 1-3: Habit Engine + Intelligence + Growth Routes ──
  app.use(`${API_PREFIX}/user/savings`, savingsInsightsRoutes);
  app.use(`${API_PREFIX}/insights`, authTokenMiddleware, insightsRoutes);
  app.use(`${API_PREFIX}/score`, authTokenMiddleware, rezScoreRoutes);
  app.use(`${API_PREFIX}/rewards/instant`, authTokenMiddleware, instantRewardRoutes);
  app.use(`${API_PREFIX}/goals`, authTokenMiddleware, savingsGoalRoutes);

  // ── AdBazaar Integration (internal x-internal-key) ──
  app.use(`${API_PREFIX}/adbazaar`, adBazaarIntegrationRoutes);

  // ── AdBazaar Webhook Endpoints (HMAC via X-Signature) ──
  // Note: adBazaarWebhookRouter handles /adbazaar/qr-scan, which is distinct
  // from webhookRoutes (/razorpay, /stripe, /rendez) registered above.
  // Express will reach this mount for any /api/webhooks/adbazaar/* request
  // because the first mount does NOT define a /adbazaar prefix — no shadowing occurs.
  app.use(`${API_PREFIX}/webhooks`, adBazaarWebhookRouter);

  // ── AdBazaar Partner API (HMAC-SHA256 via X-AdBazaar-Signature) ──
  app.use(`${API_PREFIX}/partner/adbazaar`, adBazaarPartnerRoutes);

  // ── RestoPapa Internal SSO (bypasses nginx /api/merchant/* routing) ──
  // RestoPapa rez-bridge calls: GET /api/internal/restopapa/merchant-profile
  // Set REZ_BACKEND_URL=https://api.rez.money/api in RestoPapa's env
  app.use(`${API_PREFIX}/internal/restopapa`, restoPapaInternalRoutes);

  // ── Internal Payment Sync (BL-H2) — called by rez-payment-service after webhook capture ──
  // Requires INTERNAL_WEBHOOK_SECRET env var on both sides.
  app.use(`${API_PREFIX}/internal/payments`, internalPaymentRoutes);

  // ── Rendez Partner API (x-partner-key auth, B2B integration for dating app) ──
  // Rendez backend sets REZ_PARTNER_API_URL=https://api.rez.money/api/rendez
  // All 18 Rendez→REZ endpoints live here: auth, merchants, bookings, wallet, gifts
  app.use(`${API_PREFIX}/rendez`, rendezPartnerAuth, rendezPartnerRoutes);

  // ── Root endpoint ──
  app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'REZ API', version: process.env.npm_package_version || '1.0.0' });
  });

  // ── 404 + Error Handlers (MUST be last) ──
  app.use(notFoundHandler);
  if (process.env.SENTRY_DSN) {
    app.use(sentryErrorHandler);
  }
  app.use(globalErrorHandler);

  logger.info('All routes registered successfully');
}
