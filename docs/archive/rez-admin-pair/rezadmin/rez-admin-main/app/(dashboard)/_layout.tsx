import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import ErrorBoundary from '../../components/ErrorBoundary';

export default function DashboardLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.errorDark} />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // PRIYA: Wrap Tabs layout with error boundary to catch screen-level crashes
  return (
    <ErrorBoundary
      onReset={() => {
        // Navigate back to dashboard home on error recovery
        // ErrorBoundary will handle the reset, this ensures proper routing
      }}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 70 + (insets.bottom || 0),
            paddingBottom: insets.bottom || 8,
            paddingTop: 8,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginBottom: -2,
          },
        }}
      >
        {/* Main 5 Tabs */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <Ionicons name="grid" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color }) => <Ionicons name="receipt" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="campaigns"
          options={{
            title: 'Campaigns',
            tabBarIcon: ({ color }) => <Ionicons name="megaphone" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="merchants"
          options={{
            title: 'Merchants',
            tabBarIcon: ({ color }) => <Ionicons name="storefront" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="hotels"
          options={{
            title: 'Hotels',
            tabBarIcon: ({ color }) => <Ionicons name="bed" size={22} color={color} />,
          }}
        />
        {/* Rendez — REZ ecosystem partner */}
        <Tabs.Screen
          name="rendez"
          options={{
            title: 'Rendez',
            tabBarIcon: ({ color }) => <Ionicons name="heart-circle" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'More',
            tabBarIcon: ({ color }) => <Ionicons name="menu" size={22} color={color} />,
          }}
        />

        {/* Hidden tabs - accessible via More menu */}
        <Tabs.Screen
          name="fraud-config"
          options={{
            href: null, // Hidden — accessible via More > Finance/Fraud section
            title: 'Fraud Config',
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="experiences"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="coin-rewards"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="offers"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="homepage-deals"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="verifications"
          options={{
            href: null, // Hide from tab bar - accessible via More menu
          }}
        />
        <Tabs.Screen
          name="special-programs"
          options={{
            href: null, // Hide from tab bar - accessible via More menu
          }}
        />
        <Tabs.Screen
          name="loyalty"
          options={{
            href: null, // Hide from tab bar - accessible via More menu
          }}
        />
        <Tabs.Screen
          name="mall"
          options={{
            href: null, // Hide from tab bar - accessible via More menu
          }}
        />
        <Tabs.Screen
          name="extra-rewards"
          options={{
            href: null, // Hide from tab bar - accessible via More menu
          }}
        />
        <Tabs.Screen
          name="cash-store"
          options={{
            href: null, // Hide from tab bar - accessible via More menu
          }}
        />
        <Tabs.Screen
          name="travel"
          options={{
            href: null, // Hide from tab bar - accessible via More menu
          }}
        />
        <Tabs.Screen
          name="unified-monitor"
          options={{
            href: null,
            title: 'Command Center',
          }}
        />
        <Tabs.Screen
          name="live-monitor"
          options={{
            href: null, // Hide from tab bar - accessible via Live Monitor button and More menu
            title: 'Live Monitor',
          }}
        />
        <Tabs.Screen
          name="system-health"
          options={{
            href: null, // Hide from tab bar - accessible via More menu
          }}
        />
        <Tabs.Screen
          name="sla-monitor"
          options={{
            href: null, // Hide from tab bar - accessible via More menu
          }}
        />
        <Tabs.Screen
          name="job-monitor"
          options={{
            href: null, // Hide from tab bar - accessible via More menu
          }}
        />
        <Tabs.Screen
          name="challenges"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="game-config"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="feature-flags"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="achievements"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="gamification-economy"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="economics"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="daily-checkin-config"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            href: null, // Hide from tab bar - accessible via More menu
          }}
        />
        <Tabs.Screen
          name="photo-moderation"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="polls"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="offer-comments"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="engagement-config"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="ugc-moderation"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="review-moderation"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="pending-approvals"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="social-impact"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="sponsors"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="bonus-zone"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="whats-new"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="prive"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="tournaments"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="learning-content"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="leaderboard-config"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="quick-actions"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="value-cards"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="wallet-config"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="user-wallets"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="gift-cards-admin"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="coin-gifts"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="merchant-withdrawals"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="creators"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="event-categories"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="event-rewards"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="surprise-coin-drops"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="partner-earnings"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="offers-sections"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="upload-bill-stores"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="exclusive-zones"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="hotspot-areas"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="special-profiles"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="bank-offers"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="flash-sales"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="loyalty-milestones"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="store-collections"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="support-config"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="support-tickets"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="admin-users"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="faq-management"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="notification-management"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="delivery-settings"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="fraud-reports"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="cashback-rules"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="membership-config"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="voucher-management"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="support-tools"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="wallet-adjustment"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="institutions"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="institute-referrals"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="api-latency"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="alert-rules"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="revenue-by-vertical"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="cohort-analysis"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="funnel-analytics"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="bbps-health"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="ab-test-manager"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="reconciliation"
          options={{
            href: null, // Hide from tab bar - accessible via More menu under Finance
          }}
        />
        <Tabs.Screen
          name="business-metrics"
          options={{
            href: null, // Hide from tab bar - accessible via More menu under Analytics
          }}
        />
        <Tabs.Screen
          name="fraud-alerts"
          options={{
            href: null, // Hide from tab bar - accessible via More menu under Finance
          }}
        />
        <Tabs.Screen
          name="merchant-live-status"
          options={{
            href: null, // Hide from tab bar - accessible via More menu under Monitoring
          }}
        />
        {/* ── Screens registered but hidden from tab bar ── */}
        <Tabs.Screen name="bbps-analytics" options={{ href: null }} />
        <Tabs.Screen name="bbps-config" options={{ href: null }} />
        <Tabs.Screen name="bbps-providers" options={{ href: null }} />
        <Tabs.Screen name="bbps-transactions" options={{ href: null }} />
        <Tabs.Screen name="bundle-management" options={{ href: null }} />
        <Tabs.Screen name="campaign-management" options={{ href: null }} />
        <Tabs.Screen name="coin-governor" options={{ href: null }} />
        <Tabs.Screen name="device-security" options={{ href: null }} />
        <Tabs.Screen name="disputes" options={{ href: null }} />
        <Tabs.Screen name="payroll" options={{ href: null }} />
        <Tabs.Screen name="prive-campaigns" options={{ href: null }} />
        <Tabs.Screen name="service-appointments" options={{ href: null }} />
        <Tabs.Screen name="table-bookings" options={{ href: null }} />
        <Tabs.Screen name="trial-approvals" options={{ href: null }} />
        <Tabs.Screen name="platform-control-center" options={{ href: null }} />
        <Tabs.Screen name="platform-config" options={{ href: null, title: 'Platform Config' }} />
        <Tabs.Screen name="merchant-plan-analytics" options={{ href: null }} />
        <Tabs.Screen name="aggregator-monitor" options={{ href: null }} />
        <Tabs.Screen name="marketing-analytics" options={{ href: null }} />
        <Tabs.Screen
          name="analytics-dashboard"
          options={{ href: null, title: 'Analytics Dashboard' }}
        />
        {/* Dynamic nested route — merchant feature flags detail screen */}
        <Tabs.Screen name="merchant-flags/[merchantId]" options={{ href: null }} />

        {/* Sprint 14: Review Moderation, Store Moderation, Broadcast */}
        <Tabs.Screen
          name="reviews"
          options={{
            href: null, // Hidden — accessible via More menu under Moderation
            title: 'Reviews',
          }}
        />
        <Tabs.Screen
          name="stores-moderation"
          options={{
            href: null, // Hidden — accessible via More menu under Moderation
            title: 'Stores',
          }}
        />
        <Tabs.Screen
          name="broadcast"
          options={{
            href: null, // Hidden — accessible via More menu under Engagement
            title: 'Broadcast',
          }}
        />
        {/* Sprint 14 new screens */}
        <Tabs.Screen name="revenue" options={{ href: null, title: 'Revenue Dashboard' }} />
        <Tabs.Screen name="audit-log" options={{ href: null, title: 'Audit Log' }} />
        <Tabs.Screen name="admin-settings" options={{ href: null, title: 'Admin Settings' }} />
        {/* Sprint 14: User detail and Fraud Queue */}
        <Tabs.Screen name="users/[id]" options={{ href: null, title: 'User Detail' }} />
        <Tabs.Screen name="fraud-queue" options={{ href: null, title: 'Fraud Queue' }} />
        {/* Unregistered pages — accessible via settings navigation */}
        <Tabs.Screen name="reactions" options={{ href: null }} />
        <Tabs.Screen name="comments-moderation" options={{ href: null }} />
        <Tabs.Screen name="ads" options={{ href: null }} />
        <Tabs.Screen name="moderation-queue" options={{ href: null }} />
        <Tabs.Screen name="web-menu-analytics" options={{ href: null }} />
        <Tabs.Screen name="rez-now-orders" options={{ href: null, title: 'REZ Now Orders' }} />
        <Tabs.Screen
          name="rez-now-analytics"
          options={{ href: null, title: 'REZ Now Analytics' }}
        />
        <Tabs.Screen name="revenue-report" options={{ href: null, title: 'Revenue Report' }} />
      </Tabs>
    </ErrorBoundary>
  );
}
