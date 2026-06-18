import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import NumericKeypad from '../components/NumericKeypad';
import ProgressRing from '../components/ProgressRing';
import ParticleBurst from '../components/ParticleBurst';
import DifficultyIndicator from '../components/DifficultyIndicator';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows, Fonts, LetterSpacing } from '../constants/theme';
import { GAME_MODES } from '../types/game';
import type { GameState, DifficultyTimelineEntry, OperationType } from '../types/game';
import { generateQuestion, checkAnswer, calculateWeightedScore, getAnswerHint, operationRequiresDecimal, operationProducesIntegers } from '../utils/gameLogic';
import { saveTestSession } from '../utils/storage';

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: string }>();
  const handleGameEndRef = useRef<(() => void) | null>(null);

  // Get the selected game mode
  const selectedMode = GAME_MODES.find(m => m.id === params.mode) || GAME_MODES[0];
  const operation: OperationType = selectedMode.operation;

  // Countdown state
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdownValue, setCountdownValue] = useState(3);

  // Difficulty increase tracking
  const [difficultyDidIncrease, setDifficultyDidIncrease] = useState(false);
  const difficultyIncreaseCounter = useRef(0);

  const [gameState, setGameState] = useState<GameState>({
    currentRound: 0,
    currentQuestion: generateQuestion(operation, 1, operation === 'mixed' ? {
      addition: 1, subtraction: 1, multiplication: 1, percentage: 1, mixed: 1,
    } : undefined),
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
    difficultyTimeline: [],
    totalQuestionsAttempted: 0,
    difficultyLevel: 1,
  });

  const [userAnswer, setUserAnswer] = useState('');
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(0);

  // Animation values
  const inputShake = useSharedValue(0);
  const inputFlash = useSharedValue(0);
  const questionOpacity = useSharedValue(1);

  // Determine if decimal should be hidden for this mode
  const hideDecimalForMode = operationProducesIntegers(operation);

  // Only show decimal highlight when answer actually requires it
  const answerRequiresDecimalInput = operationRequiresDecimal(
    gameState.currentQuestion.operation,
    gameState.currentQuestion.answer
  );
  const answerHint = getAnswerHint(gameState.currentQuestion.answer);

  // Countdown effect with zoom-in animation
  useEffect(() => {
    if (!showCountdown) return;

    if (countdownValue <= 0) {
      setShowCountdown(false);
      setIsGameActive(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdownValue(prev => prev - 1);
    }, 700);

    return () => clearTimeout(timer);
  }, [countdownValue, showCountdown]);

  const handleGameEnd = useCallback(() => {
    setIsGameActive(false);

    const totalWeightedScore = calculateWeightedScore(gameState.totalCorrectByDifficulty);
    const session = {
      id: Date.now().toString(),
      date: Date.now(),
      totalWeightedScore,
      roundResults: [{
        operation,
        correctAnswers: gameState.currentRoundCorrectAnswers,
        totalAnswers: gameState.totalQuestionsAttempted,
        difficultyLevels: gameState.totalCorrectByDifficulty,
      }],
      difficultyProfile: gameState.totalCorrectByDifficulty,
      difficultyTimeline: gameState.difficultyTimeline,
      totalQuestions: gameState.totalQuestionsAttempted,
      gameMode: operation,
    };

    saveTestSession(session).then(() => {
      router.replace({
        pathname: '/results',
        params: { sessionId: session.id },
      });
    });
  }, [gameState, operation, router]);

  useEffect(() => {
    handleGameEndRef.current = handleGameEnd;
  }, [handleGameEnd]);

  // Game timer
  useEffect(() => {
    if (!isGameActive || showCountdown) return;

    const timer = setInterval(() => {
      if (isPaused) return;
      setGameState((prev) => {
        if (prev.timeRemaining <= 1) {
          handleGameEndRef.current?.();
          return prev;
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameActive, isPaused, showCountdown]);

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
    if (!userAnswer.trim() || !isGameActive) return;

    const isCorrect = checkAnswer(userAnswer, gameState.currentQuestion.answer);
    const currentDiff = gameState.currentQuestion.difficulty;
    const questionIndex = gameState.totalQuestionsAttempted;

    // Record timeline entry
    const timelineEntry: DifficultyTimelineEntry = {
      questionIndex,
      difficulty: currentDiff,
      correct: isCorrect,
      operation: gameState.currentQuestion.operation,
    };

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      inputFlash.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );

      // Trigger particle burst
      setParticleTrigger((prev) => prev + 1);

      const newConsecutiveCorrect = gameState.consecutiveCorrect + 1;

      // DDA 2.0: Increase difficulty after streak of 3 correct answers
      let newDifficulty = currentDiff;
      let resetConsecutive = newConsecutiveCorrect;
      if (newConsecutiveCorrect >= 3) {
        newDifficulty = Math.min(currentDiff + 1, 4);
        resetConsecutive = 0; // Reset streak counter after leveling up

        // Signal difficulty increase for visual feedback
        if (newDifficulty > currentDiff) {
          difficultyIncreaseCounter.current += 1;
          setDifficultyDidIncrease(true);
          setTimeout(() => setDifficultyDidIncrease(false), 2500);
        }
      }

      const updatedDifficultyProfile = { ...gameState.totalCorrectByDifficulty };
      updatedDifficultyProfile[currentDiff] = (updatedDifficultyProfile[currentDiff] || 0) + 1;

      questionOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      const updatedDifficulties = { ...gameState.currentDifficulty };
      updatedDifficulties[operation] = newDifficulty;

      setGameState({
        ...gameState,
        score: gameState.score + 1,
        currentRoundCorrectAnswers: gameState.currentRoundCorrectAnswers + 1,
        consecutiveCorrect: resetConsecutive,
        currentDifficulty: updatedDifficulties,
        difficultyLevel: newDifficulty,
        currentQuestion: generateQuestion(
          operation,
          newDifficulty,
          operation === 'mixed' ? updatedDifficulties : undefined
        ),
        totalCorrectByDifficulty: updatedDifficultyProfile,
        difficultyTimeline: [...gameState.difficultyTimeline, timelineEntry],
        totalQuestionsAttempted: questionIndex + 1,
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

      // DDA 2.0: Immediately decrease difficulty by 1 on incorrect answer
      const newDifficulty = Math.max(currentDiff - 1, 1);

      questionOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      const updatedDifficulties = { ...gameState.currentDifficulty };
      updatedDifficulties[operation] = newDifficulty;

      setGameState({
        ...gameState,
        consecutiveCorrect: 0,
        currentDifficulty: updatedDifficulties,
        difficultyLevel: newDifficulty,
        currentQuestion: generateQuestion(
          operation,
          newDifficulty,
          operation === 'mixed' ? updatedDifficulties : undefined
        ),
        difficultyTimeline: [...gameState.difficultyTimeline, timelineEntry],
        totalQuestionsAttempted: questionIndex + 1,
      });
    }

    setUserAnswer('');
  };

  const handleNumberPress = (number: string) => {
    if (!isGameActive) return;
    if (userAnswer === '0' && number !== '.') {
      setUserAnswer(number === '0' ? '0' : number);
      return;
    }
    if (userAnswer === '' && number === '0') {
      setUserAnswer('0');
      return;
    }
    if (userAnswer.length >= 10) return;
    setUserAnswer(prev => prev + number);
  };

  const handleDecimalPress = () => {
    if (!isGameActive) return;
    if (userAnswer.includes('.')) return;
    if (userAnswer === '') {
      setUserAnswer('0.');
    } else {
      setUserAnswer(prev => prev + '.');
    }
  };

  const handleBackspace = () => {
    if (!isGameActive) return;
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

  // Countdown screen with zoom-in animation
  if (showCountdown) {
    return (
      <View style={styles.countdownContainer}>
        <StatusBar style="light" />
        <View style={styles.countdownContent}>
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={[styles.countdownMode, { color: selectedMode.color }]}>
              {selectedMode.name.toUpperCase()}
            </Text>
          </Animated.View>

          {countdownValue > 0 ? (
            <Animated.View
              key={`countdown-${countdownValue}`}
              entering={ZoomIn.duration(400).easing(Easing.out(Easing.back(1.5)))}
              style={styles.countdownNumberWrapper}
            >
              <Text style={styles.countdownNumber}>{countdownValue}</Text>
            </Animated.View>
          ) : (
            <Animated.View
              entering={ZoomIn.duration(300)}
              style={styles.countdownNumberWrapper}
            >
              <Text style={styles.countdownGo}>GO!</Text>
            </Animated.View>
          )}

          <Text style={styles.countdownSubtext}>60 SECONDS</Text>
        </View>
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
                <Text style={[styles.modeLabel, { color: selectedMode.color }]}>
                  {selectedMode.icon} {selectedMode.name.toUpperCase()}
                </Text>
                <Text style={styles.difficultyLabel}>
                  LEVEL {gameState.difficultyLevel}
                </Text>
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

            {/* Difficulty Indicator Bar */}
            <DifficultyIndicator
              level={gameState.difficultyLevel}
              maxLevel={4}
              didIncrease={difficultyDidIncrease}
            />
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

          {/* Answer Hint */}
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>{answerHint}</Text>
          </View>

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
          onDecimalPress={handleDecimalPress}
          submitDisabled={!userAnswer.trim() || !isGameActive}
          highlightDecimal={answerRequiresDecimalInput}
          hideDecimal={hideDecimalForMode}
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
              {selectedMode.name} &middot; {gameState.timeRemaining}s remaining
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
  modeLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: LetterSpacing.wider,
    marginBottom: 2,
  },
  difficultyLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textLight,
    letterSpacing: LetterSpacing.wider,
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
  // Hint
  hintContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  hintText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textLight,
    letterSpacing: LetterSpacing.wider,
    textTransform: 'uppercase',
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
  // Countdown
  countdownContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContent: {
    alignItems: 'center',
  },
  countdownMode: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    letterSpacing: LetterSpacing.widest,
    marginBottom: Spacing.xl,
  },
  countdownNumberWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 80,
    fontWeight: '200',
    color: Colors.text,
    fontFamily: Fonts.mono,
    textShadowColor: Colors.glowCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  countdownGo: {
    fontSize: 56,
    fontWeight: '600',
    color: Colors.correct,
    letterSpacing: LetterSpacing.widest,
    textShadowColor: Colors.glowCorrect,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  countdownSubtext: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textLight,
    letterSpacing: LetterSpacing.wider,
    marginTop: Spacing.xl,
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
