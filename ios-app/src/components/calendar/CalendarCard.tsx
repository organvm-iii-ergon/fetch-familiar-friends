/**
 * CalendarCard Component
 * Main daily pet image card with flip functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import {
  RefreshCw,
  Star,
  ChevronDown,
  BookOpen,
  Sparkles,
  Heart,
  AlertCircle,
} from 'lucide-react-native';
import { getAllDailyContent, DailyContent } from '../../utils/dailyContent';
import { fetchPetImage, PetImageResult } from '../../services/imageApi';
import { ThemeName, themeColors } from '../../contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: screenWidth } = Dimensions.get('window');

interface CalendarCardProps {
  date: Date;
  theme?: ThemeName;
  onJournalClick?: () => void;
  onFavoritesClick?: () => void;
  onFavoriteToggle?: (url: string, type: 'dog' | 'cat') => void;
  isFavorited?: boolean;
  journalEntry?: string | null;
  favoriteCount?: number;
  isDark?: boolean;
}

export function CalendarCard({
  date,
  theme = 'park',
  onJournalClick,
  onFavoritesClick,
  onFavoriteToggle,
  isFavorited = false,
  journalEntry = null,
  favoriteCount = 0,
  isDark = false,
}: CalendarCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageData, setImageData] = useState<PetImageResult | null>(null);
  const [dailyContent, setDailyContent] = useState<DailyContent | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = themeColors[theme];
  const flipRotation = useSharedValue(0);

  // Fetch daily image
  useEffect(() => {
    const fetchDailyImage = async () => {
      setLoading(true);
      setError(null);

      const imageType = isFlipped ? 'cat' : 'dog';

      try {
        const result = await fetchPetImage(imageType, { useFallback: true });
        setImageData(result);

        if (result.isFallback) {
          setError(result.error || 'Using fallback image');
        }
      } catch (err) {
        setError('Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    fetchDailyImage();
  }, [isFlipped, date]);

  // Load daily content
  useEffect(() => {
    const content = getAllDailyContent(date, isFlipped);
    setDailyContent(content);
  }, [date, isFlipped]);

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleFlip = () => {
    flipRotation.value = withSpring(flipRotation.value + 180, {
      damping: 15,
      stiffness: 100,
    });
    setIsFlipped(!isFlipped);
  };

  const handleFavoriteClick = () => {
    if (imageData?.url && onFavoriteToggle) {
      onFavoriteToggle(imageData.url, isFlipped ? 'cat' : 'dog');
    }
  };

  const flipIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${flipRotation.value}deg` }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: showContent ? '180deg' : '0deg' }],
  }));

  return (
    <Animated.View
      style={[styles.container]}
      entering={FadeIn.duration(400)}
    >
      <View
        style={[
          styles.card,
          isDark ? styles.cardDark : styles.cardLight,
          { borderColor: isDark ? colors.borderDark : colors.border },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            isDark ? styles.headerBorderDark : styles.headerBorderLight,
          ]}
        >
          <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
            {formatDate()}
          </Text>
          <AnimatedPressable
            onPress={handleFlip}
            style={[styles.flipButton, flipIconStyle]}
            accessibilityLabel={`Flip to show ${isFlipped ? 'dog' : 'cat'}`}
          >
            <RefreshCw size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          </AnimatedPressable>
        </View>

        {/* Image Container */}
        <View style={styles.imageContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : error && !imageData?.url ? (
            <View style={styles.errorContainer}>
              <View
                style={[
                  styles.errorIconBg,
                  isDark ? styles.errorIconBgDark : styles.errorIconBgLight,
                ]}
              >
                <AlertCircle
                  size={32}
                  color={isDark ? '#9ca3af' : '#6b7280'}
                />
              </View>
              <Text
                style={[styles.errorText, isDark && styles.errorTextDark]}
              >
                {error}
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageData?.url }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
          )}

          {/* Mode Badge */}
          <View
            style={[
              styles.modeBadge,
              {
                backgroundColor: isDark ? colors.badgeDark : colors.badge,
              },
            ]}
          >
            <View
              style={[
                styles.modeDot,
                { backgroundColor: isFlipped ? '#a855f7' : '#fbbf24' },
              ]}
            />
            <Text
              style={[
                styles.modeBadgeText,
                { color: isDark ? colors.textDark : colors.text },
              ]}
            >
              {isFlipped ? 'Cat Mode' : 'Dog Mode'}
            </Text>
          </View>

          {/* Breed Badge */}
          {imageData?.breed && !loading && !error && (
            <View style={styles.breedBadge}>
              <Star size={14} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.breedText}>{imageData.breed}</Text>
            </View>
          )}

          {/* Favorite Button */}
          {!loading && !error && (
            <Pressable
              onPress={handleFavoriteClick}
              style={[
                styles.favoriteButton,
                isDark
                  ? styles.favoriteButtonDark
                  : styles.favoriteButtonLight,
              ]}
              accessibilityLabel={
                isFavorited ? 'Remove from favorites' : 'Add to favorites'
              }
            >
              <Star
                size={20}
                color={isFavorited ? '#f59e0b' : '#9ca3af'}
                fill={isFavorited ? '#f59e0b' : 'none'}
              />
            </Pressable>
          )}
        </View>

        {/* Action Buttons */}
        <View
          style={[
            styles.actionsContainer,
            isDark ? styles.actionsBorderDark : styles.actionsBorderLight,
          ]}
        >
          <Pressable
            onPress={onJournalClick}
            style={[
              styles.actionButton,
              isDark ? styles.actionButtonDark : styles.actionButtonLight,
            ]}
            accessibilityLabel="Open journal"
          >
            <BookOpen size={20} color={isDark ? '#d1d5db' : '#374151'} />
            <Text
              style={[
                styles.actionButtonText,
                isDark && styles.actionButtonTextDark,
              ]}
            >
              Journal
            </Text>
          </Pressable>

          <Pressable
            onPress={onFavoritesClick}
            style={[
              styles.actionButton,
              isDark ? styles.actionButtonDark : styles.actionButtonLight,
            ]}
            accessibilityLabel={`Open favorites, ${favoriteCount} items`}
          >
            <Heart size={20} color={isDark ? '#d1d5db' : '#374151'} />
            <Text
              style={[
                styles.actionButtonText,
                isDark && styles.actionButtonTextDark,
              ]}
            >
              Favorites
            </Text>
            {favoriteCount > 0 && (
              <View style={styles.favoriteBadge}>
                <Text style={styles.favoriteBadgeText}>{favoriteCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Daily Content */}
        {dailyContent && (
          <View style={styles.contentSection}>
            {/* Mood */}
            <View
              style={[
                styles.moodCard,
                isDark ? styles.moodCardDark : styles.moodCardLight,
              ]}
            >
              <Text style={styles.moodEmoji}>{dailyContent.mood.emoji}</Text>
              <View style={styles.moodTextContainer}>
                <Text style={[styles.moodTitle, { color: colors.accent }]}>
                  {dailyContent.mood.text}
                </Text>
                <Text
                  style={[
                    styles.moodDescription,
                    isDark && styles.moodDescriptionDark,
                  ]}
                >
                  {dailyContent.mood.description}
                </Text>
              </View>
            </View>

            {/* Expandable Fact & Quote */}
            <Pressable
              onPress={() => setShowContent(!showContent)}
              style={[
                styles.expandButton,
                isDark ? styles.expandButtonDark : styles.expandButtonLight,
              ]}
              accessibilityLabel="Toggle fun fact and quote"
              accessibilityState={{ expanded: showContent }}
            >
              <View style={styles.expandButtonContent}>
                <Sparkles size={16} color={colors.accent} />
                <Text
                  style={[
                    styles.expandButtonText,
                    isDark && styles.expandButtonTextDark,
                  ]}
                >
                  Fun Fact & Quote
                </Text>
              </View>
              <Animated.View style={chevronStyle}>
                <ChevronDown size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              </Animated.View>
            </Pressable>

            {showContent && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={[
                  styles.expandedContent,
                  isDark
                    ? styles.expandedContentDark
                    : styles.expandedContentLight,
                ]}
              >
                <View style={styles.factSection}>
                  <Text
                    style={[
                      styles.sectionLabel,
                      isDark && styles.sectionLabelDark,
                    ]}
                  >
                    DID YOU KNOW?
                  </Text>
                  <Text
                    style={[styles.factText, isDark && styles.factTextDark]}
                  >
                    {dailyContent.fact}
                  </Text>
                </View>
                <View
                  style={[
                    styles.quoteDivider,
                    isDark ? styles.quoteDividerDark : styles.quoteDividerLight,
                  ]}
                />
                <View style={styles.quoteSection}>
                  <Text
                    style={[
                      styles.sectionLabel,
                      isDark && styles.sectionLabelDark,
                    ]}
                  >
                    QUOTE OF THE DAY
                  </Text>
                  <Text
                    style={[styles.quoteText, isDark && styles.quoteTextDark]}
                  >
                    "{dailyContent.quote}"
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        )}

        {/* Journal Entry Preview */}
        {journalEntry && (
          <View style={styles.journalPreview}>
            <View
              style={[
                styles.journalCard,
                isDark ? styles.journalCardDark : styles.journalCardLight,
              ]}
            >
              <Text
                style={[
                  styles.sectionLabel,
                  isDark && styles.sectionLabelDark,
                ]}
              >
                YOUR NOTE
              </Text>
              <Text
                style={[
                  styles.journalText,
                  isDark && styles.journalTextDark,
                ]}
                numberOfLines={2}
              >
                {journalEntry}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardLight: {
    backgroundColor: '#ffffff',
  },
  cardDark: {
    backgroundColor: '#1f2937',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerBorderLight: {
    borderBottomColor: '#f3f4f6',
  },
  headerBorderDark: {
    borderBottomColor: '#374151',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  dateTextDark: {
    color: '#ffffff',
  },
  flipButton: {
    padding: 8,
    borderRadius: 12,
  },

  // Image
  imageContainer: {
    aspectRatio: 4 / 3,
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  errorIconBg: {
    padding: 12,
    borderRadius: 24,
  },
  errorIconBgLight: {
    backgroundColor: '#e5e7eb',
  },
  errorIconBgDark: {
    backgroundColor: '#374151',
  },
  errorText: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  errorTextDark: {
    color: '#9ca3af',
  },

  // Badges
  modeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  breedBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  breedText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 10,
    borderRadius: 20,
  },
  favoriteButtonLight: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  favoriteButtonDark: {
    backgroundColor: 'rgba(31,41,55,0.9)',
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  actionsBorderLight: {
    borderTopColor: '#f3f4f6',
  },
  actionsBorderDark: {
    borderTopColor: '#374151',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    position: 'relative',
  },
  actionButtonLight: {
    backgroundColor: '#f9fafb',
  },
  actionButtonDark: {
    backgroundColor: 'rgba(55,65,81,0.5)',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  actionButtonTextDark: {
    color: '#e5e7eb',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#22c55e',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Content Section
  contentSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  moodCardLight: {
    backgroundColor: '#f9fafb',
  },
  moodCardDark: {
    backgroundColor: 'rgba(55,65,81,0.5)',
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodTextContainer: {
    flex: 1,
  },
  moodTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  moodDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  moodDescriptionDark: {
    color: '#9ca3af',
  },

  // Expandable
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  expandButtonLight: {
    backgroundColor: '#f9fafb',
  },
  expandButtonDark: {
    backgroundColor: 'rgba(55,65,81,0.5)',
  },
  expandButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  expandButtonTextDark: {
    color: '#e5e7eb',
  },
  expandedContent: {
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  expandedContentLight: {
    backgroundColor: '#f9fafb',
  },
  expandedContentDark: {
    backgroundColor: 'rgba(55,65,81,0.5)',
  },
  factSection: {},
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionLabelDark: {
    color: '#6b7280',
  },
  factText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  factTextDark: {
    color: '#e5e7eb',
  },
  quoteDivider: {
    height: 1,
  },
  quoteDividerLight: {
    backgroundColor: '#e5e7eb',
  },
  quoteDividerDark: {
    backgroundColor: '#4b5563',
  },
  quoteSection: {},
  quoteText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  quoteTextDark: {
    color: '#e5e7eb',
  },

  // Journal Preview
  journalPreview: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  journalCard: {
    padding: 16,
    borderRadius: 12,
  },
  journalCardLight: {
    backgroundColor: '#f9fafb',
  },
  journalCardDark: {
    backgroundColor: 'rgba(55,65,81,0.5)',
  },
  journalText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  journalTextDark: {
    color: '#d1d5db',
  },
});

export default CalendarCard;
