import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../constants/theme';

interface DifficultyIndicatorProps {
  level: number; // 1-4
  maxLevel?: number;
  didIncrease: boolean; // triggers glow pulse when difficulty increases
}

export default function DifficultyIndicator({
  level,
  maxLevel = 4,
  didIncrease,
}: DifficultyIndicatorProps) {
  const glowIntensity = useSharedValue(0);
  const barWidth = useSharedValue(level / maxLevel);

  useEffect(() => {
    barWidth.value = withTiming(level / maxLevel, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [level, maxLevel, barWidth]);

  useEffect(() => {
    if (didIncrease) {
      // Pulse glow when difficulty increases
      glowIntensity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withRepeat(
          withSequence(
            withTiming(0.4, { duration: 600 }),
            withTiming(1, { duration: 600 })
          ),
          2,
          true
        ),
        withTiming(0, { duration: 400 })
      );
    }
  }, [didIncrease, glowIntensity]);

  const barAnimatedStyle = useAnimatedStyle(() => {
    return {
      flex: barWidth.value,
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
    shadowOpacity: glowIntensity.value * 0.8,
  }));

  const getGradientColors = (): [string, string] => {
    if (level <= 1) return ['#00F5FF', '#00D4FF'];
    if (level === 2) return ['#00F5FF', '#00F5A0'];
    if (level === 3) return ['#00F5A0', '#8B5CF6'];
    return ['#8B5CF6', '#FF4E6A'];
  };

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.barWrapper, barAnimatedStyle]}>
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bar}
          />
        </Animated.View>
      </View>
      {/* Glow overlay for difficulty increase feedback */}
      <Animated.View style={[styles.glowOverlay, glowAnimatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 4,
    width: '100%',
    position: 'relative',
  },
  track: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(0, 245, 255, 0.06)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  barWrapper: {
    height: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    width: '100%',
    borderRadius: BorderRadius.full,
  },
  glowOverlay: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: 'transparent',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
});
