import { useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, Button, Timer } from '../common';
import type { Question, Semester } from '../../types';
import type { PracticeSession } from '../../types/progress';
import { getQuestionsByMode } from '../../services/questionService';
import { generateAnswerFeedback, type AnswerFeedback } from '../../services/scoringService';
import { savePracticeSession } from '../../services/storageService';

const QUESTIONS_PER_SESSION = 20;
const DEFAULT_TIME_LIMIT = 300; // 5 minutes in seconds

interface TimeSetting {
  label: string;
  seconds: number;
}

const timeSettings: TimeSetting[] = [
  { label: '2 phút', seconds: 120 },
  { label: '3 phút', seconds: 180 },
  { label: '5 phút', seconds: 300 },
  { label: '10 phút', seconds: 600 },
];

type GameState = 'setup' | 'playing' | 'complete';

export function TinhNhanhMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const semester = (parseInt(searchParams.get('semester') || '1') as Semester) || 1;

  const [gameState, setGameState] = useState<GameState>('setup');
  const [timeLimit, setTimeLimit] = useState(DEFAULT_TIME_LIMIT);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputAnswer, setInputAnswer] = useState('');
  const [sessionResults, setSessionResults] = useState<AnswerFeedback[]>([]);
  const startTimeRef = useRef<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [completedTimeSpent, setCompletedTimeSpent] = useState(0);

  // Load questions when game starts
  const loadQuestions = useCallback(() => {
    const allQuestions = getQuestionsByMode('tinh-nhanh', semester);
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, QUESTIONS_PER_SESSION));
    startTimeRef.current = Date.now();
  }, [semester]);

  const currentQuestion = questions[currentIndex];

  const finishSession = useCallback(() => {
    setGameState('complete');
    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setCompletedTimeSpent(timeSpent);
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;

    const session: PracticeSession = {
      id: `practice-${Date.now()}`,
      date: new Date(),
      mode: 'tinh-nhanh',
      questionsAttempted: sessionResults.length,
      correctAnswers: correctCount,
      timeSpent,
    };
    savePracticeSession(session);
  }, [sessionResults]);

  const handleTimeUp = useCallback(() => {
    finishSession();
  }, [finishSession]);

  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion || !inputAnswer.trim()) return;

    const answerFeedback = generateAnswerFeedback(currentQuestion, inputAnswer.trim());
    setSessionResults((prev) => [...prev, answerFeedback]);

    // Move to next question or finish
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setInputAnswer('');
    } else {
      finishSession();
    }
  }, [currentQuestion, inputAnswer, currentIndex, questions.length, finishSession]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitAnswer();
    }
  };

  const handleStartGame = () => {
    loadQuestions();
    setGameState('playing');
  };

  const handleSkipQuestion = () => {
    if (currentIndex < questions.length - 1) {
      // Record as incorrect when skipped
      if (currentQuestion) {
        const answerFeedback = generateAnswerFeedback(currentQuestion, '');
        setSessionResults((prev) => [...prev, answerFeedback]);
      }
      setCurrentIndex((prev) => prev + 1);
      setInputAnswer('');
    } else {
      finishSession();
    }
  };

  // Setup screen
  if (gameState === 'setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigate('/practice')}>
            ← Quay lại
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-gray-800">Tính nhanh</span>
            <span className="text-gray-500">• Học kỳ {semester}</span>
          </div>
          <div></div>
        </div>

        <Card className="text-center">
          <CardContent>
            <div className="text-6xl mb-4">⚡</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tính nhanh</h2>
            <p className="text-gray-600 mb-6">
              Trả lời càng nhiều câu hỏi càng tốt trong thời gian giới hạn!
            </p>

            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">Chọn thời gian:</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {timeSettings.map((setting) => (
                  <button
                    key={setting.seconds}
                    onClick={() => setTimeLimit(setting.seconds)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      timeLimit === setting.seconds
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {setting.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-medium text-yellow-800 mb-2">📋 Hướng dẫn:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Nhập đáp án và nhấn Enter hoặc nút "Trả lời"</li>
                <li>• Trả lời nhanh và chính xác để đạt điểm cao</li>
                <li>• Có thể bỏ qua câu hỏi nếu không biết</li>
                <li>• Kết quả sẽ hiển thị khi hết giờ hoặc hoàn thành</li>
              </ul>
            </div>

            <Button size="lg" onClick={handleStartGame}>
              🚀 Bắt đầu!
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Complete screen
  if (gameState === 'complete') {
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const totalAttempted = sessionResults.length;
    const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;
    const avgTimePerQuestion = totalAttempted > 0 ? Math.round(completedTimeSpent / totalAttempted) : 0;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center">
          <CardContent>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Hoàn thành!</h2>
            <p className="text-gray-600 mb-6">Kết quả luyện tập Tính nhanh của bạn</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{totalAttempted}</div>
                <div className="text-sm text-gray-600">Câu đã làm</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <div className="text-sm text-gray-600">Trả lời đúng</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{accuracy}%</div>
                <div className="text-sm text-gray-600">Độ chính xác</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{avgTimePerQuestion}s</div>
                <div className="text-sm text-gray-600">TB/câu</div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/practice')}>
                ← Quay lại
              </Button>
              <Button onClick={() => window.location.reload()}>
                Chơi lại
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Review answers */}
        <Card>
          <CardContent>
            <h3 className="font-bold text-gray-800 mb-4">📝 Xem lại đáp án</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessionResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {result.isCorrect ? '✓' : '✗'}
                      </span>
                      <span className="font-medium">Câu {index + 1}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {result.studentAnswer || '(bỏ qua)'} → {result.correctAnswer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Playing screen
  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚡</div>
        <p className="text-gray-600">Đang tải câu hỏi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsPaused(true);
            if (confirm('Bạn có chắc muốn thoát? Tiến độ sẽ không được lưu.')) {
              navigate('/practice');
            } else {
              setIsPaused(false);
            }
          }}
        >
          ← Thoát
        </Button>
        <Timer
          duration={timeLimit}
          onTimeUp={handleTimeUp}
          isPaused={isPaused}
          warningThreshold={30}
        />
        <div className="text-sm text-gray-600">
          {currentIndex + 1}/{questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Stats bar */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-green-600">✓</span>
          <span>{sessionResults.filter((r) => r.isCorrect).length} đúng</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-600">✗</span>
          <span>{sessionResults.filter((r) => !r.isCorrect).length} sai</span>
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 py-8">
              {currentQuestion.content}
            </div>

            <div className="max-w-xs mx-auto mb-6">
              <input
                type="text"
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập đáp án..."
                className="w-full text-center text-2xl p-4 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleSkipQuestion}>
                Bỏ qua
              </Button>
              <Button onClick={handleSubmitAnswer} disabled={!inputAnswer.trim()}>
                Trả lời
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
