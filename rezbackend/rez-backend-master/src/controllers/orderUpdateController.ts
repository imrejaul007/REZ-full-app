import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Order } from '../models/Order';
import { sendSuccess, sendNotFound, sendBadRequest } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import referralService from '../services/referralService';
import { QueueService } from '../services/QueueService';
import challengeService from '../services/challengeService';
import userProductService from '../services/userProductService';
import activityService from '../services/activityService';
import gamificationEventBus from '../events/gamificationEventBus';
import { publishOrderEvent } from '../events/orderQueue';
import { reputationService } from '../services/reputationService';
import { processConversion } from '../services/creatorService';
import { Wallet } from '../models/Wallet';
import { calculatePromoCoinsEarned, calculatePromoCoinsWithTierBonus } from '../config/promoCoins.config';
import SmartSpendItem from '../models/SmartSpendItem';
import { Subscription } from '../models/Subscription';
import { Store } from '../models/Store';
import { logger } from '../config/logger';
import merchantWalletService from '../services/merchantWalletService';
import orderSocketService from '../services/orderSocketService';
import merchantNotificationService from '../services/merchantNotificationService';
import {
  isValidTransition,
  isValidMerchantTransition,
  STATUS_TRANSITIONS,
  MERCHANT_TRANSITIONS,
} from '../config/orderStateMachine';
import { getStoreCategorySlug } from './orderCreateController';
import pushNotificationService from '../services/pushNotificationService';

// ─── updateOrderStatus ──────────────────────────────────────────────────────

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status (admin/store owner only)
 *     tags: [User Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [placed, confirmed, preparing, ready, dispatched, delivered, cancelled, returned, refunded]
 *               estimatedDeliveryTime:
 *                 type: string
 *                 format: date-time
 *               trackingInfo:
 *                 type: object
 *                 properties:
 *                   trackingNumber:
 *                     type: string
 *                   carrier:
 *                     type: string
 *                   estimatedDelivery:
 *                     type: string
 *                     format: date-time
 *                   location:
 *                     type: string
 *                   notes:
 *                     type: string
 *                     maxLength: 500
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid status transition
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status, estimatedDeliveryTime, trackingInfo } = req.body;

  try {
    // Read current order to validate transitions before attempting atomic update
    const order = await Order.findById(orderId);

    if (!order) {
      return sendNotFound(res, 'Order not found');
    }

    // BUG-015 / BUG-051 FIX: Use typed req.userRole (added to Express.Request augmentation)
    // so we no longer need an unsafe (req as any) cast here.
    const userRole = req.userRole || req.user?.role || 'user';
    if (userRole === 'user' && order.user.toString() !== (req as any).userId) {
      return sendNotFound(res, 'Order not found');
    }

    // Validate status transition using centralized state machine
    if (order.status !== status && !isValidTransition(order.status, status)) {
      const allowed = STATUS_TRANSITIONS[order.status] || [];
      return sendBadRequest(
        res,
        `Invalid status transition from '${order.status}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    // For merchant-initiated updates, enforce stricter transitions
    if (userRole === 'merchant' || userRole === 'store_owner') {
      if (order.status !== status && !isValidMerchantTransition(order.status, status)) {
        const allowed = MERCHANT_TRANSITIONS[order.status] || [];
        return sendBadRequest(
          res,
          `Merchants can only transition from '${order.status}' to: ${allowed.join(', ') || 'none'}. Cannot skip states.`,
        );
      }
    }

    // Build atomic update payload
    const currentStatus = order.status;
    const atomicUpdate: Record<string, any> = { status };
    if (trackingInfo) {
      atomicUpdate['tracking'] = {
        ...order.tracking,
        ...trackingInfo,
        lastUpdated: new Date(),
      };
    }
    if (estimatedDeliveryTime) {
      atomicUpdate['estimatedDeliveryTime'] = new Date(estimatedDeliveryTime);
    }
    if (status === 'delivered') {
      atomicUpdate['deliveredAt'] = new Date();
    }

    // BE-ORD-012: Push timeline entry atomically alongside status update.
    // The Order model's pre-save hook handles timeline on .save(), but
    // findOneAndUpdate bypasses hooks, so timeline must be pushed explicitly.
    const userIdForTimeline = (req as any).userId;
    const atomicPush: Record<string, any> = {
      timeline: {
        status,
        message: `Order status updated to ${status}`,
        timestamp: new Date(),
        userId: userIdForTimeline,
        role: userRole,
      },
    };

    // Atomic compare-and-swap: only update if status hasn't changed since we read it
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, status: currentStatus },
      { $set: atomicUpdate, $push: atomicPush },
      { new: true },
    );

    if (!updatedOrder) {
      // BE-ORD-006: Log concurrent update conflict at WARN level for audit trail
      logger.warn('[OrderUpdate] Concurrent status update conflict', {
        orderId,
        expectedStatus: currentStatus,
        attemptedStatus: status,
        userId: (req as any).userId,
        userRole,
      });
      return sendBadRequest(res, 'Order status changed concurrently. Please refresh and try again.');
    }

    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate('items.product', 'name images')
      .populate('items.store', 'name')
      .populate('user', 'profile.firstName profile.lastName')
      .lean();

    // Send customer push notifications for key status transitions (fire-and-forget)
    if (populatedOrder) {
      const orderUserId =
        typeof populatedOrder.user === 'object'
          ? (populatedOrder.user as any)._id?.toString()
          : String(populatedOrder.user);
      const orderNumber = populatedOrder.orderNumber || String(populatedOrder._id);
      const orderId = (populatedOrder._id as any).toString();
      const storeDataForPush = populatedOrder.items[0]?.store as any;
      const storeNameForPush = storeDataForPush?.name || 'your store';

      const pushMessages: Record<string, { title: string; body: string }> = {
        confirmed: {
          title: 'Order Confirmed',
          body: `${storeNameForPush} is preparing your order #${orderNumber}`,
        },
        ready: {
          title: 'Order Ready',
          body: `Your order #${orderNumber} is ready for pickup/delivery`,
        },
        // BL-H3 fix: dispatched state was missing — users had no notification when order left the store
        dispatched: {
          title: 'Order On Its Way',
          body: `Your order #${orderNumber} has been dispatched and is on its way to you`,
        },
        delivered: {
          title: 'Order Delivered',
          body: `Your order #${orderNumber} has been delivered — enjoy!`,
        },
      };

      const pushMsg = pushMessages[status];
      if (pushMsg) {
        pushNotificationService
          .sendPushToUser(orderUserId, {
            title: pushMsg.title,
            body: pushMsg.body,
            data: { type: `order_${status}`, orderId, orderNumber },
          })
          .catch((err) => logger.warn('[ORDER] Customer push notification failed (non-fatal):', err));
      }
    }

    // Create activity for order delivery
    if (status === 'delivered' && populatedOrder) {
      const storeData = populatedOrder.items[0]?.store as any;
      const storeName = storeData?.name || 'Store';
      const userIdObj =
        typeof populatedOrder.user === 'object' ? (populatedOrder.user as any)._id : populatedOrder.user;
      await activityService.order.onOrderDelivered(
        userIdObj as Types.ObjectId,
        populatedOrder._id as Types.ObjectId,
        storeName,
      );

      // Update challenge progress for order delivery (non-blocking)
      challengeService
        .updateProgress(String(userIdObj), 'order_count', 1, { orderId: String(populatedOrder._id) })
        .catch((err) => logger.error('[ORDER] Challenge progress update failed:', err));

      challengeService
        .updateProgress(String(userIdObj), 'spend_amount', populatedOrder.totals.total, {
          orderId: String(populatedOrder._id),
        })
        .catch((err) => logger.error('[ORDER] Challenge spend progress update failed:', err));

      // Auto-refresh UserLoyalty mission progress so it's current when user next visits (non-blocking)
      setImmediate(async () => {
        try {
          const UserLoyalty = (await import('../models/UserLoyalty')).default;
          const loyalty = await UserLoyalty.findOne({ userId: String(userIdObj) });
          if (loyalty) {
            const { computeMissionProgress } = await import('./loyaltyController');
            const progressMap = await computeMissionProgress(String(userIdObj), loyalty.streak?.current || 0);
            let changed = false;
            for (const mission of loyalty.missions) {
              const real = progressMap.get(mission.missionId);
              if (real !== undefined) {
                const capped = Math.min(real, mission.target);
                if (mission.progress !== capped) {
                  mission.progress = capped;
                  changed = true;
                }
              }
            }
            if (changed) {
              await loyalty.save();
              logger.info('[ORDER] UserLoyalty missions auto-refreshed on delivery', { userId: String(userIdObj) });
            }
          }
        } catch (err) {
          logger.error('[ORDER] UserLoyalty mission refresh failed (non-blocking):', err);
        }
      });

      // Process referral rewards when order is delivered
      try {
        // Check if this is referee's first order (process referral completion)
        await referralService.processFirstOrder({
          refereeId: userIdObj as Types.ObjectId,
          orderId: populatedOrder._id as Types.ObjectId,
          orderAmount: populatedOrder.totals.total,
        });

        // Check for milestone bonus (3rd order)
        const deliveredOrdersCount = await Order.countDocuments({
          user: userIdObj,
          status: 'delivered',
        });

        // Strict equality: only trigger on exactly the 3rd delivery.
        // >= 3 would fire on every subsequent delivery, relying solely on the
        // downstream milestoneRewarded flag to prevent repeated issuance.
        if (deliveredOrdersCount === 3) {
          await referralService.processMilestoneBonus(userIdObj as Types.ObjectId, deliveredOrdersCount);
        }
      } catch (error) {
        logger.error('[ORDER] Error processing referral rewards:', error);
        // Don't fail the order update if referral processing fails
      }

      // Skip reward issuance if order has an active dispute hold
      if ((populatedOrder as any).disputeHold) {
        logger.warn('[ORDER] Skipping reward issuance — dispute hold active', {
          orderId: populatedOrder._id,
          orderNumber: populatedOrder.orderNumber,
        });
      } else {
        // Award purchase reward coins on delivery
        // Smart Spend items get enhanced rate; regular items get default 5%
        try {
          const coinService = require('../services/coinService');
          const defaultRate = 0.05;

          // Check if any order items came from Smart Spend
          const smartSpendItems = populatedOrder.items.filter((item: any) => item.smartSpendSource?.coinRewardRate);
          const regularItems = populatedOrder.items.filter((item: any) => !item.smartSpendSource?.coinRewardRate);

          // Award enhanced coins for Smart Spend items
          if (smartSpendItems.length > 0) {
            const smartSpendSubtotal = smartSpendItems.reduce(
              (sum: number, item: any) => sum + (item.subtotal || 0),
              0,
            );
            const smartSpendRate = smartSpendItems[0]!.smartSpendSource!.coinRewardRate;
            let smartSpendCoins =
              smartSpendRate > 1
                ? Math.floor(smartSpendRate) // fixed amount
                : Math.floor(smartSpendSubtotal * smartSpendRate); // percentage

            // Apply max cap if stored
            if (smartSpendCoins > 0) {
              const firstItem = smartSpendItems[0];
              const rewardStoreId = firstItem?.store
                ? typeof firstItem.store === 'object'
                  ? (firstItem.store as any)._id
                  : firstItem.store
                : null;
              const rewardCategory = rewardStoreId ? await getStoreCategorySlug(rewardStoreId.toString()) : null;
              const ratePercent = Math.round(smartSpendRate * 100);

              await coinService.awardCoins(
                userIdObj.toString(),
                smartSpendCoins,
                'smart_spend_reward',
                `${ratePercent}% Smart Spend reward for order ${populatedOrder.orderNumber}`,
                {
                  orderId: populatedOrder._id.toString(),
                  smartSpendItemId: smartSpendItems[0]!.smartSpendSource!.smartSpendItemId,
                  idempotencyKey: `smart_spend:${populatedOrder._id}`,
                  referenceId: `smart_spend:${populatedOrder._id}`,
                },
                rewardCategory,
              );
              // Increment purchases count on SmartSpendItem
              try {
                await SmartSpendItem.findByIdAndUpdate(smartSpendItems[0]!.smartSpendSource!.smartSpendItemId, {
                  $inc: { purchases: 1 },
                });
              } catch (_ignore) {
                /* non-critical */
              }
            }
          }

          // Award default 5% for regular (non-Smart Spend) items
          const regularSubtotal =
            regularItems.length > 0
              ? regularItems.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
              : smartSpendItems.length === 0
                ? populatedOrder.totals.subtotal
                : 0;
          const regularCoins = Math.floor(regularSubtotal * defaultRate);

          if (regularCoins > 0) {
            const firstItem = regularItems[0] || populatedOrder.items[0];
            const rewardStoreId = firstItem?.store
              ? typeof firstItem.store === 'object'
                ? (firstItem.store as any)._id
                : firstItem.store
              : null;
            const rewardCategory = rewardStoreId ? await getStoreCategorySlug(rewardStoreId.toString()) : null;

            await coinService.awardCoins(
              userIdObj.toString(),
              regularCoins,
              'purchase_reward',
              `5% purchase reward for order ${populatedOrder.orderNumber}`,
              {
                orderId: populatedOrder._id.toString(),
                idempotencyKey: `purchase_reward:${populatedOrder._id}`,
                referenceId: `purchase_reward:${populatedOrder._id}`,
              },
              rewardCategory,
            );
          }
        } catch (coinError) {
          logger.error('[ORDER] Failed to award purchase reward coins:', coinError);
        }

        // Auto-trigger matching bonus campaigns on order delivery
        try {
          const bonusCampaignService = require('../services/bonusCampaignService');
          const firstItemForBonus = populatedOrder.items[0];
          const bonusStoreId = firstItemForBonus?.store
            ? typeof firstItemForBonus.store === 'object'
              ? (firstItemForBonus.store as any)._id
              : firstItemForBonus.store
            : null;
          const bonusCategory = bonusStoreId ? await getStoreCategorySlug(bonusStoreId.toString()) : null;

          const orderIdStr = (populatedOrder as any)._id.toString();
          const baseClaimData = {
            transactionRef: { type: 'order' as const, refId: orderIdStr },
            transactionAmount: populatedOrder.totals.subtotal,
            paymentMethod: populatedOrder.payment?.method,
            category: bonusCategory || undefined,
            storeId: bonusStoreId?.toString(),
          };

          // All bonus campaign claims are independent — run in parallel
          const bonusPromises: Promise<any>[] = [
            bonusCampaignService.autoClaimForTransaction('cashback_boost', userIdObj.toString(), baseClaimData),
            bonusCampaignService.autoClaimForTransaction(
              'first_transaction_bonus',
              userIdObj.toString(),
              baseClaimData,
            ),
            bonusCampaignService.autoClaimForTransaction('festival_offer', userIdObj.toString(), baseClaimData),
            bonusCampaignService.autoClaimForTransaction('bank_offer', userIdObj.toString(), baseClaimData),
          ];

          if (bonusCategory) {
            bonusPromises.push(
              bonusCampaignService.autoClaimForTransaction('category_multiplier', userIdObj.toString(), {
                ...baseClaimData,
                category: bonusCategory,
              }),
            );
          }

          // allSettled never rejects — individual failures are handled inside each promise;
          // using Promise.all here would abort all remaining claims on the first failure.
          await Promise.allSettled(bonusPromises);
        } catch (bonusErr) {
          logger.error('[ORDER] Bonus campaign auto-claim failed (non-blocking):', bonusErr);
        }
      } // end disputeHold else block

      // Credit merchant wallet on delivery (merchant gets subtotal minus platform fee).
      // Idempotency key prevents double-credit if this block retries.
      const merchantCreditIdempotencyKey = `merchant_credit:${populatedOrder._id}`;
      try {
        const firstItem = populatedOrder.items[0];
        if (firstItem && firstItem.store) {
          const storeId = typeof firstItem.store === 'object' ? (firstItem.store as any)._id : firstItem.store;

          const store = await Store.findById(storeId).lean();

          if (store && store.merchantId) {
            const grossAmount = populatedOrder.totals.subtotal || 0;
            const platformFee = populatedOrder.totals.platformFee || 0;

            let walletResult: any = null;
            try {
              walletResult = await (merchantWalletService as any).creditOrderPayment(
                store.merchantId.toString(),
                populatedOrder._id as Types.ObjectId,
                populatedOrder.orderNumber,
                grossAmount,
                platformFee,
                storeId,
              );
            } catch (creditErr: any) {
              // Merchant credit failed — mark the order so the reconciliation job
              // and admin dashboard can surface it for retry. Do NOT silently swallow
              // this: the order is already delivered but the merchant has not been paid.
              logger.error('[ORDER] Merchant wallet credit FAILED — flagging order for reconciliation', {
                orderId: (populatedOrder._id as Types.ObjectId).toString(),
                orderNumber: populatedOrder.orderNumber,
                merchantId: store.merchantId.toString(),
                grossAmount,
                platformFee,
                idempotencyKey: merchantCreditIdempotencyKey,
                error: creditErr?.message,
              });
              // Persist the failure flag atomically so it survives process restarts.
              await Order.findByIdAndUpdate(populatedOrder._id, {
                $set: {
                  'merchantCredit.status': 'failed',
                  'merchantCredit.failedAt': new Date(),
                  'merchantCredit.failureReason': creditErr?.message || 'Unknown error',
                  'merchantCredit.idempotencyKey': merchantCreditIdempotencyKey,
                },
                $push: {
                  timeline: {
                    status: 'merchant_credit_failed',
                    message: `Merchant wallet credit failed: ${creditErr?.message}. Queued for reconciliation.`,
                    timestamp: new Date(),
                    metadata: { grossAmount, platformFee, merchantId: store.merchantId.toString() },
                  },
                },
              });
              // Emit admin alert for immediate visibility
              try {
                orderSocketService.emitToAdmin('MERCHANT_CREDIT_FAILED', {
                  orderId: (populatedOrder._id as Types.ObjectId).toString(),
                  orderNumber: populatedOrder.orderNumber,
                  merchantId: store.merchantId.toString(),
                  grossAmount,
                  platformFee,
                  error: creditErr?.message,
                  timestamp: new Date(),
                });
              } catch (_alertErr) {
                /* Non-blocking */
              }
              // Do NOT throw — the order delivery is committed; we handle credit
              // separately via reconciliation. Throwing here would roll back nothing
              // (order.save already committed) but would break the HTTP response.
            }

            // Emit real-time notification to merchant
            if (walletResult) {
              orderSocketService.emitMerchantWalletUpdated({
                merchantId: store.merchantId.toString(),
                storeId: storeId.toString(),
                storeName: store.name,
                transactionType: 'credit',
                amount: grossAmount - platformFee,
                orderId: (populatedOrder._id as Types.ObjectId).toString(),
                orderNumber: populatedOrder.orderNumber,
                newBalance: {
                  total: walletResult.balance?.total || 0,
                  available: walletResult.balance?.available || 0,
                  pending: walletResult.balance?.pending || 0,
                },
                timestamp: new Date(),
              });

              // Fire-and-forget: don't block order delivery on FCM availability
              merchantNotificationService
                .notifyPaymentReceived({
                  merchantId: store.merchantId.toString(),
                  orderId: (populatedOrder._id as Types.ObjectId).toString(),
                  orderNumber: populatedOrder.orderNumber,
                  amount: grossAmount - platformFee,
                  paymentMethod: populatedOrder.payment?.method || 'online',
                })
                .catch((err: any) =>
                  logger.warn('[ORDER] Non-blocking notification failure', {
                    orderId: (populatedOrder._id as Types.ObjectId).toString(),
                    err: err?.message,
                  }),
                );
            }
          }
        }
      } catch (walletError) {
        // This catch fires for errors outside the creditOrderPayment call itself
        // (e.g. Store lookup failed). Credit failures are handled above with order flagging.
        logger.error('[ORDER] Unexpected error in merchant wallet credit block:', walletError);
      }

      // Credit 5% admin commission to platform wallet on delivery (5% of subtotal).
      // Wrapped in try/catch with rollback logging; idempotency handled inside adminWalletService.
      try {
        const adminWalletService = require('../services/adminWalletService').default;
        const subtotal = populatedOrder.totals.subtotal || 0;
        // Cap commission to the collected platform fee to prevent over-crediting
        const collectedFee = (populatedOrder.totals as any).platformFee || 0;
        const adminCommission =
          collectedFee > 0 ? Math.min(Math.floor(subtotal * 0.05), collectedFee) : Math.floor(subtotal * 0.05);
        if (adminCommission > 0) {
          await adminWalletService.creditOrderCommission(
            populatedOrder._id as Types.ObjectId,
            populatedOrder.orderNumber,
            subtotal,
          );
        }
      } catch (adminError) {
        logger.error('[ORDER] Failed to credit admin commission wallet — manual reconciliation may be required', {
          orderId: (populatedOrder._id as Types.ObjectId).toString(),
          orderNumber: populatedOrder.orderNumber,
          error: (adminError as any)?.message,
        });
      }

      // Run independent post-delivery tasks in parallel (cashback, user products, creator conversion)
      {
        const postDeliveryTasks: Promise<any>[] = [
          QueueService.enqueueCashback({
            orderId: (populatedOrder._id as Types.ObjectId).toString(),
            triggeredBy: 'order_delivery',
            idempotencyKey: `cashback:order:${populatedOrder._id}`,
          })
            .then(({ backpressureWarning, totalWaiting }) => {
              // QF-D003: If the cashback queue is under backpressure, log so that
              // infra engineers can scale out worker replicas.  The job is still
              // accepted — backpressure is a delay signal, not a rejection.
              if (backpressureWarning) {
                logger.warn('[ORDER] Cashback queue backlog detected — issuance may be delayed', {
                  orderId: (populatedOrder._id as Types.ObjectId).toString(),
                  totalWaiting,
                });
              }
            })
            .catch((err: any) => logger.error('[ORDER] Error enqueuing cashback:', err)),
          userProductService
            .createUserProductsFromOrder(populatedOrder._id as Types.ObjectId)
            .catch((err: any) => logger.error('[ORDER] Error creating user products:', err)),
        ];

        const attributionPickId = populatedOrder.analytics?.attributionPickId;
        if (attributionPickId) {
          postDeliveryTasks.push(
            processConversion(
              attributionPickId.toString(),
              (populatedOrder._id as Types.ObjectId).toString(),
              userIdObj.toString(),
              populatedOrder.totals.subtotal,
              req.ip,
            ).catch((err: any) => logger.error('[ORDER] Error processing creator conversion:', err)),
          );
        }

        await Promise.all(postDeliveryTasks);
      }

      // Award store promo coins for delivered order
      try {
        // Get user's subscription tier for bonus calculation
        let userTier = 'free';
        try {
          const subscription = await Subscription.findOne({
            user: userIdObj,
            status: 'active',
          })
            .select('tier')
            .lean();
          if (subscription?.tier) {
            userTier = subscription.tier;
          }
        } catch (_tierError) {
          logger.warn('[ORDER_UPDATE] Failed to fetch user subscription tier, defaulting to free', {
            userId: userIdObj?.toString(),
          });
        }

        // Calculate promo coins with tier bonus
        const orderValue = populatedOrder.totals.total;
        const coinsToEarn = calculatePromoCoinsWithTierBonus(orderValue, userTier);
        const baseCoins = calculatePromoCoinsEarned(orderValue);
        const _bonusCoins = coinsToEarn - baseCoins;

        if (coinsToEarn > 0) {
          // Get store info from first item (assuming single store per order)
          const firstItem = populatedOrder.items[0];
          const storeData = firstItem.store as any;
          const storeId = typeof storeData === 'object' ? storeData._id : storeData;
          const storeName = typeof storeData === 'object' ? storeData.name : 'Store';
          const storeLogo = typeof storeData === 'object' ? storeData.logo : undefined;

          if (storeId) {
            // Award branded coins atomically — avoid stale document overwrite by using
            // findOneAndUpdate instead of fetching the doc and calling an instance method.
            const merchantObjId = new Types.ObjectId(storeId.toString());
            const existing = await Wallet.findOneAndUpdate(
              { user: userIdObj, 'brandedCoins.merchantId': merchantObjId },
              { $inc: { 'brandedCoins.$.amount': coinsToEarn } },
              { new: true },
            );
            if (!existing) {
              await Wallet.findOneAndUpdate(
                { user: userIdObj },
                {
                  $push: {
                    brandedCoins: {
                      merchantId: merchantObjId,
                      merchantName: storeName,
                      logo: storeLogo,
                      amount: coinsToEarn,
                    },
                  },
                },
              );
            }
          }
        } else {
        }
      } catch (error) {
        logger.error('[ORDER] Error awarding promo coins:', error);
        // Don't fail the order update if promo coin creation fails
      }

      // Emit gamification event for order delivery
      gamificationEventBus.emit('order_delivered', {
        userId: String(populatedOrder.user),
        entityId: String(populatedOrder._id),
        entityType: 'order',
        amount: populatedOrder.totals?.total,
        source: { controller: 'orderController', action: 'updateOrderStatus' },
      });

      // Emit gmv:update to admin room so the admin dashboard GMV widget reflects delivered orders in real-time
      // The admin panel subscribes to this event to increment the running GMV counter without a full re-fetch
      try {
        const { isSocketInitialized: isSockInit, getIO: getAdminIO } = require('../config/socket');
        if (isSockInit()) {
          const storeIdForGmv = populatedOrder.items?.[0]?.store;
          const merchantIdForGmv =
            (populatedOrder as any).merchantId ||
            (storeIdForGmv && typeof storeIdForGmv === 'object' ? (storeIdForGmv as any).merchantId : undefined);
          getAdminIO()
            .to('admin-room')
            .emit('gmv:update', {
              orderId: String(populatedOrder._id),
              amount: populatedOrder.totals?.total ?? 0,
              merchantId: merchantIdForGmv ? String(merchantIdForGmv) : undefined,
              timestamp: new Date().toISOString(),
            });
        }
      } catch (_gmvErr) {
        // Non-fatal — admin dashboard will reconcile via polling if socket emit fails
      }

      // Phase 8: Publish to order queue for async side effects (Strangler Fig — dual mode)
      publishOrderEvent({
        eventId: `order-delivered:${String(populatedOrder._id)}:${Date.now()}`,
        eventType: 'order.delivered',
        userId: String(populatedOrder.user),
        storeId: populatedOrder.items?.[0]?.store?.toString(),
        payload: {
          orderId: String(populatedOrder._id),
          orderNumber: populatedOrder.orderNumber,
          newStatus: 'delivered',
          amount: populatedOrder.totals?.total,
        },
        createdAt: new Date().toISOString(),
      }).catch(() => {});

      // Recalculate Prive reputation on order delivery (fire-and-forget)
      reputationService
        .onOrderCompleted(userIdObj as Types.ObjectId)
        .catch((err) => logger.error('[ORDER] Reputation recalculation failed:', err));

      // Update partner progress for order delivery
      try {
        const partnerService = require('../services/partnerService').default;
        const deliveredOrderId = populatedOrder._id as Types.ObjectId;
        await partnerService.updatePartnerProgress(userIdObj.toString(), deliveredOrderId.toString());
      } catch (error) {
        logger.error('[ORDER] Error updating partner progress:', error);
        // Don't fail the order update if partner progress update fails
      }

      // Fire-and-forget: AdBazaar purchase attribution webhook on order delivery
      if (!process.env.ADBAZAAR_WEBHOOK_URL || !process.env.ADBAZAAR_WEBHOOK_SECRET) {
        logger.warn(
          '[ADBAZAAR] ADBAZAAR_WEBHOOK_URL or ADBAZAAR_WEBHOOK_SECRET not set — purchase attribution skipped',
        );
      }
      if (process.env.ADBAZAAR_WEBHOOK_URL && process.env.ADBAZAAR_WEBHOOK_SECRET) {
        try {
          const storeItem = populatedOrder.items?.[0];
          const storeRef = storeItem?.store as any;
          const storeDoc = storeRef?._id
            ? await Store.findById(storeRef._id).lean()
            : storeRef
              ? await Store.findById(storeRef).lean()
              : null;
          const rezMerchantId = storeDoc?.merchantId?.toString() ?? null;
          fetch(`${process.env.ADBAZAAR_WEBHOOK_URL}/api/webhooks/rez-purchase`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-webhook-secret': process.env.ADBAZAAR_WEBHOOK_SECRET,
            },
            body: JSON.stringify({
              rezUserId: userIdObj.toString(),
              rezMerchantId,
              scanEventId: null,
              amount: populatedOrder.totals?.subtotal ?? 0,
              orderId: (populatedOrder._id as Types.ObjectId).toString(),
              visitedAt: new Date().toISOString(),
            }),
          }).catch(() => {}); // fire and forget
        } catch (adErr) {
          logger.warn('[ORDER] AdBazaar purchase webhook skipped:', adErr);
        }
      }
    }

    sendSuccess(res, populatedOrder, 'Order status updated successfully');
  } catch (err) {
    logger.error('[ORDER] Failed to update order status', { error: err instanceof Error ? err.message : err });
    throw new AppError('Failed to update order status', 500);
  }
});

// ─── rateOrder ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/orders/{orderId}/rate:
 *   post:
 *     summary: Rate and review an order
 *     tags: [User Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               review:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Order rated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error (invalid rating, already rated, etc.)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
export const rateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const userId = req.userId!;
  const { rating, review } = req.body;

  try {
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return sendNotFound(res, 'Order not found');
    }

    if (order.status !== 'delivered') {
      return sendBadRequest(res, 'Can only rate delivered orders');
    }

    // Atomic check-and-set: findOneAndUpdate with a condition that only matches
    // if rating.score does not yet exist, preventing the check-then-act race where
    // two concurrent requests both pass the `order.rating?.score` check above.
    const ratedOrder = await Order.findOneAndUpdate(
      { _id: orderId, user: userId, 'rating.score': { $exists: false } },
      { $set: { rating: { score: Number(rating), review, ratedAt: new Date() } } },
      { new: true },
    );

    if (!ratedOrder) {
      return sendBadRequest(res, 'Order already rated');
    }

    // Update partner review task progress
    try {
      const Partner = require('../models/Partner').default;

      // Atomic increment — replaces read-modify-write pattern that races under concurrency.
      await Partner.findOneAndUpdate(
        {
          userId,
          'tasks.type': 'review',
          'tasks.progress.current': { $lt: { $ifNull: ['$tasks.$.progress.target', 999] } },
        },
        { $inc: { 'tasks.$.progress.current': 1 } },
      );
    } catch (error) {
      logger.error('[REVIEW] Error updating partner review task:', error);
      // Don't fail the review if partner update fails
    }

    sendSuccess(res, ratedOrder, 'Order rated successfully');
  } catch (err) {
    logger.error('[ORDER] Failed to rate order', { error: err instanceof Error ? err.message : err });
    throw new AppError('Failed to rate order', 500);
  }
});
