/**
 * Data Export Component
 * Allows users to export their data in various formats
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  exportAndDownload,
  getExportSizeEstimate,
  formatBytes,
  EXPORT_FORMATS,
  EXPORT_DATA_TYPES,
} from '../services/exportService';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import Card from './ui/Card';

const DATA_TYPE_LABELS = {
  [EXPORT_DATA_TYPES.JOURNAL_ENTRIES]: {
    label: 'Journal Entries',
    description: 'Your daily journal entries and notes',
    icon: '📝',
  },
  [EXPORT_DATA_TYPES.PETS]: {
    label: 'Pets',
    description: 'Your pet profiles and information',
    icon: '🐕',
  },
  [EXPORT_DATA_TYPES.FAVORITES]: {
    label: 'Favorites',
    description: 'Your saved favorite images',
    icon: '❤️',
  },
  [EXPORT_DATA_TYPES.ACHIEVEMENTS]: {
    label: 'Achievements',
    description: 'Your unlocked achievements',
    icon: '🏆',
  },
  [EXPORT_DATA_TYPES.HEALTH_RECORDS]: {
    label: 'Health Records',
    description: 'Pet health records and reminders',
    icon: '🏥',
  },
  [EXPORT_DATA_TYPES.ACTIVITIES]: {
    label: 'Activities',
    description: 'Your social activity posts',
    icon: '📣',
  },
  [EXPORT_DATA_TYPES.SETTINGS]: {
    label: 'Settings',
    description: 'Your app preferences and settings',
    icon: '⚙️',
  },
};

function DataExport({ onExportComplete, compact = false }) {
  const { user } = useAuth();
  const [selectedFormat, setSelectedFormat] = useState(EXPORT_FORMATS.JSON);
  const [selectedDataTypes, setSelectedDataTypes] = useState([EXPORT_DATA_TYPES.ALL]);
  const [exportStatus, setExportStatus] = useState(null); // null, 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState(null);
  const [estimatedSize, setEstimatedSize] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Estimate export size when options change
  useEffect(() => {
    let mounted = true;

    async function estimateSize() {
      const { sizeBytes } = await getExportSizeEstimate({
        userId: user?.id,
        dataTypes: selectedDataTypes,
        includeLocalData: true,
      });

      if (mounted) {
        setEstimatedSize(sizeBytes);
      }
    }

    estimateSize();

    return () => {
      mounted = false;
    };
  }, [user?.id, selectedDataTypes]);

  const handleDataTypeToggle = (dataType) => {
    if (dataType === EXPORT_DATA_TYPES.ALL) {
      setSelectedDataTypes([EXPORT_DATA_TYPES.ALL]);
      return;
    }

    setSelectedDataTypes((prev) => {
      // Remove "all" if selecting specific types
      const withoutAll = prev.filter((t) => t !== EXPORT_DATA_TYPES.ALL);

      if (withoutAll.includes(dataType)) {
        const newTypes = withoutAll.filter((t) => t !== dataType);
        return newTypes.length === 0 ? [EXPORT_DATA_TYPES.ALL] : newTypes;
      } else {
        return [...withoutAll, dataType];
      }
    });
  };

  const handleExport = async () => {
    setExportStatus('loading');
    setErrorMessage(null);

    try {
      const { success, error } = await exportAndDownload(selectedFormat, {
        userId: user?.id,
        dataTypes: selectedDataTypes,
        includeLocalData: true,
      });

      if (success) {
        setExportStatus('success');
        onExportComplete?.();

        // Reset status after a delay
        setTimeout(() => {
          setExportStatus(null);
        }, 3000);
      } else {
        throw error || new Error('Export failed');
      }
    } catch (error) {
      setExportStatus('error');
      setErrorMessage(error.message || 'Failed to export data');
    }
  };

  const isAllSelected = selectedDataTypes.includes(EXPORT_DATA_TYPES.ALL);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFormat(EXPORT_FORMATS.JSON)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${selectedFormat === EXPORT_FORMATS.JSON
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
              }
            `}
          >
            <FileJson className="w-4 h-4 inline mr-1" />
            JSON
          </button>
          <button
            onClick={() => setSelectedFormat(EXPORT_FORMATS.CSV)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${selectedFormat === EXPORT_FORMATS.CSV
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
              }
            `}
          >
            <FileSpreadsheet className="w-4 h-4 inline mr-1" />
            CSV
          </button>
        </div>

        <Button
          onClick={handleExport}
          loading={exportStatus === 'loading'}
          disabled={exportStatus === 'loading'}
          leftIcon={exportStatus === 'success' ? CheckCircle : Download}
          variant={exportStatus === 'success' ? 'success' : 'primary'}
          size="sm"
        >
          {exportStatus === 'success' ? 'Downloaded!' : 'Export Data'}
        </Button>

        {estimatedSize && (
          <span className="text-xs text-surface-500 dark:text-surface-400">
            ~{formatBytes(estimatedSize)}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card variant="elevated" padding="lg" className="w-full max-w-md">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-surface-800 dark:text-surface-200">
            Export Your Data
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Download a backup of your DogTale data
          </p>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedFormat(EXPORT_FORMATS.JSON)}
              className={`
                flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all
                ${selectedFormat === EXPORT_FORMATS.JSON
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 text-surface-600 dark:text-surface-400'
                }
              `}
            >
              <FileJson className="w-5 h-5" />
              <span className="font-medium">JSON</span>
            </button>
            <button
              onClick={() => setSelectedFormat(EXPORT_FORMATS.CSV)}
              className={`
                flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all
                ${selectedFormat === EXPORT_FORMATS.CSV
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 text-surface-600 dark:text-surface-400'
                }
              `}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span className="font-medium">CSV</span>
            </button>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200 transition-colors w-full"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>Advanced Options</span>
        </button>

        {/* Data Type Selection */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                  Data to Export
                </label>

                {/* All data option */}
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => handleDataTypeToggle(EXPORT_DATA_TYPES.ALL)}
                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-lg">📦</span>
                  <div>
                    <span className="font-medium text-surface-700 dark:text-surface-300">
                      All Data
                    </span>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      Export everything
                    </p>
                  </div>
                </label>

                <div className="border-t border-surface-200 dark:border-surface-700 pt-2 space-y-1">
                  {Object.entries(DATA_TYPE_LABELS).map(([type, { label, description, icon }]) => (
                    <label
                      key={type}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected || selectedDataTypes.includes(type)}
                        disabled={isAllSelected}
                        onChange={() => handleDataTypeToggle(type)}
                        className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500 disabled:opacity-50"
                      />
                      <span className="text-lg">{icon}</span>
                      <div>
                        <span className="font-medium text-surface-700 dark:text-surface-300">
                          {label}
                        </span>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Size Estimate */}
        {estimatedSize !== null && (
          <div className="text-center text-sm text-surface-500 dark:text-surface-400">
            Estimated size: <span className="font-medium">{formatBytes(estimatedSize)}</span>
          </div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {exportStatus === 'error' && errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-300"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          loading={exportStatus === 'loading'}
          disabled={exportStatus === 'loading'}
          leftIcon={
            exportStatus === 'success'
              ? CheckCircle
              : exportStatus === 'loading'
                ? Loader2
                : Download
          }
          variant={exportStatus === 'success' ? 'success' : 'primary'}
          size="lg"
          className="w-full"
        >
          {exportStatus === 'loading'
            ? 'Preparing Export...'
            : exportStatus === 'success'
              ? 'Downloaded Successfully!'
              : 'Export Data'}
        </Button>

        {/* Format Info */}
        <p className="text-xs text-center text-surface-400 dark:text-surface-500">
          {selectedFormat === EXPORT_FORMATS.JSON
            ? 'JSON format is best for backups and importing data'
            : 'CSV format can be opened in spreadsheet applications'}
        </p>
      </div>
    </Card>
  );
}

DataExport.propTypes = {
  onExportComplete: PropTypes.func,
  compact: PropTypes.bool,
};

export default DataExport;
