/**
 * Daily content generation utilities
 * Provides consistent daily facts, moods, and quotes based on date
 */

// Fun facts about dogs and cats
const DOG_FACTS = [
  "Dogs can learn over 100 words and gestures!",
  "A dog's nose print is unique, like a human fingerprint.",
  "Dogs dream just like humans do!",
  "Puppies are born deaf, blind, and toothless.",
  "Dogs can smell your feelings through chemical changes in your body.",
  "A Greyhound can beat a Cheetah in a long distance race.",
  "Dogs have three eyelids to keep their eyes protected.",
  "A dog's sense of smell is 10,000 times stronger than humans.",
  "Dogs can understand up to 250 words and gestures.",
  "The oldest known dog lived to be 29 years old!",
  "Dogs curl up in a ball when sleeping to protect their vital organs.",
  "Basenji dogs don't bark—they yodel!",
  "Dogs have wet noses to absorb scent chemicals.",
  "A wagging tail doesn't always mean a happy dog.",
  "Dogs have been companions to humans for over 15,000 years!",
  "Dogs can be trained to detect cancer and diabetes.",
  "A dog's normal body temperature is higher than humans.",
  "Dogs can see in color, just not as vividly as humans.",
  "Puppies have 28 teeth, adult dogs have 42.",
  "Dogs have twice as many muscles to move their ears as humans.",
  "Your dog can smell your emotions and respond to them.",
  "Dogs have a sense of time and miss you when you're gone.",
  "Service dogs are trained to help people in over 10 different ways.",
  "Dogs' whiskers help them 'see' in the dark.",
  "A dog's hearing is 4 times better than a human's.",
  "Dogs descended from wolves about 15,000 years ago.",
  "Dogs can learn to understand human emotions.",
  "Dogs prefer routine and consistency in their daily schedule.",
  "The Newfoundland breed has webbed feet for swimming.",
  "Dogs have a 'sixth sense' about weather changes."
];

const CAT_FACTS = [
  "Cats spend 70% of their lives sleeping.",
  "A group of cats is called a 'clowder'.",
  "Cats have over 20 vocalizations, including the meow.",
  "A cat's purr vibrates at a frequency that promotes healing.",
  "Cats can rotate their ears 180 degrees.",
  "Cats have a third eyelid called a nictitating membrane.",
  "A cat's nose is as unique as a human fingerprint.",
  "Cats can jump up to 6 times their height!",
  "Cats have over 230 bones, more than humans.",
  "A cat's whiskers are the same width as their body.",
  "Cats can't taste sweetness.",
  "Cats spend 30-50% of their day grooming themselves.",
  "A cat's brain is 90% similar to a human's.",
  "Cats can make over 100 different sounds.",
  "Cats have powerful night vision.",
  "A cat's heart beats nearly twice as fast as a human's.",
  "Cats can't climb down trees head-first because of their claws.",
  "Cats walk like camels and giraffes.",
  "A cat's meow is specially developed to communicate with humans.",
  "Cats can run up to 30 mph in short bursts.",
  "Cats have flexible backbones with 53 loosely fitting vertebrae.",
  "Cats can see in just 1/6th the light humans need.",
  "A cat's tongue has tiny hooks for grooming.",
  "Cats have scent glands on their cheeks and paws.",
  "Cats can detect earthquakes before they happen.",
  "The oldest known pet cat existed 9,500 years ago.",
  "Cats have an extra organ for enhanced smell detection.",
  "A cat's purr ranges from 25 to 150 vibrations per second.",
  "Cats sleep an average of 13-16 hours per day.",
  "Cats have better peripheral vision than humans."
];

// Mood descriptors
const MOODS = [
  { emoji: "😊", text: "Playful & Energetic", description: "Great day for fetch and zoomies!" },
  { emoji: "😌", text: "Calm & Cozy", description: "Perfect weather for cuddles" },
  { emoji: "🥳", text: "Excited & Happy", description: "Extra treats incoming!" },
  { emoji: "😴", text: "Sleepy & Snuggly", description: "Nap time is the best time" },
  { emoji: "🤗", text: "Loving & Affectionate", description: "All the belly rubs please!" },
  { emoji: "😎", text: "Cool & Confident", description: "Looking extra adorable today" },
  { emoji: "🤓", text: "Curious & Smart", description: "Learning new tricks!" },
  { emoji: "🌟", text: "Bright & Cheerful", description: "Spreading joy everywhere" },
  { emoji: "💪", text: "Strong & Brave", description: "Ready for adventure!" },
  { emoji: "🎾", text: "Active & Athletic", description: "Game time!" },
  { emoji: "🦴", text: "Hungry & Happy", description: "Treat motivation is real" },
  { emoji: "🌈", text: "Joyful & Optimistic", description: "Every day is the best day" },
  { emoji: "🎨", text: "Creative & Unique", description: "One-of-a-kind personality" },
  { emoji: "🌸", text: "Gentle & Sweet", description: "Soft paws, big heart" },
  { emoji: "⚡", text: "Energetic & Zippy", description: "Zoom zoom zoom!" }
];

// Daily quotes
const QUOTES = [
  "Dogs are not our whole life, but they make our lives whole.",
  "The bond with a dog is as lasting as the ties of this earth can ever be.",
  "Every dog must have his day.",
  "Happiness is a warm puppy.",
  "Dogs leave paw prints on our hearts.",
  "A dog is the only thing that loves you more than you love yourself.",
  "Dogs teach us about living in the moment.",
  "Life is better with a dog by your side.",
  "Dogs are proof that love comes in all shapes and sizes.",
  "In a perfect world, every dog would have a home and every home would have a dog.",
  "Dogs have a way of finding the people who need them most.",
  "The world would be a nicer place if everyone had the ability to love unconditionally as a dog.",
  "Dogs do speak, but only to those who know how to listen.",
  "Every dog has his day, and today is yours!",
  "A dog will teach you unconditional love. If you can have that in your life, things won't be too bad.",
  "Dogs are miracles with paws.",
  "Home is where the dog hair sticks to everything but the dog.",
  "Dogs are not our whole life, but they make our lives whole.",
  "The greatest pleasure of a dog is that you may make a fool of yourself with him.",
  "Dogs are magical. They make everything better.",
  "A house is not a home without a dog.",
  "Dogs are the epitome of unconditional love.",
  "Every snack you make, every meal you bake, every bite you take, I'll be watching you. - Your Dog",
  "Dogs are angels in fur coats.",
  "The only creatures that are evolved enough to convey pure love are dogs and infants.",
  "Dogs have owners. Cats have staff.",
  "Whoever said diamonds are a girl's best friend never owned a dog.",
  "Dogs are better than human beings because they know but do not tell.",
  "The greatest love is a mother's; then a dog's; then a sweetheart's.",
  "Dogs come into our lives to teach us about love. They depart to teach us about loss."
];

/**
 * Generate a consistent seed number from a date
 * @param {Date} date - The date to generate seed from
 * @returns {number} - A seed number for that date
 */
function getDateSeed(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return year * 10000 + month * 100 + day;
}

/**
 * Simple seeded random number generator
 * @param {number} seed - The seed for reproducible randomness
 * @returns {number} - A number between 0 and 1
 */
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Get a fun fact for the day
 * @param {Date} date - The date
 * @param {boolean} isCat - Whether to get cat facts (vs dog facts)
 * @returns {string} - The fun fact
 */
export function getDailyFact(date, isCat = false) {
  const seed = getDateSeed(date);
  const facts = isCat ? CAT_FACTS : DOG_FACTS;
  const index = Math.floor(seededRandom(seed) * facts.length);
  return facts[index];
}

/**
 * Get mood of the day
 * @param {Date} date - The date
 * @returns {object} - Mood object with emoji, text, and description
 */
export function getDailyMood(date) {
  const seed = getDateSeed(date);
  const index = Math.floor(seededRandom(seed + 1) * MOODS.length);
  return MOODS[index];
}

/**
 * Get quote of the day
 * @param {Date} date - The date
 * @returns {string} - The quote
 */
export function getDailyQuote(date) {
  const seed = getDateSeed(date);
  const index = Math.floor(seededRandom(seed + 2) * QUOTES.length);
  return QUOTES[index];
}

/**
 * Get all daily content for a date
 * @param {Date} date - The date
 * @param {boolean} isCat - Whether it's cat mode
 * @returns {object} - Object with fact, mood, and quote
 */
export function getAllDailyContent(date, isCat = false) {
  return {
    fact: getDailyFact(date, isCat),
    mood: getDailyMood(date),
    quote: getDailyQuote(date)
  };
}
