export type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'percentage' | 'mixed';

export type RoundType = {
  id: number;
  name: string;
  operation: OperationType;
  duration: number; // in seconds
};

export type Question = {
  question: string;
  answer: number;
  difficulty: number;
  operation: OperationType;
};

export type RoundResult = {
  operation: OperationType;
  correctAnswers: number;
  totalAnswers: number;
  difficultyLevels: { [key: number]: number }; // difficulty level -> count of correct answers
};

export type DifficultyTimelineEntry = {
  questionIndex: number;
  difficulty: number;
  correct: boolean;
  operation: OperationType;
};

export type TestSession = {
  id: string;
  date: number; // timestamp
  totalWeightedScore: number;
  roundResults: RoundResult[];
  difficultyProfile: { [key: number]: number }; // difficulty level -> count of correct answers across all rounds
  difficultyTimeline?: DifficultyTimelineEntry[]; // tracks difficulty progression per question
  totalQuestions?: number; // total questions attempted
};

export type GameState = {
  currentRound: number;
  currentQuestion: Question;
  score: number;
  roundStartTime: number;
  timeRemaining: number;
  currentDifficulty: { [key in OperationType]: number };
  roundResults: RoundResult[];
  totalCorrectByDifficulty: { [key: number]: number };
  currentRoundCorrectAnswers: number; // Track correct answers for current round
  consecutiveCorrect: number; // Track consecutive correct answers for difficulty progression
  difficultyTimeline: DifficultyTimelineEntry[]; // tracks difficulty changes during session
  totalQuestionsAttempted: number; // total questions attempted
};

export const ROUNDS: RoundType[] = [
  { id: 1, name: 'Addition', operation: 'addition', duration: 60 },
  { id: 2, name: 'Subtraction', operation: 'subtraction', duration: 60 },
  { id: 3, name: 'Multiplication', operation: 'multiplication', duration: 60 },
  { id: 4, name: 'Percentages', operation: 'percentage', duration: 60 },
  { id: 5, name: 'Mixed', operation: 'mixed', duration: 60 },
];
