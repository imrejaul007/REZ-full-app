import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Store, Check } from 'lucide-react';
import clsx from 'clsx';
import type { Store as StoreType } from '../types';

interface StoreSelectorProps {
  stores: StoreType[];
  selectedStoreId: string | null;
  onSelectStore: (storeId: string | null) => void;
  showAllOption?: boolean;
  className?: string;
}

export function StoreSelector({
  stores,
  selectedStoreId,
  onSelectStore,
  showAllOption = true,
  className,
}: StoreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (storeId: string | null) => {
    onSelectStore(storeId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={clsx('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg',
          'hover:border-gray-300 transition-colors min-w-[200px]',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
        )}
      >
        <Store className="w-4 h-4 text-gray-500" />
        <span className="flex-1 text-left text-sm">
          {selectedStore ? selectedStore.name : 'All Stores'}
        </span>
        <ChevronDown
          className={clsx(
            'w-4 h-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg',
            'max-h-80 overflow-auto'
          )}
        >
          {showAllOption && (
            <button
              onClick={() => handleSelect(null)}
              className={clsx(
                'w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between',
                !selectedStoreId && 'bg-primary-50 text-primary-700'
              )}
            >
              <span className="font-medium">All Stores</span>
              {!selectedStoreId && <Check className="w-4 h-4 text-primary-600" />}
            </button>
          )}

          <div className="border-t border-gray-100" />

          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => handleSelect(store.id)}
              className={clsx(
                'w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between',
                selectedStoreId === store.id && 'bg-primary-50 text-primary-700'
              )}
            >
              <div>
                <span className="font-medium block">{store.name}</span>
                <span className="text-xs text-gray-500">{store.city}</span>
              </div>
              {selectedStoreId === store.id && (
                <Check className="w-4 h-4 text-primary-600" />
              )}
            </button>
          ))}

          {stores.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No stores available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StoreSelector;
