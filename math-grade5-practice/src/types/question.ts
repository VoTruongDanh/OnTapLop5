// Question types for Math Grade 5 Practice

export type QuestionType = 'tu-duy' | 'tinh-nhanh' | 'toan-giai' | 'toan-co-ban';

export type Topic =
  // Semester 1
  | 'so-tu-nhien'
  | 'phan-so'
  | 'so-thap-phan-1'
  | 'hinh-hoc-co-ban'
  // Semester 2
  | 'so-thap-phan-2'
  | 'ti-so-phan-tram'
  | 'hinh-hoc-nang-cao'
  | 'on-tap-cuoi-nam';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Semester = 1 | 2;

export interface Question {
  id: string;
  semester: Semester;
  topic: Topic;
  type: QuestionType;
  difficulty: Difficulty;
  content: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  hints?: string[];
}
