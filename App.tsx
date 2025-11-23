
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InventorySetup } from './components/InventorySetup';
import { Scanner } from './components/Scanner';
import { ReviewScan } from './components/ReviewScan';
import { Button } from './components/Button';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { Sparkline } from './components/Sparkline';
import { WagonWheel } from './components/WagonWheel';
import { AppState, InventoryItem, ScannedItem, SortOption, SortDirection, StockHistoryEntry } from './types';
import { loadInventory, saveInventory } from './services/storage';
import { Plus, ScanLine, Search, ArrowUpDown, AlertTriangle, LayoutGrid, PieChart } from 'lucide-react';

const WagonWheelBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none flex items-center justify-center opacity-[0.15]">
    <svg viewBox="0 0 600 600" className="w-[120vmax] h-[120vmax] text-amber-950">
      {/* Outer Iron Tire */}
      <circle cx="300" cy="300" r="290" fill="none" stroke="currentColor" strokeWidth="8" />
      
      {/* Wooden Felloes (Rim) segments */}
      <circle cx="300" cy="300" r="255" fill="none" stroke="currentColor" strokeWidth="45" />
      
      {/* Separators for felloes */}
      {[0, 60, 120, 180, 240, 300].map(deg => (
         <line key={deg} x1="300" y1="45" x2="300" y2="555" stroke="white" strokeWidth="2" transform={`rotate(${deg} 300 300)`} opacity="0.3"/>
      ))}

      {/* Hub */}
      <circle cx="300" cy="300" r="45" fill="none" stroke="currentColor" strokeWidth="25" />
      <circle cx="300" cy="300" r="15" fill="currentColor" />

      {/* Spokes - Tapered classical style */}
      {[...Array(12)].map((_, i) => (
        <path
          key={i}
          d="M294 300 L288 535 L312 535 L306 300 Z"
          fill="currentColor"
          transform={`rotate(${i * 30} 300 300)`}
        />
      ))}
      
      {/* Rivets on rim */}
      {[...Array(24)].map((_, i) => {
          const angle = (i * 15) * (Math.PI / 180);
          const x = 300 + 280 * Math.cos(angle);
          const y = 300 + 280 * Math.sin(angle);
          return <circle key={i} cx={x} cy={y} r="4" fill="currentColor" />
      })}
    </svg>
  </div>
);

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [scannedResults, setScannedResults] = useState<ScannedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<InventoryItem | null>(null);
  const [dashboardView, setDashboardView] = useState<'inventory' | 'insights'>('inventory');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Load inventory on mount
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const items = await loadInventory();
        if (items.length > 0) {
          setInventory(items);
          setAppState(AppState.DASHBOARD);
        }
      } catch (e) {
        console.error("Failed to load inventory", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();

    // Setup periodic sync (every minute)
    const interval = setInterval(async () => {
      // Background sync pull
      const items = await loadInventory();
      // Only update state if different to prevent UI jitter? 
      // For MVP, we'll just update if we have a valid list to keep things fresh
      if (items.length > 0) {
         setInventory(items);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Save inventory whenever it changes
  useEffect(() => {
    if (inventory.length > 0) {
      saveInventory(inventory);
    }
  }, [inventory]);

  const handleSetupComplete = (updatedItems: InventoryItem[]) => {
    const timestamp = Date.now();
    
    // Compare new items with old inventory to generate history
    const finalItems = updatedItems.map(newItem => {
      const oldItem = inventory.find(i => i.id === newItem.id);
      let history = newItem.history || []; // Preserve history if it exists on newItem (it should)
      
      if (!oldItem) {
        // New item created
        history = [
          ...history,
          {
            id: `hist-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp,
            change: newItem.quantity,
            newQuantity: newItem.quantity,
            reason: 'initial'
          }
        ];
      } else if (oldItem.quantity !== newItem.quantity) {
        // Existing item changed
        const change = newItem.quantity - oldItem.quantity;
        history = [
          ...history,
          {
            id: `hist-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp,
            change,
            newQuantity: newItem.quantity,
            reason: 'manual'
          }
        ];
      }
      // If quantity didn't change, history remains the same
      
      return { ...newItem, history };
    });

    setInventory(finalItems);
    setAppState(AppState.DASHBOARD);
  };

  const handleScanComplete = (results: ScannedItem[]) => {
    setScannedResults(results);
    setAppState(AppState.REVIEW);
  };

  const handleConfirmRemoval = (itemsToRemove: ScannedItem[]) => {
    const timestamp = Date.now();
    let newInventory = [...inventory];

    itemsToRemove.forEach(scan => {
      // Find matching scanned items
      const matchIndex = newInventory.findIndex(
        invItem => scan.name.toLowerCase() === invItem.name.toLowerCase() ||
                invItem.name.toLowerCase().includes(scan.name.toLowerCase()) ||
                scan.name.toLowerCase().includes(invItem.name.toLowerCase())
      );

      if (matchIndex >= 0) {
        // Existing Item Logic: Remove Quantity
        const invItem = newInventory[matchIndex];
        const newQuantity = Math.max(0, invItem.quantity - scan.quantity);
        const change = newQuantity - invItem.quantity; // Should be negative
        
        if (change !== 0) {
          const newHistoryEntry: StockHistoryEntry = {
            id: `hist-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp,
            change,
            newQuantity,
            reason: 'scanned'
          };

          newInventory[matchIndex] = {
            ...invItem,
            quantity: newQuantity,
            history: [...invItem.history, newHistoryEntry]
          };
        }
      } else {
        // New Item Logic: Create Item (inferred usage)
        // Heuristic: If we scanned "5" and it didn't exist, we assume we had 5 and used 5.
        // So Par is 5, Current Stock is 0.
        
        const inferredInitialQuantity = scan.quantity;
        const finalQuantity = 0;
        
        const initialHistory: StockHistoryEntry = {
            id: `hist-init-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: timestamp - 1000, // Slightly in the past
            change: inferredInitialQuantity,
            newQuantity: inferredInitialQuantity,
            reason: 'initial'
        };

        const removeHistory: StockHistoryEntry = {
            id: `hist-scan-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: timestamp,
            change: -scan.quantity,
            newQuantity: finalQuantity,
            reason: 'scanned'
        };

        const newItem: InventoryItem = {
            id: `auto-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            name: scan.name,
            quantity: finalQuantity,
            category: 'Other',
            minStock: scan.quantity, // Set par to what was used
            history: [initialHistory, removeHistory]
        };

        newInventory.push(newItem);
      }
    });

    setInventory(newInventory);
    setAppState(AppState.DASHBOARD);
    setScannedResults([]);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleManualSync = async () => {
    setIsLoading(true);
    try {
      const items = await loadInventory();
      if (items.length > 0) setInventory(items);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and Sort items
  const sortedInventory = [...inventory]
    .filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  if (isLoading && inventory.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <div className="animate-spin text-indigo-600">
            <svg className="h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 relative isolate">
      <WagonWheelBackground />
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto">
        {appState === AppState.SETUP && (
          <InventorySetup 
            onComplete={handleSetupComplete} 
            initialItems={inventory.length > 0 ? inventory : undefined}
          />
        )}

        {appState === AppState.DASHBOARD && (
          <div className="p-4 space-y-6 pb-20">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-500 text-sm">Manage inventory and view insights</p>
              </div>
              
              <div className="flex gap-2">
                 <Button 
                   variant="secondary" 
                   onClick={() => setAppState(AppState.SETUP)}
                   className="flex-1 sm:flex-none"
                   icon={<Plus size={18} />}
                 >
                   Edit Items
                 </Button>
                 <Button 
                   variant="primary" 
                   onClick={() => setAppState(AppState.SCANNING)}
                   className="flex-1 sm:flex-none shadow-indigo-200"
                   icon={<ScanLine size={18} />}
                 >
                   Scan List
                 </Button>
              </div>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex justify-center sm:justify-start">
              <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
                <button
                  onClick={() => setDashboardView('inventory')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    dashboardView === 'inventory' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  <LayoutGrid size={16} className="mr-2" />
                  Inventory
                </button>
                <button
                  onClick={() => setDashboardView('insights')}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    dashboardView === 'insights' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  <PieChart size={16} className="mr-2" />
                  Insights
                </button>
              </div>
            </div>

            {dashboardView === 'insights' ? (
              <div className="animate-fadeIn space-y-6">
                <WagonWheel items={inventory} />
                
                {/* Low Stock Breakdown for Insights View */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="text-red-500 mr-2" size={20} />
                    Critical Stock Alerts
                  </h3>
                  {inventory.filter(i => i.quantity <= i.minStock).length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {inventory
                        .filter(i => i.quantity <= i.minStock)
                        .map(item => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-lg">
                            <div>
                              <p className="font-medium text-red-900">{item.name}</p>
                              <p className="text-xs text-red-700">Par: {item.minStock} • Current: {item.quantity}</p>
                            </div>
                            <Button 
                              variant="secondary" 
                              className="!p-2 h-8 w-8" 
                              onClick={() => {
                                setDashboardView('inventory');
                                setSearchTerm(item.name);
                              }}
                            >
                              <ArrowUpDown size={14} />
                            </Button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">All items are above their par levels. Good job!</p>
                  )}
                </div>
              </div>
            ) : (
              /* Normal Inventory View */
              <div className="animate-fadeIn space-y-6">
                {/* Search and Sort Controls */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search inventory..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="block w-full sm:w-40 py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer"
                    >
                      <option value="name">Name</option>
                      <option value="category">Category</option>
                      <option value="quantity">Quantity</option>
                    </select>

                    <button
                      onClick={toggleSortDirection}
                      className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
                      title={`Sort ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
                    >
                      <ArrowUpDown size={20} className={sortDirection === 'desc' ? 'transform rotate-180' : ''} />
                    </button>
                  </div>
                </div>

                {/* Inventory Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedInventory.map((item) => {
                    const isLowStock = item.quantity <= item.minStock;
                    
                    return (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedItemForHistory(item)}
                        className={`
                          relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group
                          ${isLowStock ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}
                        `}
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                              <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                {item.name}
                              </h3>
                              <p className="text-sm text-gray-500 truncate mt-0.5">
                                {item.category}
                              </p>
                            </div>
                            <div className={`
                              flex flex-col items-center justify-center h-12 w-12 rounded-lg font-bold shadow-sm transition-transform group-hover:scale-105
                              ${isLowStock ? 'bg-red-100 text-red-700 ring-2 ring-red-200' : 'bg-gray-100 text-gray-700'}
                            `}>
                              <span className="text-lg leading-none">{item.quantity}</span>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                            <span>Par Level: {item.minStock}</span>
                            {isLowStock && (
                              <span className="flex items-center text-red-600 font-medium animate-pulse">
                                <AlertTriangle size={12} className="mr-1" />
                                Low Stock
                              </span>
                            )}
                          </div>

                          {/* Sparkline & Progress Area */}
                          <div className="mt-2 space-y-2">
                             {/* Sparkline background for trend */}
                             <div className="h-8 w-full">
                               <Sparkline 
                                  history={item.history} 
                                  color={isLowStock ? '#ef4444' : '#6366f1'} 
                                  showArea={true}
                               />
                             </div>
                             
                             {/* Current level bar */}
                             <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  isLowStock ? 'bg-red-500' : 'bg-indigo-500'
                                }`} 
                                style={{ width: `${Math.min(100, (item.quantity / Math.max(item.minStock * 2, 10)) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <p className="text-[10px] text-center text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            View History
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {sortedInventory.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                       <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                         <Search size={48} />
                       </div>
                       <p className="text-gray-500 font-medium">No items found matching your search.</p>
                       <p className="text-gray-400 text-sm mt-1">Try adjusting filters or adding new items.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {appState === AppState.SCANNING && (
          <Scanner 
            onScanComplete={handleScanComplete} 
            onCancel={() => setAppState(AppState.DASHBOARD)} 
            inventoryNames={inventory.map(i => i.name)}
          />
        )}

        {appState === AppState.REVIEW && (
          <ReviewScan 
            scannedItems={scannedResults}
            currentInventory={inventory}
            onConfirm={handleConfirmRemoval}
            onCancel={() => setAppState(AppState.DASHBOARD)}
          />
        )}
      </main>

      <HistoryModal 
        item={selectedItemForHistory} 
        onClose={() => setSelectedItemForHistory(null)} 
      />
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSyncTrigger={handleManualSync}
      />
    </div>
  );
}

export default App;