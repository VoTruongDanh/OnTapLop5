import { useEffect, useState, useCallback, useRef } from 'react';

interface TimerProps {
  duration: number; // seconds
  onTimeUp: () => void;
  isPaused?: boolean;
  showWarning?: boolean; // Show warning when time is low
  warningThreshold?: number; // seconds
  initialTimeRemaining?: number; // For resuming tests
  onUpdate?: (timeRemaining: number) => void; // Callback for time updates
}

export function Timer({
  duration,
  onTimeUp,
  isPaused = false,
  showWarning = true,
  warningThreshold = 30,
  initialTimeRemaining,
  onUpdate,
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTimeRemaining ?? duration);
  const onTimeUpRef = useRef(onTimeUp);
  const onUpdateRef = useRef(onUpdate);
  const isInitializedRef = useRef(false);

  // Keep refs updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
    onUpdateRef.current = onUpdate;
  }, [onTimeUp, onUpdate]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Initialize timeLeft only once when initialTimeRemaining is first provided
  useEffect(() => {
    if (initialTimeRemaining !== undefined && !isInitializedRef.current) {
      setTimeLeft(initialTimeRemaining);
      isInitializedRef.current = true;
    }
  }, [initialTimeRemaining]);

  // Timer countdown
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUpRef.current();
          return 0;
        }
        
        const newTime = prev - 1;
        if (onUpdateRef.current) {
          onUpdateRef.current(newTime);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const isWarning = showWarning && timeLeft <= warningThreshold && timeLeft > 0;
  const percentage = (timeLeft / duration) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Timer Display */}
      <div
        className={`
          text-2xl font-bold font-mono px-4 py-2 rounded-lg
          ${isWarning ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-600'}
        `}
      >
        ⏱️ {formatTime(timeLeft)}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${isWarning ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Warning Message */}
      {isWarning && (
        <p className="text-sm text-red-500 font-medium">
          Sắp hết giờ!
        </p>
      )}
    </div>
  );
}
