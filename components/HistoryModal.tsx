
import React from 'react';
import { X, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { InventoryItem } from '../types';
import { Sparkline } from './Sparkline';

interface HistoryModalProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  // Sort history descending by timestamp for the list
  const sortedHistory = [...item.history].sort((a, b) => b.timestamp - a.timestamp);
  const isLowStock = item.quantity <= item.minStock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
            <p className="text-xs text-gray-500">History Log</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Visual Chart Area */}
        <div className="bg-white p-6 border-b border-gray-100">
           <div className="mb-2 flex justify-between items-end">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Stock Trend</span>
              <span className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : 'text-indigo-600'}`}>
                {item.quantity}
              </span>
           </div>
           <div className="h-32 w-full bg-gray-50 rounded-lg p-3 border border-gray-100">
              <Sparkline 
                history={item.history} 
                color={isLowStock ? '#ef4444' : '#6366f1'} 
                showArea={true} 
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          {sortedHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Activity size={32} className="mx-auto mb-2 opacity-50" />
              <p>No history recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedHistory.map((entry) => (
                <div key={entry.id} className="flex gap-4 items-start bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                  <div className={`mt-1 p-1.5 rounded-full flex-shrink-0 ${
                    entry.change > 0 ? 'bg-green-100 text-green-600' : 
                    entry.change < 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {entry.change > 0 ? <TrendingUp size={16} /> : 
                     entry.change < 0 ? <TrendingDown size={16} /> : <Clock size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-medium text-gray-900 text-sm">
                        {entry.reason === 'initial' ? 'Initial Stock' :
                         entry.reason === 'manual' ? 'Manual Adjustment' :
                         entry.reason === 'scanned' ? 'Scanned Removal' : entry.reason}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(entry.timestamp).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>
                        {entry.change > 0 ? '+' : ''}{entry.change} {Math.abs(entry.change) === 1 ? 'unit' : 'units'}
                      </span>
                      <span className="font-semibold text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded">
                        Stock: {entry.newQuantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
