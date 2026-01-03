import { motion } from 'framer-motion';
import { useState } from 'react';
import PropTypes from 'prop-types';

function NearbyPetParents({ userLocation }) {
  const [activeFilter, setActiveFilter] = useState('all');

  // Mock nearby users
  const nearbyUsers = [
    { id: 1, name: 'Sarah & Luna', pet: 'Golden Retriever', distance: '0.3 mi', location: 'Riverside Dog Park', activity: 'At park now', color: '#FF6B6B' },
    { id: 2, name: 'Mike & Buddy', pet: 'Labrador', distance: '0.5 mi', location: 'Beach Trail', activity: 'Walking', color: '#4ECDC4' },
    { id: 3, name: 'Emma & Max', pet: 'Corgi', distance: '0.8 mi', location: 'Downtown Cafe', activity: 'Coffee break', color: '#45B7D1' },
    { id: 4, name: 'John & Rocky', pet: 'Husky', distance: '1.2 mi', location: 'Mountain Trail', activity: 'Hiking', color: '#FFA07A' },
    { id: 5, name: 'Lisa & Bella', pet: 'Beagle', distance: '1.5 mi', location: 'Central Park', activity: 'Playdate', color: '#98D8C8' },
  ];

  const filters = [
    { id: 'all', name: 'All', icon: '🐾' },
    { id: 'park', name: 'At Parks', icon: '🌳' },
    { id: 'walking', name: 'Walking', icon: '🚶' },
    { id: 'cafe', name: 'Pet Cafes', icon: '☕' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Nearby Pet Parents
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeFilter === filter.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="mr-2">{filter.icon}</span>
            {filter.name}
          </button>
        ))}
      </div>

      {/* Map Preview */}
      <div className="bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <div className="relative">
          <div className="text-6xl mb-3">🗺️</div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Map View</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">See pet parents in real-time</p>
        </div>
      </div>

      {/* Nearby List */}
      <div className="space-y-3">
        {nearbyUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0)}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">
                      {user.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.pet}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {user.distance}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      away
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                    {user.activity}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    📍 {user.location}
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                    Say Hi 👋
                  </button>
                  <button className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors">
                    Plan Meetup
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Meetup Button */}
      <button className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-blue-600 transition-all">
        + Create Group Meetup
      </button>
    </div>
  );
}

NearbyPetParents.propTypes = {
  userLocation: PropTypes.object,
};

export default NearbyPetParents;
