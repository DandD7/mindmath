import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AnimatedButton from '@/components/AnimatedButton';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/theme';
import { ROUNDS } from '@/types/game';
import type { GameState, RoundResult } from '@/types/game';
import { generateQuestion, checkAnswer, getNextDifficulty, calculateWeightedScore } from '@/utils/gameLogic';
import { saveTestSession } from '@/utils/storage';

export default function GameScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

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
  });

  const [userAnswer, setUserAnswer] = useState('');
  const [showTransition, setShowTransition] = useState(false);
  const [isGameActive, setIsGameActive] = useState(true);

  // Animation values
  const inputShake = useSharedValue(0);
  const inputFlash = useSharedValue(0);
  const questionOpacity = useSharedValue(1);

  const currentRound = ROUNDS[gameState.currentRound];

  const saveGameResults = useCallback(async () => {
    const totalWeightedScore = calculateWeightedScore(gameState.totalCorrectByDifficulty);

    const session = {
      id: Date.now().toString(),
      date: Date.now(),
      totalWeightedScore,
      roundResults: gameState.roundResults,
      difficultyProfile: gameState.totalCorrectByDifficulty,
    };

    await saveTestSession(session);
    router.replace({
      pathname: '/results',
      params: { sessionId: session.id },
    });
  }, [gameState, router]);

  const handleRoundEnd = useCallback(() => {
    setIsGameActive(false);

    // Calculate round result
    const roundResult: RoundResult = {
      operation: currentRound.operation,
      correctAnswers: gameState.roundResults.filter(
        (r) => r.operation === currentRound.operation
      ).reduce((acc, r) => acc + r.correctAnswers, 0),
      totalAnswers: 0,
      difficultyLevels: {},
    };

    if (gameState.currentRound < ROUNDS.length - 1) {
      // Show transition to next round
      setShowTransition(true);
      setTimeout(() => {
        setShowTransition(false);
        const nextRound = gameState.currentRound + 1;
        const nextOperation = ROUNDS[nextRound].operation;

        setGameState({
          ...gameState,
          currentRound: nextRound,
          currentQuestion: generateQuestion(
            nextOperation,
            nextOperation === 'mixed' ? 1 : gameState.currentDifficulty[nextOperation],
            nextOperation === 'mixed' ? gameState.currentDifficulty : undefined
          ),
          timeRemaining: 60,
          roundStartTime: Date.now(),
          roundResults: [...gameState.roundResults, roundResult],
        });
        setIsGameActive(true);
      }, 2500);
    } else {
      // Game finished - save and navigate to results
      saveGameResults();
    }
  }, [gameState, currentRound, saveGameResults]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeRemaining <= 1) {
          // Round ended
          handleRoundEnd();
          return prev;
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.currentRound, handleRoundEnd]);

  useEffect(() => {
    // Focus input when question changes
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [gameState.currentQuestion]);

  const handleSubmit = () => {
    if (!userAnswer.trim() || !isGameActive) return;

    const isCorrect = checkAnswer(userAnswer, gameState.currentQuestion.answer);
    const currentOp = gameState.currentQuestion.operation;
    const currentDiff = gameState.currentQuestion.difficulty;

    if (isCorrect) {
      // Correct answer feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      inputFlash.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );

      // Update difficulty and score
      const newDifficulty = getNextDifficulty(currentDiff, true);

      // Update total correct by difficulty
      const updatedDifficultyProfile = { ...gameState.totalCorrectByDifficulty };
      updatedDifficultyProfile[currentDiff] = (updatedDifficultyProfile[currentDiff] || 0) + 1;

      // Generate next question with fade animation
      questionOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      setGameState({
        ...gameState,
        score: gameState.score + 1,
        currentDifficulty: {
          ...gameState.currentDifficulty,
          [currentOp]: newDifficulty,
        },
        currentQuestion: generateQuestion(
          currentRound.operation,
          currentRound.operation === 'mixed' ? newDifficulty : newDifficulty,
          currentRound.operation === 'mixed' ? { ...gameState.currentDifficulty, [currentOp]: newDifficulty } : undefined
        ),
        totalCorrectByDifficulty: updatedDifficultyProfile,
      });
    } else {
      // Incorrect answer feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      inputShake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      // Generate new question at same difficulty with fade animation
      questionOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      setGameState({
        ...gameState,
        currentQuestion: generateQuestion(
          currentRound.operation,
          currentDiff,
          currentRound.operation === 'mixed' ? gameState.currentDifficulty : undefined
        ),
      });
    }

    setUserAnswer('');
  };

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: inputShake.value }],
    backgroundColor: inputFlash.value === 1 ? Colors.correct : Colors.card,
  }));

  const questionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
  }));

  const progressPercentage = (gameState.timeRemaining / 60) * 100;

  if (showTransition) {
    return (
      <View style={styles.transitionContainer}>
        <StatusBar style="dark" />
        <Animated.View entering={FadeIn.duration(300)} style={styles.transitionContent}>
          <Text style={styles.transitionTitle}>Great work! 🎉</Text>
          <Text style={styles.transitionSubtitle}>
            Next up: {ROUNDS[gameState.currentRound + 1]?.name}
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.roundTitle}>Round {currentRound.id}: {currentRound.name}</Text>
              <Text style={styles.score}>Score: {gameState.score}</Text>
            </View>

            {/* Timer Progress Bar */}
            <View style={styles.timerContainer}>
              <View style={[styles.timerBar, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.timerText}>{gameState.timeRemaining}s</Text>
          </View>

          {/* Question Area */}
          <Animated.View style={[styles.questionCard, questionAnimatedStyle]}>
            <Text style={styles.questionText}>{gameState.currentQuestion.question} = ?</Text>
          </Animated.View>

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <Animated.View style={[styles.inputWrapper, inputAnimatedStyle]}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={userAnswer}
                onChangeText={setUserAnswer}
                keyboardType="numeric"
                placeholder="Your answer"
                placeholderTextColor={Colors.textLight}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
                editable={isGameActive}
              />
            </Animated.View>

            <AnimatedButton
              title="Submit"
              onPress={handleSubmit}
              disabled={!userAnswer.trim() || !isGameActive}
              style={styles.submitButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roundTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  score: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.primary,
  },
  timerContainer: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  timerBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  timerText: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  questionText: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: Colors.text,
  },
  inputContainer: {
    gap: Spacing.md,
  },
  inputWrapper: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  input: {
    fontSize: FontSizes.xl,
    color: Colors.text,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    textAlign: 'center',
  },
  submitButton: {
    width: '100%',
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
  transitionTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  transitionSubtitle: {
    fontSize: FontSizes.xl,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
