import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Settings,
  User,
  LogOut,
  Loader2,
} from 'lucide-react';
import CalendarCard from './components/calendar/CalendarCard';
import ThemeSelector from './components/calendar/ThemeSelector';
import DateNavigation from './components/calendar/DateNavigation';
import MonthCalendar from './components/calendar/MonthCalendar';
import ErrorBoundary from './components/ErrorBoundary';
import VisualLanding from './components/VisualLanding';
import { dogTaleStorage } from './utils/resilientStorage';
import { AchievementNotificationContainer } from './components/achievements/AchievementNotification';

// Lazy load modals for code splitting
const JournalModal = lazy(() => import('./components/modals/JournalModal'));
const AiModal = lazy(() => import('./components/modals/AiModal'));
const FavoritesModal = lazy(() => import('./components/modals/FavoritesModal'));
const StatisticsModal = lazy(() => import('./components/modals/StatisticsModal'));
const KeyboardShortcutsModal = lazy(() => import('./components/modals/KeyboardShortcutsModal'));
const SettingsModal = lazy(() => import('./components/modals/SettingsModal'));
const SocialHub = lazy(() => import('./components/social/SocialHub'));
const ASCIIVisualizer = lazy(() => import('./components/ASCIIVisualizer'));
const LoginModal = lazy(() => import('./components/auth/LoginModal'));
const SignupModal = lazy(() => import('./components/auth/SignupModal'));
const HealthDashboard = lazy(() => import('./components/health/HealthDashboard'));
const StoryModal = lazy(() => import('./components/modals/StoryModal'));
const SeasonPass = lazy(() => import('./components/social/SeasonPass'));

// Loading fallback for lazy-loaded components
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft-lg flex items-center gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
      <span className="text-surface-700 dark:text-surface-300">Loading...</span>
    </div>
  </div>
);
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { AchievementProvider } from './contexts/AchievementContext';
import { ReducedMotionProvider } from './contexts/ReducedMotionContext';
import { useNavigationShortcuts, useModalShortcuts, useThemeCycleShortcut, useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDarkMode } from './hooks/useDarkMode';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [theme, setTheme] = useState('park');
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { user, profile, isAuthenticated, signOut } = useAuth();

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

  // Health modal state
  const [isHealthOpen, setIsHealthOpen] = useState(false);

  // Story modal state
  const [isStoryOpen, setIsStoryOpen] = useState(false);

  // Season Pass modal state
  const [isSeasonPassOpen, setIsSeasonPassOpen] = useState(false);

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

  // Refined theme palette - muted accents, subtle backgrounds
  const themes = [
    { name: 'park', label: 'Park', accent: 'emerald', accentClass: 'emerald-500', bgClass: 'emerald-50', borderClass: 'emerald-200' },
    { name: 'beach', label: 'Beach', accent: 'sky', accentClass: 'sky-500', bgClass: 'sky-50', borderClass: 'sky-200' },
    { name: 'forest', label: 'Forest', accent: 'green', accentClass: 'green-700', bgClass: 'green-50', borderClass: 'green-200' },
    { name: 'tundra', label: 'Tundra', accent: 'cyan', accentClass: 'cyan-600', bgClass: 'slate-50', borderClass: 'cyan-200' },
    { name: 'sunset', label: 'Sunset', accent: 'orange', accentClass: 'orange-500', bgClass: 'amber-50', borderClass: 'orange-200' },
    { name: 'night', label: 'Night', accent: 'indigo', accentClass: 'indigo-600', bgClass: 'slate-100', borderClass: 'indigo-200' },
    { name: 'snow', label: 'Snow', accent: 'blue', accentClass: 'blue-400', bgClass: 'slate-50', borderClass: 'blue-200' },
    { name: 'autumn', label: 'Autumn', accent: 'amber', accentClass: 'amber-600', bgClass: 'orange-50', borderClass: 'amber-200' }
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

  // Load data from localStorage on mount using resilientStorage
  useEffect(() => {
    try {
      const favoritesResult = dogTaleStorage.load('favorites', []);
      const journalResult = dogTaleStorage.load('journal', {});
      const themeResult = dogTaleStorage.load('theme', 'park');
      const settingsResult = dogTaleStorage.load('settings', null);

      if (favoritesResult.data && Array.isArray(favoritesResult.data)) {
        setFavorites(favoritesResult.data);
        if (favoritesResult.recovered) {
          console.info('Favorites recovered from backup');
        }
      }

      if (journalResult.data && typeof journalResult.data === 'object') {
        setJournalEntries(journalResult.data);
        if (journalResult.recovered) {
          console.info('Journal entries recovered from backup');
        }
      }

      if (themeResult.data && typeof themeResult.data === 'string') {
        setTheme(themeResult.data);
      }

      if (settingsResult.data && typeof settingsResult.data === 'object') {
        setSettings(settingsResult.data);
        if (settingsResult.recovered) {
          console.info('Settings recovered from backup');
        }
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save favorites to localStorage with resilientStorage
  useEffect(() => {
    const result = dogTaleStorage.save('favorites', favorites);
    if (!result.success) {
      console.error('Error saving favorites to localStorage:', result.error);
    }
  }, [favorites]);

  // Save journal entries to localStorage with resilientStorage
  useEffect(() => {
    const result = dogTaleStorage.save('journal', journalEntries);
    if (!result.success) {
      console.error('Error saving journal entries to localStorage:', result.error);
    }
  }, [journalEntries]);

  // Save theme to localStorage with resilientStorage
  useEffect(() => {
    const result = dogTaleStorage.save('theme', theme);
    if (!result.success) {
      console.error('Error saving theme to localStorage:', result.error);
    }
  }, [theme]);

  // Save settings to localStorage with resilientStorage
  useEffect(() => {
    const result = dogTaleStorage.save('settings', settings);
    if (!result.success) {
      console.error('Error saving settings to localStorage:', result.error);
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
    isSignupOpen,
    isHealthOpen,
    isStoryOpen,
    isSeasonPassOpen
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
    'h': () => setIsHealthOpen(true),
    'y': () => setIsStoryOpen(true),
    'p': () => setIsSeasonPassOpen(true),
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

      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-200">
        <div className="container-app">
          {/* Header - Clean and minimal */}
          <header className="sticky top-0 z-40 -mx-4 px-4 py-4 mb-6 bg-surface-50/80 dark:bg-surface-900/80 backdrop-blur-sm border-b border-surface-200/50 dark:border-surface-800/50">
            <div className="flex items-center justify-between">
              {/* Logo & Subtitle */}
              <div>
                <motion.h1
                  className="text-2xl font-bold text-surface-900 dark:text-white"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  DogTale Daily
                </motion.h1>
                <motion.p
                  className="text-sm text-surface-500 dark:text-surface-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Your daily dose of pet joy
                </motion.p>
              </div>

              {/* Header Actions - Minimal */}
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={toggleDarkMode}
                  className="p-2.5 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={isDarkMode ? 'Light mode (D)' : 'Dark mode (D)'}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </motion.button>

                <motion.button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2.5 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Settings"
                  title="Settings (,)"
                >
                  <Settings className="w-5 h-5" />
                </motion.button>

                {/* User menu / Login button */}
                {isAuthenticated ? (
                  <div className="relative group">
                    <motion.button
                      className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="User menu"
                      title={profile?.display_name || user?.email || 'Account'}
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </motion.button>
                    {/* Dropdown menu */}
                    <div className="absolute right-0 top-full mt-2 w-48 py-1 bg-white dark:bg-surface-800 rounded-xl shadow-soft-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-surface-200 dark:border-surface-700">
                      <div className="px-3 py-2 border-b border-surface-200 dark:border-surface-700">
                        <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
                          {profile?.display_name || 'Pet Parent'}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={signOut}
                        className="w-full px-3 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <motion.button
                    onClick={() => setIsLoginOpen(true)}
                    className="p-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Sign in"
                    title="Sign in to sync your data"
                  >
                    <User className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>
          </header>

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

      {/* Lazy-loaded Modals with Suspense */}
      <Suspense fallback={<ModalLoadingFallback />}>
        {isJournalOpen && (
          <JournalModal
            isOpen={isJournalOpen}
            onClose={() => setIsJournalOpen(false)}
            date={currentDate}
            initialEntry={currentJournalEntry}
            onSave={handleSaveJournal}
            allEntries={journalEntries}
          />
        )}

        {isAiOpen && (
          <AiModal
            isOpen={isAiOpen}
            onClose={() => setIsAiOpen(false)}
            currentBreed={currentImage?.breed || null}
          />
        )}

        {isFavoritesOpen && (
          <FavoritesModal
            isOpen={isFavoritesOpen}
            onClose={() => setIsFavoritesOpen(false)}
            favorites={favorites}
            onRemove={handleRemoveFavorite}
            onClearAll={handleClearAllFavorites}
          />
        )}

        {isStatsOpen && (
          <StatisticsModal
            isOpen={isStatsOpen}
            onClose={() => setIsStatsOpen(false)}
            favorites={favorites}
            journalEntries={journalEntries}
          />
        )}

        {isShortcutsOpen && (
          <KeyboardShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />
        )}

        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        )}

        {isSocialHubOpen && (
          <SocialHub onClose={() => setIsSocialHubOpen(false)} />
        )}

        {showASCIIVisualizer && (
          <ASCIIVisualizer onClose={() => setShowASCIIVisualizer(false)} />
        )}

        {/* Auth Modals */}
        {isLoginOpen && (
          <LoginModal
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            onSwitchToSignup={() => {
              setIsLoginOpen(false);
              setIsSignupOpen(true);
            }}
          />
        )}

        {isSignupOpen && (
          <SignupModal
            isOpen={isSignupOpen}
            onClose={() => setIsSignupOpen(false)}
            onSwitchToLogin={() => {
              setIsSignupOpen(false);
              setIsLoginOpen(true);
            }}
          />
        )}

        {/* Health Dashboard */}
        {isHealthOpen && (
          <HealthDashboard
            isOpen={isHealthOpen}
            onClose={() => setIsHealthOpen(false)}
          />
        )}

        {/* Story Generator */}
        {isStoryOpen && (
          <StoryModal
            isOpen={isStoryOpen}
            onClose={() => setIsStoryOpen(false)}
            journalEntries={journalEntries}
          />
        )}

        {/* Season Pass */}
        {isSeasonPassOpen && (
          <SeasonPass
            isOpen={isSeasonPassOpen}
            onClose={() => setIsSeasonPassOpen(false)}
          />
        )}
      </Suspense>

      {/* Achievement Notifications */}
      <AchievementNotificationContainer />
    </ErrorBoundary>
  );
}

// Wrapper component that provides auth, subscription, achievement, and reduced motion context
function AppWithProviders() {
  return (
    <ReducedMotionProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <AchievementProvider>
            <App />
          </AchievementProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ReducedMotionProvider>
  );
}

export default AppWithProviders;
