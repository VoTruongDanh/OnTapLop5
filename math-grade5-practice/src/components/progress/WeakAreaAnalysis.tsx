import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../common';
import { getTestHistory, getOrCreateProgress } from '../../services/storageService';
import { 
  getTopicDisplayName, 
  calculateScore,
  type TopicPerformance,
} from '../../services/scoringService';
import { getAllQuestions } from '../../services/questionService';
import type { TestResult, StudentProgress } from '../../types/progress';
import type { Topic, Question, QuestionType } from '../../types/question';

// All topics for reference
const ALL_TOPICS: Topic[] = [
  'so-tu-nhien',
  'phan-so',
  'so-thap-phan-1',
  'hinh-hoc-co-ban',
  'so-thap-phan-2',
  'ti-so-phan-tram',
  'hinh-hoc-nang-cao',
  'on-tap-cuoi-nam',
];

// Extended topic performance with more details
interface ExtendedTopicPerformance extends TopicPerformance {
  semester: 1 | 2;
  lastPracticed?: Date;
  trend: 'improving' | 'declining' | 'stable' | 'unknown';
}

// Personalized recommendation with action
interface PersonalizedRecommendation {
  topic: Topic;
  priority: 'high' | 'medium' | 'low';
  score: number;
  message: string;
  actionLabel: string;
  actionLink: string;
  practiceMode: QuestionType;
}

// Get semester for a topic
function getTopicSemester(topic: Topic): 1 | 2 {
  const semester1Topics: Topic[] = ['so-tu-nhien', 'phan-so', 'so-thap-phan-1', 'hinh-hoc-co-ban'];
  return semester1Topics.includes(topic) ? 1 : 2;
}

// Analyze topic performance from test results
function analyzeTopicPerformanceFromResults(
  testHistory: TestResult[],
  questionLookup: Map<string, Question>
): Map<Topic, ExtendedTopicPerformance> {
  const topicStats = new Map<Topic, { 
    correct: number; 
    total: number; 
    dates: Date[];
    recentCorrect: number;
    recentTotal: number;
  }>();

  // Sort tests by date (oldest first)
  const sortedTests = [...testHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get recent tests (last 3)
  const recentTests = sortedTests.slice(-3);
  const recentTestIds = new Set(recentTests.map(t => t.id));

  // Aggregate answers by topic
  for (const result of sortedTests) {
    const isRecent = recentTestIds.has(result.id);
    
    for (const answer of result.answers) {
      const question = questionLookup.get(answer.questionId);
      if (!question) continue;

      const topic = question.topic;
      const current = topicStats.get(topic) || { 
        correct: 0, 
        total: 0, 
        dates: [],
        recentCorrect: 0,
        recentTotal: 0,
      };

      current.total++;
      current.dates.push(new Date(result.date));
      
      if (answer.isCorrect) {
        current.correct++;
      }

      if (isRecent) {
        current.recentTotal++;
        if (answer.isCorrect) {
          current.recentCorrect++;
        }
      }

      topicStats.set(topic, current);
    }
  }

  // Convert to ExtendedTopicPerformance
  const performance = new Map<Topic, ExtendedTopicPerformance>();

  for (const [topic, stats] of topicStats) {
    const averageScore = stats.total > 0 ? calculateScore(stats.correct, stats.total) : 0;
    const recentScore = stats.recentTotal > 0 
      ? calculateScore(stats.recentCorrect, stats.recentTotal) 
      : averageScore;

    // Determine trend
    let trend: 'improving' | 'declining' | 'stable' | 'unknown' = 'unknown';
    if (stats.recentTotal >= 3) {
      const diff = recentScore - averageScore;
      if (diff > 1) trend = 'improving';
      else if (diff < -1) trend = 'declining';
      else trend = 'stable';
    }

    // Get last practiced date
    const lastPracticed = stats.dates.length > 0 
      ? new Date(Math.max(...stats.dates.map(d => d.getTime())))
      : undefined;

    performance.set(topic, {
      topic,
      totalQuestions: stats.total,
      correctAnswers: stats.correct,
      averageScore,
      semester: getTopicSemester(topic),
      lastPracticed,
      trend,
    });
  }

  return performance;
}


// Generate personalized recommendations
function generatePersonalizedRecommendations(
  performance: Map<Topic, ExtendedTopicPerformance>,
  _progress: StudentProgress // eslint-disable-line @typescript-eslint/no-unused-vars
): PersonalizedRecommendation[] {
  const recommendations: PersonalizedRecommendation[] = [];

  // Check all topics
  for (const topic of ALL_TOPICS) {
    const perf = performance.get(topic);
    
    if (!perf) {
      // Topic not practiced yet - suggest starting
      recommendations.push({
        topic,
        priority: 'medium',
        score: 0,
        message: 'Chưa luyện tập chủ đề này. Hãy bắt đầu để nắm vững kiến thức!',
        actionLabel: 'Bắt đầu học',
        actionLink: `/practice/toan-co-ban?topic=${topic}`,
        practiceMode: 'toan-co-ban',
      });
      continue;
    }

    if (perf.averageScore < 3) {
      // Very weak - high priority
      recommendations.push({
        topic,
        priority: 'high',
        score: perf.averageScore,
        message: `Điểm ${perf.averageScore.toFixed(1)}/10 - Cần ôn tập lại từ cơ bản. Hãy làm nhiều bài tập đơn giản trước.`,
        actionLabel: 'Ôn tập cơ bản',
        actionLink: `/practice/toan-co-ban?topic=${topic}&difficulty=easy`,
        practiceMode: 'toan-co-ban',
      });
    } else if (perf.averageScore < 5) {
      // Weak - medium priority
      const modeToUse = perf.trend === 'declining' ? 'toan-co-ban' : 'toan-giai';
      recommendations.push({
        topic,
        priority: 'medium',
        score: perf.averageScore,
        message: `Điểm ${perf.averageScore.toFixed(1)}/10 - Cần luyện tập thêm để đạt mức trung bình.`,
        actionLabel: perf.trend === 'declining' ? 'Ôn lại cơ bản' : 'Luyện tập thêm',
        actionLink: `/practice/${modeToUse}?topic=${topic}`,
        practiceMode: modeToUse,
      });
    } else if (perf.averageScore < 7 && perf.trend === 'declining') {
      // Declining performance - low priority but needs attention
      recommendations.push({
        topic,
        priority: 'low',
        score: perf.averageScore,
        message: `Điểm ${perf.averageScore.toFixed(1)}/10 - Kết quả đang giảm. Hãy ôn tập để duy trì kiến thức.`,
        actionLabel: 'Ôn tập',
        actionLink: `/practice/toan-co-ban?topic=${topic}`,
        practiceMode: 'toan-co-ban',
      });
    }
  }

  // Sort by priority and score
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.score - b.score;
  });

  return recommendations;
}

// Topic Performance Card Component
interface TopicCardProps {
  performance: ExtendedTopicPerformance;
}

function TopicCard({ performance }: TopicCardProps) {
  const { topic, averageScore, totalQuestions, correctAnswers, trend, lastPracticed } = performance;
  
  const scoreColor = averageScore >= 8 ? 'text-green-600' :
                     averageScore >= 5 ? 'text-yellow-600' : 'text-red-600';
  
  const trendIcon = trend === 'improving' ? '📈' :
                    trend === 'declining' ? '📉' :
                    trend === 'stable' ? '➡️' : '';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{getTopicDisplayName(topic)}</h4>
          <p className="text-sm text-gray-500">
            {correctAnswers}/{totalQuestions} câu đúng
            {lastPracticed && (
              <span> • Lần cuối: {new Date(lastPracticed).toLocaleDateString('vi-VN')}</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${scoreColor}`}>
            {averageScore.toFixed(1)}
            <span className="text-sm font-normal text-gray-400">/10</span>
          </div>
          {trendIcon && <span className="text-lg">{trendIcon}</span>}
        </div>
      </div>
    </Card>
  );
}

// Recommendation Card Component
interface RecommendationCardProps {
  recommendation: PersonalizedRecommendation;
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { topic, priority, message, actionLabel, actionLink } = recommendation;
  
  const priorityStyles = {
    high: 'border-l-4 border-red-500 bg-red-50',
    medium: 'border-l-4 border-yellow-500 bg-yellow-50',
    low: 'border-l-4 border-blue-500 bg-blue-50',
  };

  const priorityLabels = {
    high: { text: 'Ưu tiên cao', color: 'text-red-600', bg: 'bg-red-100' },
    medium: { text: 'Ưu tiên TB', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    low: { text: 'Ưu tiên thấp', color: 'text-blue-600', bg: 'bg-blue-100' },
  };

  return (
    <Card className={priorityStyles[priority]}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-800">{getTopicDisplayName(topic)}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityLabels[priority].bg} ${priorityLabels[priority].color}`}>
              {priorityLabels[priority].text}
            </span>
          </div>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <Link to={actionLink}>
          <Button variant="primary" size="sm">
            {actionLabel}
          </Button>
        </Link>
      </div>
    </Card>
  );
}


// Main Weak Area Analysis Component
export function WeakAreaAnalysis() {
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [questionLookup, setQuestionLookup] = useState<Map<string, Question>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load data synchronously and update state once
    const loadData = () => {
      const loadedTestHistory = getTestHistory();
      const loadedProgress = getOrCreateProgress();
      
      // Build question lookup
      const allQuestions = getAllQuestions();
      const lookup = new Map<string, Question>();
      for (const q of allQuestions) {
        lookup.set(q.id, q);
      }

      setTestHistory(loadedTestHistory);
      setProgress(loadedProgress);
      setQuestionLookup(lookup);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Analyze performance
  const topicPerformance = useMemo(() => {
    if (testHistory.length === 0) return new Map<Topic, ExtendedTopicPerformance>();
    return analyzeTopicPerformanceFromResults(testHistory, questionLookup);
  }, [testHistory, questionLookup]);

  // Generate recommendations
  const recommendations = useMemo(() => {
    if (!progress) return [];
    return generatePersonalizedRecommendations(topicPerformance, progress);
  }, [topicPerformance, progress]);

  // Separate weak and strong topics
  const weakTopics = useMemo(() => {
    return Array.from(topicPerformance.values())
      .filter(p => p.averageScore < 5)
      .sort((a, b) => a.averageScore - b.averageScore);
  }, [topicPerformance]);

  const strongTopics = useMemo(() => {
    return Array.from(topicPerformance.values())
      .filter(p => p.averageScore >= 7)
      .sort((a, b) => b.averageScore - a.averageScore);
  }, [topicPerformance]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Đang phân tích dữ liệu...</p>
        </div>
      </div>
    );
  }

  const hasData = testHistory.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          🎯 Phân tích điểm yếu
        </h1>
        <p className="text-gray-600">
          Xác định các chủ đề cần cải thiện và nhận đề xuất cá nhân hóa
        </p>
      </section>

      {!hasData ? (
        // No data state
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Chưa có dữ liệu phân tích</h2>
          <p className="text-gray-600 mb-6">
            Hãy làm một số bài kiểm tra để chúng tôi có thể phân tích điểm mạnh và điểm yếu của bạn.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/test">
              <Button variant="primary" size="lg">Làm bài kiểm tra</Button>
            </Link>
            <Link to="/practice">
              <Button variant="outline" size="lg">Luyện tập</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Personalized Recommendations */}
          {recommendations.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>💡</span> Đề xuất cá nhân hóa
              </h2>
              <div className="space-y-4">
                {recommendations.slice(0, 5).map((rec, index) => (
                  <RecommendationCard key={`${rec.topic}-${index}`} recommendation={rec} />
                ))}
              </div>
            </section>
          )}

          {/* Weak Topics */}
          {weakTopics.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>⚠️</span> Chủ đề cần cải thiện (Điểm &lt; 5)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weakTopics.map(perf => (
                  <TopicCard key={perf.topic} performance={perf} />
                ))}
              </div>
            </section>
          )}

          {/* Strong Topics */}
          {strongTopics.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🌟</span> Chủ đề làm tốt (Điểm ≥ 7)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strongTopics.map(perf => (
                  <TopicCard key={perf.topic} performance={perf} />
                ))}
              </div>
            </section>
          )}

          {/* All Topics Overview */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📋</span> Tổng quan tất cả chủ đề
            </h2>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Chủ đề</th>
                      <th className="text-center py-3 px-4">Học kỳ</th>
                      <th className="text-center py-3 px-4">Số câu</th>
                      <th className="text-center py-3 px-4">Điểm TB</th>
                      <th className="text-center py-3 px-4">Xu hướng</th>
                      <th className="text-center py-3 px-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_TOPICS.map(topic => {
                      const perf = topicPerformance.get(topic);
                      const scoreColor = !perf ? 'text-gray-400' :
                                        perf.averageScore >= 8 ? 'text-green-600' :
                                        perf.averageScore >= 5 ? 'text-yellow-600' : 'text-red-600';
                      const trendIcon = !perf ? '-' :
                                       perf.trend === 'improving' ? '📈' :
                                       perf.trend === 'declining' ? '📉' :
                                       perf.trend === 'stable' ? '➡️' : '-';
                      
                      return (
                        <tr key={topic} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{getTopicDisplayName(topic)}</td>
                          <td className="text-center py-3 px-4">HK{getTopicSemester(topic)}</td>
                          <td className="text-center py-3 px-4">{perf?.totalQuestions || 0}</td>
                          <td className={`text-center py-3 px-4 font-bold ${scoreColor}`}>
                            {perf ? perf.averageScore.toFixed(1) : '-'}
                          </td>
                          <td className="text-center py-3 px-4">{trendIcon}</td>
                          <td className="text-center py-3 px-4">
                            <Link to={`/practice/toan-co-ban?topic=${topic}`}>
                              <Button variant="outline" size="sm">Luyện tập</Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </>
      )}

      {/* Navigation */}
      <section className="flex flex-wrap gap-4 justify-center">
        <Link to="/progress">
          <Button variant="primary" size="lg" icon={<span>📈</span>}>
            Xem tiến độ
          </Button>
        </Link>
        <Link to="/practice">
          <Button variant="outline" size="lg" icon={<span>📝</span>}>
            Luyện tập
          </Button>
        </Link>
        <Link to="/">
          <Button variant="secondary" size="lg" icon={<span>🏠</span>}>
            Trang chủ
          </Button>
        </Link>
      </section>
    </div>
  );
}
