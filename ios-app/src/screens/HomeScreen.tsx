/**
 * HomeScreen
 * Main screen with daily pet card and navigation
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Text,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Moon, Sun, Settings } from 'lucide-react-native';
import { useTheme, ThemeName } from '../contexts/ThemeContext';
import { useFavorites } from '../hooks/useFavorites';
import { useJournal } from '../hooks/useJournal';
import CalendarCard from '../components/calendar/CalendarCard';
import DateNavigation from '../components/calendar/DateNavigation';
import ThemeSelector from '../components/calendar/ThemeSelector';
import IconButton from '../components/ui/IconButton';

type RootStackParamList = {
  Home: undefined;
  Favorites: undefined;
  Journal: { date: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme, setTheme, isDarkMode, toggleDarkMode } = useTheme();
  const { favorites, isFavorited, toggleFavorite, favoriteCount } = useFavorites();
  const { getEntry } = useJournal();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const journalEntry = getEntry(currentDate);

  const handleJournalClick = () => {
    navigation.navigate('Journal', { date: currentDate.toISOString() });
  };

  const handleFavoritesClick = () => {
    navigation.navigate('Favorites');
  };

  const handleFavoriteToggle = (url: string, type: 'dog' | 'cat') => {
    setCurrentImageUrl(url);
    toggleFavorite(url, type);
  };

  const backgroundColor = isDarkMode ? '#111827' : '#f9fafb';
  const headerBg = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subtitleColor = isDarkMode ? '#9ca3af' : '#6b7280';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={headerBg}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: textColor }]}>DogTale Daily</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            Your daily dose of cuteness
          </Text>
        </View>
        <View style={styles.headerRight}>
          <IconButton
            onPress={toggleDarkMode}
            variant="ghost"
            isDark={isDarkMode}
            accessibilityLabel={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <Sun size={20} color="#fbbf24" />
            ) : (
              <Moon size={20} color="#6b7280" />
            )}
          </IconButton>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Selector */}
        <ThemeSelector
          currentTheme={theme}
          onThemeChange={(newTheme: ThemeName) => setTheme(newTheme)}
          isDark={isDarkMode}
        />

        {/* Date Navigation */}
        <DateNavigation
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          isDark={isDarkMode}
        />

        {/* Calendar Card */}
        <CalendarCard
          date={currentDate}
          theme={theme}
          onJournalClick={handleJournalClick}
          onFavoritesClick={handleFavoritesClick}
          onFavoriteToggle={handleFavoriteToggle}
          isFavorited={currentImageUrl ? isFavorited(currentImageUrl) : false}
          journalEntry={journalEntry?.content}
          favoriteCount={favoriteCount}
          isDark={isDarkMode}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {},
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
});

export default HomeScreen;
