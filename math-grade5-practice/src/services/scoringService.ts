// Scoring Service for Math Grade 5 Practice
// Provides functions for score calculation, feedback generation, and recommendations

import type { Question, Topic } from '../types/question';
import type { TestResult } from '../types/progress';

/**
 * Calculate score on a 10-point scale
 * Formula: (correct / total) * 10, rounded to 1 decimal place
 * @param correct - Number of correct answers
 * @param total - Total number of questions
 * @returns Score on 0-10 scale, rounded to 1 decimal place
 * @throws Error if total is 0 or if correct > total
 */
export function calculateScore(correct: number, total: number): number {
  if (total === 0) {
    throw new Error('Total questions cannot be zero');
  }
  if (correct < 0 || total < 0) {
    throw new Error('Values cannot be negative');
  }
  if (correct > total) {
    throw new Error('Correct answers cannot exceed total questions');
  }
  
  const score = (correct / total) * 10;
  // Round to 1 decimal place
  return Math.round(score * 10) / 10;
}

/**
 * Get grade label based on score
 * @param score - Score on 0-10 scale
 * @returns Grade label in Vietnamese
 */
export function calculateGrade(score: number): string {
  if (score >= 9) return 'Xuất sắc';
  if (score >= 8) return 'Giỏi';
  if (score >= 6.5) return 'Khá';
  if (score >= 5) return 'Trung bình';
  return 'Cần cố gắng';
}


/**
 * Feedback for a single answer
 */
export interface AnswerFeedback {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string | number;
  explanation: string;
  studentAnswer: string | number;
}

/**
 * Generate feedback for a single answer
 * @param question - The question that was answered
 * @param studentAnswer - The student's answer
 * @returns Feedback object with correctness, correct answer, and explanation
 */
export function generateAnswerFeedback(
  question: Question,
  studentAnswer: string | number
): AnswerFeedback {
  const isCorrect = checkAnswer(question, studentAnswer);
  
  return {
    questionId: question.id,
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    studentAnswer,
  };
}

/**
 * Check if an answer is correct
 * Handles both string and number comparisons
 * @param question - The question
 * @param studentAnswer - The student's answer
 * @returns true if the answer is correct
 */
export function checkAnswer(question: Question, studentAnswer: string | number): boolean {
  const correctAnswer = question.correctAnswer;
  
  // Normalize both answers for comparison
  const normalizedStudent = normalizeAnswer(studentAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);
  
  return normalizedStudent === normalizedCorrect;
}

/**
 * Normalize an answer for comparison
 * - Trims whitespace for strings
 * - Converts numbers to strings for consistent comparison
 * - Handles decimal formats (comma vs dot)
 * - Removes trailing zeros after decimal point
 */
function normalizeAnswer(answer: string | number): string {
  if (typeof answer === 'number') {
    // Remove trailing zeros: 7.0 -> 7, 7.50 -> 7.5
    return parseFloat(answer.toString()).toString();
  }
  
  let normalized = answer.trim().toLowerCase();
  
  // Replace comma with dot for decimal numbers (Vietnamese format)
  normalized = normalized.replace(',', '.');
  
  // Try to parse as number to normalize format
  const num = parseFloat(normalized);
  if (!isNaN(num)) {
    // Remove trailing zeros: "7.0" -> "7", "7.50" -> "7.5"
    return num.toString();
  }
  
  return normalized;
}

/**
 * Generate feedback for multiple answers
 * @param questions - Array of questions
 * @param answers - Array of student answers (in same order as questions)
 * @returns Array of feedback objects
 */
export function generateBatchFeedback(
  questions: Question[],
  answers: (string | number)[]
): AnswerFeedback[] {
  return questions.map((question, index) => {
    const studentAnswer = answers[index] ?? '';
    return generateAnswerFeedback(question, studentAnswer);
  });
}

/**
 * Summary feedback for a test or practice session
 */
export interface SessionFeedback {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  grade: string;
  answerFeedback: AnswerFeedback[];
}

/**
 * Generate complete feedback for a session
 * @param questions - Array of questions
 * @param answers - Array of student answers
 * @returns Complete session feedback
 */
export function generateSessionFeedback(
  questions: Question[],
  answers: (string | number)[]
): SessionFeedback {
  const answerFeedback = generateBatchFeedback(questions, answers);
  const correctAnswers = answerFeedback.filter(f => f.isCorrect).length;
  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? calculateScore(correctAnswers, totalQuestions) : 0;
  const grade = calculateGrade(score);
  
  return {
    totalQuestions,
    correctAnswers,
    score,
    grade,
    answerFeedback,
  };
}


/**
 * Topic performance statistics
 */
export interface TopicPerformance {
  topic: Topic;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
}

/**
 * Recommendation for improvement
 */
export interface TopicRecommendation {
  topic: Topic;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  averageScore: number;
}

/**
 * Analyze performance by topic from test results
 * @param results - Array of test results
 * @param questions - Map of question ID to Question (for topic lookup)
 * @returns Map of topic to performance statistics
 */
export function analyzeTopicPerformance(
  results: TestResult[],
  questionLookup: Map<string, Question>
): Map<Topic, TopicPerformance> {
  const topicStats = new Map<Topic, { correct: number; total: number }>();
  
  // Aggregate answers by topic
  for (const result of results) {
    for (const answer of result.answers) {
      const question = questionLookup.get(answer.questionId);
      if (!question) continue;
      
      const topic = question.topic;
      const current = topicStats.get(topic) || { correct: 0, total: 0 };
      
      current.total++;
      if (answer.isCorrect) {
        current.correct++;
      }
      
      topicStats.set(topic, current);
    }
  }
  
  // Convert to TopicPerformance
  const performance = new Map<Topic, TopicPerformance>();
  
  for (const [topic, stats] of topicStats) {
    const averageScore = stats.total > 0 
      ? calculateScore(stats.correct, stats.total) 
      : 0;
    
    performance.set(topic, {
      topic,
      totalQuestions: stats.total,
      correctAnswers: stats.correct,
      averageScore,
    });
  }
  
  return performance;
}

/**
 * Identify weak topics based on test results
 * A topic is considered weak if average score is below 5
 * @param results - Array of test results
 * @param questionLookup - Map of question ID to Question
 * @returns Array of weak topics sorted by score (lowest first)
 */
export function identifyWeakTopics(
  results: TestResult[],
  questionLookup: Map<string, Question>
): Topic[] {
  const performance = analyzeTopicPerformance(results, questionLookup);
  
  const weakTopics: { topic: Topic; score: number }[] = [];
  
  for (const [topic, stats] of performance) {
    if (stats.averageScore < 5) {
      weakTopics.push({ topic, score: stats.averageScore });
    }
  }
  
  // Sort by score ascending (weakest first)
  weakTopics.sort((a, b) => a.score - b.score);
  
  return weakTopics.map(w => w.topic);
}

/**
 * Generate recommendations based on test results
 * @param results - Array of test results
 * @param questionLookup - Map of question ID to Question
 * @returns Array of recommendations sorted by priority
 */
export function getRecommendations(
  results: TestResult[],
  questionLookup: Map<string, Question>
): TopicRecommendation[] {
  const performance = analyzeTopicPerformance(results, questionLookup);
  const recommendations: TopicRecommendation[] = [];
  
  for (const [topic, stats] of performance) {
    if (stats.averageScore < 5) {
      // High priority: score below 5
      recommendations.push({
        topic,
        reason: `Điểm trung bình ${stats.averageScore}/10 - Cần ôn tập lại kiến thức cơ bản`,
        priority: stats.averageScore < 3 ? 'high' : 'medium',
        averageScore: stats.averageScore,
      });
    } else if (stats.averageScore < 7) {
      // Low priority: score between 5 and 7
      recommendations.push({
        topic,
        reason: `Điểm trung bình ${stats.averageScore}/10 - Có thể cải thiện thêm`,
        priority: 'low',
        averageScore: stats.averageScore,
      });
    }
  }
  
  // Sort by priority (high > medium > low) then by score (lowest first)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.averageScore - b.averageScore;
  });
  
  return recommendations;
}

/**
 * Get recommendations for a single test result
 * Returns topics to review if score is below 5
 * @param result - Single test result
 * @param questionLookup - Map of question ID to Question
 * @returns Array of topic recommendations
 */
export function getTestRecommendations(
  result: TestResult,
  questionLookup: Map<string, Question>
): TopicRecommendation[] {
  // Only provide recommendations if overall score is below 5
  if (result.score >= 5) {
    return [];
  }
  
  return getRecommendations([result], questionLookup);
}

/**
 * Get topic name in Vietnamese
 */
export function getTopicDisplayName(topic: Topic): string {
  const names: Record<Topic, string> = {
    'so-tu-nhien': 'Số tự nhiên',
    'phan-so': 'Phân số',
    'so-thap-phan-1': 'Số thập phân (phần 1)',
    'hinh-hoc-co-ban': 'Hình học cơ bản',
    'so-thap-phan-2': 'Số thập phân (phần 2)',
    'ti-so-phan-tram': 'Tỉ số phần trăm',
    'hinh-hoc-nang-cao': 'Hình học nâng cao',
    'on-tap-cuoi-nam': 'Ôn tập cuối năm',
  };
  return names[topic] || topic;
}
