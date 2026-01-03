import { motion } from 'framer-motion';
import { useState } from 'react';

function VetTelemedicine() {
  const [consultationType, setConsultationType] = useState('chat');

  // Available veterinary professionals
  const availableVets = [
    {
      id: 1,
      name: 'Dr. Jennifer Park',
      title: 'Emergency Veterinarian',
      specialty: 'Emergency & Critical Care',
      available: true,
      rating: 4.9,
      responseTime: '< 2 min',
      avatar: '👩‍⚕️',
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      title: 'Veterinary Surgeon',
      specialty: 'Surgery & Orthopedics',
      available: true,
      rating: 4.8,
      responseTime: '< 5 min',
      avatar: '👨‍⚕️',
    },
    {
      id: 3,
      name: 'Nurse Sarah Williams',
      title: 'Veterinary Nurse Practitioner',
      specialty: 'General Health & Wellness',
      available: true,
      rating: 5.0,
      responseTime: '< 1 min',
      avatar: '👩‍⚕️',
    },
  ];

  // Common concerns quick access
  const quickConcerns = [
    { icon: '🤢', label: 'Vomiting', urgent: true },
    { icon: '🦴', label: 'Limping', urgent: false },
    { icon: '🔥', label: 'Fever', urgent: true },
    { icon: '😰', label: 'Anxiety', urgent: false },
    { icon: '🦷', label: 'Dental', urgent: false },
    { icon: '🩹', label: 'Wound', urgent: true },
    { icon: '💊', label: 'Medication', urgent: false },
    { icon: '🍽️', label: 'Diet', urgent: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            24/7 Veterinary Care
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Licensed professionals available anytime
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            {availableVets.filter(v => v.available).length} vets online
          </span>
        </div>
      </div>

      {/* Emergency Banner */}
      <div className="bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-4 border-2 border-red-400 dark:border-red-600">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🚨</span>
          <div className="flex-1">
            <h4 className="font-bold text-red-800 dark:text-red-300">Emergency? Get help now</h4>
            <p className="text-sm text-red-700 dark:text-red-400">
              Connect with emergency vet in under 60 seconds
            </p>
          </div>
          <button className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold">
            Emergency Chat
          </button>
        </div>
      </div>

      {/* Consultation Type Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          Choose Consultation Type
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setConsultationType('chat')}
            className={`p-6 rounded-xl transition-all ${
              consultationType === 'chat'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-4xl mb-2">💬</div>
            <div className="font-semibold">Chat</div>
            <div className="text-sm mt-1 opacity-80">Text-based</div>
          </button>

          <button
            onClick={() => setConsultationType('video')}
            className={`p-6 rounded-xl transition-all ${
              consultationType === 'video'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-4xl mb-2">📹</div>
            <div className="font-semibold">Video Call</div>
            <div className="text-sm mt-1 opacity-80">Face-to-face</div>
          </button>

          <button
            onClick={() => setConsultationType('phone')}
            className={`p-6 rounded-xl transition-all ${
              consultationType === 'phone'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-4xl mb-2">📞</div>
            <div className="font-semibold">Phone</div>
            <div className="text-sm mt-1 opacity-80">Voice only</div>
          </button>
        </div>
      </div>

      {/* Quick Concerns */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          Quick Concerns
        </h4>
        <div className="grid grid-cols-4 gap-3">
          {quickConcerns.map((concern, index) => (
            <button
              key={index}
              className={`p-4 rounded-xl transition-all hover:shadow-md ${
                concern.urgent
                  ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700'
                  : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div className="text-3xl mb-2">{concern.icon}</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {concern.label}
              </div>
              {concern.urgent && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">Urgent</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Available Vets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          Available Now
        </h4>
        <div className="space-y-4">
          {availableVets.map((vet) => (
            <motion.div
              key={vet.id}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/10 dark:to-green-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-4">
                <div className="text-6xl">{vet.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100">{vet.name}</h5>
                    {vet.available && (
                      <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Online
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{vet.title}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{vet.specialty}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-yellow-500">★ {vet.rating}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Response: {vet.responseTime}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                    Start Chat
                  </button>
                  <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium">
                    Video Call
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6">
        <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4">
          💎 Consultation Pricing
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl mb-2">💬</div>
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">Chat Consultation</h5>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">$29</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">per consultation</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl mb-2">📹</div>
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">Video Consultation</h5>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">$59</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">per consultation</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-purple-400">
            <div className="text-2xl mb-2">♾️</div>
            <h5 className="font-semibold text-gray-800 dark:text-gray-100">Unlimited Plan</h5>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">$99</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">per month</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Best value!</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          ✨ Premium Features
        </h4>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-green-500 text-xl">✓</span>
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-100">24/7 Availability</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Licensed vets available anytime, day or night</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 text-xl">✓</span>
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-100">Health Records Integration</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Vets have access to your pet's complete history</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 text-xl">✓</span>
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-100">Prescription Service</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Get prescriptions sent directly to your pharmacy</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 text-xl">✓</span>
            <div>
              <div className="font-semibold text-gray-800 dark:text-gray-100">Follow-up Care</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Free follow-ups within 48 hours</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default VetTelemedicine;
