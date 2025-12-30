import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { getCacheStats, clearCache } from '../../utils/imageCache';

const SettingsModal = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings, isOpen]);

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      const defaults = {
        autoSave: true,
        notifications: false,
        imageQuality: 'high',
        cacheEnabled: true,
        preloadImages: true,
        preloadDays: 3,
        defaultView: 'day',
        animationsEnabled: true,
        compactMode: false,
        autoTheme: false
      };
      setLocalSettings(defaults);
      setHasChanges(true);
    }
  };

  const handleClearCache = () => {
    if (confirm('Clear all cached images? They will be re-downloaded when needed.')) {
      clearCache();
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    }
  };

  const handleClearAllData = () => {
    if (confirm('WARNING: Clear ALL data including journal entries, favorites, and settings? This CANNOT be undone!')) {
      if (confirm('Are you absolutely sure? All your data will be permanently deleted.')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const cacheStats = getCacheStats();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Settings" size="xl">
      <div className="space-y-6">
        {/* General Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            ⚡ General
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-100">Auto-save journal entries</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Automatically save as you type</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoSave}
                onChange={(e) => handleChange('autoSave', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-100">Browser notifications</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get reminders to journal daily</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.notifications}
                onChange={(e) => handleChange('notifications', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-100">Animations enabled</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enable smooth animations and transitions</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.animationsEnabled}
                onChange={(e) => handleChange('animationsEnabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-100">Compact mode</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reduce spacing for more content</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.compactMode}
                onChange={(e) => handleChange('compactMode', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Appearance Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            🎨 Appearance
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label htmlFor="setting-default-view" className="block mb-2">
                <span className="font-medium text-gray-800 dark:text-gray-100">Default view</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Choose your starting view</p>
              </label>
              <select
                id="setting-default-view"
                value={localSettings.defaultView}
                onChange={(e) => handleChange('defaultView', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
              >
                <option value="day">Day View</option>
                <option value="month">Month View</option>
              </select>
            </div>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-100">Auto dark mode</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Follow system theme automatically</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoTheme}
                onChange={(e) => handleChange('autoTheme', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Performance Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            🚀 Performance
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-100">Enable image caching</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cache images for faster loading</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.cacheEnabled}
                onChange={(e) => handleChange('cacheEnabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-100">Preload nearby images</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Preload images for adjacent dates</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.preloadImages}
                onChange={(e) => handleChange('preloadImages', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>

            {localSettings.preloadImages && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <label htmlFor="setting-preload-range" className="block mb-2">
                  <span className="font-medium text-gray-800 dark:text-gray-100">Preload range</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Days to preload: ±{localSettings.preloadDays}
                  </p>
                </label>
                <input
                  id="setting-preload-range"
                  type="range"
                  min="1"
                  max="7"
                  value={localSettings.preloadDays}
                  onChange={(e) => handleChange('preloadDays', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1 day</span>
                  <span>7 days</span>
                </div>
              </div>
            )}

            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label htmlFor="setting-image-quality" className="block mb-2">
                <span className="font-medium text-gray-800 dark:text-gray-100">Image quality</span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Balance quality vs performance</p>
              </label>
              <select
                id="setting-image-quality"
                value={localSettings.imageQuality}
                onChange={(e) => handleChange('imageQuality', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
              >
                <option value="low">Low (faster)</option>
                <option value="medium">Medium</option>
                <option value="high">High (best quality)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            💾 Data Management
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>Cache Status:</strong> {cacheStats.total} images cached ({Math.round((cacheStats.total / cacheStats.maxSize) * 100)}%)
              </p>
              {cacheCleared ? (
                <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-sm">
                  ✓ Cache cleared successfully!
                </div>
              ) : (
                <button
                  onClick={handleClearCache}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Clear Image Cache
                </button>
              )}
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                <strong>⚠️ Danger Zone:</strong> Permanently delete all data
              </p>
              <button
                onClick={handleClearAllData}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {hasChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  settings: PropTypes.object.isRequired,
  onSettingsChange: PropTypes.func.isRequired
};

export default SettingsModal;
