import { motion } from 'framer-motion';
import { useState } from 'react';

function GameplayHub() {
  const [selectedTab, setSelectedTab] = useState('quests');

  // Daily/Weekly Quests (Pokemon-style tasks)
  const quests = {
    daily: [
      { id: 1, name: 'Morning Walk', xp: 50, progress: 1, goal: 1, reward: '🦴 Treat Token', completed: true },
      { id: 2, name: 'Photo of the Day', xp: 30, progress: 0, goal: 1, reward: '📸 Photo Badge', completed: false },
      { id: 3, name: 'Train a Trick', xp: 75, progress: 0, goal: 1, reward: '🎓 Training XP', completed: false },
      { id: 4, name: 'Social Interaction', xp: 40, progress: 2, goal: 3, reward: '👥 Friend Points', completed: false },
      { id: 5, name: 'Health Check', xp: 25, progress: 1, goal: 1, reward: '❤️ Health Star', completed: true },
    ],
    weekly: [
      { id: 6, name: 'Visit 3 New Locations', xp: 200, progress: 1, goal: 3, reward: '🗺️ Explorer Badge', completed: false },
      { id: 7, name: 'Complete 5 Gym Challenges', xp: 300, progress: 2, goal: 5, reward: '🏆 Champion Trophy', completed: false },
      { id: 8, name: 'Make 2 New Friends', xp: 150, progress: 0, goal: 2, reward: '🌟 Social Star', completed: false },
      { id: 9, name: 'Log 10 Miles Walking', xp: 250, progress: 6.5, goal: 10, reward: '👟 Walker Badge', completed: false },
    ],
  };

  // Battle Pass / Season Pass
  const seasonPass = {
    currentSeason: 'Spring 2024',
    level: 12,
    xp: 3450,
    nextLevelXp: 4000,
    maxLevel: 50,
    rewards: [
      { level: 5, free: '🦴 Bone Token', premium: '✨ Rare Accessory' },
      { level: 10, free: '📸 Photo Frame', premium: '🎨 Custom Portrait' },
      { level: 12, free: '🏅 Bronze Badge', premium: '💎 Diamond Collar', unlocked: true },
      { level: 15, free: '🎾 Ball Toy', premium: '👑 Royal Crown' },
      { level: 20, free: '⭐ Star Badge', premium: '🌈 Rainbow Trail' },
      { level: 25, free: '🎁 Mystery Box', premium: '🏰 Luxury Accessories' },
    ],
  };

  // Gym Battles (location-based challenges)
  const gyms = [
    {
      id: 1,
      name: 'Central Park Arena',
      gymLeader: 'Coach Marcus',
      badge: '🌳 Park Master',
      difficulty: 3,
      location: '0.5 mi away',
      requirements: 'Level 10+',
      rewards: '500 XP + Park Badge',
      challenges: [
        '🎾 Fetch 10 balls in 5 minutes',
        '🦮 Navigate obstacle course',
        '🤝 Team coordination with 3 dogs',
      ],
    },
    {
      id: 2,
      name: 'Beach Training Grounds',
      gymLeader: 'Captain Sarah',
      badge: '🏖️ Beach Champion',
      difficulty: 2,
      location: '2.1 mi away',
      requirements: 'Level 5+',
      rewards: '300 XP + Beach Badge',
      challenges: [
        '🏃 Sprint 100 meters on sand',
        '🌊 Water retrieval challenge',
        '⚡ Agility through beach obstacles',
      ],
    },
    {
      id: 3,
      name: 'Mountain Peak Challenge',
      gymLeader: 'Trainer Alex',
      badge: '⛰️ Summit Master',
      difficulty: 5,
      location: '8.7 mi away',
      requirements: 'Level 20+',
      rewards: '1000 XP + Mountain Badge',
      challenges: [
        '🥾 Complete 5-mile trail',
        '🧗 Climb steep terrain sections',
        '🏔️ Reach summit checkpoint',
      ],
    },
  ];

  // Team Battles (multiplayer)
  const teamBattles = [
    {
      id: 1,
      name: 'Fetch Tournament',
      type: 'PvP',
      players: '2v2',
      timeLimit: '10 min',
      reward: '750 XP + Tournament Trophy',
      nextStart: 'In 15 minutes',
    },
    {
      id: 2,
      name: 'Agility Race',
      type: 'Race',
      players: '1v1',
      timeLimit: '5 min',
      reward: '400 XP + Speed Medal',
      nextStart: 'In 45 minutes',
    },
    {
      id: 3,
      name: 'Co-op Adventure',
      type: 'PvE',
      players: '1-4',
      timeLimit: '20 min',
      reward: '1000 XP + Adventure Tokens',
      nextStart: 'In 2 hours',
    },
  ];

  // Collection system (Palworld-style)
  const collections = {
    breeds: { collected: 34, total: 100, newest: 'Shiba Inu' },
    locations: { collected: 67, total: 150, newest: 'Hidden Garden' },
    achievements: { collected: 28, total: 75, newest: 'Marathon Walker' },
    badges: { collected: 12, total: 30, newest: 'Social Butterfly' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Gameplay Hub
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Complete quests, battle gyms, and collect rewards
        </p>
      </div>

      {/* Season Pass Progress */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-2xl font-bold">{seasonPass.currentSeason}</h4>
            <p className="text-purple-200">Level {seasonPass.level} / {seasonPass.maxLevel}</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 font-bold">
            Upgrade Pass - $9.99
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>XP: {seasonPass.xp.toLocaleString()} / {seasonPass.nextLevelXp.toLocaleString()}</span>
            <span>{Math.round((seasonPass.xp / seasonPass.nextLevelXp) * 100)}%</span>
          </div>
          <div className="h-4 bg-purple-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all"
              style={{ width: `${(seasonPass.xp / seasonPass.nextLevelXp) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {seasonPass.rewards.map((reward, index) => (
            <div
              key={index}
              className={`aspect-square rounded-lg p-2 text-center ${
                reward.unlocked
                  ? 'bg-yellow-500'
                  : reward.level <= seasonPass.level
                  ? 'bg-purple-700'
                  : 'bg-purple-800/50'
              }`}
            >
              <div className="text-xs font-bold mb-1">L{reward.level}</div>
              <div className="text-2xl">{reward.level <= seasonPass.level ? reward.free.split(' ')[0] : '🔒'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'quests', name: 'Quests', icon: '📋' },
          { id: 'gyms', name: 'Gym Battles', icon: '🏋️' },
          { id: 'pvp', name: 'Team Battles', icon: '⚔️' },
          { id: 'collection', name: 'Collections', icon: '📚' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 font-medium transition-all ${
              selectedTab === tab.id
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Quests Tab */}
      {selectedTab === 'quests' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
              ☀️ Daily Quests
            </h4>
            <div className="space-y-3">
              {quests.daily.map((quest) => (
                <div
                  key={quest.id}
                  className={`p-4 rounded-lg ${
                    quest.completed
                      ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700'
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h5 className="font-semibold text-gray-800 dark:text-gray-100">{quest.name}</h5>
                        {quest.completed && <span className="text-green-500 text-xl">✓</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-blue-600 dark:text-blue-400">+{quest.xp} XP</span>
                        <span className="text-gray-600 dark:text-gray-400">{quest.reward}</span>
                      </div>
                      {!quest.completed && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="font-semibold">{quest.progress}/{quest.goal}</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${(quest.progress / quest.goal) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
              📅 Weekly Challenges
            </h4>
            <div className="space-y-3">
              {quests.weekly.map((quest) => (
                <div key={quest.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-100">{quest.name}</h5>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">+{quest.xp} XP</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {typeof quest.progress === 'number' && quest.progress % 1 !== 0
                        ? quest.progress.toFixed(1)
                        : quest.progress}/{quest.goal}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400">{quest.reward}</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                      style={{ width: `${(quest.progress / quest.goal) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gym Battles Tab */}
      {selectedTab === 'gyms' && (
        <div className="space-y-4">
          {gyms.map((gym) => (
            <motion.div
              key={gym.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">{gym.name}</h4>
                    <span className="text-3xl">{gym.badge.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>🎯 {gym.gymLeader}</span>
                    <span>📍 {gym.location}</span>
                    <span className="flex items-center gap-1">
                      {'⭐'.repeat(gym.difficulty)}
                      <span className="text-xs ml-1">({gym.difficulty}/5)</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{gym.requirements}</div>
                  <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mt-1">
                    {gym.rewards}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Challenges:</h5>
                <ul className="space-y-2">
                  {gym.challenges.map((challenge, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-blue-500">▸</span>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>

              <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 font-bold">
                Challenge Gym
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Team Battles Tab */}
      {selectedTab === 'pvp' && (
        <div className="space-y-4">
          {teamBattles.map((battle) => (
            <div key={battle.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {battle.name}
                  </h4>
                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className={`px-3 py-1 rounded-full ${
                      battle.type === 'PvP' ? 'bg-red-100 text-red-700' :
                      battle.type === 'Race' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {battle.type}
                    </span>
                    <span>👥 {battle.players}</span>
                    <span>⏱️ {battle.timeLimit}</span>
                  </div>
                  <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    🏆 {battle.reward}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Starts: {battle.nextStart}
                  </div>
                  <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold">
                    Queue Up
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collections Tab */}
      {selectedTab === 'collection' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(collections).map(([key, data]) => (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 capitalize">
                  {key}
                </h4>
                <span className="text-2xl">
                  {key === 'breeds' ? '🐕' : key === 'locations' ? '📍' : key === 'achievements' ? '🏆' : '🎖️'}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Collected</span>
                  <span className="font-bold text-gray-800 dark:text-gray-100">
                    {data.collected} / {data.total}
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                    style={{ width: `${(data.collected / data.total) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="text-xs text-green-700 dark:text-green-400 font-semibold mb-1">
                  Latest Discovery
                </div>
                <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  ✨ {data.newest}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GameplayHub;
