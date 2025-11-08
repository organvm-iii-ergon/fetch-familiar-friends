import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import ActivityFeed from './ActivityFeed';
import FriendsList from './FriendsList';
import PetProfile from './PetProfile';
import { generateMockFriends, generateActivityFeed } from '../../utils/socialData';
import { generateMockPet } from '../../utils/petData';

function SocialHub({ onClose }) {
  const [activeTab, setActiveTab] = useState('feed');
  const [friends, setFriends] = useState([]);
  const [activities, setActivities] = useState([]);
  const [userPet, setUserPet] = useState(null);

  useEffect(() => {
    // Initialize mock data
    const mockFriends = generateMockFriends(15);
    setFriends(mockFriends);
    setActivities(generateActivityFeed(mockFriends, 30));
    setUserPet(generateMockPet('Max', 'Golden Retriever', 3));
  }, []);

  const tabs = [
    { id: 'feed', name: 'Activity Feed', icon: '📰' },
    { id: 'friends', name: 'Friends', icon: '👥' },
    { id: 'profile', name: 'My Pet', icon: '🐾' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Pet Social Hub</h2>
              <p className="text-blue-100 mt-1">Connect with fellow pet parents</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {activeTab === 'feed' && <ActivityFeed activities={activities} />}
          {activeTab === 'friends' && <FriendsList friends={friends} />}
          {activeTab === 'profile' && userPet && <PetProfile pet={userPet} />}
        </div>
      </motion.div>
    </div>
  );
}

SocialHub.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default SocialHub;
