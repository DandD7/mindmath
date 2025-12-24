import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../constants/theme';
import { getTestSessionById } from '../utils/storage';
import type { TestSession } from '../types/game';
import { ROUNDS } from '../types/game';

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<TestSession | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      if (params.sessionId) {
        const loadedSession = await getTestSessionById(params.sessionId);
        setSession(loadedSession);
      }
    };
    loadSession();
  }, [params.sessionId]);

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxDifficultyCount = Math.max(
    ...Object.values(session.difficultyProfile).map((count) => count as number),
    1
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.card}>
          <Text style={styles.title}>Test Complete! 🎉</Text>

          {/* Total Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Total Weighted Score</Text>
            <Text style={styles.scoreValue}>{session.totalWeightedScore}</Text>
          </View>

          {/* Round Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Round Breakdown</Text>
            <View style={styles.roundsList}>
              {ROUNDS.map((round, index) => {
                const roundResult = session.roundResults.find(
                  (r) => r.operation === round.operation
                );
                return (
                  <Animated.View
                    key={round.id}
                    entering={FadeInDown.duration(400).delay(200 + index * 100)}
                    style={styles.roundItem}
                  >
                    <Text style={styles.roundName}>{round.name}</Text>
                    <Text style={styles.roundScore}>
                      {roundResult?.correctAnswers || 0} correct
                    </Text>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          {/* Difficulty Profile */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Difficulty Profile</Text>
            <View style={styles.chartContainer}>
              {[1, 2, 3, 4].map((level, index) => {
                const count = session.difficultyProfile[level] || 0;
                const percentage = (count / maxDifficultyCount) * 100;

                return (
                  <Animated.View
                    key={level}
                    entering={FadeInDown.duration(400).delay(400 + index * 100)}
                    style={styles.chartRow}
                  >
                    <Text style={styles.chartLabel}>Level {level}</Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.chartValue}>{count}</Text>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View entering={FadeInDown.duration(400).delay(800)} style={styles.buttonContainer}>
          <AnimatedButton
            title="Play Again"
            onPress={() => router.replace('/game')}
            style={styles.button}
          />
          <AnimatedButton
            title="Return Home"
            onPress={() => router.replace('/')}
            variant="secondary"
            style={styles.button}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.textLight,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  scoreLabel: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  scoreValue: {
    fontSize: FontSizes.xxxl * 1.5,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  roundsList: {
    gap: Spacing.sm,
  },
  roundItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  roundName: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  roundScore: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  chartContainer: {
    gap: Spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  chartLabel: {
    fontSize: FontSizes.md,
    color: Colors.text,
    width: 60,
  },
  barContainer: {
    flex: 1,
    height: 32,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  chartValue: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  },
});
