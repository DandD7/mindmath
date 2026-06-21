import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from '../components/LinearGradient';
import Animated, {
  FadeInUp,
} from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import GlassCard from '../components/GlassCard';
import DifficultyTimeline from '../components/DifficultyTimeline';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows, Fonts, LetterSpacing } from '../constants/theme';
import { getTestSessionById, getTestHistory } from '../utils/storage';
import { getOperationDisplayName } from '../utils/gameLogic';
import type { TestSession } from '../types/game';
import { GAME_MODES, FULL_CHALLENGE_MODE_ID } from '../types/game';


function NewBestBadge() {
  return (
    <View style={styles.newBestBadge}>
      <LinearGradient
        colors={['#00F5FF', '#8B5CF6', '#00F5A0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.newBestGradient}
      >
        <Text style={styles.newBestText}>NEW BEST</Text>
      </LinearGradient>
    </View>
  );
}


function StatCard({
  label,
  value,
  subtitle,
  glowColor = Colors.primary,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  index: number;
  glowColor?: string;
}) {
  return (
    <GlassCard glowColor={glowColor} intensity="medium" style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: glowColor }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </GlassCard>
  );
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<TestSession | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);

  useEffect(() => {
    const loadSession = async () => {
      if (params.sessionId) {
        const loadedSession = await getTestSessionById(params.sessionId);
        setSession(loadedSession);

        if (loadedSession) {
          const history = await getTestHistory();
          const sameModeHistory = history.filter(
            (s) => s.id !== params.sessionId && s.gameMode === loadedSession.gameMode
          );
          if (sameModeHistory.length > 0) {
            const bestPrevious = Math.max(...sameModeHistory.map((s) => s.totalWeightedScore));
            setPreviousBest(bestPrevious);
            if (loadedSession.totalWeightedScore > bestPrevious) {
              setIsNewBest(true);
            }
          } else {
            setIsNewBest(true);
          }
        }
      }
    };
    loadSession();
  }, [params.sessionId]);

  if (!session) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading results...</Text>
        </SafeAreaView>
      </View>
    );
  }

  const totalCorrect = session.roundResults.reduce((sum, r) => sum + r.correctAnswers, 0);
  const totalQuestions = session.totalQuestions || totalCorrect;
  const maxDifficultyReached = Math.max(
    ...Object.keys(session.difficultyProfile).map(Number),
    1
  );
  const maxDifficultyCount = Math.max(
    ...Object.values(session.difficultyProfile).map((count) => count as number),
    1
  );

  const duration = session.duration || 60;
  const isFullChallenge = duration === 300;
  const timeLabel = isFullChallenge ? '5m' : '1m';

  // Get the mode-specific display name
  const modeName = session.gameMode
    ? getOperationDisplayName(session.gameMode)
    : 'Math';
  const modeColor = isFullChallenge
    ? '#FFC837'
    : GAME_MODES.find(m => m.operation === session.gameMode)?.color || Colors.primary;

  // Calculate accuracy percentage
  const accuracyPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.title}>PERFORMANCE</Text>
              <Text style={styles.titleSecondary}>ANALYTICS</Text>
            </View>
            <View style={styles.headerMetaRow}>
              <Text style={[styles.modeTitle, { color: modeColor }]}>
                {isFullChallenge ? 'FULL CHALLENGE' : `${modeName.toUpperCase()} MODE`}
              </Text>
              <View style={styles.headerTimeBadge}>
                <Text style={styles.headerTimeIcon}>⏱</Text>
                <Text style={styles.headerTimeText}>{timeLabel}</Text>
              </View>
            </View>
            {isNewBest && <NewBestBadge />}
          </View>

          {/* Main Score Card */}
          <Animated.View entering={FadeInUp.duration(500).delay(200)}>
            <GlassCard
              glowColor={isNewBest ? '#00F5A0' : modeColor}
              intensity={isNewBest ? 'high' : 'medium'}
              style={styles.mainScoreCard}
            >
              <Text style={styles.scoreLabel}>WEIGHTED SCORE</Text>
              <Text
                style={[
                  styles.scoreValue,
                  isNewBest && styles.scoreValueBest,
                  !isNewBest && { color: modeColor },
                ]}
              >
                {session.totalWeightedScore}
              </Text>
              {isNewBest && previousBest > 0 && (
                <Text style={styles.previousBest}>
                  Previous best: {previousBest}
                </Text>
              )}
            </GlassCard>
          </Animated.View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              label="ACCURACY"
              value={`${accuracyPercent}%`}
              subtitle={`${totalCorrect} of ${totalQuestions} correct`}
              index={0}
              glowColor={Colors.correct}
            />
            <StatCard
              label="MAX DIFFICULTY"
              value={`Level ${maxDifficultyReached}`}
              subtitle={maxDifficultyReached === 4 ? 'Maximum reached!' : undefined}
              index={1}
              glowColor={Colors.accent}
            />
            <StatCard
              label="QUESTIONS SOLVED"
              value={totalCorrect}
              subtitle={`in ${isFullChallenge ? '5 minutes' : '60 seconds'}`}
              index={2}
              glowColor={modeColor}
            />
            {session.finalSprintCorrect !== undefined && session.finalSprintTotal !== undefined && session.finalSprintTotal > 0 && (
              <StatCard
                label="FINAL SPRINT"
                value={`${session.finalSprintCorrect}/${session.finalSprintTotal}`}
                subtitle="Last 30s — 2× points"
                index={3}
                glowColor="#FFC837"
              />
            )}
          </View>


          {/* Difficulty Timeline Chart */}
          {session.difficultyTimeline && session.difficultyTimeline.length > 0 && (
            <GlassCard style={styles.breakdownCard}>
              <Text style={styles.sectionTitle}>DIFFICULTY OSCILLATION</Text>
              <Text style={styles.sectionSubtitle}>
                Level progression during the session
              </Text>
              <DifficultyTimeline timeline={session.difficultyTimeline} />
              <View style={styles.timelineLegendSpacer} />
            </GlassCard>
          )}

          {/* Difficulty Profile */}
          <GlassCard style={styles.breakdownCard}>
            <Text style={styles.sectionTitle}>DIFFICULTY PROFILE</Text>
            <View style={styles.chartContainer}>
              {[1, 2, 3, 4].map((level) => {
                const count = (session.difficultyProfile[level] as number) || 0;
                const percentage = (count / maxDifficultyCount) * 100;

                return (
                  <View
                    key={level}
                    style={styles.chartRow}
                  >
                    <Text style={styles.chartLabel}>Lv.{level}</Text>
                    <View style={styles.barContainer}>
                      <LinearGradient
                        colors={
                          level === 4
                            ? ['#8B5CF6', '#00F5FF']
                            : level === 3
                            ? ['#00F5FF', '#00F5A0']
                            : ['#00F5FF', '#00D4FF']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.bar,
                          { width: `${Math.max(percentage, 3)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartValue}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <AnimatedButton
              title="Play Again"
              onPress={() => router.replace({
                pathname: '/game',
                params: { mode: isFullChallenge ? FULL_CHALLENGE_MODE_ID : (session.gameMode || 'addition') },
              })}
              style={styles.button}
            />
            <AnimatedButton
              title="Return Home"
              onPress={() => router.replace('/')}
              variant="secondary"
              style={styles.button}
            />
          </View>
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
  },
  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  headerTitleRow: {
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '200',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: LetterSpacing.widest,
    textTransform: 'uppercase',
  },
  titleSecondary: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: LetterSpacing.widest,
    marginTop: -2,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modeTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: LetterSpacing.wider,
  },
  headerTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.06)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.12)',
    gap: 3,
  },
  headerTimeIcon: {
    fontSize: 10,
  },
  headerTimeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: LetterSpacing.wide,
  },
  // New Best Badge
  newBestBadge: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowColor: '#00F5A0',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  newBestGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  newBestText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.background,
    letterSpacing: LetterSpacing.widest,
  },
  // Main Score
  mainScoreCard: {
    marginBottom: Spacing.lg,
  },
  scoreLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textLight,
    letterSpacing: LetterSpacing.widest,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: '200',
    color: Colors.primary,
    fontFamily: Fonts.mono,
    textAlign: 'center',
    letterSpacing: LetterSpacing.wide,
    ...Shadows.glow,
  },
  scoreValueBest: {
    color: Colors.correct,
    shadowColor: '#00F5A0',
  },
  previousBest: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.sm,
    letterSpacing: LetterSpacing.wide,
  },
  // Stats Grid
  statsGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    marginBottom: 0,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textLight,
    letterSpacing: LetterSpacing.widest,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: '300',
    fontFamily: Fonts.mono,
    letterSpacing: LetterSpacing.wide,
  },
  statSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    letterSpacing: LetterSpacing.wide,
    marginTop: 2,
  },
  // Breakdown
  breakdownCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    letterSpacing: LetterSpacing.widest,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    letterSpacing: LetterSpacing.wide,
    marginBottom: Spacing.md,
  },
  timelineLegendSpacer: {
    height: Spacing.lg,
  },
  // Chart
  chartContainer: {
    gap: Spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  chartLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    width: 36,
    fontFamily: Fonts.mono,
    fontWeight: '500',
    letterSpacing: LetterSpacing.wide,
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: 'rgba(0, 245, 255, 0.04)',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.06)',
  },
  bar: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  chartValue: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
    width: 32,
    textAlign: 'right',
    fontFamily: Fonts.mono,
  },
  // Buttons
  buttonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  button: {
    width: '100%',
  },
});
