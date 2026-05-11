/**
 * usePOSCart — extracted from app/pos/index.tsx
 *
 * Provides cart state, product loading, persistence, barcode scanning,
 * charge/payment flow, upsell, KOT print, and all related handlers.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import {
  platformAlertSimple,
  platformAlert,
  platformAlertDestructive,
} from '@/utils/platformAlert';
import { useStore } from '@/contexts/StoreContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { posService, POSBillItem } from '@/services/api/pos';
import { productsService } from '@/services/api/products';
import { apiClient } from '@/services/api/client';
import { printerService } from '@/services/printer';
import { offlineService } from '@/services/offline';
import { storageService } from '@/services/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem extends POSBillItem {
  cartId: string;
  gstRate?: number;
}

export interface ProductModifierOption {
  label: string;
  price: number;
  isDefault?: boolean;
}

export interface ProductModifier {
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: ProductModifierOption[];
}

export interface SimpleProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
  inStock: boolean;
  modifiers?: ProductModifier[];
  gstRate?: number;
}

// ─── GST Helpers (also used by the screen) ───────────────────────────────────

export function calcLineGST(price: number, qty: number, gstRate: number) {
  const baseAmount = (price * qty * 100) / (100 + gstRate);
  const gstAmount = price * qty - baseAmount;
  return {
    baseAmount: Math.round(baseAmount * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
  };
}

export function calcBillGST(cartItems: CartItem[]) {
  let subtotal = 0;
  let totalGST = 0;
  const breakdown: Record<number, { base: number; gst: number }> = {};

  for (const item of cartItems) {
    const rate = item.gstRate || 0;
    const { baseAmount, gstAmount } = calcLineGST(item.price, item.quantity, rate);
    subtotal += baseAmount;
    totalGST += gstAmount;
    if (!breakdown[rate]) breakdown[rate] = { base: 0, gst: 0 };
    breakdown[rate].base += baseAmount;
    breakdown[rate].gst += gstAmount;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cgst: Math.round((totalGST / 2) * 100) / 100,
    sgst: Math.round((totalGST / 2) * 100) / 100,
    totalGST: Math.round(totalGST * 100) / 100,
    grandTotal: Math.round((subtotal + totalGST) * 100) / 100,
    breakdown,
  };
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UsePOSCartReturn {
  // State
  products: SimpleProduct[];
  loadingProducts: boolean;
  productError: string | null;
  search: string;
  setSearch: (s: string) => void;
  cart: CartItem[];
  showCart: boolean;
  setShowCart: (s: boolean) => void;
  charging: boolean;
  showBarcodeScanner: boolean;
  setShowBarcodeScanner: (s: boolean) => void;
  webBarcodeInput: string;
  setWebBarcodeInput: (s: string) => void;
  qtyModalVisible: boolean;
  setQtyModalVisible: (s: boolean) => void;
  qtyModalProduct: SimpleProduct | null;
  setQtyModalProduct: (p: SimpleProduct | null) => void;
  qtyInputValue: string;
  setQtyInputValue: (s: string) => void;
  customItemModalVisible: boolean;
  setCustomItemModalVisible: (s: boolean) => void;
  customItemName: string;
  setCustomItemName: (s: string) => void;
  customItemPrice: string;
  setCustomItemPrice: (s: string) => void;
  coinRedemptionAmount: string;
  setCoinRedemptionAmount: (s: string) => void;
  coinDiscountApplied: number;
  coinRedemptionConfirmed: boolean;
  consumerIdForCoins: string | null;
  setConsumerIdForCoins: (s: string | null) => void;
  customerMode: 'none' | 'walk-in' | 'selected';
  setCustomerMode: (m: 'none' | 'walk-in' | 'selected') => void;
  customerId: string | null;
  setCustomerId: (s: string | null) => void;
  customerPhone: string | null;
  setCustomerPhone: (s: string | null) => void;
  splitModalVisible: boolean;
  setSplitModalVisible: (s: boolean) => void;
  splitWays: number;
  setSplitWays: (n: number) => void;
  confirmedSplitCount: number;
  setConfirmedSplitCount: (n: number) => void;
  tableNumber: string;
  setTableNumber: (s: string) => void;
  tableModalVisible: boolean;
  setTableModalVisible: (s: boolean) => void;
  upsellModalVisible: boolean;
  upsellSuggestions: Array<{
    ruleId: string;
    productId: string;
    name: string;
    price: number;
    finalPrice: number;
    image?: string;
    badgeText: string;
    discountPercent?: number;
  }>;
  setUpsellSuggestions: React.Dispatch<
    React.SetStateAction<
      Array<{
        ruleId: string;
        productId: string;
        name: string;
        price: number;
        finalPrice: number;
        image?: string;
        badgeText: string;
        discountPercent?: number;
      }>
    >
  >;
  // Computed
  cartTotal: number;
  cartCount: number;
  perPersonAmount: number;
  filteredProducts: SimpleProduct[];
  // Handlers
  addToCart: (product: SimpleProduct) => void;
  addToCartDirect: (
    product: SimpleProduct,
    modifiers?: Array<{ name: string; price: number }>
  ) => void;
  setItemQty: (cartId: string, qty: number) => void;
  promptQty: (product: SimpleProduct) => void;
  handleQtyModalConfirm: () => void;
  handleAddCustomItem: () => void;
  handleOpenBarcodeScanner: () => Promise<void>;
  handleBarcodeScanned: (data: unknown) => void;
  handleApplyCoinRedemption: () => void;
  handleRemoveCoinRedemption: () => void;
  handleCharge: () => Promise<void>;
  handleUpsellAdd: (suggestion: {
    ruleId: string;
    productId: string;
    name: string;
    finalPrice: number;
  }) => void;
  handleUpsellDismiss: () => Promise<void>;
  handlePrintKOT: () => Promise<void>;
  clearCart: () => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  idempotencyKeyRef: React.MutableRefObject<string | null>;
  setModifierProduct: (p: SimpleProduct | null) => void;
  modifierProduct: SimpleProduct | null;
  selectedModifiers: Record<string, string[]>;
  setSelectedModifiers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  upsellModalVisibleState: boolean;
  setUpsellModalVisible: (s: boolean) => void;
}

export function usePOSCart(): UsePOSCartReturn {
  const { activeStore, isLoading: storeLoading } = useStore();
  const { isOffline, syncStatus } = useNetworkStatus();

  // ── Product State ────────────────────────────────────────────────────────

  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // ── Cart State ──────────────────────────────────────────────────────────

  const [cart, setCart] = useState<CartItem[]>([]);
  const cartLoadedRef = useRef(false);
  const cartPersistDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [charging, setCharging] = useState(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  // ── Scanner State ───────────────────────────────────────────────────────

  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const barcodeScanned = useRef(false);
  const barcodeScannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [webBarcodeInput, setWebBarcodeInput] = useState('');

  // ── Quantity Modal ──────────────────────────────────────────────────────

  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [qtyModalProduct, setQtyModalProduct] = useState<SimpleProduct | null>(null);
  const [qtyInputValue, setQtyInputValue] = useState('');

  // ── Custom Item ─────────────────────────────────────────────────────────

  const [customItemModalVisible, setCustomItemModalVisible] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  // ── Coin Redemption ────────────────────────────────────────────────────

  const [coinRedemptionAmount, setCoinRedemptionAmount] = useState('');
  const [coinDiscountApplied, setCoinDiscountApplied] = useState(0);
  const [coinRedemptionConfirmed, setCoinRedemptionConfirmed] = useState(false);
  const [consumerIdForCoins, setConsumerIdForCoins] = useState<string | null>(null);

  // ── Customer ───────────────────────────────────────────────────────────

  const [customerMode, setCustomerMode] = useState<'none' | 'walk-in' | 'selected'>('none');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);

  // ── Bill Split ─────────────────────────────────────────────────────────

  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [splitWays, setSplitWays] = useState(2);
  const [confirmedSplitCount, setConfirmedSplitCount] = useState(1);

  // ── Table ──────────────────────────────────────────────────────────────

  const [tableNumber, setTableNumber] = useState('');
  const [tableModalVisible, setTableModalVisible] = useState(false);

  // ── Upsell ─────────────────────────────────────────────────────────────

  const [upsellModalVisible, setUpsellModalVisible] = useState(false);
  const [upsellSuggestions, setUpsellSuggestions] = useState<
    Array<{
      ruleId: string;
      productId: string;
      name: string;
      price: number;
      finalPrice: number;
      image?: string;
      badgeText: string;
      discountPercent?: number;
    }>
  >([]);

  // ── Modifier ───────────────────────────────────────────────────────────

  const [modifierProduct, setModifierProduct] = useState<SimpleProduct | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});

  // ── Product Loading ────────────────────────────────────────────────────

  const mapProducts = useCallback((rawProducts: unknown[]): SimpleProduct[] => {
    return (rawProducts as Array<Record<string, unknown>>).map((p) => {
      const firstImage = p.images?.[0] as Record<string, unknown> | string | undefined;
      const imageUrl =
        typeof firstImage === 'string'
          ? firstImage
          : (firstImage as Record<string, unknown>)?.url || p.imageUrl || p.image;
      const stock = (p.inventory as Record<string, unknown>)?.stock ?? p.stock;
      const isAvailable = (p.inventory as Record<string, unknown>)?.isAvailable !== false;
      const pricing = p.pricing as Record<string, unknown> | undefined;
      const gst = pricing?.gst as Record<string, unknown> | undefined;
      return {
        id: (p._id || p.id) as string,
        name: p.name as string,
        price: (pricing?.selling ?? p.price ?? p.basePrice ?? 0) as number,
        imageUrl: imageUrl as string | undefined,
        category: (p.category as Record<string, unknown>)?.name || (p.category as string),
        inStock:
          stock !== undefined
            ? (stock as number) > 0
            : (p.isActive as boolean | undefined) !== false && isAvailable,
        modifiers: (p.modifiers as ProductModifier[]) || [],
        gstRate: (p.gstRate ?? p.taxRate ?? gst?.rate ?? 0) as number,
      };
    });
  }, []);

  const loadProducts = useCallback(
    async (storeId?: string) => {
      setLoadingProducts(true);
      try {
        const result = await productsService.getProducts({
          limit: 100,
          status: 'active',
          ...(storeId ? { storeId } : {}),
        });
        const rawProducts =
          (result as Record<string, unknown>)?.products ||
          ((result as Record<string, unknown>)?.items as unknown[]) ||
          [];
        setProducts(mapProducts(rawProducts));
        offlineService.cacheData({ products: rawProducts }).catch(() => {});
      } catch (e: unknown) {
        const err = e as { message?: string };
        if (__DEV__) console.warn('[POS] Product load failed, trying offline cache:', e);
        setProductError(err?.message || 'Failed to load products');
        const cached = await offlineService.getCachedProducts();
        if (cached.length > 0) {
          setProducts(mapProducts(cached));
        } else if (__DEV__) {
          setProducts([
            { id: '1', name: 'Coffee', price: 80, inStock: true },
            { id: '2', name: 'Sandwich', price: 120, inStock: true },
            { id: '3', name: 'Juice', price: 60, inStock: true },
            { id: '4', name: 'Cake Slice', price: 90, inStock: true },
            { id: '5', name: 'Water Bottle', price: 20, inStock: true },
            { id: '6', name: 'Chips', price: 30, inStock: false },
          ]);
        }
      } finally {
        setLoadingProducts(false);
      }
    },
    [mapProducts]
  );

  // ── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeStore?._id) {
      loadProducts(activeStore._id);
    } else if (!storeLoading) {
      setLoadingProducts(false);
      setProducts([]);
    }

    return () => {
      if (barcodeScannerTimerRef.current) {
        clearTimeout(barcodeScannerTimerRef.current);
      }
    };
  }, [activeStore?._id, storeLoading, loadProducts]);

  // ── Cart Persistence ──────────────────────────────────────────────────

  const cartStorageKey = activeStore?._id ? `pos_cart_${activeStore._id}` : null;

  useEffect(() => {
    if (!cartStorageKey) return;
    cartLoadedRef.current = false;
    let cancelled = false;
    (async () => {
      try {
        const stored = await storageService.get<{
          cart: CartItem[];
          tableNumber?: string;
          confirmedSplitCount?: number;
        }>(cartStorageKey);
        if (cancelled) return;
        if (stored && Array.isArray(stored.cart)) {
          setCart(stored.cart);
          if (typeof stored.tableNumber === 'string') setTableNumber(stored.tableNumber);
          if (typeof stored.confirmedSplitCount === 'number') {
            setConfirmedSplitCount(stored.confirmedSplitCount);
          }
        }
      } catch (e) {
        if (__DEV__) console.warn('[POS] Failed to hydrate cart from storage:', e);
      } finally {
        if (!cancelled) cartLoadedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cartStorageKey]);

  useEffect(() => {
    if (!cartStorageKey || !cartLoadedRef.current) return;
    if (cartPersistDebounceRef.current !== null) {
      clearTimeout(cartPersistDebounceRef.current);
    }
    if (cart.length === 0 && !tableNumber && confirmedSplitCount === 1) {
      storageService.remove(cartStorageKey).catch(() => {});
      return;
    }
    cartPersistDebounceRef.current = setTimeout(() => {
      storageService.set(cartStorageKey, { cart, tableNumber, confirmedSplitCount }).catch((e) => {
        if (__DEV__) console.warn('[POS] Failed to persist cart:', e);
      });
      cartPersistDebounceRef.current = null;
    }, 500);
    return () => {
      if (cartPersistDebounceRef.current !== null) {
        clearTimeout(cartPersistDebounceRef.current);
        cartPersistDebounceRef.current = null;
      }
    };
  }, [cart, tableNumber, confirmedSplitCount, cartStorageKey]);

  // ── Cart Handlers ──────────────────────────────────────────────────────

  const addToCartDirect = useCallback(
    (product: SimpleProduct, modifiers?: Array<{ name: string; price: number }>) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const modifierExtra = modifiers?.reduce((sum, m) => sum + m.price, 0) ?? 0;
      const finalPrice = product.price + modifierExtra;
      setCart((prev) => {
        if (modifiers && modifiers.length > 0) {
          return [
            ...prev,
            {
              cartId: `${product.id}-${uuidv4()}`,
              productId: product.id,
              name:
                modifiers.length > 0
                  ? `${product.name} (${modifiers.map((m) => m.name).join(', ')})`
                  : product.name,
              price: finalPrice,
              quantity: 1,
              imageUrl: product.imageUrl,
              modifiers,
              gstRate: product.gstRate,
            },
          ];
        }
        const existing = prev.find((i) => i.productId === product.id && !i.modifiers?.length);
        if (existing) {
          return prev.map((i) =>
            i.cartId === existing.cartId ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [
          ...prev,
          {
            cartId: `${product.id}-${uuidv4()}`,
            productId: product.id,
            name: product.name,
            price: finalPrice,
            quantity: 1,
            imageUrl: product.imageUrl,
            gstRate: product.gstRate,
          },
        ];
      });
    },
    []
  );

  const addToCart = useCallback(
    (product: SimpleProduct) => {
      if (product.modifiers && product.modifiers.length > 0) {
        setSelectedModifiers({});
        setModifierProduct(product);
      } else {
        addToCartDirect(product);
      }
    },
    [addToCartDirect]
  );

  const setItemQty = useCallback((cartId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.cartId !== cartId));
    } else {
      setCart((prev) => prev.map((i) => (i.cartId === cartId ? { ...i, quantity: qty } : i)));
    }
  }, []);

  const promptQty = useCallback(
    (product: SimpleProduct) => {
      const existing = cart.find((i) => i.productId === product.id);
      setQtyModalProduct(product);
      setQtyInputValue(String(existing?.quantity ?? 1));
      setQtyModalVisible(true);
    },
    [cart]
  );

  const handleQtyModalConfirm = useCallback(() => {
    if (!qtyModalProduct) return;
    const n = parseInt(qtyInputValue, 10);
    if (!isNaN(n) && n >= 0) setItemQty(qtyModalProduct.id, n);
    setQtyModalVisible(false);
    setQtyModalProduct(null);
    setQtyInputValue('');
  }, [qtyModalProduct, qtyInputValue, setItemQty]);

  const handleAddCustomItem = useCallback(() => {
    const name = customItemName.trim();
    const price = parseFloat(customItemPrice);
    if (!name || isNaN(price) || price < 0) {
      platformAlertSimple('Invalid Input', 'Please enter a valid item name and price');
      return;
    }
    const customProduct: SimpleProduct = {
      id: `custom-${uuidv4()}`,
      name,
      price,
      inStock: true,
    };
    addToCart(customProduct);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [customItemName, customItemPrice, addToCart]);

  // ── Barcode Scanning ───────────────────────────────────────────────────

  const handleOpenBarcodeScanner = useCallback(async () => {
    if (Platform.OS === 'web') {
      setWebBarcodeInput('');
      barcodeScanned.current = false;
      setShowBarcodeScanner(true);
      return;
    }
    setWebBarcodeInput('');
    barcodeScanned.current = false;
    setShowBarcodeScanner(true);
  }, []);

  const handleBarcodeScanned = useCallback(
    (data: unknown) => {
      if (barcodeScanned.current) return;
      barcodeScanned.current = true;

      const barcode =
        (data as Record<string, unknown>)?.data || (data as Record<string, unknown>)?.barcode || '';
      if (!barcode) return;

      const product = products.find(
        (p) =>
          p.id === barcode ||
          (p as Record<string, unknown>)?.barcode === barcode ||
          (p as Record<string, unknown>)?.sku === barcode
      );

      if (product && product.inStock) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addToCart(product);
        setShowBarcodeScanner(false);
      } else if (product) {
        platformAlertSimple('Out of Stock', `${product.name} is out of stock.`);
        barcodeScannerTimerRef.current = setTimeout(() => setShowBarcodeScanner(true), 1000);
      } else {
        platformAlertSimple('Product Not Found', `No product found for barcode: ${barcode}`);
        barcodeScannerTimerRef.current = setTimeout(() => setShowBarcodeScanner(true), 1000);
      }
    },
    [products, addToCart]
  );

  // ── Coin Redemption ────────────────────────────────────────────────────

  const handleApplyCoinRedemption = useCallback(() => {
    const amt = parseFloat(coinRedemptionAmount);
    if (isNaN(amt) || amt <= 0) {
      platformAlertSimple('Invalid Amount', 'Please enter a valid coin redemption amount.');
      return;
    }
    const gstInfo = calcBillGST(cart);
    if (amt >= gstInfo.grandTotal) {
      platformAlertSimple('Amount Too High', 'Coin redemption cannot exceed the bill total.');
      return;
    }
    setCoinDiscountApplied(amt);
    setCoinRedemptionConfirmed(true);
  }, [coinRedemptionAmount, cart]);

  const handleRemoveCoinRedemption = useCallback(() => {
    setCoinRedemptionAmount('');
    setCoinDiscountApplied(0);
    setCoinRedemptionConfirmed(false);
  }, []);

  // ── Proceed to Payment ─────────────────────────────────────────────────

  const proceedToPayment = useCallback(async () => {
    if (!activeStore?._id) {
      platformAlertSimple(
        'No store selected',
        'Please select a store from the dashboard before charging.'
      );
      return;
    }
    if (cart.length === 0) {
      platformAlertSimple('Empty cart', 'Add at least one item before charging.');
      return;
    }

    setCharging(true);
    try {
      const items = cart.map(({ productId, name, price, quantity, imageUrl }) => ({
        productId,
        name,
        price,
        quantity,
        imageUrl,
      }));
      const lineItems = cart.map((item) => ({
        name: item.name,
        qty: item.quantity,
        price: item.price,
        gstRate: item.gstRate || 0,
        gstAmount: calcLineGST(item.price, item.quantity, item.gstRate || 0).gstAmount,
      }));

      if (isOffline) {
        const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
        try {
          const coinRedemption =
            coinDiscountApplied > 0 && consumerIdForCoins
              ? { amount: coinDiscountApplied, consumerId: consumerIdForCoins }
              : undefined;
          await posService.enqueueFullBill(
            items,
            activeStore?._id,
            tableNumber || undefined,
            confirmedSplitCount > 1 ? confirmedSplitCount : undefined,
            coinRedemption
          );
        } catch {
          platformAlertSimple(
            'Failed to save bill',
            'We could not save this bill offline. Please try again.'
          );
          return;
        }
        clearCart();
        setShowCart(false);
        setTableNumber('');
        setConfirmedSplitCount(1);
        idempotencyKeyRef.current = null;
        platformAlertSimple(
          'Saved Offline',
          `Bill of ₹${total.toFixed(0)} saved. It will sync automatically when you're back online.`
        );
        return;
      }

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = globalThis.crypto?.randomUUID?.() ?? uuidv4();
      }
      const bill = await posService.createBill(
        items,
        customerMode === 'walk-in' ? 'WALKIN' : (customerPhone ?? undefined),
        activeStore?._id,
        undefined,
        undefined,
        confirmedSplitCount > 1 ? confirmedSplitCount : undefined,
        tableNumber || undefined,
        lineItems,
        coinDiscountApplied > 0
          ? { amount: coinDiscountApplied, discountApplied: coinDiscountApplied }
          : undefined,
        idempotencyKeyRef.current
      );

      if (coinDiscountApplied > 0 && consumerIdForCoins) {
        try {
          await apiClient.post('merchant/wallet/redeem-coins', {
            consumerId: consumerIdForCoins,
            amount: coinDiscountApplied,
            billId: bill.billId,
            storeId: activeStore?._id,
          });
        } catch (e: unknown) {
          if (__DEV__) console.warn('[POS] Coin redemption API call failed:', e);
          platformAlertSimple(
            'Coin redemption failed',
            'We could not record the coin redemption. Please try again without coins.'
          );
          return;
        }
      }

      setCoinRedemptionAmount('');
      setCoinDiscountApplied(0);
      setCoinRedemptionConfirmed(false);
      setConsumerIdForCoins(null);

      const finalAmount = bill.amount - (coinDiscountApplied > 0 ? coinDiscountApplied : 0);
      idempotencyKeyRef.current = null;
    } catch (e: unknown) {
      const err = e as { message?: string };
      platformAlertSimple('Error', err.message || 'Failed to create bill. Please try again.');
    } finally {
      setCharging(false);
    }
  }, [
    activeStore,
    cart,
    isOffline,
    coinDiscountApplied,
    consumerIdForCoins,
    tableNumber,
    confirmedSplitCount,
    customerMode,
    customerPhone,
  ]);

  // ── Handle Charge ─────────────────────────────────────────────────────

  const handleCharge = useCallback(async () => {
    if (cart.length === 0) return;
    if (customerMode === 'none') {
      platformAlertSimple(
        'Customer required',
        'Please select a customer or choose "Walk-in" before charging.'
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!activeStore?._id) {
      platformAlertSimple(
        'No store selected',
        'Please select a store from the dashboard before charging.'
      );
      return;
    }
    await proceedToPayment();
  }, [cart, customerMode, activeStore, proceedToPayment]);

  // ── Upsell ─────────────────────────────────────────────────────────────

  const handleUpsellAdd = useCallback(
    (suggestion: { ruleId: string; productId: string; name: string; finalPrice: number }) => {
      const id = `upsell-${suggestion.productId}-${uuidv4()}`;
      setCart((prev) => [
        ...prev,
        {
          cartId: id,
          productId: suggestion.productId,
          name: suggestion.name,
          price: suggestion.finalPrice,
          quantity: 1,
        } as CartItem,
      ]);
      setUpsellSuggestions((prev) => prev.filter((s) => s.ruleId !== suggestion.ruleId));
    },
    []
  );

  const handleUpsellDismiss = useCallback(async () => {
    setUpsellModalVisible(false);
    setUpsellSuggestions([]);
    await proceedToPayment();
  }, [proceedToPayment]);

  // ── KOT Print ──────────────────────────────────────────────────────────

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handlePrintKOT = useCallback(async () => {
    if (cart.length === 0) return;
    try {
      await printerService.printReceipt({
        storeName: activeStore?.name || 'Kitchen',
        total: cartTotal,
        items: cart.map((i) => ({ name: i.name, qty: i.quantity, price: i.price })),
        ...(tableNumber ? { billNo: `Table ${tableNumber}` } : {}),
        date: new Date().toLocaleString('en-IN'),
      });
    } catch {
      platformAlertSimple('Print Error', 'Could not print KOT. Check printer connection.');
    }
  }, [cart, activeStore, cartTotal, tableNumber]);

  // ── Clear Cart ─────────────────────────────────────────────────────────

  const clearCart = useCallback(() => {
    setCart([]);
    setCustomerMode('none');
    setCustomerId(null);
    setCustomerPhone(null);
    idempotencyKeyRef.current = null;
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────

  const perPersonAmount = splitWays > 0 ? cartTotal / splitWays : 0;
  const filteredProducts = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  // ── Return ─────────────────────────────────────────────────────────────

  return {
    products,
    loadingProducts,
    productError,
    search,
    setSearch,
    cart,
    showCart,
    setShowCart,
    charging,
    showBarcodeScanner,
    setShowBarcodeScanner,
    webBarcodeInput,
    setWebBarcodeInput,
    qtyModalVisible,
    setQtyModalVisible,
    qtyModalProduct,
    setQtyModalProduct,
    qtyInputValue,
    setQtyInputValue,
    customItemModalVisible,
    setCustomItemModalVisible,
    customItemName,
    setCustomItemName,
    customItemPrice,
    setCustomItemPrice,
    coinRedemptionAmount,
    setCoinRedemptionAmount,
    coinDiscountApplied,
    coinRedemptionConfirmed,
    consumerIdForCoins,
    setConsumerIdForCoins,
    customerMode,
    setCustomerMode,
    customerId,
    setCustomerId,
    customerPhone,
    setCustomerPhone,
    splitModalVisible,
    setSplitModalVisible,
    splitWays,
    setSplitWays,
    confirmedSplitCount,
    setConfirmedSplitCount,
    tableNumber,
    setTableNumber,
    tableModalVisible,
    setTableModalVisible,
    upsellModalVisible,
    upsellSuggestions,
    setUpsellSuggestions,
    cartTotal,
    cartCount,
    perPersonAmount,
    filteredProducts,
    addToCart,
    addToCartDirect,
    setItemQty,
    promptQty,
    handleQtyModalConfirm,
    handleAddCustomItem,
    handleOpenBarcodeScanner,
    handleBarcodeScanned,
    handleApplyCoinRedemption,
    handleRemoveCoinRedemption,
    handleCharge,
    handleUpsellAdd,
    handleUpsellDismiss,
    handlePrintKOT,
    clearCart,
    setCart,
    idempotencyKeyRef,
    setModifierProduct,
    modifierProduct,
    selectedModifiers,
    setSelectedModifiers,
    upsellModalVisibleState: upsellModalVisible,
    setUpsellModalVisible,
  };
}
