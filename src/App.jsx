import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  PawPrint,
  Activity,
  Sun,
  Moon,
  Calendar,
  CalendarDays,
  Keyboard,
  Settings,
  BarChart3,
  User,
  LogOut,
} from 'lucide-react';
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
import HealthDashboard from './components/health/HealthDashboard';
import StoryModal from './components/modals/StoryModal';
import SeasonPass from './components/social/SeasonPass';
import { AchievementNotificationContainer } from './components/achievements/AchievementNotification';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { AchievementProvider } from './contexts/AchievementContext';
import { useNavigationShortcuts, useModalShortcuts, useThemeCycleShortcut, useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDarkMode } from './hooks/useDarkMode';
import Button from './components/ui/Button';

// Header button component for consistent styling
const HeaderButton = ({ onClick, icon: Icon, label, title, variant = 'secondary', className = '' }) => (
  <motion.button
    onClick={onClick}
    className={`
      p-2 rounded-xl transition-all
      ${variant === 'primary'
        ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-soft-sm hover:shadow-soft'
        : variant === 'accent'
          ? 'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white shadow-soft-sm hover:shadow-soft'
          : variant === 'success'
            ? 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white shadow-soft-sm hover:shadow-soft'
            : 'bg-white/60 dark:bg-surface-800/60 hover:bg-white dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 shadow-soft-sm hover:shadow-soft'
      }
      focus:outline-none focus:ring-2 focus:ring-primary-500/50
      ${className}
    `}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    aria-label={label}
    title={title}
  >
    <Icon className="w-5 h-5" />
  </motion.button>
);

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

      {/* ASCII Visualizer - can be opened anytime */}
      {showASCIIVisualizer && (
        <ASCIIVisualizer onClose={() => setShowASCIIVisualizer(false)} />
      )}

      <div className="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-800 p-4 transition-colors duration-200">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="relative mb-4">
            <motion.h1
              className="text-4xl font-bold text-center bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              DogTale Daily
            </motion.h1>

            {/* Header Buttons */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {/* Primary Actions */}
              <div className="flex items-center gap-1.5 pr-2 border-r border-surface-200 dark:border-surface-700">
                <HeaderButton
                  onClick={() => setShowASCIIVisualizer(true)}
                  icon={Lightbulb}
                  label="Visual Guide"
                  title="What is this? (Visual Guide)"
                  variant="success"
                />
                <HeaderButton
                  onClick={() => setIsSocialHubOpen(true)}
                  icon={PawPrint}
                  label="Social Hub"
                  title="Pet Social Hub"
                  variant="accent"
                />
                <HeaderButton
                  onClick={() => setIsHealthOpen(true)}
                  icon={Activity}
                  label="Health Dashboard"
                  title="Pet Health Dashboard (H)"
                  variant="success"
                />
              </div>

              {/* Secondary Actions */}
              <div className="flex items-center gap-1.5 pl-1">
                <HeaderButton
                  onClick={toggleDarkMode}
                  icon={isDarkMode ? Sun : Moon}
                  label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={isDarkMode ? 'Light mode (D)' : 'Dark mode (D)'}
                />
                <HeaderButton
                  onClick={() => setShowMonthView(!showMonthView)}
                  icon={showMonthView ? Calendar : CalendarDays}
                  label={showMonthView ? 'Show day view' : 'Show month view'}
                  title={showMonthView ? 'Show day view (M)' : 'Show month view (M)'}
                />
                <HeaderButton
                  onClick={() => setIsShortcutsOpen(true)}
                  icon={Keyboard}
                  label="Keyboard shortcuts"
                  title="Keyboard shortcuts (?)"
                />
                <HeaderButton
                  onClick={() => setIsSettingsOpen(true)}
                  icon={Settings}
                  label="Settings"
                  title="Settings (,)"
                />
                <HeaderButton
                  onClick={() => setIsStatsOpen(true)}
                  icon={BarChart3}
                  label="View statistics"
                  title="View your statistics (S)"
                />

                {/* User menu / Login button */}
                {isAuthenticated ? (
                  <div className="relative group">
                    <motion.button
                      className="p-2 bg-gradient-to-r from-accent-500 to-primary-500 hover:from-accent-600 hover:to-primary-600 text-white rounded-xl transition-all shadow-soft-sm hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500/50"
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
                  <HeaderButton
                    onClick={() => setIsLoginOpen(true)}
                    icon={User}
                    label="Sign in"
                    title="Sign in to sync your data"
                    variant="primary"
                  />
                )}
              </div>
            </div>
          </div>

          <motion.p
            className="text-center text-surface-600 dark:text-surface-400 mb-6 transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Your daily dose of pet joy
          </motion.p>

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

      {/* Health Dashboard */}
      <HealthDashboard
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
      />

      {/* Story Generator */}
      <StoryModal
        isOpen={isStoryOpen}
        onClose={() => setIsStoryOpen(false)}
        journalEntries={journalEntries}
      />

      {/* Season Pass */}
      <SeasonPass
        isOpen={isSeasonPassOpen}
        onClose={() => setIsSeasonPassOpen(false)}
      />

      {/* Achievement Notifications */}
      <AchievementNotificationContainer />
    </ErrorBoundary>
  );
}

// Wrapper component that provides auth, subscription, and achievement context
function AppWithProviders() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AchievementProvider>
          <App />
        </AchievementProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default AppWithProviders;
