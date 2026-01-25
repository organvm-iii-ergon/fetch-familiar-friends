import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { getBreedSpecificResponse } from '../../utils/breedKnowledge';
import { sanitizeInput, isFamilyFriendly } from '../../utils/dataValidation';

const AiModal = ({ isOpen, onClose, currentBreed = null }) => {
  // Initial welcome message mentions breed if available
  const getWelcomeMessage = () => {
    if (currentBreed) {
      return `Hi! I'm your DogTale AI assistant. I see you're looking at a ${currentBreed}! I can help you with breed-specific tips, training advice, care information, and answer questions about your furry friend! What would you like to know?`;
    }
    return 'Hi! I\'m your DogTale AI assistant. I can help you with dog care tips, training advice, breed information, and answer questions about your furry friend! What would you like to know?';
  };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: getWelcomeMessage()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAiResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for breed-specific questions first
    if (currentBreed) {
      // Determine topic from user message
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

      // If we got a breed-specific response, use it
      if (breedResponse) {
        return breedResponse;
      }
    }

    // Fall back to general responses
    if (lowerMessage.includes('train') || lowerMessage.includes('training')) {
      return 'Training tips: Use positive reinforcement, keep sessions short (5-15 minutes), be consistent with commands, reward good behavior immediately, and make it fun! Start with basic commands like sit, stay, and come. Remember, patience is key!';
    } else if (lowerMessage.includes('food') || lowerMessage.includes('feed') || lowerMessage.includes('diet')) {
      return 'Feeding guidelines: Most adult dogs do well with 2 meals per day. Portion sizes depend on breed, age, and activity level. Always provide fresh water. Avoid chocolate, grapes, onions, and xylitol. Consult your vet for personalized dietary recommendations!';
    } else if (lowerMessage.includes('walk') || lowerMessage.includes('exercise')) {
      return 'Exercise needs vary by breed: Small breeds need 30-60 minutes daily, medium breeds need 60-120 minutes, and large/high-energy breeds may need 2+ hours. Include mental stimulation like puzzle toys and training games!';
    } else if (lowerMessage.includes('breed')) {
      if (currentBreed) {
        return getBreedSpecificResponse(currentBreed, 'info') || 'Let me know what you\'d like to know about this breed!';
      }
      return 'Different breeds have unique characteristics! What specific breed are you curious about? I can share information about temperament, size, exercise needs, grooming requirements, and common health considerations.';
    } else if (lowerMessage.includes('health') || lowerMessage.includes('vet')) {
      return 'Regular vet check-ups are important! Annual visits for healthy adult dogs, more frequent for puppies and seniors. Watch for signs of illness: changes in appetite, energy, bathroom habits, or behavior. Always consult a vet for medical concerns!';
    } else if (lowerMessage.includes('groom') || lowerMessage.includes('bath')) {
      return 'Grooming tips: Brush regularly (frequency depends on coat type), bathe every 4-6 weeks or as needed, trim nails monthly, clean ears weekly, and brush teeth daily if possible. Regular grooming keeps your dog healthy and comfortable!';
    } else if (lowerMessage.includes('play') || lowerMessage.includes('toy')) {
      return 'Playtime is essential for bonding and exercise! Try fetch, tug-of-war, hide-and-seek, puzzle toys, or interactive games. Rotate toys to keep things interesting. Always supervise play and choose size-appropriate toys!';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      if (currentBreed) {
        return `Hello! I'd love to help you learn more about ${currentBreed}s or answer any questions about dog care. What would you like to know?`;
      }
      return 'Hello! How can I help you with your dog today? Feel free to ask about training, nutrition, exercise, health, grooming, or any other dog-related topics!';
    } else if (lowerMessage.includes('thank')) {
      return 'You\'re welcome! I\'m always here to help. Feel free to ask anything else about caring for your furry friend! 🐾';
    } else {
      if (currentBreed && (lowerMessage.includes('this') || lowerMessage.includes('these'))) {
        return getBreedSpecificResponse(currentBreed, 'info') || `That's a great question! ${currentBreed}s are wonderful dogs. What specific aspect would you like to know more about?`;
      }
      return 'That\'s a great question! For personalized advice about ' + userMessage + ', I recommend consulting with your veterinarian or a certified dog trainer. Is there anything else I can help you with regarding general dog care, training tips, or breed information?';
    }
  };

  const handleSend = async () => {
    setError('');
    if (!inputMessage.trim() || inputMessage.length > 500) return;

    // Security check: Profanity filter
    if (!isFamilyFriendly(inputMessage)) {
      setError('Please keep the conversation family-friendly.');
      return;
    }

    // Security check: Input sanitization
    // Although React escapes by default, we sanitize here to prevent
    // any potential future issues if this data is used elsewhere.
    const sanitizedContent = sanitizeInput(inputMessage.slice(0, 500));

    const userMessage = {
      role: 'user',
      content: sanitizedContent
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant',
        content: generateAiResponse(inputMessage) // AI response generation is safe to use original input for matching keywords
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all messages?')) {
      setMessages([
        {
          role: 'assistant',
          content: 'Chat cleared! How can I help you today?'
        }
      ]);
    }
  };

  const suggestedQuestions = [
    'How do I train my puppy?',
    'What should I feed my dog?',
    'How much exercise does my dog need?',
    'Tell me about grooming tips'
  ];

  const handleSuggestionClick = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Assistant" size="xl">
      <div className="flex flex-col h-[500px]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🤖</span>
                    <span className="text-xs font-semibold">AI Assistant</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
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
        {messages.length <= 1 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(question)}
                  className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-2 px-3 py-2 bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg" role="alert">
            {error}
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
              if (error) setError('');
            }}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about dogs..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTyping}
            maxLength={500}
            aria-label="Message input"
          />
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isTyping}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Send message"
          >
            Send
          </button>
          <button
            onClick={handleClearChat}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Clear chat"
            title="Clear chat history"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 mt-2 text-center">
          This is a demo AI assistant. For real medical advice, always consult a veterinarian.
        </p>
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
