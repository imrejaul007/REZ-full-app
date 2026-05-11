/**
 * app/(dashboard)/rez-now-orders.tsx
 * REZ Now Orders — admin view of all web-ordering (dine-in QR) orders
 *
 * Displays:
 * - Filter bar: status (all/pending/confirmed/preparing/ready/completed/cancelled)
 *   + date range (today/7d/30d)
 * - Paginated table: Order #, Store, Customer, Items, Total, Payment, Status, Date
 * - Tap a row to expand inline: full item list, customer phone, table number
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { apiClient } from '../../services/api/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

type DateRange = 'today' | '7d' | '30d';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface RezNowOrder {
  _id: string;
  orderNumber: string;
  storeName: string;
  storeId: string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  items: OrderItem[];
  itemCount: number;
  total: number;
  paymentStatus: string;
  paymentMethod?: string;
  status: string;
  createdAt: string;
}

interface OrdersResponse {
  orders: RezNowOrder[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { key: OrderStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const DATE_FILTERS: { key: DateRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
];

const PAGE_SIZE = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getStatusColors(status: string): { bg: string; text: string } {
  switch (status.toLowerCase()) {
    case 'pending':
      return { bg: '#fef3c7', text: '#d97706' };
    case 'confirmed':
      return { bg: '#dbeafe', text: '#2563eb' };
    case 'preparing':
      return { bg: '#ffedd5', text: '#ea580c' };
    case 'ready':
      return { bg: '#dcfce7', text: '#16a34a' };
    case 'completed':
      return { bg: '#f3f4f6', text: '#6b7280' };
    case 'cancelled':
      return { bg: '#fee2e2', text: '#dc2626' };
    default:
      return { bg: '#f3f4f6', text: '#6b7280' };
  }
}

function getPaymentStatusColors(status: string): { bg: string; text: string } {
  switch (status.toLowerCase()) {
    case 'paid':
    case 'success':
      return { bg: '#dcfce7', text: '#16a34a' };
    case 'pending':
      return { bg: '#fef3c7', text: '#d97706' };
    case 'failed':
    case 'refunded':
      return { bg: '#fee2e2', text: '#dc2626' };
    default:
      return { bg: '#f3f4f6', text: '#6b7280' };
  }
}

function buildDateFilter(range: DateRange): string {
  const now = new Date();
  if (range === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return `&from=${start.toISOString()}`;
  }
  if (range === '7d') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return `&from=${start.toISOString()}`;
  }
  // 30d
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return `&from=${start.toISOString()}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor?: string;
}

function FilterChip({ label, active, onPress, activeColor = '#3b82f6' }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        active && { backgroundColor: activeColor, borderColor: activeColor },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterChipText, active && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const { bg, text } = getStatusColors(status);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>{status}</Text>
    </View>
  );
}

interface PaymentBadgeProps {
  status: string;
  method?: string;
}

function PaymentBadge({ status, method }: PaymentBadgeProps) {
  const { bg, text } = getPaymentStatusColors(status);
  const label = method ? `${method} · ${status}` : status;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

interface OrderRowProps {
  order: RezNowOrder;
  expanded: boolean;
  onToggle: () => void;
  colors: (typeof Colors)['light'];
}

function OrderRow({ order, expanded, onToggle, colors }: OrderRowProps) {
  return (
    <View style={[styles.orderCard, { backgroundColor: colors.card }]}>
      {/* Main row — tappable */}
      <TouchableOpacity style={styles.orderRowMain} onPress={onToggle} activeOpacity={0.75}>
        {/* Left: order number + store + date */}
        <View style={styles.orderColMain}>
          <Text style={[styles.orderNumber, { color: colors.text }]} numberOfLines={1}>
            #{order.orderNumber}
          </Text>
          <Text style={[styles.orderStore, { color: colors.icon }]} numberOfLines={1}>
            {order.storeName}
          </Text>
          <Text style={[styles.orderDate, { color: colors.icon }]}>
            {formatDate(order.createdAt)}
          </Text>
        </View>

        {/* Middle: customer + items */}
        <View style={styles.orderColMid}>
          <Text style={[styles.orderCustomer, { color: colors.text }]} numberOfLines={1}>
            {order.customerName || order.customerPhone || 'Walk-in'}
          </Text>
          <Text style={[styles.orderItemCount, { color: colors.icon }]}>
            {order.itemCount ?? order.items?.length ?? 0} items
          </Text>
        </View>

        {/* Right: total + payment + status */}
        <View style={styles.orderColRight}>
          <Text style={[styles.orderTotal, { color: colors.text }]}>
            {formatCurrency(order.total ?? 0)}
          </Text>
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
        </View>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.icon}
          style={styles.expandIcon}
        />
      </TouchableOpacity>

      {/* Expanded detail panel */}
      {expanded && (
        <View style={[styles.expandedPanel, { borderTopColor: colors.border ?? '#e5e7eb' }]}>
          {/* Customer info */}
          <View style={styles.expandedRow}>
            <Ionicons name="person-outline" size={14} color={colors.icon} />
            <Text style={[styles.expandedLabel, { color: colors.icon }]}>Customer:</Text>
            <Text style={[styles.expandedValue, { color: colors.text }]}>
              {order.customerName || 'N/A'}
              {order.customerPhone ? `  ·  ${order.customerPhone}` : ''}
            </Text>
          </View>

          {order.tableNumber ? (
            <View style={styles.expandedRow}>
              <Ionicons name="restaurant-outline" size={14} color={colors.icon} />
              <Text style={[styles.expandedLabel, { color: colors.icon }]}>Table:</Text>
              <Text style={[styles.expandedValue, { color: colors.text }]}>
                {order.tableNumber}
              </Text>
            </View>
          ) : null}

          {/* Items list */}
          <View style={[styles.itemsContainer, { borderColor: colors.border ?? '#e5e7eb' }]}>
            <Text style={[styles.itemsHeader, { color: colors.icon }]}>ITEMS</Text>
            {(order.items ?? []).length === 0 ? (
              <Text style={[styles.noItems, { color: colors.icon }]}>
                No item details available
              </Text>
            ) : (
              order.items.map((item, idx) => (
                <View key={idx} style={styles.itemLine}>
                  <Text style={[styles.itemQty, { color: colors.icon }]}>{item.quantity}×</Text>
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemPrice, { color: colors.text }]}>
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </View>
              ))
            )}
            <View style={[styles.itemTotalLine, { borderTopColor: colors.border ?? '#e5e7eb' }]}>
              <Text style={[styles.itemTotalLabel, { color: colors.icon }]}>Total</Text>
              <Text style={[styles.itemTotalValue, { color: colors.text }]}>
                {formatCurrency(order.total ?? 0)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RezNowOrdersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [orders, setOrders] = useState<RezNowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [dateFilter, setDateFilter] = useState<DateRange>('7d');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchInProgressRef = useRef(false);

  const loadOrders = useCallback(
    async (pageNum: number = 1) => {
      if (fetchInProgressRef.current) return;
      fetchInProgressRef.current = true;
      try {
        setError(null);
        const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
        const dateParam = buildDateFilter(dateFilter);
        const url = `admin/web-ordering/orders?limit=${PAGE_SIZE}&page=${pageNum}${statusParam}${dateParam}`;

        const response = await apiClient.get<OrdersResponse>(url);

        if (response.success && response.data) {
          setOrders(response.data.orders ?? []);
          setTotalPages(response.data.totalPages ?? 1);
          setTotalCount(response.data.total ?? 0);
          setPage(pageNum);
        } else {
          // Graceful fallback — endpoint may not exist yet
          setOrders([]);
          setTotalPages(1);
          setTotalCount(0);
          if (response.message && !response.message.includes('404')) {
            setError(response.message);
          }
        }
      } catch (err: any) {
        // 404 = endpoint not deployed yet, show empty state rather than error
        const msg: string = err?.message ?? '';
        if (msg.includes('404') || msg.includes('not found')) {
          setOrders([]);
          setTotalPages(1);
          setTotalCount(0);
        } else {
          setError(msg || 'Failed to load REZ Now orders');
        }
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [statusFilter, dateFilter]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders(1);
    setRefreshing(false);
  }, [loadOrders]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadOrders(1);
    }, [loadOrders])
  );

  const handleStatusChange = useCallback((s: OrderStatus) => {
    setStatusFilter(s);
    setPage(1);
    setExpandedId(null);
  }, []);

  const handleDateChange = useCallback((d: DateRange) => {
    setDateFilter(d);
    setPage(1);
    setExpandedId(null);
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // ── Loading state ──
  if (loading && orders.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  // ── Error state ──
  if (error && orders.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.icon} />
        <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.tint }]}
          onPress={() => {
            setLoading(true);
            setError(null);
            loadOrders(1);
          }}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border ?? '#e5e7eb' }]}>
        <View style={styles.headerLeft}>
          <Ionicons
            name="bag-handle-outline"
            size={22}
            color={colors.tint}
            style={styles.headerIcon}
          />
          <View>
            <Text style={[styles.title, { color: colors.text }]}>REZ Now Orders</Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              Web-ordering (dine-in QR) — {totalCount} total
            </Text>
          </View>
        </View>
      </View>

      {/* ── Filter bar ── */}
      <View style={[styles.filterSection, { borderBottomColor: colors.border ?? '#e5e7eb' }]}>
        {/* Status filter */}
        <Text style={[styles.filterLabel, { color: colors.icon }]}>STATUS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={statusFilter === f.key}
              onPress={() => handleStatusChange(f.key)}
              activeColor={colors.tint}
            />
          ))}
        </ScrollView>

        {/* Date range filter */}
        <Text style={[styles.filterLabel, { color: colors.icon, marginTop: 8 }]}>DATE RANGE</Text>
        <View style={styles.filterRow}>
          {DATE_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={dateFilter === f.key}
              onPress={() => handleDateChange(f.key)}
              activeColor={colors.tint}
            />
          ))}
        </View>
      </View>

      {/* ── Orders list ── */}
      <View style={styles.listSection}>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bag-handle-outline" size={56} color={colors.icon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No orders found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
              {statusFilter !== 'all'
                ? `No ${statusFilter} orders in this date range.`
                : 'REZ Now orders will appear here once placed.'}
            </Text>
          </View>
        ) : (
          <>
            {/* Column headers */}
            <View style={[styles.tableHeader, { backgroundColor: colors.card }]}>
              <Text style={[styles.tableHeaderCell, { flex: 2.2, color: colors.icon }]}>
                ORDER / STORE
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.8, color: colors.icon }]}>
                CUSTOMER
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { flex: 1.6, color: colors.icon, textAlign: 'right' },
                ]}
              >
                TOTAL / STATUS
              </Text>
            </View>

            {orders.map((order) => (
              <OrderRow
                key={order._id}
                order={order}
                expanded={expandedId === order._id}
                onToggle={() => handleToggleExpand(order._id)}
                colors={colors}
              />
            ))}
          </>
        )}
      </View>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <View style={[styles.pagination, { borderTopColor: colors.border ?? '#e5e7eb' }]}>
          <TouchableOpacity
            style={[
              styles.pageBtn,
              { borderColor: colors.border ?? '#e5e7eb' },
              page <= 1 && styles.pageBtnDisabled,
            ]}
            onPress={() => {
              if (page > 1) {
                setLoading(true);
                loadOrders(page - 1);
              }
            }}
            disabled={page <= 1}
          >
            <Ionicons name="chevron-back" size={16} color={page <= 1 ? colors.icon : colors.tint} />
            <Text style={[styles.pageBtnText, { color: page <= 1 ? colors.icon : colors.tint }]}>
              Prev
            </Text>
          </TouchableOpacity>

          <Text style={[styles.pageInfo, { color: colors.icon }]}>
            Page {page} of {totalPages}
          </Text>

          <TouchableOpacity
            style={[
              styles.pageBtn,
              { borderColor: colors.border ?? '#e5e7eb' },
              page >= totalPages && styles.pageBtnDisabled,
            ]}
            onPress={() => {
              if (page < totalPages) {
                setLoading(true);
                loadOrders(page + 1);
              }
            }}
            disabled={page >= totalPages}
          >
            <Text
              style={[
                styles.pageBtnText,
                { color: page >= totalPages ? colors.icon : colors.tint },
              ]}
            >
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={page >= totalPages ? colors.icon : colors.tint}
            />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Header
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    marginRight: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },

  // Filter bar
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 6,
    backgroundColor: 'transparent',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },

  // Table header
  listSection: {
    padding: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // Order card
  orderCard: {
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  orderRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 6,
  },
  orderColMain: {
    flex: 2.2,
    paddingRight: 4,
  },
  orderColMid: {
    flex: 1.8,
    paddingRight: 4,
  },
  orderColRight: {
    flex: 1.6,
    alignItems: 'flex-end',
    gap: 4,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  orderStore: {
    fontSize: 12,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 11,
  },
  orderCustomer: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 3,
  },
  orderItemCount: {
    fontSize: 12,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  expandIcon: {
    marginLeft: 2,
  },

  // Status & payment badges
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 110,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Expanded panel
  expandedPanel: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  expandedLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedValue: {
    fontSize: 12,
    flex: 1,
  },

  // Items
  itemsContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  itemsHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  itemLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '600',
    width: 28,
  },
  itemName: {
    fontSize: 12,
    flex: 1,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderTopWidth: 1,
  },
  itemTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemTotalValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  noItems: {
    fontSize: 12,
    padding: 10,
  },

  // Pagination
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 13,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },

  footer: {
    height: 24,
  },
});
