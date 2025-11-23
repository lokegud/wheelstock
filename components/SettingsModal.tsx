import React, { useState, useEffect } from 'react';
import { X, Server, Shield, CheckCircle, AlertCircle, RefreshCw, Moon, Sun, Settings } from 'lucide-react';
import { Button } from './Button';
import { getSyncConfig, saveSyncConfig, SyncConfig } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncTrigger: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSyncTrigger,
  isDarkMode,
  toggleTheme
}) => {
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
      onSyncTrigger(); 
    }
    onClose();
  };

  const handleTestConnection = async () => {
    if (!config.serverUrl) return;
    setTestStatus('testing');
    try {
      const headers: HeadersInit = {};
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
      
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transition-colors flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-gray-600 dark:text-gray-300" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Settings</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Appearance Section */}
          <section>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Appearance
            </h4>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-amber-100 text-amber-600'}`}>
                  {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Adjust the application theme
                  </p>
                </div>
              </div>
              
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isDarkMode ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>
          </section>

          {/* Sync Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Server size={16} className="text-gray-400 dark:text-gray-500" />
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cloud Sync
              </h4>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Connect to a backend server to sync your inventory across devices.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <input 
                  type="checkbox"
                  id="enableSync"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="enableSync" className="text-sm font-medium text-gray-700 dark:text-gray-200 select-none flex-1">
                  Enable Sync
                </label>
              </div>

              <div className={`space-y-4 transition-all duration-200 ${config.enabled ? 'opacity-100 max-h-96' : 'opacity-50 max-h-0 overflow-hidden'}`}>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                    Server URL
                  </label>
                  <div className="relative">
                    <input 
                      type="url" 
                      value={config.serverUrl}
                      onChange={(e) => setConfig({ ...config, serverUrl: e.target.value })}
                      placeholder="https://api.example.com/inventory"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <Server size={16} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                    API Key
                  </label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={config.apiKey || ''}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="sk_..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                    <Shield size={16} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button 
                    type="button"
                    onClick={handleTestConnection}
                    disabled={!config.serverUrl || testStatus === 'testing'}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
                  >
                    {testStatus === 'testing' && <RefreshCw size={12} className="animate-spin" />}
                    {testStatus === 'idle' && 'Test Connection'}
                    {testStatus === 'testing' && 'Connecting...'}
                    {testStatus === 'success' && <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle size={12}/> Connected</span>}
                    {testStatus === 'error' && <span className="text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle size={12}/> Failed</span>}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 mt-auto">
          <Button variant="secondary" onClick={onClose} className="!py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600">Cancel</Button>
          <Button onClick={handleSave} className="!py-2">Save Settings</Button>
        </div>
      </div>
    </div>
  );
};
