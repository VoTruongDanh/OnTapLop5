// Storage Service for Math Grade 5 Practice
// Provides LocalStorage persistence for progress, test results, and practice sessions
// Requirements: 7.5, 9.1

import type { StudentProgress, TestResult, PracticeSession, TestSession } from '../types/progress';
import type { Topic } from '../types/question';

// Storage keys
const STORAGE_KEYS = {
  PROGRESS: 'math-grade5-progress',
  TEST_HISTORY: 'math-grade5-test-history',
  PRACTICE_HISTORY: 'math-grade5-practice-history',
  ACTIVE_TEST_SESSION: 'math-grade5-active-test-session',
} as const;

/**
 * Check if localStorage is available
 * Falls back gracefully if not available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// In-memory fallback storage when localStorage is unavailable
const memoryStorage: {
  progress: StudentProgress | null;
  testHistory: TestResult[];
  practiceHistory: PracticeSession[];
  activeTestSession: TestSession | null;
} = {
  progress: null,
  testHistory: [],
  practiceHistory: [],
  activeTestSession: null,
};

/**
 * Create default empty progress
 */
function createDefaultProgress(): StudentProgress {
  return {
    totalExercises: 0,
    correctAnswers: 0,
    testScores: [],
    practiceHistory: [],
    weakTopics: [],
    lastActive: new Date(),
  };
}

/**
 * Serialize data for storage
 * Handles Date objects and Map objects conversion
 */
function serialize<T>(data: T): string {
  return JSON.stringify(data, (_key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    if (value instanceof Map) {
      return { __type: 'Map', value: Array.from(value.entries()) };
    }
    return value;
  });
}

/**
 * Deserialize data from storage
 * Restores Date objects and Map objects
 */
function deserialize<T>(json: string): T {
  return JSON.parse(json, (_key, value) => {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    if (value && typeof value === 'object' && value.__type === 'Map') {
      return new Map(value.value);
    }
    return value;
  });
}


// ============================================
// Progress Management
// ============================================

/**
 * Save student progress to storage
 * @param progress - Student progress data to save
 */
export function saveProgress(progress: StudentProgress): void {
  const progressToSave: StudentProgress = {
    ...progress,
    lastActive: new Date(),
  };

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, serialize(progressToSave));
    } catch (error) {
      console.warn('Failed to save progress to localStorage:', error);
      memoryStorage.progress = progressToSave;
    }
  } else {
    memoryStorage.progress = progressToSave;
  }
}

/**
 * Load student progress from storage
 * @returns Student progress or null if not found
 */
export function loadProgress(): StudentProgress | null {
  if (isLocalStorageAvailable()) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (data) {
        return deserialize<StudentProgress>(data);
      }
    } catch (error) {
      console.warn('Failed to load progress from localStorage:', error);
      // Try to return memory storage as fallback
      return memoryStorage.progress;
    }
  } else {
    return memoryStorage.progress;
  }
  return null;
}

/**
 * Get progress or create default if not exists
 * @returns Student progress (existing or new default)
 */
export function getOrCreateProgress(): StudentProgress {
  const existing = loadProgress();
  if (existing) {
    return existing;
  }
  const defaultProgress = createDefaultProgress();
  saveProgress(defaultProgress);
  return defaultProgress;
}

// ============================================
// Test History Management
// ============================================

/**
 * Save a test result to history
 * Also updates the overall progress
 * @param result - Test result to save
 */
export function saveTestResult(result: TestResult): void {
  const history = getTestHistory();
  history.push(result);

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEYS.TEST_HISTORY, serialize(history));
    } catch (error) {
      console.warn('Failed to save test result to localStorage:', error);
      memoryStorage.testHistory = history;
    }
  } else {
    memoryStorage.testHistory = history;
  }

  // Update overall progress
  updateProgressFromTestResult(result);
}

/**
 * Get all test history
 * @returns Array of test results
 */
export function getTestHistory(): TestResult[] {
  if (isLocalStorageAvailable()) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEST_HISTORY);
      if (data) {
        return deserialize<TestResult[]>(data);
      }
    } catch (error) {
      console.warn('Failed to load test history from localStorage:', error);
      return [...memoryStorage.testHistory];
    }
  } else {
    return [...memoryStorage.testHistory];
  }
  return [];
}

/**
 * Update progress after a test result
 */
function updateProgressFromTestResult(result: TestResult): void {
  const progress = getOrCreateProgress();
  
  progress.totalExercises += result.totalQuestions;
  progress.correctAnswers += result.correctAnswers;
  progress.testScores.push(result);
  progress.lastActive = new Date();
  
  // Update weak topics based on this result
  if (result.score < 5) {
    for (const topic of result.topics) {
      if (!progress.weakTopics.includes(topic)) {
        progress.weakTopics.push(topic);
      }
    }
  }
  
  saveProgress(progress);
}


// ============================================
// Practice Session Management
// ============================================

/**
 * Save a practice session to history
 * Also updates the overall progress
 * @param session - Practice session to save
 */
export function savePracticeSession(session: PracticeSession): void {
  const history = getPracticeHistory();
  history.push(session);

  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRACTICE_HISTORY, serialize(history));
    } catch (error) {
      console.warn('Failed to save practice session to localStorage:', error);
      memoryStorage.practiceHistory = history;
    }
  } else {
    memoryStorage.practiceHistory = history;
  }

  // Update overall progress
  updateProgressFromPracticeSession(session);
}

/**
 * Get all practice history
 * @returns Array of practice sessions
 */
export function getPracticeHistory(): PracticeSession[] {
  if (isLocalStorageAvailable()) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRACTICE_HISTORY);
      if (data) {
        return deserialize<PracticeSession[]>(data);
      }
    } catch (error) {
      console.warn('Failed to load practice history from localStorage:', error);
      return [...memoryStorage.practiceHistory];
    }
  } else {
    return [...memoryStorage.practiceHistory];
  }
  return [];
}

/**
 * Update progress after a practice session
 */
function updateProgressFromPracticeSession(session: PracticeSession): void {
  const progress = getOrCreateProgress();
  
  progress.totalExercises += session.questionsAttempted;
  progress.correctAnswers += session.correctAnswers;
  progress.practiceHistory.push(session);
  progress.lastActive = new Date();
  
  saveProgress(progress);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Clear all stored data
 * Useful for testing or resetting the application
 */
export function clearAllData(): void {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
      localStorage.removeItem(STORAGE_KEYS.TEST_HISTORY);
      localStorage.removeItem(STORAGE_KEYS.PRACTICE_HISTORY);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TEST_SESSION);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
  
  // Also clear memory storage
  memoryStorage.progress = null;
  memoryStorage.testHistory = [];
  memoryStorage.practiceHistory = [];
  memoryStorage.activeTestSession = null;
}


// ============================================
// Test Session Management (for persistence during test taking)
// ============================================

/**
 * Save active test session to storage
 * This allows users to continue tests after page refresh
 * @param session - Test session to save
 */
export function saveActiveTestSession(session: TestSession): void {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TEST_SESSION, serialize(session));
    } catch (error) {
      console.warn('Failed to save active test session to localStorage:', error);
      memoryStorage.activeTestSession = session;
    }
  } else {
    memoryStorage.activeTestSession = session;
  }
}

/**
 * Load active test session from storage
 * @returns Active test session or null if not found
 */
export function loadActiveTestSession(): TestSession | null {
  if (isLocalStorageAvailable()) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEST_SESSION);
      if (data) {
        const session = deserialize<TestSession>(data);
        // Check if session is still valid (not expired)
        if (session.isActive && session.timeRemaining > 0) {
          return session;
        } else {
          // Clean up expired session
          clearActiveTestSession();
          return null;
        }
      }
    } catch (error) {
      console.warn('Failed to load active test session from localStorage:', error);
      return memoryStorage.activeTestSession;
    }
  } else {
    return memoryStorage.activeTestSession;
  }
  return null;
}

/**
 * Clear active test session from storage
 * Called when test is completed or abandoned
 */
export function clearActiveTestSession(): void {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TEST_SESSION);
    } catch (error) {
      console.warn('Failed to clear active test session from localStorage:', error);
    }
  }
  memoryStorage.activeTestSession = null;
}

/**
 * Update active test session with new data
 * @param updates - Partial session data to update
 */
export function updateActiveTestSession(updates: Partial<TestSession>): void {
  const currentSession = loadActiveTestSession();
  if (currentSession) {
    const updatedSession: TestSession = {
      ...currentSession,
      ...updates,
    };
    saveActiveTestSession(updatedSession);
  }
}

/**
 * Check if there's an active test session
 * @returns true if there's an active session
 */
export function hasActiveTestSession(): boolean {
  return loadActiveTestSession() !== null;
}

/**
 * Get storage statistics
 * @returns Object with counts of stored items
 */
export function getStorageStats(): {
  testCount: number;
  practiceCount: number;
  hasProgress: boolean;
} {
  return {
    testCount: getTestHistory().length,
    practiceCount: getPracticeHistory().length,
    hasProgress: loadProgress() !== null,
  };
}

/**
 * Export all data for backup
 * @returns All stored data as a single object
 */
export function exportAllData(): {
  progress: StudentProgress | null;
  testHistory: TestResult[];
  practiceHistory: PracticeSession[];
  exportDate: Date;
} {
  return {
    progress: loadProgress(),
    testHistory: getTestHistory(),
    practiceHistory: getPracticeHistory(),
    exportDate: new Date(),
  };
}

/**
 * Import data from backup
 * @param data - Data to import
 * @param overwrite - If true, replaces existing data; if false, merges
 */
export function importData(
  data: {
    progress?: StudentProgress | null;
    testHistory?: TestResult[];
    practiceHistory?: PracticeSession[];
  },
  overwrite: boolean = false
): void {
  if (overwrite) {
    clearAllData();
  }

  if (data.progress) {
    saveProgress(data.progress);
  }

  if (data.testHistory) {
    for (const result of data.testHistory) {
      const history = getTestHistory();
      // Avoid duplicates by checking ID
      if (!history.some(r => r.id === result.id)) {
        if (isLocalStorageAvailable()) {
          try {
            history.push(result);
            localStorage.setItem(STORAGE_KEYS.TEST_HISTORY, serialize(history));
          } catch (error) {
            console.warn('Failed to import test result:', error);
          }
        } else {
          memoryStorage.testHistory.push(result);
        }
      }
    }
  }

  if (data.practiceHistory) {
    for (const session of data.practiceHistory) {
      const history = getPracticeHistory();
      // Avoid duplicates by checking ID
      if (!history.some(s => s.id === session.id)) {
        if (isLocalStorageAvailable()) {
          try {
            history.push(session);
            localStorage.setItem(STORAGE_KEYS.PRACTICE_HISTORY, serialize(history));
          } catch (error) {
            console.warn('Failed to import practice session:', error);
          }
        } else {
          memoryStorage.practiceHistory.push(session);
        }
      }
    }
  }
}

/**
 * Get weak topics from progress
 * @returns Array of weak topics
 */
export function getWeakTopics(): Topic[] {
  const progress = loadProgress();
  return progress?.weakTopics ?? [];
}

/**
 * Update weak topics in progress
 * @param topics - New list of weak topics
 */
export function updateWeakTopics(topics: Topic[]): void {
  const progress = getOrCreateProgress();
  progress.weakTopics = topics;
  saveProgress(progress);
}
