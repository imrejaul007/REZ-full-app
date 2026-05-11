import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type {
  Store,
  Alert,
  AllStoresDashboard,
  SKU,
  UnifiedInventory,
  Product,
  Order,
  Staff,
  StoreComparison,
  RevenueData,
  StoreFilters,
  ProductFilters,
  StockTransfer,
} from '../types';

// Generic fetch hook
function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// All Stores Dashboard
export function useAllStoresDashboard() {
  const { data, loading, error, refetch } = useFetch(async () => {
    const response = await api.getAllStoresDashboard();
    return response.data;
  }, []);

  return {
    dashboard: data as AllStoresDashboard | null,
    loading,
    error,
    refetch,
  };
}

// Stores List
export function useStores(filters?: StoreFilters) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filtersState, setFiltersState] = useState<StoreFilters | undefined>(filters);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getStores(filtersState);
      setStores(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stores'));
    } finally {
      setLoading(false);
    }
  }, [filtersState]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const updateFilters = useCallback((newFilters: StoreFilters) => {
    setFiltersState(newFilters);
  }, []);

  return { stores, loading, error, refetch: fetchStores, updateFilters, filters: filtersState };
}

// Single Store
export function useStore(storeId: string) {
  const { data, loading, error, refetch } = useFetch(async () => {
    const response = await api.getStoreById(storeId);
    return response.data;
  }, [storeId]);

  return { store: data as Store | null, loading, error, refetch };
}

// Store Revenue Data
export function useStoreRevenue(storeId: string, days: number = 30) {
  const { data, loading, error, refetch } = useFetch(async () => {
    const response = await api.getRevenueChartData(storeId, days);
    return response.data;
  }, [storeId, days]);

  return { revenueData: data as RevenueData[] | null, loading, error, refetch };
}

// Store Orders
export function useStoreOrders(storeId: string) {
  const { data, loading, error, refetch } = useFetch(async () => {
    const response = await api.getOrdersByStoreId(storeId);
    return response.data;
  }, [storeId]);

  return { orders: data as Order[] | null, loading, error, refetch };
}

// Store Staff
export function useStoreStaff(storeId: string) {
  const { data, loading, error, refetch } = useFetch(async () => {
    const response = await api.getStaffByStoreId(storeId);
    return response.data;
  }, [storeId]);

  return { staff: data as Staff[] | null, loading, error, refetch };
}

// Unified Inventory
export function useUnifiedInventory() {
  const { data, loading, error, refetch } = useFetch(async () => {
    const response = await api.getUnifiedInventory();
    return response.data;
  }, []);

  return { inventory: data as UnifiedInventory | null, loading, error, refetch };
}

// Products
export function useProducts(filters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filtersState, setFiltersState] = useState<ProductFilters | undefined>(filters);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProducts(filtersState);
      setProducts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
    } finally {
      setLoading(false);
    }
  }, [filtersState]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilters = useCallback((newFilters: ProductFilters) => {
    setFiltersState(newFilters);
  }, []);

  return { products, loading, error, refetch: fetchProducts, updateFilters, filters: filtersState };
}

// Store Comparison
export function useStoreComparison(period: 'day' | 'week' | 'month') {
  const { data, loading, error, refetch } = useFetch(async () => {
    const response = await api.getStoreComparison(period);
    return response.data;
  }, [period]);

  return { comparison: data as StoreComparison | null, loading, error, refetch };
}

// Alerts
export function useAlerts() {
  const { data, loading, error, refetch } = useFetch(async () => {
    const response = await api.getAlerts();
    return response.data;
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    await api.acknowledgeAlert(alertId);
    refetch();
  }, [refetch]);

  return { alerts: data as Alert[] | null, loading, error, acknowledgeAlert, refetch };
}

// Stock Transfer
export function useStockTransfer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createTransfer = useCallback(async (transfer: Omit<StockTransfer, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      await api.createStockTransfer(transfer);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create transfer'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createTransfer, loading, error };
}

// Price Update
export function usePriceUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updatePrice = useCallback(async (productId: string, price: number) => {
    setLoading(true);
    setError(null);
    try {
      await api.updateProductPrice(productId, price);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update price'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updatePrice, loading, error };
}

// Selected Store Context
export function useSelectedStore() {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const { store, loading, error, refetch } = useStore(selectedStoreId || '');

  const selectStore = useCallback((storeId: string | null) => {
    setSelectedStoreId(storeId);
  }, []);

  return {
    selectedStoreId,
    selectedStore: store,
    selectStore,
    loading: selectedStoreId ? loading : false,
    error,
    refetch,
  };
}
