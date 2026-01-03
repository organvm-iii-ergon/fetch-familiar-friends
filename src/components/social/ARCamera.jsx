import { motion } from 'framer-motion';
import { useState } from 'react';

function ARCamera() {
  const [arMode, setArMode] = useState('capture');

  const arModes = [
    { id: 'capture', name: 'Capture', icon: '📸', description: 'Take AR photos with your pet' },
    { id: 'virtual', name: 'Virtual Pet', icon: '👻', description: 'See virtual pets in real world' },
    { id: 'track', name: 'Track Walk', icon: '🗺️', description: 'AR-guided walks' },
    { id: 'play', name: 'AR Games', icon: '🎮', description: 'Interactive pet games' },
  ];

  const virtualPets = [
    { id: 1, name: 'Spirit Buddy', type: 'Guardian', rarity: 'Legendary', emoji: '✨🐕' },
    { id: 2, name: 'Pixel Pup', type: 'Digital', rarity: 'Rare', emoji: '🎮🐶' },
    { id: 3, name: 'Angel Pet', type: 'Celestial', rarity: 'Epic', emoji: '👼🐾' },
  ];

  const arGames = [
    { name: 'Fetch Quest', players: '1-4', difficulty: 'Easy', icon: '🎾' },
    { name: 'Treat Hunt', players: '1+', difficulty: 'Medium', icon: '🦴' },
    { name: 'Agility Course', players: '1', difficulty: 'Hard', icon: '🏃' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        AR Pet Experience
      </h3>

      {/* AR Mode Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {arModes.map(mode => (
          <button
            key={mode.id}
            onClick={() => setArMode(mode.id)}
            className={`p-4 rounded-xl transition-all ${
              arMode === mode.id
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
            }`}
          >
            <div className="text-3xl mb-2">{mode.icon}</div>
            <div className="font-semibold text-sm">{mode.name}</div>
          </button>
        ))}
      </div>

      {/* Camera View */}
      {arMode === 'capture' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 text-center relative overflow-hidden aspect-video"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
          <div className="relative z-10">
            <div className="text-8xl mb-4">📷</div>
            <h4 className="text-white text-xl font-bold mb-2">AR Camera</h4>
            <p className="text-gray-300 text-sm mb-6">Point camera to capture AR moments with your pet</p>

            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-white rounded-full font-bold hover:scale-105 transition-transform">
                📸 Capture
              </button>
              <button className="px-6 py-3 bg-purple-500 text-white rounded-full font-bold hover:scale-105 transition-transform">
                ✨ Add Effects
              </button>
            </div>

            {/* AR Filters */}
            <div className="mt-6 flex gap-3 justify-center overflow-x-auto pb-2">
              {['🎩 Hats', '😎 Glasses', '👑 Crowns', '🦴 Bones', '⭐ Stars'].map((filter, index) => (
                <button
                  key={index}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all whitespace-nowrap text-sm"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Virtual Pets */}
      {arMode === 'virtual' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">
              Collect Virtual Pets
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Discover virtual pet companions in the real world using AR. Each has unique abilities and rarities!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {virtualPets.map((pet, index) => (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all"
              >
                <div className="text-6xl text-center mb-3">{pet.emoji}</div>
                <h5 className="font-bold text-center text-gray-800 dark:text-gray-100">
                  {pet.name}
                </h5>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-1">
                  {pet.type}
                </p>
                <div className="mt-3 flex justify-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    pet.rarity === 'Legendary' ? 'bg-yellow-100 text-yellow-700' :
                    pet.rarity === 'Epic' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {pet.rarity}
                  </span>
                </div>
                <button className="w-full mt-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all">
                  Capture in AR
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AR Guided Walks */}
      {arMode === 'track' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md"
        >
          <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
            AR-Guided Walk
          </h4>

          <div className="bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-4">
            <div className="text-center">
              <div className="text-6xl mb-3">🗺️</div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">AR Navigation Active</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Follow AR markers to discover pet-friendly spots</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl mb-1">📏</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">1.2mi</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Distance</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">⏱️</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">25m</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">🎯</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">3</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Checkpoints</div>
            </div>
          </div>

          <button className="w-full py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors">
            Start AR Walk
          </button>
        </motion.div>
      )}

      {/* AR Games */}
      {arMode === 'play' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">
              AR Pet Games
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Play interactive AR games with your pet and friends!
            </p>
          </div>

          <div className="space-y-3">
            {arGames.map((game, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{game.icon}</div>
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100">{game.name}</h5>
                    <div className="flex gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span>👥 {game.players}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        game.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        game.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {game.difficulty}
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
                    Play
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">💡 AR Tips</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Use AR in well-lit areas for best experience</li>
          <li>• Move slowly to help AR tracking</li>
          <li>• Share AR moments with friends for bonus rewards</li>
          <li>• Complete daily AR challenges for badges</li>
        </ul>
      </div>
    </div>
  );
}

export default ARCamera;
