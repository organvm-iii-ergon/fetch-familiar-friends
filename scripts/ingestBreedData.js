#!/usr/bin/env node

/**
 * Breed Data Ingestion CLI Tool
 *
 * Fetches breed data from external APIs and stores it locally.
 *
 * Usage:
 *   node scripts/ingestBreedData.js              # Fetch all breeds
 *   node scripts/ingestBreedData.js --dogs       # Dogs only
 *   node scripts/ingestBreedData.js --cats       # Cats only
 *   node scripts/ingestBreedData.js --validate   # Validate existing data
 *   node scripts/ingestBreedData.js --stats      # Show statistics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'breedDatabase.json');

// For Node.js environment, we need to use node-fetch
let fetch;
try {
  const fetchModule = await import('node-fetch');
  fetch = fetchModule.default;
  global.fetch = fetch;
} catch (error) {
  console.error('Error: node-fetch is required. Install it with: npm install node-fetch');
  process.exit(1);
}

// Import the ingestion service
const serviceModule = await import('../src/services/breedDataIngestion.js');
const {
  fetchDogBreeds,
  fetchCatBreeds,
  fetchAllBreeds,
  validateBreedData,
  getBreedDataStats
} = serviceModule;

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  return {
    dogsOnly: args.includes('--dogs'),
    catsOnly: args.includes('--cats'),
    validate: args.includes('--validate'),
    stats: args.includes('--stats'),
    help: args.includes('--help') || args.includes('-h')
  };
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Breed Data Ingestion Tool
==========================

Usage:
  node scripts/ingestBreedData.js [options]

Options:
  --dogs       Fetch only dog breeds
  --cats       Fetch only cat breeds
  --validate   Validate existing breed data
  --stats      Display statistics about breed data
  --help, -h   Show this help message

Examples:
  node scripts/ingestBreedData.js              # Fetch all breeds
  node scripts/ingestBreedData.js --dogs       # Dogs only
  node scripts/ingestBreedData.js --validate   # Validate existing data
  node scripts/ingestBreedData.js --stats      # Show statistics

Output:
  Data is saved to: src/data/breedDatabase.json
  `);
}

/**
 * Load existing breed data from file
 */
function loadExistingData() {
  try {
    if (fs.existsSync(OUTPUT_PATH)) {
      const data = fs.readFileSync(OUTPUT_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Warning: Could not load existing data:', error.message);
  }
  return null;
}

/**
 * Save breed data to file
 */
function saveBreedData(data) {
  try {
    // Ensure directory exists
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write data with pretty formatting
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf8');

    console.log(`\n✓ Data saved to: ${OUTPUT_PATH}`);
    console.log(`  File size: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`);

    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

/**
 * Validate existing breed data
 */
async function validateData() {
  console.log('Validating breed data...\n');

  const existingData = loadExistingData();

  if (!existingData) {
    console.error('✗ No breed data file found at:', OUTPUT_PATH);
    console.log('  Run the ingestion script first to create the database.');
    return false;
  }

  const validation = validateBreedData(existingData);

  console.log('Validation Results:');
  console.log('===================');
  console.log(`Status: ${validation.isValid ? '✓ VALID' : '✗ INVALID'}`);
  console.log(`Total Dogs: ${validation.summary.totalDogs}`);
  console.log(`Total Cats: ${validation.summary.totalCats}`);
  console.log(`Errors: ${validation.summary.errorCount}\n`);

  if (validation.errors.length > 0) {
    console.log('Validation Errors:');
    validation.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  return validation.isValid;
}

/**
 * Display statistics about breed data
 */
async function showStats() {
  console.log('Breed Data Statistics\n');

  const existingData = loadExistingData();

  if (!existingData) {
    console.error('✗ No breed data file found at:', OUTPUT_PATH);
    console.log('  Run the ingestion script first to create the database.');
    return;
  }

  const stats = getBreedDataStats(existingData);

  console.log('Dogs:');
  console.log(`  Total breeds: ${stats.dogs.total}`);
  console.log(`  Main breed groups: ${stats.dogs.mainBreeds}`);
  console.log(`  Breeds with sub-breeds: ${stats.dogs.withSubBreeds}\n`);

  console.log('Cats:');
  console.log(`  Total breeds: ${stats.cats.total}`);
  console.log(`  With descriptions: ${stats.cats.withDescription}`);
  console.log(`  Avg trait score: ${stats.cats.avgTraitScore}\n`);

  console.log('Metadata:');
  console.log(`  Version: ${stats.meta.version || 'N/A'}`);
  console.log(`  Last updated: ${stats.meta.completedAt || 'N/A'}`);
  console.log(`  Errors during fetch: ${stats.meta.errors?.length || 0}`);

  if (stats.meta.errors && stats.meta.errors.length > 0) {
    console.log('\nErrors:');
    stats.meta.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. [${error.source}] ${error.error}`);
    });
  }
}

/**
 * Ingest dog breeds only
 */
async function ingestDogs() {
  console.log('Fetching dog breeds only...\n');

  const existingData = loadExistingData() || {
    dogs: {},
    cats: {},
    meta: {}
  };

  try {
    const dogs = await fetchDogBreeds();

    const updatedData = {
      ...existingData,
      dogs,
      meta: {
        ...existingData.meta,
        totalDogs: Object.keys(dogs).length,
        lastDogsUpdate: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return updatedData;
  } catch (error) {
    console.error('Failed to fetch dog breeds:', error);
    throw error;
  }
}

/**
 * Ingest cat breeds only
 */
async function ingestCats() {
  console.log('Fetching cat breeds only...\n');

  const existingData = loadExistingData() || {
    dogs: {},
    cats: {},
    meta: {}
  };

  try {
    const cats = await fetchCatBreeds();

    const updatedData = {
      ...existingData,
      cats,
      meta: {
        ...existingData.meta,
        totalCats: Object.keys(cats).length,
        lastCatsUpdate: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return updatedData;
  } catch (error) {
    console.error('Failed to fetch cat breeds:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = parseArgs();

  // Show help
  if (args.help) {
    showHelp();
    return;
  }

  // Validate existing data
  if (args.validate) {
    const isValid = await validateData();
    process.exit(isValid ? 0 : 1);
    return;
  }

  // Show statistics
  if (args.stats) {
    await showStats();
    return;
  }

  // Fetch breed data
  let breedData;

  try {
    if (args.dogsOnly) {
      breedData = await ingestDogs();
    } else if (args.catsOnly) {
      breedData = await ingestCats();
    } else {
      breedData = await fetchAllBreeds();
    }

    // Save to file
    const saved = saveBreedData(breedData);

    if (saved) {
      // Auto-validate after save
      console.log('\nValidating saved data...');
      const validation = validateBreedData(breedData);

      if (validation.isValid) {
        console.log('✓ Data validation passed\n');
      } else {
        console.warn('⚠ Data validation found issues:');
        validation.errors.forEach((error, index) => {
          console.warn(`  ${index + 1}. ${error}`);
        });
        console.log('');
      }

      // Show summary stats
      const stats = getBreedDataStats(breedData);
      console.log('Summary:');
      console.log(`  Dog breeds: ${stats.dogs.total}`);
      console.log(`  Cat breeds: ${stats.cats.total}`);
      console.log(`  Total: ${stats.dogs.total + stats.cats.total}\n`);

      console.log('✓ Breed data ingestion complete!');
      process.exit(0);
    } else {
      console.error('✗ Failed to save breed data');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n✗ Ingestion failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
