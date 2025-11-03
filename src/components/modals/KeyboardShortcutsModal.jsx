import PropTypes from 'prop-types';
import Modal from './Modal';

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  const shortcuts = [
    {
      category: '🧭 Navigation',
      items: [
        { keys: ['←', 'H'], description: 'Previous day' },
        { keys: ['→', 'L'], description: 'Next day' },
        { keys: ['T'], description: 'Go to today' },
        { keys: ['M'], description: 'Toggle month view' },
      ]
    },
    {
      category: '📂 Open Modals',
      items: [
        { keys: ['J'], description: 'Open Journal' },
        { keys: ['A'], description: 'Open AI Chat' },
        { keys: ['F'], description: 'Open Favorites' },
        { keys: ['S'], description: 'Open Statistics' },
        { keys: [','], description: 'Open Settings' },
        { keys: ['?'], description: 'Show keyboard shortcuts (this dialog)' },
      ]
    },
    {
      category: '🎨 Appearance',
      items: [
        { keys: ['D'], description: 'Toggle dark mode' },
        { keys: ['Ctrl', 'Shift', 'T'], description: 'Cycle through themes' },
      ]
    },
    {
      category: '✨ Other',
      items: [
        { keys: ['Esc'], description: 'Close open modal' },
      ]
    }
  ];

  const KeyBadge = ({ keyText }) => (
    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg shadow-sm">
      {keyText}
    </kbd>
  );

  KeyBadge.propTypes = {
    keyText: PropTypes.string.isRequired
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⌨️ Keyboard Shortcuts" size="lg">
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Use these keyboard shortcuts to navigate and interact with DogTale Daily faster.
        </p>

        {shortcuts.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{section.category}</h3>
            <div className="space-y-2">
              {section.items.map((shortcut, itemIdx) => (
                <div
                  key={itemIdx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm text-gray-700">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, keyIdx) => (
                      <span key={keyIdx} className="flex items-center gap-1">
                        <KeyBadge keyText={key} />
                        {keyIdx < shortcut.keys.length - 1 && (
                          <span className="text-gray-400 text-xs">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Shortcuts are disabled when typing in text fields or when a modal is open (except Escape to close).
          </p>
        </div>
      </div>
    </Modal>
  );
};

KeyboardShortcutsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default KeyboardShortcutsModal;
