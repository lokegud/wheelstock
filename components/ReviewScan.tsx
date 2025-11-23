
import React, { useState } from 'react';
import { ScannedItem, InventoryItem } from '../types';
import { Button } from './Button';
import { AlertCircle, Check, Trash2, PlusCircle, HelpCircle, CornerDownRight } from 'lucide-react';

interface ReviewScanProps {
  scannedItems: ScannedItem[];
  currentInventory: InventoryItem[];
  onConfirm: (finalItemsToRemove: ScannedItem[]) => void;
  onCancel: () => void;
}

export const ReviewScan: React.FC<ReviewScanProps> = ({ 
  scannedItems, 
  currentInventory,
  onConfirm, 
  onCancel 
}) => {
  const [itemsToProcess, setItemsToProcess] = useState<ScannedItem[]>(scannedItems);

  // Helper to check if item exists in inventory (fuzzy match for UX)
  const findMatch = (name: string) => {
    return currentInventory.find(i => 
      i.name.toLowerCase() === name.toLowerCase() || 
      i.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(i.name.toLowerCase())
    );
  };

  const handleRemove = (index: number) => {
    const newItems = [...itemsToProcess];
    newItems.splice(index, 1);
    setItemsToProcess(newItems);
  };

  const handleSelectAlternative = (index: number, newName: string) => {
    const newItems = [...itemsToProcess];
    newItems[index] = {
      ...newItems[index],
      name: newName,
      confidence: 'high', // User confirmed it
      alternatives: [] // Clear alternatives
    };
    setItemsToProcess(newItems);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-lg mx-auto p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Review Items</h2>
        <p className="text-gray-500">Confirm items to remove or add.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {itemsToProcess.length === 0 ? (
           <div className="text-center py-10 bg-gray-50 rounded-lg">
             <p className="text-gray-500">No items left to process.</p>
           </div>
        ) : (
          itemsToProcess.map((item, index) => {
            const match = findMatch(item.name);
            const isUnknown = !match;
            const isExceeding = match && match.quantity < item.quantity;
            const isLowConfidence = item.confidence === 'low';

            // Determine card style based on state
            let borderColor = 'border-gray-200';
            let bgColor = 'bg-white';
            
            if (isLowConfidence) {
              borderColor = 'border-amber-300';
              bgColor = 'bg-amber-50';
            } else if (isExceeding) {
              borderColor = 'border-red-200';
              bgColor = 'bg-red-50';
            } else if (isUnknown) {
              borderColor = 'border-blue-200';
              bgColor = 'bg-blue-50';
            }

            return (
              <div 
                key={index} 
                className={`p-4 rounded-xl border ${borderColor} ${bgColor} shadow-sm transition-all`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                       <h3 className="font-bold text-lg text-gray-900 truncate">{item.name}</h3>
                       {isLowConfidence && (
                         <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-200 text-amber-800">
                           <HelpCircle size={10} className="mr-1" /> Unsure
                         </span>
                       )}
                    </div>

                    <p className="text-sm text-gray-600 mt-1">
                      Scanned: <span className="font-mono bg-white/50 px-1 rounded">"{item.originalText}"</span>
                      <span className="mx-2">•</span>
                      Qty: <strong>{item.quantity}</strong>
                    </p>
                    
                    {match && (
                       <p className="text-xs text-gray-500 mt-1">Current Stock: {match.quantity}</p>
                    )}
                    
                    {isUnknown && !isLowConfidence && (
                      <div className="flex items-center mt-2 text-blue-700 text-xs font-medium">
                        <PlusCircle size={12} className="mr-1" />
                        <span>Will create new item</span>
                      </div>
                    )}

                    {isExceeding && (
                      <div className="flex items-center mt-2 text-red-700 text-xs font-medium">
                         <AlertCircle size={12} className="mr-1" />
                         <span>Exceeds current stock!</span>
                      </div>
                    )}

                    {/* Alternatives / Did you mean? */}
                    {isLowConfidence && item.alternatives && item.alternatives.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-amber-800 mb-1 flex items-center">
                          <CornerDownRight size={12} className="mr-1" />
                          Did you mean?
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.alternatives.map((alt) => (
                            <button
                              key={alt}
                              onClick={() => handleSelectAlternative(index, alt)}
                              className="px-2 py-1 text-xs bg-white border border-amber-300 text-amber-900 rounded-md hover:bg-amber-100 transition-colors shadow-sm"
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => handleRemove(index)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-white/50 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 bg-gray-50/50 -mx-4 px-4 sticky bottom-0 pb-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => onConfirm(itemsToProcess)}
          icon={<Check size={20} />}
          disabled={itemsToProcess.length === 0}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};