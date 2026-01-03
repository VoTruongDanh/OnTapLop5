import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../common';
import type { QuestionType, Semester } from '../../types';

interface PracticeModeInfo {
  id: QuestionType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const practiceModes: PracticeModeInfo[] = [
  {
    id: 'tu-duy',
    title: 'Tư duy',
    description: 'Rèn luyện tư duy logic với các bài toán suy luận, tìm quy luật dãy số',
    icon: '🧠',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'tinh-nhanh',
    title: 'Tính nhanh',
    description: 'Luyện tập tính nhẩm nhanh với các phép tính cơ bản có giới hạn thời gian',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'toan-giai',
    title: 'Toán giải',
    description: 'Giải các bài toán có lời văn, áp dụng vào thực tế với gợi ý từng bước',
    icon: '📖',
    color: 'from-green-500 to-teal-500',
  },
  {
    id: 'toan-co-ban',
    title: 'Toán cơ bản',
    description: 'Ôn tập các kiến thức nền tảng theo chương trình, phân loại theo chủ đề',
    icon: '📐',
    color: 'from-blue-500 to-cyan-500',
  },
];

export function PracticeModeSelection() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<QuestionType | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);

  const handleStartPractice = () => {
    if (selectedMode && selectedSemester) {
      navigate(`/practice/${selectedMode}?semester=${selectedSemester}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📝 Chọn chế độ luyện tập</h1>
        <p className="text-gray-600">Chọn chế độ và học kỳ để bắt đầu luyện tập</p>
      </div>

      {/* Practice Modes Grid */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Bước 1: Chọn chế độ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {practiceModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className="text-left w-full"
            >
              <Card
                hoverable
                className={`h-full transition-all ${
                  selectedMode === mode.id
                    ? 'ring-2 ring-blue-500 ring-offset-2'
                    : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center text-2xl shadow-lg`}
                    >
                      {mode.icon}
                    </div>
                    <CardTitle>{mode.title}</CardTitle>
                    {selectedMode === mode.id && (
                      <span className="ml-auto text-blue-500 text-xl">✓</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{mode.description}</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </section>

      {/* Semester Selection */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Bước 2: Chọn học kỳ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedSemester(1)}
            className="text-left w-full"
          >
            <Card
              hoverable
              className={`text-center transition-all ${
                selectedSemester === 1
                  ? 'ring-2 ring-blue-500 ring-offset-2'
                  : ''
              }`}
            >
              <div className="text-4xl mb-3">📗</div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Học kỳ 1</h3>
              <p className="text-sm text-gray-600">
                Số tự nhiên, Phân số, Số thập phân, Hình học cơ bản
              </p>
              {selectedSemester === 1 && (
                <span className="text-blue-500 text-xl mt-2 block">✓</span>
              )}
            </Card>
          </button>
          <button
            onClick={() => setSelectedSemester(2)}
            className="text-left w-full"
          >
            <Card
              hoverable
              className={`text-center transition-all ${
                selectedSemester === 2
                  ? 'ring-2 ring-blue-500 ring-offset-2'
                  : ''
              }`}
            >
              <div className="text-4xl mb-3">📘</div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Học kỳ 2</h3>
              <p className="text-sm text-gray-600">
                Số thập phân, Tỉ số phần trăm, Hình học nâng cao, Ôn tập
              </p>
              {selectedSemester === 2 && (
                <span className="text-blue-500 text-xl mt-2 block">✓</span>
              )}
            </Card>
          </button>
        </div>
      </section>

      {/* Start Button */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => navigate('/')}>
          ← Quay lại
        </Button>
        <Button
          onClick={handleStartPractice}
          disabled={!selectedMode || !selectedSemester}
          size="lg"
        >
          Bắt đầu luyện tập →
        </Button>
      </div>

      {/* Selection Summary */}
      {(selectedMode || selectedSemester) && (
        <Card className="bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="text-2xl">📋</div>
            <div>
              <h3 className="font-bold text-blue-800">Lựa chọn của bạn:</h3>
              <p className="text-blue-700">
                {selectedMode
                  ? `Chế độ: ${practiceModes.find((m) => m.id === selectedMode)?.title}`
                  : 'Chưa chọn chế độ'}
                {' • '}
                {selectedSemester
                  ? `Học kỳ ${selectedSemester}`
                  : 'Chưa chọn học kỳ'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
