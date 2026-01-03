import { motion } from 'framer-motion';
import { friendshipLevels, timeAgo } from '../../utils/socialData';
import PropTypes from 'prop-types';

function FriendsList({ friends }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Friends ({friends.length})
        </h3>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          + Add Friend
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {friends.map((friend, index) => {
          const friendLevel = friendshipLevels[friend.friendshipLevel];

          return (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
                  style={{ backgroundColor: friend.avatarColor }}
                >
                  {friend.username.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                        {friend.username}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {friend.location}
                      </p>
                    </div>
                  </div>

                  {/* Pet Info */}
                  {friend.pets && friend.pets.length > 0 && (
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      🐾 {friend.pets[0].name} ({friend.pets[0].breed})
                    </div>
                  )}

                  {/* Friendship Level */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span
                        className="font-semibold"
                        style={{ color: friendLevel.color }}
                      >
                        {friendLevel.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {friend.daysUntilNextLevel} days to next level
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          backgroundColor: friendLevel.color,
                          width: `${(friend.friendshipLevel / 4) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Last Interaction */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Last activity: {timeAgo(friend.lastInteraction)}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                      View Profile
                    </button>
                    {friend.playdateAvailable && (
                      <button className="px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
                        🗓️ Playdate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {friends.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p>No friends yet. Start connecting with other pet parents!</p>
        </div>
      )}
    </div>
  );
}

FriendsList.propTypes = {
  friends: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default FriendsList;
