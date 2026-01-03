// Admin Dashboard - Thống kê kết quả từ Google Sheets
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common';
import { 
  fetchAllDataFromSheets, 
  type SheetTestResult, 
  type SheetPracticeResult 
} from '../../services/googleSheetsService';

interface DailyStats {
  date: string;
  testCount: number;
  practiceCount: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
}

export function AdminDashboard() {
  const [testResults, setTestResults] = useState<SheetTestResult[]>([]);
  const [practiceResults, setPracticeResults] = useState<SheetPracticeResult[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await fetchAllDataFromSheets();
    
    if (result.success) {
      setTestResults(result.testResults);
      setPracticeResults(result.practiceResults);
      calculateDailyStats(result.testResults, result.practiceResults);
      setLastUpdated(new Date());
    } else {
      setError(result.error || 'Không thể tải dữ liệu');
    }
    
    setLoading(false);
  }, []);

  const calculateDailyStats = (tests: SheetTestResult[], practice: SheetPracticeResult[]) => {
    const statsMap = new Map<string, DailyStats>();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      statsMap.set(dateStr, {
        date: dateStr,
        testCount: 0,
        practiceCount: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        averageScore: 0,
      });
    }

    // Aggregate test results
    for (const test of tests) {
      const dateStr = extractDatePart(test['Thời gian']);
      const stat = statsMap.get(dateStr);
      if (stat) {
        stat.testCount++;
        stat.totalQuestions += Number(test['Tổng câu']) || 0;
        stat.correctAnswers += Number(test['Số câu đúng']) || 0;
      }
    }

    // Aggregate practice results
    for (const session of practice) {
      const dateStr = extractDatePart(session['Thời gian']);
      const stat = statsMap.get(dateStr);
      if (stat) {
        stat.practiceCount++;
        stat.totalQuestions += Number(session['Số câu']) || 0;
        stat.correctAnswers += Number(session['Đúng']) || 0;
      }
    }

    // Calculate average scores
    for (const stat of statsMap.values()) {
      if (stat.totalQuestions > 0) {
        stat.averageScore = Math.round((stat.correctAnswers / stat.totalQuestions) * 100) / 10;
      }
    }

    setDailyStats(Array.from(statsMap.values()));
  };

  const extractDatePart = (dateTimeStr: string): string => {
    // Format: "03/01/2026 21:35:42" -> "03/01"
    if (!dateTimeStr) return '';
    const parts = dateTimeStr.split(' ')[0];
    const dateParts = parts.split('/');
    if (dateParts.length >= 2) {
      return `${dateParts[0]}/${dateParts[1]}`;
    }
    return parts;
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTotalStats = () => {
    const totalTests = testResults.length;
    const totalPractice = practiceResults.length;
    const totalQuestions = testResults.reduce((sum, t) => sum + (Number(t['Tổng câu']) || 0), 0);
    const totalCorrect = testResults.reduce((sum, t) => sum + (Number(t['Số câu đúng']) || 0), 0);
    const avgScore = testResults.length > 0
      ? Math.round(testResults.reduce((sum, t) => sum + (Number(t['Điểm']) || 0), 0) / testResults.length * 10) / 10
      : 0;
    
    // Count unique students
    const uniqueStudents = new Set([
      ...testResults.map(t => t['Họ tên']),
      ...practiceResults.map(p => p['Họ tên'])
    ]).size;
    
    return { totalTests, totalPractice, totalQuestions, totalCorrect, avgScore, uniqueStudents };
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-64 gap-4">
        <div className="text-4xl animate-bounce">📊</div>
        <div className="text-gray-500">Đang tải dữ liệu từ Google Sheets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-64 gap-4">
        <div className="text-4xl">❌</div>
        <div className="text-red-500">{error}</div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Thử lại
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Đảm bảo đã cập nhật Apps Script với function getAllData và deploy lại
        </p>
      </div>
    );
  }

  const totals = getTotalStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📊 Thống kê Admin</h1>
        <Link to="/" className="text-blue-600 hover:text-blue-800">← Về trang chủ</Link>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-gray-600">Dữ liệu từ Google Sheets - Tất cả học sinh</p>
        {lastUpdated && (
          <span className="text-sm text-gray-500">
            Cập nhật: {lastUpdated.toLocaleTimeString('vi-VN')}
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-indigo-600">{totals.uniqueStudents}</div>
          <div className="text-sm text-gray-600">Học sinh</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-blue-600">{totals.totalTests}</div>
          <div className="text-sm text-gray-600">Bài kiểm tra</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-green-600">{totals.totalPractice}</div>
          <div className="text-sm text-gray-600">Lượt luyện tập</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-purple-600">{totals.totalQuestions}</div>
          <div className="text-sm text-gray-600">Tổng câu hỏi</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-emerald-600">{totals.totalCorrect}</div>
          <div className="text-sm text-gray-600">Câu đúng</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-3xl font-bold text-orange-600">{totals.avgScore}</div>
          <div className="text-sm text-gray-600">Điểm TB</div>
        </Card>
      </div>

      {/* Daily Stats Table */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">📅 Thống kê 7 ngày gần nhất</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">Ngày</th>
                <th className="text-center p-3">Kiểm tra</th>
                <th className="text-center p-3">Luyện tập</th>
                <th className="text-center p-3">Câu hỏi</th>
                <th className="text-center p-3">Đúng</th>
                <th className="text-center p-3">Điểm TB</th>
              </tr>
            </thead>
            <tbody>
              {dailyStats.map((stat, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{stat.date}</td>
                  <td className="text-center p-3">{stat.testCount}</td>
                  <td className="text-center p-3">{stat.practiceCount}</td>
                  <td className="text-center p-3">{stat.totalQuestions}</td>
                  <td className="text-center p-3 text-green-600">{stat.correctAnswers}</td>
                  <td className="text-center p-3">
                    <span className={`font-medium ${stat.averageScore >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.averageScore > 0 ? stat.averageScore : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Test Results Table */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">📝 Chi tiết bài kiểm tra ({testResults.length})</h2>
        {testResults.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Chưa có bài kiểm tra nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3">Thời gian</th>
                  <th className="text-left p-3">Họ tên</th>
                  <th className="text-center p-3">Lớp</th>
                  <th className="text-center p-3">Học kỳ</th>
                  <th className="text-left p-3">Chủ đề</th>
                  <th className="text-center p-3">Điểm</th>
                  <th className="text-center p-3">Đúng/Tổng</th>
                  <th className="text-center p-3">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {testResults.slice().reverse().map((test, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-xs">{test['Thời gian']}</td>
                    <td className="p-3 font-medium">{test['Họ tên']}</td>
                    <td className="text-center p-3">{test['Lớp'] || '-'}</td>
                    <td className="text-center p-3">{test['Học kỳ']}</td>
                    <td className="p-3 text-xs max-w-32 truncate">{test['Chủ đề']}</td>
                    <td className="text-center p-3">
                      <span className={`font-bold ${Number(test['Điểm']) >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                        {test['Điểm']}
                      </span>
                    </td>
                    <td className="text-center p-3">{test['Số câu đúng']}/{test['Tổng câu']}</td>
                    <td className="text-center p-3 text-xs">{test['Thời gian làm']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Practice Results Table */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">🎯 Chi tiết luyện tập ({practiceResults.length})</h2>
        {practiceResults.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Chưa có lượt luyện tập nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3">Thời gian</th>
                  <th className="text-left p-3">Họ tên</th>
                  <th className="text-center p-3">Lớp</th>
                  <th className="text-left p-3">Chế độ</th>
                  <th className="text-center p-3">Số câu</th>
                  <th className="text-center p-3">Đúng</th>
                  <th className="text-center p-3">Tỉ lệ</th>
                </tr>
              </thead>
              <tbody>
                {practiceResults.slice().reverse().map((session, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-xs">{session['Thời gian']}</td>
                    <td className="p-3 font-medium">{session['Họ tên']}</td>
                    <td className="text-center p-3">{session['Lớp'] || '-'}</td>
                    <td className="p-3">{session['Chế độ']}</td>
                    <td className="text-center p-3">{session['Số câu']}</td>
                    <td className="text-center p-3 text-green-600">{session['Đúng']}</td>
                    <td className="text-center p-3">{session['Tỉ lệ %']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Refresh Button */}
      <div className="text-center space-y-2">
        <button
          onClick={loadData}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Làm mới dữ liệu
        </button>
        <p className="text-sm text-gray-500">
          <a 
            href="https://docs.google.com/spreadsheets/d/1OP0xGlOa0N1YQLY8CwofKIAd42I38QsMe8kLoDPF5z4/edit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            📊 Mở Google Sheets
          </a>
        </p>
      </div>
    </div>
  );
}
