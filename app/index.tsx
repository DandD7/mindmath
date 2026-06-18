import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AnimatedButton from '../components/AnimatedButton';
import { Colors, Spacing, FontSizes, BorderRadius, LetterSpacing } from '../constants/theme';
import { GAME_MODES, FULL_CHALLENGE_MODE_ID } from '../types/game';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function HeroCard({ onPress }: { onPress: () => void }) {
  const pulse = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + pulse.value * 0.4,
    shadowRadius: 12 + pulse.value * 8,
  }));

  const buttonPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.03 }],
    shadowOpacity: 0.4 + pulse.value * 0.3,
    shadowRadius: 10 + pulse.value * 6,
  }));

  const cardScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={cardScale}
    >
      <Animated.View style={[styles.heroCardOuter, pulseStyle]}>
        <LinearGradient
          colors={['#1A0A3E', '#0D1B2A', '#1A0A3E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCardGradient}
        >
          {/* Glow overlay */}
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.15)', 'rgba(255, 200, 55, 0.08)', 'rgba(139, 92, 246, 0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Badge */}
          <View style={styles.heroBadgeContainer}>
            <LinearGradient
              colors={['#FFC837', '#FF8008']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBadge}
            >
              <Text style={styles.heroBadgeText}>5 MIN</Text>
            </LinearGradient>
          </View>

          {/* Content */}
          <View style={styles.heroContent}>
            <Text style={styles.heroIcon}>⚡</Text>
            <Text style={styles.heroTitle}>FULL MINDMATH</Text>
            <Text style={styles.heroTitleSecondary}>CHALLENGE</Text>
          </View>

          {/* Start Button */}
          <Animated.View style={[styles.heroButtonWrapper, buttonPulseStyle]}>
            <LinearGradient
              colors={['#FFC837', '#FF8008']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroButton}
            >
              <Text style={styles.heroButtonText}>START TEST</Text>
            </LinearGradient>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </AnimatedPressable>
  );
}

function TrainingCard({
  mode,
  onPress,
}: {
  mode: typeof GAME_MODES[number];
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.94, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const hasGradient = mode.gradientColors != null;
  const borderColor = `${mode.color}30`;
  const bgColor = `${mode.color}08`;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, styles.trainingCardWrapper]}
    >
      <View style={[styles.trainingCard, { borderColor, backgroundColor: bgColor }]}>
        {/* Time Badge */}
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>1 MIN PRACTICE</Text>
        </View>

        {/* Icon */}
        <View style={[styles.trainingIconContainer, { backgroundColor: `${mode.color}15` }]}>
          {hasGradient ? (
            <LinearGradient
              colors={mode.gradientColors!}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.trainingIconGradient}
            >
              <Text style={[styles.trainingIconText, { color: Colors.background }]}>
                {mode.icon}
              </Text>
            </LinearGradient>
          ) : (
            <Text style={[styles.trainingIconText, { color: mode.color }]}>
              {mode.icon}
            </Text>
          )}
        </View>

        {/* Text */}
        <Text style={[styles.trainingName, { color: mode.color }]}>{mode.name}</Text>

        {/* Bottom accent */}
        {hasGradient ? (
          <LinearGradient
            colors={mode.gradientColors!}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.trainingAccent}
          />
        ) : (
          <View style={[styles.trainingAccent, { backgroundColor: mode.color }]} />
        )}
      </View>
    </AnimatedPressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const handleFullChallenge = () => {
    router.push({ pathname: '/game', params: { mode: FULL_CHALLENGE_MODE_ID } });
  };

  const handleTrainingSelect = (modeId: string) => {
    router.push({ pathname: '/game', params: { mode: modeId } });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[Colors.background, '#0F1520', Colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
            <Text style={styles.title}>Mindmath</Text>
            <Text style={styles.subtitle}>Command Center</Text>
          </Animated.View>

          {/* Hero Section - Full Challenge */}
          <Animated.View entering={FadeInDown.duration(700).delay(200)}>
            <HeroCard onPress={handleFullChallenge} />
          </Animated.View>

          {/* Training Lab Section */}
          <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>TRAINING LAB</Text>
              <View style={styles.sectionDivider} />
            </View>
            <Text style={styles.sectionDescription}>
              Specialized 1-minute drills to sharpen individual skills
            </Text>
          </Animated.View>

          {/* Training Grid */}
          <Animated.View entering={FadeInDown.duration(600).delay(500)} style={styles.trainingGrid}>
            {GAME_MODES.map((mode) => (
              <TrainingCard
                key={mode.id}
                mode={mode}
                onPress={() => handleTrainingSelect(mode.id)}
              />
            ))}
          </Animated.View>

          {/* Bottom Buttons */}
          <Animated.View entering={FadeInDown.duration(600).delay(700)} style={styles.buttonContainer}>
            <AnimatedButton
              title="History"
              onPress={() => router.push('/history')}
              variant="secondary"
              style={styles.button}
            />
            <AnimatedButton
              title="About"
              onPress={() => router.push('/about')}
              variant="outline"
              style={styles.button}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: '300',
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: LetterSpacing.widest,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    textAlign: 'center',
    letterSpacing: LetterSpacing.wider,
    textTransform: 'uppercase',
  },
  // Hero Card
  heroCardOuter: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: Spacing.xl,
  },
  heroCardGradient: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBadgeContainer: {
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  heroBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  heroBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
    color: '#1A0A3E',
    letterSpacing: LetterSpacing.wider,
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroIcon: {
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '200',
    color: Colors.text,
    letterSpacing: LetterSpacing.widest,
    textAlign: 'center',
  },
  heroTitleSecondary: {
    fontSize: FontSizes.xxl,
    fontWeight: '200',
    color: '#FFC837',
    letterSpacing: LetterSpacing.widest,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 200, 55, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  heroDescription: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  heroButtonWrapper: {
    borderRadius: BorderRadius.md,
    shadowColor: '#FFC837',
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  heroButton: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  heroButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#1A0A3E',
    letterSpacing: LetterSpacing.wider,
  },
  // Section Header
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: LetterSpacing.widest,
    marginRight: Spacing.md,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 245, 255, 0.15)',
  },
  sectionDescription: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    letterSpacing: LetterSpacing.wide,
  },
  // Training Grid
  trainingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  trainingCardWrapper: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  trainingCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl + Spacing.sm,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'center',
    position: 'relative',
  },
  timeBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.15)',
  },
  timeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: LetterSpacing.wide,
  },
  trainingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  trainingIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainingIconText: {
    fontSize: 22,
    fontWeight: '700',
  },
  trainingName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: LetterSpacing.wide,
    marginBottom: 3,
    textAlign: 'center',
  },
  trainingAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.6,
  },
  // Buttons
  buttonContainer: {
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  },
});
