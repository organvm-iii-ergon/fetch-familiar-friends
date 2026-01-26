import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  Check,
  Crown,
  Gift,
  Zap,
  Clock,
  Loader2,
  Sparkles,
  Star,
} from 'lucide-react';
import { useSeasonPass, SEASON_REWARDS, XP_SOURCES } from '../../hooks/useSeasonPass';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../modals/Modal';

// Reward type icons
const REWARD_TYPE_ICONS = {
  currency: '🦴',
  accessory: '👔',
  badge: '🎖️',
  profile_frame: '🖼️',
  xp_boost: '⚡',
  exclusive: '🌟',
};

// Reward card component for the track
function RewardCard({ reward, level, currentLevel, isPremium, isClaimed, onClaim, canClaim }) {
  const isUnlocked = level <= currentLevel;
  const isFree = !isPremium;
  const rewardData = isFree ? reward.free : reward.premium;
  const freeReward = reward.free;
  const premiumReward = reward.premium;

  return (
    <motion.div
      className={`
        relative flex-shrink-0 w-32 p-3 rounded-xl border-2 transition-all
        ${isUnlocked
          ? isClaimed
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : canClaim
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600 shadow-lg shadow-yellow-200 dark:shadow-yellow-900/20'
              : 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700'
          : 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-60'
        }
      `}
      whileHover={isUnlocked && !isClaimed ? { scale: 1.05 } : {}}
    >
      {/* Level badge */}
      <div className={`
        absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold
        ${level === currentLevel
          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
          : isUnlocked
            ? 'bg-blue-500 text-white'
            : 'bg-gray-400 dark:bg-gray-600 text-white'
        }
      `}>
        L{level}
      </div>

      {/* Free reward */}
      <div className="mt-2 text-center">
        <span className="text-2xl">{freeReward.icon}</span>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate" title={freeReward.name}>
          {freeReward.name}
        </p>
      </div>

      {/* Divider */}
      <div className="my-2 border-t border-dashed border-gray-200 dark:border-gray-700 relative">
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-1">
          <Crown className="w-3 h-3 text-yellow-500" />
        </span>
      </div>

      {/* Premium reward */}
      <div className={`text-center ${!isPremium ? 'opacity-50' : ''}`}>
        <div className="relative inline-block">
          <span className="text-2xl">{premiumReward.icon}</span>
          {!isPremium && (
            <Lock className="absolute -bottom-1 -right-1 w-3 h-3 text-gray-500" />
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate" title={premiumReward.name}>
          {premiumReward.name}
        </p>
      </div>

      {/* Claim button / status */}
      {isClaimed ? (
        <div className="mt-2 flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
          <Check className="w-4 h-4" />
          <span className="text-xs font-medium">Claimed</span>
        </div>
      ) : canClaim ? (
        <motion.button
          onClick={() => onClaim(level)}
          className="mt-2 w-full py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg text-xs font-bold hover:from-yellow-500 hover:to-orange-600 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Claim!
        </motion.button>
      ) : !isUnlocked ? (
        <div className="mt-2 flex items-center justify-center gap-1 text-gray-400">
          <Lock className="w-3 h-3" />
          <span className="text-xs">Locked</span>
        </div>
      ) : null}
    </motion.div>
  );
}

RewardCard.propTypes = {
  reward: PropTypes.object.isRequired,
  level: PropTypes.number.isRequired,
  currentLevel: PropTypes.number.isRequired,
  isPremium: PropTypes.bool.isRequired,
  isClaimed: PropTypes.bool.isRequired,
  onClaim: PropTypes.func.isRequired,
  canClaim: PropTypes.bool.isRequired,
};

function SeasonPass({ isOpen, onClose }) {
  const { isAuthenticated } = useAuth();
  const {
    currentSeason,
    userProgress,
    rewards,
    claimedRewards,
    loading,
    error,
    checkoutLoading,
    currentLevel,
    currentXp,
    xpToNextLevel,
    xpProgress,
    isPremium,
    availableRewards,
    timeRemaining,
    maxLevel,
    claimReward,
    upgradeToPremium,
  } = useSeasonPass();

  const [claimingLevel, setClaimingLevel] = useState(null);
  const [claimResult, setClaimResult] = useState(null);
  const trackRef = useRef(null);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Scroll to current level on mount
  useEffect(() => {
    if (trackRef.current && isOpen) {
      const currentLevelCard = trackRef.current.querySelector(`[data-level="${currentLevel}"]`);
      if (currentLevelCard) {
        setTimeout(() => {
          currentLevelCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 300);
      }
    }
  }, [isOpen, currentLevel]);

  // Handle claiming a reward
  const handleClaim = async (level) => {
    setClaimingLevel(level);
    const result = await claimReward(level);
    setClaimingLevel(null);

    if (result.success) {
      setClaimResult(result);
      setShowClaimModal(true);
    }
  };

  // Handle scroll buttons
  const scrollTrack = (direction) => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Handle upgrade
  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      // Show login prompt
      return;
    }
    await upgradeToPremium();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white dark:bg-surface-900 rounded-2xl shadow-soft-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-surface-200/50 dark:border-surface-700/50"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
              <Sparkles className="absolute top-4 right-16 w-6 h-6 text-yellow-300 opacity-50" />
              <Star className="absolute bottom-6 right-28 w-4 h-4 text-yellow-300 opacity-40" />
            </div>

            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-bold tracking-tight">{currentSeason.name}</h2>
                  {isPremium && (
                    <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      PREMIUM
                    </span>
                  )}
                </div>
                <p className="text-white/80 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {timeRemaining.expired
                    ? 'Season ended'
                    : `${timeRemaining.days}d ${timeRemaining.hours}h remaining`
                  }
                </p>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Level & XP Progress */}
            <div className="relative mt-6 bg-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">{currentLevel}</span>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Current Level</p>
                    <p className="font-bold">
                      {currentLevel >= maxLevel ? 'MAX LEVEL!' : `${currentXp.toLocaleString()} / ${xpToNextLevel.toLocaleString()} XP`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/70">Available Rewards</p>
                  <p className="text-2xl font-bold text-yellow-400">{availableRewards.length}</p>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-400 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30" />
                </motion.div>
              </div>
              <p className="text-xs text-white/60 mt-1 text-right">{xpProgress}% to next level</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-6 bg-surface-50 dark:bg-surface-900">
            {/* Loading state */}
            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-xl mb-4">
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Reward Track */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-purple-500" />
                      Reward Track
                    </h3>
                    <div className="flex gap-1">
                      <motion.button
                        onClick={() => scrollTrack('left')}
                        className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </motion.button>
                      <motion.button
                        onClick={() => scrollTrack('right')}
                        className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Track container with progress line */}
                  <div className="relative">
                    {/* Progress line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentLevel / maxLevel) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>

                    {/* Reward cards */}
                    <div
                      ref={trackRef}
                      className="relative flex gap-3 overflow-x-auto pb-4 pt-4 px-2 scrollbar-hide"
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      {rewards.map((reward) => (
                        <div key={reward.level} data-level={reward.level}>
                          <RewardCard
                            reward={reward}
                            level={reward.level}
                            currentLevel={currentLevel}
                            isPremium={isPremium}
                            isClaimed={claimedRewards.includes(reward.level)}
                            onClaim={handleClaim}
                            canClaim={
                              reward.level <= currentLevel &&
                              !claimedRewards.includes(reward.level) &&
                              claimingLevel !== reward.level
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Premium Upgrade Banner (if not premium) */}
                {!isPremium && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden"
                  >
                    <div className="absolute inset-0">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl" />
                    </div>

                    <div className="relative flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-6 h-6 text-yellow-400" />
                          <h4 className="text-xl font-bold">Upgrade to Premium Pass</h4>
                        </div>
                        <p className="text-purple-200 text-sm mb-4">
                          Unlock exclusive rewards, premium accessories, and double your earnings!
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="flex items-center gap-1 text-purple-200">
                            <Check className="w-4 h-4 text-green-400" />
                            Exclusive cosmetics
                          </span>
                          <span className="flex items-center gap-1 text-purple-200">
                            <Check className="w-4 h-4 text-green-400" />
                            Premium profile frames
                          </span>
                          <span className="flex items-center gap-1 text-purple-200">
                            <Check className="w-4 h-4 text-green-400" />
                            Legendary rewards
                          </span>
                        </div>
                      </div>

                      <motion.button
                        onClick={handleUpgrade}
                        disabled={checkoutLoading}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 rounded-xl font-bold text-lg shadow-lg hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {checkoutLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Crown className="w-5 h-5" />
                            ${currentSeason.premiumPrice}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* XP Sources Info */}
                <div className="mt-6">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Earn XP
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(XP_SOURCES).slice(0, 8).map(([key, source]) => (
                      <div
                        key={key}
                        className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{source.name}</span>
                          <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                            +{source.amount} XP
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Claim Result Modal */}
      <AnimatePresence>
        {showClaimModal && claimResult && (
          <Modal
            isOpen={showClaimModal}
            onClose={() => setShowClaimModal(false)}
            title="Reward Claimed!"
            variant="gradient"
            size="sm"
          >
            <div className="text-center py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-full flex items-center justify-center"
              >
                <span className="text-5xl">{claimResult.reward?.free?.icon}</span>
              </motion.div>

              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {claimResult.reward?.free?.name}
              </h3>

              {isPremium && claimResult.reward?.premium && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Premium Bonus:</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">{claimResult.reward.premium.icon}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {claimResult.reward.premium.name}
                    </span>
                  </div>
                </div>
              )}

              <motion.button
                onClick={() => setShowClaimModal(false)}
                className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-600 hover:to-indigo-700 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Awesome!
              </motion.button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

SeasonPass.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SeasonPass;
