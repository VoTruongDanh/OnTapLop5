# Implementation Plan: Website Ôn tập Toán Lớp 5

## Overview

Triển khai website ôn tập Toán lớp 5 theo từng bước, bắt đầu từ cấu trúc dự án, sau đó xây dựng các module core, và cuối cùng là tích hợp các chế độ luyện tập và kiểm tra.

## Tasks

- [x] 1. Khởi tạo dự án và cấu trúc cơ bản
  - [x] 1.1 Tạo dự án React + TypeScript với Vite
    - Chạy `npm create vite@latest` với template react-ts
    - Cài đặt dependencies: tailwindcss, fast-check
    - Cấu hình Tailwind CSS
    - _Requirements: 1.1, 10.1_

  - [x] 1.2 Tạo cấu trúc thư mục và type definitions
    - Tạo thư mục: components, data, hooks, services, types, utils
    - Định nghĩa types: Question, QuestionType, Topic, StudentProgress, TestResult
    - _Requirements: 8.2_

  - [ ]* 1.3 Viết property test cho Question structure
    - **Property 1: Question Structure Completeness**
    - **Validates: Requirements 2.4, 6.3, 8.2**

- [x] 2. Xây dựng Question Bank
  - [x] 2.1 Tạo cấu trúc dữ liệu câu hỏi
    - Tạo file data/questionBank.ts
    - Định nghĩa cấu trúc cho semester1 và semester2
    - _Requirements: 8.1, 8.2_

  - [x] 2.2 Thêm câu hỏi Học kỳ 1
    - Số tự nhiên: 50+ câu hỏi
    - Phân số: 50+ câu hỏi
    - Số thập phân (phần 1): 50+ câu hỏi
    - Hình học cơ bản: 50+ câu hỏi
    - _Requirements: 2.2, 8.3_

  - [x] 2.3 Thêm câu hỏi Học kỳ 2
    - Số thập phân (phần 2): 50+ câu hỏi
    - Tỉ số phần trăm: 50+ câu hỏi
    - Hình học nâng cao: 50+ câu hỏi
    - Ôn tập cuối năm: 50+ câu hỏi
    - _Requirements: 2.3, 8.3_

  - [x] 2.4 Implement Question Service
    - Hàm getQuestionsByMode(mode, semester)
    - Hàm getQuestionsByTopic(topic)
    - Hàm getRandomQuestions(params)
    - _Requirements: 8.4_

  - [ ]* 2.5 Viết property test cho Mode-Question consistency
    - **Property 2: Mode-Question Type Consistency**
    - **Validates: Requirements 3.1**

  - [ ]* 2.6 Viết property test cho Question variety
    - **Property 11: Question Selection Variety**
    - **Validates: Requirements 8.4**

- [x] 3. Checkpoint - Đảm bảo Question Bank hoạt động
  - Chạy tất cả tests, hỏi user nếu có vấn đề

- [x] 4. Xây dựng Scoring Engine
  - [x] 4.1 Implement calculateScore function
    - Tính điểm theo thang 10: (correct/total) * 10
    - Làm tròn 1 chữ số thập phân
    - _Requirements: 7.3_

  - [x] 4.2 Implement feedback generation
    - Tạo feedback cho mỗi câu trả lời
    - Bao gồm: isCorrect, correctAnswer, explanation
    - _Requirements: 3.3, 5.4, 6.4_

  - [x] 4.3 Implement recommendation engine
    - Xác định weak topics từ test results
    - Đề xuất topics cần ôn tập khi điểm < 5
    - _Requirements: 7.6, 9.3, 9.4_

  - [ ]* 4.4 Viết property test cho Score calculation
    - **Property 6: Test Score Calculation**
    - **Validates: Requirements 7.3**

  - [ ]* 4.5 Viết property test cho Feedback completeness
    - **Property 3: Answer Feedback Completeness**
    - **Validates: Requirements 3.3, 5.4, 6.4**

  - [ ]* 4.6 Viết property test cho Low score recommendations
    - **Property 10: Low Score Recommendations**
    - **Validates: Requirements 7.6**

- [x] 5. Xây dựng Storage Service
  - [x] 5.1 Implement LocalStorage service
    - saveProgress, loadProgress
    - saveTestResult, getTestHistory
    - savePracticeSession, getPracticeHistory
    - _Requirements: 7.5, 9.1_

  - [ ]* 5.2 Viết property test cho Test history persistence
    - **Property 9: Test History Persistence (Round-trip)**
    - **Validates: Requirements 7.5**

  - [ ]* 5.3 Viết property test cho Progress tracking
    - **Property 12: Progress Tracking Completeness**
    - **Validates: Requirements 9.1**

- [x] 6. Checkpoint - Đảm bảo Core Services hoạt động
  - Chạy tất cả tests, hỏi user nếu có vấn đề

- [x] 7. Xây dựng UI Components cơ bản
  - [x] 7.1 Tạo Layout components
    - Header với navigation
    - Main layout với responsive design
    - Footer
    - _Requirements: 1.1, 1.2_

  - [x] 7.2 Tạo Common components
    - Button, Card components
    - QuestionCard component
    - Timer component
    - _Requirements: 4.3_

  - [x] 7.3 Tạo Homepage
    - Hiển thị các chế độ luyện tập
    - Navigation đến các sections
    - _Requirements: 1.1, 1.4_

- [x] 8. Implement Practice Modes
  - [x] 8.1 Tạo Practice Mode Selection page
    - Hiển thị 4 chế độ: Tư duy, Tính nhanh, Toán giải, Toán cơ bản
    - Cho phép chọn học kỳ
    - _Requirements: 2.1_

  - [x] 8.2 Implement Tư duy mode
    - Hiển thị bài toán logic
    - Hỗ trợ hints
    - Feedback sau mỗi câu
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 8.3 Implement Tính nhanh mode
    - Timer countdown
    - Các phép tính cơ bản
    - Kết quả với thời gian và độ chính xác
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 8.4 Implement Toán giải mode
    - Bài toán có lời văn
    - Hệ thống hints từng bước
    - Giải thích chi tiết
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 8.5 Implement Toán cơ bản mode
    - Phân loại theo topic và difficulty
    - Feedback ngay lập tức
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 8.6 Viết property test cho Hint non-disclosure
    - **Property 4: Hint Non-Disclosure**
    - **Validates: Requirements 5.3**

  - [ ]* 8.7 Viết property test cho Timed session results
    - **Property 5: Timed Session Results**
    - **Validates: Requirements 4.4**

- [x] 9. Implement Test Mode
  - [x] 9.1 Tạo Test Setup page
    - Chọn học kỳ và topics
    - Cấu hình số câu hỏi
    - _Requirements: 7.1_

  - [x] 9.2 Implement Test Taking interface
    - Hiển thị câu hỏi tuần tự
    - Tracking thời gian
    - _Requirements: 7.2_

  - [x] 9.3 Implement Test Results page
    - Hiển thị điểm số (thang 10)
    - Đáp án đúng và giải thích
    - Đề xuất ôn tập nếu điểm < 5
    - _Requirements: 7.3, 7.4, 7.6_

  - [ ]* 9.4 Viết property test cho Test content matching
    - **Property 7: Test Content Matching**
    - **Validates: Requirements 7.2**

  - [ ]* 9.5 Viết property test cho Incorrect answer explanation
    - **Property 8: Incorrect Answer Explanation**
    - **Validates: Requirements 7.4**

- [x] 10. Implement Progress Tracking
  - [x] 10.1 Tạo Progress Dashboard
    - Thống kê tổng quan
    - Biểu đồ tiến độ
    - _Requirements: 9.2_

  - [x] 10.2 Implement Weak Area Analysis
    - Xác định topics yếu
    - Đề xuất cá nhân hóa
    - _Requirements: 9.3, 9.4_

  - [ ]* 10.3 Viết property test cho Weak area identification
    - **Property 13: Weak Area Identification**
    - **Validates: Requirements 9.3, 9.4**

  - [ ]* 10.4 Viết property test cho Difficulty progression
    - **Property 14: Difficulty Progression**
    - **Validates: Requirements 3.4**

- [x] 11. Checkpoint - Đảm bảo tất cả features hoạt động
  - Chạy tất cả tests, hỏi user nếu có vấn đề

- [x] 12. Deployment Setup
  - [x] 12.1 Cấu hình cho Railway deployment
    - Tạo railway.json hoặc Procfile
    - Cấu hình environment variables
    - _Requirements: 10.2, 10.3_

  - [x] 12.2 Tạo documentation
    - README với hướng dẫn cài đặt local
    - Hướng dẫn deploy lên Railway
    - _Requirements: 10.4_

- [x] 13. Final Checkpoint
  - Đảm bảo tất cả tests pass
  - Kiểm tra deployment hoạt động
  - Hỏi user nếu có vấn đề

## Notes

- Tasks đánh dấu `*` là optional (tests) và có thể bỏ qua để có MVP nhanh hơn
- Mỗi task tham chiếu đến requirements cụ thể để đảm bảo traceability
- Checkpoints đảm bảo validation từng giai đoạn
- Property tests sử dụng fast-check library với minimum