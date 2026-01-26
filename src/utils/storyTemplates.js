/**
 * Story Templates Utility
 * Provides template-based story generation as a fallback when AI is unavailable
 */

// Story template components for mix-and-match generation
const STORY_PARTS = {
  adventure: {
    openings: [
      "{name} woke up one morning with an unusually twitchy {bodyPart}. Something exciting was in the air.",
      "The sun had barely risen when {name} caught a scent on the breeze that promised adventure.",
      "It was a crisp {season} morning, and {name} knew today would be different. {pronoun} could feel it in {possessive} {bodyPart}s.",
      "Thunder rumbled in the distance as {name} pressed {possessive} nose against the window. Today was the day for adventure.",
      "{name} had been watching the strange rustling in the bushes for days. Today, {pronoun} would investigate.",
    ],
    middles: [
      "With determination in {possessive} eyes, {name} ventured beyond the familiar territory. Every {bodyPart} step revealed new wonders: strange smells, unfamiliar sounds, and secrets waiting to be discovered.",
      "The path led through a meadow where butterflies danced and grasshoppers leaped. {name} bounded after them, {possessive} {bodyPart} a blur of motion. But the real adventure was just beginning.",
      "Deeper into the woods {name} traveled, past the old oak tree and across the bubbling brook. {pronoun} found a hidden clearing bathed in dappled sunlight, where a curious surprise awaited.",
      "{name} climbed the biggest hill {pronoun}'d ever seen. From the top, the whole world spread out below. {pronoun} let out a triumphant {sound}, feeling like the bravest {species} alive.",
      "Through brambles and over fallen logs, {name} pressed on. When {pronoun} reached the hidden grove, {possessive} heart swelled with pride. {pronoun}'d done it!",
    ],
    endings: [
      "As the sun began to set, painting the sky in shades of orange and pink, {name} made {possessive} way home. Tired but happy, {pronoun} curled up in {possessive} favorite spot, dreaming of tomorrow's adventures.",
      "Back home, {name} was greeted with excited hugs and treats. {pronoun} tried to tell {possessive} family about the incredible journey through {sound}s and wiggles. They seemed to understand.",
      "That night, as {name} drifted off to sleep, {pronoun} knew {pronoun}'d remember this adventure forever. Some days are ordinary, but this one had been extraordinary.",
      "{name} returned home a hero, at least in {possessive} own mind. {pronoun} had explored, discovered, and conquered. Not bad for a {age} {species}!",
      "Safe at home with a full belly and tired {bodyPart}s, {name} smiled in that special way only {species}s can. Today had been a good day. Tomorrow would bring new adventures.",
    ],
  },
  day_in_life: {
    openings: [
      "{name} stretched luxuriously, greeting the morning with a big {sound}. Another perfect day was beginning.",
      "The smell of breakfast wafted through the house, and {name}'s {bodyPart} began to twitch. Time to start the day!",
      "Sunlight streamed through the window onto {name}'s favorite spot. {pronoun} blinked sleepily, taking a moment to appreciate the warmth.",
      "{name} had a very important job each morning: making sure everyone in the house was awake. With a {sound}, {pronoun} began {possessive} rounds.",
      "Some days are for adventures. But today, {name} decided, was a day for the simple pleasures.",
    ],
    middles: [
      "After breakfast, {name} inspected the house thoroughly. The kitchen - check. The living room - check. {possessive} food bowl - still there, excellent. Life was good.",
      "{name} spent the afternoon in a patch of sunshine, dozing and dreaming. Occasionally, {possessive} {bodyPart}s would twitch as {pronoun} chased imaginary {chaseTarget}s.",
      "Playtime was the best time. {name} attacked {possessive} favorite toy with fierce determination, shaking it back and forth. Victory was always sweet.",
      "When the mail carrier arrived, {name} performed {possessive} sacred duty, alerting the household with enthusiastic {sound}s. Another successful patrol.",
      "The afternoon brought unexpected excitement when a {sound} came from outside. {name} pressed against the window, watching the world with intense curiosity.",
    ],
    endings: [
      "As evening fell, {name} snuggled close to {possessive} favorite human. The day had been perfectly ordinary, which made it perfectly wonderful.",
      "{name} yawned contentedly as the house grew quiet. Another day filled with food, naps, and love. What more could a {species} ask for?",
      "With a satisfied sigh, {name} settled into {possessive} bed. The house was peaceful, {possessive} belly was full, and all was right in the world.",
      "The stars twinkled outside as {name} began to drift off. Tomorrow would bring more sunshine, more treats, and more moments of joy. Life as a {species} was pretty great.",
      "Curled up in {possessive} favorite blanket, {name} reflected on the day. So many naps, so many treats, so much love. {pronoun} fell asleep with a smile.",
    ],
  },
  friendship: {
    openings: [
      "{name} had many friends, but there was one who held a special place in {possessive} heart.",
      "Some bonds are forged over time. But for {name}, the connection was instant - a friendship that would last forever.",
      "The day {name} met {possessive} best friend started like any other, but it became one {pronoun} would always remember.",
      "{name} didn't know it yet, but today {pronoun} would find {possessive} soulmate - someone who truly understood {possessive} {sound}s.",
      "Friendship, {name} had learned, comes in unexpected forms. {pronoun} never expected to find such a perfect companion.",
    ],
    middles: [
      "Together, they did everything - played in the yard, napped in sunbeams, and shared the occasional stolen treat. Every moment was better with a friend by {possessive} side.",
      "When {name} was sad, {possessive} friend knew without a word. A gentle nudge, a quiet presence - that's what true friendship meant.",
      "They developed their own language - a combination of {sound}s, tail wags, and meaningful looks. Others might not understand, but they didn't need to.",
      "{name} and {possessive} friend explored the neighborhood together, two adventurers facing the world side by side. Nothing could stop them when they were together.",
      "Sometimes they'd sit together in comfortable silence, watching the world go by. {name} realized that the best moments didn't always need words - or {sound}s.",
    ],
    endings: [
      "As {name} curled up that night, {pronoun} felt grateful for {possessive} friend. Some friendships are rare and precious, and this one was both.",
      "Friends come and go, but true friends stay in your heart forever. {name} knew {possessive} bond would last through all of life's adventures.",
      "{name} gave {possessive} friend one last nuzzle before bedtime. Tomorrow they'd have more adventures, more laughs, more memories to make together.",
      "The house was quiet, but {name} didn't feel alone. {pronoun} carried {possessive} friendship in {possessive} heart, warm and constant as the sun.",
      "As sleep claimed {name}, {pronoun} dreamed of endless sunny days with {possessive} friend - chasing butterflies, sharing treats, and just being together.",
    ],
  },
  mystery: {
    openings: [
      "{name}'s keen {bodyPart} twitched. Something was amiss in the house, and {pronoun} was determined to find out what.",
      "The case of the missing {mysteryItem} had stumped everyone. But {name} was on the trail.",
      "Strange sounds had been coming from the garden at night. {name} narrowed {possessive} eyes. Time to investigate.",
      "{name} noticed something peculiar - a scent that didn't belong. {pronoun} went into detective mode immediately.",
      "Everyone else had given up on finding the {mysteryItem}. But {name} knew {pronoun} could crack the case.",
    ],
    middles: [
      "Following {possessive} nose, {name} searched under every cushion and behind every curtain. The clues were there, if only {pronoun} could piece them together.",
      "The trail led to an unexpected place - the spot where no one ever thought to look. {name}'s {bodyPart} tingled with excitement.",
      "With the patience of a seasoned detective, {name} watched and waited. The answer was close. {pronoun} could feel it.",
      "{name} discovered a crucial clue: a suspicious trail leading through the house. {pronoun} followed it with determination.",
      "The puzzle was complex, but {name} was clever. {pronoun} connected the dots, piecing together the mystery one sniff at a time.",
    ],
    endings: [
      "Mystery solved! {name} had found the culprit - and the {mysteryItem}. The grateful family showered {pronoun} with treats and praise.",
      "With the case closed, {name} settled into {possessive} well-deserved rest. Another mystery solved, another day saved by the world's greatest {species} detective.",
      "{name} accepted {possessive} reward - extra treats and belly rubs - with humble grace. It was all in a day's work for a detective of {possessive} caliber.",
      "The {mysteryItem} was found, the mystery was solved, and {name} was the hero of the hour. {pronoun} celebrated with a victory nap.",
      "As {name} dozed off, {pronoun} knew {possessive} detective skills might be needed again. But for now, the case was closed, and all was well.",
    ],
  },
  comedy: {
    openings: [
      "It started innocently enough. {name} just wanted to catch the mysterious red dot. How was {pronoun} supposed to know it would lead to chaos?",
      "{name} had a brilliant idea. Well, {pronoun} thought it was brilliant. The humans might disagree.",
      "Some days, {name} was graceful. Today was not one of those days.",
      "{name} eyed the {chaseTarget} with determination. {pronoun} was going to catch it this time, no matter what!",
      "If {name} had known how the day would unfold, {pronoun} might have stayed in bed. Or maybe not - where's the fun in that?",
    ],
    middles: [
      "Things escalated quickly. One moment {name} was chasing {possessive} {bodyPart}, the next {pronoun} was tangled in the curtains, somehow wearing a sock.",
      "The {chaseTarget} led {name} on a wild chase through the house - over the couch, under the table, and straight into a pile of laundry.",
      "{name} tried to look dignified after the incident. It was hard to look dignified with {mysteryItem} stuck to {possessive} {bodyPart}.",
      "The humans laughed until they cried. {name} didn't see what was so funny. This was serious {species} business!",
      "One mishap led to another. By lunchtime, {name} had knocked over three plants, scared {possessive} own reflection, and somehow gotten {possessive} head stuck in a bag.",
    ],
    endings: [
      "Exhausted from the day's adventures (and mishaps), {name} flopped onto {possessive} bed. {pronoun} regretted nothing. Okay, maybe the sock thing.",
      "{name} gave {possessive} humans an innocent look. 'Who, me? Cause chaos? Never.' They didn't believe {pronoun} for a second.",
      "As {name} drifted off to sleep, {pronoun} was already planning tomorrow's adventures. {pronoun} hoped the curtains were ready.",
      "The humans spent an hour cleaning up. {name} spent that hour napping, dreaming of more glorious mischief to come.",
      "{name} yawned and stretched, looking around at the aftermath. It had been a good day. Chaotic, messy, and absolutely perfect.",
    ],
  },
};

// Story variables
const VARIABLES = {
  dog: {
    bodyPart: ['tail', 'ear', 'paw', 'nose'],
    sound: ['woof', 'bark', 'happy bark', 'excited yip'],
    chaseTarget: ['squirrel', 'ball', 'leaf', 'butterfly', 'shadow'],
    mysteryItem: ['treat', 'toy', 'sock', 'ball', 'bone'],
  },
  cat: {
    bodyPart: ['tail', 'ear', 'paw', 'whisker'],
    sound: ['meow', 'purr', 'chirp', 'soft mrrow'],
    chaseTarget: ['mouse', 'feather', 'sunbeam', 'dust mote', 'shadow'],
    mysteryItem: ['toy mouse', 'treat', 'hair tie', 'ball', 'catnip toy'],
  },
};

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

/**
 * Get a random item from an array
 */
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Calculate pet age description
 */
function getAgeDescription(birthDate, species) {
  if (!birthDate) return species === 'cat' ? 'cat' : 'dog';

  const birth = new Date(birthDate);
  const now = new Date();
  const years = (now - birth) / (365.25 * 24 * 60 * 60 * 1000);

  if (years < 1) return species === 'cat' ? 'kitten' : 'puppy';
  if (years < 3) return `young ${species}`;
  if (years < 7) return species;
  return `wise old ${species}`;
}

/**
 * Replace template variables in a string
 */
function fillTemplate(template, variables) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] || match;
  });
}

/**
 * Generate a story title based on type
 */
function generateTitle(storyType, name) {
  const titles = {
    adventure: [
      `${name}'s Great Adventure`,
      `The Incredible Journey of ${name}`,
      `${name} and the Secret Path`,
      `${name}'s Bravest Day`,
      `The Adventures of ${name}`,
    ],
    day_in_life: [
      `A Day with ${name}`,
      `${name}'s Perfect Day`,
      `Sunshine and ${name}`,
      `The Simple Life of ${name}`,
      `${name}'s Cozy Day`,
    ],
    friendship: [
      `${name}'s Best Friend`,
      `The Bond of ${name}`,
      `${name} and the Power of Friendship`,
      `Hearts United: ${name}'s Story`,
      `${name} Finds a Friend`,
    ],
    mystery: [
      `${name}: Detective Extraordinaire`,
      `The Mystery of the Missing Item`,
      `${name} Solves the Case`,
      `The Case of the Curious Clue`,
      `${name}'s Greatest Mystery`,
    ],
    comedy: [
      `The Misadventures of ${name}`,
      `${name}'s Hilarious Day`,
      `Oops! A ${name} Story`,
      `${name} Strikes Again`,
      `The Chaos Chronicles of ${name}`,
    ],
  };

  return randomChoice(titles[storyType] || titles.day_in_life);
}

/**
 * Generate a story from templates
 * @param {Object} petData - Pet information { name, species, breed, birthDate }
 * @param {string} storyType - Type of story (adventure, day_in_life, friendship, mystery, comedy)
 * @param {Array} journalEntries - Recent journal entries for context (optional)
 * @returns {Object} Generated story { title, content, storyType, petData }
 */
export function generateTemplateStory(petData, storyType = 'day_in_life', journalEntries = []) {
  const {
    name = 'Pet',
    species = 'dog',
    breed = '',
    birthDate,
  } = petData || {};

  const normalizedSpecies = species?.toLowerCase() === 'cat' ? 'cat' : 'dog';
  const vars = VARIABLES[normalizedSpecies];

  // Build template variables
  const templateVars = {
    name,
    species: normalizedSpecies,
    breed: breed || (normalizedSpecies === 'cat' ? 'kitty' : 'pup'),
    age: getAgeDescription(birthDate, normalizedSpecies),
    pronoun: 'they',
    possessive: 'their',
    bodyPart: randomChoice(vars.bodyPart),
    sound: randomChoice(vars.sound),
    chaseTarget: randomChoice(vars.chaseTarget),
    mysteryItem: randomChoice(vars.mysteryItem),
    season: randomChoice(SEASONS),
  };

  // Get story parts for the selected type
  const parts = STORY_PARTS[storyType] || STORY_PARTS.day_in_life;

  // Build the story
  const opening = fillTemplate(randomChoice(parts.openings), templateVars);
  const middle = fillTemplate(randomChoice(parts.middles), templateVars);
  const ending = fillTemplate(randomChoice(parts.endings), templateVars);

  const content = `${opening}\n\n${middle}\n\n${ending}`;

  return {
    id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: generateTitle(storyType, name),
    content,
    storyType,
    petData: {
      name,
      species: normalizedSpecies,
      breed,
    },
    createdAt: new Date().toISOString(),
    isTemplateGenerated: true,
  };
}

/**
 * Get available story types with their metadata
 */
export const STORY_TYPES = {
  adventure: {
    id: 'adventure',
    name: 'Adventure',
    icon: '🏔️',
    description: 'An exciting outdoor adventure',
    color: 'from-emerald-500 to-teal-600',
  },
  day_in_life: {
    id: 'day_in_life',
    name: 'Day in the Life',
    icon: '☀️',
    description: 'A cozy day at home',
    color: 'from-amber-500 to-orange-600',
  },
  friendship: {
    id: 'friendship',
    name: 'Friendship Tale',
    icon: '💕',
    description: 'A heartwarming story about friendship',
    color: 'from-pink-500 to-rose-600',
  },
  mystery: {
    id: 'mystery',
    name: 'Mystery',
    icon: '🔍',
    description: 'A curious mystery to solve',
    color: 'from-indigo-500 to-purple-600',
  },
  comedy: {
    id: 'comedy',
    name: 'Comedy',
    icon: '😂',
    description: 'A funny tale full of laughs',
    color: 'from-yellow-500 to-amber-600',
  },
};

export default {
  generateTemplateStory,
  STORY_TYPES,
};
