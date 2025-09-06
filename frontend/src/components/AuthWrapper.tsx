'use client';

import { useAuth } from '../lib/auth-context';
import CustomAuth from './CustomAuth';
import LoadingSpinner from './LoadingSpinner';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoading, refreshUser } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="사용자 정보 확인 중..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">💕</span>
            </div>
            <h1 className="text-3xl font-bold text-purple-800 mb-2">Love Q</h1>
            <p className="text-purple-600">AI 연애 답변 도우미</p>
          </div>
          
          <CustomAuth onAuthSuccess={refreshUser} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}