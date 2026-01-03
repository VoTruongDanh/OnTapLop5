// Progress tracking types for Math Grade 5 Practice

import type { QuestionType, Topic, Semester } from './question';

export interface AnswerRecord {
  questionId: string;
  studentAnswer: string | number;
  isCorrect: boolean;
  timeSpent: number; // seconds
}

export interface TestResult {
  id: string;
  date: Date;
  semester: Semester;
  topics: Topic[];
  score: number; // 0-10 scale
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // seconds
  answers: AnswerRecord[];
}

export interface PracticeSession {
  id: string;
  date: Date;
  mode: QuestionType;
  questionsAttempted: number;
  correctAnswers: number;
  timeSpent: number; // seconds
}

export interface TestSession {
  id: string;
  semester: Semester;
  topics: Topic[];
  questionCount: number;
  questions: string[]; // Array of question IDs
  currentIndex: number;
  answers: Map<number, string>; // questionIndex -> answer
  startTime: number; // timestamp
  timeRemaining: number; // seconds remaining
  isActive: boolean;
  createdAt: Date;
}

export interface StudentProgress {
  totalExercises: number;
  correctAnswers: number;
  testScores: TestResult[];
  practiceHistory: PracticeSession[];
  weakTopics: Topic[];
  lastActive: Date;
}
