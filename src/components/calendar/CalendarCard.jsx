import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Star, ChevronDown, BookOpen, Sparkles, Heart, AlertCircle } from 'lucide-react';
import { getAllDailyContent } from '../../utils/dailyContent';
import { getCachedImage, cacheImage, preloadNearbyDates } from '../../utils/imageCache';
import { fetchPetImage, getRateLimitStatus } from '../../services/imageApi';
import Skeleton from '../ui/Skeleton';

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
  const FETCH_TIMEOUT = 10000; // 10 seconds

  // Theme gradients
  const themeGradients = {
    park: 'from-lime-400 to-emerald-600',
    beach: 'from-sky-400 to-blue-600',
    forest: 'from-green-500 to-green-800',
    tundra: 'from-cyan-400 to-sky-700',
    sunset: 'from-orange-400 to-pink-600',
    night: 'from-indigo-500 to-purple-800',
    snow: 'from-blue-100 to-cyan-300',
    autumn: 'from-yellow-600 to-red-700'
  };

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
        // Use cached image
        setTodayImage(cached.url);
        setBreedInfo(cached.breed || null);
        setLoading(false);
        setRetryCount(0);

        // Notify parent about the loaded image
        if (onImageLoad) {
          onImageLoad({
            url: cached.url,
            type: cached.type,
            breed: cached.breed
          });
        }
        return;
      }

      // No cache or wrong type - fetch from API using imageApi service
      try {
        const result = await fetchPetImage(imageType, { useFallback: true });

        setTodayImage(result.url);
        setBreedInfo(result.breed || null);
        setRetryCount(0); // Reset retry count on success

        // Show warning for fallback images
        if (result.isFallback) {
          setError(result.error || 'Using fallback image');
        }

        // Cache the image for future use (don't cache fallbacks)
        if (!result.isFallback) {
          cacheImage(date, result.url, imageType, result.breed);
        }

        // Notify parent about the loaded image
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

        // Auto-retry logic (only for non-rate-limit errors)
        const rateLimitStatus = getRateLimitStatus();
        if (!rateLimitStatus.isLimited && retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000 * (retryCount + 1)); // Exponential backoff
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
    // Only preload if settings are available and preloading is enabled
    if (!settings || !settings.preloadImages || !settings.cacheEnabled) {
      return;
    }

    const preloadDays = settings.preloadDays || 3;

    // Create fetch function using imageApi service
    const fetchImageForDate = async () => {
      try {
        const isDog = !isFlipped;
        const imageType = isDog ? 'dog' : 'cat';

        // Check rate limit before preloading
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

    // Trigger preloading
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
      className="relative w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative preserve-3d">
        <motion.div
          className={`glass-effect rounded-2xl p-6 bg-gradient-to-br ${themeGradients[theme]} shadow-soft-lg`}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Card Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-xl font-bold">{formatDate()}</h3>
            <motion.button
              onClick={() => setIsFlipped(!isFlipped)}
              className="text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded-xl p-2 hover:bg-white/10"
              aria-label={`Flip card to show ${isFlipped ? 'dog' : 'cat'} mode`}
              title="Toggle between dog and cat mode"
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Image Container */}
          <motion.div
            className="relative h-64 mb-4 rounded-xl overflow-hidden bg-white/10"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="absolute inset-0">
                <Skeleton.Image aspectRatio="4/3" className="h-full w-full rounded-xl" />
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 p-4 bg-white/5">
                <div className="p-3 bg-white/10 rounded-full">
                  <AlertCircle className="w-8 h-8 text-white/80" />
                </div>
                <p className="text-white text-center text-sm">{error}</p>
                {retryCount < MAX_RETRIES && (
                  <p className="text-white/70 text-xs">Retrying... ({retryCount + 1}/{MAX_RETRIES})</p>
                )}
                {retryCount >= MAX_RETRIES && (
                  <motion.button
                    onClick={() => setRetryCount(0)}
                    className="mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm transition-colors flex items-center gap-2"
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
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onError={() => setError('Failed to load image')}
                />
              </AnimatePresence>
            )}

            {/* Animal Type Badge */}
            <motion.div
              className="absolute top-3 left-3 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-white text-sm font-medium flex items-center gap-1.5">
                {isFlipped ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-purple-300" />
                    Cat Mode
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-300" />
                    Dog Mode
                  </>
                )}
              </span>
            </motion.div>

            {/* Breed Info Badge */}
            {breedInfo && !loading && !error && (
              <motion.div
                className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-white text-xs font-semibold">
                  {breedInfo}
                </span>
              </motion.div>
            )}

            {/* Favorite Button */}
            {!loading && !error && (
              <motion.button
                onClick={handleFavoriteClick}
                className="absolute top-3 right-3 p-2.5 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/20"
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    isFavorited ? 'text-yellow-400 fill-yellow-400' : 'text-white'
                  }`}
                />
              </motion.button>
            )}
          </motion.div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3" role="group" aria-label="Card actions">
            <motion.button
              onClick={onJournalClick}
              className="glass-effect p-3 rounded-xl hover:bg-white/20 transition-all text-white flex flex-col items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Open journal"
              title="Write in your journal"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs font-medium">Journal</span>
            </motion.button>

            <motion.button
              onClick={onAiClick}
              className="glass-effect p-3 rounded-xl hover:bg-white/20 transition-all text-white flex flex-col items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Open AI chat"
              title="Chat with AI assistant"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-medium">AI Chat</span>
            </motion.button>

            <motion.button
              onClick={onFavoritesClick}
              className="glass-effect p-3 rounded-xl hover:bg-white/20 transition-all text-white flex flex-col items-center gap-1.5 relative focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label={`Open favorites${favoriteCount > 0 ? `, ${favoriteCount} items` : ''}`}
              title="View your favorite items"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Heart className="w-5 h-5" />
              <span className="text-xs font-medium">Favorites</span>
              {favoriteCount > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-soft"
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
            <div className="mt-4 space-y-2">
              {/* Mood of the Day */}
              <motion.div
                className="p-3 glass-effect rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{dailyContent.mood.emoji}</span>
                  <span className="text-white font-semibold text-sm">Today&apos;s Mood:</span>
                  <span className="text-white/90 text-sm">{dailyContent.mood.text}</span>
                </div>
                <p className="text-white/70 text-xs ml-9">{dailyContent.mood.description}</p>
              </motion.div>

              {/* Expandable Fun Fact & Quote */}
              <motion.button
                onClick={() => setShowContent(!showContent)}
                className="w-full p-3 glass-effect rounded-xl hover:bg-white/20 transition-all text-left group"
                aria-expanded={showContent}
                aria-label="Toggle fun fact and quote"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Fun Fact & Quote
                  </span>
                  <motion.div
                    animate={{ rotate: showContent ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-white/70" />
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
                    <div className="p-3 glass-effect rounded-xl space-y-3">
                      <div>
                        <p className="text-white/60 text-xs font-semibold mb-1">Did you know?</p>
                        <p className="text-white/90 text-sm">{dailyContent.fact}</p>
                      </div>
                      <div className="border-t border-white/20 pt-3">
                        <p className="text-white/60 text-xs font-semibold mb-1">Quote of the Day</p>
                        <p className="text-white/90 text-sm italic">&quot;{dailyContent.quote}&quot;</p>
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
              className="mt-4 p-3 glass-effect rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-white/80 text-sm truncate">{journalEntry}</p>
            </motion.div>
          )}
        </motion.div>
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
