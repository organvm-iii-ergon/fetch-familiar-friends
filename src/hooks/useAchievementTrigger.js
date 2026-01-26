/**
 * Achievement Trigger Hook
 * Provides easy-to-use functions for triggering achievement checks from any component
 */

import { useCallback } from 'react';
import { useAchievements } from '../contexts/AchievementContext';

/**
 * Hook for triggering achievement checks
 * Use this in components that perform actions which might unlock achievements
 *
 * @example
 * const { onJournalSave, onFavoriteAdd, onFriendAdd } = useAchievementTrigger();
 *
 * // When user saves a journal entry
 * const handleSave = async () => {
 *   await saveJournal();
 *   onJournalSave(totalJournalCount);
 * };
 */
export function useAchievementTrigger() {
  const { triggerAchievementCheck, loadStats } = useAchievements();

  /**
   * Trigger check for journal-related achievements
   * @param {number} journalCount - Total number of journal entries
   */
  const onJournalSave = useCallback((journalCount) => {
    triggerAchievementCheck('journal_count', journalCount);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for journal streak achievements
   * @param {number} streakDays - Current journal writing streak in days
   */
  const onJournalStreak = useCallback((streakDays) => {
    triggerAchievementCheck('journal_streak', streakDays);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for mood tracking achievements
   * @param {number} uniqueMoods - Number of unique moods logged
   */
  const onMoodLogged = useCallback((uniqueMoods) => {
    triggerAchievementCheck('unique_moods', uniqueMoods);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for favorite-related achievements
   * @param {number} favoriteCount - Total number of favorites
   */
  const onFavoriteAdd = useCallback((favoriteCount) => {
    triggerAchievementCheck('favorite_count', favoriteCount);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for friend-related achievements
   * @param {number} friendCount - Total number of friends
   */
  const onFriendAdd = useCallback((friendCount) => {
    triggerAchievementCheck('friend_count', friendCount);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for reaction-related achievements
   * @param {number} reactionsGiven - Total reactions given
   */
  const onReactionGive = useCallback((reactionsGiven) => {
    triggerAchievementCheck('reactions_given', reactionsGiven);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for activity creation achievements
   * @param {number} activitiesCreated - Total activities created
   */
  const onActivityCreate = useCallback((activitiesCreated) => {
    triggerAchievementCheck('activities_created', activitiesCreated);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for popular post achievements
   * @param {number} maxReactions - Maximum reactions on a single post
   */
  const onPostReaction = useCallback((maxReactions) => {
    triggerAchievementCheck('max_reactions_on_post', maxReactions);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for breed collection achievements
   * @param {number} breedCount - Number of unique breeds discovered
   */
  const onBreedDiscover = useCallback((breedCount) => {
    triggerAchievementCheck('breed_count', breedCount);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for location collection achievements
   * @param {number} locationCount - Number of unique locations visited
   */
  const onLocationVisit = useCallback((locationCount) => {
    triggerAchievementCheck('location_count', locationCount);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for quest completion achievements
   * @param {number} questsCompleted - Total quests completed
   */
  const onQuestComplete = useCallback((questsCompleted) => {
    triggerAchievementCheck('quests_completed', questsCompleted);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for gym-related achievements
   * @param {number} gymsConquered - Number of gyms conquered
   */
  const onGymConquer = useCallback((gymsConquered) => {
    triggerAchievementCheck('gyms_conquered', gymsConquered);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for all gyms conquered achievement
   */
  const onAllGymsConquered = useCallback(() => {
    triggerAchievementCheck('all_gyms_conquered', 1);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for PvP battle completion achievements
   * @param {number} battlesCompleted - Total battles completed
   */
  const onBattleComplete = useCallback((battlesCompleted) => {
    triggerAchievementCheck('battles_completed', battlesCompleted);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for PvP battle win achievements
   * @param {number} battlesWon - Total battles won
   */
  const onBattleWin = useCallback((battlesWon) => {
    triggerAchievementCheck('battles_won', battlesWon);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for win streak achievements
   * @param {number} winStreak - Current win streak
   */
  const onWinStreak = useCallback((winStreak) => {
    triggerAchievementCheck('win_streak', winStreak);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for pet ownership achievements
   * @param {number} petCount - Total number of pets
   */
  const onPetAdd = useCallback((petCount) => {
    triggerAchievementCheck('pet_count', petCount);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for virtual pet creation
   */
  const onVirtualPetCreate = useCallback(() => {
    triggerAchievementCheck('has_virtual_pet', 1);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for virtual pet level achievements
   * @param {number} level - Virtual pet level
   */
  const onVirtualPetLevelUp = useCallback((level) => {
    triggerAchievementCheck('virtual_pet_level', level);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for health record achievements
   * @param {number} healthRecords - Total health records
   */
  const onHealthRecordAdd = useCallback((healthRecords) => {
    triggerAchievementCheck('health_records', healthRecords);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for login streak achievements
   * @param {number} loginStreak - Current login streak in days
   */
  const onLoginStreak = useCallback((loginStreak) => {
    triggerAchievementCheck('login_streak', loginStreak);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for season pass level achievements
   * @param {number} seasonLevel - Current season pass level
   */
  const onSeasonLevelUp = useCallback((seasonLevel) => {
    triggerAchievementCheck('season_level', seasonLevel);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for AI conversation achievements
   * @param {number} aiConversations - Total AI conversations
   */
  const onAiConversation = useCallback((aiConversations) => {
    triggerAchievementCheck('ai_conversations', aiConversations);
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for early bird achievement
   */
  const onEarlyBirdLogin = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 6) {
      triggerAchievementCheck('special_early_bird', 1);
    }
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for night owl achievement
   */
  const onNightOwlLogin = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
      triggerAchievementCheck('special_night_owl', 1);
    }
  }, [triggerAchievementCheck]);

  /**
   * Trigger check for account age achievements
   * @param {number} daysOld - Account age in days
   */
  const onAccountAnniversary = useCallback((daysOld) => {
    triggerAchievementCheck('account_age_days', daysOld);
  }, [triggerAchievementCheck]);

  /**
   * Refresh all stats and check achievements
   * Use this after bulk operations or when you want to ensure all achievements are checked
   */
  const refreshAndCheck = useCallback(() => {
    loadStats();
  }, [loadStats]);

  return {
    // Journal
    onJournalSave,
    onJournalStreak,
    onMoodLogged,

    // Collection
    onFavoriteAdd,
    onBreedDiscover,
    onLocationVisit,

    // Social
    onFriendAdd,
    onReactionGive,
    onActivityCreate,
    onPostReaction,

    // Gamification
    onQuestComplete,
    onGymConquer,
    onAllGymsConquered,
    onBattleComplete,
    onBattleWin,
    onWinStreak,

    // Pet Care
    onPetAdd,
    onVirtualPetCreate,
    onVirtualPetLevelUp,
    onHealthRecordAdd,

    // Streaks
    onLoginStreak,
    onSeasonLevelUp,

    // Special
    onAiConversation,
    onEarlyBirdLogin,
    onNightOwlLogin,
    onAccountAnniversary,

    // Utility
    refreshAndCheck,
  };
}

export default useAchievementTrigger;
