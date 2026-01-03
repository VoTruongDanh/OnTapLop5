# Requirements Document

## Introduction

Website ôn tập Toán lớp 5 theo chương trình giáo dục Việt Nam - một nền tảng học tập hiện đại, tối giản giúp học sinh lớp 5 rèn luyện tư duy toán học thông qua các chế độ luyện tập đa dạng. Website hỗ trợ triển khai local hoặc public trên Railway.

## Glossary

- **System**: Hệ thống website ôn tập Toán lớp 5
- **Student**: Học sinh sử dụng website để ôn tập
- **Practice_Mode**: Chế độ luyện tập (tư duy, tính nhanh, toán giải, toán cơ bản)
- **Test_Mode**: Chế độ kiểm tra với thang điểm 10
- **Semester**: Học kỳ (Học kỳ 1 hoặc Học kỳ 2)
- **Question**: Câu hỏi/bài toán trong hệ thống
- **Score**: Điểm số theo thang 10

## Requirements

### Requirement 1: Giao diện người dùng

**User Story:** As a Student, I want to access a modern, minimalist interface, so that I can focus on learning without distractions.

#### Acceptance Criteria

1. WHEN a Student visits the website THEN the System SHALL display a clean, modern homepage with clear navigation
2. WHEN a Student uses the website on different devices THEN the System SHALL provide responsive design for mobile, tablet, and desktop
3. THE System SHALL use child-friendly colors and fonts appropriate for grade 5 students
4. WHEN a Student navigates between sections THEN the System SHALL provide smooth transitions and intuitive navigation

### Requirement 2: Phân loại kiến thức theo học kỳ

**User Story:** As a Student, I want to choose content by semester, so that I can practice topics relevant to my current learning period.

#### Acceptance Criteria

1. WHEN a Student accesses the practice section THEN the System SHALL display two semester options: Học kỳ 1 and Học kỳ 2
2. WHEN a Student selects Học kỳ 1 THEN the System SHALL show topics including: Ôn tập số tự nhiên, Phân số, Số thập phân (phần 1), Hình học cơ bản
3. WHEN a Student selects Học kỳ 2 THEN the System SHALL show topics including: Số thập phân (phần 2), Tỉ số phần trăm, Hình học nâng cao, Ôn tập cuối năm
4. THE System SHALL clearly indicate which semester each topic belongs to

### Requirement 3: Chế độ luyện tập Tư duy

**User Story:** As a Student, I want to practice logical thinking problems, so that I can develop my mathematical reasoning skills.

#### Acceptance Criteria

1. WHEN a Student selects "Tư duy" mode THEN the System SHALL present logic-based math problems
2. THE System SHALL include problems such as: tìm quy luật dãy số, bài toán suy luận, bài toán logic
3. WHEN a Student submits an answer THEN the System SHALL provide immediate feedback with explanation
4. THE System SHALL track progress and suggest appropriate difficulty levels

### Requirement 4: Chế độ Tính nhanh

**User Story:** As a Student, I want to practice quick calculations, so that I can improve my mental math speed.

#### Acceptance Criteria

1. WHEN a Student selects "Tính nhanh" mode THEN the System SHALL present timed calculation exercises
2. THE System SHALL include: cộng, trừ, nhân, chia với số tự nhiên, phân số, và số thập phân
3. WHEN a Student is in Tính nhanh mode THEN the System SHALL display a countdown timer
4. WHEN time expires or Student completes all questions THEN the System SHALL show results with time taken and accuracy
5. THE System SHALL allow Students to adjust difficulty and time limits

### Requirement 5: Chế độ Toán giải (Word Problems)

**User Story:** As a Student, I want to practice word problems, so that I can apply math concepts to real-world situations.

#### Acceptance Criteria

1. WHEN a Student selects "Toán giải" mode THEN the System SHALL present word problems in Vietnamese
2. THE System SHALL include problem types: bài toán về tỉ số, bài toán về chuyển động, bài toán về công việc, bài toán về diện tích và thể tích
3. WHEN a Student requests a hint THEN the System SHALL provide step-by-step guidance without revealing the answer
4. WHEN a Student submits an answer THEN the System SHALL show detailed solution steps

### Requirement 6: Chế độ Toán cơ bản

**User Story:** As a Student, I want to practice fundamental math operations, so that I can strengthen my basic skills.

#### Acceptance Criteria

1. WHEN a Student selects "Toán cơ bản" mode THEN the System SHALL present fundamental arithmetic exercises
2. THE System SHALL cover: phép tính với số tự nhiên, phân số, số thập phân, đơn vị đo lường, hình học cơ bản
3. THE System SHALL organize exercises by topic and difficulty level
4. WHEN a Student completes an exercise THEN the System SHALL provide immediate feedback

### Requirement 7: Chế độ Kiểm tra

**User Story:** As a Student, I want to take tests with scoring, so that I can evaluate my understanding and track my progress.

#### Acceptance Criteria

1. WHEN a Student selects "Kiểm tra" mode THEN the System SHALL allow selection of semester and topic
2. THE System SHALL generate tests with mixed question types appropriate for the selected content
3. WHEN a Student completes a test THEN the System SHALL calculate and display score on a 10-point scale
4. THE System SHALL show correct answers and explanations for incorrect responses
5. THE System SHALL save test history and display progress over time
6. IF a Student scores below 5 THEN the System SHALL suggest specific topics for review

### Requirement 8: Ngân hàng câu hỏi

**User Story:** As a Student, I want access to a comprehensive question bank, so that I have sufficient practice material.

#### Acceptance Criteria

1. THE System SHALL maintain a question bank covering all grade 5 math topics per Vietnamese curriculum
2. THE System SHALL categorize questions by: semester, topic, difficulty level, and question type
3. THE System SHALL include at least 50 questions per major topic
4. WHEN generating practice sessions or tests THEN the System SHALL randomly select questions to ensure variety

### Requirement 9: Theo dõi tiến độ

**User Story:** As a Student, I want to track my learning progress, so that I can see my improvement over time.

#### Acceptance Criteria

1. THE System SHALL track completed exercises, test scores, and time spent
2. WHEN a Student views their profile THEN the System SHALL display progress statistics and charts
3. THE System SHALL identify weak areas based on performance data
4. THE System SHALL provide personalized recommendations for improvement

### Requirement 10: Triển khai và truy cập

**User Story:** As a Developer, I want to deploy the website locally or on Railway, so that it can be accessed by students.

#### Acceptance Criteria

1. THE System SHALL support local development and deployment
2. THE System SHALL be deployable to Railway platform
3. THE System SHALL use environment variables for configuration
4. THE System SHALL provide clear deployment documentation
5. WHEN deployed THEN the System SHALL be accessible via web browser without additional software installation
