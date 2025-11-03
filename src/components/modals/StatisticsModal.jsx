import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { getCacheStats, clearCache } from '../../utils/imageCache';

const StatisticsModal = ({ isOpen, onClose, favorites, journalEntries }) => {
  const [cacheCleared, setCacheCleared] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    // Total favorites
    const totalFavorites = favorites.length;
    const dogFavorites = favorites.filter(f => f.type === 'dog').length;
    const catFavorites = favorites.filter(f => f.type === 'cat').length;

    // Total journal entries
    const totalJournalEntries = Object.keys(journalEntries).length;
    const journalWordCount = Object.values(journalEntries).reduce((total, entry) => {
      return total + entry.trim().split(/\s+/).length;
    }, 0);

    // Calculate streak (consecutive days with journal entries)
    const dates = Object.keys(journalEntries).map(dateStr => new Date(dateStr)).sort((a, b) => b - a);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dates.length > 0) {
      for (let i = 0; i < dates.length; i++) {
        const date = new Date(dates[i]);
        date.setHours(0, 0, 0, 0);

        if (i === 0) {
          // Check if today or yesterday
          const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 1) {
            currentStreak = 1;
            tempStreak = 1;
          }
        } else {
          const prevDate = new Date(dates[i - 1]);
          prevDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor((prevDate - date) / (1000 * 60 * 60 * 24));

          if (daysDiff === 1) {
            tempStreak++;
            if (i === 0 || currentStreak > 0) {
              currentStreak++;
            }
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
    }

    // Days active (unique dates with journal or favorite)
    const favoriteDates = favorites.map(f => new Date(f.savedAt).toDateString());
    const journalDates = Object.keys(journalEntries);
    const allDates = new Set([...favoriteDates, ...journalDates]);
    const daysActive = allDates.size;

    // First activity date
    const allActivityDates = [
      ...favorites.map(f => f.savedAt),
      ...Object.keys(journalEntries).map(dateStr => new Date(dateStr).getTime())
    ].sort((a, b) => a - b);

    const firstActivityDate = allActivityDates.length > 0 ? new Date(allActivityDates[0]) : null;

    // Average journal length
    const averageJournalLength = totalJournalEntries > 0
      ? Math.round(journalWordCount / totalJournalEntries)
      : 0;

    return {
      totalFavorites,
      dogFavorites,
      catFavorites,
      totalJournalEntries,
      journalWordCount,
      currentStreak,
      longestStreak,
      daysActive,
      firstActivityDate,
      averageJournalLength
    };
  }, [favorites, journalEntries]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const StatCard = ({ icon, label, value, subtext, color = 'blue' }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
      teal: 'from-teal-500 to-teal-600'
    };

    return (
      <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-4 text-white shadow-lg`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{icon}</span>
          <div className="flex-1">
            <p className="text-white/80 text-xs font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
        {subtext && <p className="text-white/70 text-xs mt-1">{subtext}</p>}
      </div>
    );
  };

  StatCard.propTypes = {
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    subtext: PropTypes.string,
    color: PropTypes.oneOf(['blue', 'green', 'purple', 'orange', 'pink', 'teal'])
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📊 Your Statistics" size="xl">
      <div className="space-y-6">
        {/* Overview Message */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Your DogTale Journey</h3>
          <p className="text-sm text-gray-600">
            {stats.daysActive > 0
              ? `You've been active for ${stats.daysActive} day${stats.daysActive !== 1 ? 's' : ''}!`
              : 'Start your journey by favoriting images and writing journal entries!'}
          </p>
          {stats.firstActivityDate && (
            <p className="text-xs text-gray-500 mt-1">
              Member since {formatDate(stats.firstActivityDate)}
            </p>
          )}
        </div>

        {/* Favorites Stats */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>⭐</span> Favorites
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon="⭐"
              label="Total"
              value={stats.totalFavorites}
              color="orange"
            />
            <StatCard
              icon="🐕"
              label="Dogs"
              value={stats.dogFavorites}
              color="blue"
            />
            <StatCard
              icon="🐱"
              label="Cats"
              value={stats.catFavorites}
              color="purple"
            />
          </div>
        </div>

        {/* Journal Stats */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>📝</span> Journal
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon="📖"
              label="Entries"
              value={stats.totalJournalEntries}
              subtext={`${stats.journalWordCount} total words`}
              color="green"
            />
            <StatCard
              icon="📊"
              label="Avg Length"
              value={stats.averageJournalLength}
              subtext="words per entry"
              color="teal"
            />
          </div>
        </div>

        {/* Streak Stats */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>🔥</span> Journaling Streak
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon="🔥"
              label="Current"
              value={stats.currentStreak}
              subtext={stats.currentStreak === 1 ? 'day' : 'days'}
              color="orange"
            />
            <StatCard
              icon="🏆"
              label="Longest"
              value={stats.longestStreak}
              subtext={stats.longestStreak === 1 ? 'day' : 'days'}
              color="pink"
            />
          </div>
        </div>

        {/* Engagement */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>📈</span> Engagement
          </h4>
          <StatCard
            icon="📅"
            label="Days Active"
            value={stats.daysActive}
            subtext="Unique days with activity"
            color="blue"
          />
        </div>

        {/* Image Cache Management */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>💾</span> Image Cache
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {(() => {
              const cacheStats = getCacheStats();
              return (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{cacheStats.total}</p>
                      <p className="text-xs text-gray-600">Cached Images</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{cacheStats.dogs}</p>
                      <p className="text-xs text-gray-600">Dogs 🐕</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{cacheStats.cats}</p>
                      <p className="text-xs text-gray-600">Cats 🐱</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-full transition-all"
                          style={{ width: `${(cacheStats.total / cacheStats.maxSize) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {cacheStats.total} / {cacheStats.maxSize} images ({Math.round((cacheStats.total / cacheStats.maxSize) * 100)}%)
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-3">
                    <p>• Cache expiry: {cacheStats.expiryDays} days</p>
                    {cacheStats.total > 0 && (
                      <>
                        <p>• Oldest cached: {cacheStats.oldestAge} day{cacheStats.oldestAge !== 1 ? 's' : ''} ago</p>
                        <p>• Newest cached: {cacheStats.newestAge} day{cacheStats.newestAge !== 1 ? 's' : ''} ago</p>
                      </>
                    )}
                  </div>
                  {cacheStats.total > 0 && (
                    <>
                      {cacheCleared ? (
                        <div className="text-center p-2 bg-green-100 text-green-800 rounded text-sm">
                          ✓ Cache cleared successfully! Refresh to rebuild.
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm('Clear all cached images? They will be re-downloaded when needed.')) {
                              clearCache();
                              setCacheCleared(true);
                              setTimeout(() => setCacheCleared(false), 3000);
                            }
                          }}
                          className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Clear Cache
                        </button>
                      )}
                    </>
                  )}
                  {cacheStats.total === 0 && (
                    <p className="text-center text-gray-500 text-sm">
                      No images cached yet. Navigate through different dates to build cache.
                    </p>
                  )}
                </>
              );
            })()}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ℹ️ Caching reduces API calls and speeds up loading times for previously viewed dates.
          </p>
        </div>

        {/* Achievements */}
        {(stats.totalFavorites >= 10 || stats.totalJournalEntries >= 7 || stats.longestStreak >= 3) && (
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>🏅</span> Achievements Unlocked
            </h4>
            <div className="space-y-1">
              {stats.totalFavorites >= 10 && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>⭐</span>
                  <span><strong>Collector:</strong> Saved 10+ favorites!</span>
                </div>
              )}
              {stats.totalJournalEntries >= 7 && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>📝</span>
                  <span><strong>Dedicated Writer:</strong> 7+ journal entries!</span>
                </div>
              )}
              {stats.longestStreak >= 3 && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>🔥</span>
                  <span><strong>On Fire:</strong> 3+ day streak!</span>
                </div>
              )}
              {stats.totalFavorites >= 50 && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>💎</span>
                  <span><strong>Super Collector:</strong> 50+ favorites!</span>
                </div>
              )}
              {stats.longestStreak >= 7 && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>🌟</span>
                  <span><strong>Week Warrior:</strong> 7+ day streak!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Motivational message */}
        {stats.currentStreak > 0 && (
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              🎉 Keep it up! You&apos;re on a {stats.currentStreak}-day streak!
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

StatisticsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  favorites: PropTypes.array.isRequired,
  journalEntries: PropTypes.object.isRequired
};

export default StatisticsModal;
