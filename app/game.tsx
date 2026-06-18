import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import NumericKeypad from '../components/NumericKeypad';
import ProgressRing from '../components/ProgressRing';
import ParticleBurst from '../components/ParticleBurst';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows, Fonts, LetterSpacing } from '../constants/theme';
import { ROUNDS } from '../types/game';
import type { GameState, RoundResult } from '../types/game';
import { generateQuestion, checkAnswer, getNextDifficulty, calculateWeightedScore } from '../utils/gameLogic';
import { saveTestSession } from '../utils/storage';

export default function GameScreen() {
  const router = useRouter();
  const handleRoundEndRef = useRef<(() => void) | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    currentRound: 0,
    currentQuestion: generateQuestion('addition', 1),
    score: 0,
    roundStartTime: Date.now(),
    timeRemaining: 60,
    currentDifficulty: {
      addition: 1,
      subtraction: 1,
      multiplication: 1,
      percentage: 1,
      mixed: 1,
    },
    roundResults: [],
    totalCorrectByDifficulty: {},
    currentRoundCorrectAnswers: 0,
    consecutiveCorrect: 0,
  });

  const [userAnswer, setUserAnswer] = useState('');
  const [showTransition, setShowTransition] = useState(false);
  const [isGameActive, setIsGameActive] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(0);

  // Animation values
  const inputShake = useSharedValue(0);
  const inputFlash = useSharedValue(0);
  const questionOpacity = useSharedValue(1);

  const currentRound = ROUNDS[gameState.currentRound];

  const handleRoundEnd = useCallback(() => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setIsGameActive(false);

    const roundResult: RoundResult = {
      operation: currentRound.operation,
      correctAnswers: gameState.currentRoundCorrectAnswers,
      totalAnswers: 0,
      difficultyLevels: {},
    };

    const updatedRoundResults = [...gameState.roundResults, roundResult];

    if (gameState.currentRound < ROUNDS.length - 1) {
      setShowTransition(true);
      setUserAnswer('');

      setTimeout(() => {
        const nextRound = gameState.currentRound + 1;
        const nextOperation = ROUNDS[nextRound].operation;

        const newQuestion = generateQuestion(
          nextOperation,
          gameState.currentDifficulty[nextOperation],
          nextOperation === 'mixed' ? gameState.currentDifficulty : undefined
        );

        setShowTransition(false);
        setGameState({
          ...gameState,
          currentRound: nextRound,
          currentQuestion: newQuestion,
          timeRemaining: 60,
          roundStartTime: Date.now(),
          roundResults: updatedRoundResults,
          currentRoundCorrectAnswers: 0,
          consecutiveCorrect: 0,
        });
        setIsGameActive(true);
        setIsTransitioning(false);
        setUserAnswer('');
      }, 2500);
    } else {
      const finalGameState = {
        ...gameState,
        roundResults: updatedRoundResults,
      };

      const totalWeightedScore = calculateWeightedScore(finalGameState.totalCorrectByDifficulty);
      const session = {
        id: Date.now().toString(),
        date: Date.now(),
        totalWeightedScore,
        roundResults: updatedRoundResults,
        difficultyProfile: finalGameState.totalCorrectByDifficulty,
      };

      saveTestSession(session).then(() => {
        router.replace({
          pathname: '/results',
          params: { sessionId: session.id },
        });
      });
    }
  }, [gameState, currentRound, router, isTransitioning]);

  useEffect(() => {
    handleRoundEndRef.current = handleRoundEnd;
  }, [handleRoundEnd]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPaused) return;
      setGameState((prev) => {
        if (prev.timeRemaining <= 1) {
          handleRoundEndRef.current?.();
          return prev;
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(true);
    setIsGameActive(false);
  };

  const handleResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused(false);
    setIsGameActive(true);
  };

  const handleQuitPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowQuitConfirm(true);
    if (!isPaused) {
      setIsPaused(true);
      setIsGameActive(false);
    }
  };

  const handleQuitConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowQuitConfirm(false);
    router.replace('/');
  };

  const handleQuitCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowQuitConfirm(false);
    if (!isPaused) {
      setIsGameActive(true);
    }
  };

  const handleSubmit = () => {
    if (!userAnswer.trim() || !isGameActive || isTransitioning) return;

    const isCorrect = checkAnswer(userAnswer, gameState.currentQuestion.answer);
    const currentDiff = gameState.currentQuestion.difficulty;

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      inputFlash.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );

      // Trigger particle burst
      setParticleTrigger((prev) => prev + 1);

      const newConsecutiveCorrect = gameState.consecutiveCorrect + 1;
      const newDifficulty = getNextDifficulty(currentDiff, true, newConsecutiveCorrect);
      const resetConsecutive = newDifficulty > currentDiff ? 0 : newConsecutiveCorrect;

      const updatedDifficultyProfile = { ...gameState.totalCorrectByDifficulty };
      updatedDifficultyProfile[currentDiff] = (updatedDifficultyProfile[currentDiff] || 0) + 1;

      questionOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      const updatedDifficulties = { ...gameState.currentDifficulty };
      updatedDifficulties[currentRound.operation] = newDifficulty;

      setGameState({
        ...gameState,
        score: gameState.score + 1,
        currentRoundCorrectAnswers: gameState.currentRoundCorrectAnswers + 1,
        consecutiveCorrect: resetConsecutive,
        currentDifficulty: updatedDifficulties,
        currentQuestion: generateQuestion(
          currentRound.operation,
          newDifficulty,
          currentRound.operation === 'mixed' ? updatedDifficulties : undefined
        ),
        totalCorrectByDifficulty: updatedDifficultyProfile,
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      inputShake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      const newDifficulty = getNextDifficulty(currentDiff, false, 0);

      questionOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      const updatedDifficulties = { ...gameState.currentDifficulty };
      updatedDifficulties[currentRound.operation] = newDifficulty;

      setGameState({
        ...gameState,
        consecutiveCorrect: 0,
        currentDifficulty: updatedDifficulties,
        currentQuestion: generateQuestion(
          currentRound.operation,
          newDifficulty,
          currentRound.operation === 'mixed' ? updatedDifficulties : undefined
        ),
      });
    }

    setUserAnswer('');
  };

  const handleNumberPress = (number: string) => {
    if (!isGameActive || isTransitioning) return;
    if (userAnswer === '0' || (userAnswer === '' && number === '0')) {
      setUserAnswer('0');
      return;
    }
    if (userAnswer.length >= 10) return;
    setUserAnswer(prev => prev + number);
  };

  const handleBackspace = () => {
    if (!isGameActive || isTransitioning) return;
    setUserAnswer(prev => prev.slice(0, -1));
  };

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: inputShake.value }],
  }));

  const inputFlashStyle = useAnimatedStyle(() => ({
    borderColor: inputFlash.value === 1 ? Colors.correct : Colors.glassBorder,
    shadowColor: inputFlash.value === 1 ? Colors.correct : 'transparent',
    shadowOpacity: inputFlash.value === 1 ? 0.6 : 0,
    shadowRadius: inputFlash.value === 1 ? 12 : 0,
  }));

  const questionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
  }));

  const progressPercentage = gameState.timeRemaining / 60;

  if (showTransition) {
    return (
      <View style={styles.transitionContainer}>
        <StatusBar style="light" />
        <Animated.View entering={FadeIn.duration(300)} style={styles.transitionContent}>
          <Text style={styles.transitionEmoji}>&#10003;</Text>
          <Text style={styles.transitionTitle}>Round Complete</Text>
          <Text style={styles.transitionSubtitle}>
            Next: {ROUNDS[gameState.currentRound + 1]?.name}
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header with controls */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Text style={styles.roundLabel}>ROUND {currentRound.id}</Text>
                <Text style={styles.roundTitle}>{currentRound.name}</Text>
              </View>
              <View style={styles.headerControls}>
                <Pressable
                  onPress={handlePause}
                  style={styles.controlButton}
                  hitSlop={8}
                >
                  <View style={styles.controlButtonInner}>
                    <Text style={styles.controlIcon}>&#9646;&#9646;</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={handleQuitPress}
                  style={styles.controlButton}
                  hitSlop={8}
                >
                  <View style={[styles.controlButtonInner, styles.quitButtonInner]}>
                    <Text style={styles.quitIcon}>&#10005;</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Progress Ring Timer + Score */}
          <View style={styles.timerSection}>
            <ProgressRing
              progress={progressPercentage}
              size={120}
              strokeWidth={5}
              timeRemaining={gameState.timeRemaining}
              totalTime={60}
            />
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreLabel}>SCORE</Text>
              <Text style={styles.scoreText}>{gameState.score}</Text>
            </View>
          </View>

          {/* Question Area */}
          <View style={styles.questionWrapper}>
            <Animated.View style={[styles.questionCard, questionAnimatedStyle]}>
              <Text style={styles.questionText}>
                {gameState.currentQuestion.question} = ?
              </Text>
            </Animated.View>
            {/* Particle burst on correct answer */}
            <ParticleBurst
              trigger={particleTrigger}
              particleCount={14}
            />
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Answer Display */}
          <View style={styles.answerContainer}>
            <Animated.View style={[styles.answerDisplay, inputAnimatedStyle, inputFlashStyle]}>
              <Text style={styles.answerText}>
                {userAnswer || ' '}
              </Text>
            </Animated.View>
          </View>
        </View>

        {/* Custom Numeric Keypad */}
        <NumericKeypad
          onNumberPress={handleNumberPress}
          onBackspace={handleBackspace}
          onSubmit={handleSubmit}
          submitDisabled={!userAnswer.trim() || !isGameActive || isTransitioning}
        />
      </SafeAreaView>

      {/* Pause Overlay */}
      <Modal
        visible={isPaused && !showQuitConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlayContainer}>
          <View style={styles.overlayBackdrop} />
          <View style={styles.overlayContent}>
            <View style={styles.pauseIconContainer}>
              <Text style={styles.pauseIconText}>&#9646;&#9646;</Text>
            </View>
            <Text style={styles.overlayTitle}>PAUSED</Text>
            <Text style={styles.overlaySubtitle}>
              Round {currentRound.id} &middot; {gameState.timeRemaining}s remaining
            </Text>

            <Pressable
              onPress={handleResume}
              style={styles.resumeButton}
            >
              <LinearGradient
                colors={['#00F5FF', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resumeGradient}
              >
                <Text style={styles.resumeText}>RESUME</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleQuitPress}
              style={styles.overlayQuitButton}
            >
              <Text style={styles.overlayQuitText}>QUIT SESSION</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Quit Confirmation Overlay */}
      <Modal
        visible={showQuitConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlayContainer}>
          <View style={styles.overlayBackdrop} />
          <View style={styles.overlayContent}>
            <Text style={styles.quitConfirmTitle}>EXIT SESSION?</Text>
            <Text style={styles.quitConfirmSubtitle}>
              Your progress will not be saved.
            </Text>

            <View style={styles.quitConfirmButtons}>
              <Pressable
                onPress={handleQuitConfirm}
                style={styles.quitConfirmButton}
              >
                <Text style={styles.quitConfirmButtonText}>EXIT</Text>
              </Pressable>

              <Pressable
                onPress={handleQuitCancel}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  roundLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textLight,
    letterSpacing: LetterSpacing.wider,
    marginBottom: 2,
  },
  roundTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '500',
    color: Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
  },
  headerControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  controlButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.15)',
    borderRadius: BorderRadius.sm,
  },
  controlIcon: {
    fontSize: 14,
    color: Colors.primary,
    letterSpacing: -2,
  },
  quitButtonInner: {
    backgroundColor: 'rgba(255, 78, 106, 0.06)',
    borderColor: 'rgba(255, 78, 106, 0.2)',
  },
  quitIcon: {
    fontSize: 14,
    color: Colors.incorrect,
    fontWeight: '700',
  },
  // Timer section with ring
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  scoreBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.04)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.12)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textLight,
    letterSpacing: LetterSpacing.widest,
    marginBottom: Spacing.xs,
  },
  scoreText: {
    fontSize: FontSizes.xxl,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts.mono,
    letterSpacing: LetterSpacing.wide,
  },
  // Question
  questionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  questionCard: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.medium,
  },
  questionText: {
    fontSize: FontSizes.xxxl,
    fontWeight: '300',
    color: Colors.text,
    textAlign: 'center',
    fontFamily: Fonts.mono,
    letterSpacing: LetterSpacing.wide,
  },
  answerContainer: {
    paddingBottom: Spacing.md,
  },
  answerDisplay: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  answerText: {
    fontSize: 40,
    fontWeight: '300',
    color: Colors.primary,
    letterSpacing: LetterSpacing.widest,
    fontFamily: Fonts.mono,
  },
  // Transition
  transitionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transitionContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  transitionEmoji: {
    fontSize: 48,
    color: Colors.correct,
    marginBottom: Spacing.md,
  },
  transitionTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '300',
    color: Colors.text,
    marginBottom: Spacing.md,
    letterSpacing: LetterSpacing.wider,
  },
  transitionSubtitle: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: LetterSpacing.wide,
  },
  // Overlay styles
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 23, 0.92)',
  },
  overlayContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    width: '100%',
    maxWidth: 320,
  },
  pauseIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  pauseIconText: {
    fontSize: 22,
    color: Colors.primary,
    letterSpacing: -2,
  },
  overlayTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '300',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: LetterSpacing.widest,
  },
  overlaySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    marginBottom: Spacing.xl,
    letterSpacing: LetterSpacing.wide,
  },
  resumeButton: {
    width: '100%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  resumeGradient: {
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  resumeText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.background,
    letterSpacing: LetterSpacing.wider,
  },
  overlayQuitButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  overlayQuitText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.incorrect,
    letterSpacing: LetterSpacing.wider,
  },
  // Quit confirmation
  quitConfirmTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '300',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: LetterSpacing.wider,
  },
  quitConfirmSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    marginBottom: Spacing.xl,
    letterSpacing: LetterSpacing.wide,
    textAlign: 'center',
  },
  quitConfirmButtons: {
    width: '100%',
    gap: Spacing.md,
  },
  quitConfirmButton: {
    width: '100%',
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 78, 106, 0.4)',
    backgroundColor: 'rgba(255, 78, 106, 0.08)',
  },
  quitConfirmButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.incorrect,
    letterSpacing: LetterSpacing.wider,
  },
  cancelButton: {
    width: '100%',
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.15)',
    backgroundColor: 'rgba(0, 245, 255, 0.04)',
  },
  cancelButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: LetterSpacing.wider,
  },
});
