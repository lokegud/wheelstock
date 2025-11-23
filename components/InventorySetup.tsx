
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowRight, Save, Camera, ScanLine } from 'lucide-react';
import { Button } from './Button';
import { InventoryItem, CATEGORIES, ScannedItem } from '../types';
import { Scanner } from './Scanner';

interface InventorySetupProps {
  onComplete: (items: InventoryItem[]) => void;
  initialItems?: InventoryItem[];
}

export const InventorySetup: React.FC<InventorySetupProps> = ({ onComplete, initialItems }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  // Initialize items
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
    } else {
      setItems([
        { id: '1', name: 'Apples', quantity: 10, category: 'Produce', minStock: 5, history: [] },
        { id: '2', name: 'Milk', quantity: 2, category: 'Dairy', minStock: 2, history: [] },
        { id: '3', name: 'Bread', quantity: 3, category: 'Pantry', minStock: 2, history: [] },
      ]);
    }
  }, [initialItems]);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemMinStock, setNewItemMinStock] = useState(0); // Default to 0 to avoid false low stock
  const [newItemCategory, setNewItemCategory] = useState(CATEGORIES[0]);

  const addItem = () => {
    if (!newItemName.trim()) return;
    
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      quantity: newItemQty,
      category: newItemCategory,
      minStock: newItemMinStock,
      history: [], // Initialize empty history
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemMinStock(0); // Reset to 0
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleScanResult = (scannedItems: ScannedItem[]) => {
    const newItems = [...items];
    
    scannedItems.forEach(scanned => {
      // Find if item already exists in our setup list
      const existingIndex = newItems.findIndex(
        i => i.name.toLowerCase() === scanned.name.toLowerCase()
      );

      if (existingIndex >= 0) {
        // Update existing item's quantity
        newItems[existingIndex].quantity = scanned.quantity;
        // Optionally update par if it's the default (0)
        if (newItems[existingIndex].minStock === 0) {
            newItems[existingIndex].minStock = Math.ceil(scanned.quantity * 0.5);
        }
      } else {
        // Add new item
        newItems.push({
          id: `setup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: scanned.name,
          quantity: scanned.quantity,
          category: 'Other', // Default category
          minStock: Math.ceil(scanned.quantity * 0.5), // Smart par guess without forced minimum of 2
          history: []
        });
      }
    });

    setItems(newItems);
    setIsScanning(false);
  };

  if (isScanning) {
    return (
      <Scanner 
        onScanComplete={handleScanResult} 
        onCancel={() => setIsScanning(false)} 
        inventoryNames={items.map(i => i.name)}
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-8 pb-24">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          {initialItems ? 'Edit Inventory' : "Let's set up your stock"}
        </h2>
        <p className="text-gray-500">
          {initialItems ? 'Update your pars and current stock levels.' : 'Add items manually or scan a list to start.'}
        </p>
      </div>

      <div className="flex gap-3 justify-center mb-6">
          <Button 
            variant="secondary" 
            onClick={() => setIsScanning(true)}
            icon={<Camera size={20} />}
            className="w-full sm:w-auto"
          >
            Scan Inventory List
          </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Add Manual Item</h3>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-12 sm:col-span-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
            <input 
              type="text" 
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="e.g. Eggs"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
          </div>
          <div className="col-span-6 sm:col-span-3">
             <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
             <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
             >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
          <div className="col-span-3 sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
            <input 
              type="number" 
              min="0"
              value={newItemQty}
              onChange={(e) => setNewItemQty(parseInt(e.target.value) || 0)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            />
          </div>
          <div className="col-span-3 sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1" title="Minimum Stock Level">Par</label>
            <input 
              type="number" 
              min="0"
              value={newItemMinStock}
              onChange={(e) => setNewItemMinStock(parseInt(e.target.value) || 0)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            />
          </div>
          <div className="col-span-12 sm:col-span-1 flex items-end mt-2 sm:mt-0">
            <Button onClick={addItem} className="w-full py-2 sm:px-2" disabled={!newItemName.trim()}>
              <Plus size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-400 text-sm">No items added yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {items.map((item) => (
              <li key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Current: <span className="font-semibold">{item.quantity}</span> • 
                    Par Level: <span className="font-semibold">{item.minStock}</span>
                  </p>
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom z-20">
        <div className="max-w-xl mx-auto">
          <Button 
            onClick={() => onComplete(items)} 
            className="w-full shadow-lg" 
            disabled={items.length === 0}
            icon={initialItems ? <Save size={20} /> : <ArrowRight size={20} />}
          >
            {initialItems ? 'Save Changes' : 'Finish Setup'}
          </Button>
        </div>
      </div>
    </div>
  );
};
