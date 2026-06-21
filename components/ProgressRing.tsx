import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Fonts, LetterSpacing } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  timeRemaining: number;
  totalTime: number;
}

export default function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 6,
  timeRemaining,
  totalTime,
}: ProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 800 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  // Determine color based on time
  const isUrgent = timeRemaining <= 10;
  const isCritical = timeRemaining <= 5;

  // Glow intensity increases as time runs out
  const glowOpacity = isUrgent ? 0.7 : 0.4;
  const glowRadius = isCritical ? 20 : isUrgent ? 14 : 10;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow effect */}
      <View
        style={[
          styles.glowOuter,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
            shadowColor: isUrgent ? Colors.incorrect : Colors.primary,
            shadowOpacity: glowOpacity,
            shadowRadius: glowRadius,
          },
        ]}
      />

      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <SvgGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop
              offset="0%"
              stopColor={isUrgent ? '#FF4E6A' : '#00F5FF'}
              stopOpacity="1"
            />
            <Stop
              offset="100%"
              stopColor={isUrgent ? '#FF1744' : '#8B5CF6'}
              stopOpacity="1"
            />
          </SvgGradient>
        </Defs>

        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(0, 245, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>

      {/* Timer text in center */}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.timerValue,
            { color: isUrgent ? Colors.incorrect : Colors.primary },
            totalTime > 60 && styles.timerValueSmall,
          ]}
        >
          {totalTime > 60
            ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`
            : timeRemaining}
        </Text>
        <Text style={styles.timerUnit}>{totalTime > 60 ? 'MIN' : 'SEC'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerValue: {
    fontSize: 32,
    fontWeight: '200',
    fontFamily: Fonts.mono,
    letterSpacing: LetterSpacing.wide,
  },
  timerValueSmall: {
    fontSize: 24,
  },
  timerUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textLight,
    letterSpacing: LetterSpacing.widest,
    marginTop: -2,
  },
});
