import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../common';
import { 
  getOrCreateProgress, 
  getTestHistory, 
  getPracticeHistory 
} from '../../services/storageService';
import { 
  getTopicDisplayName, 
  calculateGrade 
} from '../../services/scoringService';
import type { StudentProgress, TestResult, PracticeSession } from '../../types/progress';
import type { Topic, QuestionType } from '../../types/question';

// Helper to format date
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Helper to format time spent
function formatTimeSpent(seconds: number): string {
  if (seconds < 60) return `${seconds} giây`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes} phút`;
  return `${minutes} phút ${remainingSeconds} giây`;
}

// Helper to get mode display name
function getModeDisplayName(mode: QuestionType): string {
  const names: Record<QuestionType, string> = {
    'tu-duy': 'Tư duy',
    'tinh-nhanh': 'Tính nhanh',
    'toan-giai': 'Toán giải',
    'toan-co-ban': 'Toán cơ bản',
  };
  return names[mode] || mode;
}

// Stats Card Component
interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
  return (
    <Card className={`bg-gradient-to-br ${color} text-white`}>
      <div className="flex items-center gap-4">
        <div className="text-4xl">{icon}</div>
        <div>
          <p className="text-sm opacity-90">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtext && <p className="text-xs opacity-75">{subtext}</p>}
        </div>
      </div>
    </Card>
  );
}


// Progress Chart Component (Simple bar chart)
interface ProgressChartProps {
  data: { label: string; value: number; maxValue: number }[];
  title: string;
}

function ProgressChart({ data, title }: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{item.label}</span>
                <span className="font-medium text-gray-900">
                  {item.value.toFixed(1)}/{item.maxValue}
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.value >= 8 ? 'bg-green-500' :
                    item.value >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(item.value / item.maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Activity Component
interface RecentActivityProps {
  testHistory: TestResult[];
  practiceHistory: PracticeSession[];
}

function RecentActivity({ testHistory, practiceHistory }: RecentActivityProps) {
  // Combine and sort by date
  const activities = [
    ...testHistory.map(t => ({ type: 'test' as const, date: new Date(t.date), data: t })),
    ...practiceHistory.map(p => ({ type: 'practice' as const, date: new Date(p.date), data: p })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Chưa có hoạt động nào. Hãy bắt đầu luyện tập!
          </p>
          <div className="flex justify-center">
            <Link to="/practice">
              <Button variant="primary">Bắt đầu luyện tập</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {activity.type === 'test' 
                    ? `Kiểm tra - ${(activity.data as TestResult).score}/10 điểm`
                    : `Luyện tập ${getModeDisplayName((activity.data as PracticeSession).mode)}`
                  }
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(activity.date)}
                  {activity.type === 'test' && (
                    <span> • {(activity.data as TestResult).correctAnswers}/{(activity.data as TestResult).totalQuestions} câu đúng</span>
                  )}
                  {activity.type === 'practice' && (
                    <span> • {(activity.data as PracticeSession).correctAnswers}/{(activity.data as PracticeSession).questionsAttempted} câu đúng</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


// Weak Topics Component
interface WeakTopicsProps {
  weakTopics: Topic[];
}

function WeakTopics({ weakTopics }: WeakTopicsProps) {
  if (weakTopics.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
        <div>
          <h3 className="font-bold text-green-800">Tuyệt vời!</h3>
          <p className="text-green-700 text-sm">
            Bạn đang làm tốt ở tất cả các chủ đề. Hãy tiếp tục phát huy!
          </p>
        </div>
        <div className="mt-4">
          <Link to="/progress/weak-areas">
            <Button variant="outline" size="sm">Xem phân tích chi tiết</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-orange-800">
            Chủ đề cần ôn tập
          </CardTitle>
          <Link to="/progress/weak-areas">
            <Button variant="outline" size="sm">Xem chi tiết</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {weakTopics.slice(0, 3).map((topic) => (
            <div
              key={topic}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-100"
            >
              <span className="text-gray-800">{getTopicDisplayName(topic)}</span>
              <Link to={`/practice?topic=${topic}`}>
                <Button variant="outline" size="sm">
                  Ôn tập
                </Button>
              </Link>
            </div>
          ))}
          {weakTopics.length > 3 && (
            <p className="text-sm text-orange-600 text-center pt-2">
              +{weakTopics.length - 3} chủ đề khác
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Progress Dashboard Component
export function ProgressDashboard() {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load all data synchronously and update state once
    const loadData = () => {
      const loadedProgress = getOrCreateProgress();
      const loadedTestHistory = getTestHistory();
      const loadedPracticeHistory = getPracticeHistory();

      setProgress(loadedProgress);
      setTestHistory(loadedTestHistory);
      setPracticeHistory(loadedPracticeHistory);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Chưa có dữ liệu</h2>
        <p className="text-gray-600 mb-6">Hãy bắt đầu luyện tập để xem tiến độ của bạn!</p>
        <Link to="/practice">
          <Button variant="primary" size="lg">Bắt đầu luyện tập</Button>
        </Link>
      </div>
    );
  }

  // Calculate statistics
  const totalQuestions = progress.totalExercises;
  const correctAnswers = progress.correctAnswers;
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const averageTestScore = testHistory.length > 0
    ? testHistory.reduce((sum, t) => sum + t.score, 0) / testHistory.length
    : 0;
  const totalTimeSpent = [
    ...testHistory.map(t => t.timeSpent),
    ...practiceHistory.map(p => p.timeSpent),
  ].reduce((sum, t) => sum + t, 0);

  // Prepare chart data from recent tests
  const recentTests = testHistory.slice(-5);
  const chartData = recentTests.map((test, index) => ({
    label: `Bài ${index + 1}`,
    value: test.score,
    maxValue: 10,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Tiến độ học tập
        </h1>
        <p className="text-gray-600">
          Theo dõi kết quả và cải thiện kỹ năng của bạn
        </p>
      </section>

      {/* Stats Overview */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tổng quan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon="📝"
            label="Tổng câu hỏi"
            value={totalQuestions}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            icon="✅"
            label="Câu đúng"
            value={correctAnswers}
            subtext={`${accuracy.toFixed(1)}% chính xác`}
            color="from-green-500 to-green-600"
          />
          <StatCard
            icon="📊"
            label="Điểm TB"
            value={averageTestScore.toFixed(1)}
            subtext={testHistory.length > 0 ? calculateGrade(averageTestScore) : 'Chưa có bài kiểm tra'}
            color="from-purple-500 to-purple-600"
          />
          <StatCard
            icon="⏱️"
            label="Thời gian"
            value={formatTimeSpent(totalTimeSpent)}
            color="from-orange-500 to-orange-600"
          />
        </div>
      </section>

      {/* Charts and Weak Topics */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProgressChart
          data={chartData}
          title="Điểm các bài kiểm tra gần đây"
        />
        <WeakTopics weakTopics={progress.weakTopics} />
      </section>

      {/* Recent Activity */}
      <section>
        <RecentActivity
          testHistory={testHistory}
          practiceHistory={practiceHistory}
        />
      </section>

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-4 justify-center">
        <Link to="/progress/weak-areas">
          <Button variant="primary" size="lg">
            Phân tích điểm yếu
          </Button>
        </Link>
        <Link to="/practice">
          <Button variant="outline" size="lg">
            Luyện tập
          </Button>
        </Link>
        <Link to="/test">
          <Button variant="outline" size="lg">
            Làm bài kiểm tra
          </Button>
        </Link>
        <Link to="/">
          <Button variant="secondary" size="lg">
            Trang chủ
          </Button>
        </Link>
      </section>
    </div>
  );
}
