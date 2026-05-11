/**
 * useMerchantMode — persists and exposes the merchant's chosen UI mode.
 *
 * Modes: 'simple' | 'growth' | 'advanced'
 * New merchants default to 'simple'. Existing merchants stay at 'advanced'.
 *
 * The mode controls which features appear in the tab bar, dashboard cards,
 * and navigation menu via isFeatureVisibleForVertical().
 */

import { useState, useEffect, useCallback } from 'react';
import { MerchantMode, MERCHANT_MODES } from '@/utils/verticalFeatures';

const MERCHANT_MODE_KEY = 'merchant_ui_mode';

interface UseMerchantModeReturn {
  mode: MerchantMode;
  setMode: (m: MerchantMode) => void;
  modes: typeof MERCHANT_MODES;
}

export function useMerchantMode(): UseMerchantModeReturn {
  const [mode, setModeState] = useState<MerchantMode>('advanced');

  useEffect(() => {
    // Load persisted mode from storage
    import('@/services/storage').then(({ storageService }) => {
      storageService.getItem<string>(MERCHANT_MODE_KEY as any).then((saved: string | null) => {
        if (saved && MERCHANT_MODES.some((m) => m.value === saved)) {
          setModeState(saved as MerchantMode);
        }
      });
    });
  }, []);

  const setMode = useCallback((m: MerchantMode) => {
    setModeState(m);
    import('@/services/storage').then(({ storageService }) => {
      storageService.setItem(MERCHANT_MODE_KEY as any, m);
    });
  }, []);

  return { mode, setMode, modes: MERCHANT_MODES };
}
