import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, StudentInfoModal } from '../common';
import type { Semester, Topic } from '../../types';
import type { TestSession } from '../../types/progress';
import { getTopicsForSemester } from '../../services/questionService';
import { getTopicDisplayName } from '../../services/scoringService';
import { loadActiveTestSession, clearActiveTestSession } from '../../services/storageService';
import { getStudentInfo, hasStudentInfo, clearStudentInfo, type StudentInfo } from '../../services/googleSheetsService';

const QUESTION_COUNT_OPTIONS = [10, 15, 20, 25, 30];

export function TestSetup() {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [questionCount, setQuestionCount] = useState(15);
  const [activeSession, setActiveSession] = useState<TestSession | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const availableTopics = selectedSemester ? getTopicsForSemester(selectedSemester) : [];

  // Check for active session and student info on mount
  useEffect(() => {
    const session = loadActiveTestSession();
    if (session) {
      setActiveSession(session);
    }
    
    const info = getStudentInfo();
    if (info) {
      setStudentInfo(info);
    }
  }, []);

  const handleSemesterChange = (semester: Semester) => {
    setSelectedSemester(semester);
    setSelectedTopics([]); // Reset topics when semester changes
  };

  const handleTopicToggle = (topic: Topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  const handleSelectAllTopics = () => {
    if (selectedTopics.length === availableTopics.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics([...availableTopics]);
    }
  };

  const handleStartTest = () => {
    if (selectedSemester && selectedTopics.length > 0) {
      // Kiểm tra đã có thông tin học sinh chưa
      if (!hasStudentInfo()) {
        setShowStudentModal(true);
        return;
      }
      
      const params = new URLSearchParams({
        semester: selectedSemester.toString(),
        topics: selectedTopics.join(','),
        count: questionCount.toString(),
      });
      navigate(`/test/taking?${params.toString()}`);
    }
  };

  const handleStudentInfoComplete = (info: StudentInfo) => {
    setStudentInfo(info);
    setShowStudentModal(false);
    
    // Tiếp tục bắt đầu bài kiểm tra
    if (selectedSemester && selectedTopics.length > 0) {
      const params = new URLSearchParams({
        semester: selectedSemester.toString(),
        topics: selectedTopics.join(','),
        count: questionCount.toString(),
      });
      navigate(`/test/taking?${params.toString()}`);
    }
  };

  const handleChangeStudent = () => {
    clearStudentInfo();
    setStudentInfo(null);
    setShowStudentModal(true);
  };

  const handleContinueActiveTest = () => {
    if (activeSession) {
      // Navigate with the session's original params
      const params = new URLSearchParams({
        semester: activeSession.semester.toString(),
        topics: activeSession.topics.join(','),
        count: activeSession.questionCount.toString(),
      });
      navigate(`/test/taking?${params.toString()}`);
    }
  };

  const handleStartNewTest = () => {
    clearActiveTestSession();
    setActiveSession(null);
  };

  const canStartTest = selectedSemester && selectedTopics.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Student Info Modal */}
      {showStudentModal && (
        <StudentInfoModal
          onComplete={handleStudentInfoComplete}
          onCancel={() => setShowStudentModal(false)}
          title="Nhập thông tin trước khi kiểm tra"
        />
      )}

      {/* Current Student Info */}
      {studentInfo && (
        <Card className="bg-green-50 border border-green-200">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">👤</div>
                <div>
                  <div className="font-bold text-green-800">{studentInfo.name}</div>
                  {studentInfo.class && (
                    <div className="text-sm text-green-600">Lớp: {studentInfo.class}</div>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleChangeStudent}>
                Đổi học sinh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Session Warning */}
      {activeSession && (
        <Card className="bg-orange-50 border border-orange-200">
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">⚠️</div>
              <div>
                <h3 className="font-bold text-orange-800">Bài kiểm tra đang làm dở</h3>
                <p className="text-orange-700 text-sm">
                  Bạn có một bài kiểm tra chưa hoàn thành.
                </p>
              </div>
            </div>
            
            <div className="bg-white/50 p-3 rounded-lg mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span>Học kỳ:</span>
                <span className="font-medium">Học kỳ {activeSession.semester}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Tiến độ:</span>
                <span className="font-medium">
                  {activeSession.answers.size}/{activeSession.questionCount} câu ({Math.round((activeSession.answers.size / activeSession.questionCount) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian còn lại:</span>
                <span className="font-medium text-orange-600">
                  {Math.floor(activeSession.timeRemaining / 60)} phút {activeSession.timeRemaining % 60} giây
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleContinueActiveTest}>
                ✅ Tiếp tục bài cũ
              </Button>
              <Button variant="outline" onClick={handleStartNewTest}>
                🆕 Tạo bài mới
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📝 Kiểm tra</h1>
        <p className="text-gray-600">Chọn học kỳ, chủ đề và số câu hỏi để bắt đầu bài kiểm tra</p>
      </div>

      {/* Step 1: Semester Selection */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Bước 1: Chọn học kỳ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleSemesterChange(1)}
            className="text-left w-full"
          >
            <Card
              hoverable
              className={`text-center transition-all ${
                selectedSemester === 1 ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
            >
              <div className="text-4xl mb-3">📗</div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Học kỳ 1</h3>
              <p className="text-sm text-gray-600">
                Số tự nhiên, Phân số, Số thập phân, Hình học cơ bản
              </p>
              {selectedSemester === 1 && (
                <span className="text-blue-500 text-xl mt-2 block">✓</span>
              )}
            </Card>
          </button>
          <button
            onClick={() => handleSemesterChange(2)}
            className="text-left w-full"
          >
            <Card
              hoverable
              className={`text-center transition-all ${
                selectedSemester === 2 ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
            >
              <div className="text-4xl mb-3">📘</div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Học kỳ 2</h3>
              <p className="text-sm text-gray-600">
                Số thập phân, Tỉ số phần trăm, Hình học nâng cao, Ôn tập
              </p>
              {selectedSemester === 2 && (
                <span className="text-blue-500 text-xl mt-2 block">✓</span>
              )}
            </Card>
          </button>
        </div>
      </section>

      {/* Step 2: Topic Selection */}
      {selectedSemester && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Bước 2: Chọn chủ đề</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllTopics}
            >
              {selectedTopics.length === availableTopics.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => handleTopicToggle(topic)}
                className="text-left w-full"
              >
                <Card
                  hoverable
                  className={`transition-all ${
                    selectedTopics.includes(topic)
                      ? 'ring-2 ring-green-500 ring-offset-2 bg-green-50'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedTopics.includes(topic)
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedTopics.includes(topic) && '✓'}
                    </div>
                    <span className="font-medium text-gray-800">
                      {getTopicDisplayName(topic)}
                    </span>
                  </div>
                </Card>
              </button>
            ))}
          </div>
          {selectedTopics.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Đã chọn {selectedTopics.length} chủ đề
            </p>
          )}
        </section>
      )}

      {/* Step 3: Question Count */}
      {selectedSemester && selectedTopics.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Bước 3: Số câu hỏi</h2>
          <div className="flex flex-wrap gap-3">
            {QUESTION_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all
                  ${questionCount === count
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {count} câu
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Summary and Start Button */}
      {canStartTest && (
        <Card className="bg-blue-50 border border-blue-200">
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl">📋</div>
              <div>
                <h3 className="font-bold text-blue-800">Tóm tắt bài kiểm tra</h3>
                <p className="text-blue-700">
                  Học kỳ {selectedSemester} • {selectedTopics.length} chủ đề • {questionCount} câu hỏi
                </p>
              </div>
            </div>
            <div className="text-sm text-blue-600 mb-4">
              <strong>Chủ đề:</strong> {selectedTopics.map(getTopicDisplayName).join(', ')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => navigate('/')}>
          ← Quay lại
        </Button>
        <Button
          onClick={handleStartTest}
          disabled={!canStartTest}
          size="lg"
        >
          Bắt đầu kiểm tra →
        </Button>
      </div>
    </div>
  );
}
