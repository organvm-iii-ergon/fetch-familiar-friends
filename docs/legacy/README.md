# Legacy Applications Archive

This directory contains preserved versions of earlier iterations of the project before the current React-based DogTale Daily application was developed.

## AI Pawsitive Dog Care Schedule

**Branch**: `feature-secure-api-key`  
**Created**: October 25, 2025  
**Description**: A simple HTML-based dog care schedule application with Gemini AI integration for generating care recommendations.

### Files Preserved

- `ai-pawsitive-dog-care-schedule.html` - The complete standalone HTML application
- `ai-pawsitive-README.md` - Original setup instructions and documentation

### Key Features

- Standalone HTML page (no build process required)
- Tailwind CSS styling via CDN
- Gemini API integration for AI-powered care recommendations
- Animal print themed UI (leopard, giraffe, zebra, dots)
- Task management for dog care activities
- Config-based API key management (not committed to version control)

### Why Preserved

This represents an early prototype that took a different architectural approach (single-page HTML) compared to the current React-based application. It contains unique UI design patterns and Gemini AI integration code that may be useful for future reference or feature extraction.

### Usage

**⚠️ SECURITY WARNING**: This archived application exposes API keys in client-side JavaScript, which is a security vulnerability. This is preserved for historical reference only and should not be used as-is in production.

To run the preserved application (for reference only):

1. Open `ai-pawsitive-dog-care-schedule.html` in a web browser
2. Follow the setup instructions in `ai-pawsitive-README.md` for API key configuration
3. Note: The application expects a `config.js` file with a Gemini API key

**For production use**, implement proper API key security using:
- Server-side API proxy
- Environment variables
- OAuth authentication
- Backend API endpoints that handle sensitive keys

## Historical Context

The project evolved through several phases:

1. **Initial Concept** (Oct 25, 2025) - Simple HTML application with AI integration
2. **React Migration** (Oct 25-26, 2025) - Transition to React/Vite architecture
3. **Current Version** - Full-featured DogTale Daily with comprehensive documentation

All unique data from disparate branches has been preserved in this archive to maintain project history and enable potential feature reuse.

---

*Last updated: November 4, 2025*
