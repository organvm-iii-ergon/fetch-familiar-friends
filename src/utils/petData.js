// Pet Data and Utilities for Social Health Hub

export const petBreeds = {
  // Dogs
  goldenRetriever: { id: 'golden', name: 'Golden Retriever', type: 'dog', size: 'large', energy: 'high' },
  labrador: { id: 'labrador', name: 'Labrador', type: 'dog', size: 'large', energy: 'high' },
  beagle: { id: 'beagle', name: 'Beagle', type: 'dog', size: 'medium', energy: 'high' },
  bulldog: { id: 'bulldog', name: 'Bulldog', type: 'dog', size: 'medium', energy: 'low' },
  poodle: { id: 'poodle', name: 'Poodle', type: 'dog', size: 'medium', energy: 'medium' },
  germanShepherd: { id: 'shepherd', name: 'German Shepherd', type: 'dog', size: 'large', energy: 'high' },
  chihuahua: { id: 'chihuahua', name: 'Chihuahua', type: 'dog', size: 'small', energy: 'medium' },
  husky: { id: 'husky', name: 'Siberian Husky', type: 'dog', size: 'large', energy: 'very-high' },
  corgi: { id: 'corgi', name: 'Corgi', type: 'dog', size: 'small', energy: 'high' },

  // Cats
  persian: { id: 'persian', name: 'Persian', type: 'cat', size: 'medium', energy: 'low' },
  siamese: { id: 'siamese', name: 'Siamese', type: 'cat', size: 'medium', energy: 'medium' },
  maineCoon: { id: 'mainecoon', name: 'Maine Coon', type: 'cat', size: 'large', energy: 'medium' },
  bengal: { id: 'bengal', name: 'Bengal', type: 'cat', size: 'medium', energy: 'high' },
};

export const activityTypes = {
  WALK: { id: 'walk', name: 'Walk', icon: '🚶', color: '#3498db' },
  VET_VISIT: { id: 'vet', name: 'Vet Visit', icon: '🏥', color: '#e74c3c' },
  GROOMING: { id: 'groom', name: 'Grooming', icon: '✂️', color: '#9b59b6' },
  PLAYTIME: { id: 'play', name: 'Playtime', icon: '🎾', color: '#f39c12' },
  FEEDING: { id: 'feed', name: 'Feeding', icon: '🍖', color: '#27ae60' },
  TRAINING: { id: 'train', name: 'Training', icon: '🎓', color: '#16a085' },
  MEDICATION: { id: 'med', name: 'Medication', icon: '💊', color: '#e67e22' },
  PARK_VISIT: { id: 'park', name: 'Park Visit', icon: '🌳', color: '#2ecc71' },
  MILESTONE: { id: 'milestone', name: 'Milestone', icon: '🎉', color: '#f1c40f' },
  PHOTO: { id: 'photo', name: 'Photo', icon: '📸', color: '#e91e63' },
};

export const achievementBadges = {
  // Distance achievements
  walker_bronze: { id: 'walk_1', name: 'First Steps', icon: '🥉', description: 'Walk 10 miles', requirement: 10 },
  walker_silver: { id: 'walk_2', name: 'Distance Walker', icon: '🥈', description: 'Walk 50 miles', requirement: 50 },
  walker_gold: { id: 'walk_3', name: 'Marathon Walker', icon: '🥇', description: 'Walk 100 miles', requirement: 100 },
  walker_platinum: { id: 'walk_4', name: 'Ultra Walker', icon: '💎', description: 'Walk 500 miles', requirement: 500 },

  // Health achievements
  health_nut: { id: 'health_1', name: 'Health Nut', icon: '🏥', description: 'Complete 10 vet visits', requirement: 10 },
  wellness_warrior: { id: 'health_2', name: 'Wellness Warrior', icon: '⚕️', description: 'Stay up-to-date on all vaccinations', requirement: 1 },

  // Social achievements
  social_butterfly: { id: 'social_1', name: 'Social Butterfly', icon: '🦋', description: 'Make 10 friends', requirement: 10 },
  community_leader: { id: 'social_2', name: 'Community Leader', icon: '👑', description: 'Join 5 communities', requirement: 5 },

  // Activity achievements
  active_pup: { id: 'active_1', name: 'Active Pup', icon: '⚡', description: 'Log 100 activities', requirement: 100 },
  dedicated_parent: { id: 'active_2', name: 'Dedicated Parent', icon: '❤️', description: 'Log activity every day for 30 days', requirement: 30 },

  // Time-based achievements
  first_year: { id: 'time_1', name: 'First Year', icon: '🎂', description: 'Celebrate 1 year with your pet', requirement: 365 },
  long_time_friend: { id: 'time_2', name: 'Long-Time Friend', icon: '🌟', description: 'Celebrate 5 years with your pet', requirement: 1825 },

  // Special achievements
  photographer: { id: 'photo_1', name: 'Photographer', icon: '📷', description: 'Share 50 photos', requirement: 50 },
  explorer: { id: 'explore_1', name: 'Explorer', icon: '🗺️', description: 'Visit 25 different locations', requirement: 25 },
  trainer: { id: 'train_1', name: 'Master Trainer', icon: '🏆', description: 'Complete 50 training sessions', requirement: 50 },
};

export const locationTypes = {
  DOG_PARK: { id: 'park', name: 'Dog Park', icon: '🌳', color: '#2ecc71' },
  VET_CLINIC: { id: 'vet', name: 'Veterinary Clinic', icon: '🏥', color: '#e74c3c' },
  PET_STORE: { id: 'store', name: 'Pet Store', icon: '🏪', color: '#3498db' },
  GROOMER: { id: 'groomer', name: 'Groomer', icon: '✂️', color: '#9b59b6' },
  BEACH: { id: 'beach', name: 'Beach', icon: '🏖️', color: '#00bcd4' },
  HIKING_TRAIL: { id: 'trail', name: 'Hiking Trail', icon: '⛰️', color: '#8bc34a' },
  CAFE: { id: 'cafe', name: 'Pet-Friendly Cafe', icon: '☕', color: '#795548' },
};

// Generate mock pet
export const generateMockPet = (name, breed, age) => {
  const breedInfo = Object.values(petBreeds)[Math.floor(Math.random() * Object.values(petBreeds).length)];

  return {
    id: Date.now() + Math.random(),
    name: name || 'Buddy',
    breed: breed || breedInfo.name,
    breedId: breedInfo.id,
    type: breedInfo.type,
    age: age || Math.floor(Math.random() * 15) + 1,
    birthday: new Date(Date.now() - (age || 2) * 365 * 24 * 60 * 60 * 1000),
    gender: Math.random() > 0.5 ? 'male' : 'female',
    weight: Math.floor(Math.random() * 60) + 10,
    color: getRandomPetColor(),
    avatarUrl: null,
    stats: {
      totalWalks: Math.floor(Math.random() * 500) + 10,
      totalDistance: (Math.random() * 500 + 10).toFixed(1),
      vetVisits: Math.floor(Math.random() * 20) + 1,
      photosShared: Math.floor(Math.random() * 100) + 5,
      parksVisited: Math.floor(Math.random() * 30) + 1,
      friendsMet: Math.floor(Math.random() * 50) + 5,
    },
    health: {
      vaccinations: generateVaccinations(),
      lastVetVisit: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
      nextVetVisit: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000),
      medications: [],
      allergies: [],
    },
    preferences: {
      favoriteToys: ['Ball', 'Rope', 'Squeaky toy'][Math.floor(Math.random() * 3)],
      favoriteFood: 'Chicken',
      energyLevel: breedInfo.energy,
    }
  };
};

const getRandomPetColor = () => {
  const colors = ['Brown', 'Black', 'White', 'Golden', 'Gray', 'Tan', 'Multi-color'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const generateVaccinations = () => {
  return [
    { name: 'Rabies', date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), nextDue: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000) },
    { name: 'DHPP', date: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000), nextDue: new Date(Date.now() + 215 * 24 * 60 * 60 * 1000) },
    { name: 'Bordetella', date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), nextDue: new Date(Date.now() + 265 * 24 * 60 * 60 * 1000) },
  ];
};

// Generate random activity
export const generateRandomActivity = (pet, type) => {
  const activityType = type || Object.values(activityTypes)[Math.floor(Math.random() * Object.values(activityTypes).length)];

  const activity = {
    id: Date.now() + Math.random(),
    petId: pet.id,
    petName: pet.name,
    type: activityType.id,
    typeName: activityType.name,
    icon: activityType.icon,
    color: activityType.color,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    location: generateRandomLocation(activityType.id),
  };

  // Add type-specific data
  if (activityType.id === 'walk') {
    activity.distance = (Math.random() * 3 + 0.5).toFixed(1);
    activity.duration = Math.floor(Math.random() * 60) + 15;
  } else if (activityType.id === 'vet') {
    activity.reason = ['Checkup', 'Vaccination', 'Grooming', 'Emergency'][Math.floor(Math.random() * 4)];
  } else if (activityType.id === 'photo') {
    activity.photoUrl = `https://placedog.net/500/500?random=${Math.random()}`;
    activity.likes = Math.floor(Math.random() * 50);
  }

  return activity;
};

// Generate random location
export const generateRandomLocation = (activityType) => {
  const locations = {
    walk: ['Riverside Park', 'Downtown', 'Beach Walk', 'Mountain Trail', 'Neighborhood'],
    park: ['Central Dog Park', 'Bark Park', 'Riverside Dog Area', 'Pet Paradise Park'],
    vet: ['City Veterinary Clinic', 'Pet Health Center', 'Animal Hospital', 'VCA Clinic'],
    store: ['PetSmart', 'Petco', 'Local Pet Shop', 'Pet Supplies Plus'],
  };

  const typeLocations = locations[activityType] || locations.walk;
  return typeLocations[Math.floor(Math.random() * typeLocations.length)];
};

// Calculate streak
export const calculateStreak = (activities) => {
  if (!activities || activities.length === 0) return 0;

  const sortedActivities = activities.sort((a, b) => b.timestamp - a.timestamp);
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const activity of sortedActivities) {
    const activityDate = new Date(activity.timestamp);
    activityDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((currentDate - activityDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === streak) {
      streak++;
    } else if (daysDiff > streak) {
      break;
    }
  }

  return streak;
};

// Format time duration
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

// Calculate age in human-readable format
export const formatPetAge = (birthday) => {
  const now = new Date();
  const birth = new Date(birthday);
  const ageInDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));

  const years = Math.floor(ageInDays / 365);
  const months = Math.floor((ageInDays % 365) / 30);

  if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''} old`;
  } else if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''} old`;
  } else {
    return `${years}y ${months}m old`;
  }
};

// Pet health score (0-100)
export const calculateHealthScore = (pet) => {
  let score = 100;

  // Check vaccinations
  const now = new Date();
  pet.health.vaccinations.forEach(vac => {
    if (new Date(vac.nextDue) < now) {
      score -= 15; // Overdue vaccination
    }
  });

  // Check last vet visit
  const daysSinceVet = Math.floor((now - new Date(pet.health.lastVetVisit)) / (1000 * 60 * 60 * 24));
  if (daysSinceVet > 365) {
    score -= 20;
  } else if (daysSinceVet > 180) {
    score -= 10;
  }

  return Math.max(0, score);
};
