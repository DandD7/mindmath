import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSizes, LetterSpacing } from '../constants/theme';
import type { GameMode } from '../types/game';

interface ModeCardProps {
  mode: GameMode;
  onPress: () => void;
  index: number;
  isFullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ModeCard({ mode, onPress, index, isFullWidth = false }: ModeCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const hasGradient = mode.gradientColors != null;
  const borderColor = `${mode.color}30`;
  const bgColor = `${mode.color}08`;
  const iconBgColor = `${mode.color}15`;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, isFullWidth ? styles.cardWrapperFull : styles.cardWrapper]}
    >
      <View style={[styles.card, { borderColor, backgroundColor: bgColor }]}>
        {/* Icon circle */}
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          {hasGradient ? (
            <LinearGradient
              colors={mode.gradientColors!}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Text style={[styles.iconText, { color: Colors.background }]}>
                {mode.icon}
              </Text>
            </LinearGradient>
          ) : (
            <Text style={[styles.iconText, { color: mode.color }]}>
              {mode.icon}
            </Text>
          )}
        </View>

        {/* Text content */}
        <Text style={[styles.modeName, { color: mode.color }]}>{mode.name}</Text>
        <Text style={styles.modeDescription}>{mode.description}</Text>

        {/* Bottom accent line */}
        {hasGradient ? (
          <LinearGradient
            colors={mode.gradientColors!}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentLine}
          />
        ) : (
          <View style={[styles.accentLine, { backgroundColor: mode.color }]} />
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  cardWrapperFull: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
    fontWeight: '700',
  },
  modeName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    letterSpacing: LetterSpacing.wide,
    marginBottom: 4,
    textAlign: 'center',
  },
  modeDescription: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    letterSpacing: LetterSpacing.wide,
    textAlign: 'center',
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.6,
  },
});
