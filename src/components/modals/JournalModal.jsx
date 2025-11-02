import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

const JournalModal = ({ isOpen, onClose, date, initialEntry = '', onSave }) => {
  const [entry, setEntry] = useState(initialEntry);
  const [charCount, setCharCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const maxChars = 1000;

  useEffect(() => {
    setEntry(initialEntry);
    setCharCount(initialEntry.length);
  }, [initialEntry, date]);

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

  const formatDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Journal Entry" size="lg">
      <div className="space-y-4">
        {/* Date Display */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">{formatDate()}</p>
        </div>

        {/* Journal Entry Area */}
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

        {/* Tips */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">💡 Tip:</span> Include details about walks, meals,
            playtime, training progress, or any special moments with your pet!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClear}
            disabled={entry.length === 0}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Clear entry"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Save entry"
          >
            {isSaving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

JournalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  date: PropTypes.instanceOf(Date).isRequired,
  initialEntry: PropTypes.string,
  onSave: PropTypes.func.isRequired
};

JournalModal.defaultProps = {
  initialEntry: ''
};

export default JournalModal;
