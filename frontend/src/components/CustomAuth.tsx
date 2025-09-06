'use client';

import { useState } from 'react';
import { signIn, signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

interface CustomAuthProps {
  onAuthSuccess: () => void;
}

export default function CustomAuth({ onAuthSuccess }: CustomAuthProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'confirm'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    confirmationCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn({
        username: formData.email,
        password: formData.password
      });
      onAuthSuccess();
    } catch (error: any) {
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email
          }
        }
      });
      setMode('confirm');
    } catch (error: any) {
      setError(error.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await confirmSignUp({
        username: formData.email,
        confirmationCode: formData.confirmationCode
      });
      
      // 확인 후 자동 로그인
      await signIn({
        username: formData.email,
        password: formData.password
      });
      onAuthSuccess();
    } catch (error: any) {
      setError(error.message || '인증에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendSignUpCode({ username: formData.email });
      setError('');
      alert('인증 코드가 재전송되었습니다.');
    } catch (error: any) {
      setError(error.message || '코드 재전송에 실패했습니다.');
    }
  };

  const renderSignIn = () => (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이메일
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="이메일 주소를 입력하세요"
          className="w-full p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800 placeholder-gray-600"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          비밀번호
        </label>
        <input
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          placeholder="비밀번호를 입력하세요"
          className="w-full p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800 placeholder-gray-600"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 shadow-lg"
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode('signup')}
          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
        >
          계정이 없으신가요? 회원가입
        </button>
      </div>
    </form>
  );

  const renderSignUp = () => (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이메일
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="이메일 주소를 입력하세요"
          className="w-full p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800 placeholder-gray-600"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          비밀번호
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          placeholder="8자 이상의 비밀번호"
          className="w-full p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800 placeholder-gray-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          비밀번호 확인
        </label>
        <input
          type="password"
          required
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          placeholder="비밀번호를 다시 입력하세요"
          className="w-full p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800 placeholder-gray-600"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 shadow-lg"
      >
        {isLoading ? '가입 중...' : '회원가입'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
        >
          이미 계정이 있으신가요? 로그인
        </button>
      </div>
    </form>
  );

  const renderConfirm = () => (
    <form onSubmit={handleConfirmSignUp} className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">이메일 인증</h3>
        <p className="text-sm text-gray-600">
          {formData.email}로 전송된<br/>
          인증 코드를 입력해주세요
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          인증 코드
        </label>
        <input
          type="text"
          required
          value={formData.confirmationCode}
          onChange={(e) => setFormData({...formData, confirmationCode: e.target.value})}
          placeholder="6자리 인증 코드"
          className="w-full p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800 placeholder-gray-600 text-center text-lg tracking-widest"
          maxLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 shadow-lg"
      >
        {isLoading ? '인증 중...' : '인증 완료'}
      </button>

      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={handleResendCode}
          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
        >
          인증 코드 재전송
        </button>
        <br />
        <button
          type="button"
          onClick={() => setMode('signin')}
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          로그인으로 돌아가기
        </button>
      </div>
    </form>
  );

  return (
    <div className="backdrop-blur-lg bg-white/20 rounded-3xl shadow-2xl border border-white/30 p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {mode === 'signin' ? '로그인' : mode === 'signup' ? '회원가입' : '이메일 인증'}
        </h2>
        <p className="text-gray-600 text-sm">
          {mode === 'signin' 
            ? '개인화된 연애 답변을 받아보세요' 
            : mode === 'signup'
            ? 'Love Q와 함께 시작해보세요'
            : '마지막 단계입니다!'
          }
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {mode === 'signin' && renderSignIn()}
      {mode === 'signup' && renderSignUp()}
      {mode === 'confirm' && renderConfirm()}
    </div>
  );
}