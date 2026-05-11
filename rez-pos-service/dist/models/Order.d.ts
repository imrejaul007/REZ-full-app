import { Order, OrderStatus, Payment, BillSplit, Discount, MenuItem, CreateOrderRequest, AddItemRequest, ItemModifier } from '../types';
export declare class OrderModel {
    private static TAX_RATE;
    private orders;
    private menuItems;
    private orderCounter;
    constructor();
    private initializeMenuItems;
    generateOrderNumber(): string;
    generateItemId(): string;
    generatePaymentId(): string;
    generateSplitId(): string;
    generateReceiptNumber(): string;
    getMenuItem(itemId: string): MenuItem | undefined;
    getAllMenuItems(): MenuItem[];
    calculateItemPrice(menuItem: MenuItem, modifiers: ItemModifier[]): {
        unitPrice: number;
        modifierPrice: number;
    };
    createOrder(request: CreateOrderRequest): Order;
    getOrder(orderId: string): Order | undefined;
    getOrderByNumber(orderNumber: string): Order | undefined;
    getAllOrders(): Order[];
    getOrdersByStatus(status: OrderStatus): Order[];
    addItemToOrder(orderId: string, request: AddItemRequest): Order | null;
    updateItemQuantity(orderId: string, itemId: string, quantity: number): Order | null;
    removeItemFromOrder(orderId: string, itemId: string): Order | null;
    updateOrderStatus(orderId: string, status: OrderStatus): Order | null;
    applyDiscount(orderId: string, discount: Discount): Order | null;
    removeDiscount(orderId: string): Order | null;
    splitBill(orderId: string, splits: BillSplit[]): Order | null;
    addPayment(orderId: string, payment: Payment): Order | null;
    processRefund(orderId: string, paymentId: string, amount: number): Order | null;
    voidOrder(orderId: string, reason: string, voidedBy: string): Order | null;
    private calculateSubtotal;
    private calculateTax;
    private calculateApplicableSubtotal;
    private recalculateOrderTotals;
    private calculateTotalPaid;
    getStatistics(): {
        totalOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
        ordersByStatus: Record<OrderStatus, number>;
    };
}
export declare const orderModel: OrderModel;
//# sourceMappingURL=Order.d.ts.map