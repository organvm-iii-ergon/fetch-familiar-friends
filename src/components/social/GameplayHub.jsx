import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useQuests } from '../../hooks/useQuests';
import { useGymBattles } from '../../hooks/useGymBattles';
import { useCollections, TOTAL_BREEDS, TOTAL_LOCATIONS, TOTAL_ACHIEVEMENTS, TOTAL_BADGES } from '../../hooks/useCollections';
import { useBattleQueue, BATTLE_TYPES, QUEUE_STATUS } from '../../hooks/useBattleQueue';
import { useSeasonPass } from '../../hooks/useSeasonPass';
import { useAuth } from '../../contexts/AuthContext';

// Mock data fallback for unauthenticated users
const MOCK_DAILY_QUESTS = [
  { id: 1, quest_key: 'daily_walk', title: 'Morning Walk', xp: 50, progress: 1, target: 1, icon: '🚶', percentComplete: 100, isComplete: true },
  { id: 2, quest_key: 'daily_photo', title: 'Photo of the Day', xp: 30, progress: 0, target: 1, icon: '📸', percentComplete: 0, isComplete: false },
  { id: 3, quest_key: 'daily_trick', title: 'Train a Trick', xp: 75, progress: 0, target: 1, icon: '🎓', percentComplete: 0, isComplete: false },
  { id: 4, quest_key: 'daily_social', title: 'Social Interaction', xp: 40, progress: 2, target: 3, icon: '👥', percentComplete: 66, isComplete: false },
  { id: 5, quest_key: 'daily_health', title: 'Health Check', xp: 25, progress: 1, target: 1, icon: '❤️', percentComplete: 100, isComplete: true },
];

const MOCK_WEEKLY_QUESTS = [
  { id: 6, quest_key: 'weekly_explore', title: 'Visit 3 New Locations', xp: 200, progress: 1, target: 3, icon: '🗺️', percentComplete: 33, isComplete: false },
  { id: 7, quest_key: 'weekly_gym', title: 'Complete 5 Gym Challenges', xp: 300, progress: 2, target: 5, icon: '🏆', percentComplete: 40, isComplete: false },
  { id: 8, quest_key: 'weekly_friends', title: 'Make 2 New Friends', xp: 150, progress: 0, target: 2, icon: '🌟', percentComplete: 0, isComplete: false },
  { id: 9, quest_key: 'weekly_walk', title: 'Log 10 Miles Walking', xp: 250, progress: 6.5, target: 10, icon: '👟', percentComplete: 65, isComplete: false },
];

function GameplayHub() {
  const [selectedTab, setSelectedTab] = useState('quests');
  const { isAuthenticated } = useAuth();

  const {
    dailyQuests: realDailyQuests,
    weeklyQuests: realWeeklyQuests,
    loading: questsLoading,
    error: questsError,
    completedDailyCount,
    completedWeeklyCount,
    totalDailyXp,
    claimRewards,
  } = useQuests();

  // Use real data when authenticated, fall back to mock
  const dailyQuests = isAuthenticated && realDailyQuests.length > 0 ? realDailyQuests : MOCK_DAILY_QUESTS;
  const weeklyQuests = isAuthenticated && realWeeklyQuests.length > 0 ? realWeeklyQuests : MOCK_WEEKLY_QUESTS;

  // Season Pass hook
  const {
    currentSeason,
    currentLevel: seasonLevel,
    currentXp: seasonXp,
    xpToNextLevel: seasonNextLevelXp,
    xpProgress: seasonXpProgress,
    maxLevel: seasonMaxLevel,
    isPremium: seasonIsPremium,
    rewards: seasonRewards,
    claimedRewards: seasonClaimedRewards,
    availableRewards: seasonAvailableRewards,
    timeRemaining: seasonTimeRemaining,
    loading: seasonLoading,
    claimReward: claimSeasonReward,
  } = useSeasonPass();

  // Get preview rewards for display (show rewards around current level)
  const getPreviewRewards = () => {
    const startLevel = Math.max(1, seasonLevel - 1);
    const endLevel = Math.min(seasonMaxLevel, seasonLevel + 4);
    return seasonRewards.filter(r => r.level >= startLevel && r.level <= endLevel);
  };
  const previewRewards = getPreviewRewards();

  // Gym Battles hook
  const {
    gyms,
    activeChallenge,
    earnedBadges,
    loading: gymsLoading,
    error: gymsError,
    startChallenge,
    completeStep,
    finishChallenge,
    abandonChallenge,
    canChallengeGym,
    hasBadgeForGym,
    CHALLENGE_STATUS,
  } = useGymBattles();

  // State for challenge UI
  const [challengeStarting, setChallengeStarting] = useState(false);
  const [challengeError, setChallengeError] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [newBadge, setNewBadge] = useState(null);

  // Handle starting a gym challenge
  const handleStartChallenge = async (gymId) => {
    setChallengeStarting(true);
    setChallengeError(null);

    const result = await startChallenge(gymId);

    if (result.error) {
      setChallengeError(result.error.message);
    }

    setChallengeStarting(false);
  };

  // Handle completing a challenge step
  const handleCompleteStep = async (stepIndex) => {
    const result = await completeStep(stepIndex);

    if (result.error) {
      setChallengeError(result.error.message);
    } else if (result.isComplete) {
      // Auto-finish when all steps done
      const finishResult = await finishChallenge();
      if (finishResult.data) {
        setNewBadge(finishResult.data);
        setShowBadgeModal(true);
      }
    }
  };

  // Handle abandoning challenge
  const handleAbandonChallenge = async () => {
    if (window.confirm('Are you sure you want to abandon this challenge? Progress will be lost.')) {
      await abandonChallenge();
    }
  };

  // Battle Queue hook for PvP matchmaking
  const {
    queueStatus,
    currentBattle,
    opponent,
    battleHistory,
    queuedBattleType,
    queueTime,
    loading: battleLoading,
    error: battleError,
    isQueuing,
    isMatched,
    isInBattle,
    isIdle,
    wins,
    losses,
    winRate,
    joinQueue,
    leaveQueue,
    submitResult,
    resetBattle,
    clearError: clearBattleError,
  } = useBattleQueue();

  // Team Battles (multiplayer) - battle types configuration
  const teamBattles = [
    {
      id: 1,
      name: 'Fetch Tournament',
      type: 'PvP',
      battleType: BATTLE_TYPES.PVP_2V2,
      players: '2v2',
      timeLimit: '10 min',
      reward: '750 XP + Tournament Trophy',
      xpReward: 750,
    },
    {
      id: 2,
      name: 'Agility Race',
      type: 'Race',
      battleType: BATTLE_TYPES.RACE,
      players: '1v1',
      timeLimit: '5 min',
      reward: '400 XP + Speed Medal',
      xpReward: 400,
    },
    {
      id: 3,
      name: 'Co-op Adventure',
      type: 'PvE',
      battleType: BATTLE_TYPES.COOP,
      players: '1-4',
      timeLimit: '20 min',
      reward: '1000 XP + Adventure Tokens',
      xpReward: 1000,
    },
  ];

  // Handle joining queue for a specific battle type
  const handleJoinQueue = async (battleType) => {
    if (!isAuthenticated) {
      alert('Please sign in to join battles');
      return;
    }
    await joinQueue(battleType);
  };

  // Format queue time display
  const formatQueueTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update queue time display
  const [displayQueueTime, setDisplayQueueTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isQueuing) {
      interval = setInterval(() => {
        setDisplayQueueTime(prev => prev + 1);
      }, 1000);
    } else {
      setDisplayQueueTime(0);
    }
    return () => clearInterval(interval);
  }, [isQueuing]);

  // Collections hook
  const {
    collections,
    loading: collectionsLoading,
    error: collectionsError,
    collectionProgress,
    fetchCollections,
  } = useCollections();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Gameplay Hub
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Complete quests, battle gyms, and collect rewards
        </p>
      </div>

      {/* Season Pass Progress */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-2xl font-bold">{currentSeason?.name || 'Season Pass'}</h4>
                {seasonIsPremium && (
                  <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="text-purple-200">
                Level {seasonLevel} / {seasonMaxLevel}
                {!seasonTimeRemaining?.expired && (
                  <span className="ml-2 text-purple-300 text-sm">
                    ({seasonTimeRemaining?.days}d {seasonTimeRemaining?.hours}h left)
                  </span>
                )}
              </p>
            </div>
            {!seasonIsPremium && (
              <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 font-bold transition-all shadow-lg">
                Upgrade Pass - ${currentSeason?.premiumPrice || '9.99'}
              </button>
            )}
            {seasonAvailableRewards?.length > 0 && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold animate-pulse">
                  {seasonAvailableRewards.length} rewards available!
                </span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>
                XP: {seasonXp?.toLocaleString() || 0} / {seasonNextLevelXp?.toLocaleString() || 500}
              </span>
              <span>{seasonXpProgress || 0}%</span>
            </div>
            <div className="h-4 bg-purple-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                initial={{ width: 0 }}
                animate={{ width: `${seasonXpProgress || 0}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {previewRewards.map((reward) => {
              const isUnlocked = reward.level <= seasonLevel;
              const isClaimed = seasonClaimedRewards?.includes(reward.level);
              const canClaim = isUnlocked && !isClaimed;

              return (
                <motion.div
                  key={reward.level}
                  className={`aspect-square rounded-lg p-2 text-center transition-all cursor-pointer ${
                    canClaim
                      ? 'bg-yellow-500 ring-2 ring-yellow-300 ring-offset-2 ring-offset-purple-900'
                      : isClaimed
                        ? 'bg-green-600'
                        : isUnlocked
                          ? 'bg-purple-700'
                          : 'bg-purple-800/50'
                  }`}
                  whileHover={canClaim ? { scale: 1.05 } : {}}
                  onClick={() => canClaim && claimSeasonReward(reward.level)}
                >
                  <div className="text-xs font-bold mb-1">L{reward.level}</div>
                  <div className="text-2xl">
                    {isUnlocked ? (
                      isClaimed ? '✓' : reward.free?.icon || reward.free?.name?.split(' ')[0] || '🎁'
                    ) : (
                      '🔒'
                    )}
                  </div>
                  {canClaim && (
                    <div className="text-xs mt-0.5 font-medium">Claim!</div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {seasonLoading && (
            <div className="absolute inset-0 bg-purple-900/50 flex items-center justify-center rounded-2xl">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'quests', name: 'Quests', icon: '📋' },
          { id: 'gyms', name: 'Gym Battles', icon: '🏋️' },
          { id: 'pvp', name: 'Team Battles', icon: '⚔️' },
          { id: 'collection', name: 'Collections', icon: '📚' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 font-medium transition-all ${
              selectedTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Quests Tab */}
      {selectedTab === 'quests' && (
        <div className="space-y-6">
          {/* Loading state */}
          {questsLoading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Error state */}
          {questsError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg">
              <p>Failed to load quests: {questsError}</p>
            </div>
          )}

          {/* Quest summary (when authenticated) */}
          {isAuthenticated && !questsLoading && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold">Today&apos;s Progress</h4>
                  <p className="text-blue-100">
                    {completedDailyCount} daily quests completed • {totalDailyXp} XP earned
                  </p>
                </div>
                <div className="text-4xl">🎯</div>
              </div>
            </div>
          )}

          {!questsLoading && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
                <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
                  ☀️ Daily Quests
                </h4>
                <div className="space-y-3">
                  {dailyQuests.map((quest) => (
                    <div
                      key={quest.id || quest.quest_key}
                      className={`p-4 rounded-lg ${
                        quest.isComplete
                          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{quest.icon}</span>
                            <h5 className="font-semibold text-gray-800 dark:text-gray-100">{quest.title}</h5>
                            {quest.isComplete && <span className="text-green-500 text-xl">✓</span>}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-blue-600 dark:text-blue-400">+{quest.xp} XP</span>
                            {quest.description && (
                              <span className="text-gray-600 dark:text-gray-400">{quest.description}</span>
                            )}
                          </div>
                          {!quest.isComplete && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                <span className="font-semibold">{quest.progress}/{quest.target}</span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all"
                                  style={{ width: `${quest.percentComplete}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        {quest.isComplete && !quest.rewards_claimed && isAuthenticated && (
                          <button
                            onClick={() => claimRewards(quest.id)}
                            className="ml-4 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-bold text-sm hover:from-yellow-500 hover:to-orange-600 transition-all"
                          >
                            Claim
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
                <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
                  📅 Weekly Challenges
                  {isAuthenticated && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({completedWeeklyCount} completed)
                    </span>
                  )}
                </h4>
                <div className="space-y-3">
                  {weeklyQuests.map((quest) => (
                    <div
                      key={quest.id || quest.quest_key}
                      className={`p-4 rounded-lg ${
                        quest.isComplete
                          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{quest.icon}</span>
                          <h5 className="font-semibold text-gray-800 dark:text-gray-100">{quest.title}</h5>
                          {quest.isComplete && <span className="text-green-500 text-xl">✓</span>}
                        </div>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">+{quest.xp} XP</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          {typeof quest.progress === 'number' && quest.progress % 1 !== 0
                            ? quest.progress.toFixed(1)
                            : quest.progress}/{quest.target}
                        </span>
                        {quest.description && (
                          <span className="text-purple-600 dark:text-purple-400">{quest.description}</span>
                        )}
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                          style={{ width: `${quest.percentComplete}%` }}
                        ></div>
                      </div>
                      {quest.isComplete && !quest.rewards_claimed && isAuthenticated && (
                        <button
                          onClick={() => claimRewards(quest.id)}
                          className="mt-3 w-full py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-bold text-sm hover:from-yellow-500 hover:to-orange-600 transition-all"
                        >
                          Claim Reward
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Gym Battles Tab */}
      {selectedTab === 'gyms' && (
        <div className="space-y-4">
          {/* Loading state */}
          {gymsLoading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Error state */}
          {(gymsError || challengeError) && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg">
              <p>{gymsError || challengeError}</p>
              {challengeError && (
                <button
                  onClick={() => setChallengeError(null)}
                  className="mt-2 text-sm underline"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          {/* Earned Badges Summary */}
          {earnedBadges.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-white mb-4">
              <h4 className="font-bold mb-2">Your Gym Badges ({earnedBadges.length})</h4>
              <div className="flex flex-wrap gap-2">
                {earnedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1"
                    title={`${badge.badge_name} - ${badge.gym_name}`}
                  >
                    <span className="text-xl">{badge.badge_icon}</span>
                    <span className="text-sm font-medium">{badge.badge_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Challenge Card */}
          <AnimatePresence>
            {activeChallenge && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold">Active Challenge</h4>
                    <p className="text-purple-200">{activeChallenge.gym.name}</p>
                  </div>
                  <span className="text-4xl">{activeChallenge.gym.badge_icon}</span>
                </div>

                <div className="space-y-3 mb-4">
                  {activeChallenge.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        step.completed
                          ? 'bg-green-500/30'
                          : index === activeChallenge.current_step
                          ? 'bg-white/20'
                          : 'bg-white/10'
                      }`}
                    >
                      <span className="text-2xl">{step.icon}</span>
                      <span className="flex-1">{step.description}</span>
                      {step.completed ? (
                        <span className="text-green-300 text-xl">✓</span>
                      ) : index === activeChallenge.current_step ? (
                        <button
                          onClick={() => handleCompleteStep(index)}
                          className="px-4 py-2 bg-white text-purple-600 rounded-lg font-bold text-sm hover:bg-purple-100 transition-colors"
                        >
                          Complete
                        </button>
                      ) : (
                        <span className="text-white/50">🔒</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-purple-200">
                    Progress: {activeChallenge.steps.filter(s => s.completed).length}/{activeChallenge.steps.length}
                  </div>
                  <button
                    onClick={handleAbandonChallenge}
                    className="text-sm text-red-300 hover:text-red-200 underline"
                  >
                    Abandon Challenge
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gym List */}
          {!gymsLoading && gyms.map((gym) => {
            const eligibility = canChallengeGym(gym.id);
            const hasBadge = hasBadgeForGym(gym.id);

            return (
              <motion.div
                key={gym.id}
                whileHover={{ scale: 1.02 }}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all ${
                  hasBadge ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">{gym.name}</h4>
                      <span className="text-3xl">{gym.badge_icon}</span>
                      {hasBadge && (
                        <span className="text-green-500 text-xl" title="Conquered!">✓</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>🎯 {gym.gym_leader}</span>
                      <span>📍 {gym.distance_miles?.toFixed(1) || '?'} mi away</span>
                      <span className="flex items-center gap-1">
                        {'⭐'.repeat(gym.difficulty)}
                        <span className="text-xs ml-1">({gym.difficulty}/5)</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Level {gym.required_level}+</div>
                    <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mt-1">
                      {gym.xp_reward} XP + {gym.badge_name}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Challenges:</h5>
                  <ul className="space-y-2">
                    {gym.challenges.map((challenge) => (
                      <li key={challenge.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-xl">{challenge.icon}</span>
                        {challenge.description}
                      </li>
                    ))}
                  </ul>
                </div>

                {hasBadge ? (
                  <div className="w-full py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-center font-bold">
                    Conquered! Badge Earned
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartChallenge(gym.id)}
                    disabled={!eligibility.eligible || challengeStarting}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                      eligibility.eligible && !challengeStarting
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {challengeStarting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Starting...
                      </span>
                    ) : eligibility.eligible ? (
                      'Challenge Gym'
                    ) : (
                      eligibility.reason
                    )}
                  </button>
                )}
              </motion.div>
            );
          })}

          {/* Badge Earned Modal */}
          <AnimatePresence>
            {showBadgeModal && newBadge && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowBadgeModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.5, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.5, y: 50 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-6xl mb-4">{newBadge.badge?.badge_icon}</div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Badge Earned!
                  </h3>
                  <p className="text-xl text-purple-600 dark:text-purple-400 font-semibold mb-4">
                    {newBadge.badge?.badge_name}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You conquered the gym and earned{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      +{newBadge.xp_awarded} XP
                    </span>
                  </p>
                  <button
                    onClick={() => setShowBadgeModal(false)}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-bold hover:from-yellow-500 hover:to-orange-600"
                  >
                    Awesome!
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Collections Tab */}
      {selectedTab === 'collection' && (
        <div className="space-y-4">
          {/* Loading state */}
          {collectionsLoading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Error state */}
          {collectionsError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center justify-between">
              <p>Failed to load collections: {collectionsError}</p>
              <button
                onClick={fetchCollections}
                className="px-3 py-1 bg-red-100 dark:bg-red-800 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Collection summary */}
          {!collectionsLoading && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold">Collection Progress</h4>
                  <p className="text-indigo-100">
                    {collections.breeds.collected + collections.locations.collected + collections.achievements.collected + collections.badges.collected} total discoveries
                  </p>
                </div>
                <div className="text-4xl">📚</div>
              </div>
            </div>
          )}

          {!collectionsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(collections).map(([key, data]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 capitalize">
                      {key}
                    </h4>
                    <span className="text-2xl">
                      {key === 'breeds' ? '🐕' : key === 'locations' ? '📍' : key === 'achievements' ? '🏆' : '🎖️'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Collected</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">
                        {data.collected} / {data.total}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(data.collected / data.total) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      ></motion.div>
                    </div>
                    <div className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
                      {collectionProgress[key]}% complete
                    </div>
                  </div>

                  {data.newest ? (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <div className="text-xs text-green-700 dark:text-green-400 font-semibold mb-1">
                        Latest Discovery
                      </div>
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        ✨ {data.newest}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">
                        No Discoveries Yet
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Start exploring to discover {key}!
                      </div>
                    </div>
                  )}

                  {/* Show recent items preview */}
                  {data.items && data.items.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Recent ({Math.min(3, data.items.length)} of {data.items.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {data.items.slice(0, 3).map((item, idx) => (
                          <span
                            key={item.id || idx}
                            className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                          >
                            {item.name}
                          </span>
                        ))}
                        {data.items.length > 3 && (
                          <span className="text-xs px-2 py-1 text-gray-500 dark:text-gray-400">
                            +{data.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GameplayHub;
