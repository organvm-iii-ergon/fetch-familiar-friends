import { motion } from 'framer-motion';

function CoachingHub() {

  // Featured monthly coaches
  const featuredCoaches = [
    {
      id: 1,
      name: 'Dr. Sarah Martinez',
      specialty: 'Behavioral Training',
      title: 'Certified Dog Behaviorist',
      rating: 4.9,
      reviews: 1247,
      price: '$89/session',
      featured: true,
      avatar: '👩‍⚕️',
      bio: '15+ years experience in positive reinforcement training',
      specialties: ['Aggression', 'Anxiety', 'Obedience'],
      availability: 'Mon-Fri 9am-5pm',
    },
    {
      id: 2,
      name: 'Mike Thompson',
      specialty: 'Agility & Athletics',
      title: 'Professional Agility Trainer',
      rating: 4.8,
      reviews: 892,
      price: '$75/session',
      featured: true,
      avatar: '🏃‍♂️',
      bio: 'Championship agility coach, competed nationally',
      specialties: ['Agility', 'Competition Prep', 'Fitness'],
      availability: 'Weekends & evenings',
    },
    {
      id: 3,
      name: 'Emily Chen',
      specialty: 'Puppy Development',
      title: 'Puppy Socialization Expert',
      rating: 5.0,
      reviews: 634,
      price: '$65/session',
      featured: false,
      avatar: '👶',
      bio: 'Specializing in critical socialization periods',
      specialties: ['Puppies', 'Socialization', 'Basic Training'],
      availability: 'Flexible schedule',
    },
  ];

  // Group classes
  const groupClasses = [
    { name: 'Basic Obedience', level: 'Beginner', time: 'Sat 10am', spots: 3, price: '$199/month' },
    { name: 'Advanced Tricks', level: 'Advanced', time: 'Sun 2pm', spots: 5, price: '$249/month' },
    { name: 'Agility Fundamentals', level: 'Intermediate', time: 'Wed 6pm', spots: 2, price: '$299/month' },
    { name: 'Puppy Kindergarten', level: 'Puppy', time: 'Tue 11am', spots: 4, price: '$179/month' },
  ];

  // Virtual gym challenges (location-based)
  const gymChallenges = [
    {
      id: 1,
      name: 'Central Park Agility Trial',
      location: 'Central Park, NYC',
      distance: '0.8 mi away',
      difficulty: 'Medium',
      reward: '250 XP + Agility Badge',
      participants: 12,
      timeLimit: '30 minutes',
    },
    {
      id: 2,
      name: 'Beach Sprint Challenge',
      location: 'Santa Monica Beach',
      distance: '2.3 mi away',
      difficulty: 'Easy',
      reward: '150 XP + Beach Badge',
      participants: 24,
      timeLimit: '15 minutes',
    },
    {
      id: 3,
      name: 'Mountain Trail Endurance',
      location: 'Griffith Park Trails',
      distance: '5.1 mi away',
      difficulty: 'Hard',
      reward: '500 XP + Mountain Badge',
      participants: 8,
      timeLimit: '60 minutes',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Coaching & Training
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Professional coaches and location-based challenges
          </p>
        </div>
      </div>

      {/* Featured Coach of the Month */}
      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border-2 border-yellow-400 dark:border-yellow-600">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">⭐</span>
          <h4 className="font-bold text-gray-800 dark:text-gray-100">Featured Coach of the Month</h4>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="text-6xl">{featuredCoaches[0].avatar}</div>
            <div className="flex-1">
              <h5 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {featuredCoaches[0].name}
              </h5>
              <p className="text-gray-600 dark:text-gray-400">{featuredCoaches[0].title}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-yellow-500">★ {featuredCoaches[0].rating}</span>
                <span className="text-sm text-gray-500">({featuredCoaches[0].reviews} reviews)</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">
                {featuredCoaches[0].bio}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {featuredCoaches[0].specialties.map((spec, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    {spec}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                  Book Session - {featuredCoaches[0].price}
                </button>
                <button className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Coaches */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          Expert Coaches
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredCoaches.slice(1).map((coach) => (
            <div key={coach.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="text-4xl">{coach.avatar}</div>
                <div className="flex-1">
                  <h5 className="font-bold text-gray-800 dark:text-gray-100">{coach.name}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{coach.specialty}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-500 text-sm">★ {coach.rating}</span>
                    <span className="text-xs text-gray-500">({coach.reviews})</span>
                  </div>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-2">
                    {coach.price}
                  </p>
                  <button className="mt-3 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                    Book Session
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Group Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4">
          Group Classes
        </h4>
        <div className="space-y-3">
          {groupClasses.map((classInfo, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-800 dark:text-gray-100">{classInfo.name}</h5>
                <div className="flex gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>📅 {classInfo.time}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    classInfo.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                    classInfo.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    classInfo.level === 'Advanced' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {classInfo.level}
                  </span>
                  <span>👥 {classInfo.spots} spots left</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 dark:text-gray-100">{classInfo.price}</div>
                <button className="mt-2 px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                  Enroll
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Location-Based Gym Challenges */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🏋️</span>
          <h4 className="font-bold text-gray-800 dark:text-gray-100">Nearby Gym Challenges</h4>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Complete location-based challenges to earn XP and unlock badges
        </p>

        <div className="space-y-3">
          {gymChallenges.map((challenge) => (
            <motion.div
              key={challenge.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-bold text-gray-800 dark:text-gray-100">{challenge.name}</h5>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      challenge.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      challenge.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {challenge.difficulty}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div>📍 {challenge.location} • {challenge.distance}</div>
                    <div>⏱️ Time Limit: {challenge.timeLimit}</div>
                    <div>👥 {challenge.participants} trainers active</div>
                    <div className="text-purple-600 dark:text-purple-400 font-semibold">
                      🏆 {challenge.reward}
                    </div>
                  </div>
                </div>

                <button className="ml-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-medium whitespace-nowrap">
                  Start Challenge
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CoachingHub;
