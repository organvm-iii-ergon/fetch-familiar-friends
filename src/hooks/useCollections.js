import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isOnlineMode } from '../config/supabase';

// Collection totals - based on available breed data and app features
// Dog CEO API provides ~120 breeds, Cat API ~67 breeds = ~187 total
// Using 200 as a round number to account for sub-breeds and future additions
export const TOTAL_BREEDS = 200;
export const TOTAL_LOCATIONS = 150;
// Achievement count matches the achievements defined in src/config/achievements.js
export const TOTAL_ACHIEVEMENTS = 75;
export const TOTAL_BADGES = 30;

// Local storage key for offline caching
const COLLECTIONS_CACHE_KEY = 'dogtale-collections';

// Mock data for unauthenticated users
const MOCK_COLLECTIONS = {
  breeds: {
    collected: 12,
    total: TOTAL_BREEDS,
    items: [
      { id: 'golden', name: 'Golden Retriever', discoveredAt: new Date().toISOString() },
      { id: 'labrador', name: 'Labrador', discoveredAt: new Date().toISOString() },
      { id: 'beagle', name: 'Beagle', discoveredAt: new Date().toISOString() },
    ],
    newest: 'Golden Retriever',
  },
  locations: {
    collected: 5,
    total: TOTAL_LOCATIONS,
    items: [
      { id: 'central-park', name: 'Central Park', discoveredAt: new Date().toISOString() },
      { id: 'riverside', name: 'Riverside Trail', discoveredAt: new Date().toISOString() },
    ],
    newest: 'Central Park',
  },
  achievements: {
    collected: 3,
    total: TOTAL_ACHIEVEMENTS,
    items: [
      { id: 'first_journal', name: 'First Steps', achievedAt: new Date().toISOString() },
      { id: 'daily_streak_7', name: 'Week Warrior', achievedAt: new Date().toISOString() },
    ],
    newest: 'Week Warrior',
  },
  badges: {
    collected: 2,
    total: TOTAL_BADGES,
    items: [
      { id: 'beach_badge', name: 'Beach Champion', earnedAt: new Date().toISOString() },
    ],
    newest: 'Beach Champion',
  },
};

/**
 * Hook for managing user collections (breeds, locations, achievements, badges)
 * @returns {Object} Collections state and methods
 */
export function useCollections() {
  const { user, isAuthenticated } = useAuth();

  const [collections, setCollections] = useState({
    breeds: { collected: 0, total: TOTAL_BREEDS, items: [], newest: null },
    locations: { collected: 0, total: TOTAL_LOCATIONS, items: [], newest: null },
    achievements: { collected: 0, total: TOTAL_ACHIEVEMENTS, items: [], newest: null },
    badges: { collected: 0, total: TOTAL_BADGES, items: [], newest: null },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newDiscoveries, setNewDiscoveries] = useState([]);

  /**
   * Extract unique breeds from journal entries and favorites
   */
  const fetchBreedsCollection = useCallback(async (userId) => {
    const discoveredBreeds = new Map();

    // Fetch breeds mentioned in journal entries
    const { data: journalEntries, error: journalError } = await supabase
      .from('journal_entries')
      .select('breed, created_at')
      .eq('user_id', userId)
      .not('breed', 'is', null);

    if (!journalError && journalEntries) {
      for (const entry of journalEntries) {
        if (entry.breed && !discoveredBreeds.has(entry.breed)) {
          discoveredBreeds.set(entry.breed, {
            id: entry.breed.toLowerCase().replace(/\s+/g, '-'),
            name: entry.breed,
            discoveredAt: entry.created_at,
            source: 'journal',
          });
        }
      }
    }

    // Fetch breeds from favorited images
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorites')
      .select('breed, created_at')
      .eq('user_id', userId)
      .not('breed', 'is', null);

    if (!favoritesError && favorites) {
      for (const fav of favorites) {
        if (fav.breed && !discoveredBreeds.has(fav.breed)) {
          discoveredBreeds.set(fav.breed, {
            id: fav.breed.toLowerCase().replace(/\s+/g, '-'),
            name: fav.breed,
            discoveredAt: fav.created_at,
            source: 'favorite',
          });
        }
      }
    }

    // Fetch breeds from user's pets
    const { data: pets, error: petsError } = await supabase
      .from('pets')
      .select('breed, created_at')
      .eq('owner_id', userId)
      .not('breed', 'is', null);

    if (!petsError && pets) {
      for (const pet of pets) {
        if (pet.breed && !discoveredBreeds.has(pet.breed)) {
          discoveredBreeds.set(pet.breed, {
            id: pet.breed.toLowerCase().replace(/\s+/g, '-'),
            name: pet.breed,
            discoveredAt: pet.created_at,
            source: 'pet',
          });
        }
      }
    }

    const items = Array.from(discoveredBreeds.values())
      .sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));

    return {
      collected: items.length,
      total: TOTAL_BREEDS,
      items,
      newest: items[0]?.name || null,
    };
  }, []);

  /**
   * Extract unique locations from journal entries
   */
  const fetchLocationsCollection = useCallback(async (userId) => {
    const discoveredLocations = new Map();

    // Fetch locations from journal entries
    const { data: journalEntries, error: journalError } = await supabase
      .from('journal_entries')
      .select('location, created_at')
      .eq('user_id', userId)
      .not('location', 'is', null);

    if (!journalError && journalEntries) {
      for (const entry of journalEntries) {
        if (entry.location && !discoveredLocations.has(entry.location)) {
          discoveredLocations.set(entry.location, {
            id: entry.location.toLowerCase().replace(/\s+/g, '-'),
            name: entry.location,
            discoveredAt: entry.created_at,
          });
        }
      }
    }

    // Fetch locations from activity feed
    const { data: activities, error: activitiesError } = await supabase
      .from('activity_feed')
      .select('location, created_at')
      .eq('user_id', userId)
      .not('location', 'is', null);

    if (!activitiesError && activities) {
      for (const activity of activities) {
        if (activity.location && !discoveredLocations.has(activity.location)) {
          discoveredLocations.set(activity.location, {
            id: activity.location.toLowerCase().replace(/\s+/g, '-'),
            name: activity.location,
            discoveredAt: activity.created_at,
          });
        }
      }
    }

    const items = Array.from(discoveredLocations.values())
      .sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));

    return {
      collected: items.length,
      total: TOTAL_LOCATIONS,
      items,
      newest: items[0]?.name || null,
    };
  }, []);

  /**
   * Fetch user achievements
   */
  const fetchAchievementsCollection = useCallback(async (userId) => {
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError);
      return {
        collected: 0,
        total: TOTAL_ACHIEVEMENTS,
        items: [],
        newest: null,
      };
    }

    const items = (achievements || []).map(a => ({
      id: a.achievement_key,
      name: a.name || formatAchievementName(a.achievement_key),
      description: a.description,
      achievedAt: a.achieved_at,
      icon: a.icon,
    }));

    return {
      collected: items.length,
      total: TOTAL_ACHIEVEMENTS,
      items,
      newest: items[0]?.name || null,
    };
  }, []);

  /**
   * Fetch gym badges from completed gym challenges
   */
  const fetchBadgesCollection = useCallback(async (userId) => {
    // Fetch badges from completed quests with badge rewards
    const { data: completedQuests, error: questsError } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .ilike('quest_key', '%badge%');

    if (questsError) {
      console.error('Error fetching badges:', questsError);
    }

    // Also check for gym_badges table if it exists
    const { data: gymBadges, error: badgesError } = await supabase
      .from('gym_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    // Combine both sources
    const badgeMap = new Map();

    // From completed badge quests
    if (completedQuests) {
      for (const quest of completedQuests) {
        const badgeId = quest.quest_key.replace('_badge', '');
        if (!badgeMap.has(badgeId)) {
          badgeMap.set(badgeId, {
            id: badgeId,
            name: formatBadgeName(quest.quest_key),
            earnedAt: quest.completed_at,
            source: 'quest',
          });
        }
      }
    }

    // From gym_badges table
    if (!badgesError && gymBadges) {
      for (const badge of gymBadges) {
        if (!badgeMap.has(badge.badge_key)) {
          badgeMap.set(badge.badge_key, {
            id: badge.badge_key,
            name: badge.name || formatBadgeName(badge.badge_key),
            gymName: badge.gym_name,
            earnedAt: badge.earned_at,
            icon: badge.icon,
            source: 'gym',
          });
        }
      }
    }

    const items = Array.from(badgeMap.values())
      .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));

    return {
      collected: items.length,
      total: TOTAL_BADGES,
      items,
      newest: items[0]?.name || null,
    };
  }, []);

  /**
   * Fetch all collections
   */
  const fetchCollections = useCallback(async () => {
    if (!isOnlineMode || !user?.id) {
      // Load from localStorage or use mock data
      const cached = localStorage.getItem(COLLECTIONS_CACHE_KEY);
      if (cached) {
        try {
          setCollections(JSON.parse(cached));
        } catch {
          setCollections(MOCK_COLLECTIONS);
        }
      } else {
        setCollections(MOCK_COLLECTIONS);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [breeds, locations, achievements, badges] = await Promise.all([
        fetchBreedsCollection(user.id),
        fetchLocationsCollection(user.id),
        fetchAchievementsCollection(user.id),
        fetchBadgesCollection(user.id),
      ]);

      const newCollections = {
        breeds,
        locations,
        achievements,
        badges,
      };

      setCollections(newCollections);

      // Cache locally for offline support
      localStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify(newCollections));

    } catch (err) {
      console.error('Error fetching collections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchBreedsCollection, fetchLocationsCollection, fetchAchievementsCollection, fetchBadgesCollection]);

  /**
   * Get detailed items for a specific collection type
   */
  const getCollectionDetails = useCallback(async (type) => {
    if (!isOnlineMode || !user?.id) {
      return collections[type]?.items || [];
    }

    setLoading(true);

    try {
      let result;
      switch (type) {
        case 'breeds':
          result = await fetchBreedsCollection(user.id);
          break;
        case 'locations':
          result = await fetchLocationsCollection(user.id);
          break;
        case 'achievements':
          result = await fetchAchievementsCollection(user.id);
          break;
        case 'badges':
          result = await fetchBadgesCollection(user.id);
          break;
        default:
          return [];
      }

      // Update the specific collection
      setCollections(prev => ({
        ...prev,
        [type]: result,
      }));

      return result.items;

    } catch (err) {
      console.error(`Error fetching ${type} details:`, err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id, collections, fetchBreedsCollection, fetchLocationsCollection, fetchAchievementsCollection, fetchBadgesCollection]);

  /**
   * Check for new discoveries since last check
   */
  const checkForNewDiscoveries = useCallback(async () => {
    if (!isOnlineMode || !user?.id) {
      setNewDiscoveries([]);
      return [];
    }

    try {
      const lastCheck = localStorage.getItem('dogtale-last-discovery-check');
      const lastCheckDate = lastCheck ? new Date(lastCheck) : new Date(0);

      const discoveries = [];

      // Fetch recent journal entries with breeds
      const { data: recentJournals } = await supabase
        .from('journal_entries')
        .select('breed, location, created_at')
        .eq('user_id', user.id)
        .gt('created_at', lastCheckDate.toISOString())
        .not('breed', 'is', null);

      if (recentJournals) {
        for (const entry of recentJournals) {
          if (entry.breed) {
            discoveries.push({
              type: 'breed',
              name: entry.breed,
              discoveredAt: entry.created_at,
            });
          }
          if (entry.location) {
            discoveries.push({
              type: 'location',
              name: entry.location,
              discoveredAt: entry.created_at,
            });
          }
        }
      }

      // Fetch recent achievements
      const { data: recentAchievements } = await supabase
        .from('achievements')
        .select('achievement_key, name, achieved_at')
        .eq('user_id', user.id)
        .gt('achieved_at', lastCheckDate.toISOString());

      if (recentAchievements) {
        for (const achievement of recentAchievements) {
          discoveries.push({
            type: 'achievement',
            name: achievement.name || formatAchievementName(achievement.achievement_key),
            discoveredAt: achievement.achieved_at,
          });
        }
      }

      // Update last check time
      localStorage.setItem('dogtale-last-discovery-check', new Date().toISOString());

      setNewDiscoveries(discoveries);
      return discoveries;

    } catch (err) {
      console.error('Error checking for new discoveries:', err);
      return [];
    }
  }, [user?.id]);

  /**
   * Clear new discoveries notifications
   */
  const clearNewDiscoveries = useCallback(() => {
    setNewDiscoveries([]);
  }, []);

  // Fetch collections on mount and auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchCollections();
    } else {
      setCollections(MOCK_COLLECTIONS);
    }
  }, [isAuthenticated, fetchCollections]);

  return {
    // State
    collections,
    loading,
    error,
    newDiscoveries,

    // Computed
    totalCollected:
      collections.breeds.collected +
      collections.locations.collected +
      collections.achievements.collected +
      collections.badges.collected,
    totalPossible: TOTAL_BREEDS + TOTAL_LOCATIONS + TOTAL_ACHIEVEMENTS + TOTAL_BADGES,
    collectionProgress: {
      breeds: Math.round((collections.breeds.collected / TOTAL_BREEDS) * 100),
      locations: Math.round((collections.locations.collected / TOTAL_LOCATIONS) * 100),
      achievements: Math.round((collections.achievements.collected / TOTAL_ACHIEVEMENTS) * 100),
      badges: Math.round((collections.badges.collected / TOTAL_BADGES) * 100),
    },

    // Actions
    fetchCollections,
    getCollectionDetails,
    checkForNewDiscoveries,
    clearNewDiscoveries,

    // Clear error
    clearError: () => setError(null),
  };
}

/**
 * Format achievement key into display name
 */
function formatAchievementName(key) {
  if (!key) return 'Unknown Achievement';
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Format badge key into display name
 */
function formatBadgeName(key) {
  if (!key) return 'Unknown Badge';
  return key
    .replace(/_badge/g, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default useCollections;
