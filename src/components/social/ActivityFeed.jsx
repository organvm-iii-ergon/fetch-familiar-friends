import { motion } from 'framer-motion';
import { timeAgo } from '../../utils/socialData';
import PropTypes from 'prop-types';

function ActivityFeed({ activities }) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Recent Activity
      </h3>

      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
              style={{ backgroundColor: activity.friend.avatarColor }}
            >
              {activity.friend.username.charAt(0).toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">{activity.friend.username}</span>
                    {' '}{activity.text}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {timeAgo(activity.timestamp)}
                  </p>
                </div>
                <span className="text-2xl">{activity.emoji}</span>
              </div>

              {/* Engagement */}
              <div className="flex gap-6 mt-3 text-sm text-gray-600 dark:text-gray-400">
                <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                  ❤️ <span>{activity.likes}</span>
                </button>
                <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                  💬 <span>{activity.comments}</span>
                </button>
                <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                  🔄 Share
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      {activities.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-4xl mb-3">🐾</p>
          <p>No recent activities. Connect with friends to see their updates!</p>
        </div>
      )}
    </div>
  );
}

ActivityFeed.propTypes = {
  activities: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default ActivityFeed;
