/**
 * Card Component
 * Container component with consistent styling
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animated?: boolean;
  style?: ViewStyle;
  isDark?: boolean;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  animated = false,
  style,
  isDark = false,
  ...props
}: CardProps) {
  const Container = animated ? Animated.View : View;
  const animationProps = animated ? { entering: FadeIn.duration(300) } : {};

  return (
    <Container
      style={[
        styles.base,
        styles[`padding_${padding}`],
        styles[`variant_${variant}`],
        isDark && styles[`variant_${variant}_dark`],
        style,
      ]}
      {...animationProps}
      {...props}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Padding
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: 12,
  },
  padding_md: {
    padding: 16,
  },
  padding_lg: {
    padding: 24,
  },

  // Variants - Light mode
  variant_default: {
    backgroundColor: '#ffffff',
  },
  variant_elevated: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  variant_outlined: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb', // surface-200
  },

  // Variants - Dark mode
  variant_default_dark: {
    backgroundColor: '#1f2937', // surface-800
  },
  variant_elevated_dark: {
    backgroundColor: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  variant_outlined_dark: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151', // surface-700
  },
});

export default Card;
