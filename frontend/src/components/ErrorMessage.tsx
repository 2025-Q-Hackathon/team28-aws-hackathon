'use client';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorMessage({ message, onRetry, onDismiss }: ErrorMessageProps) {
  return (
    <div className="backdrop-blur-md bg-red-50/80 border border-red-200 rounded-xl p-4 mb-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <span className="text-2xl">😅</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            앗, 문제가 발생했어요!
          </h3>
          <p className="text-sm text-red-700">
            {message}
          </p>
        </div>
      </div>
      
      {(onRetry || onDismiss) && (
        <div className="flex justify-end space-x-2 mt-3">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1 text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              닫기
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
            >
              다시 시도
            </button>
          )}
        </div>
      )}
    </div>
  );
}