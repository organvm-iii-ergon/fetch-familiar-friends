import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

const SocialHub = ({ isOpen, onClose }) => {
  const [currentTab, setCurrentTab] = useState('feed');

  const tabs = [
    { id: 'feed', label: 'Feed', icon: '📰' },
    { id: 'quests', label: 'Quests', icon: '🎯' },
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'nearby', label: 'Nearby', icon: '📍' },
    { id: 'coaching', label: 'Coaching', icon: '🏆' },
    { id: 'health', label: 'Health', icon: '🏥' },
    { id: 'care', label: 'Care', icon: '📋' },
    { id: 'ar', label: 'AR', icon: '📸' },
    { id: 'companion', label: 'Pet', icon: '🐾' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'memorial', label: 'Memorial', icon: '🕊️' },
    { id: 'premium', label: 'Premium', icon: '⭐' }
  ];

  const renderContent = () => {
    switch (currentTab) {
      case 'feed':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Activity Feed</h3>
            <div className="space-y-3">
              {[
                { user: 'Max & Buddy', activity: 'completed a walk quest', time: '2 hours ago', icon: '🚶' },
                { user: 'Luna', activity: 'earned a treat badge', time: '5 hours ago', icon: '🏅' },
                { user: 'Charlie', activity: 'shared a photo', time: '1 day ago', icon: '📸' },
                { user: 'Bella', activity: 'reached 100 walks milestone', time: '2 days ago', icon: '🎉' }
              ].map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{item.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        <span className="text-blue-600">{item.user}</span> {item.activity}
                      </p>
                      <p className="text-sm text-gray-500">{item.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">End of feed • Check back later for more!</p>
            </div>
          </div>
        );

      case 'quests':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Quests & Achievements</h3>
            <div className="grid gap-4">
              {[
                { title: 'Daily Walker', desc: 'Take your dog for a walk', progress: 1, total: 1, xp: 50, icon: '🚶' },
                { title: 'Photo Enthusiast', desc: 'Take 5 photos of your pet', progress: 3, total: 5, xp: 75, icon: '📷' },
                { title: 'Social Butterfly', desc: 'Connect with 3 friends', progress: 1, total: 3, xp: 100, icon: '🦋' },
                { title: 'Treat Master', desc: 'Give your dog 10 treats this week', progress: 7, total: 10, xp: 200, icon: '🦴' }
              ].map((quest, index) => (
                <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{quest.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{quest.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{quest.desc}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {quest.progress}/{quest.total}
                        </span>
                      </div>
                      <p className="text-xs text-purple-600 mt-1">+{quest.xp} XP</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'friends':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Friends List</h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search friends..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-3">
              {[
                { name: 'Max', breed: 'Golden Retriever', status: 'online', level: 24 },
                { name: 'Luna', breed: 'Husky', status: 'offline', level: 18 },
                { name: 'Charlie', breed: 'Beagle', status: 'online', level: 31 },
                { name: 'Bella', breed: 'Labrador', status: 'away', level: 27 }
              ].map((friend, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg flex items-center gap-4 hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                    🐕
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800">{friend.name}</h4>
                      <span className={`w-2 h-2 rounded-full ${
                        friend.status === 'online' ? 'bg-green-500' : 
                        friend.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <p className="text-sm text-gray-600">{friend.breed} • Level {friend.level}</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                    Message
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'nearby':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Nearby Dog Owners</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                📍 Enable location services to find dog owners and pet-friendly places near you!
              </p>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Rocky & Owner', distance: '0.3 miles', activity: 'At Central Park', icon: '🌳' },
                { name: 'Daisy & Owner', distance: '0.5 miles', activity: 'Walking nearby', icon: '🚶' },
                { name: 'Duke & Owner', distance: '0.8 miles', activity: 'At Dog Park', icon: '🎾' },
                { name: 'Molly & Owner', distance: '1.2 miles', activity: 'At Pet Store', icon: '🏪' }
              ].map((nearby, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{nearby.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{nearby.name}</h4>
                      <p className="text-sm text-gray-600">{nearby.activity}</p>
                      <p className="text-xs text-blue-600 mt-1">{nearby.distance} away</p>
                    </div>
                    <button className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'coaching':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Professional Dog Coaching</h3>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-4xl">🏆</span>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Expert Training Programs</h4>
                  <p className="text-sm text-gray-600">
                    Connect with certified dog trainers for personalized coaching sessions
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              {[
                { name: 'Sarah Johnson', specialty: 'Puppy Training', rating: 4.9, sessions: 230, price: '$50/hr' },
                { name: 'Mike Chen', specialty: 'Behavior Modification', rating: 4.8, sessions: 180, price: '$60/hr' },
                { name: 'Emma Williams', specialty: 'Agility Training', rating: 5.0, sessions: 150, price: '$55/hr' }
              ].map((coach, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-3xl">
                      👨‍🏫
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{coach.name}</h4>
                      <p className="text-sm text-gray-600">{coach.specialty}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-medium">{coach.rating}</span>
                        <span className="text-sm text-gray-500">({coach.sessions} sessions)</span>
                      </div>
                      <p className="text-sm font-semibold text-green-600 mt-1">{coach.price}</p>
                    </div>
                    <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm">
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'health':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Telemedicine & Health</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-4xl">🏥</span>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">24/7 Vet Consultations</h4>
                  <p className="text-sm text-gray-600">
                    Connect with licensed veterinarians via video call anytime
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Quick Consultation</h4>
                <button className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-medium">
                  📞 Start Video Call with Vet
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Health Records</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Last Checkup</span>
                    <span className="text-sm font-medium">3 weeks ago</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Next Vaccination</span>
                    <span className="text-sm font-medium text-orange-600">In 2 weeks</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Weight</span>
                    <span className="text-sm font-medium">45 lbs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'care':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Care Instructions</h3>
            <div className="space-y-4">
              {[
                {
                  title: 'Daily Care Routine',
                  icon: '📋',
                  items: ['Morning walk (30 min)', 'Breakfast feeding', 'Playtime (15 min)', 'Evening walk (30 min)', 'Dinner feeding']
                },
                {
                  title: 'Grooming Schedule',
                  icon: '✂️',
                  items: ['Brush coat daily', 'Bath every 2 weeks', 'Nail trim monthly', 'Teeth cleaning weekly', 'Ear check weekly']
                },
                {
                  title: 'Health Monitoring',
                  icon: '💊',
                  items: ['Check for ticks/fleas', 'Monitor eating habits', 'Watch energy levels', 'Note any changes', 'Regular vet visits']
                }
              ].map((section, index) => (
                <div key={index} className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{section.icon}</span>
                    <h4 className="font-semibold text-gray-800">{section.title}</h4>
                  </div>
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-green-500">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 'ar':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">AR Camera Experience</h3>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">📸</div>
              <h4 className="font-semibold text-gray-800 mb-2">Augmented Reality Camera</h4>
              <p className="text-sm text-gray-600 mb-4">
                Take photos with fun AR filters, virtual accessories, and interactive elements!
              </p>
              <button className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors font-medium">
                Open AR Camera
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Party Hat', emoji: '🎩' },
                { name: 'Sunglasses', emoji: '🕶️' },
                { name: 'Crown', emoji: '👑' },
                { name: 'Bow Tie', emoji: '🎀' }
              ].map((filter, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-4xl mb-2">{filter.emoji}</div>
                  <p className="text-sm font-medium text-gray-700">{filter.name}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'companion':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Virtual Pet Companion</h3>
            <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-6 text-center">
              <div className="text-8xl mb-4 animate-bounce">🐕</div>
              <h4 className="font-bold text-2xl text-gray-800 mb-2">Buddy</h4>
              <p className="text-sm text-gray-600 mb-4">Your virtual companion</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="text-2xl mb-1">❤️</div>
                  <div className="text-xs font-medium text-gray-700">Happiness</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="text-2xl mb-1">🍖</div>
                  <div className="text-xs font-medium text-gray-700">Hunger</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="text-2xl mb-1">⚡</div>
                  <div className="text-xs font-medium text-gray-700">Energy</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <button className="bg-white px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                  🎾 Play
                </button>
                <button className="bg-white px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                  🦴 Feed
                </button>
                <button className="bg-white px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                  💤 Rest
                </button>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Pet Profile</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-5xl">
                  🐕
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-800">Max</h4>
                  <p className="text-gray-600">Golden Retriever • 3 years old</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Level 24</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Weight</span>
                  <span className="text-sm font-medium">65 lbs</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Birthday</span>
                  <span className="text-sm font-medium">March 15</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Microchip ID</span>
                  <span className="text-sm font-medium">123456789</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Vet</span>
                  <span className="text-sm font-medium">Dr. Smith Animal Clinic</span>
                </div>
              </div>
              <button className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        );

      case 'memorial':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Memorial Services</h3>
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">🕊️</div>
              <h4 className="font-semibold text-gray-800 mb-2">In Loving Memory</h4>
              <p className="text-sm text-gray-600 mb-4">
                Honor and remember your beloved companions with a beautiful digital memorial
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Memorial Features</h4>
                <ul className="space-y-2">
                  {[
                    'Create photo galleries and tributes',
                    'Share memories with friends and family',
                    'Light virtual candles',
                    'Plant a tree in their memory',
                    'Preserve their story forever'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-blue-500">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <button className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium">
                Create Memorial
              </button>
            </div>
          </div>
        );

      case 'premium':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Premium Subscription Tiers</h3>
            <div className="grid gap-4">
              {[
                {
                  name: 'Basic',
                  price: 'Free',
                  color: 'from-gray-400 to-gray-500',
                  features: ['Daily dog images', 'Basic journal', 'Up to 10 favorites', 'Limited themes']
                },
                {
                  name: 'Pro',
                  price: '$4.99/mo',
                  color: 'from-blue-400 to-blue-600',
                  features: ['Everything in Basic', 'Unlimited favorites', 'All themes', 'Priority support', 'Advanced statistics', 'Social features']
                },
                {
                  name: 'Premium',
                  price: '$9.99/mo',
                  color: 'from-purple-400 to-pink-600',
                  features: ['Everything in Pro', 'AR camera access', 'Virtual companion', 'Professional coaching (1 session/mo)', 'Telemedicine access', 'Ad-free experience', 'Custom themes']
                }
              ].map((tier, index) => (
                <div key={index} className={`bg-gradient-to-r ${tier.color} rounded-lg p-6 text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-2xl font-bold">{tier.name}</h4>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{tier.price}</div>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full bg-white text-gray-900 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                    {index === 0 ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Social Hub" size="2xl">
      <div className="space-y-4">
        {/* Tab navigation */}
        <div className="flex gap-2 flex-wrap pb-4 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                currentTab === tab.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={tab.label}
            >
              <span>{tab.icon}</span>
              <span className="ml-1 hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[400px]">
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
};

SocialHub.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default SocialHub;
