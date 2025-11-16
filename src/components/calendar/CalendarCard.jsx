import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllDailyContent } from '../../utils/dailyContent';
import { getCachedImage, cacheImage, preloadNearbyDates } from '../../utils/imageCache';

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

      // No cache or wrong type - fetch from API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      try {
        const dogApiUrl = import.meta.env.VITE_DOG_API_URL || 'https://dog.ceo/api';
        const catApiUrl = import.meta.env.VITE_CAT_API_URL || 'https://api.thecatapi.com/v1';

        const endpoint = isDog
          ? `${dogApiUrl}/breeds/image/random`
          : `${catApiUrl}/images/search`;

        const response = await fetch(endpoint, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const imageUrl = isDog ? data.message : data[0]?.url;

        if (!imageUrl) {
          throw new Error('No image URL in response');
        }

        setTodayImage(imageUrl);
        setRetryCount(0); // Reset retry count on success

        // Extract breed info from URL (for dogs)
        let extractedBreed = null;
        if (isDog && imageUrl.includes('/breeds/')) {
          const breedMatch = imageUrl.match(/\/breeds\/([^/]+)\//);
          if (breedMatch) {
            const breedSlug = breedMatch[1];
            const breedParts = breedSlug.split('-');
            const breedName = breedParts.map(part =>
              part.charAt(0).toUpperCase() + part.slice(1)
            ).join(' ');
            extractedBreed = breedName;
            setBreedInfo(breedName);
          } else {
            setBreedInfo(null);
          }
        } else {
          setBreedInfo(null);
        }

        // Cache the image for future use
        cacheImage(date, imageUrl, imageType, extractedBreed);

        // Notify parent about the loaded image
        if (onImageLoad) {
          onImageLoad({
            url: imageUrl,
            type: imageType,
            breed: extractedBreed
          });
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Error fetching image:', err);

        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError('Failed to load image. Please try again.');
        }

        // Auto-retry logic
        if (retryCount < MAX_RETRIES) {
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

    // Create fetch function that mirrors the main fetchDailyImage logic
    const fetchImageForDate = async (targetDate) => {
      try {
        const isDog = !isFlipped;
        const endpoint = isDog
          ? 'https://dog.ceo/api/breeds/image/random'
          : 'https://api.thecatapi.com/v1/images/search';

        const response = await fetch(endpoint, {
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const imageUrl = isDog ? data.message : data[0]?.url;

        if (!imageUrl) throw new Error('No image URL in response');

        // Extract breed info for dogs
        let breed = null;
        if (isDog && imageUrl.includes('/breeds/')) {
          const breedMatch = imageUrl.match(/\/breeds\/([^/]+)\//);
          if (breedMatch) {
            const breedSlug = breedMatch[1];
            const breedParts = breedSlug.split('-');
            breed = breedParts.map(part =>
              part.charAt(0).toUpperCase() + part.slice(1)
            ).join(' ');
          }
        }

        return { url: imageUrl, type: isDog ? 'dog' : 'cat', breed };
      } catch (error) {
        console.warn(`Failed to preload image for date ${targetDate.toDateString()}:`, error);
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
          className={`glass-effect rounded-custom-lg p-6 bg-gradient-to-br ${themeGradients[theme]}`}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Card Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-xl font-bold">{formatDate()}</h3>
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg p-1"
              aria-label={`Flip card to show ${isFlipped ? 'dog' : 'cat'} mode`}
              title="Toggle between dog and cat mode"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Image Container */}
          <div className="relative h-64 mb-4 rounded-custom overflow-hidden bg-white/10">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 p-4">
                <span className="text-white text-4xl">😢</span>
                <p className="text-white text-center text-sm">{error}</p>
                {retryCount < MAX_RETRIES && (
                  <p className="text-white/70 text-xs">Retrying... ({retryCount + 1}/{MAX_RETRIES})</p>
                )}
                {retryCount >= MAX_RETRIES && (
                  <button
                    onClick={() => setRetryCount(0)}
                    className="mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors"
                    aria-label="Retry loading image"
                  >
                    Try Again
                  </button>
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
            <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-sm font-medium">
                {isFlipped ? '🐱 Cat Mode' : '🐕 Dog Mode'}
              </span>
            </div>

            {/* Breed Info Badge */}
            {breedInfo && !loading && !error && (
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-white text-xs font-semibold">
                  {breedInfo}
                </span>
              </div>
            )}

            {/* Favorite Button */}
            {!loading && !error && (
              <button
                onClick={handleFavoriteClick}
                className="absolute top-2 right-2 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <span className={`text-2xl transition-transform ${isFavorited ? 'scale-110' : ''}`}>
                  {isFavorited ? '⭐' : '☆'}
                </span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Card actions">
            <button
              onClick={onJournalClick}
              className="glass-effect p-3 rounded-custom hover:bg-white/20 transition-all text-white flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Open journal"
              title="Write in your journal"
            >
              <span className="text-2xl" aria-hidden="true">📝</span>
              <span className="text-xs">Journal</span>
            </button>

            <button
              onClick={onAiClick}
              className="glass-effect p-3 rounded-custom hover:bg-white/20 transition-all text-white flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Open AI chat"
              title="Chat with AI assistant"
            >
              <span className="text-2xl" aria-hidden="true">✨</span>
              <span className="text-xs">AI Chat</span>
            </button>

            <button
              onClick={onFavoritesClick}
              className="glass-effect p-3 rounded-custom hover:bg-white/20 transition-all text-white flex flex-col items-center gap-1 relative focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label={`Open favorites${favoriteCount > 0 ? `, ${favoriteCount} items` : ''}`}
              title="View your favorite items"
            >
              <span className="text-2xl" aria-hidden="true">⭐</span>
              <span className="text-xs">Favorites</span>
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" aria-label={`${favoriteCount} favorites`}>
                  {favoriteCount}
                </span>
              )}
            </button>
          </div>

          {/* Daily Content Section */}
          {dailyContent && (
            <div className="mt-4 space-y-2">
              {/* Mood of the Day */}
              <div className="p-3 glass-effect rounded-custom">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{dailyContent.mood.emoji}</span>
                  <span className="text-white font-semibold text-sm">Today&apos;s Mood:</span>
                  <span className="text-white/90 text-sm">{dailyContent.mood.text}</span>
                </div>
                <p className="text-white/70 text-xs ml-9">{dailyContent.mood.description}</p>
              </div>

              {/* Expandable Fun Fact & Quote */}
              <button
                onClick={() => setShowContent(!showContent)}
                className="w-full p-3 glass-effect rounded-custom hover:bg-white/20 transition-all text-left group"
                aria-expanded={showContent}
                aria-label="Toggle fun fact and quote"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-sm">
                    💡 Fun Fact & Quote
                  </span>
                  <svg
                    className={`w-4 h-4 text-white/70 transition-transform ${showContent ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              <AnimatePresence>
                {showContent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 glass-effect rounded-custom space-y-2">
                      <div>
                        <p className="text-white/60 text-xs font-semibold mb-1">Did you know?</p>
                        <p className="text-white/90 text-sm">{dailyContent.fact}</p>
                      </div>
                      <div className="border-t border-white/20 pt-2">
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
            <div className="mt-4 p-3 glass-effect rounded-custom">
              <p className="text-white/80 text-sm truncate">{journalEntry}</p>
            </div>
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
