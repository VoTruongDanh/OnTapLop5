// Question Service for Math Grade 5 Practice
// Provides functions to query and retrieve questions from the question bank

import type { Question, QuestionType, Topic, Semester, Difficulty } from '../types/question';
import { questionBank, semester1Topics, semester2Topics, getQuestionsBySemester, getTopicSemester } from '../data/questionBank';

/**
 * Get questions filtered by practice mode and optionally by semester
 * @param mode - The practice mode (tu-duy, tinh-nhanh, toan-giai, toan-co-ban)
 * @param semester - Optional semester filter (1 or 2)
 * @returns Array of questions matching the criteria
 */
export function getQuestionsByMode(mode: QuestionType, semester?: Semester): Question[] {
  let questions: Question[];
  
  if (semester) {
    questions = getQuestionsBySemester(semester);
  } else {
    // Get all questions from both semesters
    questions = [...getQuestionsBySemester(1), ...getQuestionsBySemester(2)];
  }
  
  return questions.filter(q => q.type === mode);
}

/**
 * Get questions filtered by topic
 * @param topic - The topic to filter by
 * @returns Array of questions for the specified topic
 */
export function getQuestionsByTopic(topic: Topic): Question[] {
  const semester = getTopicSemester(topic);
  const semesterData = semester === 1 ? questionBank.semester1 : questionBank.semester2;
  
  const key = topic as keyof typeof semesterData;
  return semesterData[key] || [];
}

/**
 * Parameters for random question selection
 */
export interface RandomQuestionsParams {
  count: number;
  mode?: QuestionType;
  semester?: Semester;
  topic?: Topic;
  difficulty?: Difficulty;
  excludeIds?: string[];
}

/**
 * Get random questions based on specified parameters
 * @param params - Parameters for filtering and selecting questions
 * @returns Array of randomly selected questions
 */
export function getRandomQuestions(params: RandomQuestionsParams): Question[] {
  const { count, mode, semester, topic, difficulty, excludeIds = [] } = params;
  
  let questions: Question[];
  
  // Start with topic-specific questions if topic is provided
  if (topic) {
    questions = getQuestionsByTopic(topic);
  } else if (semester) {
    questions = getQuestionsBySemester(semester);
  } else {
    questions = [...getQuestionsBySemester(1), ...getQuestionsBySemester(2)];
  }
  
  // Apply filters
  if (mode) {
    questions = questions.filter(q => q.type === mode);
  }
  
  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  
  // Exclude specific question IDs
  if (excludeIds.length > 0) {
    questions = questions.filter(q => !excludeIds.includes(q.id));
  }
  
  // Shuffle and select random questions
  const shuffled = shuffleArray([...questions]);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Get question by ID
 * @param id - The question ID
 * @returns The question or undefined if not found
 */
export function getQuestionById(id: string): Question | undefined {
  const allQuestions = [...getQuestionsBySemester(1), ...getQuestionsBySemester(2)];
  return allQuestions.find(q => q.id === id);
}

/**
 * Get all questions from the question bank
 * @returns Array of all questions
 */
export function getAllQuestions(): Question[] {
  return [...getQuestionsBySemester(1), ...getQuestionsBySemester(2)];
}

/**
 * Get all available topics for a semester
 * @param semester - The semester (1 or 2)
 * @returns Array of topics for the semester
 */
export function getTopicsForSemester(semester: Semester): Topic[] {
  return semester === 1 ? [...semester1Topics] : [...semester2Topics];
}

/**
 * Get question count statistics
 */
export interface QuestionStats {
  total: number;
  bySemester: {
    semester1: number;
    semester2: number;
  };
  byMode: Record<QuestionType, number>;
  byTopic: Record<Topic, number>;
  byDifficulty: Record<Difficulty, number>;
}

/**
 * Get statistics about the question bank
 * @returns Statistics object with counts
 */
export function getQuestionStats(): QuestionStats {
  const allQuestions = [...getQuestionsBySemester(1), ...getQuestionsBySemester(2)];
  
  const stats: QuestionStats = {
    total: allQuestions.length,
    bySemester: {
      semester1: getQuestionsBySemester(1).length,
      semester2: getQuestionsBySemester(2).length,
    },
    byMode: {
      'tu-duy': 0,
      'tinh-nhanh': 0,
      'toan-giai': 0,
      'toan-co-ban': 0,
    },
    byTopic: {
      'so-tu-nhien': 0,
      'phan-so': 0,
      'so-thap-phan-1': 0,
      'hinh-hoc-co-ban': 0,
      'so-thap-phan-2': 0,
      'ti-so-phan-tram': 0,
      'hinh-hoc-nang-cao': 0,
      'on-tap-cuoi-nam': 0,
    },
    byDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
  };
  
  allQuestions.forEach(q => {
    stats.byMode[q.type]++;
    stats.byTopic[q.topic]++;
    stats.byDifficulty[q.difficulty]++;
  });
  
  return stats;
}
