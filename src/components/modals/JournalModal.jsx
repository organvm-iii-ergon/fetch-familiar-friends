import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

const JournalModal = ({ isOpen, onClose, date, initialEntry = '', onSave, allEntries = {} }) => {
  const [entry, setEntry] = useState(initialEntry);
  const [charCount, setCharCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'browse'
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const maxChars = 1000;

  useEffect(() => {
    setEntry(initialEntry);
    setCharCount(initialEntry.length);
    setViewMode('edit'); // Reset to edit mode when date changes
    setSearchQuery(''); // Clear search when switching entries
  }, [initialEntry, date]);

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    const entries = Object.entries(allEntries).map(([dateStr, text]) => ({
      date: new Date(dateStr),
      dateStr,
      text
    }));

    let filtered = entries;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.text.toLowerCase().includes(query) ||
        entry.dateStr.toLowerCase().includes(query)
      );
    }

    // Apply date range filter
    if (dateFilter.start) {
      const startDate = new Date(dateFilter.start);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(entry => entry.date >= startDate);
    }

    if (dateFilter.end) {
      const endDate = new Date(dateFilter.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => entry.date <= endDate);
    }

    // Sort by date descending (newest first)
    filtered.sort((a, b) => b.date - a.date);

    return filtered;
  }, [allEntries, searchQuery, dateFilter]);

  const handleChange = (e) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setEntry(text);
      setCharCount(text.length);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(date, entry);
    setIsSaving(false);
    onClose();
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear this entry?')) {
      setEntry('');
      setCharCount(0);
    }
  };

  const formatDate = (dateObj = date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
  };

  const highlightText = (text) => {
    if (!searchQuery.trim()) return text;

    const query = searchQuery.trim();
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleExport = () => {
    const entries = filteredEntries.length > 0 ? filteredEntries : Object.entries(allEntries).map(([dateStr, text]) => ({
      date: new Date(dateStr),
      dateStr,
      text
    }));

    const exportData = entries.map(entry => ({
      date: entry.dateStr || entry.date.toDateString(),
      entry: entry.text
    }));

    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-entries-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    const entries = filteredEntries.length > 0 ? filteredEntries : Object.entries(allEntries).map(([dateStr, text]) => ({
      date: new Date(dateStr),
      dateStr,
      text
    }));

    let textData = 'DogTale Daily - Journal Entries\n';
    textData += '================================\n\n';

    entries.forEach(entry => {
      const dateStr = entry.dateStr || entry.date.toDateString();
      textData += `Date: ${dateStr}\n`;
      textData += `${'-'.repeat(50)}\n`;
      textData += `${entry.text}\n\n`;
    });

    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal-entries-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={viewMode === 'edit' ? 'Journal Entry' : `All Entries (${filteredEntries.length})`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-2 border-b border-gray-200 pb-3">
          <button
            onClick={() => setViewMode('edit')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'edit'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✏️ Edit Entry
          </button>
          <button
            onClick={() => setViewMode('browse')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'browse'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📚 Browse All ({Object.keys(allEntries).length})
          </button>
        </div>

        {viewMode === 'edit' ? (
          /* EDIT MODE */
          <>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">{formatDate()}</p>
            </div>

            <div className="relative">
              <textarea
                value={entry}
                onChange={handleChange}
                placeholder="Write about your day with your furry friend..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                aria-label="Journal entry"
              />
              <div className="absolute bottom-2 right-2 text-sm text-gray-400">
                {charCount}/{maxChars}
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">💡 Tip:</span> Include details about walks, meals,
                playtime, training progress, or any special moments with your pet!
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleClear}
                disabled={entry.length === 0}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isSaving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </>
        ) : (
          /* BROWSE MODE */
          <>
            {/* Search and Filters */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🔍 Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {(searchQuery || dateFilter.start || dateFilter.end) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDateFilter({ start: '', end: '' });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleExportText}
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                📄 Export as Text
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                💾 Export as JSON
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-2xl mb-2">📝</p>
                  <p className="text-sm">
                    {Object.keys(allEntries).length === 0
                      ? 'No journal entries yet. Start writing!'
                      : 'No entries match your search.'}
                  </p>
                </div>
              ) : (
                filteredEntries.map((entryData, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-gray-800">
                        {formatDate(entryData.date)}
                      </p>
                      <span className="text-xs text-gray-500">
                        {entryData.text.split(/\s+/).length} words
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {highlightText(entryData.text)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

JournalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  date: PropTypes.instanceOf(Date).isRequired,
  initialEntry: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  allEntries: PropTypes.object
};

JournalModal.defaultProps = {
  initialEntry: '',
  allEntries: {}
};

export default JournalModal;
