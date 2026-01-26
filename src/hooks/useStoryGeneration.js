import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  streamAiMessage,
  sendAiMessage,
  checkAiRateLimit,
  incrementAiUsage,
} from '../services/aiService';
import { supabase, isOnlineMode } from '../config/supabase';
import { generateTemplateStory, STORY_TYPES as TEMPLATE_STORY_TYPES } from '../utils/storyTemplates';

// Story types with their configurations
export const STORY_TYPES = {
  adventure: {
    id: 'adventure',
    name: 'Adventure',
    icon: '🏔️',
    description: 'An exciting outdoor adventure with your pet',
    color: 'from-emerald-500 to-teal-600',
  },
  day_in_life: {
    id: 'day_in_life',
    name: 'Day in the Life',
    icon: '☀️',
    description: 'A cozy day at home with your furry friend',
    color: 'from-amber-500 to-orange-600',
  },
  friendship: {
    id: 'friendship',
    name: 'Friendship Tale',
    icon: '💕',
    description: 'A heartwarming story about friendship and love',
    color: 'from-pink-500 to-rose-600',
  },
  mystery: {
    id: 'mystery',
    name: 'Mystery',
    icon: '🔍',
    description: 'A curious mystery your pet helps solve',
    color: 'from-indigo-500 to-purple-600',
  },
  comedy: {
    id: 'comedy',
    name: 'Comedy',
    icon: '😂',
    description: 'A funny tale full of laughs and mishaps',
    color: 'from-yellow-500 to-amber-600',
  },
};

/**
 * Generate a story prompt based on pet data and story type
 * @param {Object} petData - Pet information
 * @param {string} storyType - Type of story to generate
 * @param {Array} recentJournalEntries - Recent journal entries for context
 * @returns {string} Generated prompt
 */
function generateStoryPrompt(petData, storyType, recentJournalEntries = []) {
  const { name, species, breed, age, bio } = petData || {};

  // Calculate age description
  let ageDescription = '';
  if (age) {
    if (age < 1) {
      ageDescription = 'a young puppy/kitten';
    } else if (age < 3) {
      ageDescription = 'a young and energetic';
    } else if (age < 7) {
      ageDescription = 'an adult';
    } else {
      ageDescription = 'a wise senior';
    }
  }

  // Build personality context from bio and journal entries
  let personalityContext = '';
  if (bio) {
    personalityContext = `Their personality: ${bio}. `;
  }

  if (recentJournalEntries.length > 0) {
    const journalContext = recentJournalEntries
      .slice(0, 3)
      .map(entry => entry.content || entry)
      .join(' ');
    personalityContext += `Recent activities and notes: ${journalContext.slice(0, 300)}`;
  }

  // Story type specific prompts
  const storyPrompts = {
    adventure: `Write an exciting adventure story where ${name || 'the pet'} goes on a thrilling outdoor journey. Include elements of exploration, discovery, and maybe a small challenge they overcome. The story should feel exciting but safe and heartwarming.`,

    day_in_life: `Write a cozy, slice-of-life story following ${name || 'the pet'} through a typical day at home. Include peaceful moments, playtime, naps, meals, and interactions with their family. Make it relatable and heartwarming.`,

    friendship: `Write a heartwarming story about ${name || 'the pet'} and a special friendship. This could be with another pet, a child, or their owner. Focus on the bond they share and moments that strengthen their connection.`,

    mystery: `Write a fun, family-friendly mystery story where ${name || 'the pet'} uses their keen senses to help solve a small mystery at home or in the neighborhood. Perhaps a missing object or a strange sound. Keep it light and playful.`,

    comedy: `Write a funny, lighthearted story about ${name || 'the pet'} getting into amusing situations. Include playful mishaps, silly behavior, and moments that would make their owner smile. Keep it wholesome and fun.`,
  };

  const basePrompt = storyPrompts[storyType] || storyPrompts.day_in_life;

  return `You are a creative storyteller writing a short, engaging story about a beloved pet.

Pet Details:
- Name: ${name || 'Unknown'}
- Species: ${species || 'pet'}
- Breed: ${breed || 'mixed breed'}
${ageDescription ? `- Age: ${ageDescription}` : ''}
${personalityContext ? `- ${personalityContext}` : ''}

Story Request:
${basePrompt}

Guidelines:
- Write in a warm, engaging narrative style
- Keep the story between 300-500 words
- Make it feel personal to this specific pet
- Include sensory details (sights, sounds, smells)
- End on a positive, heartwarming note
- Use the pet's name throughout the story
- Make it family-friendly and suitable for all ages
- Add a creative title at the beginning

Begin the story with the title on its own line, followed by the narrative.`;
}

/**
 * Hook for generating and managing AI pet stories
 * @param {Object} options - Hook options
 * @returns {Object} Story generation state and methods
 */
export function useStoryGeneration(options = {}) {
  const { user, isAuthenticated } = useAuth();
  const { hasFeature } = useSubscription();

  const [currentStory, setCurrentStory] = useState(null);
  const [savedStories, setSavedStories] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState(null);
  const [rateLimit, setRateLimit] = useState({ allowed: true, remaining: 5, limit: 5 });

  // Check rate limit on mount
  const refreshRateLimit = useCallback(async () => {
    if (!user?.id) {
      setRateLimit({ allowed: true, remaining: 5, limit: 5 });
      return;
    }

    const limit = await checkAiRateLimit(user.id);
    setRateLimit(limit);
  }, [user?.id]);

  useEffect(() => {
    refreshRateLimit();
  }, [refreshRateLimit]);

  // Load saved stories from database
  const loadSavedStories = useCallback(async () => {
    if (!isOnlineMode || !user?.id) {
      // Load from localStorage as fallback
      const localStories = localStorage.getItem('dogtale-stories');
      if (localStories) {
        setSavedStories(JSON.parse(localStories));
      }
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'story')
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      setSavedStories(data || []);

      // Cache locally
      localStorage.setItem('dogtale-stories', JSON.stringify(data || []));
    } catch (err) {
      console.error('Error loading saved stories:', err);
      // Fall back to local storage
      const localStories = localStorage.getItem('dogtale-stories');
      if (localStories) {
        setSavedStories(JSON.parse(localStories));
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      loadSavedStories();
    }
  }, [isAuthenticated, loadSavedStories]);

  /**
   * Generate a new story using templates (local fallback)
   * @param {Object} petData - Pet information
   * @param {string} storyType - Type of story to generate
   * @param {Array} journalEntries - Recent journal entries for context
   */
  const generateTemplateStoryLocal = useCallback((petData, storyType, journalEntries = []) => {
    const story = generateTemplateStory(petData, storyType, journalEntries);
    setCurrentStory(story);
    return story;
  }, []);

  /**
   * Generate a new story
   * @param {Object} petData - Pet information
   * @param {string} storyType - Type of story to generate
   * @param {Array} journalEntries - Recent journal entries for context
   * @param {Object} options - Generation options
   * @param {boolean} options.useTemplates - Force template-based generation
   */
  const generateStory = useCallback(async (petData, storyType, journalEntries = [], options = {}) => {
    // If templates are requested or premium feature is not available, use templates
    if (options.useTemplates || !hasFeature('storyGeneration')) {
      setError(null);
      setIsGenerating(true);
      setStreamingContent('');
      setCurrentStory(null);

      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      const story = generateTemplateStoryLocal(petData, storyType, journalEntries);
      setIsGenerating(false);
      return story;
    }

    // Check rate limit for AI generation
    if (!rateLimit.allowed) {
      // Fall back to templates instead of showing error
      console.info('AI rate limit reached, using template generation');
      setError(null);
      setIsGenerating(true);
      setStreamingContent('');
      setCurrentStory(null);

      await new Promise(resolve => setTimeout(resolve, 800));

      const story = generateTemplateStoryLocal(petData, storyType, journalEntries);
      setIsGenerating(false);
      return story;
    }

    setError(null);
    setIsGenerating(true);
    setStreamingContent('');
    setCurrentStory(null);

    const prompt = generateStoryPrompt(petData, storyType, journalEntries);
    const messages = [{ role: 'user', content: prompt }];

    try {
      let storyContent = '';

      // Try streaming first
      try {
        const response = await streamAiMessage(
          messages,
          (chunk, isDone) => {
            if (!isDone) {
              setStreamingContent(prev => prev + chunk);
            }
          },
          { maxTokens: 1500 }
        );
        storyContent = response.content;
      } catch {
        // Fall back to non-streaming
        const response = await sendAiMessage(messages, { maxTokens: 1500 });
        storyContent = response.content;
      }

      // Parse title from story (first line)
      const lines = storyContent.split('\n');
      const title = lines[0].replace(/^#\s*/, '').trim() || 'Untitled Story';
      const content = lines.slice(1).join('\n').trim();

      const story = {
        id: crypto.randomUUID(),
        title,
        content: storyContent,
        storyType,
        petData: {
          name: petData?.name,
          species: petData?.species,
          breed: petData?.breed,
        },
        createdAt: new Date().toISOString(),
      };

      setCurrentStory(story);
      setStreamingContent('');

      // Increment usage
      if (user?.id) {
        await incrementAiUsage(user.id);
        refreshRateLimit();
      }

      return story;

    } catch (err) {
      console.error('AI Story generation error, falling back to templates:', err);

      // Fall back to template-based generation on any AI error
      const story = generateTemplateStoryLocal(petData, storyType, journalEntries);
      setError(null); // Clear error since we have a fallback
      return story;
    } finally {
      setIsGenerating(false);
    }
  }, [hasFeature, rateLimit, user?.id, refreshRateLimit, generateTemplateStoryLocal]);

  /**
   * Save the current story
   */
  const saveStory = useCallback(async (story = currentStory) => {
    if (!story) return { error: { message: 'No story to save' } };

    try {
      if (isOnlineMode && user?.id) {
        // Save to database
        const { data, error: saveError } = await supabase
          .from('ai_conversations')
          .insert({
            id: story.id,
            user_id: user.id,
            type: 'story',
            title: story.title,
            metadata: {
              content: story.content,
              storyType: story.storyType,
              petData: story.petData,
            },
          })
          .select()
          .single();

        if (saveError) throw saveError;

        // Update local state
        setSavedStories(prev => [data, ...prev]);

        // Update localStorage cache
        const localStories = JSON.parse(localStorage.getItem('dogtale-stories') || '[]');
        localStorage.setItem('dogtale-stories', JSON.stringify([data, ...localStories].slice(0, 20)));

        return { data, error: null };
      } else {
        // Save to localStorage only
        const localStories = JSON.parse(localStorage.getItem('dogtale-stories') || '[]');
        const newStory = { ...story, saved: true };
        const updatedStories = [newStory, ...localStories].slice(0, 20);
        localStorage.setItem('dogtale-stories', JSON.stringify(updatedStories));
        setSavedStories(updatedStories);
        return { data: newStory, error: null };
      }
    } catch (err) {
      console.error('Error saving story:', err);
      return { data: null, error: err };
    }
  }, [currentStory, user?.id]);

  /**
   * Delete a saved story
   */
  const deleteStory = useCallback(async (storyId) => {
    try {
      if (isOnlineMode && user?.id) {
        const { error: deleteError } = await supabase
          .from('ai_conversations')
          .delete()
          .eq('id', storyId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      }

      // Update local state
      setSavedStories(prev => prev.filter(s => s.id !== storyId));

      // Update localStorage
      const localStories = JSON.parse(localStorage.getItem('dogtale-stories') || '[]');
      localStorage.setItem(
        'dogtale-stories',
        JSON.stringify(localStories.filter(s => s.id !== storyId))
      );

      return { error: null };
    } catch (err) {
      console.error('Error deleting story:', err);
      return { error: err };
    }
  }, [user?.id]);

  /**
   * Load a saved story for viewing
   */
  const viewStory = useCallback((story) => {
    // Reconstruct story from saved format
    const viewableStory = {
      id: story.id,
      title: story.title || story.metadata?.title || 'Untitled Story',
      content: story.metadata?.content || story.content,
      storyType: story.metadata?.storyType || story.storyType,
      petData: story.metadata?.petData || story.petData,
      createdAt: story.created_at || story.createdAt,
    };
    setCurrentStory(viewableStory);
  }, []);

  /**
   * Clear current story
   */
  const clearCurrentStory = useCallback(() => {
    setCurrentStory(null);
    setStreamingContent('');
    setError(null);
  }, []);

  /**
   * Generate a shareable version of the story
   */
  const getShareableContent = useCallback((story = currentStory) => {
    if (!story) return '';

    const petName = story.petData?.name || 'my pet';
    const storyTypeInfo = STORY_TYPES[story.storyType] || STORY_TYPES.day_in_life;

    return `${storyTypeInfo.icon} ${story.title}

${story.content}

---
A ${storyTypeInfo.name.toLowerCase()} story about ${petName}
Created with DogTale Daily`;
  }, [currentStory]);

  return {
    // State
    currentStory,
    savedStories,
    isGenerating,
    streamingContent,
    error,
    rateLimit,

    // Story types
    STORY_TYPES,

    // Computed
    displayContent: streamingContent || currentStory?.content || '',
    hasCurrentStory: !!currentStory || !!streamingContent,
    canGenerate: !isGenerating, // Templates always available as fallback
    canGenerateAI: rateLimit.allowed && !isGenerating && hasFeature('storyGeneration'),
    isTemplateGenerated: currentStory?.isTemplateGenerated || false,

    // Actions
    generateStory,
    saveStory,
    deleteStory,
    viewStory,
    clearCurrentStory,
    getShareableContent,
    loadSavedStories,
    refreshRateLimit,

    // Clear error
    clearError: () => setError(null),
  };
}

export default useStoryGeneration;
