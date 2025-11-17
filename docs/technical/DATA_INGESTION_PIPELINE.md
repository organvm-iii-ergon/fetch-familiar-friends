# Data Ingestion Pipeline - Technical Specification

**Status:** In Development
**Branch:** `claude/data-ingestion-pipeline-01X4TBgoR8eaCVTLHvVpGRir`
**Created:** November 2025

## Overview

The Data Ingestion Pipeline automates the collection, validation, and storage of external data sources to enhance the DogTale Daily application. This system reduces manual data entry, ensures data freshness, and improves overall data quality.

## Objectives

1. **Automate Breed Data Collection**: Systematically fetch and cache comprehensive breed information from external APIs
2. **Document Management**: Automate ingestion and normalization of ChatPRD documents
3. **Content Enrichment**: Expand static content (facts, quotes, moods) with external sources
4. **Data Quality**: Implement validation, deduplication, and freshness monitoring
5. **Performance**: Optimize API usage and cache hit rates

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                  Data Ingestion Pipeline                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Breed Data   │  │ Documentation│  │   Content    │      │
│  │  Ingestion   │  │  Ingestion   │  │  Enrichment  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  Data Validator │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  Storage Layer  │                        │
│                   │  (localStorage/ │                        │
│                   │   JSON files)   │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │ Analytics &     │                        │
│                   │ Monitoring      │                        │
│                   └─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Data Sources

### 1. External APIs

#### Dog CEO API
- **Endpoint**: `https://dog.ceo/api`
- **Resources**:
  - `/breeds/list/all` - Complete list of dog breeds
  - `/breed/{breed}/images` - Images for specific breed
  - `/breeds/image/random` - Random dog image
- **Rate Limits**: No official limits (free tier)
- **Data Format**: JSON

#### The Cat API
- **Endpoint**: `https://api.thecatapi.com/v1`
- **Resources**:
  - `/breeds` - Complete list of cat breeds with detailed information
  - `/images/search` - Search for cat images
- **Rate Limits**: 10 requests/second (free tier)
- **Data Format**: JSON

### 2. Internal Data Sources

#### ChatPRD Documents
- **Location**: `/ChatPRD/*.md`
- **Format**: Markdown with optional AI handoff headers
- **Processing**:
  - Normalize headers/footers
  - Extract metadata
  - Index for search

#### Static Content
- **Current Files**:
  - `src/utils/dailyContent.js` - Facts, moods, quotes
  - `src/utils/breedKnowledge.js` - Breed information
- **Enhancement Strategy**: Expand with external data

## Implementation Plan

### Phase 1: Breed Data Ingestion (Week 1)

#### 1.1 Create Breed Data Service
**File**: `src/services/breedDataIngestion.js`

**Responsibilities**:
- Fetch all breeds from Dog CEO API
- Fetch all breeds from Cat API
- Parse and normalize breed data
- Store in structured format
- Handle API errors and retries

**Output Format**:
```json
{
  "breeds": {
    "dogs": {
      "retriever-golden": {
        "name": "Golden Retriever",
        "images": ["url1", "url2"],
        "fetchedAt": "2025-11-17T...",
        "source": "dog.ceo"
      }
    },
    "cats": {
      "abyssinian": {
        "name": "Abyssinian",
        "description": "...",
        "temperament": "...",
        "origin": "...",
        "fetchedAt": "2025-11-17T...",
        "source": "thecatapi.com"
      }
    }
  },
  "meta": {
    "lastUpdated": "2025-11-17T...",
    "totalDogs": 150,
    "totalCats": 67,
    "version": "1.0.0"
  }
}
```

#### 1.2 Enhanced Breed Knowledge Database
**File**: `src/data/breedDatabase.json`

**Features**:
- Comprehensive breed information
- Searchable and filterable
- Versioned for updates
- Includes temperament, care needs, fun facts

#### 1.3 CLI Tool for Data Ingestion
**File**: `scripts/ingestBreedData.js`

**Usage**:
```bash
npm run ingest:breeds        # Fetch all breed data
npm run ingest:breeds --dogs # Dogs only
npm run ingest:breeds --cats # Cats only
npm run ingest:breeds --update # Update existing data
```

### Phase 2: Documentation Ingestion (Week 2)

#### 2.1 Document Processor
**File**: `scripts/processDocuments.js`

**Features**:
- Scan ChatPRD directory
- Validate markdown format
- Normalize AI handoff headers
- Extract metadata (title, date, tags)
- Generate document index

**AI Handoff Header Template**:
```markdown
<!-- AI Handoff Header -->
**AI Handoff Overview:** This document is structured for seamless agent transitions. Coordinate updates with the orchestration plan in `AGENT_ORCHESTRATION.md`.
<!-- /AI Handoff Header -->
```

**AI Handoff Footer Template**:
```markdown
<!-- AI Handoff Footer -->
**Next Steps:** Confirm alignment with `ROADMAP.md` and log cross-agent feedback before closing this document.
<!-- /AI Handoff Footer -->
```

#### 2.2 File Watcher
**File**: `scripts/watchDocuments.js`

**Features**:
- Monitor ChatPRD directory for changes
- Auto-process new files
- Validate on save
- Update document index

**Usage**:
```bash
npm run watch:docs  # Start file watcher
```

#### 2.3 Document Analytics
**File**: `scripts/documentAnalytics.js`

**Metrics**:
- Total documents
- Last modified dates
- Documents missing headers/footers
- Word counts
- Freshness score (days since last update)

**Output**: `docs/technical/DOCUMENT_ANALYTICS.json`

### Phase 3: Content Enrichment (Week 3)

#### 3.1 Content Expansion
**File**: `src/data/enrichedContent.json`

**Expand**:
- Dog/cat facts (target: 100+ each)
- Quotes (target: 100+)
- Moods with breed-specific variants
- Care tips and training advice

#### 3.2 External Content Sources
- Fetch from public APIs (if available)
- Curate from reliable sources
- Validate for accuracy
- Store with attribution

#### 3.3 Content Validation
**File**: `scripts/validateContent.js`

**Checks**:
- No duplicates
- Appropriate length
- Family-friendly content
- Proper formatting
- Source attribution

### Phase 4: Data Quality & Monitoring (Week 4)

#### 4.1 Validation Framework
**File**: `src/utils/dataValidation.js`

**Functions**:
- Schema validation
- Required field checks
- Type checking
- Range validation
- Custom validators

#### 4.2 Data Freshness Monitor
**File**: `src/utils/dataFreshness.js`

**Features**:
- Track last update times
- Alert on stale data (> 30 days)
- Auto-refresh suggestions
- Freshness dashboard

#### 4.3 Analytics Dashboard
**File**: `docs/technical/INGESTION_ANALYTICS.md`

**Metrics**:
- API call counts
- Cache hit/miss rates
- Data age distribution
- Error rates
- Storage usage

## Storage Strategy

### Local Storage (Browser)
- **Usage**: Image cache, user preferences
- **Limits**: ~5-10 MB per domain
- **TTL**: 7 days for images

### Static JSON Files
- **Usage**: Breed database, enriched content
- **Location**: `src/data/`
- **Version Control**: Committed to repository
- **Update Frequency**: Weekly/monthly via scripts

### Document Storage
- **Usage**: ChatPRD markdown files
- **Location**: `ChatPRD/` and `docs/`
- **Processing**: On-demand and via watcher
- **Index**: `DOC_INDEX.md` (auto-generated)

## Error Handling

### API Failures
1. **Exponential Backoff**: Retry with 2s, 4s, 8s, 16s delays
2. **Fallback Data**: Use cached/static data if API unavailable
3. **Logging**: Record all errors for analysis
4. **User Notification**: Graceful degradation with user feedback

### Validation Failures
1. **Strict Mode**: Reject invalid data in ingestion scripts
2. **Lenient Mode**: Log warnings but proceed in production
3. **Quarantine**: Store invalid data separately for review

### Storage Failures
1. **Quota Exceeded**: Clear old cache entries automatically
2. **Write Failures**: Log and alert developer
3. **Recovery**: Attempt to restore from backup

## Performance Considerations

### API Rate Limiting
- Respect API rate limits
- Implement request queuing
- Use caching aggressively
- Batch requests when possible

### Cache Strategy
- **Images**: Cache up to 50 recent images
- **Breed Data**: Cache full dataset (refreshed weekly)
- **Documents**: Index in memory, full text on-demand

### Bundle Size
- Keep static data files < 100 KB each
- Lazy load large datasets
- Compress JSON files
- Use code splitting

## Security & Privacy

### API Keys
- Store in `.env` files (gitignored)
- Use environment variables
- Rotate keys regularly
- Monitor usage

### Data Privacy
- No personal data in ingestion
- Public data sources only
- Attribution for external content
- Compliance with API ToS

### Content Safety
- Validate all external content
- Filter inappropriate material
- Family-friendly only
- Manual review for sensitive topics

## Monitoring & Maintenance

### Health Checks
```bash
npm run health:ingestion  # Check all data sources
npm run health:cache      # Check cache status
npm run health:docs       # Check document integrity
```

### Scheduled Tasks
- **Daily**: Cache cleanup, freshness check
- **Weekly**: Breed data refresh
- **Monthly**: Full data audit, analytics report

### Alerting
- Failed API calls (> 10 consecutive)
- Stale data (> 30 days)
- Storage quota warnings (> 90%)
- Validation failures

## Testing Strategy

### Unit Tests
- Data validation functions
- API client methods
- Cache operations
- Document processing

### Integration Tests
- End-to-end ingestion flows
- API mocking for reliability
- Storage operations
- Error recovery

### Performance Tests
- API response times
- Cache hit rates
- Bundle size limits
- Load testing

## Rollout Plan

### Week 1: Foundation
- [ ] Create ingestion service structure
- [ ] Implement breed data fetching
- [ ] Set up validation framework
- [ ] Basic error handling

### Week 2: Automation
- [ ] Build CLI ingestion tools
- [ ] Create file watcher
- [ ] Document processing
- [ ] Analytics foundation

### Week 3: Enhancement
- [ ] Content enrichment
- [ ] Advanced caching
- [ ] Monitoring dashboard
- [ ] Performance optimization

### Week 4: Polish
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Code review
- [ ] Deployment

## Success Metrics

### Data Quality
- **Target**: 99% valid data
- **Measure**: Validation pass rate

### Performance
- **Target**: 80% cache hit rate
- **Measure**: Cache analytics

### Freshness
- **Target**: All data < 30 days old
- **Measure**: Timestamp tracking

### Coverage
- **Target**: 150+ dog breeds, 70+ cat breeds
- **Measure**: Breed database size

### Automation
- **Target**: 100% automated ingestion
- **Measure**: Manual interventions per week

## Future Enhancements

### Phase 2 Features
- Real-time API integration
- User-submitted content
- Community-driven facts
- Multi-language support

### Scalability
- Backend API for data serving
- CDN for image delivery
- Database migration (MongoDB/PostgreSQL)
- GraphQL API

### Advanced Features
- ML-powered content recommendations
- Image recognition for breed identification
- Sentiment analysis for user content
- Predictive caching

## References

- [Dog CEO API Documentation](https://dog.ceo/dog-api/documentation/)
- [The Cat API Documentation](https://developers.thecatapi.com/)
- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Project Roadmap](../../ROADMAP.md)
- [Agent Orchestration](../../AGENT_ORCHESTRATION.md)

---

**Document Version**: 1.0.0
**Last Updated**: November 2025
**Maintained By**: @Claude Engineering Lead
