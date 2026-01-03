import { useState } from 'react';
import type { Question } from '../../types';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface QuestionCardProps {
  question: Question;
  questionNumber?: number;
  showHint?: boolean;
  onAnswer: (answer: string | number) => void;
  onRequestHint?: () => void;
  disabled?: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  showHint = false,
  onAnswer,
  onRequestHint,
  disabled = false,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [inputAnswer, setInputAnswer] = useState('');
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  const hasOptions = question.options && question.options.length > 0;
  const hasHints = question.hints && question.hints.length > 0;

  const handleSubmit = () => {
    const answer = hasOptions ? selectedAnswer : inputAnswer.trim();
    if (answer !== null && answer !== '') {
      onAnswer(answer);
    }
  };

  const handleShowNextHint = () => {
    if (hasHints && currentHintIndex < question.hints!.length - 1) {
      setCurrentHintIndex((prev) => prev + 1);
    }
    onRequestHint?.();
  };

  const getDifficultyBadge = () => {
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[question.difficulty]}`}>
        {labels[question.difficulty]}
      </span>
    );
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          {questionNumber && (
            <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              {questionNumber}
            </span>
          )}
          <CardTitle>Câu hỏi</CardTitle>
        </div>
        {getDifficultyBadge()}
      </CardHeader>

      <CardContent>
        {/* Question Content */}
        <div className="text-lg text-gray-800 mb-6 whitespace-pre-wrap">
          {question.content}
        </div>

        {/* Answer Options or Input */}
        {hasOptions ? (
          <div className="space-y-3 mb-6">
            {question.options!.map((option, index) => (
              <button
                key={index}
                className={`
                  w-full text-left p-4 rounded-lg border-2 transition-all
                  ${selectedAnswer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={() => !disabled && setSelectedAnswer(option)}
                disabled={disabled}
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
              disabled={disabled}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        )}

        {/* Hints Section */}
        {showHint && hasHints && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600">💡</span>
              <span className="font-medium text-yellow-700">Gợi ý:</span>
            </div>
            {question.hints!.slice(0, currentHintIndex + 1).map((hint, index) => (
              <p key={index} className="text-yellow-800 ml-6">
                {index + 1}. {hint}
              </p>
            ))}
            {currentHintIndex < question.hints!.length - 1 && (
              <button
                className="mt-2 text-sm text-yellow-600 hover:text-yellow-700 underline"
                onClick={handleShowNextHint}
              >
                Xem thêm gợi ý ({currentHintIndex + 1}/{question.hints!.length})
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleSubmit}
            disabled={disabled || (hasOptions ? selectedAnswer === null : inputAnswer.trim() === '')}
          >
            Trả lời
          </Button>
          {hasHints && !showHint && onRequestHint && (
            <Button variant="outline" onClick={onRequestHint}>
              💡 Xem gợi ý
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
