import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSizes, Shadows, LetterSpacing } from '../constants/theme';

type AnimatedButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const renderContent = () => {
    const textColor =
      variant === 'primary'
        ? Colors.background
        : variant === 'secondary'
        ? Colors.text
        : Colors.primary;

    return (
      <Text style={[styles.buttonText, { color: textColor }, textStyle, disabled && styles.disabledText]}>
        {title}
      </Text>
    );
  };

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[animatedStyle, style, disabled && styles.disabled]}
      >
        <LinearGradient
          colors={['#00F5FF', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  const getButtonStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return {
          ...styles.button,
          backgroundColor: Colors.glass,
          borderWidth: 1,
          borderColor: Colors.glassBorder,
        };
      case 'outline':
        return {
          ...styles.button,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: Colors.primary,
        };
      default:
        return styles.button;
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, getButtonStyle(), style, disabled && styles.disabled]}
    >
      {renderContent()}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  gradientButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...Shadows.glow,
  },
  buttonText: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    letterSpacing: LetterSpacing.wider,
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.4,
  },
  disabledText: {
    opacity: 0.7,
  },
});
