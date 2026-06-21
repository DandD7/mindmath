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
  withRepeat,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import NumericKeypad from '../components/NumericKeypad';
import ProgressRing from '../components/ProgressRing';
import ParticleBurst from '../components/ParticleBurst';
import DifficultyIndicator from '../components/DifficultyIndicator';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows, Fonts, LetterSpacing } from '../constants/theme';
import { GAME_MODES, FULL_CHALLENGE_MODE_ID } from '../types/game';
import type { GameState, DifficultyTimelineEntry, OperationType } from '../types/game';
import { generateQuestion, checkAnswer, calculateWeightedScore, getAnswerHint, operationRequiresDecimal, operationProducesIntegers } from '../utils/gameLogic';
import { saveTestSession } from '../utils/storage';

// Fixed sequence for 5-minute Full Challenge (1 minute each)
const CHALLENGE_SEQUENCE: { operation: OperationType; label: string }[] = [
  { operation: 'addition', label: 'Addition' },
  { operation: 'subtraction', label: 'Subtraction' },
  { operation: 'multiplication', label: 'Multiplication' },
  { operation: 'percentage', label: 'Percentages' },
  { operation: 'mixed', label: 'Mixed' },
];

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: string }>();
  const handleGameEndRef = useRef<(() => void) | null>(null);

  // Determine if this is a 5-minute challenge or 1-minute training
  const isFullChallenge = params.mode === FULL_CHALLENGE_MODE_ID;
  const gameDuration = isFullChallenge ? 300 : 60; // 5 min or 1 min
  const FINAL_SPRINT_THRESHOLD = 30; // last 30 seconds

  // Get the selected game mode
  const selectedMode = isFullChallenge
    ? { id: FULL_CHALLENGE_MODE_ID, name: 'Full Challenge', operation: 'mixed' as OperationType, icon: '⚡', color: '#FFC837', gradientColors: ['#FFC837', '#FF8008'] as [string, string], description: 'Full Mindmath Challenge' }
    : GAME_MODES.find(m => m.id === params.mode) || GAME_MODES[0];
  const operation: OperationType = selectedMode.operation;

  // Helper: get current operation based on elapsed time for full challenge
  const getChallengeOperation = (timeRemaining: number): OperationType => {
    if (!isFullChallenge) return operation;
    const elapsed = gameDuration - timeRemaining;
    const blockIndex = Math.min(Math.floor(elapsed / 60), CHALLENGE_SEQUENCE.length - 1);
    return CHALLENGE_SEQUENCE[blockIndex].operation;
  };

  const getChallengeLabel = (timeRemaining: number): string => {
    if (!isFullChallenge) return selectedMode.name;
    const elapsed = gameDuration - timeRemaining;
    const blockIndex = Math.min(Math.floor(elapsed / 60), CHALLENGE_SEQUENCE.length - 1);
    return CHALLENGE_SEQUENCE[blockIndex].label;
  };

  // Countdown state
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdownValue, setCountdownValue] = useState(3);

  // Difficulty increase tracking
  const [difficultyDidIncrease, setDifficultyDidIncrease] = useState(false);
  const difficultyIncreaseCounter = useRef(0);

  // Glitch effect state
  const [showGlitch, setShowGlitch] = useState(false);
  const glitchOpacity = useSharedValue(0);
  const glitchOffset = useSharedValue(0);

  // Final sprint tracking
  const finalSprintCorrectRef = useRef(0);
  const finalSprintTotalRef = useRef(0);

  // Track the previous challenge block to detect operation changes
  const prevBlockRef = useRef<OperationType>(isFullChallenge ? CHALLENGE_SEQUENCE[0].operation : operation);

  // For the full challenge, start with the first operation in the sequence
  const initialOperation: OperationType = isFullChallenge ? CHALLENGE_SEQUENCE[0].operation : operation;

  const [gameState, setGameState] = useState<GameState>({
    currentRound: 0,
    currentQuestion: generateQuestion(initialOperation, 1, initialOperation === 'mixed' ? {
      addition: 1, subtraction: 1, multiplication: 1, percentage: 1, mixed: 1,
    } : undefined),
    score: 0,
    roundStartTime: Date.now(),
    timeRemaining: gameDuration,
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
  const bgOffset = useSharedValue(0);

  // Background movement for transition effect
  useEffect(() => {
    bgOffset.value = withTiming(20, { duration: 800, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get current active operation (changes per minute in full challenge)
  const currentActiveOperation = getChallengeOperation(gameState.timeRemaining);
  const currentActiveLabel = getChallengeLabel(gameState.timeRemaining);

  // Determine if decimal should be hidden for this mode
  // In full challenge, all operations produce integers (percentage uses round half up)
  const hideDecimalForMode = !isFullChallenge ? operationProducesIntegers(operation) : operationProducesIntegers(currentActiveOperation);

  // Only show decimal highlight when answer actually requires it
  const answerRequiresDecimalInput = operationRequiresDecimal(
    gameState.currentQuestion.operation,
    gameState.currentQuestion.answer
  );
  const answerHint = getAnswerHint(gameState.currentQuestion.answer, gameState.currentQuestion.operation);

  // Is final sprint active?
  const isFinalSprint = isFullChallenge && gameState.timeRemaining <= FINAL_SPRINT_THRESHOLD;

  // Final sprint pulse animation
  const sprintPulse = useSharedValue(0);
  useEffect(() => {
    if (isFinalSprint) {
      sprintPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinalSprint]);

  const sprintBorderStyle = useAnimatedStyle(() => {
    if (!isFinalSprint) return {};
    return {
      borderColor: interpolateColor(
        sprintPulse.value,
        [0, 1],
        ['rgba(255, 200, 55, 0.2)', 'rgba(255, 128, 8, 0.6)']
      ),
    };
  });

  // Background animated style for speed simulation
  const bgAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -bgOffset.value }],
  }));

  // Glitch style
  const glitchStyle = useAnimatedStyle(() => ({
    opacity: glitchOpacity.value,
    transform: [{ translateX: glitchOffset.value }],
  }));

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
      duration: gameDuration,
      finalSprintCorrect: finalSprintCorrectRef.current,
      finalSprintTotal: finalSprintTotalRef.current,
    };

    saveTestSession(session).then(() => {
      router.replace({
        pathname: '/results',
        params: { sessionId: session.id },
      });
    });
  }, [gameState, operation, router, gameDuration]);

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

  // Detect operation block change in full challenge and generate new question
  useEffect(() => {
    if (!isFullChallenge || !isGameActive || showCountdown) return;
    const currentOp = getChallengeOperation(gameState.timeRemaining);
    if (currentOp !== prevBlockRef.current) {
      prevBlockRef.current = currentOp;
      // Generate new question for the new operation block
      const diff = gameState.currentDifficulty[currentOp] || 1;
      const newQuestion = generateQuestion(
        currentOp,
        diff,
        currentOp === 'mixed' ? gameState.currentDifficulty : undefined
      );
      setGameState(prev => ({
        ...prev,
        currentQuestion: newQuestion,
        consecutiveCorrect: 0, // reset streak on block change
      }));
      setUserAnswer('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.timeRemaining]);

  const glitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerGlitchEffect = () => {
    if (glitchTimerRef.current) {
      clearTimeout(glitchTimerRef.current);
    }
    setShowGlitch(true);
    glitchOpacity.value = withSequence(
      withTiming(0.7, { duration: 40 }),
      withTiming(0, { duration: 40 }),
      withTiming(0.5, { duration: 30 }),
      withTiming(0, { duration: 60 }),
      withTiming(0.3, { duration: 30 }),
      withTiming(0, { duration: 80 })
    );
    glitchOffset.value = withSequence(
      withTiming(4, { duration: 25 }),
      withTiming(-6, { duration: 35 }),
      withTiming(3, { duration: 25 }),
      withTiming(-3, { duration: 40 }),
      withTiming(0, { duration: 50 })
    );
    glitchTimerRef.current = setTimeout(() => setShowGlitch(false), 320);
  };

  const triggerDisruptedVibration = () => {
    // Disturbed vibration pattern
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 100);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 200);
  };

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

    // Use the current active operation for generating the next question
    const activeOp = currentActiveOperation;

    // Track final sprint stats
    if (isFinalSprint) {
      finalSprintTotalRef.current += 1;
      if (isCorrect) {
        finalSprintCorrectRef.current += 1;
      }
    }

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

      // DDA: Scale faster in 5-min mode (every 2 instead of 3)
      const streakThreshold = isFullChallenge ? 2 : 3;
      let newDifficulty = currentDiff;
      let resetConsecutive = newConsecutiveCorrect;
      if (newConsecutiveCorrect >= streakThreshold) {
        newDifficulty = Math.min(currentDiff + 1, 4);
        resetConsecutive = 0;

        if (newDifficulty > currentDiff) {
          difficultyIncreaseCounter.current += 1;
          setDifficultyDidIncrease(true);
          setTimeout(() => setDifficultyDidIncrease(false), 2500);
        }
      }

      const updatedDifficultyProfile = { ...gameState.totalCorrectByDifficulty };
      // Score doubling in Final Sprint
      const scoreIncrement = isFinalSprint ? 2 : 1;
      updatedDifficultyProfile[currentDiff] = (updatedDifficultyProfile[currentDiff] || 0) + scoreIncrement;

      questionOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      const updatedDifficulties = { ...gameState.currentDifficulty };
      updatedDifficulties[activeOp] = newDifficulty;

      setGameState({
        ...gameState,
        score: gameState.score + scoreIncrement,
        currentRoundCorrectAnswers: gameState.currentRoundCorrectAnswers + 1,
        consecutiveCorrect: resetConsecutive,
        currentDifficulty: updatedDifficulties,
        difficultyLevel: newDifficulty,
        currentQuestion: generateQuestion(
          activeOp,
          newDifficulty,
          activeOp === 'mixed' ? updatedDifficulties : undefined
        ),
        totalCorrectByDifficulty: updatedDifficultyProfile,
        difficultyTimeline: [...gameState.difficultyTimeline, timelineEntry],
        totalQuestionsAttempted: questionIndex + 1,
      });
    } else {
      // Wrong answer: glitch + disturbed vibration
      triggerDisruptedVibration();
      triggerGlitchEffect();

      inputShake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      // In Final Sprint, errors are more penalizing (lose 1 point)
      const scorePenalty = isFinalSprint ? 1 : 0;

      // DDA: Decrease difficulty
      const newDifficulty = Math.max(currentDiff - 1, 1);

      questionOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 200 })
      );

      const updatedDifficulties = { ...gameState.currentDifficulty };
      updatedDifficulties[activeOp] = newDifficulty;

      setGameState({
        ...gameState,
        score: Math.max(0, gameState.score - scorePenalty),
        consecutiveCorrect: 0,
        currentDifficulty: updatedDifficulties,
        difficultyLevel: newDifficulty,
        currentQuestion: generateQuestion(
          activeOp,
          newDifficulty,
          activeOp === 'mixed' ? updatedDifficulties : undefined
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

  const progressPercentage = gameState.timeRemaining / gameDuration;

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeLabel = isFullChallenge ? '5m' : '1m';

  // Countdown screen with zoom-in animation
  if (showCountdown) {
    return (
      <View style={styles.countdownContainer}>
        <StatusBar style="light" />
        <Animated.View style={[StyleSheet.absoluteFill, bgAnimatedStyle]}>
          <LinearGradient
            colors={[Colors.background, '#0a0f1a', '#0d1225', Colors.background]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
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

          <View style={styles.countdownTimeRow}>
            <Text style={styles.countdownClockIcon}>⏱</Text>
            <Text style={styles.countdownSubtext}>
              {isFullChallenge ? '5 MINUTES' : '60 SECONDS'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Glitch overlay */}
      {showGlitch && (
        <Animated.View style={[styles.glitchOverlay, glitchStyle]}>
          <View style={styles.glitchLine1} />
          <View style={styles.glitchLine2} />
          <View style={styles.glitchLine3} />
        </Animated.View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header with controls */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Text style={[styles.modeLabel, { color: selectedMode.color }]}>
                  {selectedMode.icon} {isFullChallenge ? currentActiveLabel.toUpperCase() : selectedMode.name.toUpperCase()}
                </Text>
                <View style={styles.headerMeta}>
                  <Text style={styles.difficultyLabel}>
                    LEVEL {gameState.difficultyLevel}
                  </Text>
                  <View style={styles.timeLabelBadge}>
                    <Text style={styles.timeLabelIcon}>⏱</Text>
                    <Text style={styles.timeLabelText}>{timeLabel}</Text>
                  </View>
                </View>
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

            {/* Difficulty Indicator Bar / Final Sprint Banner */}
            {isFinalSprint ? (
              <Animated.View style={[styles.finalSprintBanner, sprintBorderStyle]}>
                <LinearGradient
                  colors={['rgba(255, 200, 55, 0.08)', 'rgba(255, 128, 8, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.finalSprintGradient}
                >
                  <Text style={styles.finalSprintText}>⚡ FINAL SPRINT — 2× POINTS</Text>
                </LinearGradient>
              </Animated.View>
            ) : (
              <DifficultyIndicator
                level={gameState.difficultyLevel}
                maxLevel={4}
                didIncrease={difficultyDidIncrease}
              />
            )}
          </View>

          {/* Progress Ring Timer + Score */}
          <View style={[styles.timerSection, isFinalSprint && styles.timerSectionCompact]}>
            <ProgressRing
              progress={progressPercentage}
              size={isFinalSprint ? 90 : 120}
              strokeWidth={isFinalSprint ? 4 : 5}
              timeRemaining={gameState.timeRemaining}
              totalTime={gameDuration}
            />
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreLabel}>SCORE</Text>
              <Text style={[styles.scoreText, isFinalSprint && { color: '#FFC837' }]}>
                {gameState.score}
              </Text>
              {isFinalSprint && (
                <Text style={styles.sprintMultiplier}>2×</Text>
              )}
            </View>
          </View>

          {/* Question Area */}
          <View style={[styles.questionWrapper, isFinalSprint && styles.questionWrapperCompact]}>
            <Animated.View style={[styles.questionCard, isFinalSprint && styles.questionCardCompact, questionAnimatedStyle]}>
              <Text style={styles.questionText}>
                {gameState.currentQuestion.question} = ?
              </Text>
            </Animated.View>
            {/* Particle burst on correct answer */}
            <ParticleBurst
              trigger={particleTrigger}
              particleCount={8}
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
              {selectedMode.name} &middot; {formatTime(gameState.timeRemaining)} remaining
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
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
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
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
  timeLabelBadge: {
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
  timeLabelIcon: {
    fontSize: 10,
  },
  timeLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
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
  // Final Sprint Banner
  finalSprintBanner: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 55, 0.3)',
    overflow: 'hidden',
  },
  finalSprintGradient: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  finalSprintText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#FFC837',
    letterSpacing: LetterSpacing.wider,
  },
  // Timer section with ring
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  timerSectionCompact: {
    paddingVertical: Spacing.xs,
    gap: Spacing.lg,
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
  sprintMultiplier: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#FFC837',
    letterSpacing: LetterSpacing.wide,
    marginTop: 2,
  },
  // Question
  questionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  questionWrapperCompact: {
    marginTop: Spacing.xs,
  },
  questionCard: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.medium,
  },
  questionCardCompact: {
    paddingVertical: Spacing.md,
    minHeight: 80,
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
    marginBottom: Spacing.xs,
  },
  hintText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textLight,
    letterSpacing: LetterSpacing.wider,
    textTransform: 'uppercase',
  },
  answerContainer: {
    paddingBottom: Spacing.sm,
  },
  answerDisplay: {
    backgroundColor: Colors.glass,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
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
  // Glitch Overlay
  glitchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    pointerEvents: 'none',
  },
  glitchLine1: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 78, 106, 0.6)',
  },
  glitchLine2: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0, 245, 255, 0.5)',
  },
  glitchLine3: {
    position: 'absolute',
    top: '70%',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
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
  countdownTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  countdownClockIcon: {
    fontSize: 16,
  },
  countdownSubtext: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.textLight,
    letterSpacing: LetterSpacing.wider,
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
