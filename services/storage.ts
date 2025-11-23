import { InventoryItem } from '../types';

const STORAGE_KEY = 'stocksnap_inventory_v1';
const CONFIG_KEY = 'stocksnap_sync_config';

export interface SyncConfig {
  enabled: boolean;
  serverUrl: string;
  apiKey?: string;
  autoSync: boolean;
}

export const getSyncConfig = (): SyncConfig => {
  const stored = localStorage.getItem(CONFIG_KEY);
  return stored ? JSON.parse(stored) : { enabled: false, serverUrl: '', autoSync: false };
};

export const saveSyncConfig = (config: SyncConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const loadInventory = async (): Promise<InventoryItem[]> => {
  // 1. Always load local data first for immediate UI render
  const local = localStorage.getItem(STORAGE_KEY);
  let items: InventoryItem[] = local ? JSON.parse(local) : [];

  // 2. If migration is needed (handling old data format), do it here
  if (items.length > 0) {
    items = items.map(item => ({
      ...item,
      minStock: typeof item.minStock === 'number' ? item.minStock : 0,
      history: Array.isArray(item.history) ? item.history : []
    }));
  }

  // 3. Check for sync config
  const config = getSyncConfig();
  if (config.enabled && config.serverUrl) {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
      
      const res = await fetch(config.serverUrl, { headers });
      
      if (res.ok) {
        const cloudItems = await res.json();
        if (Array.isArray(cloudItems)) {
          console.log('Synced with server successfully');
          items = cloudItems;
          // Update local cache with fresh server data
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
      } else {
        console.warn('Sync server responded with error:', res.status);
      }
    } catch (e) {
      console.warn("Sync failed (network error), using local data", e);
    }
  }
  return items;
};

export const saveInventory = async (items: InventoryItem[]): Promise<void> => {
  // 1. Save to local storage immediately
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

  // 2. Push to server if configured
  const config = getSyncConfig();
  if (config.enabled && config.serverUrl) {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

      // We don't await this (fire and forget) to keep UI snappy, 
      // unless we wanted to show a "Saving..." indicator.
      fetch(config.serverUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(items)
      }).catch(e => console.warn("Background sync push failed", e));
      
    } catch (e) {
      console.warn("Sync push failed", e);
    }
  }
};