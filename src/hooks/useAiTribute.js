import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  sendAiMessage,
  streamAiMessage,
  checkAiRateLimit,
  incrementAiUsage,
} from '../services/aiService';

/**
 * Tribute types with their prompts and characteristics
 */
const TRIBUTE_TYPES = {
  short: {
    name: 'Social Media Tribute',
    maxLength: 280,
    description: 'Perfect for sharing on social media',
    prompt: (pet, context) => `Create a brief, heartfelt tribute (max 280 characters) for ${pet.name}, a beloved ${pet.species}${pet.breed ? ` (${pet.breed})` : ''} who passed away. ${context}. Make it emotional but uplifting, suitable for social media sharing.`,
  },
  full: {
    name: 'Full Memorial',
    maxLength: 2000,
    description: 'Detailed tribute for printing or memorial',
    prompt: (pet, context) => `Write a beautiful, detailed memorial tribute for ${pet.name}, a beloved ${pet.species}${pet.breed ? ` (${pet.breed})` : ''}. ${context}.

Structure the tribute with:
1. An opening that captures their spirit
2. Cherished memories and personality traits
3. What they meant to their family
4. A comforting closing message

Make it personal, touching, and suitable for printing or a memorial service.`,
  },
  poem: {
    name: 'Memorial Poem',
    maxLength: 500,
    description: 'A heartfelt poem tribute',
    prompt: (pet, context) => `Write a touching memorial poem for ${pet.name}, a beloved ${pet.species}${pet.breed ? ` (${pet.breed})` : ''}. ${context}.

Create a poem that:
- Is 12-20 lines long
- Has a gentle, comforting rhythm
- Celebrates their life and spirit
- Offers comfort to those grieving
- Could be read at a memorial or displayed in their honor`,
  },
  caption: {
    name: 'Photo Caption',
    maxLength: 150,
    description: 'For sharing memories with photos',
    prompt: (pet, context) => `Write a brief, touching photo caption (max 150 characters) for a cherished memory of ${pet.name}, a beloved ${pet.species}. ${context}. Make it personal and heartwarming.`,
  },
};

/**
 * Build context from pet data for AI prompts
 */
function buildPetContext(pet, journalEntries = [], memories = []) {
  const parts = [];

  // Life span
  if (pet.birth_date && pet.deceased_at) {
    const birthYear = new Date(pet.birth_date).getFullYear();
    const deathYear = new Date(pet.deceased_at).getFullYear();
    const age = deathYear - birthYear;
    parts.push(`They lived ${age} wonderful year${age !== 1 ? 's' : ''} (${birthYear}-${deathYear})`);
  }

  // Personality traits
  if (pet.personality_traits?.length > 0) {
    parts.push(`They were known for being ${pet.personality_traits.join(', ')}`);
  }

  // Quirks
  if (pet.quirks?.length > 0) {
    parts.push(`Their lovable quirks included: ${pet.quirks.join(', ')}`);
  }

  // Journal entries summary
  if (journalEntries.length > 0) {
    const recentEntries = journalEntries.slice(0, 5);
    const entrySummary = recentEntries.map(e => e.content || e.text).join('. ');
    if (entrySummary) {
      parts.push(`Some memories recorded about them: ${entrySummary.slice(0, 500)}`);
    }
  }

  // Memories
  if (memories.length > 0) {
    parts.push(`Special moments include: ${memories.slice(0, 3).map(m => m.title || m.description).join(', ')}`);
  }

  // Memorial message if already set
  if (pet.memorial_message) {
    parts.push(`Their memorial message: "${pet.memorial_message}"`);
  }

  return parts.join('. ');
}

/**
 * Hook for AI-powered tribute generation
 * @param {Object} options
 * @param {Object} options.pet - The pet to generate tributes for
 * @param {Array} options.journalEntries - Journal entries about the pet
 * @param {Array} options.memories - Memory/photo data
 * @returns {Object} Tribute generation state and methods
 */
export function useAiTribute(options = {}) {
  const { pet, journalEntries = [], memories = [] } = options;
  const { user } = useAuth();

  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [generatedTributes, setGeneratedTributes] = useState({});
  const [memoryBook, setMemoryBook] = useState([]);
  const [error, setError] = useState(null);
  const [rateLimit, setRateLimit] = useState({ allowed: true, remaining: 5, limit: 5 });

  // Refresh rate limit
  const refreshRateLimit = useCallback(async () => {
    if (!user?.id) {
      setRateLimit({ allowed: true, remaining: 5, limit: 5 });
      return;
    }
    const limit = await checkAiRateLimit(user.id);
    setRateLimit(limit);
  }, [user?.id]);

  /**
   * Generate a tribute of specific type
   */
  const generateTribute = useCallback(async (tributeType = 'full', useStreaming = true) => {
    if (!pet) {
      setError('No pet selected for tribute');
      return null;
    }

    if (!rateLimit.allowed) {
      setError('Daily AI message limit reached. Please try again tomorrow or upgrade your plan.');
      return null;
    }

    const tributeConfig = TRIBUTE_TYPES[tributeType];
    if (!tributeConfig) {
      setError(`Unknown tribute type: ${tributeType}`);
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setStreamingContent('');

    try {
      const context = buildPetContext(pet, journalEntries, memories);
      const prompt = tributeConfig.prompt(pet, context);

      const messages = [{ role: 'user', content: prompt }];
      let content = '';

      if (useStreaming) {
        const response = await streamAiMessage(
          messages,
          (chunk, isDone) => {
            if (!isDone) {
              setStreamingContent(prev => prev + chunk);
            }
          },
          { maxTokens: Math.min(tributeConfig.maxLength * 2, 1024) }
        );
        content = response.content;
      } else {
        const response = await sendAiMessage(messages, {
          maxTokens: Math.min(tributeConfig.maxLength * 2, 1024),
        });
        content = response.content;
      }

      // Store the generated tribute
      const tribute = {
        type: tributeType,
        content,
        generatedAt: new Date().toISOString(),
        petId: pet.id,
        petName: pet.name,
      };

      setGeneratedTributes(prev => ({
        ...prev,
        [tributeType]: tribute,
      }));

      setStreamingContent('');

      // Increment usage
      if (user?.id) {
        await incrementAiUsage(user.id);
        refreshRateLimit();
      }

      return tribute;

    } catch (err) {
      console.error('Error generating tribute:', err);
      setError(err.message || 'Failed to generate tribute');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [pet, journalEntries, memories, rateLimit, user?.id, refreshRateLimit]);

  /**
   * Generate a memory book with multiple AI-generated memories
   */
  const generateMemoryBook = useCallback(async (numberOfMemories = 5) => {
    if (!pet) {
      setError('No pet selected for memory book');
      return null;
    }

    if (!rateLimit.allowed) {
      setError('Daily AI message limit reached.');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const context = buildPetContext(pet, journalEntries, memories);

      const prompt = `Create ${numberOfMemories} heartwarming, imagined memories for ${pet.name}, a beloved ${pet.species}${pet.breed ? ` (${pet.breed})` : ''}. ${context}

Format each memory as a JSON array with objects containing:
- title: A short title for the memory (max 50 chars)
- content: The memory description (2-3 sentences)
- season: Suggested season (spring/summer/fall/winter)
- mood: Emotional tone (joyful/peaceful/playful/tender)

Return ONLY the JSON array, no other text.`;

      const messages = [{ role: 'user', content: prompt }];
      const response = await sendAiMessage(messages, {
        maxTokens: 1024,
      });

      // Parse the JSON response
      let parsedMemories = [];
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedMemories = JSON.parse(jsonMatch[0]);
        }
      } catch (parseErr) {
        console.error('Error parsing memory book JSON:', parseErr);
        // Fallback: create a single memory from the content
        parsedMemories = [{
          title: `Remembering ${pet.name}`,
          content: response.content.slice(0, 200),
          season: 'spring',
          mood: 'tender',
        }];
      }

      const memoryBookEntries = parsedMemories.map((mem, index) => ({
        id: `mem-${Date.now()}-${index}`,
        ...mem,
        petId: pet.id,
        petName: pet.name,
        generatedAt: new Date().toISOString(),
        isEdited: false,
      }));

      setMemoryBook(memoryBookEntries);

      // Increment usage
      if (user?.id) {
        await incrementAiUsage(user.id);
        refreshRateLimit();
      }

      return memoryBookEntries;

    } catch (err) {
      console.error('Error generating memory book:', err);
      setError(err.message || 'Failed to generate memory book');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [pet, journalEntries, memories, rateLimit, user?.id, refreshRateLimit]);

  /**
   * Edit a memory in the memory book
   */
  const editMemory = useCallback((memoryId, updates) => {
    setMemoryBook(prev => prev.map(mem =>
      mem.id === memoryId
        ? { ...mem, ...updates, isEdited: true }
        : mem
    ));
  }, []);

  /**
   * Delete a memory from the memory book
   */
  const deleteMemory = useCallback((memoryId) => {
    setMemoryBook(prev => prev.filter(mem => mem.id !== memoryId));
  }, []);

  /**
   * Generate a caption for a specific photo/memory
   */
  const generatePhotoCaption = useCallback(async (photoDescription) => {
    if (!pet) {
      setError('No pet selected');
      return null;
    }

    if (!rateLimit.allowed) {
      setError('Daily AI message limit reached.');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const prompt = `Write a touching, brief photo caption (max 150 characters) for this memory of ${pet.name}, a beloved ${pet.species}: "${photoDescription}". Make it heartfelt and suitable for sharing.`;

      const messages = [{ role: 'user', content: prompt }];
      const response = await sendAiMessage(messages, { maxTokens: 100 });

      if (user?.id) {
        await incrementAiUsage(user.id);
        refreshRateLimit();
      }

      return response.content;

    } catch (err) {
      console.error('Error generating photo caption:', err);
      setError(err.message || 'Failed to generate caption');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [pet, rateLimit, user?.id, refreshRateLimit]);

  /**
   * Clear a generated tribute
   */
  const clearTribute = useCallback((tributeType) => {
    setGeneratedTributes(prev => {
      const updated = { ...prev };
      delete updated[tributeType];
      return updated;
    });
  }, []);

  /**
   * Clear all generated content
   */
  const clearAll = useCallback(() => {
    setGeneratedTributes({});
    setMemoryBook([]);
    setError(null);
    setStreamingContent('');
  }, []);

  /**
   * Save tribute to localStorage (for persistence)
   */
  const saveTribute = useCallback((tributeType) => {
    const tribute = generatedTributes[tributeType];
    if (!tribute) return;

    const savedTributes = JSON.parse(localStorage.getItem('dogtale-tributes') || '[]');
    savedTributes.push(tribute);
    localStorage.setItem('dogtale-tributes', JSON.stringify(savedTributes));
  }, [generatedTributes]);

  /**
   * Load saved tributes from localStorage
   */
  const loadSavedTributes = useCallback(() => {
    const saved = JSON.parse(localStorage.getItem('dogtale-tributes') || '[]');
    return saved.filter(t => t.petId === pet?.id);
  }, [pet?.id]);

  return {
    // State
    isGenerating,
    streamingContent,
    generatedTributes,
    memoryBook,
    error,
    rateLimit,

    // Tribute types info
    tributeTypes: TRIBUTE_TYPES,

    // Computed
    hasTribute: (type) => !!generatedTributes[type],
    hasMemoryBook: memoryBook.length > 0,
    canGenerate: rateLimit.allowed && !isGenerating,

    // Generation actions
    generateTribute,
    generateMemoryBook,
    generatePhotoCaption,

    // Memory book actions
    editMemory,
    deleteMemory,

    // Management actions
    clearTribute,
    clearAll,
    saveTribute,
    loadSavedTributes,
    refreshRateLimit,

    // Clear error
    clearError: () => setError(null),
  };
}

export default useAiTribute;
