import { useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, Button } from '../common';
import type { Question, Semester } from '../../types';
import type { PracticeSession } from '../../types/progress';
import { getQuestionsByMode } from '../../services/questionService';
import { generateAnswerFeedback, type AnswerFeedback } from '../../services/scoringService';
import { savePracticeSession } from '../../services/storageService';

const QUESTIONS_PER_SESSION = 5; // Fewer questions since word problems take longer

export function ToanGiaiMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const semester = (parseInt(searchParams.get('semester') || '1') as Semester) || 1;

  // Load questions on mount - only once using initializer function
  const [questions] = useState<Question[]>(() => {
    const allQuestions = getQuestionsByMode('toan-giai', semester);
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, QUESTIONS_PER_SESSION);
  });
  
  const startTimeRef = useRef<number>(Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputAnswer, setInputAnswer] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [sessionResults, setSessionResults] = useState<AnswerFeedback[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = useCallback(() => {
    if (!currentQuestion || !inputAnswer.trim()) return;

    const answerFeedback = generateAnswerFeedback(currentQuestion, inputAnswer.trim());
    setFeedback(answerFeedback);
    setSessionResults((prev) => [...prev, answerFeedback]);
  }, [currentQuestion, inputAnswer]);

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setInputAnswer('');
      setShowHints(false);
      setCurrentHintIndex(0);
      setFeedback(null);
    } else {
      setIsComplete(true);
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const correctCount = sessionResults.filter((r) => r.isCorrect).length + (feedback?.isCorrect ? 1 : 0);

      const session: PracticeSession = {
        id: `practice-${Date.now()}`,
        date: new Date(),
        mode: 'toan-giai',
        questionsAttempted: questions.length,
        correctAnswers: correctCount,
        timeSpent,
      };
      savePracticeSession(session);
    }
  }, [currentIndex, questions.length, sessionResults, feedback]);

  const handleShowHint = () => {
    setShowHints(true);
  };

  const handleNextHint = () => {
    if (currentQuestion?.hints && currentHintIndex < currentQuestion.hints.length - 1) {
      setCurrentHintIndex((prev) => prev + 1);
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

  // Loading state
  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📖</div>
        <p className="text-gray-600">Đang tải câu hỏi...</p>
      </div>
    );
  }

  // Session complete
  if (isComplete) {
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const score = Math.round((correctCount / questions.length) * 10 * 10) / 10;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center">
          <CardContent>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Hoàn thành!</h2>
            <p className="text-gray-600 mb-6">Bạn đã hoàn thành phần luyện tập Toán giải</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                <div className="text-sm text-gray-600">Tổng câu hỏi</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <div className="text-sm text-gray-600">Trả lời đúng</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{score}</div>
                <div className="text-sm text-gray-600">Điểm số</div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/practice')}>
                ← Quay lại
              </Button>
              <Button onClick={() => window.location.reload()}>
                Luyện tập lại
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Review answers with detailed explanations */}
        <Card>
          <CardContent>
            <h3 className="font-bold text-gray-800 mb-4">📝 Xem lại bài giải</h3>
            <div className="space-y-6">
              {sessionResults.map((result, index) => {
                const question = questions[index];
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.isCorrect
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {result.isCorrect ? '✓' : '✗'}
                      </span>
                      <span className="font-medium">Bài {index + 1}</span>
                    </div>
                    
                    <div className="bg-white rounded p-3 mb-3">
                      <p className="text-gray-800 whitespace-pre-wrap">{question.content}</p>
                    </div>

                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Đáp án của bạn:</strong> {result.studentAnswer}
                    </p>
                    {!result.isCorrect && (
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Đáp án đúng:</strong> {result.correctAnswer}
                      </p>
                    )}
                    
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">📚 Lời giải chi tiết:</p>
                      <p className="text-sm text-blue-700 whitespace-pre-wrap">{result.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/practice')}>
          ← Quay lại
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📖</span>
          <span className="font-bold text-gray-800">Toán giải</span>
          <span className="text-gray-500">• Học kỳ {semester}</span>
        </div>
        <div className="text-sm text-gray-600">
          Bài {currentIndex + 1}/{questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              {currentIndex + 1}
            </span>
            {getDifficultyBadge(currentQuestion.difficulty)}
          </div>

          {/* Question content - word problem */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-lg text-gray-800 whitespace-pre-wrap leading-relaxed">
              {currentQuestion.content}
            </p>
          </div>

          {/* Step-by-step hints */}
          {showHints && currentQuestion.hints && currentQuestion.hints.length > 0 && !feedback && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-600">💡</span>
                <span className="font-medium text-yellow-700">Gợi ý từng bước:</span>
              </div>
              <div className="space-y-2">
                {currentQuestion.hints.slice(0, currentHintIndex + 1).map((hint, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="bg-yellow-200 text-yellow-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-yellow-800">{hint}</p>
                  </div>
                ))}
              </div>
              {currentHintIndex < currentQuestion.hints.length - 1 && (
                <button
                  className="mt-3 text-sm text-yellow-600 hover:text-yellow-700 underline flex items-center gap-1"
                  onClick={handleNextHint}
                >
                  <span>Xem bước tiếp theo</span>
                  <span>({currentHintIndex + 1}/{currentQuestion.hints.length})</span>
                </button>
              )}
            </div>
          )}

          {/* Answer input */}
          {!feedback && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập đáp án của bạn:
              </label>
              <input
                type="text"
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                placeholder="Ví dụ: 125 hoặc 125 km..."
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAnswer()}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nhập số hoặc kết quả cuối cùng (có thể kèm đơn vị)
              </p>
            </div>
          )}

          {/* Feedback with detailed solution */}
          {feedback && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                feedback.isCorrect
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xl ${feedback.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {feedback.isCorrect ? '✓ Chính xác!' : '✗ Chưa đúng'}
                </span>
              </div>
              
              <p className="text-gray-700 mb-2">
                <strong>Đáp án của bạn:</strong> {feedback.studentAnswer}
              </p>
              
              {!feedback.isCorrect && (
                <p className="text-gray-700 mb-3">
                  <strong>Đáp án đúng:</strong> {feedback.correctAnswer}
                </p>
              )}
              
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800 mb-2">📚 Lời giải chi tiết:</p>
                <p className="text-blue-700 whitespace-pre-wrap">{feedback.explanation}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {!feedback ? (
              <>
                <Button
                  onClick={handleAnswer}
                  disabled={!inputAnswer.trim()}
                >
                  Trả lời
                </Button>
                {currentQuestion.hints && currentQuestion.hints.length > 0 && !showHints && (
                  <Button variant="outline" onClick={handleShowHint}>
                    💡 Xem gợi ý
                  </Button>
                )}
              </>
            ) : (
              <Button onClick={handleNextQuestion}>
                {currentIndex < questions.length - 1 ? 'Bài tiếp theo →' : 'Xem kết quả →'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips card */}
      <Card className="bg-green-50 border border-green-200">
        <CardContent>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="font-medium text-green-800 mb-1">Mẹo giải toán có lời văn:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Đọc kỹ đề bài, xác định dữ kiện và yêu cầu</li>
                <li>• Tóm tắt bài toán bằng sơ đồ hoặc ghi chú</li>
                <li>• Lập phép tính và giải từng bước</li>
                <li>• Kiểm tra lại kết quả và đơn vị</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
