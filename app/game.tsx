import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Platform, Keyboard } from 'react-native';
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
    currentRoundCorrectAnswers: 0,
    consecutiveCorrect: 0,
  });

  const [userAnswer, setUserAnswer] = useState('');
  const [showTransition, setShowTransition] = useState(false);
  const [isGameActive, setIsGameActive] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Animation values
  const inputShake = useSharedValue(0);
  const inputFlash = useSharedValue(0);
  const questionOpacity = useSharedValue(1);

  const currentRound = ROUNDS[gameState.currentRound];

  const handleRoundEnd = useCallback(() => {
    setIsGameActive(false);

    // Save round result with actual correct answers from this round
    const roundResult: RoundResult = {
      operation: currentRound.operation,
      correctAnswers: gameState.currentRoundCorrectAnswers,
      totalAnswers: 0, // Not tracking total attempts
      difficultyLevels: {},
    };

    const updatedRoundResults = [...gameState.roundResults, roundResult];

    if (gameState.currentRound < ROUNDS.length - 1) {
      // Show transition to next round
      setShowTransition(true);
      // Clear input field when round ends
      setUserAnswer('');

      setTimeout(() => {
        setShowTransition(false);
        const nextRound = gameState.currentRound + 1;
        const nextOperation = ROUNDS[nextRound].operation;

        setGameState({
          ...gameState,
          currentRound: nextRound,
          currentQuestion: generateQuestion(
            nextOperation,
            gameState.currentDifficulty[nextOperation],
            nextOperation === 'mixed' ? gameState.currentDifficulty : undefined
          ),
          timeRemaining: 60,
          roundStartTime: Date.now(),
          roundResults: updatedRoundResults,
          currentRoundCorrectAnswers: 0, // Reset for next round
          consecutiveCorrect: 0, // Reset consecutive counter for new round
        });
        setIsGameActive(true);
        // Clear input field again at start of new round
        setUserAnswer('');
      }, 2500);
    } else {
      // Game finished - save final round result and navigate to results
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
  }, [gameState, currentRound, router]);

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

  useEffect(() => {
    // Track keyboard height
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleSubmit = () => {
    if (!userAnswer.trim() || !isGameActive) return;

    const isCorrect = checkAnswer(userAnswer, gameState.currentQuestion.answer);
    const currentDiff = gameState.currentQuestion.difficulty;

    if (isCorrect) {
      // Correct answer feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      inputFlash.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );

      // Increment consecutive correct counter
      const newConsecutiveCorrect = gameState.consecutiveCorrect + 1;

      // Update difficulty based on consecutive correct answers (requires 3 for increase)
      const newDifficulty = getNextDifficulty(currentDiff, true, newConsecutiveCorrect);

      // Reset consecutive counter if difficulty increased
      const resetConsecutive = newDifficulty > currentDiff ? 0 : newConsecutiveCorrect;

      // Update total correct by difficulty
      const updatedDifficultyProfile = { ...gameState.totalCorrectByDifficulty };
      updatedDifficultyProfile[currentDiff] = (updatedDifficultyProfile[currentDiff] || 0) + 1;

      // Generate next question with fade animation
      questionOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      // Update difficulty for the current round's operation type
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
      // Incorrect answer feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      inputShake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      // Reset consecutive correct counter on wrong answer
      // Decrease difficulty by one level
      const newDifficulty = getNextDifficulty(currentDiff, false, 0);

      // Generate new question with decreased difficulty and fade animation
      questionOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      // Update difficulty for the current round's operation type
      const updatedDifficulties = { ...gameState.currentDifficulty };
      updatedDifficulties[currentRound.operation] = newDifficulty;

      setGameState({
        ...gameState,
        consecutiveCorrect: 0, // Reset on wrong answer
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

        {/* Spacer to push input area down when keyboard is hidden */}
        <View style={{ flex: 1 }} />

        {/* Input Area - positioned above keyboard */}
        <View style={[styles.inputContainer, { marginBottom: keyboardHeight > 0 ? keyboardHeight : Spacing.lg }]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
