import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

function EnhancedMemorial({ pet, lifeData }) {

  // Mock life data collected over pet's lifetime
  const petVirtualization = {
    voiceClips: 12, // Recorded barks/meows
    photos: 1543,
    videos: 89,
    walkRoutes: 234,
    favoriteSpots: 15,
    playmates: 28,
    totalActivities: 2456,
    personalityTraits: ['Friendly', 'Playful', 'Gentle', 'Loyal'],
    quirks: ['Head tilt when confused', 'Tail wag when happy', 'Zoomies at 7pm'],
    memorableQuotes: [
      'Always greeted everyone with enthusiasm',
      'Never met a stranger, only friends',
      'Loved chasing squirrels in the backyard',
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Digital Twin Memorial
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Recreated from {petVirtualization.totalActivities.toLocaleString()} life moments
          </p>
        </div>
      </div>

      {/* Virtual Pet Display */}
      <motion.div
        className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ minHeight: '400px' }}
      >
        <div className="absolute inset-0 bg-stars opacity-20"></div>

        <div className="relative z-10 text-center">
          <motion.div
            animate={{
              y: [0, -20, 0],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-9xl mb-6"
          >
            ✨🐕✨
          </motion.div>

          <h4 className="text-3xl font-bold mb-2">{pet?.name}'s Digital Spirit</h4>
          <p className="text-purple-200 mb-6">Forever preserved in loving memory</p>

          {/* Voice Recreation */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
            <h5 className="font-semibold mb-4">🔊 Voice Recreation</h5>
            <div className="flex items-center justify-center gap-4 mb-4">
              <button className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all">
                ▶️
              </button>
              <div className="flex-1 max-w-xs">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-purple-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-purple-200">
              Synthesized from {petVirtualization.voiceClips} recorded barks
            </p>
          </div>

          {/* Personality Matrix */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
            <h5 className="font-semibold mb-4">🧠 Personality Matrix</h5>
            <div className="grid grid-cols-2 gap-3">
              {petVirtualization.personalityTraits.map((trait, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-3">
                  <div className="text-sm font-medium">{trait}</div>
                  <div className="h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                      style={{ width: `${Math.random() * 40 + 60}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Interactive Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <h5 className="font-bold text-gray-800 dark:text-gray-100">Walk Their Routes</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {petVirtualization.walkRoutes} routes preserved
          </p>
        </button>

        <button className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-center">
          <div className="text-4xl mb-3">📸</div>
          <h5 className="font-bold text-gray-800 dark:text-gray-100">Memory Gallery</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {petVirtualization.photos.toLocaleString()} photos & {petVirtualization.videos} videos
          </p>
        </button>

        <button className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-center">
          <div className="text-4xl mb-3">🎮</div>
          <h5 className="font-bold text-gray-800 dark:text-gray-100">Play Together</h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            AR games with virtual companion
          </p>
        </button>
      </div>

      {/* Life Story Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          📖 Life Story Timeline
        </h4>
        <div className="space-y-4">
          {[
            { year: '2020', event: 'Adoption Day', emoji: '🏡', description: 'Joined the family from rescue shelter' },
            { year: '2021', event: 'First Birthday', emoji: '🎂', description: 'Celebrated with pup cake and park party' },
            { year: '2022', event: 'Best Friend', emoji: '❤️', description: 'Met lifelong playmate Rocky at dog park' },
            { year: '2023', event: 'Adventure Year', emoji: '🏔️', description: 'Hiked 500+ miles across 15 trails' },
          ].map((milestone, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-4xl">{milestone.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{milestone.event}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{milestone.year}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forever Subscription Options */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-300 dark:border-purple-700">
        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4">
          💎 Forever Memorial Upgrades
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl mb-2">📚</div>
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">Life Book</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Professional hardcover book with all memories
            </p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-3">$149</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl mb-2">🎨</div>
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">Portrait Commission</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Custom oil painting by professional artist
            </p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-3">$499</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl mb-2">🤖</div>
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">AI Companion</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Interactive AI chatbot trained on your pet's data
            </p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-3">$49/mo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

EnhancedMemorial.propTypes = {
  pet: PropTypes.object.isRequired,
  lifeData: PropTypes.object,
};

export default EnhancedMemorial;
