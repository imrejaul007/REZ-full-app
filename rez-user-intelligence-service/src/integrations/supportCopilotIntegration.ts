/**
 * Support Copilot Integration Module
 * Handles REZ-user-intelligence → REZ-support-copilot integrations
 *
 * Integrations:
 * - Update user profile when they interact
 * - Alert support when user has high churn risk
 * - Sync user data for personalized support
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const SUPPORT_COPILOT_URL = process.env.SUPPORT_COPILOT_URL || 'http://localhost:4033';
const USER_INTELLIGENCE_URL = process.env.USER_INTELLIGENCE_URL || 'http://localhost:3004';

interface UserInteraction {
  userId: string;
  interactionType: 'chat' | 'order' | 'search' | 'complaint' | 'support_ticket';
  message?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface ChurnRiskAlert {
  userId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: string[];
  recommendedActions: string[];
  lastInteraction?: Date;
  orderCount?: number;
  avgOrderValue?: number;
}

/**
 * Update user profile when they interact with support
 * @param userId - User ID
 * @param interaction - Interaction data
 */
export async function updateUserProfileFromInteraction(userId: string, interaction: UserInteraction): Promise<void> {
  try {
    logger.info('Updating user profile from interaction', { userId, interactionType: interaction.interactionType });

    // Send interaction data to support copilot for profile enrichment
    await axios.post(`${SUPPORT_COPILOT_URL}/api/user/${userId}/interaction`, {
      interactionType: interaction.interactionType,
      message: interaction.message,
      metadata: interaction.metadata,
      timestamp: interaction.timestamp.toISOString(),
    }, { timeout: 5000 });

    logger.info('User profile updated from interaction', { userId });
  } catch (error) {
    logger.warn('Failed to update user profile from interaction', { userId, error });
  }
}

/**
 * Get enriched user profile for support context
 * @param userId - User ID
 * @returns Enriched user profile with support context
 */
export async function getEnrichedUserProfile(userId: string): Promise<any | null> {
  try {
    // Get user profile from user intelligence
    const profileResponse = await axios.get(`${USER_INTELLIGENCE_URL}/user/${userId}/profile`, {
      timeout: 5000,
    });

    const profile = profileResponse.data?.data;

    if (!profile) {
      return null;
    }

    // Get churn risk assessment
    const churnRisk = await getUserChurnRisk(userId);

    // Get lifetime value
    const ltvResponse = await axios.get(`${USER_INTELLIGENCE_URL}/user/${userId}/lifetime-value`, {
      timeout: 5000,
    });

    return {
      ...profile,
      churnRisk,
      lifetimeValue: ltvResponse.data?.data,
      supportContext: {
        isHighValue: profile.lifetimeValue?.totalValue > 1000,
        isChurnRisk: churnRisk?.riskLevel === 'high' || churnRisk?.riskLevel === 'critical',
        interactionCount: profile.interactionCount,
        satisfactionScore: profile.satisfactionScore,
      },
    };
  } catch (error) {
    logger.warn('Failed to get enriched user profile', { userId, error });
    return null;
  }
}

/**
 * Get user churn risk assessment
 * @param userId - User ID
 */
export async function getUserChurnRisk(userId: string): Promise<ChurnRiskAlert | null> {
  try {
    // Try to get behavioral score which contains churn risk
    const response = await axios.get(`${USER_INTELLIGENCE_URL}/user/${userId}/behavioral-score`, {
      timeout: 5000,
    });

    const scoreData = response.data?.data;

    if (!scoreData) {
      return null;
    }

    // Convert behavioral score to churn risk
    const riskScore = 100 - (scoreData.overallScore || 50);
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';

    if (riskScore < 20) riskLevel = 'low';
    else if (riskScore < 40) riskLevel = 'medium';
    else if (riskScore < 60) riskLevel = 'high';
    else riskLevel = 'critical';

    return {
      userId,
      riskLevel,
      riskScore,
      factors: scoreData.factors || [],
      recommendedActions: getRecommendedActions(riskLevel),
      lastInteraction: scoreData.lastInteraction,
      orderCount: scoreData.orderCount,
      avgOrderValue: scoreData.avgOrderValue,
    };
  } catch (error) {
    logger.warn('Failed to get user churn risk', { userId, error });
    return null;
  }
}

/**
 * Get recommended actions based on risk level
 */
function getRecommendedActions(riskLevel: string): string[] {
  const actions: Record<string, string[]> = {
    low: ['Continue regular engagement'],
    medium: ['Send re-engagement offer', 'Check in with satisfaction survey'],
    high: ['Send personalized discount', 'Proactive outreach from support'],
    critical: ['Immediate VIP support outreach', 'Consider refund/resolution offer'],
  };

  return actions[riskLevel] || actions.low;
}

/**
 * Alert support team when user has high churn risk
 * @param churnRisk - Churn risk data
 */
export async function alertSupportForChurnRisk(churnRisk: ChurnRiskAlert): Promise<void> {
  try {
    logger.warn('High churn risk detected, alerting support', {
      userId: churnRisk.userId,
      riskLevel: churnRisk.riskLevel,
    });

    // Create support ticket for high-risk user
    await axios.post(`${SUPPORT_COPILOT_URL}/webhook/ticket`, {
      ticket_id: `CHURN-RISK-${churnRisk.userId}-${Date.now()}`,
      user_id: churnRisk.userId,
      category: 'churn_risk',
      priority: churnRisk.riskLevel === 'critical' ? 'urgent' : 'high',
      content: formatChurnRiskTicket(churnRisk),
      metadata: {
        churnRisk: true,
        riskLevel: churnRisk.riskLevel,
        riskScore: churnRisk.riskScore,
        factors: churnRisk.factors,
        source: 'user_intelligence_service',
        createdAt: new Date().toISOString(),
      },
    }, { timeout: 5000 });

    logger.info('Support alerted for churn risk', { userId: churnRisk.userId });
  } catch (error) {
    logger.error('Failed to alert support for churn risk', { userId: churnRisk.userId, error });
  }
}

/**
 * Format churn risk ticket content
 */
function formatChurnRiskTicket(churnRisk: ChurnRiskAlert): string {
  return `CHURN RISK ALERT - ${churnRisk.riskLevel.toUpperCase()} PRIORITY

User ID: ${churnRisk.userId}
Risk Score: ${churnRisk.riskScore}/100
Risk Level: ${churnRisk.riskLevel}

Factors Contributing to Churn Risk:
${churnRisk.factors.map(f => `- ${f}`).join('\n')}

User Metrics:
- Order Count: ${churnRisk.orderCount || 'N/A'}
- Avg Order Value: ${churnRisk.avgOrderValue ? `$${churnRisk.avgOrderValue.toFixed(2)}` : 'N/A'}
- Last Interaction: ${churnRisk.lastInteraction || 'N/A'}

Recommended Actions:
${churnRisk.recommendedActions.map(a => `- ${a}`).join('\n')}

This ticket was automatically created by the User Intelligence Service due to elevated churn risk.`;
}

/**
 * Monitor and alert for churn risks in batch
 * @param threshold - Risk score threshold for alerting
 */
export async function monitorChurnRisks(threshold: number = 60): Promise<void> {
  try {
    logger.info('Monitoring churn risks', { threshold });

    // Get users at risk
    const response = await axios.get(`${USER_INTELLIGENCE_URL}/users/at-risk`, {
      params: { threshold },
      timeout: 10000,
    });

    const atRiskUsers = response.data?.data?.users || [];

    logger.info('Users at risk found', { count: atRiskUsers.length });

    // Alert support for each high-risk user
    for (const user of atRiskUsers) {
      const churnRisk: ChurnRiskAlert = {
        userId: user.userId,
        riskLevel: user.riskLevel,
        riskScore: user.riskScore,
        factors: user.factors || [],
        recommendedActions: getRecommendedActions(user.riskLevel),
        lastInteraction: user.lastInteraction,
        orderCount: user.orderCount,
        avgOrderValue: user.avgOrderValue,
      };

      await alertSupportForChurnRisk(churnRisk);
    }
  } catch (error) {
    logger.error('Failed to monitor churn risks', { error });
  }
}

/**
 * Send user satisfaction feedback to support
 * @param userId - User ID
 * @param score - Satisfaction score (1-5)
 * @param feedback - Optional feedback text
 */
export async function sendSatisfactionFeedback(
  userId: string,
  score: number,
  feedback?: string
): Promise<void> {
  try {
    // Only escalate negative feedback to support
    if (score >= 3) {
      return;
    }

    const priority = score === 1 ? 'urgent' : score === 2 ? 'high' : 'medium';

    await axios.post(`${SUPPORT_COPILOT_URL}/webhook/ticket`, {
      ticket_id: `SATISFACTION-${userId}-${Date.now()}`,
      user_id: userId,
      category: 'low_satisfaction',
      priority,
      content: `Low Satisfaction Feedback\n\nScore: ${score}/5\nFeedback: ${feedback || 'No additional feedback provided'}\n\nThis user may need attention from the support team.`,
      metadata: {
        satisfactionScore: score,
        feedback,
        source: 'user_intelligence_service',
        createdAt: new Date().toISOString(),
      },
    }, { timeout: 5000 });

    logger.info('Low satisfaction feedback sent to support', { userId, score });
  } catch (error) {
    logger.warn('Failed to send satisfaction feedback to support', { userId, error });
  }
}

/**
 * Sync user segment changes to support
 * @param userId - User ID
 * @param previousSegments - Previous segments
 * @param newSegments - New segments
 */
export async function syncUserSegments(
  userId: string,
  previousSegments: string[],
  newSegments: string[]
): Promise<void> {
  try {
    // Check for significant segment changes
    const removedSegments = previousSegments.filter(s => !newSegments.includes(s));
    const addedSegments = newSegments.filter(s => !previousSegments.includes(s));

    if (removedSegments.length === 0 && addedSegments.length === 0) {
      return;
    }

    // Log significant changes
    await axios.post(`${SUPPORT_COPILOT_URL}/api/user/${userId}/segment-update`, {
      previousSegments,
      newSegments,
      removedSegments,
      addedSegments,
      timestamp: new Date().toISOString(),
    }, { timeout: 5000 });

    logger.info('User segment changes synced to support', {
      userId,
      added: addedSegments,
      removed: removedSegments,
    });
  } catch (error) {
    logger.warn('Failed to sync user segments', { userId, error });
  }
}

/**
 * Get support context for a user (for support agents)
 * @param userId - User ID
 */
export async function getSupportContext(userId: string): Promise<any | null> {
  try {
    const profile = await getEnrichedUserProfile(userId);

    if (!profile) {
      return null;
    }

    return {
      userId: profile.userId,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      lifetimeValue: profile.lifetimeValue?.totalValue,
      orderCount: profile.orderCount || profile.lifetimeValue?.orderCount,
      avgOrderValue: profile.avgOrderValue || profile.lifetimeValue?.avgOrderValue,
      churnRisk: profile.churnRisk,
      supportContext: profile.supportContext,
      preferences: profile.preferences,
      tags: profile.tags,
      createdAt: profile.createdAt,
      lastInteraction: profile.lastInteraction,
    };
  } catch (error) {
    logger.warn('Failed to get support context', { userId, error });
    return null;
  }
}

/**
 * Update support ticket with user intelligence data
 * @param ticketId - Support ticket ID
 * @param userId - User ID
 */
export async function enrichSupportTicket(ticketId: string, userId: string): Promise<void> {
  try {
    const context = await getSupportContext(userId);

    if (!context) {
      return;
    }

    // This would typically update the ticket in the support system
    // For now, we log it
    logger.info('Support ticket enriched with user context', {
      ticketId,
      userId,
      churnRisk: context.churnRisk?.riskLevel,
      lifetimeValue: context.lifetimeValue,
    });
  } catch (error) {
    logger.warn('Failed to enrich support ticket', { ticketId, userId, error });
  }
}
