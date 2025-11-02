import { useState, useEffect } from 'react';
import CalendarCard from './components/calendar/CalendarCard';
import ThemeSelector from './components/calendar/ThemeSelector';
import DateNavigation from './components/calendar/DateNavigation';
import ErrorBoundary from './components/ErrorBoundary';
import JournalModal from './components/modals/JournalModal';
import AiModal from './components/modals/AiModal';
import FavoritesModal from './components/modals/FavoritesModal';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [theme, setTheme] = useState('park');

  // Modal states
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  // Data states
  const [favorites, setFavorites] = useState([]);
  const [journalEntries, setJournalEntries] = useState({});
  const [currentImage, setCurrentImage] = useState(null);

  const themes = [
    { name: 'park', label: 'Park', icon: '🌳', gradient: 'from-lime-400 to-emerald-600' },
    { name: 'beach', label: 'Beach', icon: '🏖️', gradient: 'from-sky-400 to-blue-600' },
    { name: 'forest', label: 'Forest', icon: '🌲', gradient: 'from-green-500 to-green-800' },
    { name: 'tundra', label: 'Tundra', icon: '❄️', gradient: 'from-cyan-400 to-sky-700' }
  ];

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('dogtale-favorites');
      const savedJournalEntries = localStorage.getItem('dogtale-journal');
      const savedTheme = localStorage.getItem('dogtale-theme');

      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
      if (savedJournalEntries) {
        setJournalEntries(JSON.parse(savedJournalEntries));
      }
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('dogtale-favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }, [favorites]);

  // Save journal entries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('dogtale-journal', JSON.stringify(journalEntries));
    } catch (error) {
      console.error('Error saving journal entries to localStorage:', error);
    }
  }, [journalEntries]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('dogtale-theme', theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, [theme]);

  // Modal handlers
  const handleJournalClick = () => {
    setIsJournalOpen(true);
  };

  const handleAiClick = () => {
    setIsAiOpen(true);
  };

  const handleFavoritesClick = () => {
    setIsFavoritesOpen(true);
  };

  // Journal handlers
  const handleSaveJournal = async (date, entry) => {
    const dateKey = date.toDateString();
    setJournalEntries(prev => ({
      ...prev,
      [dateKey]: entry
    }));
  };

  // Favorites handlers
  const handleAddFavorite = (imageUrl, imageType) => {
    const newFavorite = {
      id: Date.now().toString(),
      url: imageUrl,
      type: imageType,
      savedAt: Date.now()
    };
    setFavorites(prev => [newFavorite, ...prev]);
  };

  const handleRemoveFavorite = (id) => {
    setFavorites(prev => prev.filter(fav => fav.id !== id));
  };

  const handleClearAllFavorites = () => {
    setFavorites([]);
  };

  // Check if current image is favorited
  const isCurrentImageFavorited = currentImage && favorites.some(fav => fav.url === currentImage.url);

  // Get journal entry for current date
  const currentJournalEntry = journalEntries[currentDate.toDateString()] || '';

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">
            DogTale Daily
          </h1>

          <p className="text-center text-gray-600 mb-6">
            Your daily dose of dog joy 🐾
          </p>

          <DateNavigation
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />

          <ThemeSelector
            currentTheme={theme}
            onThemeChange={setTheme}
            themes={themes}
          />

          <CalendarCard
            date={currentDate}
            theme={theme}
            onJournalClick={handleJournalClick}
            onAiClick={handleAiClick}
            onFavoritesClick={handleFavoritesClick}
            onImageLoad={setCurrentImage}
            onFavoriteToggle={handleAddFavorite}
            isFavorited={isCurrentImageFavorited}
            journalEntry={currentJournalEntry}
            favoriteCount={favorites.length}
          />
        </div>
      </div>

      {/* Modals */}
      <JournalModal
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        date={currentDate}
        initialEntry={currentJournalEntry}
        onSave={handleSaveJournal}
      />

      <AiModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />

      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onRemove={handleRemoveFavorite}
        onClearAll={handleClearAllFavorites}
      />
    </ErrorBoundary>
  );
}

export default App;
