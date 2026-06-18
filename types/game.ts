export type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'percentage' | 'mixed';

export type GameMode = {
  id: string;
  name: string;
  operation: OperationType;
  icon: string;
  color: string;
  gradientColors?: [string, string];
  description: string;
};

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
  gameMode?: OperationType; // which mode was played
  duration?: number; // session duration in seconds (60 or 300)
  finalSprintCorrect?: number; // correct answers during final sprint
  finalSprintTotal?: number; // total questions during final sprint
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
  difficultyLevel: number; // current active difficulty level for the mode
};

export const GAME_MODES: GameMode[] = [
  {
    id: 'addition',
    name: 'Addition',
    operation: 'addition',
    icon: '+',
    color: '#00F5FF',
    description: 'Quick addition drills',
  },
  {
    id: 'subtraction',
    name: 'Subtraction',
    operation: 'subtraction',
    icon: '−',
    color: '#3B82F6',
    description: 'Speedy subtraction',
  },
  {
    id: 'multiplication',
    name: 'Multiplication',
    operation: 'multiplication',
    icon: '×',
    color: '#8B5CF6',
    description: 'Times table mastery',
  },
  {
    id: 'percentage',
    name: 'Percentages',
    operation: 'percentage',
    icon: '%',
    color: '#10B981',
    description: 'Percentage calculations',
  },
  {
    id: 'mixed',
    name: 'Mixed',
    operation: 'mixed',
    icon: '∞',
    color: '#00F5FF',
    gradientColors: ['#00F5FF', '#8B5CF6'],
    description: 'All operations combined',
  },
];

// The full 5-minute challenge mode ID
export const FULL_CHALLENGE_MODE_ID = 'full_challenge';
// Training modes (1 min) are all other modes in GAME_MODES
export const TRAINING_MODES = GAME_MODES.filter(m => m.id !== 'full_challenge');

export const ROUNDS: RoundType[] = [
  { id: 1, name: 'Addition', operation: 'addition', duration: 60 },
  { id: 2, name: 'Subtraction', operation: 'subtraction', duration: 60 },
  { id: 3, name: 'Multiplication', operation: 'multiplication', duration: 60 },
  { id: 4, name: 'Percentages', operation: 'percentage', duration: 60 },
  { id: 5, name: 'Mixed', operation: 'mixed', duration: 60 },
];
