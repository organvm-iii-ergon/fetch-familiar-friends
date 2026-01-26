import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAiChat } from '../../hooks/useAiChat';
import { getBreedSpecificResponse } from '../../utils/breedKnowledge';
import { sanitizeInput, isFamilyFriendly } from '../../utils/dataValidation';

/**
 * Generate a unique message ID
 * @returns {string} Unique ID combining timestamp and random string
 */
const generateMessageId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const AiModal = ({ isOpen, onClose, currentBreed = null }) => {
  const { isAuthenticated, isOnlineMode } = useAuth();
  const { hasFeature, getRemainingQuota } = useSubscription();

  // Use real AI chat hook
  const {
    messages: aiMessages,
    isLoading: aiLoading,
    error: aiError,
    rateLimit,
    sendMessage,
    clearConversation,
    getSuggestions,
    streamingContent,
  } = useAiChat({ breedContext: currentBreed });

  const [inputMessage, setInputMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const [offlineMessages, setOfflineMessages] = useState([]);
  const [offlineLoading, setOfflineLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Determine if we're in offline mode
  const isOffline = !isOnlineMode || !isAuthenticated;
  const isLoading = isOffline ? offlineLoading : aiLoading;
  const inputRef = useRef(null);

  // Get welcome message
  const getWelcomeMessage = () => {
    if (currentBreed) {
      return `Hi! I'm your DogTale AI assistant. I see you're looking at a ${currentBreed}! I can help you with breed-specific tips, training advice, care information, and answer questions about your furry friend! What would you like to know?`;
    }
    return "Hi! I'm your DogTale AI assistant. I can help you with dog care tips, training advice, breed information, and answer questions about your furry friend! What would you like to know?";
  };

  // Initialize with welcome message for display
  const [welcomeShown, setWelcomeShown] = useState(false);

  // Clear offline messages when modal closes or mode changes
  useEffect(() => {
    if (!isOpen) {
      setOfflineMessages([]);
      setWelcomeShown(false);
    }
  }, [isOpen]);

  // Compute messages to display - handle both offline and online modes
  const baseMessages = isOffline ? offlineMessages : aiMessages;
  const messagesWithIds = baseMessages.map((msg, index) => ({
    ...msg,
    id: msg.id || `legacy-${index}-${msg.role}`,
  }));

  const displayMessages = welcomeShown || messagesWithIds.length > 0
    ? messagesWithIds
    : [{ id: 'welcome', role: 'assistant', content: getWelcomeMessage() }];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, streamingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fallback response for offline mode
  const generateOfflineResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for breed-specific questions first
    if (currentBreed) {
      let breedResponse = null;

      if (lowerMessage.includes('train') || lowerMessage.includes('training')) {
        breedResponse = getBreedSpecificResponse(currentBreed, 'training');
      } else if (lowerMessage.includes('exercise') || lowerMessage.includes('walk') || lowerMessage.includes('activity')) {
        breedResponse = getBreedSpecificResponse(currentBreed, 'exercise');
      } else if (lowerMessage.includes('groom') || lowerMessage.includes('brush') || lowerMessage.includes('bath')) {
        breedResponse = getBreedSpecificResponse(currentBreed, 'grooming');
      } else if (lowerMessage.includes('temperament') || lowerMessage.includes('personality') || lowerMessage.includes('behavior')) {
        breedResponse = getBreedSpecificResponse(currentBreed, 'temperament');
      } else if (lowerMessage.includes('breed') || lowerMessage.includes('about') || lowerMessage.includes('info') || lowerMessage.includes('this dog')) {
        breedResponse = getBreedSpecificResponse(currentBreed, 'info');
      }

      if (breedResponse) return breedResponse;
    }

    // General fallback responses
    if (lowerMessage.includes('train') || lowerMessage.includes('training')) {
      return 'Training tips: Use positive reinforcement, keep sessions short (5-15 minutes), be consistent with commands, reward good behavior immediately, and make it fun! Start with basic commands like sit, stay, and come.';
    } else if (lowerMessage.includes('food') || lowerMessage.includes('feed') || lowerMessage.includes('diet')) {
      return 'Feeding guidelines: Most adult dogs do well with 2 meals per day. Portion sizes depend on breed, age, and activity level. Always provide fresh water. Avoid chocolate, grapes, onions, and xylitol.';
    } else if (lowerMessage.includes('walk') || lowerMessage.includes('exercise')) {
      return 'Exercise needs vary by breed: Small breeds need 30-60 minutes daily, medium breeds need 60-120 minutes, and large/high-energy breeds may need 2+ hours. Include mental stimulation too!';
    } else if (lowerMessage.includes('health') || lowerMessage.includes('vet')) {
      return 'Regular vet check-ups are important! Annual visits for healthy adult dogs, more frequent for puppies and seniors. Watch for changes in appetite, energy, or behavior.';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return currentBreed
        ? `Hello! I'd love to help you learn more about ${currentBreed}s. What would you like to know?`
        : 'Hello! How can I help you with your dog today?';
    }

    return "That's a great question! For the best AI-powered responses, sign in and connect to enable full AI features. In the meantime, feel free to ask about training, feeding, exercise, or grooming!";
  };

  const handleSend = async () => {
    setLocalError('');
    if (!inputMessage.trim() || inputMessage.length > 500) return;

    // Security check: Profanity filter
    if (!isFamilyFriendly(inputMessage)) {
      setLocalError('Please keep the conversation family-friendly.');
      return;
    }

    // Sanitize input
    const sanitizedContent = sanitizeInput(inputMessage.slice(0, 500));
    const messageToSend = sanitizedContent;
    setInputMessage('');
    setWelcomeShown(true);

    // Check if we should use real AI or fallback
    const useRealAi = isOnlineMode && isAuthenticated && rateLimit.allowed;

    if (useRealAi) {
      await sendMessage(messageToSend);
    } else {
      // Offline/unauthenticated fallback with simulated delay
      // Add user message immediately
      const userMsg = {
        id: generateMessageId(),
        role: 'user',
        content: messageToSend,
      };
      setOfflineMessages(prev => [...prev, userMsg]);
      setOfflineLoading(true);

      // Simulate AI response delay
      setTimeout(() => {
        const response = generateOfflineResponse(messageToSend);
        const assistantMsg = {
          id: generateMessageId(),
          role: 'assistant',
          content: response,
        };
        setOfflineMessages(prev => [...prev, assistantMsg]);
        setOfflineLoading(false);
      }, 500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all messages?')) {
      clearConversation();
      setOfflineMessages([]);
      setWelcomeShown(false);
    }
  };

  // Get dynamic suggestions based on context
  const suggestedQuestions = getSuggestions ? getSuggestions() : [
    'How do I train my puppy?',
    'What should I feed my dog?',
    'How much exercise does my dog need?',
    'Tell me about grooming tips'
  ];

  const handleSuggestionClick = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  const displayError = localError || aiError;

  // Add streaming content to display if present (only in online mode)
  const allMessages = streamingContent && !isOffline
    ? [...displayMessages, { id: 'streaming', role: 'assistant', content: streamingContent, isStreaming: true }]
    : displayMessages;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Assistant" size="xl">
      <div className="flex flex-col h-[500px]">
        {/* Rate limit warning */}
        {!rateLimit.allowed && (
          <div className="mb-2 px-3 py-2 bg-yellow-100 border border-yellow-200 text-yellow-800 text-sm rounded-lg">
            Daily message limit reached ({rateLimit.limit} messages).
            {!hasFeature('premium') && ' Upgrade to Premium for more messages!'}
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-2">
          {allMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🤖</span>
                    <span className="text-xs font-semibold">AI Assistant</span>
                    {message.isStreaming && (
                      <span className="text-xs text-gray-500 animate-pulse">typing...</span>
                    )}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && !streamingContent && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {allMessages.length <= 1 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSuggestionClick(question)}
                  className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {displayError && (
          <div className="mb-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-lg" role="alert">
            {displayError}
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              if (localError) setLocalError('');
            }}
            onKeyPress={handleKeyPress}
            placeholder={rateLimit.allowed ? "Ask me anything about dogs..." : "Message limit reached"}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            disabled={isLoading || !rateLimit.allowed}
            maxLength={500}
            aria-label="Message input"
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading || !rateLimit.allowed}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Send message"
          >
            Send
          </button>
          <button
            onClick={handleClearChat}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Clear chat"
            title="Clear chat history"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Footer with usage info */}
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isAuthenticated && rateLimit.remaining !== Infinity
              ? `${rateLimit.remaining}/${rateLimit.limit} messages remaining today`
              : 'Sign in to save conversations'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            For medical advice, consult a veterinarian.
          </p>
        </div>
      </div>
    </Modal>
  );
};

AiModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentBreed: PropTypes.string
};

export default AiModal;
