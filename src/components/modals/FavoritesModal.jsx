import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { motion, AnimatePresence } from 'framer-motion';

const FavoritesModal = ({ isOpen, onClose, favorites, onRemove, onClearAll }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'dogs', 'cats'

  const filteredFavorites = favorites.filter(fav => {
    if (filter === 'all') return true;
    if (filter === 'dogs') return fav.type === 'dog';
    if (filter === 'cats') return fav.type === 'cat';
    return true;
  });

  const handleDownload = async (imageUrl, id) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dogtale-favorite-${id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const handleShare = async (favorite) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Favorite from DogTale Daily',
          text: `Check out this adorable ${favorite.type} I found on DogTale Daily!`,
          url: favorite.url
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(favorite.url);
        alert('Image URL copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const handleClearAllClick = () => {
    if (window.confirm(`Are you sure you want to remove all ${favorites.length} favorites?`)) {
      onClearAll();
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Favorites" size="2xl">
      <div className="space-y-4">
        {/* Header with filter and stats */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({favorites.length})
            </button>
            <button
              onClick={() => setFilter('dogs')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'dogs'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🐕 Dogs ({favorites.filter(f => f.type === 'dog').length})
            </button>
            <button
              onClick={() => setFilter('cats')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'cats'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🐱 Cats ({favorites.filter(f => f.type === 'cat').length})
            </button>
          </div>

          {favorites.length > 0 && (
            <button
              onClick={handleClearAllClick}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Empty state */}
        {filteredFavorites.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">⭐</span>
            <p className="text-gray-500 text-lg mb-2">No favorites yet</p>
            <p className="text-gray-400 text-sm">
              {filter !== 'all'
                ? `No ${filter} in your favorites`
                : 'Start adding favorites from the daily calendar!'}
            </p>
          </div>
        )}

        {/* Grid of favorites */}
        {filteredFavorites.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-2">
            <AnimatePresence>
              {filteredFavorites.map((favorite) => (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group"
                >
                  {/* Image */}
                  <div
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-100"
                    onClick={() => setSelectedImage(favorite)}
                  >
                    <img
                      src={favorite.url}
                      alt={`Favorite ${favorite.type}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleShare(favorite)}
                      className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      title="Share"
                      aria-label="Share favorite"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDownload(favorite.url, favorite.id)}
                      className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                      title="Download"
                      aria-label="Download favorite"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onRemove(favorite.id)}
                      className="p-2 bg-red-500/90 rounded-full hover:bg-red-500 transition-colors"
                      title="Remove"
                      aria-label="Remove from favorites"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Info badge */}
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                    {favorite.type === 'dog' ? '🐕' : '🐱'}
                  </div>

                  {/* Date badge */}
                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                    {formatDate(favorite.savedAt)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Image preview modal */}
      <AnimatePresence>
        {selectedImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-4xl max-h-[90vh]"
              >
                <img
                  src={selectedImage.url}
                  alt={`Favorite ${selectedImage.type}`}
                  className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close preview"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Modal>
  );
};

FavoritesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  favorites: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['dog', 'cat']).isRequired,
      savedAt: PropTypes.number.isRequired
    })
  ).isRequired,
  onRemove: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired
};

export default FavoritesModal;
