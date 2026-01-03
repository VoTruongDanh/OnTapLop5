import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from './common';
import { Button } from './common';

interface PracticeMode {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const practiceModes: PracticeMode[] = [
  {
    id: 'tu-duy',
    title: 'Tư duy',
    description: 'Rèn luyện tư duy logic với các bài toán suy luận, tìm quy luật',
    icon: '🧠',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'tinh-nhanh',
    title: 'Tính nhanh',
    description: 'Luyện tập tính nhẩm nhanh với các phép tính cơ bản',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'toan-giai',
    title: 'Toán giải',
    description: 'Giải các bài toán có lời văn, áp dụng vào thực tế',
    icon: '📖',
    color: 'from-green-500 to-teal-500',
  },
  {
    id: 'toan-co-ban',
    title: 'Toán cơ bản',
    description: 'Ôn tập các kiến thức nền tảng theo chương trình',
    icon: '📐',
    color: 'from-blue-500 to-cyan-500',
  },
];

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  href: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Kiểm tra',
    description: 'Làm bài kiểm tra và xem điểm',
    icon: '📊',
    href: '/test',
  },
  {
    title: 'Tiến độ',
    description: 'Xem thống kê học tập',
    icon: '📈',
    href: '/progress',
  },
];

export function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          🧮 Ôn tập Toán Lớp 5
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Chào mừng bạn đến với website ôn tập Toán lớp 5! 
          Hãy chọn chế độ luyện tập phù hợp để bắt đầu.
        </p>
      </section>

      {/* Practice Modes Grid */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span>📝</span> Chế độ luyện tập
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {practiceModes.map((mode) => (
            <Link key={mode.id} to={`/practice?mode=${mode.id}`} className="block">
              <Card hoverable className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center text-2xl shadow-lg`}>
                      {mode.icon}
                    </div>
                    <CardTitle>{mode.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{mode.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span>🚀</span> Truy cập nhanh
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} to={action.href} className="block">
              <Card hoverable className="flex items-center gap-4">
                <div className="text-3xl">{action.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-800">{action.title}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Semester Selection */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📚</span> Chọn học kỳ
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/practice?semester=1">
            <Card hoverable className="text-center">
              <div className="text-4xl mb-3">📗</div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Học kỳ 1</h3>
              <p className="text-sm text-gray-600 mb-4">
                Số tự nhiên, Phân số, Số thập phân, Hình học cơ bản
              </p>
              <Button variant="primary" size="sm">
                Bắt đầu
              </Button>
            </Card>
          </Link>
          <Link to="/practice?semester=2">
            <Card hoverable className="text-center">
              <div className="text-4xl mb-3">📘</div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Học kỳ 2</h3>
              <p className="text-sm text-gray-600 mb-4">
                Số thập phân, Tỉ số phần trăm, Hình học nâng cao, Ôn tập
              </p>
              <Button variant="primary" size="sm">
                Bắt đầu
              </Button>
            </Card>
          </Link>
        </div>
      </section>

      {/* Tips Section */}
      <section>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="font-bold text-green-800 mb-2">Mẹo học tập</h3>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Luyện tập đều đặn mỗi ngày 15-30 phút</li>
                <li>• Bắt đầu từ bài dễ, tăng dần độ khó</li>
                <li>• Đọc kỹ giải thích khi làm sai</li>
                <li>• Sử dụng gợi ý khi cần thiết</li>
              </ul>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
