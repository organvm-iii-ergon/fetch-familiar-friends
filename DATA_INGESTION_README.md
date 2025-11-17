# Data Ingestion Pipeline - User Guide

**Version:** 1.0.0
**Status:** Production Ready
**Branch:** `claude/data-ingestion-pipeline-01X4TBgoR8eaCVTLHvVpGRir`

## Quick Start

The Data Ingestion Pipeline automates fetching, validating, and managing data for the DogTale Daily application.

### Installation

```bash
# Install dependencies
npm install
```

### Basic Usage

```bash
# Fetch all breed data (dogs + cats)
npm run ingest:breeds

# Fetch only dog breeds
npm run ingest:breeds:dogs

# Fetch only cat breeds
npm run ingest:breeds:cats

# Validate existing breed data
npm run ingest:validate

# View breed data statistics
npm run ingest:stats

# Process and normalize documents
npm run process:docs

# Watch documents for changes (auto-process)
npm run watch:docs
```

## Features

### 1. Breed Data Ingestion

Automatically fetches comprehensive breed information from external APIs:
- **Dog CEO API**: 150+ dog breeds with detailed information
- **The Cat API**: 67+ cat breeds with temperament, traits, and care info

**Output**: `src/data/breedDatabase.json`

```json
{
  "dogs": {
    "retriever-golden": {
      "name": "Golden Retriever",
      "mainBreed": "Retriever",
      "subBreed": "Golden",
      "slug": "retriever-golden",
      "source": "dog.ceo",
      "fetchedAt": "2025-11-17T..."
    }
  },
  "cats": {
    "abyssinian": {
      "name": "Abyssinian",
      "description": "...",
      "temperament": "Active, Energetic, Independent",
      "traits": {
        "adaptability": 5,
        "affectionLevel": 4,
        ...
      }
    }
  },
  "meta": {
    "completedAt": "2025-11-17T...",
    "totalDogs": 150,
    "totalCats": 67,
    "version": "1.0.0"
  }
}
```

### 2. Document Processing

Normalizes markdown documentation with AI handoff headers and footers:
- Scans `ChatPRD/` and `docs/` directories
- Adds standardized AI handoff markers
- Generates updated document index
- Validates document structure

**AI Handoff Header:**
```markdown
<!-- AI Handoff Header -->
**AI Handoff Overview:** This document is structured for seamless agent transitions. Coordinate updates with the orchestration plan in `AGENT_ORCHESTRATION.md`.
<!-- /AI Handoff Header -->
```

**AI Handoff Footer:**
```markdown
<!-- AI Handoff Footer -->
**Next Steps:** Confirm alignment with `ROADMAP.md` and log cross-agent feedback before closing this document.
<!-- /AI Handoff Footer -->
```

### 3. Document Watching

Real-time monitoring of document changes:
- Watches `ChatPRD/` and `docs/` for file changes
- Auto-processes new/modified files
- Updates document index automatically
- Runs in background during development

```bash
# Start the watcher
npm run watch:docs

# Output:
# 🔍 Document Watcher Started
# Monitoring:
#   - /path/to/ChatPRD
#   - /path/to/docs
#
# Waiting for changes... (Ctrl+C to stop)
```

### 4. Data Validation

Comprehensive validation for all data types:
- **Breed data**: Schema validation, required fields, type checking
- **Content**: Facts, quotes, moods validation
- **Duplicates**: Automatic duplicate detection
- **Safety**: XSS protection, profanity filtering

### 5. Freshness Monitoring

Track data age and get refresh recommendations:
- **Breeds**: 30-day freshness threshold
- **Content**: 60-day freshness threshold
- **Cache**: 7-day freshness threshold
- **Documents**: 90-day freshness threshold

## Commands Reference

### Breed Data Commands

```bash
# Fetch all breed data
npm run ingest:breeds

# Options (use directly):
node scripts/ingestBreedData.js              # All breeds
node scripts/ingestBreedData.js --dogs       # Dogs only
node scripts/ingestBreedData.js --cats       # Cats only
node scripts/ingestBreedData.js --validate   # Validate only
node scripts/ingestBreedData.js --stats      # Show statistics
node scripts/ingestBreedData.js --help       # Show help
```

### Document Commands

```bash
# Process all documents
npm run process:docs

# Options (use directly):
node scripts/processDocuments.js              # Process and normalize
node scripts/processDocuments.js --validate   # Validate only
node scripts/processDocuments.js --index      # Update index only
node scripts/processDocuments.js --dry-run    # Preview changes
node scripts/processDocuments.js --help       # Show help
```

### Watcher Commands

```bash
# Start document watcher
npm run watch:docs

# Stop watcher
Ctrl+C
```

## API Integration

### Dog CEO API

**Base URL**: `https://dog.ceo/api`

**Endpoints Used:**
- `GET /breeds/list/all` - All dog breeds
- `GET /breed/{breed}/images/random/{count}` - Random breed images

**Rate Limits**: None (free tier)

### The Cat API

**Base URL**: `https://api.thecatapi.com/v1`

**Endpoints Used:**
- `GET /breeds` - All cat breeds with detailed info
- `GET /images/search` - Random cat images

**Rate Limits**: 10 requests/second (free tier)

## Configuration

### Environment Variables

Create a `.env` file (or use `.env.example`):

```env
VITE_DOG_API_URL=https://dog.ceo/api
VITE_CAT_API_URL=https://api.thecatapi.com/v1
```

### Customization

Edit these files to customize behavior:

**`src/services/breedDataIngestion.js`:**
- Adjust `MAX_RETRIES` (default: 4)
- Adjust `INITIAL_RETRY_DELAY` (default: 2000ms)

**`src/utils/dataFreshness.js`:**
- Adjust `FRESHNESS_THRESHOLDS` for each data type

**`scripts/processDocuments.js`:**
- Customize AI handoff header/footer templates

## Data Structure

### Breed Database Schema

```typescript
{
  dogs: {
    [slug: string]: {
      name: string;
      mainBreed: string;
      subBreed: string | null;
      slug: string;
      source: "dog.ceo";
      fetchedAt: string; // ISO 8601
    }
  },
  cats: {
    [id: string]: {
      name: string;
      description: string;
      temperament: string;
      origin: string;
      lifeSpan: string;
      weight: string;
      slug: string;
      source: "thecatapi.com";
      traits: {
        adaptability: number;      // 0-5
        affectionLevel: number;    // 0-5
        childFriendly: number;     // 0-5
        dogFriendly: number;       // 0-5
        energyLevel: number;       // 0-5
        grooming: number;          // 0-5
        healthIssues: number;      // 0-5
        intelligence: number;      // 0-5
        sheddingLevel: number;     // 0-5
        socialNeeds: number;       // 0-5
        strangerFriendly: number;  // 0-5
        vocalisation: number;      // 0-5
      };
      fetchedAt: string; // ISO 8601
    }
  },
  meta: {
    startedAt: string;
    completedAt: string;
    totalDogs: number;
    totalCats: number;
    errors: Array<{
      source: string;
      error: string;
      timestamp: string;
    }>;
    version: string;
  }
}
```

## Error Handling

### API Failures

The pipeline implements robust error handling:

1. **Exponential Backoff**: Retries with 2s, 4s, 8s, 16s delays
2. **Graceful Degradation**: Continues with partial data if one API fails
3. **Error Logging**: All errors recorded in `meta.errors`
4. **Validation**: Post-fetch validation ensures data quality

### Common Issues

**Issue**: `node-fetch is required`
**Solution**: Run `npm install` to install dependencies

**Issue**: `Failed to fetch breeds`
**Solution**: Check internet connection and API availability

**Issue**: `Quota exceeded` (localStorage)
**Solution**: Cache automatically cleared, or manually clear browser data

**Issue**: `Permission denied` on file write
**Solution**: Check file permissions in `src/data/` directory

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run specific test file
npm test dataValidation.test.js
npm test dataFreshness.test.js

# Run with coverage
npm run test:coverage

# Run in UI mode
npm run test:ui
```

**Test Coverage Goals:**
- Unit tests: 90%+ coverage
- Integration tests: Key workflows
- Validation tests: All validators
- Edge cases: Error scenarios

## Monitoring

### Health Checks

```bash
# Check breed data freshness
npm run ingest:stats

# Validate all data
npm run ingest:validate
npm run process:docs --validate
```

### Data Freshness Dashboard

Use the built-in utilities to monitor data health:

```javascript
import { checkBreedDataFreshness, getOverallHealth } from './src/utils/dataFreshness.js';
import breedData from './src/data/breedDatabase.json';

const breedCheck = checkBreedDataFreshness(breedData);
console.log(breedCheck);
// {
//   status: 'fresh',
//   level: 'success',
//   ageInDays: 5,
//   message: 'breed data is fresh (5 days old)'
// }
```

## Maintenance

### Scheduled Tasks

**Recommended Schedule:**

- **Daily**: Check data freshness
- **Weekly**: Refresh breed data
- **Monthly**: Full data audit and validation
- **Quarterly**: Review and update content

### Manual Refresh

```bash
# Refresh breed data
npm run ingest:breeds

# Validate everything
npm run ingest:validate
npm run process:docs --validate

# Update document index
npm run process:docs --index
```

## Troubleshooting

### Debug Mode

Enable verbose logging:

```bash
# Set environment variable
DEBUG=* npm run ingest:breeds
```

### Check Logs

All operations log to console with clear status indicators:
- ✓ Success
- ⚠ Warning
- ✗ Error
- 📝 Info
- 🔍 Debug

### Reset Data

```bash
# Remove breed database
rm src/data/breedDatabase.json

# Re-fetch from scratch
npm run ingest:breeds
```

## Performance

### Optimization Tips

1. **Cache Hit Rate**: Aim for 80%+ cache hits
2. **Bundle Size**: Keep breed database < 500 KB
3. **API Calls**: Minimize redundant fetches
4. **Processing**: Use `--dry-run` to preview changes

### Metrics

- **Breed Data Fetch**: ~30 seconds for all breeds
- **Document Processing**: ~5 seconds for 50 documents
- **Validation**: < 1 second for full validation
- **Cache Lookup**: < 10ms per image

## Security

### Data Safety

- **XSS Protection**: All content sanitized
- **Profanity Filter**: Family-friendly content only
- **API Keys**: Stored securely in `.env` (gitignored)
- **Validation**: Strict schema validation

### Best Practices

1. Never commit API keys to git
2. Validate all external data
3. Use HTTPS for API calls
4. Sanitize user inputs
5. Regular security audits

## Contributing

### Adding New Data Sources

1. Create ingestion service in `src/services/`
2. Add validation logic in `src/utils/dataValidation.js`
3. Create CLI tool in `scripts/`
4. Add npm script to `package.json`
5. Write tests
6. Update documentation

### Code Style

- ES6+ modules
- JSDoc comments
- Descriptive variable names
- Error handling on all async operations
- Comprehensive testing

## Support

### Documentation

- [Technical Specification](docs/technical/DATA_INGESTION_PIPELINE.md)
- [Main Roadmap](ROADMAP.md)
- [Agent Orchestration](AGENT_ORCHESTRATION.md)
- [Document Index](DOC_INDEX.md)

### Getting Help

1. Check this README
2. Review technical specification
3. Run `--help` flag on any script
4. Check existing issues on GitHub
5. Create new issue with details

## Changelog

### Version 1.0.0 (2025-11-17)

**Initial Release:**
- ✓ Breed data ingestion (dogs and cats)
- ✓ Document processing and normalization
- ✓ File watching system
- ✓ Data validation framework
- ✓ Freshness monitoring
- ✓ Comprehensive tests
- ✓ CLI tools with helpful output
- ✓ Error handling and retry logic
- ✓ Documentation

---

**Need Help?** Run any command with `--help` flag for detailed usage information.

**Questions?** See the [Technical Specification](docs/technical/DATA_INGESTION_PIPELINE.md) for architecture details.
