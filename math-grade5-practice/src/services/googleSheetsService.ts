// Google Sheets Service - Gửi dữ liệu lên Google Sheets qua Apps Script
// Hướng dẫn setup: xem file SETUP_GOOGLE_SHEETS.md

import type { TestResult } from '../types/progress';

// URL của Google Apps Script Web App - cần thay thế sau khi deploy
const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

// Storage key cho thông tin học sinh
const STUDENT_INFO_KEY = 'math-grade5-student-info';

export interface StudentInfo {
  name: string;
  class?: string;
  savedAt: Date;
}

/**
 * Lưu thông tin học sinh vào localStorage
 */
export function saveStudentInfo(info: StudentInfo): void {
  try {
    localStorage.setItem(STUDENT_INFO_KEY, JSON.stringify({
      ...info,
      savedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.warn('Failed to save student info:', error);
  }
}

/**
 * Lấy thông tin học sinh từ localStorage
 */
export function getStudentInfo(): StudentInfo | null {
  try {
    const data = localStorage.getItem(STUDENT_INFO_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        savedAt: new Date(parsed.savedAt),
      };
    }
  } catch (error) {
    console.warn('Failed to load student info:', error);
  }
  return null;
}

/**
 * Xóa thông tin học sinh
 */
export function clearStudentInfo(): void {
  try {
    localStorage.removeItem(STUDENT_INFO_KEY);
  } catch (error) {
    console.warn('Failed to clear student info:', error);
  }
}

/**
 * Kiểm tra đã có thông tin học sinh chưa
 */
export function hasStudentInfo(): boolean {
  return getStudentInfo() !== null;
}

/**
 * Gửi kết quả kiểm tra lên Google Sheets
 */
export async function submitTestResultToSheets(
  result: TestResult,
  studentInfo: StudentInfo
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('Google Script URL not configured');
    return { success: false, error: 'Chưa cấu hình Google Sheets' };
  }

  try {
    const payload = {
      action: 'submitTest',
      data: {
        // Thông tin học sinh
        studentName: studentInfo.name,
        studentClass: studentInfo.class || '',
        
        // Thông tin bài kiểm tra
        testId: result.id,
        date: new Date(result.date).toISOString(),
        semester: result.semester,
        topics: result.topics.join(', '),
        
        // Kết quả
        score: result.score,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        wrongAnswers: result.totalQuestions - result.correctAnswers,
        accuracy: Math.round((result.correctAnswers / result.totalQuestions) * 100),
        timeSpent: result.timeSpent,
        timeSpentFormatted: formatTime(result.timeSpent),
      },
    };

    // Sử dụng fetch với redirect để bypass CORS
    const form = new FormData();
    form.append('payload', JSON.stringify(payload));
    
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: form,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to submit to Google Sheets:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Lỗi không xác định' 
    };
  }
}

/**
 * Gửi kết quả luyện tập lên Google Sheets
 */
export async function submitPracticeResultToSheets(
  mode: string,
  questionsAttempted: number,
  correctAnswers: number,
  timeSpent: number,
  studentInfo: StudentInfo
): Promise<{ success: boolean; error?: string }> {
  if (!GOOGLE_SCRIPT_URL) {
    return { success: false, error: 'Chưa cấu hình Google Sheets' };
  }

  try {
    const payload = {
      action: 'submitPractice',
      data: {
        studentName: studentInfo.name,
        studentClass: studentInfo.class || '',
        date: new Date().toISOString(),
        mode,
        questionsAttempted,
        correctAnswers,
        accuracy: questionsAttempted > 0 
          ? Math.round((correctAnswers / questionsAttempted) * 100) 
          : 0,
        timeSpent,
        timeSpentFormatted: formatTime(timeSpent),
      },
    };

    const form = new FormData();
    form.append('payload', JSON.stringify(payload));

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: form,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to submit practice to Google Sheets:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Lỗi không xác định' 
    };
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} phút ${secs} giây`;
}


// ============================================
// Đọc dữ liệu từ Google Sheets (cho Admin)
// ============================================

export interface SheetTestResult {
  'Thời gian': string;
  'Họ tên': string;
  'Lớp': string;
  'Học kỳ': string;
  'Chủ đề': string;
  'Điểm': number;
  'Số câu đúng': number;
  'Tổng câu': number;
  'Tỉ lệ %': string;
  'Thời gian làm': string;
  'Test ID': string;
}

export interface SheetPracticeResult {
  'Thời gian': string;
  'Họ tên': string;
  'Lớp': string;
  'Chế độ': string;
  'Số câu': number;
  'Đúng': number;
  'Tỉ lệ %': string;
  'ThoiGianLam': string;
}

/**
 * Lấy tất cả dữ liệu từ Google Sheets qua Apps Script
 */
export async function fetchAllDataFromSheets(): Promise<{
  success: boolean;
  testResults: SheetTestResult[];
  practiceResults: SheetPracticeResult[];
  error?: string;
}> {
  if (!GOOGLE_SCRIPT_URL) {
    return { success: false, testResults: [], practiceResults: [], error: 'Chưa cấu hình Google Sheets' };
  }

  try {
    const url = `${GOOGLE_SCRIPT_URL}?action=getAllData`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        testResults: data.testResults || [],
        practiceResults: data.practiceResults || [],
      };
    } else {
      return {
        success: false,
        testResults: [],
        practiceResults: [],
        error: data.error || 'Lỗi không xác định',
      };
    }
  } catch (error) {
    console.error('Failed to fetch from Google Sheets:', error);
    return {
      success: false,
      testResults: [],
      practiceResults: [],
      error: error instanceof Error ? error.message : 'Lỗi kết nối',
    };
  }
}
