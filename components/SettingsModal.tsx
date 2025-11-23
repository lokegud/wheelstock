import React, { useState, useEffect } from 'react';
import { X, Server, Shield, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { getSyncConfig, saveSyncConfig, SyncConfig } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncTrigger: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSyncTrigger }) => {
  const [config, setConfig] = useState<SyncConfig>({
    enabled: false,
    serverUrl: '',
    apiKey: '',
    autoSync: false
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      setConfig(getSyncConfig());
      setTestStatus('idle');
    }
  }, [isOpen]);

  const handleSave = () => {
    saveSyncConfig(config);
    if (config.enabled) {
      onSyncTrigger(); // Trigger an immediate sync/load
    }
    onClose();
  };

  const handleTestConnection = async () => {
    if (!config.serverUrl) return;
    setTestStatus('testing');
    try {
      const headers: HeadersInit = {};
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
      
      // Simple GET to see if endpoint exists/responds
      const res = await fetch(config.serverUrl, { 
        method: 'GET',
        headers
      });
      
      if (res.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (e) {
      setTestStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Server size={20} className="text-indigo-600" />
            <h3 className="font-bold text-lg text-gray-900">Sync Settings</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-500">
            Connect StockSnap to a backend server to sync your inventory across devices (Android, iOS, Web).
          </p>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
             <input 
               type="checkbox"
               id="enableSync"
               checked={config.enabled}
               onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
               className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
             />
             <label htmlFor="enableSync" className="text-sm font-medium text-gray-700 select-none">
               Enable Cloud Sync
             </label>
          </div>

          <div className={`space-y-4 transition-opacity ${config.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                Server URL (GET/POST)
              </label>
              <div className="relative">
                <input 
                  type="url" 
                  value={config.serverUrl}
                  onChange={(e) => setConfig({ ...config, serverUrl: e.target.value })}
                  placeholder="https://api.example.com/inventory"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Server size={16} className="absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                API Key (Optional)
              </label>
              <div className="relative">
                <input 
                  type="password" 
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="sk_..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
                <Shield size={16} className="absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
               <button 
                 type="button"
                 onClick={handleTestConnection}
                 disabled={!config.serverUrl || testStatus === 'testing'}
                 className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
               >
                 {testStatus === 'testing' && <RefreshCw size={12} className="animate-spin" />}
                 {testStatus === 'idle' && 'Test Connection'}
                 {testStatus === 'testing' && 'Connecting...'}
                 {testStatus === 'success' && <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12}/> Connected</span>}
                 {testStatus === 'error' && <span className="text-red-600 flex items-center gap-1"><AlertCircle size={12}/> Failed</span>}
               </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} className="!py-2">Cancel</Button>
          <Button onClick={handleSave} className="!py-2">Save Settings</Button>
        </div>
      </div>
    </div>
  );
};