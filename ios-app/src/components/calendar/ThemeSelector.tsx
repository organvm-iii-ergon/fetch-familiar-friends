/**
 * ThemeSelector Component
 * Horizontal scrollable theme pills
 */

import React from 'react';
import {
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { themes, ThemeName, themeColors } from '../../contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ThemeSelectorProps {
  currentTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  isDark?: boolean;
}

interface ThemePillProps {
  theme: { name: string; label: string };
  isSelected: boolean;
  onPress: () => void;
  isDark: boolean;
}

function ThemePill({ theme, isSelected, onPress, isDark }: ThemePillProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const themeColor = themeColors[theme.name as ThemeName];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle]}
      accessibilityLabel={`Select ${theme.label} theme`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <View
        style={[
          styles.pill,
          isSelected
            ? { backgroundColor: themeColor.accent }
            : isDark
            ? styles.pillUnselectedDark
            : styles.pillUnselected,
        ]}
      >
        <Text
          style={[
            styles.pillText,
            isSelected
              ? styles.pillTextSelected
              : isDark
              ? styles.pillTextDark
              : styles.pillTextLight,
          ]}
        >
          {theme.label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

export function ThemeSelector({
  currentTheme,
  onThemeChange,
  isDark = false,
}: ThemeSelectorProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {themes.map((theme) => (
          <ThemePill
            key={theme.name}
            theme={theme}
            isSelected={currentTheme === theme.name}
            onPress={() => onThemeChange(theme.name as ThemeName)}
            isDark={isDark}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  pillUnselected: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb', // surface-200
  },
  pillUnselectedDark: {
    backgroundColor: '#1f2937', // surface-800
    borderWidth: 1,
    borderColor: '#374151', // surface-700
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: '#ffffff',
  },
  pillTextLight: {
    color: '#4b5563', // surface-600
  },
  pillTextDark: {
    color: '#d1d5db', // surface-300
  },
});

export default ThemeSelector;
