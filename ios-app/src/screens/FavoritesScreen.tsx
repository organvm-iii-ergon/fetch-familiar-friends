/**
 * FavoritesScreen
 * Display favorited pet images in a grid
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Trash2, Heart, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites, FavoriteItem } from '../hooks/useFavorites';
import IconButton from '../components/ui/IconButton';

const { width: screenWidth } = Dimensions.get('window');
const numColumns = 2;
const gap = 12;
const itemWidth = (screenWidth - 32 - gap) / numColumns;

export function FavoritesScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { favorites, removeFavorite, clearFavorites } = useFavorites();

  const backgroundColor = isDarkMode ? '#111827' : '#f9fafb';
  const headerBg = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subtitleColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const cardBg = isDarkMode ? '#1f2937' : '#ffffff';

  const renderItem = ({ item, index }: { item: FavoriteItem; index: number }) => (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(300)}
      layout={Layout.springify()}
      style={[
        styles.gridItem,
        { width: itemWidth, backgroundColor: cardBg },
      ]}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.itemOverlay}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: item.type === 'cat' ? '#a855f7' : '#fbbf24' },
          ]}
        >
          <Text style={styles.typeBadgeText}>
            {item.type === 'cat' ? 'Cat' : 'Dog'}
          </Text>
        </View>
        <Pressable
          onPress={() => removeFavorite(item.url)}
          style={styles.removeButton}
          accessibilityLabel="Remove from favorites"
        >
          <Trash2 size={16} color="#ef4444" />
        </Pressable>
      </View>
      {item.breed && (
        <View
          style={[
            styles.breedContainer,
            { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' },
          ]}
        >
          <Text
            style={[styles.breedText, { color: isDarkMode ? '#d1d5db' : '#374151' }]}
            numberOfLines={1}
          >
            {item.breed}
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconContainer,
          { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' },
        ]}
      >
        <Heart size={48} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
      </View>
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        No favorites yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: subtitleColor }]}>
        Tap the star on any pet image to save it here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg }]}>
        <View style={styles.headerLeft}>
          <IconButton
            onPress={() => navigation.goBack()}
            variant="ghost"
            isDark={isDarkMode}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={isDarkMode ? '#d1d5db' : '#374151'} />
          </IconButton>
          <Text style={[styles.title, { color: textColor }]}>Favorites</Text>
        </View>
        {favorites.length > 0 && (
          <Pressable
            onPress={clearFavorites}
            style={styles.clearButton}
            accessibilityLabel="Clear all favorites"
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </Pressable>
        )}
      </View>

      {/* Content */}
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.url}
        numColumns={numColumns}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={favorites.length > 1 ? styles.row : undefined}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  row: {
    gap: gap,
    marginBottom: gap,
  },
  gridItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  itemOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breedContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  breedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FavoritesScreen;
