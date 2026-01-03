// Pet Owner Profile and Social Data Management
import { generateMockPet } from './petData';

// Generate mock pet owner data
export const generateMockPetOwner = (name) => {
  return {
    id: Date.now() + Math.random(),
    username: name,
    friendCode: generateFriendCode(),
    joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    pets: [generateMockPet()],
    stats: {
      totalWalks: Math.floor(Math.random() * 1000) + 50,
      totalDistance: (Math.random() * 500 + 50).toFixed(1),
      vetVisits: Math.floor(Math.random() * 30) + 5,
      activitiesLogged: Math.floor(Math.random() * 500) + 100,
      photosShared: Math.floor(Math.random() * 200) + 20,
      locationsVisited: Math.floor(Math.random() * 50) + 5,
      friendsConnected: Math.floor(Math.random() * 100) + 10,
      currentStreak: Math.floor(Math.random() * 30) + 1,
    },
    badges: generateBadges(),
    location: getRandomCity(),
    bio: generateBio(),
    avatarColor: getRandomColor(),
    preferences: {
      shareActivities: true,
      allowFriendRequests: true,
      showLocation: true,
    }
  };
};

export const generateFriendCode = () => {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += ' ';
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
};

export const getRandomColor = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getRandomCity = () => {
  const cities = [
    'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA',
    'Portland, OR', 'Denver, CO', 'Boston, MA', 'Chicago, IL',
    'Los Angeles, CA', 'Miami, FL'
  ];
  return cities[Math.floor(Math.random() * cities.length)];
};

const generateBio = () => {
  const bios = [
    'Dog mom/dad 🐾',
    'Living my best life with my fur baby',
    'Adventure seeker with my four-legged friend',
    'Proud pet parent',
    'Dogs are my therapy',
    'Rescue advocate 🐕',
    'Obsessed with my pup',
    'Life is better with pets',
  ];
  return bios[Math.floor(Math.random() * bios.length)];
};

export const generateBadges = () => {
  const allBadges = [
    { id: 'walker', name: 'Walker', icon: '🏃', level: 'Gold', description: 'Walk 1000 miles' },
    { id: 'health-nut', name: 'Health Nut', icon: '🏥', level: 'Silver', description: 'Complete 20 vet visits' },
    { id: 'social', name: 'Social Butterfly', icon: '🦋', level: 'Gold', description: 'Make 50 friends' },
    { id: 'photographer', name: 'Photographer', icon: '📸', level: 'Bronze', description: 'Share 100 photos' },
    { id: 'explorer', name: 'Explorer', icon: '🗺️', level: 'Silver', description: 'Visit 30 locations' },
    { id: 'dedicated', name: 'Dedicated Parent', icon: '❤️', level: 'Platinum', description: '365-day streak' },
    { id: 'trainer', name: 'Trainer', icon: '🎓', level: 'Gold', description: '100 training sessions' },
    { id: 'community', name: 'Community Leader', icon: '👑', level: 'Silver', description: 'Lead 5 groups' },
  ];

  const numBadges = Math.floor(Math.random() * 5) + 2;
  return allBadges.slice(0, numBadges);
};

// Generate mock friends
export const generateMockFriends = (count = 10) => {
  const names = [
    'EmmaAndMax', 'JohnDogLover', 'SarahPaws', 'MikePetParent', 'LisaDogMom',
    'DavidAndBuddy', 'JennyPupLove', 'KevinWalker', 'RachelRescue', 'TomParkFan',
    'AmyPetLife', 'ChrisPawsome', 'NicoleFurBaby', 'JasonAdventure', 'LauraPupLife',
    'BrianTrailDog', 'MeganBeachPup', 'SteveActivePet', 'KatieDoggyDays', 'MarkPupJoy'
  ];

  const friends = [];
  for (let i = 0; i < Math.min(count, names.length); i++) {
    friends.push({
      ...generateMockPetOwner(names[i]),
      friendshipLevel: Math.floor(Math.random() * 4) + 1, // 1-4 (New, Good, Close, Best)
      daysUntilNextLevel: Math.floor(Math.random() * 30),
      lastInteraction: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      playdateAvailable: Math.random() > 0.5,
    });
  }

  return friends;
};

// Generate activity feed
export const generateActivityFeed = (friends, count = 20) => {
  const activities = [];
  const activityTemplates = [
    { type: 'walk', emoji: '🚶', getText: (f, p) => `${f.username} walked ${p?.distance} miles with ${p?.petName}!` },
    { type: 'photo', emoji: '📸', getText: (f, p) => `${f.username} shared a cute photo of ${p?.petName}!` },
    { type: 'vet', emoji: '🏥', getText: (f, p) => `${f.username} took ${p?.petName} to the vet for a checkup!` },
    { type: 'park', emoji: '🌳', getText: (f, p) => `${f.username} visited ${p?.location} with ${p?.petName}!` },
    { type: 'milestone', emoji: '🎉', getText: (f, p) => `${f.username}'s ${p?.petName} celebrated ${p?.milestone}!` },
    { type: 'achievement', emoji: '🏆', getText: (f, p) => `${f.username} earned the "${p?.badge}" badge!` },
    { type: 'streak', emoji: '🔥', getText: (f, p) => `${f.username} reached a ${p?.days}-day streak!` },
  ];

  for (let i = 0; i < count; i++) {
    const friend = friends[Math.floor(Math.random() * friends.length)];
    const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];

    const petName = friend.pets?.[0]?.name || 'Max';
    const locations = ['Central Dog Park', 'Riverside Trail', 'Beach Walk', 'Mountain Path'];
    const milestones = ['1st birthday', '2nd birthday', 'adoption day', 'gotcha day'];
    const badges = ['Walker', 'Social Butterfly', 'Health Nut', 'Explorer'];

    const extraData = {
      petName,
      distance: (Math.random() * 3 + 0.5).toFixed(1),
      location: locations[Math.floor(Math.random() * locations.length)],
      milestone: milestones[Math.floor(Math.random() * milestones.length)],
      badge: badges[Math.floor(Math.random() * badges.length)],
      days: Math.floor(Math.random() * 100) + 10,
    };

    activities.push({
      id: Date.now() + i,
      friend: friend,
      type: template.type,
      emoji: template.emoji,
      text: template.getText(friend, extraData),
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      likes: Math.floor(Math.random() * 30),
      comments: Math.floor(Math.random() * 8),
    });
  }

  return activities.sort((a, b) => b.timestamp - a.timestamp);
};

// Friendship levels
export const friendshipLevels = {
  1: { name: 'New Friend', color: '#3498db', perks: 'See basic activities', daysRequired: 1 },
  2: { name: 'Good Friend', color: '#9b59b6', perks: 'Schedule playdates', daysRequired: 7 },
  3: { name: 'Close Friend', color: '#e67e22', perks: 'Share health data', daysRequired: 30 },
  4: { name: 'Best Friend', color: '#e74c3c', perks: 'Full profile access', daysRequired: 90 },
};

// Calculate time ago
export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  for (const [name, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value);
    if (interval >= 1) {
      return interval === 1 ? `1 ${name} ago` : `${interval} ${name}s ago`;
    }
  }

  return 'just now';
};

// Format date
export const formatDate = (date) => {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
};
