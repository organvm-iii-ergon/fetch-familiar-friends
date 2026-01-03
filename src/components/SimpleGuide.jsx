import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import PropTypes from 'prop-types';

// Simple visual guide with emojis and minimal text
const SimpleGuide = ({ onClose }) => {
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    {
      emoji: '🐾',
      bigEmoji: '🐕',
      action: '👆',
      result: '❤️',
      label: 'tap'
    },
    {
      emoji: '📅',
      bigEmoji: '📆',
      action: '←→',
      result: '🗓️',
      label: 'swipe'
    },
    {
      emoji: '📸',
      bigEmoji: '📷',
      action: '💾',
      result: '⭐',
      label: 'save'
    },
    {
      emoji: '👥',
      bigEmoji: '🧍🧍‍♀️',
      action: '🗺️',
      result: '🤝',
      label: 'meet'
    },
    {
      emoji: '🎮',
      bigEmoji: '🎯',
      action: '✅',
      result: '🏆',
      label: 'play'
    }
  ];

  const tip = tips[currentTip];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed bottom-20 right-4 z-50"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTip}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-64"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>

          {/* Visual demonstration */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
              className="text-5xl"
            >
              {tip.bigEmoji}
            </motion.div>

            <motion.div
              animate={{
                x: [0, 10, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity
              }}
              className="text-3xl"
            >
              {tip.action}
            </motion.div>

            <motion.div
              animate={{
                scale: [0.8, 1.2, 0.8],
                rotate: [0, 360]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                rotate: {
                  duration: 4,
                  repeat: Infinity
                }
              }}
              className="text-4xl"
            >
              {tip.result}
            </motion.div>
          </div>

          {/* Minimal label */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-300 font-medium mb-4">
            {tip.label}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {tips.map((_, i) => (
              <motion.button
                key={i}
                animate={{
                  scale: currentTip === i ? 1.5 : 1,
                  opacity: currentTip === i ? 1 : 0.3
                }}
                whileHover={{ scale: 1.2 }}
                onClick={() => setCurrentTip(i)}
                className={`w-2 h-2 rounded-full ${
                  currentTip === i
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setCurrentTip((prev) => (prev - 1 + tips.length) % tips.length)}
              className="text-2xl hover:scale-125 transition-transform"
              disabled={currentTip === 0}
            >
              ⬅️
            </button>
            <button
              onClick={() => setCurrentTip((prev) => (prev + 1) % tips.length)}
              className="text-2xl hover:scale-125 transition-transform"
            >
              ➡️
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

SimpleGuide.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default SimpleGuide;
