/**
 * OrderFlow Component
 * Order placement flow with menu selection and cart management
 */

import React, { useState, useEffect } from 'react';
import { MenuItem, OrderItem, OrderFlowState } from '../types/chat';
import { MOCK_MENU_ITEMS, generateId } from '../services/chatService';

interface OrderFlowProps {
  onClose: () => void;
  onPlaceOrder: (items: OrderItem[], tableNumber?: string) => Promise<void>;
  onBack: () => void;
  darkMode?: boolean;
  tableNumber?: string;
  isLoading?: boolean;
}

type OrderStep = 'menu' | 'cart' | 'confirm' | 'payment' | 'summary';

const OrderFlow: React.FC<OrderFlowProps> = ({
  onClose,
  onPlaceOrder,
  onBack,
  darkMode = false,
  tableNumber,
  isLoading = false,
}) => {
  const [step, setStep] = useState<OrderStep>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Map<string, OrderItem>>(
    new Map()
  );
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'room_charge'>('card');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    // Load menu items
    setMenuItems(MOCK_MENU_ITEMS);
  }, []);

  const addToCart = (item: MenuItem) => {
    const newItems = new Map(selectedItems);
    const existing = newItems.get(item.id);

    if (existing) {
      newItems.set(item.id, { ...existing, quantity: existing.quantity + 1 });
    } else {
      newItems.set(item.id, { menuItem: item, quantity: 1 });
    }

    setSelectedItems(newItems);
  };

  const removeFromCart = (itemId: string) => {
    const newItems = new Map(selectedItems);
    const existing = newItems.get(itemId);

    if (existing && existing.quantity > 1) {
      newItems.set(itemId, { ...existing, quantity: existing.quantity - 1 });
    } else {
      newItems.delete(itemId);
    }

    setSelectedItems(newItems);
  };

  const getItemQuantity = (itemId: string): number => {
    return selectedItems.get(itemId)?.quantity || 0;
  };

  const getCartTotal = (): number => {
    let total = 0;
    selectedItems.forEach((item) => {
      total += item.menuItem.price * item.quantity;
    });
    return total;
  };

  const getCartItemCount = (): number => {
    let count = 0;
    selectedItems.forEach((item) => {
      count += item.quantity;
    });
    return count;
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const items = Array.from(selectedItems.values());
      await onPlaceOrder(items, tableNumber);
      setStep('summary');
    } catch (error) {
      console.error('Failed to place order:', error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const renderMenuStep = () => (
    <div className="order-menu">
      <div className="menu-grid">
        {menuItems.map((item) => (
          <div key={item.id} className="menu-item">
            <div className="menu-item-header">
              <h4>{item.name}</h4>
              <span className="menu-price">${item.price.toFixed(2)}</span>
            </div>
            {item.description && (
              <p className="menu-description">{item.description}</p>
            )}
            {item.category && (
              <span className="menu-category">{item.category}</span>
            )}
            <div className="menu-item-actions">
              {item.available ? (
                <>
                  <span className="item-count">{getItemQuantity(item.id)}</span>
                  {getItemQuantity(item.id) > 0 && (
                    <button
                      className="qty-btn minus"
                      onClick={() => removeFromCart(item.id)}
                    >
                      -
                    </button>
                  )}
                  <button className="qty-btn add" onClick={() => addToCart(item)}>
                    +
                  </button>
                </>
              ) : (
                <span className="unavailable">Unavailable</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCartStep = () => (
    <div className="order-cart">
      {selectedItems.size === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <button onClick={() => setStep('menu')}>Browse Menu</button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {Array.from(selectedItems.values()).map((item) => (
              <div key={item.menuItem.id} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.menuItem.name}</span>
                  <span className="cart-item-price">
                    ${(item.menuItem.price * item.quantity).toFixed(2)}
                  </span>
                </div>
                <div className="cart-item-qty">
                  <button onClick={() => removeFromCart(item.menuItem.id)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => addToCart(item.menuItem)}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-total">
            <span>Total</span>
            <span>${getCartTotal().toFixed(2)}</span>
          </div>
          <div className="special-instructions">
            <label>Special Instructions</label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any allergies or special requests?"
            />
          </div>
        </>
      )}
    </div>
  );

  const renderConfirmStep = () => (
    <div className="order-confirm">
      <h3>Confirm Your Order</h3>
      <div className="confirm-items">
        {Array.from(selectedItems.values()).map((item) => (
          <div key={item.menuItem.id} className="confirm-item">
            <span>
              {item.quantity}x {item.menuItem.name}
            </span>
            <span>${(item.menuItem.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      {specialInstructions && (
        <div className="confirm-instructions">
          <strong>Special Instructions:</strong>
          <p>{specialInstructions}</p>
        </div>
      )}
      {tableNumber && (
        <div className="confirm-table">
          <strong>Table:</strong> {tableNumber}
        </div>
      )}
      <div className="confirm-total">
        <span>Total</span>
        <span>${getCartTotal().toFixed(2)}</span>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="order-payment">
      <h3>Payment Method</h3>
      <div className="payment-options">
        <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="payment"
            value="card"
            checked={paymentMethod === 'card'}
            onChange={() => setPaymentMethod('card')}
          />
          <span className="payment-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </span>
          <span>Card</span>
        </label>
        <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="payment"
            value="cash"
            checked={paymentMethod === 'cash'}
            onChange={() => setPaymentMethod('cash')}
          />
          <span className="payment-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </span>
          <span>Cash</span>
        </label>
        <label className={`payment-option ${paymentMethod === 'room_charge' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="payment"
            value="room_charge"
            checked={paymentMethod === 'room_charge'}
            onChange={() => setPaymentMethod('room_charge')}
          />
          <span className="payment-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          <span>Room Charge</span>
        </label>
      </div>
    </div>
  );

  const renderSummaryStep = () => (
    <div className="order-summary">
      <div className="summary-success">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h3>Order Placed!</h3>
        <p>Your order has been confirmed and will be prepared shortly.</p>
        {tableNumber && <p>Table: {tableNumber}</p>}
        <p className="summary-total">Total: ${getCartTotal().toFixed(2)}</p>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 'menu':
        return renderMenuStep();
      case 'cart':
        return renderCartStep();
      case 'confirm':
        return renderConfirmStep();
      case 'payment':
        return renderPaymentStep();
      case 'summary':
        return renderSummaryStep();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'menu':
        return selectedItems.size > 0;
      case 'cart':
        return selectedItems.size > 0;
      case 'confirm':
        return true;
      case 'payment':
        return true;
      default:
        return false;
    }
  };

  const getNextLabel = () => {
    switch (step) {
      case 'menu':
        return 'Review Order';
      case 'cart':
        return 'Continue';
      case 'confirm':
        return 'Proceed to Payment';
      case 'payment':
        return 'Place Order';
      default:
        return 'Continue';
    }
  };

  return (
    <div className={`order-flow ${darkMode ? 'dark' : 'light'}`}>
      <style>{`
        .order-flow {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .order-flow.light {
          background: #F5F5F5;
        }

        .order-flow.dark {
          background: #0D1B21;
          color: #E9F8F4;
        }

        .order-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid;
        }

        .order-flow.light .order-header {
          background: white;
          border-color: #E0E0E0;
        }

        .order-flow.dark .order-header {
          background: #1C2A33;
          border-color: #3A4F5C;
        }

        .order-header h2 {
          margin: 0;
          font-size: 1.125rem;
        }

        .close-btn, .back-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .order-flow.light .close-btn,
        .order-flow.light .back-btn {
          color: #666;
        }

        .order-flow.dark .close-btn,
        .order-flow.dark .back-btn {
          color: #8899A6;
        }

        .cart-badge {
          background: #4CAF50;
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          border-radius: 1rem;
          margin-left: 0.5rem;
        }

        .order-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1rem;
        }

        .menu-item {
          padding: 1rem;
          border-radius: 0.75rem;
          transition: transform 0.2s ease;
        }

        .order-flow.light .menu-item {
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .order-flow.dark .menu-item {
          background: #1C2A33;
        }

        .menu-item:hover {
          transform: translateY(-2px);
        }

        .menu-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .menu-item-header h4 {
          margin: 0;
          font-size: 0.95rem;
        }

        .menu-price {
          font-weight: 600;
          color: #4CAF50;
        }

        .menu-description {
          font-size: 0.8rem;
          margin: 0.25rem 0;
          color: #888;
        }

        .order-flow.dark .menu-description {
          color: #8899A6;
        }

        .menu-category {
          display: inline-block;
          font-size: 0.7rem;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          background: #E0E0E0;
          color: #666;
          margin-top: 0.25rem;
        }

        .order-flow.dark .menu-category {
          background: #3A4F5C;
          color: #8899A6;
        }

        .menu-item-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .item-count {
          font-weight: 600;
          min-width: 1.5rem;
          text-align: center;
        }

        .qty-btn {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          border: none;
          font-size: 1.25rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qty-btn.add {
          background: #4CAF50;
          color: white;
        }

        .qty-btn.minus {
          background: #FF5722;
          color: white;
        }

        .unavailable {
          font-size: 0.75rem;
          color: #999;
        }

        /* Cart */
        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-radius: 0.5rem;
        }

        .order-flow.light .cart-item {
          background: white;
        }

        .order-flow.dark .cart-item {
          background: #1C2A33;
        }

        .cart-item-info {
          display: flex;
          flex-direction: column;
        }

        .cart-item-name {
          font-weight: 500;
        }

        .cart-item-price {
          font-size: 0.85rem;
          color: #4CAF50;
        }

        .cart-item-qty {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cart-item-qty button {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          border: 1px solid;
          background: transparent;
          cursor: pointer;
          font-size: 1rem;
        }

        .order-flow.light .cart-item-qty button {
          border-color: #E0E0E0;
          color: #666;
        }

        .order-flow.dark .cart-item-qty button {
          border-color: #3A4F5C;
          color: #8899A6;
        }

        .cart-total {
          display: flex;
          justify-content: space-between;
          font-size: 1.25rem;
          font-weight: 600;
          padding: 1rem 0;
          margin-top: 1rem;
          border-top: 1px solid;
        }

        .order-flow.light .cart-total {
          border-color: #E0E0E0;
        }

        .order-flow.dark .cart-total {
          border-color: #3A4F5C;
        }

        .special-instructions {
          margin-top: 1rem;
        }

        .special-instructions label {
          display: block;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .special-instructions textarea {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid;
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .order-flow.light .special-instructions textarea {
          border-color: #E0E0E0;
          background: white;
        }

        .order-flow.dark .special-instructions textarea {
          border-color: #3A4F5C;
          background: #1C2A33;
          color: #E9F8F4;
        }

        .empty-cart {
          text-align: center;
          padding: 3rem 1rem;
        }

        .empty-cart button {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
        }

        /* Confirm */
        .order-confirm h3,
        .order-payment h3 {
          margin: 0 0 1rem;
        }

        .confirm-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .confirm-item {
          display: flex;
          justify-content: space-between;
        }

        .confirm-instructions {
          margin-top: 1rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
        }

        .order-flow.light .confirm-instructions {
          background: #FFF8E1;
        }

        .order-flow.dark .confirm-instructions {
          background: #3A4F5C;
        }

        .confirm-table {
          margin-top: 0.5rem;
        }

        .confirm-total {
          display: flex;
          justify-content: space-between;
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid;
        }

        .order-flow.light .confirm-total {
          border-color: #E0E0E0;
        }

        .order-flow.dark .confirm-total {
          border-color: #3A4F5C;
        }

        /* Payment */
        .payment-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .payment-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 0.75rem;
          cursor: pointer;
          border: 2px solid;
        }

        .order-flow.light .payment-option {
          border-color: #E0E0E0;
          background: white;
        }

        .order-flow.dark .payment-option {
          border-color: #3A4F5C;
          background: #1C2A33;
        }

        .payment-option.selected {
          border-color: #4CAF50;
        }

        .payment-option input {
          display: none;
        }

        .payment-icon {
          display: flex;
          align-items: center;
        }

        /* Summary */
        .summary-success {
          text-align: center;
          padding: 2rem 1rem;
        }

        .summary-success h3 {
          margin: 1rem 0 0.5rem;
          color: #4CAF50;
        }

        .summary-success p {
          margin: 0.25rem 0;
          color: #888;
        }

        .summary-total {
          font-size: 1.25rem;
          font-weight: 600;
          color: #4CAF50 !important;
          margin-top: 1rem !important;
        }

        /* Footer */
        .order-footer {
          padding: 1rem;
          border-top: 1px solid;
        }

        .order-flow.light .order-footer {
          background: white;
          border-color: #E0E0E0;
        }

        .order-flow.dark .order-footer {
          background: #1C2A33;
          border-color: #3A4F5C;
        }

        .footer-actions {
          display: flex;
          gap: 0.75rem;
        }

        .footer-actions button {
          flex: 1;
          padding: 0.875rem;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .footer-actions .back-btn-footer {
          background: transparent;
          border: 1px solid;
        }

        .order-flow.light .footer-actions .back-btn-footer {
          border-color: #E0E0E0;
          color: #666;
        }

        .order-flow.dark .footer-actions .back-btn-footer {
          border-color: #3A4F5C;
          color: #8899A6;
        }

        .footer-actions .next-btn {
          background: #4CAF50;
          color: white;
          border: none;
        }

        .footer-actions .next-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .footer-actions .finish-btn {
          background: #4CAF50;
          color: white;
          border: none;
        }

        @media (max-width: 400px) {
          .menu-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="order-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {step !== 'menu' && step !== 'summary' && (
            <button className="back-btn" onClick={() => setStep(step === 'cart' ? 'menu' : step === 'confirm' ? 'cart' : 'confirm')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <h2>
            {step === 'summary' ? 'Order Confirmed' : 'Place Order'}
            {step !== 'summary' && getCartItemCount() > 0 && (
              <span className="cart-badge">{getCartItemCount()}</span>
            )}
          </h2>
        </div>
        {step !== 'summary' && (
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        {step === 'summary' && (
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="order-content">{renderStep()}</div>

      {step !== 'summary' && (
        <div className="order-footer">
          <div className="footer-actions">
            {step !== 'menu' && (
              <button
                className="back-btn-footer"
                onClick={() => setStep(step === 'confirm' ? 'cart' : 'confirm')}
              >
                Back
              </button>
            )}
            <button
              className={step === 'payment' ? 'finish-btn' : 'next-btn'}
              onClick={() => {
                if (step === 'payment') {
                  handlePlaceOrder();
                } else if (step === 'cart') {
                  setStep('confirm');
                } else if (step === 'confirm') {
                  setStep('payment');
                } else {
                  setStep('cart');
                }
              }}
              disabled={!canProceed() || isPlacingOrder}
            >
              {isPlacingOrder ? 'Placing Order...' : getNextLabel()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderFlow;
