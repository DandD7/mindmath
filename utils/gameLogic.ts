import { Question, OperationType } from '../types/game';

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateAdditionQuestion = (difficulty: number): Question => {
  let num1: number, num2: number;

  switch (difficulty) {
    case 1:
      // Easy: 1-20
      num1 = getRandomInt(1, 20);
      num2 = getRandomInt(1, 20);
      break;
    case 2:
      // Medium: 10-40 (smoother transition)
      num1 = getRandomInt(10, 40);
      num2 = getRandomInt(10, 40);
      break;
    case 3:
      // Hard: 20-70 (gradual increase)
      num1 = getRandomInt(20, 70);
      num2 = getRandomInt(20, 70);
      break;
    case 4:
    default:
      // Expert: 30-99
      num1 = getRandomInt(30, 99);
      num2 = getRandomInt(30, 99);
      break;
  }

  return {
    question: `${num1} + ${num2}`,
    answer: num1 + num2,
    difficulty,
    operation: 'addition',
  };
};

const generateSubtractionQuestion = (difficulty: number): Question => {
  let num1: number, num2: number;

  switch (difficulty) {
    case 1:
      // Easy: 1-20
      num1 = getRandomInt(10, 20);
      num2 = getRandomInt(1, num1);
      break;
    case 2:
      // Medium: 20-50 (smoother transition)
      num1 = getRandomInt(20, 50);
      num2 = getRandomInt(5, num1);
      break;
    case 3:
      // Hard: 40-80 (gradual increase)
      num1 = getRandomInt(40, 80);
      num2 = getRandomInt(10, num1);
      break;
    case 4:
    default:
      // Expert: 60-99
      num1 = getRandomInt(60, 99);
      num2 = getRandomInt(15, num1);
      break;
  }

  return {
    question: `${num1} - ${num2}`,
    answer: num1 - num2,
    difficulty,
    operation: 'subtraction',
  };
};

const generateMultiplicationQuestion = (difficulty: number): Question => {
  let num1: number, num2: number;

  switch (difficulty) {
    case 1:
      // Easy: Single digit tables
      num1 = getRandomInt(2, 9);
      num2 = getRandomInt(2, 9);
      break;
    case 2:
      // Medium: Up to 12 times table (smoother transition)
      num1 = getRandomInt(2, 12);
      num2 = getRandomInt(2, 12);
      break;
    case 3:
      // Hard: Teen numbers × single/double digit
      num1 = getRandomInt(11, 19);
      num2 = getRandomInt(2, 12);
      break;
    case 4:
    default:
      // Expert: 2-digit × 2-digit (capped, gradual)
      num1 = getRandomInt(11, 25);
      num2 = getRandomInt(11, 25);
      break;
  }

  return {
    question: `${num1} × ${num2}`,
    answer: num1 * num2,
    difficulty,
    operation: 'multiplication',
  };
};

const generatePercentageQuestion = (difficulty: number): Question => {
  let percentage: number, number: number;

  // Helper function to generate percentage ending in 0 or 5
  const getValidPercentage = (min: number, max: number): number => {
    const validPercentages: number[] = [];
    for (let i = min; i <= max; i++) {
      if (i % 5 === 0) {
        validPercentages.push(i);
      }
    }
    return validPercentages[getRandomInt(0, validPercentages.length - 1)];
  };

  switch (difficulty) {
    case 1:
      // Simple percentages ending in 0 or 5, even numbers for clean results
      percentage = getValidPercentage(10, 50);
      // Use even numbers to often produce whole answers
      number = getRandomInt(5, 49) * 2;
      break;
    case 2:
      // Any percentage ending in 0 or 5, with 2-digit numbers
      percentage = getValidPercentage(5, 100);
      number = getRandomInt(10, 99);
      break;
    case 3:
      // Any percentage ending in 0 or 5, with up to 3-digit numbers
      percentage = getValidPercentage(5, 100);
      number = getRandomInt(100, 999);
      break;
    case 4:
    default:
      // Higher difficulty: non-round percentages that may produce decimals
      percentage = getValidPercentage(5, 95);
      number = getRandomInt(10, 200);
      break;
  }

  // Compute raw answer
  const rawAnswer = (percentage / 100) * number;
  // Round to 1 decimal place for clarity
  const answer = Math.round(rawAnswer * 10) / 10;

  return {
    question: `${percentage}% of ${number}`,
    answer,
    difficulty,
    operation: 'percentage',
  };
};

export const generateQuestion = (
  operation: OperationType,
  difficulty: number,
  difficultyLevels?: { [key in OperationType]: number }
): Question => {
  if (operation === 'mixed' && difficultyLevels) {
    // Choose a random operation from the previous four
    const operations: OperationType[] = ['addition', 'subtraction', 'multiplication', 'percentage'];
    const randomOperation = operations[getRandomInt(0, operations.length - 1)];

    // Reduce difficulty for mixed round - use max difficulty of 2 (easier problems)
    const operationDifficulty = Math.min(difficultyLevels[randomOperation] || 1, 2);

    return generateQuestion(randomOperation, operationDifficulty);
  }

  switch (operation) {
    case 'addition':
      return generateAdditionQuestion(difficulty);
    case 'subtraction':
      return generateSubtractionQuestion(difficulty);
    case 'multiplication':
      return generateMultiplicationQuestion(difficulty);
    case 'percentage':
      return generatePercentageQuestion(difficulty);
    default:
      return generateAdditionQuestion(difficulty);
  }
};

export const checkAnswer = (userAnswer: string, correctAnswer: number): boolean => {
  const parsed = parseFloat(userAnswer);
  if (isNaN(parsed)) return false;
  // Treat mathematically equivalent numbers as identical (e.g., 12.5 === 12.50)
  return Math.abs(parsed - correctAnswer) < 0.001;
};

/**
 * Determines if the current question's answer requires a decimal.
 * Returns a hint string for the user.
 */
export const getAnswerHint = (answer: number): string => {
  if (Number.isInteger(answer)) {
    return 'ENTER INTEGER';
  }
  // Check how many decimal places
  const decimals = answer.toString().split('.')[1]?.length || 0;
  if (decimals === 1) {
    return 'ROUND TO 1 DECIMAL';
  }
  return `ROUND TO ${decimals} DECIMALS`;
};

/**
 * Determines if the current operation may require decimal input.
 */
export const operationRequiresDecimal = (operation: import('../types/game').OperationType, answer: number): boolean => {
  return !Number.isInteger(answer);
};

export const getNextDifficulty = (
  currentDifficulty: number,
  isCorrect: boolean,
  consecutiveCorrect: number
): number => {
  if (isCorrect) {
    // Increase difficulty after 3 consecutive correct answers
    if (consecutiveCorrect >= 3) {
      return Math.min(currentDifficulty + 1, 4); // Max difficulty is 4
    }
    return currentDifficulty; // Stay at same difficulty
  } else {
    // Decrease difficulty by one level on incorrect answer
    return Math.max(currentDifficulty - 1, 1); // Min difficulty is 1
  }
};

export const calculateWeightedScore = (difficultyProfile: { [key: number]: number }): number => {
  let totalScore = 0;

  Object.keys(difficultyProfile).forEach((level) => {
    const difficultyLevel = parseInt(level, 10);
    const count = difficultyProfile[difficultyLevel];
    totalScore += count * difficultyLevel;
  });

  return totalScore;
};
