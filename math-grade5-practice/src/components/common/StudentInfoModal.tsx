// Modal nhập thông tin học sinh
import { useState } from 'react';
import { Card, CardContent, Button } from './index';
import { saveStudentInfo, type StudentInfo } from '../../services/googleSheetsService';

interface StudentInfoModalProps {
  onComplete: (info: StudentInfo) => void;
  onCancel?: () => void;
  title?: string;
}

export function StudentInfoModal({ 
  onComplete, 
  onCancel,
  title = 'Nhập thông tin học sinh'
}: StudentInfoModalProps) {
  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Vui lòng nhập họ tên');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('Họ tên phải có ít nhất 2 ký tự');
      return;
    }

    const info: StudentInfo = {
      name: trimmedName,
      class: studentClass.trim() || undefined,
      savedAt: new Date(),
    };

    saveStudentInfo(info);
    onComplete(info);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">👋</div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <p className="text-gray-600 text-sm mt-1">
              Thông tin này sẽ được lưu để theo dõi kết quả học tập
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Nguyễn Văn A"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lớp <span className="text-gray-400">(không bắt buộc)</span>
              </label>
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="5A1"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  className="flex-1"
                >
                  Hủy
                </Button>
              )}
              <Button type="submit" className="flex-1">
                Tiếp tục →
              </Button>
            </div>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            💡 Thông tin sẽ được lưu trên thiết bị này
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
