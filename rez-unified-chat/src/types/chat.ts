/**
 * TypeScript types for Unified Chat Component
 * Used across rez-app-consumer, rez-app-merchant, and web menus
 */

// Message types
export type MessageType = 'text' | 'order' | 'booking' | 'enquiry' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type SenderType = 'user' | 'bot' | 'system';
export type FlowType = 'order' | 'booking' | 'enquiry' | null;

// Quick action types
export type QuickActionType = 'order' | 'book' | 'enquire';

// Menu item for order flow
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  available: boolean;
  quantity?: number;
}

// Order item with quantity
export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

// Order status
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

// Order
export interface Order {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  estimatedReadyTime?: Date;
  tableNumber?: string;
  specialInstructions?: string;
}

// Booking types
export interface BookingDetails {
  id: string;
  date: Date;
  time: string;
  partySize: number;
  name: string;
  phone?: string;
  email?: string;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

// Chat message
export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  sender: SenderType;
  timestamp: Date;
  status: MessageStatus;
  order?: Order;
  booking?: BookingDetails;
  quickReplies?: QuickReply[];
  metadata?: Record<string, unknown>;
}

// Quick reply for bot messages
export interface QuickReply {
  label: string;
  value: string;
}

// Chat session
export interface ChatSession {
  id: string;
  restaurantId?: string;
  tableNumber?: string;
  userId?: string;
  context: 'qr_now' | 'hotel_room' | 'web_menu';
  messages: ChatMessage[];
  activeFlow: FlowType;
  userProfile?: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    wallet?: { coins: number; cash: number };
    karma?: { tier: string; points: number };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Chat configuration
export interface ChatConfig {
  restaurantId: string;
  context: 'qr_now' | 'hotel_room' | 'web_menu';
  tableNumber?: string;
  userId?: string;
  authToken?: string;
  apiBaseUrl?: string;
  enableDarkMode?: boolean;
  enableAnimations?: boolean;
  showTypingIndicator?: boolean;
  typingDelay?: number;
  theme?: 'light' | 'dark' | 'auto';
}

// Order flow state
export interface OrderFlowState {
  step: 'menu' | 'cart' | 'confirm' | 'payment' | 'summary';
  selectedItems: OrderItem[];
  tableNumber?: string;
  specialInstructions?: string;
  paymentMethod?: 'card' | 'cash' | 'room_charge';
}

// Booking flow state
export interface BookingFlowState {
  step: 'date' | 'time' | 'details' | 'confirm';
  selectedDate?: Date;
  selectedTime?: string;
  partySize: number;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  specialRequests?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Typing indicator state
export interface TypingIndicatorState {
  isTyping: boolean;
  agentName?: string;
}

// Event callbacks
export interface ChatCallbacks {
  onMessageSent?: (message: ChatMessage) => void;
  onMessageReceived?: (message: ChatMessage) => void;
  onOrderPlaced?: (order: Order) => void;
  onBookingMade?: (booking: BookingDetails) => void;
  onFlowStarted?: (flow: FlowType) => void;
  onFlowEnded?: (flow: FlowType) => void;
  onError?: (error: string) => void;
}

// Enquiry types
export interface EnquiryDetails {
  type: 'menu' | 'hours' | 'location' | 'allergens' | 'other';
  question: string;
  response?: string;
}

// Available time slots
export interface TimeSlot {
  time: string;
  available: boolean;
}

// Order history
export interface OrderHistory {
  orders: Order[];
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: Date;
}
