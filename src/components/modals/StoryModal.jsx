import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  Save,
  Share2,
  Trash2,
  ChevronLeft,
  Copy,
  Check,
  Clock,
  Crown,
  AlertCircle,
} from 'lucide-react';
import Modal from './Modal';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { usePets } from '../../hooks/usePets';
import { useStoryGeneration, STORY_TYPES } from '../../hooks/useStoryGeneration';

/**
 * Story type selector card
 */
const StoryTypeCard = ({ type, isSelected, onClick, disabled }) => {
  const storyType = STORY_TYPES[type];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-3 rounded-xl border-2 transition-all text-left w-full
        ${isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={`
          text-2xl p-2 rounded-lg bg-gradient-to-br ${storyType.color}
          flex items-center justify-center
        `}>
          <span>{storyType.icon}</span>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-surface-800 dark:text-surface-200">
            {storyType.name}
          </h4>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            {storyType.description}
          </p>
        </div>
      </div>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
};

StoryTypeCard.propTypes = {
  type: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

/**
 * Pet selector dropdown
 */
const PetSelector = ({ pets, selectedPet, onSelect, disabled }) => {
  if (pets.length === 0) {
    return (
      <div className="p-3 bg-surface-100 dark:bg-surface-700 rounded-lg text-center">
        <p className="text-sm text-surface-600 dark:text-surface-400">
          No pets added yet. Add a pet to generate personalized stories!
        </p>
      </div>
    );
  }

  if (pets.length === 1) {
    return (
      <div className="p-3 bg-surface-100 dark:bg-surface-700 rounded-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
          {pets[0].avatar_url ? (
            <img src={pets[0].avatar_url} alt={pets[0].name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <span className="text-white text-lg">{pets[0].species === 'cat' ? '🐱' : '🐕'}</span>
          )}
        </div>
        <div>
          <p className="font-medium text-surface-800 dark:text-surface-200">{pets[0].name}</p>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {pets[0].breed || pets[0].species}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pets.map(pet => (
        <button
          key={pet.id}
          onClick={() => onSelect(pet)}
          disabled={disabled}
          className={`
            w-full p-3 rounded-lg flex items-center gap-3 transition-all
            ${selectedPet?.id === pet.id
              ? 'bg-primary-100 dark:bg-primary-900/20 border-2 border-primary-500'
              : 'bg-surface-100 dark:bg-surface-700 border-2 border-transparent hover:border-surface-300 dark:hover:border-surface-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
            {pet.avatar_url ? (
              <img src={pet.avatar_url} alt={pet.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <span className="text-white text-lg">{pet.species === 'cat' ? '🐱' : '🐕'}</span>
            )}
          </div>
          <div className="text-left">
            <p className="font-medium text-surface-800 dark:text-surface-200">{pet.name}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {pet.breed || pet.species}
            </p>
          </div>
          {selectedPet?.id === pet.id && (
            <Check className="w-5 h-5 text-primary-500 ml-auto" />
          )}
        </button>
      ))}
    </div>
  );
};

PetSelector.propTypes = {
  pets: PropTypes.array.isRequired,
  selectedPet: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

/**
 * Saved story list item
 */
const SavedStoryItem = ({ story, onView, onDelete }) => {
  const storyType = STORY_TYPES[story.metadata?.storyType || story.storyType] || STORY_TYPES.day_in_life;
  const petName = story.metadata?.petData?.name || story.petData?.name || 'Pet';
  const createdAt = new Date(story.created_at || story.createdAt).toLocaleDateString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">{storyType.icon}</span>
          <div className="min-w-0">
            <h4 className="font-medium text-surface-800 dark:text-surface-200 truncate">
              {story.title || 'Untitled Story'}
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {petName} - {createdAt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => onView(story)}
            aria-label="View story"
          >
            <BookOpen className="w-4 h-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => onDelete(story.id)}
            aria-label="Delete story"
          >
            <Trash2 className="w-4 h-4 text-error-500" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

SavedStoryItem.propTypes = {
  story: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

/**
 * Main StoryModal component
 */
const StoryModal = ({ isOpen, onClose, journalEntries = {} }) => {
  const { isAuthenticated } = useAuth();
  const { hasFeature, needsUpgrade } = useSubscription();
  const { pets, primaryPet, loading: petsLoading } = usePets();

  const {
    currentStory,
    savedStories,
    isGenerating,
    streamingContent,
    error,
    rateLimit,
    displayContent,
    canGenerate,
    generateStory,
    saveStory,
    deleteStory,
    viewStory,
    clearCurrentStory,
    getShareableContent,
  } = useStoryGeneration();

  const [view, setView] = useState('create'); // 'create' | 'story' | 'saved'
  const [selectedStoryType, setSelectedStoryType] = useState('adventure');
  const [selectedPet, setSelectedPet] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const contentRef = useRef(null);

  // Set default pet on load
  useEffect(() => {
    if (!selectedPet && primaryPet) {
      setSelectedPet(primaryPet);
    } else if (!selectedPet && pets.length > 0) {
      setSelectedPet(pets[0]);
    }
  }, [primaryPet, pets, selectedPet]);

  // Scroll to bottom during streaming
  useEffect(() => {
    if (streamingContent && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamingContent]);

  // Switch to story view when generation completes
  useEffect(() => {
    if (currentStory && !isGenerating) {
      setView('story');
      setIsSaved(false);
    }
  }, [currentStory, isGenerating]);

  const handleGenerate = async () => {
    if (!canGenerate) return;

    // Get recent journal entries as array
    const recentEntries = Object.entries(journalEntries)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .slice(0, 5)
      .map(([, entry]) => entry);

    await generateStory(selectedPet, selectedStoryType, recentEntries);
  };

  const handleSave = async () => {
    setSaveError(null);
    const { error: err } = await saveStory();
    if (err) {
      setSaveError(err.message || 'Failed to save story');
    } else {
      setIsSaved(true);
    }
  };

  const handleShare = async () => {
    const content = getShareableContent();

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentStory?.title || 'Pet Story',
          text: content,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Fall back to clipboard
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    const content = getShareableContent();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = async (storyId) => {
    if (window.confirm('Delete this story? This cannot be undone.')) {
      await deleteStory(storyId);
    }
  };

  const handleViewSaved = (story) => {
    viewStory(story);
    setView('story');
    setIsSaved(true);
  };

  const handleBack = () => {
    if (view === 'story') {
      clearCurrentStory();
    }
    setView('create');
    setIsSaved(false);
  };

  const requiresUpgrade = needsUpgrade('storyGeneration');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          <span>Story Generator</span>
          {requiresUpgrade && (
            <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Premium
            </span>
          )}
        </div>
      }
      size="2xl"
      variant="gradient-nature"
    >
      <div className="min-h-[500px]">
        {/* Upgrade notice for free users */}
        {requiresUpgrade && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200">
                  Premium Feature
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Story generation is available for Premium subscribers. Upgrade to create personalized AI stories about your pets!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation tabs */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={view === 'create' || view === 'story' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setView('create')}
            leftIcon={view === 'story' ? ChevronLeft : Sparkles}
          >
            {view === 'story' ? 'Back' : 'Create Story'}
          </Button>
          <Button
            variant={view === 'saved' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setView('saved')}
            leftIcon={BookOpen}
          >
            Saved Stories ({savedStories.length})
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {/* Create Story View */}
          {view === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Pet Selection */}
              <div>
                <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Select a Pet
                </h3>
                {petsLoading ? (
                  <div className="p-4 text-center text-surface-500">Loading pets...</div>
                ) : (
                  <PetSelector
                    pets={pets}
                    selectedPet={selectedPet}
                    onSelect={setSelectedPet}
                    disabled={isGenerating || requiresUpgrade}
                  />
                )}
              </div>

              {/* Story Type Selection */}
              <div>
                <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Choose Story Type
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.keys(STORY_TYPES).map(type => (
                    <StoryTypeCard
                      key={type}
                      type={type}
                      isSelected={selectedStoryType === type}
                      onClick={() => setSelectedStoryType(type)}
                      disabled={isGenerating || requiresUpgrade}
                    />
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-error-500 mt-0.5" />
                  <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
                </div>
              )}

              {/* Rate Limit Warning */}
              {!rateLimit.allowed && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
                  <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Daily limit reached ({rateLimit.limit} stories). Try again tomorrow!
                  </p>
                </div>
              )}

              {/* Generate Button */}
              <Button
                variant="accent"
                size="lg"
                className="w-full"
                onClick={handleGenerate}
                disabled={!canGenerate || !selectedPet || requiresUpgrade}
                loading={isGenerating}
                leftIcon={Sparkles}
              >
                {isGenerating ? 'Generating Story...' : 'Generate Story'}
              </Button>

              {/* Usage info */}
              {isAuthenticated && rateLimit.remaining !== Infinity && (
                <p className="text-xs text-center text-surface-500 dark:text-surface-400">
                  {rateLimit.remaining} stories remaining today
                </p>
              )}
            </motion.div>
          )}

          {/* Story View */}
          {view === 'story' && (
            <motion.div
              key="story"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Story Content */}
              <div
                ref={contentRef}
                className="prose prose-sm dark:prose-invert max-w-none p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 max-h-[400px] overflow-y-auto"
              >
                {isGenerating && streamingContent ? (
                  <>
                    <div className="whitespace-pre-wrap">{streamingContent}</div>
                    <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-1" />
                  </>
                ) : displayContent ? (
                  <div className="whitespace-pre-wrap">{displayContent}</div>
                ) : (
                  <p className="text-surface-500 italic">Story will appear here...</p>
                )}
              </div>

              {/* Action Buttons */}
              {!isGenerating && currentStory && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={isSaved ? 'success' : 'primary'}
                    onClick={handleSave}
                    disabled={isSaved}
                    leftIcon={isSaved ? Check : Save}
                  >
                    {isSaved ? 'Saved' : 'Save Story'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleShare}
                    leftIcon={copied ? Check : Share2}
                  >
                    {copied ? 'Copied!' : 'Share'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCopy}
                    leftIcon={copied ? Check : Copy}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    leftIcon={ChevronLeft}
                  >
                    New Story
                  </Button>
                </div>
              )}

              {saveError && (
                <p className="text-sm text-error-500">{saveError}</p>
              )}
            </motion.div>
          )}

          {/* Saved Stories View */}
          {view === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {savedStories.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-surface-700 dark:text-surface-300">
                    No saved stories yet
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    Generate a story and save it to see it here!
                  </p>
                  <Button
                    variant="primary"
                    className="mt-4"
                    onClick={() => setView('create')}
                    leftIcon={Sparkles}
                  >
                    Create Your First Story
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                  {savedStories.map(story => (
                    <SavedStoryItem
                      key={story.id}
                      story={story}
                      onView={handleViewSaved}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};

StoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  journalEntries: PropTypes.object,
};

StoryModal.defaultProps = {
  journalEntries: {},
};

export default StoryModal;
