// Canonical order status — source of truth: src/models/Order.ts (IOrder.status schema enum)
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelling'
  | 'cancelled'
  | 'returned'
  | 'refunded';

// Canonical payment status — source of truth: src/models/Order.ts (IOrderPayment.status schema enum)
export type PaymentStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'processing'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type FulfillmentStatus = 'unfulfilled' | 'fulfilled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  sku?: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface OrderCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface OrderPricing {
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
}

export interface OrderDelivery {
  method: 'delivery' | 'pickup';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface OrderPayment {
  method: string;
  transactionId: string;
}

export interface OrderCashback {
  amount: number;
  status: 'pending' | 'paid' | 'failed';
}

export interface Order {
  id: string;
  orderNumber: string;
  merchantId: string;
  customerId: string;
  customer: OrderCustomer;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: OrderItem[];
  pricing: OrderPricing;
  delivery: OrderDelivery;
  payment: OrderPayment;
  cashback: OrderCashback;
  source: 'app' | 'web' | 'pos' | 'phone' | 'online';
  priority: 'normal' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  fulfilledAt?: Date;
  internalNotes?: string;
}
