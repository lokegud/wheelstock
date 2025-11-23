
export interface StockHistoryEntry {
  id: string;
  timestamp: number;
  change: number;
  newQuantity: number;
  reason: 'initial' | 'manual' | 'scanned';
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  minStock: number;
  history: StockHistoryEntry[];
}

export interface ScannedItem {
  name: string;
  quantity: number;
  originalText?: string;
  confidence?: 'high' | 'low';
  alternatives?: string[];
}

export interface AnalysisResult {
  identifiedItems: ScannedItem[];
  rawText?: string;
}

export enum AppState {
  SETUP = 'SETUP',
  DASHBOARD = 'DASHBOARD',
  SCANNING = 'SCANNING',
  REVIEW = 'REVIEW',
}

export const CATEGORIES = [
  "Produce",
  "Dairy",
  "Pantry",
  "Beverages",
  "Household",
  "Other"
];

export type SortOption = 'name' | 'category' | 'quantity';
export type SortDirection = 'asc' | 'desc';