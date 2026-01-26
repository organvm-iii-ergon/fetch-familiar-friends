import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Star, ChevronDown, BookOpen, Sparkles, Heart, AlertCircle } from 'lucide-react';
import { getAllDailyContent } from '../../utils/dailyContent';
import { getCachedImage, cacheImage, preloadNearbyDates } from '../../utils/imageCache';
import { fetchPetImage, getRateLimitStatus } from '../../services/imageApi';
import Skeleton from '../ui/Skeleton';

// Theme styling mapping - border colors and badge backgrounds
const themeStyles = {
  park: { border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', accent: 'text-emerald-600 dark:text-emerald-400' },
  beach: { border: 'border-sky-200 dark:border-sky-800', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300', accent: 'text-sky-600 dark:text-sky-400' },
  forest: { border: 'border-green-200 dark:border-green-800', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', accent: 'text-green-700 dark:text-green-400' },
  tundra: { border: 'border-cyan-200 dark:border-cyan-800', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', accent: 'text-cyan-600 dark:text-cyan-400' },
  sunset: { border: 'border-orange-200 dark:border-orange-800', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', accent: 'text-orange-600 dark:text-orange-400' },
  night: { border: 'border-indigo-200 dark:border-indigo-800', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', accent: 'text-indigo-600 dark:text-indigo-400' },
  snow: { border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', accent: 'text-blue-500 dark:text-blue-400' },
  autumn: { border: 'border-amber-200 dark:border-amber-800', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', accent: 'text-amber-600 dark:text-amber-400' }
};

const CalendarCard = ({
  date,
  theme = 'park',
  onJournalClick,
  onAiClick,
  onFavoritesClick,
  onImageLoad,
  onFavoriteToggle,
  isFavorited = false,
  journalEntry = null,
  favoriteCount = 0,
  settings = null
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [todayImage, setTodayImage] = useState(null);
  const [breedInfo, setBreedInfo] = useState(null);
  const [dailyContent, setDailyContent] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 3;
  const currentStyles = themeStyles[theme] || themeStyles.park;

  // Fetch daily image with caching
  useEffect(() => {
    const fetchDailyImage = async () => {
      setLoading(true);
      setError(null);

      const isDog = !isFlipped;
      const imageType = isDog ? 'dog' : 'cat';

      // Check cache first
      const cached = getCachedImage(date);
      if (cached && cached.type === imageType) {
        setTodayImage(cached.url);
        setBreedInfo(cached.breed || null);
        setLoading(false);
        setRetryCount(0);

        if (onImageLoad) {
          onImageLoad({
            url: cached.url,
            type: cached.type,
            breed: cached.breed
          });
        }
        return;
      }

      try {
        const result = await fetchPetImage(imageType, { useFallback: true });

        setTodayImage(result.url);
        setBreedInfo(result.breed || null);
        setRetryCount(0);

        if (result.isFallback) {
          setError(result.error || 'Using fallback image');
        }

        if (!result.isFallback) {
          cacheImage(date, result.url, imageType, result.breed);
        }

        if (onImageLoad) {
          onImageLoad({
            url: result.url,
            type: imageType,
            breed: result.breed
          });
        }
      } catch (err) {
        console.error('Error fetching image:', err);

        if (err.message.includes('timed out')) {
          setError('Request timed out. Please try again.');
        } else if (err.message.includes('Rate limited')) {
          setError(err.message);
        } else {
          setError('Failed to load image. Please try again.');
        }

        const rateLimitStatus = getRateLimitStatus();
        if (!rateLimitStatus.isLimited && retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000 * (retryCount + 1));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDailyImage();
  }, [isFlipped, date, retryCount, onImageLoad]);

  // Load daily content when date or flip changes
  useEffect(() => {
    const content = getAllDailyContent(date, isFlipped);
    setDailyContent(content);
  }, [date, isFlipped]);

  // Preload nearby dates when settings allow
  useEffect(() => {
    if (!settings || !settings.preloadImages || !settings.cacheEnabled) {
      return;
    }

    const preloadDays = settings.preloadDays || 3;

    const fetchImageForDate = async () => {
      try {
        const isDog = !isFlipped;
        const imageType = isDog ? 'dog' : 'cat';

        const rateLimitStatus = getRateLimitStatus();
        if (rateLimitStatus.isLimited) {
          return null;
        }

        const result = await fetchPetImage(imageType, { useFallback: false });

        return {
          url: result.url,
          type: result.type,
          breed: result.breed
        };
      } catch (error) {
        console.warn('Failed to preload image:', error.message);
        return null;
      }
    };

    preloadNearbyDates(date, preloadDays, fetchImageForDate).catch(error => {
      console.warn('Error during preloading:', error);
    });
  }, [date, isFlipped, settings]);

  const formatDate = () => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleFavoriteClick = () => {
    if (todayImage && onFavoriteToggle) {
      onFavoriteToggle(todayImage, isFlipped ? 'cat' : 'dog');
    }
  };

  return (
    <motion.div
      className="relative w-full max-w-xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Main Card - Clean surface design */}
      <div className={`bg-white dark:bg-surface-800 rounded-2xl shadow-soft-md border-2 ${currentStyles.border} overflow-hidden`}>
        {/* Card Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-surface-100 dark:border-surface-700">
          <h3 className="text-xl font-semibold text-surface-900 dark:text-white">
            {formatDate()}
          </h3>
          <motion.button
            onClick={() => setIsFlipped(!isFlipped)}
            className="p-2 rounded-xl text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            aria-label={`Flip card to show ${isFlipped ? 'dog' : 'cat'} mode`}
            title="Toggle between dog and cat mode"
            whileHover={{ rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Image Container */}
        <div className="relative aspect-[4/3] bg-surface-100 dark:bg-surface-900">
          {loading ? (
            <div className="absolute inset-0">
              <Skeleton.Image aspectRatio="4/3" className="h-full w-full" />
            </div>
          ) : error && !todayImage ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 p-4">
              <div className="p-3 bg-surface-200 dark:bg-surface-700 rounded-full">
                <AlertCircle className="w-8 h-8 text-surface-500 dark:text-surface-400" />
              </div>
              <p className="text-surface-600 dark:text-surface-400 text-center text-sm">{error}</p>
              {retryCount < MAX_RETRIES && (
                <p className="text-surface-400 dark:text-surface-500 text-xs">Retrying... ({retryCount + 1}/{MAX_RETRIES})</p>
              )}
              {retryCount >= MAX_RETRIES && (
                <motion.button
                  onClick={() => setRetryCount(0)}
                  className="mt-2 px-4 py-2 bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 rounded-xl text-surface-700 dark:text-surface-300 text-sm transition-colors flex items-center gap-2"
                  aria-label="Retry loading image"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </motion.button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.img
                key={todayImage}
                src={todayImage}
                alt={isFlipped ? "Cat of the day" : "Dog of the day"}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onError={() => setError('Failed to load image')}
              />
            </AnimatePresence>
          )}

          {/* Animal Type Badge */}
          <motion.div
            className={`absolute top-4 left-4 ${currentStyles.badge} px-3 py-1.5 rounded-full text-sm font-medium`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isFlipped ? 'bg-purple-400' : 'bg-amber-400'}`} />
              {isFlipped ? 'Cat Mode' : 'Dog Mode'}
            </span>
          </motion.div>

          {/* Breed Info Badge */}
          {breedInfo && !loading && !error && (
            <motion.div
              className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-white text-sm font-medium flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                {breedInfo}
              </span>
            </motion.div>
          )}

          {/* Favorite Button */}
          {!loading && !error && (
            <motion.button
              onClick={handleFavoriteClick}
              className="absolute top-4 right-4 p-2.5 bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm rounded-full shadow-soft-sm hover:shadow-soft transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  isFavorited ? 'text-amber-500 fill-amber-500' : 'text-surface-400'
                }`}
              />
            </motion.button>
          )}
        </div>

        {/* Action Buttons - Clean solid backgrounds */}
        <div className="grid grid-cols-3 gap-3 p-4 border-t border-surface-100 dark:border-surface-700" role="group" aria-label="Card actions">
          <motion.button
            onClick={onJournalClick}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            aria-label="Open journal"
            title="Write in your journal"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-medium">Journal</span>
          </motion.button>

          <motion.button
            onClick={onAiClick}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            aria-label="Open AI chat"
            title="Chat with AI assistant"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">AI Chat</span>
          </motion.button>

          <motion.button
            onClick={onFavoritesClick}
            className="relative flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            aria-label={`Open favorites${favoriteCount > 0 ? `, ${favoriteCount} items` : ''}`}
            title="View your favorite items"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">Favorites</span>
            {favoriteCount > 0 && (
              <motion.span
                className="absolute top-2 right-2 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                aria-label={`${favoriteCount} favorites`}
              >
                {favoriteCount}
              </motion.span>
            )}
          </motion.button>
        </div>

        {/* Daily Content Section */}
        {dailyContent && (
          <div className="px-6 pb-6 space-y-3">
            {/* Mood of the Day */}
            <motion.div
              className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{dailyContent.mood.emoji}</span>
                <div>
                  <span className={`font-semibold ${currentStyles.accent}`}>{dailyContent.mood.text}</span>
                  <p className="text-sm text-surface-500 dark:text-surface-400">{dailyContent.mood.description}</p>
                </div>
              </div>
            </motion.div>

            {/* Expandable Fun Fact & Quote */}
            <motion.button
              onClick={() => setShowContent(!showContent)}
              className="w-full p-4 bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              aria-expanded={showContent}
              aria-label="Toggle fun fact and quote"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-surface-700 dark:text-surface-200 flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${currentStyles.accent}`} />
                  Fun Fact & Quote
                </span>
                <motion.div
                  animate={{ rotate: showContent ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-surface-400" />
                </motion.div>
              </div>
            </motion.button>

            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide mb-1">Did you know?</p>
                      <p className="text-surface-700 dark:text-surface-200">{dailyContent.fact}</p>
                    </div>
                    <div className="border-t border-surface-200 dark:border-surface-600 pt-4">
                      <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide mb-1">Quote of the Day</p>
                      <p className="text-surface-700 dark:text-surface-200 italic">&quot;{dailyContent.quote}&quot;</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Journal Entry Preview */}
        {journalEntry && (
          <motion.div
            className="px-6 pb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
              <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide mb-1">Your Note</p>
              <p className="text-surface-600 dark:text-surface-300 truncate">{journalEntry}</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

CalendarCard.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  theme: PropTypes.oneOf(['park', 'beach', 'forest', 'tundra', 'sunset', 'night', 'snow', 'autumn']),
  onJournalClick: PropTypes.func,
  onAiClick: PropTypes.func,
  onFavoritesClick: PropTypes.func,
  onImageLoad: PropTypes.func,
  onFavoriteToggle: PropTypes.func,
  isFavorited: PropTypes.bool,
  journalEntry: PropTypes.string,
  favoriteCount: PropTypes.number,
  settings: PropTypes.object
};

CalendarCard.defaultProps = {
  theme: 'park',
  onJournalClick: () => {},
  onAiClick: () => {},
  onFavoritesClick: () => {},
  onImageLoad: null,
  onFavoriteToggle: null,
  isFavorited: false,
  journalEntry: null,
  favoriteCount: 0,
  settings: null
};

export default CalendarCard;
