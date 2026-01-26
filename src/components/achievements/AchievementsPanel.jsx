/**
 * Achievements Panel Component
 * Displays all achievements with progress tracking
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, Check, Star, Filter, Search, ChevronDown, Sparkles } from 'lucide-react';
import { useAchievements } from '../../contexts/AchievementContext';
import {
  ACHIEVEMENT_CATEGORIES,
  CATEGORY_INFO,
  ACHIEVEMENT_RARITY,
  getAchievementsByCategory,
} from '../../config/achievements';

/**
 * Single Achievement Card
 */
function AchievementCard({ achievement, isExpanded, onToggle }) {
  const { isUnlocked, progress, currentValue, threshold, xpReward, hidden } = achievement;
  const rarityColor = getRarityStyles(achievement.rarity);

  // Don't show hidden achievements unless unlocked
  if (hidden && !isUnlocked) {
    return (
      <motion.div
        layout
        className="bg-surface-100 dark:bg-surface-800 rounded-xl p-4 border-2 border-dashed border-surface-300 dark:border-surface-600"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
            <Lock className="w-6 h-6 text-surface-400" />
          </div>
          <div>
            <h4 className="font-medium text-surface-500 dark:text-surface-400">
              Hidden Achievement
            </h4>
            <p className="text-sm text-surface-400 dark:text-surface-500">
              Keep exploring to discover this achievement
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      onClick={onToggle}
      className={`
        relative overflow-hidden cursor-pointer
        rounded-xl border-2 transition-all
        ${isUnlocked
          ? `${rarityColor.bg} ${rarityColor.border} shadow-md`
          : 'bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700 opacity-75'
        }
      `}
    >
      {/* Unlocked indicator glow */}
      {isUnlocked && (
        <div className={`absolute inset-0 opacity-20 ${rarityColor.glow}`} />
      )}

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`
              relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
              ${isUnlocked
                ? `${rarityColor.iconBg} shadow-inner`
                : 'bg-surface-200 dark:bg-surface-700'
              }
            `}
          >
            <span className={`text-2xl ${!isUnlocked && 'grayscale opacity-50'}`}>
              {achievement.icon}
            </span>
            {isUnlocked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4
                className={`font-semibold truncate ${
                  isUnlocked
                    ? 'text-surface-800 dark:text-surface-100'
                    : 'text-surface-600 dark:text-surface-400'
                }`}
              >
                {achievement.name}
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded-full ${rarityColor.badge}`}>
                {achievement.rarity.name}
              </span>
            </div>

            <p
              className={`text-sm mb-2 ${
                isUnlocked
                  ? 'text-surface-600 dark:text-surface-300'
                  : 'text-surface-500 dark:text-surface-500'
              }`}
            >
              {achievement.description}
            </p>

            {/* Progress bar (only for non-unlocked) */}
            {!isUnlocked && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-surface-500 dark:text-surface-400">
                    Progress
                  </span>
                  <span className="text-surface-600 dark:text-surface-300 font-medium">
                    {currentValue} / {threshold}
                  </span>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${rarityColor.progressBar}`}
                  />
                </div>
              </div>
            )}

            {/* XP Reward */}
            <div className="flex items-center gap-1 text-sm">
              <Sparkles className={`w-4 h-4 ${isUnlocked ? 'text-yellow-500' : 'text-surface-400'}`} />
              <span className={isUnlocked ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-surface-500'}>
                {isUnlocked ? `+${xpReward} XP earned` : `${xpReward} XP`}
              </span>
            </div>
          </div>

          {/* Expand indicator */}
          <ChevronDown
            className={`w-5 h-5 text-surface-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-surface-200 dark:border-surface-700">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-surface-500 dark:text-surface-400">Category</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span>{CATEGORY_INFO[achievement.category]?.icon}</span>
                      <span className="font-medium text-surface-700 dark:text-surface-200">
                        {CATEGORY_INFO[achievement.category]?.name}
                      </span>
                    </div>
                  </div>
                  {isUnlocked && achievement.achieved_at && (
                    <div>
                      <span className="text-surface-500 dark:text-surface-400">Unlocked</span>
                      <div className="font-medium text-surface-700 dark:text-surface-200 mt-1">
                        {new Date(achievement.achieved_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * Category Filter Pills
 */
function CategoryFilter({ selected, onChange }) {
  const categories = [
    { key: 'all', name: 'All', icon: '🏆' },
    ...Object.entries(CATEGORY_INFO).map(([key, info]) => ({
      key,
      name: info.name,
      icon: info.icon,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            transition-all
            ${selected === cat.key
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
            }
          `}
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Main Achievements Panel
 */
export function AchievementsPanel() {
  const {
    getAllAchievementsWithProgress,
    totalUnlocked,
    totalAchievements,
    completionPercentage,
  } = useAchievements();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const allAchievements = getAllAchievementsWithProgress();

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    return allAchievements.filter((achievement) => {
      // Category filter
      if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
        return false;
      }

      // Unlocked filter
      if (showUnlockedOnly && !achievement.isUnlocked) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          achievement.name.toLowerCase().includes(query) ||
          achievement.description.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allAchievements, selectedCategory, showUnlockedOnly, searchQuery]);

  // Group by category for display
  const groupedAchievements = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredAchievements };
    }

    return filteredAchievements.reduce((acc, achievement) => {
      const cat = achievement.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(achievement);
      return acc;
    }, {});
  }, [filteredAchievements, selectedCategory]);

  // Calculate category stats
  const categoryStats = useMemo(() => {
    const stats = {};
    for (const [key] of Object.entries(CATEGORY_INFO)) {
      const catAchievements = allAchievements.filter(a => a.category === key);
      const unlocked = catAchievements.filter(a => a.isUnlocked).length;
      stats[key] = { unlocked, total: catAchievements.length };
    }
    return stats;
  }, [allAchievements]);

  return (
    <div className="space-y-6">
      {/* Header with overall progress */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Achievements</h2>
            <p className="text-white/80">
              {totalUnlocked} of {totalAchievements} unlocked
            </p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Overall Progress</span>
            <span className="font-bold">{completionPercentage}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Category pills */}
        <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />

        {/* Toggle for unlocked only */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnlockedOnly}
            onChange={(e) => setShowUnlockedOnly(e.target.checked)}
            className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-surface-600 dark:text-surface-300">
            Show unlocked only
          </span>
        </label>
      </div>

      {/* Achievement lists by category */}
      <div className="space-y-8">
        {Object.entries(groupedAchievements).map(([category, achievements]) => (
          <div key={category}>
            {/* Category header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{CATEGORY_INFO[category]?.icon}</span>
                <h3 className="text-lg font-semibold text-surface-800 dark:text-surface-100">
                  {CATEGORY_INFO[category]?.name}
                </h3>
              </div>
              <span className="text-sm text-surface-500 dark:text-surface-400">
                {categoryStats[category]?.unlocked || 0} / {categoryStats[category]?.total || 0}
              </span>
            </div>

            {/* Achievement cards */}
            <div className="grid gap-3">
              {achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.key}
                  achievement={achievement}
                  isExpanded={expandedId === achievement.key}
                  onToggle={() => setExpandedId(
                    expandedId === achievement.key ? null : achievement.key
                  )}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {Object.keys(groupedAchievements).length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
            <p className="text-surface-500 dark:text-surface-400">
              No achievements found matching your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Get styles based on rarity
 */
function getRarityStyles(rarity) {
  const styles = {
    Common: {
      bg: 'bg-surface-50 dark:bg-surface-800/80',
      border: 'border-surface-300 dark:border-surface-600',
      iconBg: 'bg-surface-200 dark:bg-surface-700',
      badge: 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300',
      progressBar: 'bg-surface-400',
      glow: 'bg-surface-400',
    },
    Uncommon: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-300 dark:border-green-700',
      iconBg: 'bg-green-100 dark:bg-green-900/50',
      badge: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
      progressBar: 'bg-green-500',
      glow: 'bg-green-500',
    },
    Rare: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-300 dark:border-blue-700',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
      progressBar: 'bg-blue-500',
      glow: 'bg-blue-500',
    },
    Epic: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-300 dark:border-purple-700',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
      badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
      progressBar: 'bg-purple-500',
      glow: 'bg-purple-500',
    },
    Legendary: {
      bg: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
      border: 'border-yellow-400 dark:border-yellow-600',
      iconBg: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50',
      badge: 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 text-yellow-700 dark:text-yellow-300',
      progressBar: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      glow: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    },
  };

  return styles[rarity?.name] || styles.Common;
}

export default AchievementsPanel;
