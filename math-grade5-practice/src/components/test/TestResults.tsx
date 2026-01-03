import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, Button } from '../common';
import type { Question } from '../../types';
import type { TestResult } from '../../types/progress';
import { getQuestionById } from '../../services/questionService';
import {
  calculateGrade,
  getTopicDisplayName,
  getTestRecommendations,
  type TopicRecommendation,
} from '../../services/scoringService';
import { getTestHistory } from '../../services/storageService';

export function TestResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [recommendations, setRecommendations] = useState<TopicRecommendation[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const generateRecommendations = useCallback((result: TestResult, qs: Question[]) => {
    const questionLookup = new Map<string, Question>();
    qs.forEach((q) => questionLookup.set(q.id, q));
    const recs = getTestRecommendations(result, questionLookup);
    setRecommendations(recs);
  }, []);

  useEffect(() => {
    // Try to get result from navigation state first
    const stateResult = location.state?.testResult as TestResult | undefined;
    const stateQuestions = location.state?.questions as Question[] | undefined;

    // Use a microtask to avoid the setState-in-effect warning
    queueMicrotask(() => {
      if (stateResult && stateQuestions) {
        setTestResult(stateResult);
        setQuestions(stateQuestions);
        generateRecommendations(stateResult, stateQuestions);
      } else {
        // Fall back to loading from storage by ID
        const testId = searchParams.get('id');
        if (testId) {
          const history = getTestHistory();
          const result = history.find((r) => r.id === testId);
          if (result) {
            setTestResult(result);
            // Load questions from IDs
            const loadedQuestions = result.answers
              .map((a) => getQuestionById(a.questionId))
              .filter((q): q is Question => q !== undefined);
            setQuestions(loadedQuestions);
            generateRecommendations(result, loadedQuestions);
          }
        }
      }
    });
  }, [location.state, searchParams, generateRecommendations]);

  if (!testResult) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-gray-600">Không tìm thấy kết quả kiểm tra</p>
        <Button className="mt-4" onClick={() => navigate('/test')}>
          Quay lại
        </Button>
      </div>
    );
  }

  const grade = calculateGrade(testResult.score);
  const percentage = Math.round((testResult.correctAnswers / testResult.totalQuestions) * 100);
  const needsReview = testResult.score < 5;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  const formatDateTime = (date: Date): string => {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6.5) return 'text-blue-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 8) return 'bg-green-50 border-green-200';
    if (score >= 6.5) return 'bg-blue-50 border-blue-200';
    if (score >= 5) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-4">
          {testResult.score >= 8 ? '🎉' : testResult.score >= 5 ? '👍' : '💪'}
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Kết quả kiểm tra</h1>
        <p className="text-gray-600">Học kỳ {testResult.semester}</p>
      </div>

      {/* Score Card */}
      <Card className={`border-2 ${getScoreBgColor(testResult.score)}`}>
        <CardContent>
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(testResult.score)} mb-2`}>
              {testResult.score}
            </div>
            <div className="text-2xl text-gray-600 mb-4">/ 10 điểm</div>
            <div className={`inline-block px-4 py-2 rounded-full font-medium ${
              testResult.score >= 8 ? 'bg-green-100 text-green-700' :
              testResult.score >= 6.5 ? 'bg-blue-100 text-blue-700' :
              testResult.score >= 5 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {grade}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">{testResult.totalQuestions}</div>
          <div className="text-sm text-gray-600">Tổng câu hỏi</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">{testResult.correctAnswers}</div>
          <div className="text-sm text-gray-600">Trả lời đúng</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {testResult.totalQuestions - testResult.correctAnswers}
          </div>
          <div className="text-sm text-gray-600">Trả lời sai</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">{percentage}%</div>
          <div className="text-sm text-gray-600">Độ chính xác</div>
        </Card>
      </div>

      {/* Time spent */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl">⏱️</div>
            <div>
              <div className="font-bold text-gray-800">Thời gian làm bài</div>
              <div className="text-gray-600">{formatTime(testResult.timeSpent)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission time */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl">📅</div>
            <div>
              <div className="font-bold text-gray-800">Thời gian nộp bài</div>
              <div className="text-gray-600">{formatDateTime(testResult.date)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics covered */}
      <Card>
        <CardContent>
          <h3 className="font-bold text-gray-800 mb-3">📚 Chủ đề đã kiểm tra</h3>
          <div className="flex flex-wrap gap-2">
            {testResult.topics.map((topic) => (
              <span
                key={topic}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {getTopicDisplayName(topic)}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations (if score < 5) */}
      {needsReview && recommendations.length > 0 && (
        <Card className="bg-orange-50 border border-orange-200">
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">📖</div>
              <div>
                <h3 className="font-bold text-orange-800">Đề xuất ôn tập</h3>
                <p className="text-orange-700 text-sm">
                  Điểm dưới 5, bạn nên ôn lại các chủ đề sau:
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.topic}
                  className={`p-3 rounded-lg border ${
                    rec.priority === 'high'
                      ? 'bg-red-50 border-red-200'
                      : rec.priority === 'medium'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">
                      {getTopicDisplayName(rec.topic)}
                    </span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : rec.priority === 'medium'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {rec.priority === 'high' ? 'Ưu tiên cao' : rec.priority === 'medium' ? 'Ưu tiên' : 'Nên ôn'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                </div>
              ))}
            </div>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => navigate('/practice')}
            >
              Đi đến luyện tập →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Toggle detailed answers */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '🔼 Ẩn chi tiết' : '🔽 Xem chi tiết đáp án'}
        </Button>
      </div>

      {/* Detailed Answers */}
      {showDetails && (
        <Card>
          <CardContent>
            <h3 className="font-bold text-gray-800 mb-4">📝 Chi tiết đáp án</h3>
            <div className="space-y-4">
              {testResult.answers.map((answer, index) => {
                const question = questions.find((q) => q.id === answer.questionId);
                if (!question) return null;

                return (
                  <div
                    key={answer.questionId}
                    className={`p-4 rounded-lg border ${
                      answer.isCorrect
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm ${
                          answer.isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        {answer.isCorrect ? '✓' : '✗'}
                      </span>
                      <span className="font-medium text-gray-800">Câu {index + 1}</span>
                    </div>
                    
                    <p className="text-gray-700 mb-2 whitespace-pre-wrap">
                      {question.content}
                    </p>
                    
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Đáp án của bạn:</strong>{' '}
                        <span className={answer.isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {answer.studentAnswer}
                        </span>
                      </p>
                      {!answer.isCorrect && (
                        <p>
                          <strong>Đáp án đúng:</strong>{' '}
                          <span className="text-green-600">{question.correctAnswer}</span>
                        </p>
                      )}
                      <p className="text-gray-600 mt-2">
                        <strong>Giải thích:</strong> {question.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => navigate('/')}>
          ← Trang chủ
        </Button>
        <Button variant="outline" onClick={() => navigate('/test')}>
          Kiểm tra lại
        </Button>
        {needsReview && (
          <Button onClick={() => navigate('/practice')}>
            Đi luyện tập →
          </Button>
        )}
      </div>
    </div>
  );
}
