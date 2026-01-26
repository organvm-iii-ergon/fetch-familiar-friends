import { useState, useEffect, useCallback } from 'react';
import CalendarCard from './components/calendar/CalendarCard';
import ThemeSelector from './components/calendar/ThemeSelector';
import DateNavigation from './components/calendar/DateNavigation';
import MonthCalendar from './components/calendar/MonthCalendar';
import ErrorBoundary from './components/ErrorBoundary';
import VisualLanding from './components/VisualLanding';
import JournalModal from './components/modals/JournalModal';
import AiModal from './components/modals/AiModal';
import FavoritesModal from './components/modals/FavoritesModal';
import StatisticsModal from './components/modals/StatisticsModal';
import KeyboardShortcutsModal from './components/modals/KeyboardShortcutsModal';
import SettingsModal from './components/modals/SettingsModal';
import SocialHub from './components/social/SocialHub';
import ASCIIVisualizer from './components/ASCIIVisualizer';
import LoginModal from './components/auth/LoginModal';
import SignupModal from './components/auth/SignupModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { useNavigationShortcuts, useModalShortcuts, useThemeCycleShortcut, useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDarkMode } from './hooks/useDarkMode';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [theme, setTheme] = useState('park');
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { user, profile, isAuthenticated, signOut, loading: authLoading } = useAuth();

  // Visual intro states
  const [showVisualLanding, setShowVisualLanding] = useState(false);
  const [showASCIIVisualizer, setShowASCIIVisualizer] = useState(false);

  // Modal states
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSocialHubOpen, setIsSocialHubOpen] = useState(false);
  const [showMonthView, setShowMonthView] = useState(false);

  // Auth modal states
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  // Data states
  const [favorites, setFavorites] = useState([]);
  const [journalEntries, setJournalEntries] = useState({});
  const [currentImage, setCurrentImage] = useState(null);
  const [settings, setSettings] = useState({
    autoSave: true,
    notifications: false,
    imageQuality: 'high',
    cacheEnabled: true,
    preloadImages: true,
    preloadDays: 3,
    defaultView: 'day',
    animationsEnabled: typeof window !== 'undefined' && window.matchMedia ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true,
    compactMode: false,
    autoTheme: false
  });

  const themes = [
    { name: 'park', label: 'Park', icon: '🌳', gradient: 'from-lime-400 to-emerald-600' },
    { name: 'beach', label: 'Beach', icon: '🏖️', gradient: 'from-sky-400 to-blue-600' },
    { name: 'forest', label: 'Forest', icon: '🌲', gradient: 'from-green-500 to-green-800' },
    { name: 'tundra', label: 'Tundra', icon: '❄️', gradient: 'from-cyan-400 to-sky-700' },
    { name: 'sunset', label: 'Sunset', icon: '🌅', gradient: 'from-orange-400 to-pink-600' },
    { name: 'night', label: 'Night', icon: '🌙', gradient: 'from-indigo-500 to-purple-800' },
    { name: 'snow', label: 'Snow', icon: '🌨️', gradient: 'from-blue-100 to-cyan-300' },
    { name: 'autumn', label: 'Autumn', icon: '🍂', gradient: 'from-yellow-600 to-red-700' }
  ];

  // Check if first visit and show visual landing
  useEffect(() => {
    const hasSeenLanding = localStorage.getItem('dogtale-seen-landing');
    if (!hasSeenLanding) {
      setShowVisualLanding(true);
    }
  }, []);

  const handleEnterApp = () => {
    setShowVisualLanding(false);
    localStorage.setItem('dogtale-seen-landing', 'true');
  };

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('dogtale-favorites');
      const savedJournalEntries = localStorage.getItem('dogtale-journal');
      const savedTheme = localStorage.getItem('dogtale-theme');
      const savedSettings = localStorage.getItem('dogtale-settings');

      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
      if (savedJournalEntries) {
        setJournalEntries(JSON.parse(savedJournalEntries));
      }
      if (savedTheme) {
        setTheme(savedTheme);
      }
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('dogtale-favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
      // Optionally, notify the user that storage is full
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

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('dogtale-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }, [settings]);

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
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

  // Settings handler
  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  // Check if current image is favorited
  const isCurrentImageFavorited = currentImage && favorites.some(fav => fav.url === currentImage.url);

  // Get journal entry for current date
  const currentJournalEntry = journalEntries[currentDate.toDateString()] || '';

  // Navigation handlers for keyboard shortcuts
  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const today = new Date();
    if (currentDate < today) {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Theme cycle handler
  const handleCycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.name === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].name);
  };

  // Keyboard shortcuts (only active when no modal is open)
  const modalStates = [
    isJournalOpen,
    isAiOpen,
    isFavoritesOpen,
    isStatsOpen,
    isShortcutsOpen,
    isSettingsOpen,
    isSocialHubOpen,
    showASCIIVisualizer,
    isLoginOpen,
    isSignupOpen
  ];
  const anyModalOpen = modalStates.some(state => state);

  useNavigationShortcuts({
    onPrevious: handlePreviousDay,
    onNext: handleNextDay,
    onToday: handleToday,
    enabled: !anyModalOpen
  });

  useModalShortcuts({
    onJournal: () => setIsJournalOpen(true),
    onAi: () => setIsAiOpen(true),
    onFavorites: () => setIsFavoritesOpen(true),
    onStats: () => setIsStatsOpen(true),
    enabled: !anyModalOpen
  });

  useThemeCycleShortcut(handleCycleTheme, !anyModalOpen);

  // Help, view toggle, dark mode, and settings shortcuts (always active except when typing)
  useKeyboardShortcuts({
    '?': () => setIsShortcutsOpen(true),
    'shift+/': () => setIsShortcutsOpen(true),
    'm': () => setShowMonthView(!showMonthView),
    'd': toggleDarkMode,
    ',': () => setIsSettingsOpen(true),
  }, !anyModalOpen);

  // Stable handler for date selection to prevent MonthCalendar re-renders
  const handleDateSelect = useCallback((date) => {
    setCurrentDate(date);
    setShowMonthView(false);
  }, []);

  return (
    <ErrorBoundary>
      {/* Visual Landing - shown on first visit */}
      {showVisualLanding && <VisualLanding onEnter={handleEnterApp} />}

      {/* ASCII Visualizer - can be opened anytime */}
      {showASCIIVisualizer && (
        <ASCIIVisualizer onClose={() => setShowASCIIVisualizer(false)} />
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-200">
        <div className="container mx-auto max-w-2xl">
          <div className="relative mb-4">
            <h1 className="text-4xl font-bold text-center text-gray-800 dark:text-gray-100 transition-colors">
              DogTale Daily
            </h1>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2">
              <button
                onClick={() => setShowASCIIVisualizer(true)}
                className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Visual Guide"
                title="What is this? (Visual Guide)"
              >
                <span className="text-xl">💡</span>
              </button>
              <button
                onClick={() => setIsSocialHubOpen(true)}
                className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Social Hub"
                title="Pet Social Hub"
              >
                <span className="text-xl">🐾</span>
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-700/70 rounded-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDarkMode ? 'Light mode (D)' : 'Dark mode (D)'}
              >
                <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
              </button>
              <button
                onClick={() => setShowMonthView(!showMonthView)}
                className="p-2 bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-700/70 rounded-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={showMonthView ? 'Show day view' : 'Show month view'}
                title={showMonthView ? 'Show day view (M)' : 'Show month view (M)'}
              >
                <span className="text-xl">{showMonthView ? '📅' : '📆'}</span>
              </button>
              <button
                onClick={() => setIsShortcutsOpen(true)}
                className="p-2 bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-700/70 rounded-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts (?)"
              >
                <span className="text-xl">⌨️</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-700/70 rounded-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Settings"
                title="Settings (,)"
              >
                <span className="text-xl">⚙️</span>
              </button>
              <button
                onClick={() => setIsStatsOpen(true)}
                className="p-2 bg-white/50 dark:bg-gray-700/50 hover:bg-white/70 dark:hover:bg-gray-700/70 rounded-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="View statistics"
                title="View your statistics (S)"
              >
                <span className="text-2xl">📊</span>
              </button>
              {/* User menu / Login button */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button
                    className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label="User menu"
                    title={profile?.display_name || user?.email || 'Account'}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </button>
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {profile?.display_name || 'Pet Parent'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={signOut}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Sign in"
                  title="Sign in to sync your data"
                >
                  <span className="text-xl">👤</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-gray-600 dark:text-gray-300 mb-6 transition-colors">
            Your daily dose of dog joy 🐾
          </p>

          {!showMonthView && (
            <DateNavigation
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />
          )}

          {!showMonthView && (
            <ThemeSelector
              currentTheme={theme}
              onThemeChange={setTheme}
              themes={themes}
            />
          )}

          {showMonthView ? (
            <MonthCalendar
              currentDate={currentDate}
              journalEntries={journalEntries}
              favorites={favorites}
              onDateSelect={handleDateSelect}
            />
          ) : (
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
              settings={settings}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <JournalModal
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        date={currentDate}
        initialEntry={currentJournalEntry}
        onSave={handleSaveJournal}
        allEntries={journalEntries}
      />

      <AiModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        currentBreed={currentImage?.breed || null}
      />

      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onRemove={handleRemoveFavorite}
        onClearAll={handleClearAllFavorites}
      />

      <StatisticsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        favorites={favorites}
        journalEntries={journalEntries}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {isSocialHubOpen && (
        <SocialHub onClose={() => setIsSocialHubOpen(false)} />
      )}

      {/* Auth Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
      />

      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSwitchToLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </ErrorBoundary>
  );
}

// Wrapper component that provides auth and subscription context
function AppWithProviders() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <App />
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default AppWithProviders;
