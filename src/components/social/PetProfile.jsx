import { motion } from 'framer-motion';
import { formatPetAge, calculateHealthScore } from '../../utils/petData';
import { formatDate } from '../../utils/socialData';
import PropTypes from 'prop-types';

function PetProfile({ pet }) {
  const healthScore = calculateHealthScore(pet);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white"
      >
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-6xl">
            🐾
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-bold">{pet.name}</h3>
            <p className="text-purple-100 mt-1">{pet.breed} • {formatPetAge(pet.birthday)}</p>
            <div className="flex gap-4 mt-3 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                {pet.type === 'dog' ? '🐕' : '🐱'} {pet.type}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                {pet.gender === 'male' ? '♂️' : '♀️'} {pet.gender}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                ⚖️ {pet.weight} lbs
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Walks', value: pet.stats.totalWalks, icon: '🚶' },
          { label: 'Distance', value: `${pet.stats.totalDistance} mi`, icon: '📏' },
          { label: 'Parks', value: pet.stats.parksVisited, icon: '🌳' },
          { label: 'Photos', value: pet.stats.photosShared, icon: '📸' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-md"
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Health Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md"
      >
        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Health Overview
        </h4>

        {/* Health Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Health Score
            </span>
            <span className={`font-bold ${
              healthScore >= 80 ? 'text-green-600' : healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {healthScore}/100
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                healthScore >= 80 ? 'bg-green-500' : healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* Vaccinations */}
        <div className="mb-4">
          <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Vaccinations
          </h5>
          <div className="space-y-2">
            {pet.health.vaccinations.map((vac, index) => {
              const isOverdue = new Date(vac.nextDue) < new Date();
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-100">
                      {vac.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Next due: {formatDate(vac.nextDue)}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isOverdue
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {isOverdue ? 'Overdue' : 'Current'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vet Visits */}
        <div>
          <h5 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Veterinary Care
          </h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-gray-600 dark:text-gray-400">Last Visit</div>
              <div className="font-medium text-gray-800 dark:text-gray-100">
                {formatDate(pet.health.lastVetVisit)}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-gray-600 dark:text-gray-400">Next Visit</div>
              <div className="font-medium text-gray-800 dark:text-gray-100">
                {formatDate(pet.health.nextVetVisit)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md"
      >
        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Preferences
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎾</span>
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-100">
                Favorite Toy
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {pet.preferences.favoriteToys}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍖</span>
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-100">
                Favorite Food
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {pet.preferences.favoriteFood}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-100">
                Energy Level
              </div>
              <div className="text-gray-600 dark:text-gray-400 capitalize">
                {pet.preferences.energyLevel.replace('-', ' ')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎨</span>
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-100">
                Color
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {pet.color}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

PetProfile.propTypes = {
  pet: PropTypes.object.isRequired,
};

export default PetProfile;
