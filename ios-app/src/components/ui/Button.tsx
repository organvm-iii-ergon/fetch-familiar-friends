/**
 * Button Component
 * Reusable button with variants and animations
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  style,
  textStyle,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    onPressOut?.(e);
  };

  const sizeStyles = styles[`size_${size}`];
  const variantStyles = styles[`variant_${variant}`];
  const variantTextStyles = styles[`text_${variant}`];

  return (
    <AnimatedPressable
      style={[
        styles.base,
        sizeStyles,
        variantStyles,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text
          style={[
            styles.text,
            styles[`textSize_${size}`],
            variantTextStyles,
            disabled && styles.textDisabled,
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Sizes
  size_sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  size_md: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  size_lg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  // Variants
  variant_primary: {
    backgroundColor: '#22c55e', // primary-500
  },
  variant_secondary: {
    backgroundColor: '#f3f4f6', // surface-100
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb', // surface-200
  },

  // Text styles
  text: {
    fontWeight: '600',
  },
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 14,
  },
  textSize_lg: {
    fontSize: 16,
  },
  text_primary: {
    color: '#ffffff',
  },
  text_secondary: {
    color: '#374151', // surface-700
  },
  text_ghost: {
    color: '#4b5563', // surface-600
  },
  text_outline: {
    color: '#4b5563', // surface-600
  },
  textDisabled: {
    opacity: 0.7,
  },
});

export default Button;
