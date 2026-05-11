import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { payrollService } from '../../services/api/payroll';
import type { OverviewStats, StaffMember, PayrollRun } from '../../services/api/payroll';
import { Colors } from '../../constants/Colors';
import { showAlert, showConfirm } from '../../utils/alert';

type PayrollTab = 'overview' | 'staff' | 'attendance' | 'process';

// StaffMember, PayrollRun, OverviewStats are imported from services/api/payroll

interface PayrollEntry {
  _id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  baseSalary: number;
  bonusAmount: number;
  deductions: number;
  netSalary: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentDate?: string;
}

interface PayrollSummary {
  month: string;
  totalSalary: number;
  totalBonus: number;
  totalDeductions: number;
  staffCount: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  entries: PayrollEntry[];
}

export default function PayrollScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<PayrollTab>('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Overview state
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);

  // Staff list state
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [staffPage, setStaffPage] = useState(1);
  const [staffTotal, setStaffTotal] = useState(0);

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [attendanceGrid, setAttendanceGrid] = useState<any[]>([]);

  // Process payroll state
  const [processMonth, setProcessMonth] = useState(new Date().getMonth());
  const [processYear, setProcessYear] = useState(new Date().getFullYear());
  const [payrollPreview, setPayrollPreview] = useState<PayrollEntry[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRun[]>([]);
  const [showProcessModal, setShowProcessModal] = useState(false);

  // Fetch overview stats
  const fetchOverviewStats = useCallback(async () => {
    const emptyStats: OverviewStats = {
      totalStaff: 0,
      totalMonthlyPayroll: 0,
      avgSalary: 0,
      pendingApprovals: 0,
      merchantsProcessed: 0,
      totalMerchants: 0,
      topMerchants: [],
    };
    try {
      setLoading(true);
      const data = await payrollService.getOverview();
      setOverviewStats(data);
    } catch (error) {
      logger.error('[Payroll] Overview fetch error:', error);
      showAlert('Error', 'Failed to load payroll overview');
      setOverviewStats(emptyStats);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch staff list
  const fetchStaffList = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        const result = await payrollService.getStaff({
          page,
          limit: 20,
          merchantId: selectedStore !== 'all' ? selectedStore : undefined,
        });
        setStaffList(result.data);
        setStaffTotal(result.total);
        setStaffPage(page);
      } catch (error) {
        logger.error('[Payroll] Staff list fetch error:', error);
        setStaffList([]);
        setStaffTotal(0);
        showAlert('Error', 'Failed to load staff list');
      } finally {
        setLoading(false);
      }
    },
    [selectedStore]
  );

  // Fetch attendance
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const weekStart = new Date(attendanceDate);
      weekStart.setDate(attendanceDate.getDate() - attendanceDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const data = await payrollService.getAttendance(
        weekStart.toISOString(),
        weekEnd.toISOString()
      );
      setAttendanceGrid(data);
    } catch (error) {
      logger.error('[Payroll] Attendance fetch error:', error);
      setAttendanceGrid([]);
      showAlert('Error', 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [attendanceDate]);

  // Fetch payroll history
  const fetchPayrollHistory = useCallback(async () => {
    try {
      const data = await payrollService.getHistory({ page: 1, limit: 20 });
      setPayrollHistory(data);
    } catch (error) {
      logger.error('[Payroll] History fetch error:', error);
      setPayrollHistory([]);
    }
  }, []);

  // Process payroll
  const handleProcessPayroll = async () => {
    const totalAmount =
      payrollPreview.length > 0
        ? payrollPreview.reduce((sum, p) => sum + p.netSalary, 0)
        : (overviewStats?.totalMonthlyPayroll ?? 0);
    const staffCount =
      payrollPreview.length > 0 ? payrollPreview.length : (overviewStats?.totalStaff ?? 0);

    const confirmed = await showConfirm(
      'Confirm Payroll Processing',
      `Process payroll for ${new Date(processYear, processMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}?\n\nTotal Amount: ₹${totalAmount.toLocaleString()}\nStaff Count: ${staffCount}`
    );
    if (!confirmed) return;
    try {
      setLoading(true);
      await payrollService.processPayroll({
        month: processMonth + 1,
        year: processYear,
        totalAmount,
        staffCount,
      });
      showAlert('Success', 'Payroll processed successfully');
      setShowProcessModal(false);
      await fetchPayrollHistory();
    } catch (error: any) {
      showAlert('Error', 'Failed to process payroll');
    } finally {
      setLoading(false);
    }
  };

  // Load data when tabs change
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewStats();
    } else if (activeTab === 'staff') {
      fetchStaffList(1);
    } else if (activeTab === 'attendance') {
      fetchAttendance();
    } else if (activeTab === 'process') {
      fetchPayrollHistory();
    }
  }, [activeTab, fetchOverviewStats, fetchStaffList, fetchAttendance, fetchPayrollHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'overview') {
      await fetchOverviewStats();
    } else if (activeTab === 'staff') {
      await fetchStaffList(staffPage);
    } else if (activeTab === 'attendance') {
      await fetchAttendance();
    }
    setRefreshing(false);
  }, [activeTab, fetchOverviewStats, fetchStaffList, fetchAttendance, staffPage]);

  const renderOverviewTab = () => {
    if (loading || !overviewStats) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Cards */}
        <View style={styles.cardGrid}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardLabel, { color: colors.icon }]}>Total Staff</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              {overviewStats.totalStaff}
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardLabel, { color: colors.icon }]}>Monthly Payroll</Text>
            <Text style={[styles.cardValue, { color: '#2ECC71' }]}>
              ₹{(overviewStats.totalMonthlyPayroll / 100000).toFixed(1)}L
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardLabel, { color: colors.icon }]}>Avg Salary</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>
              ₹{(overviewStats.avgSalary / 1000).toFixed(1)}K
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardLabel, { color: colors.icon }]}>Pending</Text>
            <Text style={[styles.cardValue, { color: colors.warning }]}>
              {overviewStats.pendingApprovals}
            </Text>
          </View>
        </View>

        {/* Health Metrics */}
        <View
          style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payroll Health</Text>
          <View style={styles.healthMetric}>
            <Text style={[styles.metricLabel, { color: colors.icon }]}>Merchants Processed</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {overviewStats.merchantsProcessed} / {overviewStats.totalMerchants}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${overviewStats.totalMerchants > 0 ? (overviewStats.merchantsProcessed / overviewStats.totalMerchants) * 100 : 0}%`,
                    backgroundColor: '#FFCD57',
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Top Merchants */}
        {overviewStats?.topMerchants &&
          Array.isArray(overviewStats.topMerchants) &&
          overviewStats.topMerchants.length > 0 && (
            <View
              style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Top 5 by Payroll Cost
              </Text>
              {overviewStats.topMerchants.map((m, i) => (
                <View key={i} style={styles.merchantRow}>
                  <Text style={[styles.merchantName, { color: colors.text }]}>{m.name}</Text>
                  <Text style={[styles.merchantPayroll, { color: colors.tint }]}>
                    ₹{m.payroll.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
      </ScrollView>
    );
  };

  const renderStaffTab = () => {
    return (
      <ScrollView
        contentContainerStyle={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Store Filter */}
        <View
          style={[
            styles.filterContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.filterLabel, { color: colors.icon }]}>Filter by Store:</Text>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: selectedStore === 'all' ? colors.tint : colors.border },
            ]}
            onPress={() => {
              setSelectedStore('all');
              fetchStaffList(1);
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: selectedStore === 'all' ? '#fff' : colors.text },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Staff List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : staffList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={48} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No staff members found</Text>
          </View>
        ) : (
          <>
            <FlatList
              scrollEnabled={false}
              data={staffList}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.staffCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.staffInfo}>
                    <Text style={[styles.staffName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.staffDetail, { color: colors.icon }]}>{item.role}</Text>
                    <Text style={[styles.staffDetail, { color: colors.icon }]}>
                      {item.storeName}
                    </Text>
                  </View>
                  <View style={styles.staffRight}>
                    <View style={[styles.salaryBadge, { backgroundColor: colors.tint + '20' }]}>
                      <Text style={[styles.salaryText, { color: colors.tint }]}>
                        ₹{(item.baseSalary ?? 0).toLocaleString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() =>
                        showAlert(
                          `${item.name}`,
                          `Role: ${item.role}\nStore: ${item.storeName}\nSalary Type: ${item.salaryType}\nBase Salary: ₹${(item.baseSalary ?? 0).toLocaleString()}${item.commissionRate != null ? `\nCommission: ${item.commissionRate}%` : ''}${item.hoursWorked != null ? `\nHours Worked: ${item.hoursWorked}` : ''}`
                        )
                      }
                    >
                      <Ionicons name="chevron-forward" size={20} color={colors.tint} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.staffList}
            />

            {/* Pagination */}
            {staffTotal > 20 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  disabled={staffPage === 1}
                  onPress={() => fetchStaffList(staffPage - 1)}
                  style={[
                    styles.paginationButton,
                    staffPage === 1 && styles.paginationButtonDisabled,
                  ]}
                >
                  <Text style={styles.paginationButtonText}>Prev</Text>
                </TouchableOpacity>
                <Text style={[styles.paginationText, { color: colors.text }]}>
                  Page {staffPage}
                </Text>
                <TouchableOpacity
                  disabled={staffPage * 20 >= staffTotal}
                  onPress={() => fetchStaffList(staffPage + 1)}
                  style={[
                    styles.paginationButton,
                    staffPage * 20 >= staffTotal && styles.paginationButtonDisabled,
                  ]}
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    );
  };

  const renderAttendanceTab = () => {
    return (
      <ScrollView
        contentContainerStyle={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Date Picker */}
        <View
          style={[
            styles.datePickerContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() =>
              setAttendanceDate(new Date(attendanceDate.getTime() - 7 * 24 * 60 * 60 * 1000))
            }
          >
            <Ionicons name="chevron-back" size={24} color={colors.tint} />
          </TouchableOpacity>
          <Text style={[styles.datePickerText, { color: colors.text }]}>
            {attendanceDate.toLocaleDateString()} - Week
          </Text>
          <TouchableOpacity
            onPress={() =>
              setAttendanceDate(new Date(attendanceDate.getTime() + 7 * 24 * 60 * 60 * 1000))
            }
          >
            <Ionicons name="chevron-forward" size={24} color={colors.tint} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : (
          <>
            {/* Attendance Grid Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#22C55E' }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>Present</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>Absent</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>Half-day</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>Leave</Text>
              </View>
            </View>

            {attendanceGrid.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar" size={48} color={colors.icon} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No attendance data</Text>
              </View>
            ) : (
              <View style={[styles.gridContainer, { backgroundColor: colors.card }]}>
                {attendanceGrid.map((item, i) => (
                  <View key={i} style={styles.gridRow}>
                    <Text style={[styles.gridStaffName, { color: colors.text }]}>
                      {(item.staffId?.name || item.name || 'Staff').substring(0, 12)}
                    </Text>
                    {Array(7)
                      .fill(null)
                      .map((_, day) => {
                        const status = item.attendance?.[day]?.status || 'absent';
                        const colors_map: Record<string, string> = {
                          present: '#22C55E',
                          absent: '#EF4444',
                          half_day: '#F59E0B',
                          leave: '#3B82F6',
                        };
                        return (
                          <View
                            key={day}
                            style={[styles.gridCell, { backgroundColor: colors_map[status] }]}
                          >
                            <Text style={styles.gridCellText}>
                              {status === 'present'
                                ? 'P'
                                : status === 'absent'
                                  ? 'A'
                                  : status === 'half_day'
                                    ? 'H'
                                    : 'L'}
                            </Text>
                          </View>
                        );
                      })}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    );
  };

  const renderProcessTab = () => {
    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        {/* Month/Year Selector */}
        <View
          style={[
            styles.monthSelectorContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.monthSelector}>
            <Text style={[styles.selectorLabel, { color: colors.icon }]}>Month:</Text>
            <TouchableOpacity
              style={[styles.selectorButton, { backgroundColor: colors.border }]}
              onPress={() => setProcessMonth((prev) => (prev >= 11 ? 0 : prev + 1))}
              onLongPress={() => setProcessMonth((prev) => (prev <= 0 ? 11 : prev - 1))}
            >
              <Text style={[styles.selectorButtonText, { color: colors.text }]}>
                {new Date(processYear, processMonth).toLocaleString('default', { month: 'short' })}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.monthSelector}>
            <Text style={[styles.selectorLabel, { color: colors.icon }]}>Year:</Text>
            <TouchableOpacity
              style={[styles.selectorButton, { backgroundColor: colors.border }]}
              onPress={() => {
                const currentYear = new Date().getFullYear();
                setProcessYear((prev) => (prev >= currentYear + 1 ? currentYear - 1 : prev + 1));
              }}
              onLongPress={() => {
                const currentYear = new Date().getFullYear();
                setProcessYear((prev) => (prev <= currentYear - 1 ? currentYear + 1 : prev - 1));
              }}
            >
              <Text style={[styles.selectorButtonText, { color: colors.text }]}>{processYear}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payroll History */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Payroll Runs</Text>
          {payrollHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No payroll runs yet</Text>
            </View>
          ) : (
            payrollHistory.slice(0, 3).map((run) => (
              <View
                key={run._id}
                style={[
                  styles.historyCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyDate, { color: colors.text }]}>
                    {new Date(run.year, run.month - 1).toLocaleString('default', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={[styles.historyDetail, { color: colors.icon }]}>
                    {run.staffCount} staff
                  </Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={[styles.historyAmount, { color: colors.tint }]}>
                    ₹{run.totalAmount.toLocaleString()}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          run.status === 'processed'
                            ? '#22C55E20'
                            : run.status === 'pending'
                              ? '#F59E0B20'
                              : '#EF444420',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color:
                            run.status === 'processed'
                              ? '#22C55E'
                              : run.status === 'pending'
                                ? '#F59E0B'
                                : '#EF4444',
                        },
                      ]}
                    >
                      {run.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Process Button */}
        <TouchableOpacity
          onPress={() => setShowProcessModal(true)}
          style={[styles.processButton, { backgroundColor: colors.tint }]}
        >
          <Ionicons name="play" size={20} color="#fff" />
          <Text style={styles.processButtonText}>Run Payroll</Text>
        </TouchableOpacity>

        {/* Info Banner */}
        <View
          style={[
            styles.infoBanner,
            { backgroundColor: colors.warning + '10', borderColor: colors.warning },
          ]}
        >
          <Ionicons name="alert-circle" size={20} color={colors.warning} />
          <Text style={[styles.infoBannerText, { color: colors.text }]}>
            Payroll processing triggers bank transfers via Razorpay Payouts. Transfers complete
            within 2 business days.
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payroll Management</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View
        style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        {(['overview', 'staff', 'attendance', 'process'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabButton,
              activeTab === tab && { borderBottomColor: colors.tint, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === tab ? colors.tint : colors.icon },
              ]}
            >
              {tab === 'overview'
                ? 'Overview'
                : tab === 'staff'
                  ? 'Staff'
                  : tab === 'attendance'
                    ? 'Attendance'
                    : 'Process'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'staff' && renderStaffTab()}
      {activeTab === 'attendance' && renderAttendanceTab()}
      {activeTab === 'process' && renderProcessTab()}

      {/* Process Payroll Modal */}
      <Modal visible={showProcessModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Ionicons
              name="alert-circle"
              size={48}
              color={colors.warning}
              style={{ marginBottom: 12 }}
            />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Confirm Payroll Processing
            </Text>
            <Text style={[styles.modalMessage, { color: colors.icon }]}>
              This will process payroll for all staff members and initiate bank transfers.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowProcessModal(false)}
                style={[styles.modalButton, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleProcessPayroll}
                disabled={loading}
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Process</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginLeft: 12,
  },
  headerSpacer: {
    width: 28,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 0,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 250,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },

  // Overview Tab
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  healthMetric: {
    gap: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  merchantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  merchantName: {
    fontSize: 13,
    fontWeight: '600',
  },
  merchantPayroll: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Staff Tab
  filterContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  staffList: {
    gap: 10,
    marginBottom: 16,
  },
  staffCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  staffDetail: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  staffRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  salaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  salaryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewButton: {
    padding: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFCD57',
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  paginationText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Attendance Tab
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  datePickerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gridContainer: {
    padding: 12,
    borderRadius: 12,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  gridStaffName: {
    width: 60,
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
  },
  gridCell: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  gridCellText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Process Tab
  monthSelectorContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  monthSelector: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  selectorButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectorButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  historySection: {
    marginBottom: 20,
  },
  historyCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyDetail: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  processButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
  },
  infoBannerText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
