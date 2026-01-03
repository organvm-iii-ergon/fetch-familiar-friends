import { motion } from 'framer-motion';
import { useState } from 'react';
import PropTypes from 'prop-types';

function VirtualPet({ realPet }) {
  const [virtualPet, setVirtualPet] = useState({
    name: realPet?.name || 'Buddy',
    happiness: 85,
    hunger: 60,
    energy: 70,
    health: 90,
    mood: 'happy',
    lastInteraction: new Date(),
    level: 5,
    xp: 350,
    xpToNext: 500,
  });

  const [selectedAction, setSelectedAction] = useState(null);

  // Mood emoji based on stats
  const getMoodEmoji = () => {
    const avg = (virtualPet.happiness + virtualPet.energy + virtualPet.health) / 3;
    if (avg > 80) return '😊';
    if (avg > 60) return '🙂';
    if (avg > 40) return '😐';
    if (avg > 20) return '😟';
    return '😢';
  };

  const actions = [
    { id: 'feed', name: 'Feed', icon: '🍖', effect: { hunger: -30, happiness: +10 } },
    { id: 'play', name: 'Play', icon: '🎾', effect: { happiness: +20, energy: -15 } },
    { id: 'rest', name: 'Rest', icon: '😴', effect: { energy: +30, happiness: +5 } },
    { id: 'groom', name: 'Groom', icon: '✨', effect: { happiness: +15, health: +10 } },
    { id: 'train', name: 'Train', icon: '🎓', effect: { happiness: +10, energy: -20 } },
    { id: 'treat', name: 'Treat', icon: '🦴', effect: { happiness: +25, hunger: -10 } },
  ];

  const handleAction = (action) => {
    setSelectedAction(action.id);

    setTimeout(() => {
      setVirtualPet(prev => ({
        ...prev,
        happiness: Math.min(100, Math.max(0, prev.happiness + (action.effect.happiness || 0))),
        hunger: Math.min(100, Math.max(0, prev.hunger + (action.effect.hunger || 0))),
        energy: Math.min(100, Math.max(0, prev.energy + (action.effect.energy || 0))),
        health: Math.min(100, Math.max(0, prev.health + (action.effect.health || 0))),
        xp: prev.xp + 25,
        lastInteraction: new Date(),
      }));
      setSelectedAction(null);
    }, 1000);
  };

  const getStatColor = (value) => {
    if (value > 70) return 'bg-green-500';
    if (value > 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const achievements = [
    { name: 'First Week', icon: '🎉', unlocked: true },
    { name: 'Happy Pet', icon: '😊', unlocked: true },
    { name: 'Level 5', icon: '⭐', unlocked: true },
    { name: 'Best Friends', icon: '❤️', unlocked: false },
    { name: 'Master Trainer', icon: '🏆', unlocked: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Virtual {virtualPet.name}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Level {virtualPet.level}</span>
        </div>
      </div>

      {/* Virtual Pet Display */}
      <motion.div
        animate={selectedAction ? { scale: [1, 1.1, 1] } : {}}
        className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 text-center relative overflow-hidden"
      >
        <div className="absolute top-4 right-4 text-2xl">{getMoodEmoji()}</div>

        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-9xl mb-4"
        >
          🐕
        </motion.div>

        <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {virtualPet.name}
        </h4>

        {/* XP Bar */}
        <div className="max-w-xs mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Level {virtualPet.level}</span>
            <span>{virtualPet.xp}/{virtualPet.xpToNext} XP</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${(virtualPet.xp / virtualPet.xpToNext) * 100}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: 'Happiness', value: virtualPet.happiness, icon: '😊' },
          { name: 'Hunger', value: virtualPet.hunger, icon: '🍖' },
          { name: 'Energy', value: virtualPet.energy, icon: '⚡' },
          { name: 'Health', value: virtualPet.health, icon: '❤️' },
        ].map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {stat.icon} {stat.name}
              </span>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                {stat.value}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getStatColor(stat.value)} transition-all`}
                style={{ width: `${stat.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">
          Care for {virtualPet.name}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={selectedAction !== null}
              className={`p-4 rounded-xl transition-all ${
                selectedAction === action.id
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white scale-105'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              } ${selectedAction !== null && selectedAction !== action.id ? 'opacity-50' : ''}`}
            >
              <div className="text-3xl mb-1">{action.icon}</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {action.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">
          Achievements
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg text-center ${
                achievement.unlocked
                  ? 'bg-yellow-100 dark:bg-yellow-900/30'
                  : 'bg-gray-100 dark:bg-gray-700 opacity-50'
              }`}
            >
              <div className="text-3xl mb-1">{achievement.icon}</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {achievement.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync with Real Pet */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4">
        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
          🔄 Sync with Real Pet
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Log real-world activities to boost your virtual pet's stats!
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium hover:shadow-md transition-all">
            🚶 Log Walk
          </button>
          <button className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium hover:shadow-md transition-all">
            🍖 Log Meal
          </button>
          <button className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium hover:shadow-md transition-all">
            🎾 Log Play
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
        <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">💜 Virtual Pet Tips</h4>
        <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
          <li>• Check in daily to keep your virtual pet happy</li>
          <li>• Balance all stats for optimal growth</li>
          <li>• Sync real activities for double rewards</li>
          <li>• Unlock special accessories as you level up</li>
        </ul>
      </div>
    </div>
  );
}

VirtualPet.propTypes = {
  realPet: PropTypes.object,
};

export default VirtualPet;
