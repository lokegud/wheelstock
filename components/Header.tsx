import React from 'react';
import { Package, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-area-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 text-indigo-600">
              <Package size={24} />
            </div>
            <h1 className="ml-3 text-xl font-bold text-gray-900 tracking-tight">
              StockSnap
            </h1>
          </div>
          
          {onOpenSettings && (
            <button 
              onClick={onOpenSettings}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Settings"
            >
              <Settings size={22} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};