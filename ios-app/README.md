# DogTale Daily - iOS App

React Native / Expo implementation of the DogTale Daily pet calendar app.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS Simulator
npm run ios
```

## Project Structure

```
ios-app/
├── App.tsx                 # Main entry with navigation
├── src/
│   ├── components/
│   │   ├── calendar/       # CalendarCard, DateNavigation, ThemeSelector
│   │   └── ui/             # Button, Card, IconButton
│   ├── contexts/
│   │   └── ThemeContext    # Theme and dark mode management
│   ├── hooks/
│   │   ├── useDarkMode     # Dark mode preference
│   │   ├── useFavorites    # Favorite images persistence
│   │   └── useJournal      # Journal entries persistence
│   ├── screens/
│   │   ├── HomeScreen      # Main daily view
│   │   ├── FavoritesScreen # Favorited images grid
│   │   └── JournalScreen   # Journal entry editor
│   ├── services/
│   │   └── imageApi        # Pet image API with rate limiting
│   └── utils/
│       ├── dailyContent    # Daily facts, moods, quotes
│       └── storage         # AsyncStorage wrapper
└── assets/                 # App icons and splash screen
```

## Features (MVP)

- Daily pet image viewer (dog/cat flip)
- Date navigation (previous/today/next)
- 8 theme options
- Favorites with persistence
- Journal entries with persistence
- Dark mode support

## Tech Stack

- **Framework**: Expo SDK 54 + React Native 0.81
- **Navigation**: React Navigation Stack
- **Styling**: NativeWind (Tailwind for React Native)
- **Animations**: React Native Reanimated 3
- **Storage**: AsyncStorage
- **Images**: expo-image with caching
- **Icons**: lucide-react-native

## Development

```bash
# Type check
npm run typecheck

# Build for iOS
npm run build:ios

# Build for Android
npm run build:android
```

## Configuration

- `app.json` - Expo configuration
- `tailwind.config.js` - NativeWind theme customization
- `babel.config.js` - Babel with NativeWind + Reanimated plugins
- `metro.config.js` - Metro bundler with NativeWind support
