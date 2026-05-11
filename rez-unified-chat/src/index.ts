/**
 * Main export file for rez-unified-chat component library
 */

// Components
export { default as UnifiedChat } from './components/UnifiedChat';
export { default as ChatBubble } from './components/ChatBubble';
export { default as QuickActions } from './components/QuickActions';
export { default as OrderFlow } from './components/OrderFlow';
export { default as BookingFlow } from './components/BookingFlow';

// Types
export * from './types/chat';

// Services
export { default as ChatService, generateId } from './services/chatService';
export { MOCK_MENU_ITEMS, MOCK_TIME_SLOTS } from './services/chatService';
