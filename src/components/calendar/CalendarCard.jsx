import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

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
  favoriteCount = 0
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [todayImage, setTodayImage] = useState(null);
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
    tundra: 'from-cyan-400 to-sky-700'
  };

  // Fetch daily image
  useEffect(() => {
    const fetchDailyImage = async () => {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      
      try {
        const isDog = !isFlipped;
        const endpoint = isDog
          ? 'https://dog.ceo/api/breeds/image/random'
          : 'https://api.thecatapi.com/v1/images/search';

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

        // Notify parent about the loaded image
        if (onImageLoad) {
          onImageLoad({
            url: imageUrl,
            type: isDog ? 'dog' : 'cat'
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
  theme: PropTypes.oneOf(['park', 'beach', 'forest', 'tundra']),
  onJournalClick: PropTypes.func,
  onAiClick: PropTypes.func,
  onFavoritesClick: PropTypes.func,
  onImageLoad: PropTypes.func,
  onFavoriteToggle: PropTypes.func,
  isFavorited: PropTypes.bool,
  journalEntry: PropTypes.string,
  favoriteCount: PropTypes.number
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
  favoriteCount: 0
};

export default CalendarCard;
