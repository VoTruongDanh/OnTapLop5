// Question Bank for Math Grade 5 Practice
// Organized by semester and topic
// Theo chương trình Chân trời sáng tạo 2025

import type { Question, Topic } from '../types/question';

// Import Semester 1 questions
import { soTuNhienQuestions } from './semester1/soTuNhien';
import { soTuNhienQuestionsExtra } from './semester1/soTuNhienExtra';
import { phanSoQuestions } from './semester1/phanSo';
import { phanSoQuestionsExtra } from './semester1/phanSoExtra';
import { soThapPhan1Questions } from './semester1/soThapPhan1';
import { soThapPhan1ExtraQuestions } from './semester1/soThapPhan1Extra';
import { hinhHocCoBanQuestions } from './semester1/hinhHocCoBan';
import { hinhHocCoBanExtraQuestions } from './semester1/hinhHocCoBanExtra';

// Import Semester 2 questions
import { soThapPhan2Questions } from './semester2/soThapPhan2';
import { soThapPhan2ExtraQuestions } from './semester2/soThapPhan2Extra';
import { tiSoPhanTramQuestions } from './semester2/tiSoPhanTram';
import { tiSoPhanTramExtraQuestions } from './semester2/tiSoPhanTramExtra';
import { hinhHocNangCaoQuestions } from './semester2/hinhHocNangCao';
import { hinhHocNangCaoQuestionsExtra } from './semester2/hinhHocNangCaoExtra';
import { onTapCuoiNamQuestions } from './semester2/onTapCuoiNam';

// Type definitions for Question Bank structure
export interface SemesterQuestions {
  'so-tu-nhien': Question[];
  'phan-so': Question[];
  'so-thap-phan-1': Question[];
  'hinh-hoc-co-ban': Question[];
}

export interface Semester2Questions {
  'so-thap-phan-2': Question[];
  'ti-so-phan-tram': Question[];
  'hinh-hoc-nang-cao': Question[];
  'on-tap-cuoi-nam': Question[];
}

export interface QuestionBank {
  semester1: SemesterQuestions;
  semester2: Semester2Questions;
}

// Semester 1 Topics mapping
export const semester1Topics: Topic[] = [
  'so-tu-nhien',
  'phan-so',
  'so-thap-phan-1',
  'hinh-hoc-co-ban',
];

// Semester 2 Topics mapping
export const semester2Topics: Topic[] = [
  'so-thap-phan-2',
  'ti-so-phan-tram',
  'hinh-hoc-nang-cao',
  'on-tap-cuoi-nam',
];

// Question Bank Data
export const questionBank: QuestionBank = {
  semester1: {
    'so-tu-nhien': [...soTuNhienQuestions, ...soTuNhienQuestionsExtra],
    'phan-so': [...phanSoQuestions, ...phanSoQuestionsExtra],
    'so-thap-phan-1': [...soThapPhan1Questions, ...soThapPhan1ExtraQuestions],
    'hinh-hoc-co-ban': [...hinhHocCoBanQuestions, ...hinhHocCoBanExtraQuestions],
  },
  semester2: {
    'so-thap-phan-2': [...soThapPhan2Questions, ...soThapPhan2ExtraQuestions],
    'ti-so-phan-tram': [...tiSoPhanTramQuestions, ...tiSoPhanTramExtraQuestions],
    'hinh-hoc-nang-cao': [...hinhHocNangCaoQuestions, ...hinhHocNangCaoQuestionsExtra],
    'on-tap-cuoi-nam': onTapCuoiNamQuestions,
  },
};

// Helper function to get all questions for a semester
export function getQuestionsBySemester(semester: 1 | 2): Question[] {
  const topics = semester === 1 ? semester1Topics : semester2Topics;
  const semesterData = semester === 1 ? questionBank.semester1 : questionBank.semester2;
  
  return topics.flatMap(topic => {
    const key = topic as keyof typeof semesterData;
    return semesterData[key] || [];
  });
}

// Helper function to check if a topic belongs to a semester
export function getTopicSemester(topic: Topic): 1 | 2 {
  return semester1Topics.includes(topic) ? 1 : 2;
}
