import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  sendAiMessage,
  streamAiMessage,
  checkAiRateLimit,
  incrementAiUsage,
  saveConversation,
  loadConversation,
} from '../services/aiService';
import { getBreedsKnowledge } from '../utils/breedKnowledge';

/**
 * Hook for managing AI chat state and interactions
 * @param {Object} options
 * @param {string} options.conversationId - Optional existing conversation ID
 * @param {string} options.breedContext - Optional breed for context
 * @returns {Object} Chat state and methods
 */
export function useAiChat(options = {}) {
  const { user, isAuthenticated } = useAuth();
  const { hasFeature, getRemainingQuota } = useSubscription();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [rateLimit, setRateLimit] = useState({ allowed: true, remaining: 5, limit: 5 });
  const [conversationId, setConversationId] = useState(options.conversationId || null);

  const abortControllerRef = useRef(null);

  // Generate breed context if provided
  const breedContext = options.breedContext
    ? getBreedsKnowledge(options.breedContext)
    : null;

  // Check rate limit on mount and after sending messages
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

  // Load existing conversation
  useEffect(() => {
    async function loadExisting() {
      if (!conversationId || !user?.id) return;

      const existingMessages = await loadConversation(user.id, conversationId);
      if (existingMessages.length > 0) {
        setMessages(existingMessages);
      }
    }

    loadExisting();
  }, [conversationId, user?.id]);

  // Send a message
  const sendMessage = useCallback(async (content, options = {}) => {
    if (!content.trim()) return;

    // Check rate limit
    if (!rateLimit.allowed) {
      setError('Daily AI message limit reached. Upgrade to send more messages.');
      return;
    }

    // Clear any previous errors
    setError(null);
    setStreamingContent('');

    // Add user message
    const userMessage = { role: 'user', content: content.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      let assistantContent = '';

      if (options.stream && typeof options.stream === 'boolean') {
        // Streaming mode
        const response = await streamAiMessage(
          updatedMessages,
          (chunk, isDone) => {
            if (!isDone) {
              setStreamingContent(prev => prev + chunk);
            }
          },
          {
            breedContext: breedContext?.summary,
            ...options,
          }
        );
        assistantContent = response.content;
      } else {
        // Non-streaming mode
        const response = await sendAiMessage(updatedMessages, {
          breedContext: breedContext?.summary,
          useEdgeFunction: true,
          ...options,
        });
        assistantContent = response.content;
      }

      // Add assistant message
      const assistantMessage = { role: 'assistant', content: assistantContent };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      setStreamingContent('');

      // Increment usage
      if (user?.id) {
        await incrementAiUsage(user.id);
        refreshRateLimit();
      }

      // Save conversation
      if (user?.id) {
        const convId = conversationId || crypto.randomUUID();
        if (!conversationId) {
          setConversationId(convId);
        }
        await saveConversation(user.id, convId, finalMessages);
      }

      return assistantContent;

    } catch (err) {
      console.error('AI chat error:', err);
      setError(err.message || 'Failed to get AI response');

      // Remove the user message if we failed to get a response
      setMessages(messages);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, rateLimit, breedContext, user?.id, conversationId, refreshRateLimit]);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setStreamingContent('');
    }
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setStreamingContent('');
  }, []);

  // Retry last message
  const retryLastMessage = useCallback(async () => {
    if (messages.length === 0) return;

    const lastUserMessageIndex = messages.map(m => m.role).lastIndexOf('user');
    if (lastUserMessageIndex === -1) return;

    const lastUserMessage = messages[lastUserMessageIndex];

    // Remove messages from the last user message onwards
    const previousMessages = messages.slice(0, lastUserMessageIndex);
    setMessages(previousMessages);

    // Resend the message
    return sendMessage(lastUserMessage.content);
  }, [messages, sendMessage]);

  // Get suggestion prompts based on context
  const getSuggestions = useCallback(() => {
    const generalSuggestions = [
      'What are some fun indoor activities for dogs?',
      'How can I tell if my pet is happy?',
      'What should I know about pet nutrition?',
      'How do I train my pet to do tricks?',
    ];

    if (breedContext?.breed) {
      return [
        `Tell me about ${breedContext.breed} personality traits`,
        `What's the best way to train a ${breedContext.breed}?`,
        `Common health concerns for ${breedContext.breed}s`,
        `Exercise needs for ${breedContext.breed}s`,
      ];
    }

    return generalSuggestions;
  }, [breedContext]);

  return {
    // State
    messages,
    isLoading,
    error,
    streamingContent,
    rateLimit,
    conversationId,
    breedContext,

    // Computed
    canSendMessage: rateLimit.allowed && !isLoading,
    hasMessages: messages.length > 0,
    displayMessages: streamingContent
      ? [...messages, { role: 'assistant', content: streamingContent, isStreaming: true }]
      : messages,

    // Actions
    sendMessage,
    cancelRequest,
    clearConversation,
    retryLastMessage,
    getSuggestions,
    refreshRateLimit,

    // Clear error
    clearError: () => setError(null),
  };
}

export default useAiChat;
