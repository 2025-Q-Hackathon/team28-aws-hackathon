'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useAuth } from '../lib/auth-context';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-600">로딩 중...</p>
        </div>
      </div>
    );
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
          
          <Authenticator
            signUpAttributes={['email']}
            formFields={{
              signUp: {
                email: {
                  order: 1,
                  placeholder: '이메일 주소',
                  label: '이메일',
                },
                password: {
                  order: 2,
                  placeholder: '비밀번호 (8자 이상)',
                  label: '비밀번호',
                },
                confirm_password: {
                  order: 3,
                  placeholder: '비밀번호 확인',
                  label: '비밀번호 확인',
                },
              },
              signIn: {
                email: {
                  placeholder: '이메일 주소',
                  label: '이메일',
                },
                password: {
                  placeholder: '비밀번호',
                  label: '비밀번호',
                },
              },
            }}
            components={{
              Header() {
                return (
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Love Q에 오신 것을 환영합니다!
                    </h2>
                    <p className="text-gray-600 text-sm mt-2">
                      로그인하여 개인화된 연애 답변을 받아보세요
                    </p>
                  </div>
                );
              },
            }}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}