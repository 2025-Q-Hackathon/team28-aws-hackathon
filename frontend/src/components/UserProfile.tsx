'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiService } from '../services/api';

interface UserProfileData {
  speech_style: {
    formal_ratio: number;
    emoji_ratio: number;
    avg_length: number;
    tone: string;
    personality_traits: string[];
  };
  last_updated: string;
}

interface UserProfileProps {
  onClose: () => void;
  onUpdateProfile: (newData: any) => void;
  speechProfile?: any;
}

export default function UserProfile({ onClose, onUpdateProfile }: UserProfileProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      // API 호출로 사용자 프로필 로드
      // const response = await apiService.getUserProfile(user.userId);
      // setProfile(response.profile);
      
      // 임시 데이터
      setProfile({
        speech_style: {
          formal_ratio: 0.3,
          emoji_ratio: 0.4,
          avg_length: 25,
          tone: '친근함',
          personality_traits: ['활발함', '유머러스', '배려심 많음']
        },
        last_updated: '2024-01-15T10:30:00Z'
      });
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [showSpeechAnalysis, setShowSpeechAnalysis] = useState(false);
  const [speechData, setSpeechData] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleReanalyze = () => {
    setShowSpeechAnalysis(true);
  };

  const analyzeSpeech = async () => {
    if (!speechData.trim()) {
      alert('대화 내용을 입력해주세요!');
      return;
    }

    setIsAnalyzing(true);
    try {
      const messages = speechData.split('\n').filter(msg => msg.trim());
      const result = await apiService.analyzeSpeech({ messages });
      
      setProfile(prev => ({
        ...prev!,
        speech_style: {
          formal_ratio: result.formal_ratio,
          emoji_ratio: result.emoji_ratio,
          avg_length: result.avg_length,
          tone: result.tone,
          personality_traits: result.personality_traits || []
        },
        last_updated: new Date().toISOString()
      }));
      
      onUpdateProfile(result);
      setShowSpeechAnalysis(false);
      setSpeechData('');
      alert('말투 분석이 완료되었습니다!');
    } catch (error) {
      console.error('Speech analysis failed:', error);
      alert('말투 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setUploadStatus('uploading');
    setUploadError('');
    setIsAnalyzing(true);
    
    try {
      const fileContent = await file.text();
      
      if (!fileContent.trim()) {
        throw new Error('파일이 비어있습니다.');
      }
      
      const result = await apiService.processFile({
        file_content: fileContent,
        file_type: file.name.endsWith('.txt') ? 'txt' : 'kakao'
      });
      
      setProfile(prev => ({
        ...prev!,
        speech_style: {
          formal_ratio: result.analysis.formal_ratio,
          emoji_ratio: result.analysis.emoji_ratio,
          avg_length: result.analysis.avg_length,
          tone: result.analysis.tone,
          personality_traits: result.analysis.personality_traits || []
        },
        last_updated: new Date().toISOString()
      }));
      
      onUpdateProfile(result.analysis);
      setUploadStatus('success');
      
      setTimeout(() => {
        setShowSpeechAnalysis(false);
        setUploadStatus('idle');
        alert('말투 분석이 완료되었습니다!');
      }, 1500);
      
    } catch (error) {
      console.error('File processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.';
      setUploadError(errorMessage);
      setUploadStatus('error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-96">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">내 프로필</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 말투 스타일 */}
        <div className="space-y-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-3">📊 말투 분석 결과</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>존댓말 사용률</span>
                  <span>{Math.round(profile.speech_style.formal_ratio * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${profile.speech_style.formal_ratio * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>이모티콘 사용</span>
                  <span>{profile.speech_style.emoji_ratio.toFixed(1)}개/메시지</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-pink-500 h-2 rounded-full"
                    style={{ width: `${Math.min(profile.speech_style.emoji_ratio * 25, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-600 mb-2">성격 특성</p>
                <div className="flex flex-wrap gap-1">
                  {profile.speech_style.personality_traits.map((trait, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleReanalyze}
            className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
          >
            🔄 말투 분석하기
          </button>
        </div>

        {/* 마지막 업데이트 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            마지막 업데이트: {new Date(profile.last_updated).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>
      
      {/* 말투 분석 모달 */}
      {showSpeechAnalysis && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
          <div className="bg-white rounded-2xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">말투 분석</h3>
              <button
                onClick={() => setShowSpeechAnalysis(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  평소 대화 내용
                </label>
                <textarea
                  value={speechData}
                  onChange={(e) => setSpeechData(e.target.value)}
                  placeholder="평소 친구들과 나눈 대화를 붙여넣어 주세요...&#10;&#10;예시:&#10;나: 안녕! 오늘 뭐해?&#10;친구: 집에서 쉬고 있어&#10;나: 나도 심심해 ㅠㅠ"
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-sm"
                />
              </div>

              <div>
                <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                  uploadStatus === 'uploading' 
                    ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
                    : uploadStatus === 'success'
                    ? 'border-green-300 bg-green-50'
                    : uploadStatus === 'error'
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    {uploadStatus === 'uploading' ? (
                      <div className="w-6 h-6 mb-1 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : uploadStatus === 'success' ? (
                      <span className="text-2xl mb-1">✅</span>
                    ) : uploadStatus === 'error' ? (
                      <span className="text-2xl mb-1">❌</span>
                    ) : (
                      <svg className="w-6 h-6 mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                    <p className="text-xs text-gray-600">
                      {uploadStatus === 'uploading' ? '분석 중...' :
                       uploadStatus === 'success' ? '분석 완료!' :
                       uploadStatus === 'error' ? '다시 시도' :
                       '카카오톡 대화내역 업로드'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".txt"
                    disabled={uploadStatus === 'uploading'}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFile(file);
                        setUploadStatus('idle');
                        setUploadError('');
                        handleFileUpload(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                {uploadError && (
                  <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                )}
              </div>

              <button
                onClick={analyzeSpeech}
                disabled={!speechData.trim() || isAnalyzing}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isAnalyzing ? '분석 중...' : '분석 시작'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}