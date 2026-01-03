import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, Button, Timer } from '../common';
import type { Question, Semester, Topic } from '../../types';
import type { AnswerRecord, TestResult, TestSession } from '../../types/progress';
import { getRandomQuestions, getQuestionById } from '../../services/questionService';
import { checkAnswer } from '../../services/scoringService';
import { 
  saveTestResult, 
  saveActiveTestSession, 
  loadActiveTestSession, 
  clearActiveTestSession 
} from '../../services/storageService';
import { 
  getStudentInfo, 
  submitTestResultToSheets 
} from '../../services/googleSheetsService';

export function TestTaking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Parse URL parameters
  const semesterParam = searchParams.get('semester');
  const topicsParam = searchParams.get('topics');
  const countParam = searchParams.get('count');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<Map<number, string>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [initialTimeRemaining, setInitialTimeRemaining] = useState<number | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [existingSession, setExistingSession] = useState<TestSession | null>(null);
  const [testConfig, setTestConfig] = useState<{
    semester: Semester;
    topics: Topic[];
    questionCount: number;
  } | null>(null);
  
  const startTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>('');
  const currentTimeRemainingRef = useRef<number>(0);

  // Initialize on mount - check for existing session or URL params
  useEffect(() => {
    const activeSession = loadActiveTestSession();
    
    // If we have URL params, check if they match existing session
    if (semesterParam && topicsParam && countParam) {
      const semester = parseInt(semesterParam) as Semester;
      const topics = topicsParam.split(',').filter(Boolean) as Topic[];
      const questionCount = parseInt(countParam);

      if (activeSession) {
        // Check if session matches URL params
        const sessionMatches = 
          activeSession.semester === semester &&
          activeSession.topics.length === topics.length &&
          activeSession.topics.every(topic => topics.includes(topic)) &&
          activeSession.questionCount === questionCount;

        if (sessionMatches) {
          setExistingSession(activeSession);
          setShowResumeDialog(true);
          setTestConfig({ semester, topics, questionCount });
          return;
        } else {
          // Different params, clear old session
          clearActiveTestSession();
        }
      }
      
      // No matching session, start new test
      startNewTestWithConfig(semester, topics, questionCount);
    } else if (activeSession) {
      // No URL params but have session - show resume dialog
      setExistingSession(activeSession);
      setShowResumeDialog(true);
      setTestConfig({
        semester: activeSession.semester,
        topics: activeSession.topics,
        questionCount: activeSession.questionCount,
      });
    } else {
      // No params and no session - redirect to setup
      navigate('/test');
    }
  }, []); // Only run once on mount

  const startNewTestWithConfig = useCallback((semester: Semester, topics: Topic[], questionCount: number) => {
    if (topics.length === 0) {
      navigate('/test');
      return;
    }

    // Get questions from all selected topics
    const allQuestions: Question[] = [];
    for (const topic of topics) {
      const topicQuestions = getRandomQuestions({
        count: Math.ceil(questionCount / topics.length) + 5,
        semester,
        topic,
      });
      allQuestions.push(...topicQuestions);
    }

    // Shuffle and take the required count
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, questionCount);
    
    const sessionId = `test-session-${Date.now()}`;
    const totalTime = questionCount * 60;
    
    setQuestions(selectedQuestions);
    setCurrentIndex(0);
    setAllAnswers(new Map());
    setInitialTimeRemaining(totalTime);
    currentTimeRemainingRef.current = totalTime;
    startTimeRef.current = Date.now();
    sessionIdRef.current = sessionId;
    setTestConfig({ semester, topics, questionCount });
    setIsLoaded(true);

    // Save new session
    const newSession: TestSession = {
      id: sessionId,
      semester,
      topics,
      questionCount,
      questions: selectedQuestions.map(q => q.id),
      currentIndex: 0,
      answers: new Map(),
      startTime: Date.now(),
      timeRemaining: totalTime,
      isActive: true,
      createdAt: new Date(),
    };
    
    saveActiveTestSession(newSession);
  }, [navigate]);

  const resumeExistingTest = useCallback(() => {
    if (!existingSession) return;

    // Load questions from session
    const loadedQuestions = existingSession.questions
      .map(id => getQuestionById(id))
      .filter((q): q is Question => q !== undefined);
    
    if (loadedQuestions.length !== existingSession.questionCount) {
      // Some questions couldn't be loaded, start new test
      clearActiveTestSession();
      setShowResumeDialog(false);
      setExistingSession(null);
      if (testConfig) {
        startNewTestWithConfig(testConfig.semester, testConfig.topics, testConfig.questionCount);
      } else {
        navigate('/test');
      }
      return;
    }

    // Restore session state
    setQuestions(loadedQuestions);
    setCurrentIndex(existingSession.currentIndex);
    setAllAnswers(new Map(existingSession.answers));
    setInitialTimeRemaining(existingSession.timeRemaining);
    currentTimeRemainingRef.current = existingSession.timeRemaining;
    startTimeRef.current = existingSession.startTime;
    sessionIdRef.current = existingSession.id;
    setTestConfig({
      semester: existingSession.semester,
      topics: existingSession.topics,
      questionCount: existingSession.questionCount,
    });
    setIsLoaded(true);
    setShowResumeDialog(false);
    setExistingSession(null);
  }, [existingSession, testConfig, startNewTestWithConfig, navigate]);

  const startNewTest = useCallback(() => {
    clearActiveTestSession();
    setShowResumeDialog(false);
    setExistingSession(null);
    
    if (testConfig) {
      startNewTestWithConfig(testConfig.semester, testConfig.topics, testConfig.questionCount);
    } else {
      navigate('/test');
    }
  }, [testConfig, startNewTestWithConfig, navigate]);

  // Save session when state changes
  const saveCurrentSession = useCallback(() => {
    if (!isLoaded || !sessionIdRef.current || !testConfig || questions.length === 0) return;
    
    const session: TestSession = {
      id: sessionIdRef.current,
      semester: testConfig.semester,
      topics: testConfig.topics,
      questionCount: testConfig.questionCount,
      questions: questions.map(q => q.id),
      currentIndex,
      answers: allAnswers,
      startTime: startTimeRef.current,
      timeRemaining: currentTimeRemainingRef.current,
      isActive: true,
      createdAt: new Date(),
    };
    
    saveActiveTestSession(session);
  }, [isLoaded, testConfig, questions, currentIndex, allAnswers]);

  // Auto-save when answers or currentIndex change
  useEffect(() => {
    saveCurrentSession();
  }, [currentIndex, allAnswers, saveCurrentSession]);

  // Prevent accidental page leave during test
  useEffect(() => {
    if (!isLoaded || isComplete) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Save before leaving
      saveCurrentSession();
      e.preventDefault();
      e.returnValue = 'Bài kiểm tra sẽ được lưu tự động.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLoaded, isComplete, saveCurrentSession]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = allAnswers.get(currentIndex) || '';

  const setCurrentAnswer = (answer: string) => {
    setAllAnswers(prev => {
      const newMap = new Map(prev);
      newMap.set(currentIndex, answer);
      return newMap;
    });
  };

  const completeTest = useCallback(async () => {
    if (!testConfig) return;
    
    const totalTimeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    const answerRecords: AnswerRecord[] = questions.map((question, index) => {
      const studentAnswer = allAnswers.get(index) || '';
      const isCorrect = studentAnswer ? checkAnswer(question, studentAnswer) : false;
      return {
        questionId: question.id,
        studentAnswer,
        isCorrect,
        timeSpent: Math.floor(totalTimeSpent / questions.length),
      };
    });

    const correctCount = answerRecords.filter((a) => a.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 10 * 10) / 10;

    const result: TestResult = {
      id: `test-${Date.now()}`,
      date: new Date(),
      semester: testConfig.semester,
      topics: testConfig.topics,
      score,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      timeSpent: totalTimeSpent,
      answers: answerRecords,
    };

    // Lưu vào localStorage
    saveTestResult(result);
    
    // Gửi lên Google Sheets (nếu có cấu hình)
    const studentInfo = getStudentInfo();
    if (studentInfo) {
      submitTestResultToSheets(result, studentInfo).catch(err => {
        console.warn('Failed to submit to Google Sheets:', err);
      });
    }
    
    setTestResult(result);
    setIsComplete(true);
    clearActiveTestSession();
  }, [questions, allAnswers, testConfig]);

  const handleTimeUp = useCallback(() => {
    completeTest();
  }, [completeTest]);

  const handleTimerUpdate = useCallback((remaining: number) => {
    currentTimeRemainingRef.current = remaining;
    // Save session with updated time every 10 seconds
    if (remaining % 10 === 0) {
      saveCurrentSession();
    }
  }, [saveCurrentSession]);

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  }, [questions.length]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  const handleSubmitTest = () => {
    const unansweredCount = questions.length - allAnswers.size;
    if (unansweredCount > 0) {
      setShowConfirmSubmit(true);
    } else {
      completeTest();
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700',
    };
    const labels = {
      easy: 'Dễ',
      medium: 'Trung bình',
      hard: 'Khó',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[difficulty as keyof typeof styles]}`}>
        {labels[difficulty as keyof typeof labels]}
      </span>
    );
  };

  const getQuestionStatus = (index: number): 'answered' | 'current' | 'unanswered' => {
    if (index === currentIndex) return 'current';
    if (allAnswers.has(index) && allAnswers.get(index)) return 'answered';
    return 'unanswered';
  };

  // Resume dialog
  if (showResumeDialog && existingSession) {
    const progress = Math.round((existingSession.answers.size / existingSession.questionCount) * 100);
    const timeRemainingMins = Math.floor(existingSession.timeRemaining / 60);
    const timeRemainingSecs = existingSession.timeRemaining % 60;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="max-w-md mx-4">
          <CardContent>
            <div className="text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Tiếp tục bài kiểm tra?</h3>
              <p className="text-gray-600 mb-4">
                Bạn có một bài kiểm tra đang làm dở. Bạn có muốn tiếp tục không?
              </p>
              
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-left">
                <div className="flex justify-between mb-1">
                  <span>Tiến độ:</span>
                  <span className="font-medium">{progress}% ({existingSession.answers.size}/{existingSession.questionCount} câu)</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Câu đang làm:</span>
                  <span className="font-medium">Câu {existingSession.currentIndex + 1}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian còn lại:</span>
                  <span className="font-medium text-orange-600">
                    {timeRemainingMins} phút {timeRemainingSecs} giây
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button onClick={resumeExistingTest} className="w-full">
                  ✅ Tiếp tục bài cũ
                </Button>
                <Button variant="outline" onClick={startNewTest} className="w-full">
                  🆕 Bắt đầu bài mới
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                Nếu bắt đầu bài mới, bài cũ sẽ bị xóa
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (!isLoaded || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📝</div>
        <p className="text-gray-600">Đang tải bài kiểm tra...</p>
      </div>
    );
  }

  // Test complete - redirect to results
  if (isComplete && testResult) {
    navigate(`/test/results?id=${testResult.id}`, { state: { testResult, questions } });
    return null;
  }

  // Confirm submit modal
  if (showConfirmSubmit) {
    const unansweredCount = questions.length - allAnswers.size;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="max-w-md mx-4">
          <CardContent>
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Xác nhận nộp bài</h3>
              <p className="text-gray-600 mb-4">
                Bạn còn <span className="font-bold text-red-600">{unansweredCount}</span> câu chưa trả lời.
                Bạn có chắc muốn nộp bài?
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => setShowConfirmSubmit(false)}>
                  Quay lại làm tiếp
                </Button>
                <Button onClick={completeTest}>
                  Nộp bài
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <span className="font-bold text-gray-800">Kiểm tra</span>
          <span className="text-gray-500">• Học kỳ {testConfig?.semester}</span>
          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
            💾 Tự động lưu
          </span>
        </div>
        {initialTimeRemaining !== null && (
          <Timer
            duration={testConfig?.questionCount ? testConfig.questionCount * 60 : 900}
            initialTimeRemaining={initialTimeRemaining}
            onTimeUp={handleTimeUp}
            onUpdate={handleTimerUpdate}
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Câu {currentIndex + 1}/{questions.length}</span>
          <span>{allAnswers.size} đã trả lời</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${(allAnswers.size / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question navigation grid */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {questions.map((_, index) => {
            const status = getQuestionStatus(index);
            return (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`
                  w-9 h-9 rounded-lg font-medium text-sm transition-all
                  ${status === 'current' 
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300' 
                    : status === 'answered'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500"></span> Đã trả lời
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-500"></span> Đang làm
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-200"></span> Chưa làm
          </span>
        </div>
      </Card>

      {/* Question Card */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              {currentIndex + 1}
            </span>
            {getDifficultyBadge(currentQuestion.difficulty)}
          </div>

          {/* Question content */}
          <div className="text-lg text-gray-800 mb-6 whitespace-pre-wrap">
            {currentQuestion.content}
          </div>

          {/* Answer options */}
          {currentQuestion.options && (
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`
                    w-full text-left p-4 rounded-lg border-2 transition-all
                    ${currentAnswer === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setCurrentAnswer(option)}
                >
                  <span className="font-medium text-blue-600 mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Text input for non-multiple choice */}
          {!currentQuestion.options && (
            <div className="mb-6">
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Nhập đáp án của bạn..."
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              ← Câu trước
            </Button>
            
            <span className="text-sm text-gray-500">
              {currentIndex < questions.length - 1
                ? `Còn ${questions.length - currentIndex - 1} câu`
                : 'Câu cuối cùng'}
            </span>

            {currentIndex < questions.length - 1 ? (
              <Button onClick={goToNext}>
                Câu sau →
              </Button>
            ) : (
              <Button onClick={handleSubmitTest}>
                Nộp bài ✓
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit button - always visible */}
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={handleSubmitTest}
          className="px-8"
        >
          📤 Nộp bài kiểm tra
        </Button>
      </div>
    </div>
  );
}
