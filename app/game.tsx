import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { Colors, Spacing, FontSizes, BorderRadius, Shadows, Fonts } from '../constants/theme';
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
      setGameState((prev) => {
        if (prev.timeRemaining <= 1) {
          handleRoundEndRef.current?.();
          return prev;
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);


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

  const progressPercentage = (gameState.timeRemaining / 60) * 100;
  const timerColor = gameState.timeRemaining <= 10 ? Colors.incorrect : Colors.primary;

  if (showTransition) {
    return (
      <View style={styles.transitionContainer}>
        <StatusBar style="light" />
        <Animated.View entering={FadeIn.duration(300)} style={styles.transitionContent}>
          <Text style={styles.transitionEmoji}>🎉</Text>
          <Text style={styles.transitionTitle}>Great work!</Text>
          <Text style={styles.transitionSubtitle}>
            Next up: {ROUNDS[gameState.currentRound + 1]?.name}
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.roundTitle}>
                R{currentRound.id}: {currentRound.name}
              </Text>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{gameState.score}</Text>
              </View>
            </View>

            {/* Timer Progress Bar */}
            <View style={styles.timerContainer}>
              <LinearGradient
                colors={gameState.timeRemaining <= 10 ? ['#FF4E6A', '#FF4E6A'] : ['#00F5FF', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.timerBar, { width: `${progressPercentage}%` }]}
              />
            </View>
            <Text style={[styles.timerText, { color: timerColor }]}>
              {gameState.timeRemaining}s
            </Text>
          </View>

          {/* Question Area */}
          <Animated.View style={[styles.questionCard, questionAnimatedStyle]}>
            <Text style={styles.questionText}>
              {gameState.currentQuestion.question} = ?
            </Text>
          </Animated.View>

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
    marginBottom: Spacing.md,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roundTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  scoreBadge: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  scoreText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Fonts.mono,
  },
  timerContainer: {
    height: 4,
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  timerBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  timerText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.mono,
    fontWeight: '600',
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.medium,
  },
  questionText: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    fontFamily: Fonts.mono,
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
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 4,
    fontFamily: Fonts.mono,
  },
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
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  transitionTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  transitionSubtitle: {
    fontSize: FontSizes.xl,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
