import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  StyleSheet,
} from 'react-native';
import { showAlert, showConfirm } from '../../utils/alert';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { apiCall } from '../../utils/api';
import { useRouter } from 'expo-router';
import { s } from './reconciliation.styles';

type IssueStatus = 'open' | 'investigating' | 'resolved' | 'ignored';

interface ReconciliationIssue {
  _id: string;
  type: string;
  userId?: { _id: string; name: string; phone: string };
  detail: string;
  status: IssueStatus;
  detectedAt: string;
}

interface ReconciliationStats {
  stats: {
    open: number;
    investigating: number;
    resolved: number;
    total: number;
  };
  latestRun?: string;
}

export default function ReconciliationScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<IssueStatus>('open');
  const [issues, setIssues] = useState<ReconciliationIssue[]>([]);
  const [stats, setStats] = useState<ReconciliationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningReconciliation, setRunningReconciliation] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchIssues = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      try {
        const response = await apiCall(
          `admin/system/reconciliation/issues?status=${activeTab}&page=${pageNum}`,
          { method: 'GET' }
        );

        if (response.success) {
          const newIssues = response.data?.issues ?? [];
          if (append) {
            setIssues((prev) => [...prev, ...newIssues]);
          } else {
            setIssues(newIssues);
          }
          setPage(pageNum);
          setHasMore(newIssues.length >= 20);
        }
      } catch (error) {
        showAlert('Error', 'Failed to fetch reconciliation issues');
        logger.error('Failed to fetch reconciliation issues', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [activeTab]
  );

  const [statsError, setStatsError] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setStatsError(false);
      const response = await apiCall(`admin/system/reconciliation/stats`, { method: 'GET' });

      if (response.success) {
        setStats(response.data);
      } else {
        setStatsError(true);
      }
    } catch (error) {
      setStatsError(true);
      logger.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchIssues(1);
    fetchStats();
  }, [activeTab, fetchIssues, fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchIssues(1);
    fetchStats();
  };

  const handleRunNow = async () => {
    const confirmed = await showConfirm(
      'Run Reconciliation',
      'This will run the reconciliation job immediately. Continue?'
    );
    if (!confirmed) return;
    setRunningReconciliation(true);
    try {
      const response = await apiCall(`admin/system/reconciliation/run`, { method: 'POST' });

      if (response.success) {
        showAlert(
          'Reconciliation Complete',
          `Found ${response.data?.result?.discrepancies ?? 0} discrepancies\nCritical: ${response.data?.result?.criticalCount ?? 0}\nHigh: ${response.data?.result?.highCount ?? 0}\nDuration: ${response.data?.result?.duration ?? 0}ms`
        );
        handleRefresh();
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to run reconciliation');
    } finally {
      setRunningReconciliation(false);
    }
  };

  const handleUpdateIssue = async (issueId: string, newStatus: IssueStatus) => {
    try {
      const response = await apiCall(`admin/system/reconciliation/issues/${issueId}`, {
        method: 'PATCH',
        body: { status: newStatus },
      });

      if (response.success) {
        showAlert('Success', `Issue updated to ${newStatus}`);
        handleRefresh();
      } else {
        showAlert('Error', response.message || `Failed to update issue to ${newStatus}`);
      }
    } catch (error) {
      showAlert('Error', 'Failed to update issue');
      logger.error('Failed to update issue', error);
    }
  };

  const renderIssueCard = ({ item }: { item: ReconciliationIssue }) => (
    <View
      style={[
        s.issueCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={s.issueHeader}>
        <View style={s.issueTypeBadge}>
          <Text
            style={[
              s.issueTypeText,
              {
                color: item.type.includes('critical')
                  ? '#FF3B30'
                  : item.type.includes('high')
                    ? '#FF9500'
                    : '#34C759',
              },
            ]}
          >
            {item.type}
          </Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 12 }}>
          {item.detectedAt ? new Date(item.detectedAt).toLocaleString() : '—'}
        </Text>
      </View>

      {item.userId && (
        <View style={s.userInfo}>
          <Ionicons name="person" size={14} color={colors.tint} />
          <Text style={{ color: colors.text, marginLeft: 6 }}>
            {item.userId.name || 'Unknown'} ({item.userId.phone})
          </Text>
        </View>
      )}

      <Text style={[s.issueDetail, { color: colors.text }]}>{item.detail}</Text>

      <View style={s.actionButtons}>
        <TouchableOpacity
          style={[s.actionButton, { backgroundColor: colors.tint }]}
          onPress={() => handleUpdateIssue(item._id, 'investigating')}
        >
          <Ionicons name="search" size={16} color="#FFF" />
          <Text style={s.actionButtonText}>Investigate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionButton, { backgroundColor: colors.tint }]}
          onPress={() => handleUpdateIssue(item._id, 'resolved')}
        >
          <Ionicons name="checkmark" size={16} color="#FFF" />
          <Text style={s.actionButtonText}>Resolve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionButton, { backgroundColor: colors.border }]}
          onPress={() => handleUpdateIssue(item._id, 'ignored')}
        >
          <Ionicons name="close" size={16} color={colors.text} />
          <Text style={[s.actionButtonText, { color: colors.text }]}>Ignore</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const statsDisplay = stats?.stats || { open: 0, investigating: 0, resolved: 0, total: 0 };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          s.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginBottom: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Financial Reconciliation</Text>
        <Text style={[s.headerSubtitle, { color: colors.tabIconDefault }]}>
          LedgerMind: Transaction State Integrity
        </Text>
      </View>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.statsContainer}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
      >
        <View
          style={[
            s.statCard,
            {
              backgroundColor: colors.card,
              borderColor: '#FF3B30',
            },
          ]}
        >
          <Text style={[s.statLabel, { color: colors.tabIconDefault }]}>Open Issues</Text>
          <Text
            style={[
              s.statValue,
              {
                color: '#FF3B30',
              },
            ]}
          >
            {statsDisplay.open}
          </Text>
        </View>

        <View
          style={[
            s.statCard,
            {
              backgroundColor: colors.card,
              borderColor: '#FF9500',
            },
          ]}
        >
          <Text style={[s.statLabel, { color: colors.tabIconDefault }]}>Investigating</Text>
          <Text
            style={[
              s.statValue,
              {
                color: '#FF9500',
              },
            ]}
          >
            {statsDisplay.investigating}
          </Text>
        </View>

        <View
          style={[
            s.statCard,
            {
              backgroundColor: colors.card,
              borderColor: '#34C759',
            },
          ]}
        >
          <Text style={[s.statLabel, { color: colors.tabIconDefault }]}>Resolved</Text>
          <Text
            style={[
              s.statValue,
              {
                color: '#34C759',
              },
            ]}
          >
            {statsDisplay.resolved}
          </Text>
        </View>
      </ScrollView>

      {/* Run Now Button */}
      <TouchableOpacity
        style={[s.runButton, { backgroundColor: colors.tint }]}
        onPress={handleRunNow}
        disabled={runningReconciliation}
      >
        {runningReconciliation ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="play" size={18} color="#FFF" />
            <Text style={s.runButtonText}>Run Reconciliation Now</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Tab Selector */}
      <View
        style={[
          s.tabContainer,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {(['open', 'investigating', 'resolved'] as IssueStatus[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              s.tab,
              activeTab === tab && {
                borderBottomColor: colors.tint,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                s.tabText,
                {
                  color: activeTab === tab ? colors.tint : colors.tabIconDefault,
                  fontWeight: activeTab === tab ? '600' : '400',
                },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Issues List */}
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : issues.length === 0 ? (
        <View style={s.emptyContainer}>
          {statsError ? (
            <>
              <Ionicons name="cloud-offline" size={48} color="#FF3B30" />
              <Text style={[s.emptyText, { color: colors.text }]}>Failed to load</Text>
              <Text style={[s.emptySubtext, { color: colors.tabIconDefault }]}>
                Pull down to retry
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={48} color={colors.tabIconDefault} />
              <Text style={[s.emptyText, { color: colors.text }]}>No {activeTab} issues</Text>
              <Text style={[s.emptySubtext, { color: colors.tabIconDefault }]}>
                Everything looks good!
              </Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={issues}
          renderItem={renderIssueCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity
                style={[s.loadMoreButton, { backgroundColor: colors.tint }]}
                onPress={() => fetchIssues(page + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={s.loadMoreText}>Load More</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

