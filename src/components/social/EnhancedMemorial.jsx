import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { useAiTribute } from '../../hooks/useAiTribute';
import { useActivityFeed } from '../../hooks/useActivityFeed';

// Icons as simple components
const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const BookOpenIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

/**
 * Tribute Type Button Component
 */
function TributeTypeButton({ type, config, isActive, isGenerating, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(type)}
      disabled={isGenerating}
      className={`
        p-4 rounded-xl border-2 transition-all text-left
        ${isActive
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
        }
        ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <h6 className="font-semibold text-gray-800 dark:text-gray-100">{config.name}</h6>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{config.description}</p>
    </motion.button>
  );
}

TributeTypeButton.propTypes = {
  type: PropTypes.string.isRequired,
  config: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  isActive: PropTypes.bool,
  isGenerating: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

/**
 * Memory Card Component for Memory Book
 */
function MemoryCard({ memory, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit, editContent, setEditContent }) {
  const seasonColors = {
    spring: 'from-green-100 to-pink-100 dark:from-green-900/30 dark:to-pink-900/30',
    summer: 'from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30',
    fall: 'from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30',
    winter: 'from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30',
  };

  const seasonEmojis = {
    spring: '🌸',
    summer: '☀️',
    fall: '🍂',
    winter: '❄️',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-gradient-to-br ${seasonColors[memory.season] || seasonColors.spring} rounded-xl p-4 border border-gray-200 dark:border-gray-700`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{seasonEmojis[memory.season] || '🌟'}</span>
          {isEditing ? (
            <input
              type="text"
              value={editContent.title}
              onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
              className="font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 rounded px-2 py-1 border border-gray-300 dark:border-gray-600"
            />
          ) : (
            <h6 className="font-semibold text-gray-800 dark:text-gray-100">{memory.title}</h6>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={onSaveEdit}
                className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              >
                <CheckIcon />
              </button>
              <button
                onClick={onCancelEdit}
                className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <TrashIcon />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(memory)}
                className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
              >
                <PencilIcon />
              </button>
              <button
                onClick={() => onDelete(memory.id)}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <TrashIcon />
              </button>
            </>
          )}
        </div>
      </div>
      {isEditing ? (
        <textarea
          value={editContent.content}
          onChange={(e) => setEditContent({ ...editContent, content: e.target.value })}
          className="w-full text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded p-2 border border-gray-300 dark:border-gray-600 resize-none"
          rows={3}
        />
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400">{memory.content}</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400`}>
          {memory.mood}
        </span>
        {memory.isEdited && (
          <span className="text-xs text-gray-500 dark:text-gray-500 italic">edited</span>
        )}
      </div>
    </motion.div>
  );
}

MemoryCard.propTypes = {
  memory: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    season: PropTypes.string,
    mood: PropTypes.string,
    isEdited: PropTypes.bool,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  onSaveEdit: PropTypes.func,
  onCancelEdit: PropTypes.func,
  editContent: PropTypes.object,
  setEditContent: PropTypes.func,
};

/**
 * Streaming Text Display Component
 */
function StreamingText({ content, isStreaming }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
        {content}
        {isStreaming && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-purple-500 ml-1"
          />
        )}
      </p>
    </div>
  );
}

StreamingText.propTypes = {
  content: PropTypes.string.isRequired,
  isStreaming: PropTypes.bool,
};

/**
 * Generated Tribute Display Component
 */
function TributeDisplay({ tribute, streamingContent, isGenerating, onCopy, onShare, onSave, onGenerateImage, copied }) {
  const displayContent = isGenerating ? streamingContent : tribute?.content;

  if (!displayContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800"
    >
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <SparklesIcon />
          Generated Tribute
        </h5>
        {!isGenerating && (
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCopy}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              {copied ? <CheckIcon /> : <ClipboardIcon />}
              {copied ? 'Copied!' : 'Copy'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShare}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg shadow-sm hover:shadow-md hover:bg-purple-700 transition-all"
            >
              <ShareIcon />
              Share
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGenerateImage}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-pink-600 text-white rounded-lg shadow-sm hover:shadow-md hover:bg-pink-700 transition-all"
            >
              <ImageIcon />
              Image
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSave}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg shadow-sm hover:shadow-md hover:bg-gray-700 transition-all"
            >
              <DownloadIcon />
              Save
            </motion.button>
          </div>
        )}
      </div>
      <StreamingText content={displayContent} isStreaming={isGenerating} />
    </motion.div>
  );
}

TributeDisplay.propTypes = {
  tribute: PropTypes.shape({
    content: PropTypes.string,
  }),
  streamingContent: PropTypes.string,
  isGenerating: PropTypes.bool,
  onCopy: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onGenerateImage: PropTypes.func.isRequired,
  copied: PropTypes.bool,
};

/**
 * Main Enhanced Memorial Component
 */
function EnhancedMemorial({ pet, lifeData, journalEntries = [] }) {
  const canvasRef = useRef(null);
  const [selectedTributeType, setSelectedTributeType] = useState('full');
  const [copied, setCopied] = useState(false);
  const [showMemoryBook, setShowMemoryBook] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState(null);
  const [editContent, setEditContent] = useState({ title: '', content: '' });
  const [shareSuccess, setShareSuccess] = useState(false);

  // Activity feed for sharing
  const { createActivity } = useActivityFeed({ feedType: 'own' });

  // AI Tribute hook
  const {
    isGenerating,
    streamingContent,
    generatedTributes,
    memoryBook,
    error,
    rateLimit,
    tributeTypes,
    canGenerate,
    generateTribute,
    generateMemoryBook,
    editMemory,
    deleteMemory,
    saveTribute,
    clearError,
  } = useAiTribute({
    pet,
    journalEntries,
    memories: lifeData?.memories || [],
  });

  // Mock life data collected over pet's lifetime (fallback)
  const petVirtualization = lifeData || {
    voiceClips: 12,
    photos: 1543,
    videos: 89,
    walkRoutes: 234,
    favoriteSpots: 15,
    playmates: 28,
    totalActivities: 2456,
    personalityTraits: ['Friendly', 'Playful', 'Gentle', 'Loyal'],
    quirks: ['Head tilt when confused', 'Tail wag when happy', 'Zoomies at 7pm'],
    memorableQuotes: [
      'Always greeted everyone with enthusiasm',
      'Never met a stranger, only friends',
      'Loved chasing squirrels in the backyard',
    ],
  };

  // Handle tribute generation
  const handleGenerateTribute = useCallback(async () => {
    await generateTribute(selectedTributeType, true);
  }, [generateTribute, selectedTributeType]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    const tribute = generatedTributes[selectedTributeType];
    if (tribute?.content) {
      await navigator.clipboard.writeText(tribute.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedTributes, selectedTributeType]);

  // Share to activity feed
  const handleShare = useCallback(async () => {
    const tribute = generatedTributes[selectedTributeType];
    if (!tribute?.content) return;

    try {
      await createActivity({
        type: 'memorial_tribute',
        content: tribute.content,
        petId: pet?.id,
        visibility: 'friends',
        metadata: {
          tributeType: selectedTributeType,
          petName: pet?.name,
        },
      });
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (err) {
      console.error('Error sharing tribute:', err);
    }
  }, [generatedTributes, selectedTributeType, createActivity, pet]);

  // Save tribute to local storage
  const handleSave = useCallback(() => {
    saveTribute(selectedTributeType);
  }, [saveTribute, selectedTributeType]);

  // Generate shareable image using canvas
  const handleGenerateImage = useCallback(async () => {
    const tribute = generatedTributes[selectedTributeType];
    if (!tribute?.content) return;

    // Create canvas for the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = 1080;
    canvas.height = 1080;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f3e7e9');
    gradient.addColorStop(0.5, '#e3eeff');
    gradient.addColorStop(1, '#f3e7e9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add decorative elements
    ctx.fillStyle = 'rgba(147, 51, 234, 0.1)';
    ctx.beginPath();
    ctx.arc(100, 100, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width - 100, canvas.height - 100, 200, 0, Math.PI * 2);
    ctx.fill();

    // Pet name header
    ctx.fillStyle = '#4c1d95';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`In Loving Memory of ${pet?.name || 'Our Beloved Pet'}`, canvas.width / 2, 120);

    // Draw tribute text with word wrapping
    ctx.fillStyle = '#374151';
    ctx.font = '28px system-ui, sans-serif';
    ctx.textAlign = 'center';

    const maxWidth = canvas.width - 160;
    const lineHeight = 40;
    const words = tribute.content.split(' ');
    let line = '';
    let y = 220;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[i] + ' ';
        y += lineHeight;
        if (y > canvas.height - 150) {
          ctx.fillText('...', canvas.width / 2, y);
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (y <= canvas.height - 150) {
      ctx.fillText(line, canvas.width / 2, y);
    }

    // Footer
    ctx.fillStyle = '#6b7280';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Created with DogTale Daily', canvas.width / 2, canvas.height - 50);

    // Download the image
    const link = document.createElement('a');
    link.download = `${pet?.name || 'pet'}-memorial-tribute.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [generatedTributes, selectedTributeType, pet]);

  // Memory book handlers
  const handleEditMemory = useCallback((memory) => {
    setEditingMemoryId(memory.id);
    setEditContent({ title: memory.title, content: memory.content });
  }, []);

  const handleSaveMemoryEdit = useCallback(() => {
    if (editingMemoryId) {
      editMemory(editingMemoryId, editContent);
      setEditingMemoryId(null);
      setEditContent({ title: '', content: '' });
    }
  }, [editingMemoryId, editContent, editMemory]);

  const handleCancelEdit = useCallback(() => {
    setEditingMemoryId(null);
    setEditContent({ title: '', content: '' });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Digital Twin Memorial
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Recreated from {petVirtualization.totalActivities.toLocaleString()} life moments
          </p>
        </div>
      </div>

      {/* Virtual Pet Display */}
      <motion.div
        className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ minHeight: '400px' }}
      >
        <div className="absolute inset-0 bg-stars opacity-20"></div>

        <div className="relative z-10 text-center">
          <motion.div
            animate={{
              y: [0, -20, 0],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-9xl mb-6"
          >
            {pet?.species === 'cat' ? '✨🐱✨' : '✨🐕✨'}
          </motion.div>

          <h4 className="text-3xl font-bold mb-2">{pet?.name}'s Digital Spirit</h4>
          <p className="text-purple-200 mb-6">Forever preserved in loving memory</p>

          {/* Voice Recreation */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
            <h5 className="font-semibold mb-4">Voice Recreation</h5>
            <div className="flex items-center justify-center gap-4 mb-4">
              <button className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all">
                <span className="text-2xl">&#9654;</span>
              </button>
              <div className="flex-1 max-w-xs">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-purple-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-purple-200">
              Synthesized from {petVirtualization.voiceClips} recorded {pet?.species === 'cat' ? 'meows' : 'barks'}
            </p>
          </div>

          {/* Personality Matrix */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <h5 className="font-semibold mb-4">Personality Matrix</h5>
            <div className="grid grid-cols-2 gap-3">
              {petVirtualization.personalityTraits.map((trait, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-3">
                  <div className="text-sm font-medium">{trait}</div>
                  <div className="h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${60 + (index * 10)}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Tribute Generation Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <SparklesIcon />
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                AI Tribute Generator
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create personalized memorial tributes
              </p>
            </div>
          </div>
          {rateLimit.remaining < Infinity && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {rateLimit.remaining} generations remaining today
            </div>
          )}
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={clearError}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Success Message */}
        <AnimatePresence>
          {shareSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <p className="text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckIcon />
                Tribute shared to your activity feed!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tribute Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(tributeTypes).map(([type, config]) => (
            <TributeTypeButton
              key={type}
              type={type}
              config={config}
              isActive={selectedTributeType === type}
              isGenerating={isGenerating}
              onClick={setSelectedTributeType}
            />
          ))}
        </div>

        {/* Generate Button */}
        <motion.button
          whileHover={{ scale: canGenerate ? 1.02 : 1 }}
          whileTap={{ scale: canGenerate ? 0.98 : 1 }}
          onClick={handleGenerateTribute}
          disabled={!canGenerate}
          className={`
            w-full py-4 rounded-xl font-semibold text-lg transition-all
            flex items-center justify-center gap-3
            ${canGenerate
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isGenerating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              Generating Tribute...
            </>
          ) : (
            <>
              <SparklesIcon />
              Generate {tributeTypes[selectedTributeType]?.name || 'Tribute'}
            </>
          )}
        </motion.button>

        {/* Generated Tribute Display */}
        <TributeDisplay
          tribute={generatedTributes[selectedTributeType]}
          streamingContent={streamingContent}
          isGenerating={isGenerating}
          onCopy={handleCopy}
          onShare={handleShare}
          onSave={handleSave}
          onGenerateImage={handleGenerateImage}
          copied={copied}
        />
      </div>

      {/* Memory Book Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white">
              <BookOpenIcon />
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                AI Memory Book
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate and curate cherished memories
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: canGenerate ? 1.02 : 1 }}
            whileTap={{ scale: canGenerate ? 0.98 : 1 }}
            onClick={() => {
              generateMemoryBook(5);
              setShowMemoryBook(true);
            }}
            disabled={!canGenerate}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all
              flex items-center gap-2
              ${canGenerate
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <SparklesIcon />
            Generate Memories
          </motion.button>
        </div>

        {/* Memory Book Display */}
        <AnimatePresence>
          {showMemoryBook && memoryBook.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {memoryBook.map((memory) => (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    onEdit={handleEditMemory}
                    onDelete={deleteMemory}
                    isEditing={editingMemoryId === memory.id}
                    onSaveEdit={handleSaveMemoryEdit}
                    onCancelEdit={handleCancelEdit}
                    editContent={editContent}
                    setEditContent={setEditContent}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {showMemoryBook && memoryBook.length === 0 && !isGenerating && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpenIcon />
            <p className="mt-2">Click "Generate Memories" to create your memory book</p>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && memoryBook.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full"
            />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Creating your memory book...</span>
          </div>
        )}
      </div>

      {/* Interactive Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-center">
          <div className="text-4xl mb-3">&#128506;</div>
          <h5 className="font-bold text-gray-800 dark:text-gray-100">Walk Their Routes</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {petVirtualization.walkRoutes} routes preserved
          </p>
        </button>

        <button className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-center">
          <div className="text-4xl mb-3">&#128247;</div>
          <h5 className="font-bold text-gray-800 dark:text-gray-100">Memory Gallery</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {petVirtualization.photos.toLocaleString()} photos & {petVirtualization.videos} videos
          </p>
        </button>

        <button className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-center">
          <div className="text-4xl mb-3">&#127918;</div>
          <h5 className="font-bold text-gray-800 dark:text-gray-100">Play Together</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            AR games with virtual companion
          </p>
        </button>
      </div>

      {/* Life Story Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          Life Story Timeline
        </h4>
        <div className="space-y-4">
          {[
            { year: '2020', event: 'Adoption Day', emoji: '&#127969;', description: 'Joined the family from rescue shelter' },
            { year: '2021', event: 'First Birthday', emoji: '&#127874;', description: 'Celebrated with pup cake and park party' },
            { year: '2022', event: 'Best Friend', emoji: '&#10084;', description: 'Met lifelong playmate Rocky at dog park' },
            { year: '2023', event: 'Adventure Year', emoji: '&#127956;', description: 'Hiked 500+ miles across 15 trails' },
          ].map((milestone, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="text-4xl" dangerouslySetInnerHTML={{ __html: milestone.emoji }}></div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{milestone.event}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{milestone.year}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{milestone.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Forever Subscription Options */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-300 dark:border-purple-700">
        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4">
          Forever Memorial Upgrades
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl mb-2">&#128218;</div>
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">Life Book</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Professional hardcover book with all memories
            </p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-3">$149</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl mb-2">&#127912;</div>
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">Portrait Commission</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Custom oil painting by professional artist
            </p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-3">$499</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl mb-2">&#129302;</div>
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">AI Companion</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Interactive AI chatbot trained on your pet's data
            </p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-3">$49/mo</p>
          </div>
        </div>
      </div>

      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

EnhancedMemorial.propTypes = {
  pet: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    species: PropTypes.string,
    breed: PropTypes.string,
    birth_date: PropTypes.string,
    deceased_at: PropTypes.string,
    memorial_message: PropTypes.string,
    personality_traits: PropTypes.arrayOf(PropTypes.string),
    quirks: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  lifeData: PropTypes.shape({
    voiceClips: PropTypes.number,
    photos: PropTypes.number,
    videos: PropTypes.number,
    walkRoutes: PropTypes.number,
    favoriteSpots: PropTypes.number,
    playmates: PropTypes.number,
    totalActivities: PropTypes.number,
    personalityTraits: PropTypes.arrayOf(PropTypes.string),
    quirks: PropTypes.arrayOf(PropTypes.string),
    memorableQuotes: PropTypes.arrayOf(PropTypes.string),
    memories: PropTypes.array,
  }),
  journalEntries: PropTypes.arrayOf(PropTypes.shape({
    content: PropTypes.string,
    text: PropTypes.string,
  })),
};

export default EnhancedMemorial;
