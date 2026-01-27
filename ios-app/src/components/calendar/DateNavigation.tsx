/**
 * DateNavigation Component
 * Previous/Today/Next navigation buttons
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  isDark?: boolean;
}

interface NavButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isDark: boolean;
  children: React.ReactNode;
  direction?: 'left' | 'right';
}

function NavButton({
  onPress,
  disabled = false,
  isDark,
  children,
  direction,
}: NavButtonProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      if (direction === 'left') {
        translateX.value = withSpring(-2, { damping: 15, stiffness: 300 });
      } else if (direction === 'right') {
        translateX.value = withSpring(2, { damping: 15, stiffness: 300 });
      }
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    translateX.value = withSpring(0, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, disabled && styles.disabled]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function DateNavigation({
  currentDate,
  onDateChange,
  isDark = false,
}: DateNavigationProps) {
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return currentDate.toDateString() === today.toDateString();
  };

  const isFuture = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);
    return current > today;
  };

  const iconColor = isDark ? '#d1d5db' : '#4b5563';
  const disabledColor = isDark ? '#4b5563' : '#d1d5db';

  return (
    <View style={styles.container}>
      {/* Previous Day */}
      <NavButton
        onPress={goToPreviousDay}
        isDark={isDark}
        direction="left"
      >
        <View
          style={[
            styles.navButton,
            isDark ? styles.navButtonDark : styles.navButtonLight,
          ]}
        >
          <ChevronLeft
            size={20}
            color={iconColor}
          />
          <Text
            style={[
              styles.navButtonText,
              isDark ? styles.navButtonTextDark : styles.navButtonTextLight,
            ]}
          >
            Previous
          </Text>
        </View>
      </NavButton>

      {/* Today Button */}
      <NavButton
        onPress={goToToday}
        disabled={isToday()}
        isDark={isDark}
      >
        <View
          style={[
            styles.todayButton,
            isToday()
              ? isDark
                ? styles.todayButtonDisabledDark
                : styles.todayButtonDisabled
              : styles.todayButtonActive,
          ]}
        >
          <Text
            style={[
              styles.todayButtonText,
              isToday()
                ? isDark
                  ? styles.todayButtonTextDisabledDark
                  : styles.todayButtonTextDisabled
                : styles.todayButtonTextActive,
            ]}
          >
            Today
          </Text>
        </View>
      </NavButton>

      {/* Next Day */}
      <NavButton
        onPress={goToNextDay}
        disabled={isFuture()}
        isDark={isDark}
        direction="right"
      >
        <View
          style={[
            styles.navButton,
            isDark ? styles.navButtonDark : styles.navButtonLight,
            isFuture() && styles.disabled,
          ]}
        >
          <Text
            style={[
              styles.navButtonText,
              isDark ? styles.navButtonTextDark : styles.navButtonTextLight,
              isFuture() && (isDark ? styles.textDisabledDark : styles.textDisabled),
            ]}
          >
            Next
          </Text>
          <ChevronRight
            size={20}
            color={isFuture() ? disabledColor : iconColor}
          />
        </View>
      </NavButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  navButtonLight: {
    backgroundColor: 'transparent',
  },
  navButtonDark: {
    backgroundColor: 'transparent',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  navButtonTextLight: {
    color: '#4b5563', // surface-600
  },
  navButtonTextDark: {
    color: '#d1d5db', // surface-300
  },
  todayButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  todayButtonActive: {
    backgroundColor: '#22c55e', // primary-500
  },
  todayButtonDisabled: {
    backgroundColor: '#f3f4f6', // surface-100
  },
  todayButtonDisabledDark: {
    backgroundColor: '#1f2937', // surface-800
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  todayButtonTextActive: {
    color: '#ffffff',
  },
  todayButtonTextDisabled: {
    color: '#9ca3af', // surface-400
  },
  todayButtonTextDisabledDark: {
    color: '#6b7280', // surface-500
  },
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: '#d1d5db', // surface-300
  },
  textDisabledDark: {
    color: '#4b5563', // surface-600
  },
});

export default DateNavigation;
