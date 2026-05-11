// Store Types
export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  status: 'active' | 'inactive' | 'pending';
  manager: string;
  phone: string;
  email: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  staffCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

// Alert Types
export interface Alert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'order_pending' | 'staff_shortage';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  storeId: string;
  storeName: string;
  createdAt: Date;
  acknowledged: boolean;
}

// All Stores Dashboard
export interface AllStoresDashboard {
  totalStores: number;
  activeStores: number;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  topStores: Store[];
  alerts: Alert[];
}

// SKU / Inventory Types
export interface SKU {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorderLevel: number;
  storeIds: string[];
  storeStock: Record<string, number>;
  expiresAt?: Date;
  lastRestocked?: Date;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  images: string[];
  storeIds: string[];
  availableStores: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: Date;
}

// Unified Inventory View
export interface UnifiedInventory {
  totalSKUs: number;
  lowStockItems: SKU[];
  outOfStock: SKU[];
  expiringSoon: SKU[];
  topMoving: SKU[];
  slowMoving: SKU[];
}

// Staff Types
export interface Staff {
  id: string;
  name: string;
  role: 'manager' | 'cashier' | 'stock_clerk' | 'security';
  storeId: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  hireDate: Date;
  shifts: Shift[];
}

export interface Shift {
  day: string;
  startTime: string;
  endTime: string;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'upi' | 'wallet';
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

// Store Comparison Report
export interface StoreComparison {
  stores: {
    id: string;
    name: string;
    revenue: number;
    orders: number;
    avgOrder: number;
    topCategory: string;
  }[];
  period: 'day' | 'week' | 'month';
}

// Revenue Chart Data
export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  avgOrder: number;
}

// Filter Types
export interface StoreFilters {
  search: string;
  status: Store['status'] | 'all';
  sortBy: 'name' | 'revenue' | 'orders' | 'rating';
  sortOrder: 'asc' | 'desc';
}

export interface ProductFilters {
  search: string;
  category: string | 'all';
  storeId: string | 'all';
  status: Product['status'] | 'all';
  sortBy: 'name' | 'price' | 'stock';
  sortOrder: 'asc' | 'desc';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Stock Transfer
export interface StockTransfer {
  id: string;
  fromStoreId: string;
  toStoreId: string;
  productId: string;
  quantity: number;
  status: 'pending' | 'approved' | 'shipped' | 'completed';
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}
