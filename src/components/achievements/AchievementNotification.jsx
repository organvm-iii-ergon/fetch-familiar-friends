/**
 * Achievement Notification Component
 * Displays toast/modal notifications when achievements are unlocked
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Star, Sparkles } from 'lucide-react';
import { useAchievements } from '../../contexts/AchievementContext';
import { ACHIEVEMENT_RARITY, CATEGORY_INFO } from '../../config/achievements';

/**
 * Single Achievement Toast
 */
function AchievementToast({ achievement, onDismiss, index }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-dismiss after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 8000); // 8 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const rarityColor = getRarityColor(achievement.rarity);
  const categoryInfo = CATEGORY_INFO[achievement.category] || { icon: '🏆', name: 'Achievement' };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{ zIndex: 1000 - index }}
      className="relative"
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          relative overflow-hidden cursor-pointer
          bg-gradient-to-r ${rarityColor.gradient}
          rounded-2xl shadow-2xl
          border-2 ${rarityColor.border}
          min-w-[320px] max-w-[400px]
        `}
      >
        {/* Sparkle animation overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-black/20 hover:bg-black/30 transition-colors z-10"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Header */}
        <div className="relative p-4 pb-2">
          <div className="flex items-center gap-3">
            {/* Achievement Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 12 }}
              className={`
                w-14 h-14 rounded-xl flex items-center justify-center
                bg-white/20 backdrop-blur-sm
                border-2 border-white/30
              `}
            >
              <span className="text-3xl">{achievement.icon}</span>
            </motion.div>

            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 mb-1"
              >
                <Trophy className="w-4 h-4 text-white/80" />
                <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                  Achievement Unlocked
                </span>
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg font-bold text-white truncate"
              >
                {achievement.name}
              </motion.h3>
            </div>
          </div>
        </div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: 1,
            height: isExpanded ? 'auto' : '40px',
          }}
          className="relative px-4 pb-4 overflow-hidden"
        >
          <p className="text-sm text-white/90">
            {achievement.description}
          </p>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-3 pt-3 border-t border-white/20 space-y-2"
            >
              {/* Category */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Category</span>
                <span className="flex items-center gap-1 text-white">
                  <span>{categoryInfo.icon}</span>
                  <span>{categoryInfo.name}</span>
                </span>
              </div>

              {/* Rarity */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Rarity</span>
                <span className="flex items-center gap-1 text-white">
                  <Star className="w-4 h-4" />
                  <span>{achievement.rarity}</span>
                </span>
              </div>

              {/* XP Reward */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">XP Earned</span>
                <span className="flex items-center gap-1 text-yellow-300 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>+{achievement.xp_awarded} XP</span>
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Expand indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white/50 text-xs"
          >
            {isExpanded ? 'tap to collapse' : 'tap for details'}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Achievement Notification Container
 * Manages multiple achievement notifications
 */
export function AchievementNotificationContainer() {
  const { pendingNotifications, dismissNotification } = useAchievements();

  // Only show up to 3 notifications at once
  const visibleNotifications = pendingNotifications.slice(0, 3);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((achievement, index) => (
          <AchievementToast
            key={achievement.id}
            achievement={achievement}
            index={index}
            onDismiss={() => dismissNotification(achievement.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Achievement Unlocked Modal (for major achievements)
 */
export function AchievementUnlockedModal({ achievement, onClose }) {
  const rarityColor = getRarityColor(achievement.rarity);
  const categoryInfo = CATEGORY_INFO[achievement.category] || { icon: '🏆', name: 'Achievement' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`
          relative overflow-hidden
          bg-gradient-to-br ${rarityColor.gradient}
          rounded-3xl shadow-2xl
          max-w-md w-full p-8
          border-4 ${rarityColor.border}
        `}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-white/30"
              initial={{
                x: Math.random() * 400,
                y: 400,
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                y: -50,
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 2 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Content */}
        <div className="relative text-center">
          {/* Trophy animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', damping: 10 }}
            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30"
          >
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl"
            >
              {achievement.icon}
            </motion.span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-white/80" />
              <span className="text-sm font-medium text-white/80 uppercase tracking-wider">
                Achievement Unlocked
              </span>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              {achievement.name}
            </h2>

            <p className="text-white/90 mb-6">
              {achievement.description}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-4 mb-6"
          >
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-2xl mb-1">{categoryInfo.icon}</div>
              <div className="text-xs text-white/70">{categoryInfo.name}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <Star className="w-6 h-6 mx-auto mb-1 text-white" />
              <div className="text-xs text-white/70">{achievement.rarity}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <Sparkles className="w-6 h-6 mx-auto mb-1 text-yellow-300" />
              <div className="text-xs text-white/70">+{achievement.xp_awarded} XP</div>
            </div>
          </motion.div>

          {/* Continue button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
          >
            Awesome!
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Get color scheme based on rarity
 */
function getRarityColor(rarityName) {
  const colors = {
    Common: {
      gradient: 'from-slate-600 to-slate-800',
      border: 'border-slate-400',
      text: 'text-slate-400',
    },
    Uncommon: {
      gradient: 'from-green-500 to-emerald-700',
      border: 'border-green-400',
      text: 'text-green-400',
    },
    Rare: {
      gradient: 'from-blue-500 to-indigo-700',
      border: 'border-blue-400',
      text: 'text-blue-400',
    },
    Epic: {
      gradient: 'from-purple-500 to-violet-700',
      border: 'border-purple-400',
      text: 'text-purple-400',
    },
    Legendary: {
      gradient: 'from-yellow-500 via-orange-500 to-red-600',
      border: 'border-yellow-400',
      text: 'text-yellow-400',
    },
  };

  return colors[rarityName] || colors.Common;
}

export default AchievementNotificationContainer;
