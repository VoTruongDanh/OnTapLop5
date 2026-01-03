import { useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, Button } from '../common';
import type { Question, Semester } from '../../types';
import type { PracticeSession } from '../../types/progress';
import { getQuestionsByMode } from '../../services/questionService';
import { generateAnswerFeedback, type AnswerFeedback } from '../../services/scoringService';
import { savePracticeSession } from '../../services/storageService';

const QUESTIONS_PER_SESSION = 10;

export function TuDuyMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const semester = (parseInt(searchParams.get('semester') || '1') as Semester) || 1;

  // Load questions on mount - only once using initializer function
  const [questions] = useState<Question[]>(() => {
    const allQuestions = getQuestionsByMode('tu-duy', semester);
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, QUESTIONS_PER_SESSION);
  });
  
  const startTimeRef = useRef<number>(Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [sessionResults, setSessionResults] = useState<AnswerFeedback[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = useCallback(() => {
    if (!currentQuestion || !selectedAnswer) return;

    const answerFeedback = generateAnswerFeedback(currentQuestion, selectedAnswer);
    setFeedback(answerFeedback);
    setSessionResults((prev) => [...prev, answerFeedback]);
  }, [currentQuestion, selectedAnswer]);

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowHints(false);
      setCurrentHintIndex(0);
      setFeedback(null);
    } else {
      // Session complete
      setIsComplete(true);
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const correctCount = sessionResults.filter((r) => r.isCorrect).length + (feedback?.isCorrect ? 1 : 0);

      const session: PracticeSession = {
        id: `practice-${Date.now()}`,
        date: new Date(),
        mode: 'tu-duy',
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
        <div className="text-4xl mb-4">🧠</div>
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
            <p className="text-gray-600 mb-6">Bạn đã hoàn thành phần luyện tập Tư duy</p>

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

        {/* Review answers */}
        <Card>
          <CardContent>
            <h3 className="font-bold text-gray-800 mb-4">📝 Xem lại đáp án</h3>
            <div className="space-y-4">
              {sessionResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {result.isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="font-medium">Câu {index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Đáp án của bạn:</strong> {result.studentAnswer}
                  </p>
                  {!result.isCorrect && (
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Đáp án đúng:</strong> {result.correctAnswer}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <strong>Giải thích:</strong> {result.explanation}
                  </p>
                </div>
              ))}
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
          <span className="text-2xl">🧠</span>
          <span className="font-bold text-gray-800">Tư duy</span>
          <span className="text-gray-500">• Học kỳ {semester}</span>
        </div>
        <div className="text-sm text-gray-600">
          Câu {currentIndex + 1}/{questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              {currentIndex + 1}
            </span>
            {getDifficultyBadge(currentQuestion.difficulty)}
          </div>

          {/* Question content */}
          <div className="text-lg text-gray-800 mb-6 whitespace-pre-wrap">
            {currentQuestion.content}
          </div>

          {/* Answer options */}
          {!feedback && currentQuestion.options && (
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`
                    w-full text-left p-4 rounded-lg border-2 transition-all
                    ${selectedAnswer === option
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setSelectedAnswer(option)}
                >
                  <span className="font-medium text-purple-600 mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div
              className={`p-4 rounded-lg mb-6 ${
                feedback.isCorrect
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xl ${feedback.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {feedback.isCorrect ? '✓ Chính xác!' : '✗ Chưa đúng'}
                </span>
              </div>
              {!feedback.isCorrect && (
                <p className="text-gray-700 mb-2">
                  <strong>Đáp án đúng:</strong> {feedback.correctAnswer}
                </p>
              )}
              <p className="text-gray-700">
                <strong>Giải thích:</strong> {feedback.explanation}
              </p>
            </div>
          )}

          {/* Hints */}
          {showHints && currentQuestion.hints && currentQuestion.hints.length > 0 && !feedback && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-600">💡</span>
                <span className="font-medium text-yellow-700">Gợi ý:</span>
              </div>
              {currentQuestion.hints.slice(0, currentHintIndex + 1).map((hint, index) => (
                <p key={index} className="text-yellow-800 ml-6">
                  {index + 1}. {hint}
                </p>
              ))}
              {currentHintIndex < currentQuestion.hints.length - 1 && (
                <button
                  className="mt-2 text-sm text-yellow-600 hover:text-yellow-700 underline"
                  onClick={handleNextHint}
                >
                  Xem thêm gợi ý ({currentHintIndex + 1}/{currentQuestion.hints.length})
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {!feedback ? (
              <>
                <Button
                  onClick={handleAnswer}
                  disabled={!selectedAnswer}
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
                {currentIndex < questions.length - 1 ? 'Câu tiếp theo →' : 'Xem kết quả →'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
