import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, Button } from '../common';
import type { Question, Semester, Topic, Difficulty } from '../../types';
import type { PracticeSession } from '../../types/progress';
import { getQuestionsByMode, getTopicsForSemester } from '../../services/questionService';
import { generateAnswerFeedback, type AnswerFeedback, getTopicDisplayName } from '../../services/scoringService';
import { savePracticeSession } from '../../services/storageService';

const QUESTIONS_PER_SESSION = 10;

type GameState = 'setup' | 'playing' | 'complete';

const difficultyOptions: { value: Difficulty | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'easy', label: 'Dễ' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'hard', label: 'Khó' },
];

export function ToanCoBanMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const semester = (parseInt(searchParams.get('semester') || '1') as Semester) || 1;

  const [gameState, setGameState] = useState<GameState>('setup');
  const [selectedTopic, setSelectedTopic] = useState<Topic | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [inputAnswer, setInputAnswer] = useState('');
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [sessionResults, setSessionResults] = useState<AnswerFeedback[]>([]);
  const [startTime, setStartTime] = useState(0);

  const topics = getTopicsForSemester(semester);
  const currentQuestion = questions[currentIndex];


  const handleStartPractice = () => {
    let allQuestions = getQuestionsByMode('toan-co-ban', semester);
    
    // Filter by topic
    if (selectedTopic !== 'all') {
      allQuestions = allQuestions.filter(q => q.topic === selectedTopic);
    }
    
    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      allQuestions = allQuestions.filter(q => q.difficulty === selectedDifficulty);
    }
    
    // Shuffle and take questions
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, QUESTIONS_PER_SESSION));
    setStartTime(Date.now());
    setGameState('playing');
  };

  const handleAnswer = useCallback(() => {
    if (!currentQuestion) return;
    
    const answer = currentQuestion.options ? selectedAnswer : inputAnswer.trim();
    if (!answer) return;

    const answerFeedback = generateAnswerFeedback(currentQuestion, answer);
    setFeedback(answerFeedback);
    setSessionResults((prev) => [...prev, answerFeedback]);
  }, [currentQuestion, selectedAnswer, inputAnswer]);

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setInputAnswer('');
      setFeedback(null);
    } else {
      setGameState('complete');
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const correctCount = sessionResults.filter((r) => r.isCorrect).length + (feedback?.isCorrect ? 1 : 0);

      const session: PracticeSession = {
        id: `practice-${Date.now()}`,
        date: new Date(),
        mode: 'toan-co-ban',
        questionsAttempted: questions.length,
        correctAnswers: correctCount,
        timeSpent,
      };
      savePracticeSession(session);
    }
  }, [currentIndex, questions.length, startTime, sessionResults, feedback]);


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

  // Setup screen
  if (gameState === 'setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigate('/practice')}>
            ← Quay lại
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📐</span>
            <span className="font-bold text-gray-800">Toán cơ bản</span>
            <span className="text-gray-500">• Học kỳ {semester}</span>
          </div>
          <div></div>
        </div>

        <Card>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📐</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Toán cơ bản</h2>
              <p className="text-gray-600">Ôn tập kiến thức nền tảng theo chủ đề và độ khó</p>
            </div>

            {/* Topic selection */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">Chọn chủ đề:</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTopic('all')}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    selectedTopic === 'all'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  Tất cả chủ đề
                </button>
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                      selectedTopic === topic
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {getTopicDisplayName(topic)}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty selection */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3">Chọn độ khó:</h3>
              <div className="flex flex-wrap gap-2">
                {difficultyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDifficulty(option.value)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedDifficulty === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Button size="lg" onClick={handleStartPractice}>
                🚀 Bắt đầu luyện tập
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Complete screen
  if (gameState === 'complete') {
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 10 * 10) / 10 : 0;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center">
          <CardContent>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Hoàn thành!</h2>
            <p className="text-gray-600 mb-6">Bạn đã hoàn thành phần luyện tập Toán cơ bản</p>

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
                    <strong>Đáp án của bạn:</strong> {result.studentAnswer || '(không trả lời)'}
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

  // Loading state
  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📐</div>
        <p className="text-gray-600">Đang tải câu hỏi...</p>
      </div>
    );
  }


  // Playing screen
  const hasOptions = currentQuestion?.options && currentQuestion.options.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/practice')}>
          ← Quay lại
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📐</span>
          <span className="font-bold text-gray-800">Toán cơ bản</span>
          <span className="text-gray-500">• Học kỳ {semester}</span>
        </div>
        <div className="text-sm text-gray-600">
          Câu {currentIndex + 1}/{questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                {currentIndex + 1}
              </span>
              <span className="text-sm text-gray-500">
                {getTopicDisplayName(currentQuestion.topic)}
              </span>
            </div>
            {getDifficultyBadge(currentQuestion.difficulty)}
          </div>

          {/* Question content */}
          <div className="text-lg text-gray-800 mb-6 whitespace-pre-wrap">
            {currentQuestion.content}
          </div>

          {/* Answer options or input */}
          {!feedback && (
            <>
              {hasOptions ? (
                <div className="space-y-3 mb-6">
                  {currentQuestion.options!.map((option, index) => (
                    <button
                      key={index}
                      className={`
                        w-full text-left p-4 rounded-lg border-2 transition-all
                        ${selectedAnswer === option
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }
                      `}
                      onClick={() => setSelectedAnswer(option)}
                    >
                      <span className="font-medium text-blue-600 mr-2">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mb-6">
                  <input
                    type="text"
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    placeholder="Nhập đáp án của bạn..."
                    className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleAnswer()}
                  />
                </div>
              )}
            </>
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

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {!feedback ? (
              <Button
                onClick={handleAnswer}
                disabled={hasOptions ? !selectedAnswer : !inputAnswer.trim()}
              >
                Trả lời
              </Button>
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
