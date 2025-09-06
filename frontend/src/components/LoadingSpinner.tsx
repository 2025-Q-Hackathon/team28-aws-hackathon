'use client';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ 
  message = '로딩 중...', 
  size = 'md' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16', 
    lg: 'w-24 h-24'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        {/* Love Q 로고 애니메이션 */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mx-auto flex items-center justify-center animate-pulse">
            <span className="text-3xl">💕</span>
          </div>
          
          {/* 회전하는 링 */}
          <div className="absolute inset-0 w-20 h-20 mx-auto">
            <div className="w-full h-full border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>
          
          {/* 작은 하트들 */}
          <div className="absolute -top-2 -right-2 text-pink-400 animate-bounce">💖</div>
          <div className="absolute -bottom-2 -left-2 text-purple-400 animate-bounce" style={{animationDelay: '0.5s'}}>💜</div>
        </div>

        {/* 로딩 텍스트 */}
        <div className="backdrop-blur-lg bg-white/20 rounded-2xl px-6 py-3 border border-white/30">
          <p className="text-purple-600 font-medium">{message}</p>
          
          {/* 점 애니메이션 */}
          <div className="flex justify-center space-x-1 mt-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}