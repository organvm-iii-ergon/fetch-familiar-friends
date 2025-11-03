/**
 * Breed-specific knowledge database for enhanced AI responses
 */

export const BREED_INFO = {
  // Sporting Group
  'retriever': {
    temperament: 'Friendly, intelligent, devoted',
    exercise: 'High - needs 60+ minutes daily',
    grooming: 'Regular brushing, moderate shedding',
    training: 'Very trainable, eager to please',
    facts: 'Originally bred for retrieving game for hunters. Excellent swimmers and family dogs.'
  },
  'golden': {
    temperament: 'Gentle, friendly, confident',
    exercise: 'High - needs 60+ minutes daily',
    grooming: 'High - daily brushing recommended',
    training: 'Highly trainable, intelligent',
    facts: 'Known for their golden coat and friendly personality. Great therapy and service dogs.'
  },
  'labrador': {
    temperament: 'Outgoing, friendly, active',
    exercise: 'Very high - needs 90+ minutes daily',
    grooming: 'Moderate - weekly brushing',
    training: 'Very trainable, food motivated',
    facts: 'Most popular dog breed in the US. Excellent swimmers with webbed paws.'
  },
  'spaniel': {
    temperament: 'Gentle, affectionate, eager',
    exercise: 'Moderate to high',
    grooming: 'High - regular professional grooming',
    training: 'Trainable, sensitive to corrections',
    facts: 'Originally bred as hunting companions. Known for their long, silky ears.'
  },

  // Herding Group
  'shepherd': {
    temperament: 'Confident, courageous, smart',
    exercise: 'Very high - needs lots of mental and physical activity',
    grooming: 'Regular brushing, heavy shedding',
    training: 'Highly trainable, working dog',
    facts: 'Excellent working dogs used in police, military, and service roles.'
  },
  'collie': {
    temperament: 'Devoted, graceful, proud',
    exercise: 'High - needs daily exercise',
    grooming: 'High - frequent brushing needed',
    training: 'Very trainable, eager to work',
    facts: 'Famous from "Lassie". Excellent herding instinct and family protector.'
  },
  'corgi': {
    temperament: 'Affectionate, smart, alert',
    exercise: 'Moderate - despite short legs!',
    grooming: 'Moderate - regular brushing',
    training: 'Trainable but can be stubborn',
    facts: 'Royal dogs of Britain. Low-riding herders with big personalities.'
  },

  // Working Group
  'husky': {
    temperament: 'Loyal, outgoing, mischievous',
    exercise: 'Very high - needs extensive daily exercise',
    grooming: 'Moderate to high, heavy seasonal shedding',
    training: 'Independent, needs patient training',
    facts: 'Bred for sled pulling in harsh conditions. Known for distinctive blue eyes and talking.'
  },
  'malamute': {
    temperament: 'Affectionate, loyal, playful',
    exercise: 'Very high - bred for endurance',
    grooming: 'High - thick double coat',
    training: 'Strong-willed, needs firm but kind training',
    facts: 'Arctic sled dogs, larger and stronger than Huskies. Love cold weather.'
  },
  'boxer': {
    temperament: 'Fun-loving, bright, active',
    exercise: 'High - very energetic',
    grooming: 'Low - short coat, easy maintenance',
    training: 'Trainable, needs consistent training',
    facts: 'Named for their tendency to stand on hind legs and "box". Great with kids.'
  },
  'rottweiler': {
    temperament: 'Loyal, loving, confident guardian',
    exercise: 'High - needs daily activity',
    grooming: 'Low to moderate',
    training: 'Very trainable, needs early socialization',
    facts: 'Ancient Roman herding dogs. Excellent guardians with gentle family side.'
  },

  // Hound Group
  'beagle': {
    temperament: 'Friendly, curious, merry',
    exercise: 'Moderate to high',
    grooming: 'Low - easy care coat',
    training: 'Can be stubborn, food motivated',
    facts: 'Expert scent hounds. Follow their nose everywhere! Love to howl.'
  },
  'dachshund': {
    temperament: 'Curious, friendly, spunky',
    exercise: 'Moderate - careful with jumping',
    grooming: 'Low to moderate depending on coat type',
    training: 'Stubborn but clever',
    facts: 'Originally bred to hunt badgers. "Wiener dog" shape helps them dig and burrow.'
  },
  'hound': {
    temperament: 'Gentle, independent, determined',
    exercise: 'Moderate to high',
    grooming: 'Low to moderate',
    training: 'Independent, scent-driven',
    facts: 'Bred for hunting by scent or sight. Strong prey drive and endurance.'
  },

  // Terrier Group
  'terrier': {
    temperament: 'Feisty, energetic, fearless',
    exercise: 'High - very active',
    grooming: 'Varies by breed',
    training: 'Intelligent but can be stubborn',
    facts: 'Originally bred to hunt vermin. Spirited and brave despite small size.'
  },
  'bull': {
    temperament: 'Friendly, patient, dependable',
    exercise: 'Moderate',
    grooming: 'Low - short coat',
    training: 'Trainable, can be stubborn',
    facts: 'Despite tough appearance, they are gentle and affectionate. Great with children.'
  },

  // Toy Group
  'chihuahua': {
    temperament: 'Charming, graceful, sassy',
    exercise: 'Low to moderate',
    grooming: 'Low - minimal grooming',
    training: 'Smart but can be stubborn',
    facts: 'Smallest dog breed. Big personality in tiny package. Can live 14-16+ years.'
  },
  'pug': {
    temperament: 'Charming, mischievous, loving',
    exercise: 'Moderate - careful in heat',
    grooming: 'Moderate - wrinkle cleaning important',
    training: 'Eager to please, food motivated',
    facts: 'Ancient Chinese breed. Known for "multum in parvo" - much in little.'
  },
  'poodle': {
    temperament: 'Active, proud, very smart',
    exercise: 'High - very active breed',
    grooming: 'High - professional grooming needed',
    training: 'Highly trainable, extremely intelligent',
    facts: 'Originally water retrievers. Hypoallergenic coat. Come in standard, miniature, and toy sizes.'
  },

  // Non-Sporting Group
  'bulldog': {
    temperament: 'Docile, willful, friendly',
    exercise: 'Low to moderate - careful in heat',
    grooming: 'Moderate - wrinkle care essential',
    training: 'Can be stubborn, patient training needed',
    facts: 'Originally bred for bull-baiting (now banned). Gentle couch potatoes today.'
  },
  'dalmatian': {
    temperament: 'Dignified, smart, outgoing',
    exercise: 'Very high - marathon runners',
    grooming: 'Moderate - shed year-round',
    training: 'Trainable, needs consistent training',
    facts: 'Famous as firehouse dogs. Born white, spots appear later. Need lots of exercise.'
  },

  // Mixed/General
  'mix': {
    temperament: 'Varies - best of multiple breeds!',
    exercise: 'Depends on breed mix',
    grooming: 'Varies by coat type',
    training: 'Often very trainable and adaptable',
    facts: 'Mixed breeds often healthier due to genetic diversity. Each is unique!'
  }
};

/**
 * Get breed information from breed name
 * @param {string} breedName - The breed name
 * @returns {Object|null} - Breed information or null
 */
export function getBreedInfo(breedName) {
  if (!breedName) return null;

  const lowerBreed = breedName.toLowerCase();

  // Check for exact matches first
  for (const [key, info] of Object.entries(BREED_INFO)) {
    if (lowerBreed.includes(key)) {
      return { breed: key, ...info };
    }
  }

  return null;
}

/**
 * Generate a breed-specific response
 * @param {string} breedName - The breed name
 * @param {string} topic - The topic (training, exercise, grooming, etc.)
 * @returns {string} - Breed-specific response
 */
export function getBreedSpecificResponse(breedName, topic) {
  const info = getBreedInfo(breedName);
  if (!info) return null;

  const breedDisplay = breedName || info.breed;

  switch (topic.toLowerCase()) {
    case 'training':
    case 'train':
      return `For ${breedDisplay}s: ${info.training}. ${info.facts}`;

    case 'exercise':
    case 'walk':
    case 'activity':
      return `${breedDisplay}s need: ${info.exercise}. They are ${info.temperament.toLowerCase()}. ${info.facts}`;

    case 'grooming':
    case 'groom':
    case 'brush':
      return `${breedDisplay} grooming: ${info.grooming}. Regular care keeps them healthy and comfortable.`;

    case 'temperament':
    case 'personality':
    case 'behavior':
      return `${breedDisplay}s are ${info.temperament.toLowerCase()}. ${info.facts}`;

    case 'info':
    case 'about':
    case 'breed':
      return `${breedDisplay} info: ${info.facts} Temperament: ${info.temperament}. Exercise needs: ${info.exercise}`;

    default:
      return `${breedDisplay}s are ${info.temperament.toLowerCase()}. ${info.facts}`;
  }
}
