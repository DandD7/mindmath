import { Question, OperationType } from '@/types/game';

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateAdditionQuestion = (difficulty: number): Question => {
  let num1: number, num2: number;

  switch (difficulty) {
    case 1:
      num1 = getRandomInt(1, 20);
      num2 = getRandomInt(1, 20);
      break;
    case 2:
      num1 = getRandomInt(1, 50);
      num2 = getRandomInt(1, 50);
      break;
    case 3:
      num1 = getRandomInt(1, 99);
      num2 = getRandomInt(1, 99);
      break;
    case 4:
    default:
      num1 = getRandomInt(10, 999);
      num2 = getRandomInt(10, 999);
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
      num1 = getRandomInt(1, 20);
      num2 = getRandomInt(1, num1);
      break;
    case 2:
      num1 = getRandomInt(1, 50);
      num2 = getRandomInt(1, num1);
      break;
    case 3:
      num1 = getRandomInt(1, 99);
      num2 = getRandomInt(1, num1);
      break;
    case 4:
    default:
      num1 = getRandomInt(100, 999);
      num2 = getRandomInt(10, num1);
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
      num1 = getRandomInt(1, 12);
      num2 = getRandomInt(1, 12);
      break;
    case 2:
      num1 = getRandomInt(2, 20);
      num2 = getRandomInt(2, 20);
      break;
    case 3:
      num1 = getRandomInt(10, 99);
      num2 = getRandomInt(2, 12);
      break;
    case 4:
    default:
      // Cap at 2-digit x 2-digit (max difficulty)
      num1 = getRandomInt(10, 99);
      num2 = getRandomInt(10, 99);
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
      // Simple percentages ending in 0 or 5
      percentage = getValidPercentage(10, 50);
      number = getRandomInt(10, 99);
      break;
    case 2:
      // Any percentage ending in 0 or 5, with 2-digit numbers
      percentage = getValidPercentage(5, 100);
      number = getRandomInt(10, 99);
      break;
    case 3:
    default:
      // Any percentage ending in 0 or 5, with up to 3-digit numbers
      percentage = getValidPercentage(5, 100);
      number = getRandomInt(100, 999);
      break;
  }

  // Round to nearest whole number
  const answer = Math.round((percentage / 100) * number);

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
    const operationDifficulty = difficultyLevels[randomOperation] || 1;

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
  const parsed = parseInt(userAnswer, 10);
  return !isNaN(parsed) && parsed === correctAnswer;
};

export const getNextDifficulty = (currentDifficulty: number, isCorrect: boolean): number => {
  if (isCorrect) {
    return Math.min(currentDifficulty + 1, 4); // Max difficulty is 4
  }
  return currentDifficulty;
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
