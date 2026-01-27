/**
 * IconButton Component
 * Pressable icon with animation
 */

import React from 'react';
import { Pressable, StyleSheet, ViewStyle, PressableProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type IconButtonVariant = 'default' | 'ghost' | 'filled';
export type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  style?: ViewStyle;
  isDark?: boolean;
}

export function IconButton({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  style,
  isDark = false,
  onPressIn,
  onPressOut,
  ...props
}: IconButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    onPressOut?.(e);
  };

  const variantStyle = isDark
    ? styles[`variant_${variant}_dark`]
    : styles[`variant_${variant}`];

  return (
    <AnimatedPressable
      style={[
        styles.base,
        styles[`size_${size}`],
        variantStyle,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  disabled: {
    opacity: 0.5,
  },

  // Sizes
  size_sm: {
    width: 32,
    height: 32,
  },
  size_md: {
    width: 40,
    height: 40,
  },
  size_lg: {
    width: 48,
    height: 48,
  },

  // Variants - Light
  variant_default: {
    backgroundColor: '#f3f4f6', // surface-100
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_filled: {
    backgroundColor: '#22c55e', // primary-500
  },

  // Variants - Dark
  variant_default_dark: {
    backgroundColor: '#374151', // surface-700
  },
  variant_ghost_dark: {
    backgroundColor: 'transparent',
  },
  variant_filled_dark: {
    backgroundColor: '#22c55e', // primary-500
  },
});

export default IconButton;
