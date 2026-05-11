// Admin Socket Hook
// Provides real-time WebSocket connection for admin panel.
//
// SINGLETON CONSOLIDATION: This hook previously maintained its own module-level
// socket singleton (causing two concurrent connections when screens also imported
// socketService directly). It now delegates all socket operations to the canonical
// socketService singleton in services/socket.ts so there is exactly one connection
// at all times regardless of how many screens import either abstraction.

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '../utils/logger';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socket';

interface UseAdminSocketReturn {
  connected: boolean;
  socket: Socket | null;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
}

// ── Consumer ref-count so we connect on first mount and disconnect on last unmount ──

let _consumerCount = 0;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminSocket(): UseAdminSocketReturn {
  const [connected, setConnected] = useState<boolean>(socketService.isSocketConnected());
  const listenersRef = useRef<Array<{ event: string; callback: (...args: any[]) => void }>>([]);

  useEffect(() => {
    _consumerCount += 1;

    // Ensure the canonical singleton is connected. connect() is idempotent —
    // it no-ops if the socket is already connected or connecting.
    socketService.connect().catch((err) => {
      logger.warn('[useAdminSocket] connect() failed:', err);
    });

    // Mirror connection state into React state via the raw socket's events.
    // We use getSocket() which socketService exposes as a public getter.
    const rawSocket = socketService.getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    if (rawSocket) {
      rawSocket.on('connect', onConnect);
      rawSocket.on('disconnect', onDisconnect);
    }

    // ADMIN-016: Reconnect socket when app comes to foreground
    let appStateSubscription: any = null;
    if (Platform.OS !== 'web') {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && !socketService.isSocketConnected()) {
          logger.info('[useAdminSocket] App foregrounded, reconnecting...');
          socketService.connect().catch(() => {});
        }
      };
      appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    }

    return () => {
      // Remove connect/disconnect listeners from the raw socket
      if (rawSocket) {
        rawSocket.off('connect', onConnect);
        rawSocket.off('disconnect', onDisconnect);
      }

      // ADMIN-017: Remove all event listeners registered by this consumer instance
      const socket = socketService.getSocket();
      if (socket) {
        listenersRef.current.forEach(({ event, callback }) => {
          socket.off(event, callback);
        });
      }
      listenersRef.current = [];

      // Release app-state listener
      if (appStateSubscription) {
        appStateSubscription.remove();
      }

      // Decrement consumer count and disconnect only when no consumers remain
      _consumerCount -= 1;
      if (_consumerCount <= 0) {
        _consumerCount = 0;
        socketService.disconnect();
        logger.info('[useAdminSocket] Last consumer unmounted — socket disconnected');
      }
    };
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.on(event, callback);
    } else if (__DEV__) {
      logger.warn('[useAdminSocket] on() called before socket is ready for event:', event);
    }
    listenersRef.current.push({ event, callback });
  }, []);

  const off = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketService.getSocket()?.off(event, callback);
    listenersRef.current = listenersRef.current.filter(
      (l) => !(l.event === event && l.callback === callback)
    );
  }, []);

  const emit = useCallback((event: string, ...args: any[]) => {
    socketService.emit(event, ...args);
  }, []);

  return {
    connected,
    socket: socketService.getSocket(),
    on,
    off,
    emit,
  };
}

export default useAdminSocket;
