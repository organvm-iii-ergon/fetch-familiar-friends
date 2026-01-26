import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  loadMemorials,
  createMemorial,
  updateMemorial,
  deleteMemorial,
  lightCandle,
  addTribute,
  getTributes,
  addMemory,
} from '../../utils/memorialStorage';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CandleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const HeartIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

/**
 * Create Memorial Form Component
 */
function CreateMemorialForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    species: 'dog',
    startDate: '',
    endDate: '',
    tribute: '',
    isPublic: false,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'Please enter when they crossed the rainbow bridge';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.form
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Create Memorial Tribute
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XIcon />
          </button>
        </div>

        <div className="space-y-4">
          {/* Pet Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pet's Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter their name"
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Species
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="species"
                  value="dog"
                  checked={formData.species === 'dog'}
                  onChange={handleChange}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Dog</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="species"
                  value="cat"
                  checked={formData.species === 'cat'}
                  onChange={handleChange}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Cat</span>
              </label>
            </div>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Breed
            </label>
            <input
              type="text"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              placeholder="e.g., Golden Retriever, Tabby"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Birth / Adoption Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rainbow Bridge Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg border ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Tribute Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tribute Message
            </label>
            <textarea
              name="tribute"
              value={formData.tribute}
              onChange={handleChange}
              placeholder="Share a loving memory or tribute..."
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Public Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Share memorial with community
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium shadow-md hover:shadow-lg"
          >
            Create Memorial
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

CreateMemorialForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

/**
 * Memorial Card Component
 */
function MemorialCard({ memorial, onLightCandle, onDelete, onAddMemory, isOwn }) {
  const [showTributes, setShowTributes] = useState(false);
  const [tributes, setTributes] = useState([]);
  const [newTribute, setNewTribute] = useState('');
  const [newMemory, setNewMemory] = useState('');
  const [showMemoryInput, setShowMemoryInput] = useState(false);
  const [candleAnimation, setCandleAnimation] = useState(false);

  // Format date range
  const formatYears = () => {
    if (memorial.startDate && memorial.endDate) {
      const start = new Date(memorial.startDate).getFullYear();
      const end = new Date(memorial.endDate).getFullYear();
      return `${start} - ${end}`;
    }
    if (memorial.endDate) {
      return `? - ${new Date(memorial.endDate).getFullYear()}`;
    }
    return memorial.years || '';
  };

  const handleLightCandle = () => {
    setCandleAnimation(true);
    onLightCandle(memorial.id);
    setTimeout(() => setCandleAnimation(false), 1000);
  };

  const handleShowTributes = () => {
    if (!showTributes) {
      setTributes(getTributes(memorial.id));
    }
    setShowTributes(!showTributes);
  };

  const handleAddTribute = (e) => {
    e.preventDefault();
    if (newTribute.trim()) {
      addTribute(memorial.id, 'You', newTribute.trim());
      setTributes(getTributes(memorial.id));
      setNewTribute('');
    }
  };

  const handleAddMemory = (e) => {
    e.preventDefault();
    if (newMemory.trim()) {
      onAddMemory(memorial.id, newMemory.trim());
      setNewMemory('');
      setShowMemoryInput(false);
    }
  };

  const photo = memorial.photo || (memorial.species === 'cat' ? '🐱' : '🐕');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-200 dark:border-purple-800"
    >
      <div className="flex gap-4">
        {/* Photo */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center text-5xl overflow-hidden">
            {photo.startsWith('http') ? (
              <img src={photo} alt={memorial.name} className="w-full h-full object-cover" />
            ) : (
              photo
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h5 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {memorial.name}
              </h5>
              <p className="text-gray-600 dark:text-gray-400">
                {memorial.breed}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                {formatYears()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLightCandle}
                className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <motion.span
                  animate={candleAnimation ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
                >
                  <CandleIcon />
                </motion.span>
                Light Candle
              </motion.button>
              {isOwn && (
                <button
                  onClick={() => onDelete(memorial.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete memorial"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>

          {memorial.tribute && (
            <p className="text-gray-700 dark:text-gray-300 mt-4 italic">
              "{memorial.tribute}"
            </p>
          )}

          {/* Stats */}
          <div className="flex gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="text-lg">📸</span> {memorial.memories?.length || 0} memories
            </span>
            <span className="flex items-center gap-1">
              <motion.span
                animate={candleAnimation ? { scale: [1, 1.3, 1] } : {}}
                className="text-lg"
              >
                🕯️
              </motion.span>
              {memorial.candlesLit || 0} candles
            </span>
            <span className="flex items-center gap-1">
              <span className="text-lg">💬</span> {memorial.tributeCount || 0} tributes
            </span>
          </div>

          {/* Memories */}
          {memorial.memories && memorial.memories.length > 0 && (
            <div className="mt-4 space-y-2">
              {memorial.memories.slice(0, 2).map((memory, idx) => (
                <div key={idx} className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  "{memory}"
                </div>
              ))}
              {memorial.memories.length > 2 && (
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  + {memorial.memories.length - 2} more memories
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={handleShowTributes}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              {showTributes ? 'Hide Tributes' : 'View Tributes'}
            </button>
            {isOwn && (
              <button
                onClick={() => setShowMemoryInput(!showMemoryInput)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Add Memory
              </button>
            )}
          </div>

          {/* Add Memory Input */}
          <AnimatePresence>
            {showMemoryInput && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddMemory}
                className="mt-4"
              >
                <textarea
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  placeholder="Share a cherished memory..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none text-sm"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMemoryInput(false)}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Tributes Section */}
          <AnimatePresence>
            {showTributes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3"
              >
                {tributes.length > 0 ? (
                  tributes.map((tribute) => (
                    <div key={tribute.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">"{tribute.message}"</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        - {tribute.author}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No tributes yet. Be the first to leave one.
                  </p>
                )}

                <form onSubmit={handleAddTribute} className="flex gap-2">
                  <input
                    type="text"
                    value={newTribute}
                    onChange={(e) => setNewTribute(e.target.value)}
                    placeholder="Leave a tribute message..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
                  >
                    Send
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

MemorialCard.propTypes = {
  memorial: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    breed: PropTypes.string,
    species: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    years: PropTypes.string,
    photo: PropTypes.string,
    tribute: PropTypes.string,
    memories: PropTypes.arrayOf(PropTypes.string),
    candlesLit: PropTypes.number,
    tributeCount: PropTypes.number,
  }).isRequired,
  onLightCandle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddMemory: PropTypes.func.isRequired,
  isOwn: PropTypes.bool,
};

/**
 * Main PetMemorial Component
 */
function PetMemorial() {
  const [memorials, setMemorials] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Demo community memorials (would come from backend in production)
  const communityMemorials = [
    {
      id: 'community_1',
      name: 'Bella',
      breed: 'Labrador',
      species: 'dog',
      years: '2008 - 2023',
      photo: '🦮',
      tribute: 'Our sunshine on cloudy days. Thank you for 15 beautiful years.',
      candlesLit: 234,
      tributeCount: 45,
      memories: [],
    },
    {
      id: 'community_2',
      name: 'Max',
      breed: 'Beagle',
      species: 'dog',
      years: '2015 - 2024',
      photo: '🐶',
      tribute: 'Gone too soon but never forgotten. Run free, sweet boy.',
      candlesLit: 156,
      tributeCount: 28,
      memories: [],
    },
  ];

  // Load memorials on mount
  useEffect(() => {
    setMemorials(loadMemorials());
    setLoading(false);
  }, []);

  const handleCreateMemorial = useCallback((formData) => {
    const newMemorial = createMemorial(formData);
    setMemorials(prev => [newMemorial, ...prev]);
    setShowCreateForm(false);
  }, []);

  const handleDeleteMemorial = useCallback((id) => {
    if (window.confirm('Are you sure you want to delete this memorial? This cannot be undone.')) {
      deleteMemorial(id);
      setMemorials(prev => prev.filter(m => m.id !== id));
    }
  }, []);

  const handleLightCandle = useCallback((id) => {
    lightCandle(id);
    setMemorials(prev => prev.map(m =>
      m.id === id ? { ...m, candlesLit: (m.candlesLit || 0) + 1 } : m
    ));
  }, []);

  const handleAddMemory = useCallback((id, memory) => {
    const updated = addMemory(id, memory);
    if (updated) {
      setMemorials(prev => prev.map(m =>
        m.id === id ? updated : m
      ));
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Rainbow Bridge Memorial
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            A loving tribute to pets who've crossed the rainbow bridge
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <PlusIcon />
          Create Tribute
        </motion.button>
      </div>

      {/* Quote */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-l-4 border-purple-500">
        <p className="text-gray-700 dark:text-gray-300 italic text-center">
          "Until one has loved an animal, a part of one's soul remains unawakened."
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
          - Anatole France
        </p>
      </div>

      {/* My Memorials */}
      {memorials.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <HeartIcon />
            My Beloved Companions
          </h4>

          <AnimatePresence>
            {memorials.map((memorial) => (
              <MemorialCard
                key={memorial.id}
                memorial={memorial}
                onLightCandle={handleLightCandle}
                onDelete={handleDeleteMemorial}
                onAddMemory={handleAddMemory}
                isOwn={true}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {memorials.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <div className="text-6xl mb-4">🌈</div>
          <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            No Memorials Yet
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create a loving tribute to remember your beloved companion.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium shadow-md hover:shadow-lg"
          >
            Create Your First Memorial
          </button>
        </div>
      )}

      {/* Community Memorials */}
      <div className="space-y-4">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">
          Community Memorials
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {communityMemorials.map((memorial) => (
            <motion.div
              key={memorial.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center text-4xl flex-shrink-0">
                  {memorial.photo}
                </div>

                <div className="flex-1">
                  <h5 className="font-bold text-gray-800 dark:text-gray-100">
                    {memorial.name}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {memorial.breed} • {memorial.years}
                  </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic line-clamp-2">
                    "{memorial.tribute}"
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      🕯️ {memorial.candlesLit} candles
                    </span>
                    <button
                      onClick={() => handleLightCandle(memorial.id)}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-xs font-medium"
                    >
                      Light Candle
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Memorial Features */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl p-6">
        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4">
          Memorial Features
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl">📖</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100">Memory Book</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a digital memorial book with photos and stories
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-3xl">🕯️</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100">Virtual Candles</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Light candles in remembrance, shared with community
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-3xl">🔒</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100">Lock Special Dates</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Preserve specific calendar images forever
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-3xl">💬</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100">Community Tributes</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive loving messages from the community
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Resources */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
          Support & Resources
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
          Losing a pet is never easy. We're here to help you through this difficult time.
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
            Support Groups
          </button>
          <button className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
            Resources
          </button>
        </div>
      </div>

      {/* Create Memorial Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateMemorialForm
            onSubmit={handleCreateMemorial}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default PetMemorial;
