import { useState } from 'react';
import PropTypes from 'prop-types';

function CareInstructions({ pet }) {
  const [selectedTab, setSelectedTab] = useState('daily');

  const careData = {
    daily: {
      feeding: [
        { time: '7:00 AM', meal: 'Breakfast', amount: '1 cup dry food', notes: 'With medication' },
        { time: '6:00 PM', meal: 'Dinner', amount: '1 cup dry food', notes: 'Add supplement' },
      ],
      walking: [
        { time: '8:00 AM', duration: '30 min', location: 'Neighborhood', notes: 'Morning walk' },
        { time: '12:00 PM', duration: '15 min', location: 'Quick potty', notes: 'Short break' },
        { time: '7:00 PM', duration: '45 min', location: 'Park', notes: 'Evening exercise' },
      ],
      medication: [
        { time: '7:00 AM', name: 'Allergy medication', dosage: '1 pill', withFood: true },
      ],
    },
    emergency: {
      vet: { name: 'City Veterinary Clinic', phone: '(555) 123-4567', address: '123 Main St' },
      emergency: { name: '24/7 Emergency Animal Hospital', phone: '(555) 987-6543', address: '456 Oak Ave' },
      allergies: ['Chicken', 'Peanuts'],
      conditions: ['Seasonal allergies'],
    },
    preferences: {
      behavior: 'Friendly with other dogs, shy with strangers',
      commands: ['Sit', 'Stay', 'Come', 'Down'],
      favoriteActivities: ['Fetch', 'Swimming', 'Tug-of-war'],
      fears: ['Thunderstorms', 'Fireworks'],
      specialNeeds: 'Needs to be on leash at all times',
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Care Instructions
        </h3>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
          Share with Sitter
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'daily', name: 'Daily Routine', icon: '📅' },
          { id: 'emergency', name: 'Emergency', icon: '🚨' },
          { id: 'preferences', name: 'Preferences', icon: '⚙️' },
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

      {/* Daily Routine */}
      {selectedTab === 'daily' && (
        <div className="space-y-6">
          {/* Feeding Schedule */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              🍖 Feeding Schedule
            </h4>
            <div className="space-y-3">
              {careData.daily.feeding.map((feed, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl">⏰</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{feed.time}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{feed.meal}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{feed.amount}</p>
                    {feed.notes && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">💡 {feed.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Walking Schedule */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              🚶 Walking Schedule
            </h4>
            <div className="space-y-3">
              {careData.daily.walking.map((walk, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl">🦮</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{walk.time}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{walk.duration}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">📍 {walk.location}</p>
                    {walk.notes && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">💡 {walk.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medication */}
          {careData.daily.medication.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                💊 Medication
              </h4>
              <div className="space-y-3">
                {careData.daily.medication.map((med, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="text-2xl">💊</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{med.time}</span>
                        <span className="text-sm text-red-600 dark:text-red-400">{med.dosage}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{med.name}</p>
                      {med.withFood && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ Give with food</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Emergency */}
      {selectedTab === 'emergency' && (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border-2 border-red-500">
            <h4 className="font-bold text-lg text-red-700 dark:text-red-400 mb-3">🚨 Emergency Contacts</h4>
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div className="font-semibold text-gray-800 dark:text-gray-100">{careData.emergency.vet.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  📞 {careData.emergency.vet.phone}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  📍 {careData.emergency.vet.address}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div className="font-semibold text-gray-800 dark:text-gray-100">{careData.emergency.emergency.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  📞 {careData.emergency.emergency.phone}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  📍 {careData.emergency.emergency.address}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">⚠️ Allergies & Conditions</h4>
            <div className="space-y-2">
              <div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Allergies:</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {careData.emergency.allergies.map((allergy, index) => (
                    <span key={index} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Medical Conditions:</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {careData.emergency.conditions.map((condition, index) => (
                    <span key={index} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences */}
      {selectedTab === 'preferences' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">🐕 Behavior</h4>
            <p className="text-gray-700 dark:text-gray-300">{careData.preferences.behavior}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">🎓 Known Commands</h4>
            <div className="flex flex-wrap gap-2">
              {careData.preferences.commands.map((command, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                  {command}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">❤️ Favorite Activities</h4>
            <div className="flex flex-wrap gap-2">
              {careData.preferences.favoriteActivities.map((activity, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                  {activity}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">😰 Fears & Triggers</h4>
            <div className="flex flex-wrap gap-2">
              {careData.preferences.fears.map((fear, index) => (
                <span key={index} className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm">
                  {fear}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3">⚠️ Special Needs</h4>
            <p className="text-gray-700 dark:text-gray-300">{careData.preferences.specialNeeds}</p>
          </div>
        </div>
      )}

      {/* Share Options */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4">
        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Share Care Instructions</h4>
        <div className="grid grid-cols-2 gap-3">
          <button className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all text-sm font-medium text-gray-700 dark:text-gray-300">
            📧 Email
          </button>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all text-sm font-medium text-gray-700 dark:text-gray-300">
            💬 SMS
          </button>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all text-sm font-medium text-gray-700 dark:text-gray-300">
            🔗 Copy Link
          </button>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all text-sm font-medium text-gray-700 dark:text-gray-300">
            📄 Print PDF
          </button>
        </div>
      </div>
    </div>
  );
}

CareInstructions.propTypes = {
  pet: PropTypes.object.isRequired,
};

export default CareInstructions;
