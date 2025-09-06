'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiService, ResponseOption } from '../services/api';
import { AuthProvider } from '../lib/auth-context';
import AuthWrapper from '../components/AuthWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import ResponseCard from '../components/ResponseCard';
import ChatRoomManager from '../components/ChatRoomManager';
import UserProfile from '../components/UserProfile';
import { useAuth } from '../lib/auth-context';
import '../lib/amplify'; // Amplify 설정 로드

// 복사 버튼 컴포넌트
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // 최신 브라우저의 Clipboard API 사용
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // 대체 방법 (구형 브라우저 또는 비보안 컨텍스트)
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('복사 실패');
        }
      }
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
      // 사용자에게 수동 복사 안내
      const userAgent = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      if (isMobile) {
        alert('복사 기능을 사용할 수 없습니다. 답변을 길게 눌러서 복사해주세요.');
      } else {
        alert('복사 기능을 사용할 수 없습니다. Ctrl+C로 복사해주세요.');
      }
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        copied 
          ? 'bg-green-100 text-green-700 border border-green-300' 
          : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
      }`}
    >
      {copied ? (
        <span className="flex items-center justify-center space-x-1">
          <span>✅</span>
          <span>복사 완료!</span>
        </span>
      ) : (
        <span className="flex items-center justify-center space-x-1">
          <span>📋</span>
          <span>답변 복사하기</span>
        </span>
      )}
    </button>
  );
}

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  type?: 'response-option' | 'analysis';
  data?: any;
}

interface SpeechProfile {
  total_messages: number;
  formal_ratio: number;
  emoji_ratio: number;
  avg_length: number;
  tone: string;
  speech_style: string;
  personality_traits: string[];
  response_examples: string[];
  emotion_data?: {
    sentiment: string;
    sentiment_confidence: number;
  };
}

interface PartnerInfo {
  name: string;
  age: string;
  relationship: string;
  personality: string;
  description: string;
  interests: string;
  communication_style: string;
}

function HomeContent() {
  const { user, signOut } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [speechData, setSpeechData] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [speechProfile, setSpeechProfile] = useState<SpeechProfile | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo>({
    name: '',
    age: '',
    relationship: '',
    personality: '',
    description: '',
    interests: '',
    communication_style: ''
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string>('');
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [showProfile, setShowProfile] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 헬퍼 함수들
  const getTypeEmoji = (type: string) => {
    switch (type) {
      case '안전형': return '🛡️';
      case '균형형': return '⚖️';
      case '적극형': return '🔥';
      default: return '💬';
    }
  };

  const getRiskColor = (riskLevel: number) => {
    if (riskLevel <= 2) return 'bg-green-100 text-green-700';
    if (riskLevel <= 3) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 사용자 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 파일 업로드 처리
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setUploadStatus('uploading');
    setUploadError('');
    setIsAnalyzing(true);
    
    try {
      const fileContent = await file.text();
      
      // 파일 내용 검증
      if (!fileContent.trim()) {
        throw new Error('파일이 비어있습니다.');
      }
      
      const result = await apiService.processFile({
        file_content: fileContent,
        file_type: file.name.endsWith('.txt') ? 'txt' : 'kakao'
      });
      
      setSpeechProfile(result.analysis);
      setUploadStatus('success');
      
      // 성공 후 잠시 대기 후 다음 화면으로
      setTimeout(() => {
        setCurrentScreen('partner-info');
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

  // 말투 분석 함수
  const analyzeSpeech = async () => {
    if (!speechData.trim()) {
      alert('대화 내용을 입력해주세요!');
      return;
    }

    setIsAnalyzing(true);
    try {
      // 메시지를 줄바꿈으로 분리
      const messages = speechData.split('\n').filter(msg => msg.trim());
      
      const result = await apiService.analyzeSpeech({ messages });
      
      setSpeechProfile(result);
      setCurrentScreen('partner-info');
    } catch (error) {
      console.error('Speech analysis failed:', error);
      alert('말투 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 답변 생성 함수 (최적 답변 1개만)
  const generateResponses = async (userMessage: string) => {
    if (!speechProfile || !user) return;

    setIsTyping(true);
    try {
      const result = await apiService.generateResponses({
        context: messages.map(m => m.text).join('\n'),
        situation: userMessage,
        user_style: speechProfile,
        partner_info: partnerInfo
      });

      // 사용자 말투에 가장 적합한 답변 선택
      const bestResponse = selectBestResponse(result.responses, speechProfile);

      // 대화 기록 저장
      try {
        await apiService.saveConversation({
          user_id: user.userId,
          user_message: userMessage,
          ai_responses: [bestResponse],
          partner_name: partnerInfo.name,
          partner_relationship: partnerInfo.relationship
        });
      } catch (saveError) {
        console.warn('Failed to save conversation:', saveError);
      }

      // 최적 답변만 표시
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: '',
          sender: 'bot',
          timestamp: new Date(),
          type: 'response-option',
          data: bestResponse
        }]);
      }, 500);
    } catch (error) {
      console.error('Response generation failed:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: '답변 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // 사용자 말투에 가장 적합한 답변 선택
  const selectBestResponse = (responses: ResponseOption[], profile: SpeechProfile): ResponseOption => {
    if (!responses || responses.length === 0) {
      return {
        type: '균형형',
        message: '좋은 생각이네요! 어떻게 하면 좋을까요?',
        explanation: '무난한 답변입니다.',
        risk_level: 2,
        confidence: 0.8
      };
    }

    // 사용자 성격에 따른 가중치 계산
    const userRiskTolerance = calculateRiskTolerance(profile);
    
    // 각 답변에 점수 부여
    const scoredResponses = responses.map(response => {
      let score = response.confidence || 0.5;
      
      // 위험도와 사용자 성향 매칭
      const riskMatch = 1 - Math.abs(response.risk_level - userRiskTolerance) / 5;
      score += riskMatch * 0.4;
      
      // 말투 스타일 매칭
      if (profile.formal_ratio > 0.7 && response.type === '안전형') score += 0.2;
      else if (profile.formal_ratio < 0.3 && response.type === '대담형') score += 0.2;
      else if (response.type === '균형형') score += 0.1;
      
      return { ...response, score };
    });
    
    // 가장 높은 점수의 답변 반환
    return scoredResponses.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  };

  // 사용자 위험 허용도 계산
  const calculateRiskTolerance = (profile: SpeechProfile): number => {
    let riskLevel = 2.5; // 기본값
    
    // 이모티콘 사용이 많으면 더 적극적
    if (profile.emoji_ratio > 0.5) riskLevel += 0.5;
    
    // 존댓말 비율이 낮으면 더 캐주얼
    if (profile.formal_ratio < 0.3) riskLevel += 0.5;
    
    // 메시지 길이가 짧으면 더 직접적
    if (profile.avg_length < 20) riskLevel += 0.3;
    
    // 성격 특성 고려
    if (profile.personality_traits?.includes('활발함') || 
        profile.personality_traits?.includes('적극적')) {
      riskLevel += 0.4;
    }
    
    return Math.min(Math.max(riskLevel, 1), 5);
  };

  // 메시지 전송
  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    generateResponses(inputText);
    setInputText('');
  };

  const handleResponseSelection = async (responseData: any) => {
    if (!user) return;
    
    try {
      await apiService.saveConversation({
        user_id: user.userId,
        user_message: messages[messages.length - 2]?.text || '',
        ai_responses: [responseData],
        selected_response_type: responseData.type,
        selected_response: responseData.message,
        partner_name: partnerInfo.name,
        partner_relationship: partnerInfo.relationship
      });
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: `✅ 답변을 복사했어요!\n\n다른 상황이 있으면 언제든 말해주세요 😊`,
        sender: 'bot',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to save response selection:', error);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
      alert('복사에 실패했습니다.');
    }
  };

  const handleSelectRoom = (roomId: string, roomPartnerInfo: any) => {
    setCurrentRoomId(roomId);
    setPartnerInfo(roomPartnerInfo);
    setCurrentScreen('chatbot');
    setSidebarOpen(false);
    setMessages([{
      id: 1,
      text: `안녕! ${roomPartnerInfo.name}님과의 대화를 이어가볼까요? 💕\n\n어떤 상황인지 말해주세요!`,
      sender: 'bot',
      timestamp: new Date()
    }]);
  };

  const handleNewChat = () => {
    setCurrentRoomId('');
    // 말투 분석 없이 바로 상대방 정보 입력으로
    setCurrentScreen('partner-info');
    setSidebarOpen(false);
    setMessages([]);
    setPartnerInfo({ name: '', age: '', relationship: '', personality: '', description: '', interests: '', communication_style: '' });
    
    // 기본 말투 프로필 설정 (사용자가 설정하지 않은 경우)
    if (!speechProfile) {
      setSpeechProfile({
        total_messages: 0,
        formal_ratio: 0.3,
        emoji_ratio: 0.4,
        avg_length: 25,
        tone: '친근함',
        speech_style: '일반적',
        personality_traits: ['친근함'],
        response_examples: []
      });
    }
  };

  // 상대방 설명 미리보기 분석
  const getPreviewAnalysis = (description: string): string[] => {
    const insights = [];
    const lowerDesc = description.toLowerCase();
    
    // 성격 특성 감지
    if (lowerDesc.includes('내성적') || lowerDesc.includes('조용')) {
      insights.push('내성적 성향 감지 - 부드러운 접근 추천');
    }
    if (lowerDesc.includes('외향적') || lowerDesc.includes('활발')) {
      insights.push('외향적 성향 감지 - 적극적 소통 가능');
    }
    if (lowerDesc.includes('직설적')) {
      insights.push('직설적 소통 선호 - 명확한 의사표현 효과적');
    }
    if (lowerDesc.includes('간접적') || lowerDesc.includes('돌려서')) {
      insights.push('간접적 소통 선호 - 은유적 표현 추천');
    }
    if (lowerDesc.includes('유머') || lowerDesc.includes('재미')) {
      insights.push('유머 선호 - 가벼운 농담 활용 가능');
    }
    if (lowerDesc.includes('진지') || lowerDesc.includes('깊이')) {
      insights.push('진지한 대화 선호 - 의미 있는 주제 추천');
    }
    
    // 관심사 기반 대화 주제
    if (lowerDesc.includes('영화')) {
      insights.push('영화 관심 - 영화 추천/리뷰 대화 주제 활용');
    }
    if (lowerDesc.includes('독서') || lowerDesc.includes('책')) {
      insights.push('독서 관심 - 책 추천/독서 경험 공유 효과적');
    }
    if (lowerDesc.includes('운동')) {
      insights.push('운동 관심 - 함께 운동 제안 가능');
    }
    
    // 기본 인사이트
    if (insights.length === 0) {
      insights.push('상세 정보를 더 입력하면 더 정확한 분석이 가능합니다');
    }
    
    return insights.slice(0, 3); // 최대 3개
  };

  // 말투 학습 화면
  const renderSpeechLearning = () => (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 flex flex-col">
      {/* 뒤로가기 버튼 */}
      <div className="max-w-md mx-auto w-full mb-4">
        <button
          onClick={() => setCurrentScreen('welcome')}
          className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">뒤로가기</span>
        </button>
      </div>
      
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">💕</span>
          </div>
          <h1 className="text-3xl font-bold text-purple-800 mb-2">Love Q</h1>
          <p className="text-purple-600">AI 연애 답변 도우미</p>
        </div>

        <div className="backdrop-blur-lg bg-white/20 rounded-3xl shadow-2xl border border-white/30 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">📚 말투 학습</h2>
          <p className="text-gray-700 mb-4 text-sm">
            너만의 자연스러운 답변을 만들기 위해<br/>
            평소 대화 스타일을 학습할게!
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              평소 대화 내용 (카톡, 문자 등)
            </label>
            <textarea
              value={speechData}
              onChange={(e) => setSpeechData(e.target.value)}
              placeholder="평소 친구들과 나눈 대화를 붙여넣어 주세요...&#10;&#10;예시:&#10;나: 안녕! 오늘 뭐해?&#10;친구: 집에서 쉬고 있어&#10;나: 나도 심심해 ㅠㅠ 영화볼까?"
              className="w-full h-32 p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-2xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 placeholder-gray-600 text-gray-800 text-sm"
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-center w-full">
              <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-2xl transition-colors ${
                uploadStatus === 'uploading' 
                  ? 'border-blue-300 bg-blue-50/50 cursor-not-allowed'
                  : uploadStatus === 'success'
                  ? 'border-green-300 bg-green-50/50 cursor-pointer'
                  : uploadStatus === 'error'
                  ? 'border-red-300 bg-red-50/50 cursor-pointer'
                  : 'border-purple-300 bg-white/20 hover:bg-white/30 cursor-pointer'
              }`}>
                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                  {uploadStatus === 'uploading' ? (
                    <div className="w-6 h-6 mb-1 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : uploadStatus === 'success' ? (
                    <span className="text-2xl mb-1">✅</span>
                  ) : uploadStatus === 'error' ? (
                    <span className="text-2xl mb-1">❌</span>
                  ) : (
                    <svg className="w-6 h-6 mb-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )}
                  <p className={`text-xs ${
                    uploadStatus === 'uploading' ? 'text-blue-600' :
                    uploadStatus === 'success' ? 'text-green-600' :
                    uploadStatus === 'error' ? 'text-red-600' :
                    'text-purple-600'
                  }`}>
                    <span className="font-semibold">
                      {uploadStatus === 'uploading' ? '분석 중...' :
                       uploadStatus === 'success' ? '분석 완료!' :
                       uploadStatus === 'error' ? '다시 시도' :
                       '카카오톡 대화내역 업로드'}
                    </span>
                  </p>
                  <p className={`text-xs ${
                    uploadStatus === 'uploading' ? 'text-blue-500' :
                    uploadStatus === 'success' ? 'text-green-500' :
                    uploadStatus === 'error' ? 'text-red-500' :
                    'text-purple-500'
                  }`}>
                    {uploadStatus === 'error' ? '파일을 다시 선택해주세요' : 'TXT 파일 지원'}
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
                      
                      // 파일 크기 및 형식 검증
                      if (file.size > 10 * 1024 * 1024) { // 10MB 제한
                        setUploadError('파일 크기가 너무 큽니다. (10MB 이하)');
                        setUploadStatus('error');
                        return;
                      }
                      
                      if (!file.name.toLowerCase().endsWith('.txt')) {
                        setUploadError('TXT 파일만 업로드 가능합니다.');
                        setUploadStatus('error');
                        return;
                      }
                      
                      handleFileUpload(file);
                    }
                    // 파일 선택 후 input 초기화 (같은 파일 재선택 가능)
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            {/* 업로드 상태 표시 */}
            {uploadStatus === 'uploading' && (
              <div className="text-xs text-blue-600 mt-2 text-center">
                <div className="backdrop-blur-md bg-blue-50/50 rounded-xl p-3 border border-blue-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">파일 분석 중...</span>
                  </div>
                  <div className="flex justify-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            {uploadStatus === 'success' && (
              <div className="mt-2">
                <SuccessMessage message="분석이 완료되었어요! 잠시 후 다음 단계로 이동합니다." />
              </div>
            )}
            {uploadStatus === 'error' && uploadError && (
              <div className="mt-2">
                <ErrorMessage 
                  message={uploadError}
                  onRetry={() => {
                    setUploadStatus('idle');
                    setUploadError('');
                  }}
                />
              </div>
            )}
            {uploadedFile && uploadStatus === 'idle' && (
              <p className="text-xs text-purple-600 mt-2 text-center">
                📁 {uploadedFile.name} 선택됨
              </p>
            )}
          </div>

          <button
            onClick={analyzeSpeech}
            disabled={!speechData.trim() || isAnalyzing || uploadStatus === 'uploading'}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 shadow-lg focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="말투 분석 시작"
          >
            {isAnalyzing || uploadStatus === 'uploading' ? '분석 중...' : '말투 분석하고 다음으로 →'}
          </button>
        </div>
      </div>
    </div>
  );

  // 상대방 정보 입력 화면
  const renderPartnerInfo = () => (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800 mb-2">💕 상대방 정보</h2>
          <p className="text-purple-600 text-sm">더 정확한 답변을 위해 알려줘!</p>
        </div>



        <div className="backdrop-blur-lg bg-white/20 rounded-3xl shadow-2xl border border-white/30 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 (별명)
              </label>
              <input
                type="text"
                value={partnerInfo.name}
                onChange={(e) => setPartnerInfo({...partnerInfo, name: e.target.value})}
                placeholder="예: 민수, 영희, 썸남..."
                className="w-full p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800 placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관계
              </label>
              <select
                value={partnerInfo.relationship}
                onChange={(e) => setPartnerInfo({...partnerInfo, relationship: e.target.value})}
                className="w-full p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800"
              >
                <option value="">선택해주세요</option>
                <option value="썸">썸타는 사이</option>
                <option value="소개팅">소개팅 상대</option>
                <option value="연인">연인</option>
                <option value="친구">친구</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상대방에 대한 상세 설명 ✨ <span className="text-purple-600">(중요!)</span>
              </label>
              <div className="mb-2">
                <div className="text-xs text-purple-600 bg-purple-50 rounded-lg p-2">
                  💡 <strong>더 정확한 답변을 위해 자세히 적어주세요:</strong>
                  <ul className="mt-1 ml-4 list-disc text-xs">
                    <li>성격 (내성적/외향적, 감성적/논리적 등)</li>
                    <li>대화 스타일 (직설적/간접적, 유머/진지함 등)</li>
                    <li>선호하는 활동이나 상황</li>
                    <li>피해야 할 주제나 상황</li>
                  </ul>
                </div>
              </div>
              <textarea
                value={partnerInfo.description}
                onChange={(e) => setPartnerInfo({...partnerInfo, description: e.target.value})}
                placeholder="상대방의 성격, 취향, 대화 스타일 등을 자세히 설명해주세요...&#10;&#10;예시:&#10;- 조용하고 내성적인 편이지만 관심사에 대해서는 열정적으로 얘기함&#10;- 직설적인 표현보다는 돌려서 말하는 스타일&#10;- 영화와 독서를 좋아하고 깊이 있는 대화를 선호함&#10;- 갑작스러운 연락보다는 미리 계획된 만남을 좋아함&#10;- 스트레스 받을 때는 혼자 있는 시간을 선호함"
                className="w-full h-32 p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800 placeholder-gray-600 text-sm resize-none"
              />
              <div className="mt-1 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {partnerInfo.description.length}/500자 (최소 20자 필수)
                </div>
                {partnerInfo.description.length >= 50 && (
                  <div className="text-xs text-green-600 flex items-center">
                    <span className="mr-1">✓</span>
                    상세 설명 완료
                  </div>
                )}
              </div>
              
              {/* 실시간 분석 미리보기 */}
              {partnerInfo.description.length >= 30 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">📊 예상 분석 결과</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    {getPreviewAnalysis(partnerInfo.description).map((insight, index) => (
                      <div key={index} className="flex items-center">
                        <span className="mr-2">•</span>
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관심사/취미
              </label>
              <input
                type="text"
                value={partnerInfo.interests}
                onChange={(e) => setPartnerInfo({...partnerInfo, interests: e.target.value})}
                placeholder="예: 영화, 독서, 운동, 여행, 음악..."
                className="w-full p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800 placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                대화 스타일
              </label>
              <select
                value={partnerInfo.communication_style}
                onChange={(e) => setPartnerInfo({...partnerInfo, communication_style: e.target.value})}
                className="w-full p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800"
              >
                <option value="">선택해주세요</option>
                <option value="직설적">직설적이고 솔직한 편</option>
                <option value="간접적">돌려서 말하는 편</option>
                <option value="유머러스">유머를 좋아함</option>
                <option value="진지함">진지하고 깊이 있는 대화 선호</option>
                <option value="감정적">감정 표현이 풍부함</option>
                <option value="논리적">논리적이고 이성적</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setCurrentScreen('welcome')}
              className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
            >
              ← 이전
            </button>
            <button
              onClick={async () => {
                // 상대방 프로필 저장 및 대화방 생성
                if (user && partnerInfo.name && partnerInfo.description) {
                  try {
                    const profileResult = await apiService.createPartnerProfile({
                      user_id: user.userId,
                      name: partnerInfo.name,
                      relationship: partnerInfo.relationship,
                      description: partnerInfo.description,
                      interests: partnerInfo.interests,
                      communication_style: partnerInfo.communication_style
                    });
                    console.log('Partner profile created:', profileResult);
                    
                    // 대화방 생성
                    const roomResult = await apiService.createChatRoom({
                      user_id: user.userId,
                      partner_name: partnerInfo.name,
                      partner_relationship: partnerInfo.relationship
                    });
                    setCurrentRoomId(roomResult.room.id);
                    
                    // 채팅방 목록 즉시 새로고침
                    setRefreshTrigger(prev => prev + 1);
                  } catch (error) {
                    console.warn('Failed to save partner profile:', error);
                    // 실패해도 대화방은 생성
                    const newRoomId = `room_${Date.now()}_${partnerInfo.name}`;
                    setCurrentRoomId(newRoomId);
                  }
                } else {
                  // 프로필 저장 없이도 대화방 생성
                  try {
                    const roomResult = await apiService.createChatRoom({
                      user_id: user?.userId || 'anonymous',
                      partner_name: partnerInfo.name || 'Unknown',
                      partner_relationship: partnerInfo.relationship || '기타'
                    });
                    setCurrentRoomId(roomResult.room.id);
                    setRefreshTrigger(prev => prev + 1);
                  } catch (error) {
                    console.warn('Failed to create chat room:', error);
                    const newRoomId = `room_${Date.now()}_${partnerInfo.name || 'unknown'}`;
                    setCurrentRoomId(newRoomId);
                  }
                }
                
                setCurrentScreen('chatbot');
                
                // 사용자 대화 히스토리 로드 (메시지에 표시하지 않음)
                if (user) {
                  try {
                    await apiService.getConversationHistory(user.userId, 3);
                  } catch (error) {
                    console.warn('Failed to load conversation history:', error);
                  }
                }
                
                // 상대방 정보 기반 맞춤 메시지
                const partnerContext = partnerInfo.description ? 
                  `\n\n📝 ${partnerInfo.name}님에 대한 정보를 바탕으로 맞춤 답변을 드릴게요!` : '';
                
                setMessages([{
                  id: 1,
                  text: `안녕! 나는 Love Q야 💕\n\n${partnerInfo.name ? `${partnerInfo.name}님과의 ` : ''}대화에서 어떤 상황인지 말해줘!${partnerContext}\n\n예: "영화 보자고 했는데 뭐라고 답할까?"\n"갑자기 연락이 없어서 걱정돼"`,
                  sender: 'bot',
                  timestamp: new Date()
                }]);
              }}
              disabled={!partnerInfo.relationship || !partnerInfo.description.trim() || partnerInfo.description.length < 20}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              채팅 시작! →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 채팅 화면
  const renderChatbot = () => (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="backdrop-blur-lg bg-white/20 border-b border-white/30 p-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-xl">💕</span>
            </div>
            <div>
              <h1 className="font-bold text-purple-800">Love Q</h1>
              <p className="text-xs text-purple-600">개인화 AI 연애 도우미</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-purple-600 hover:text-purple-800 transition-colors rounded-lg hover:bg-white/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* 사용자 메뉴 */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-200 border border-white/30"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {(user?.signInDetails?.loginId || '사용자')[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-purple-800 hidden sm:block">
                  {user?.signInDetails?.loginId || '사용자'}
                </span>
                <svg 
                  className={`w-4 h-4 text-purple-600 transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* 드롭다운 메뉴 */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200/50">
                    <p className="text-sm font-medium text-gray-800">
                      {user?.signInDetails?.loginId || '사용자'}
                    </p>
                    <p className="text-xs text-gray-600">Love Q 사용자</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowProfile(true);
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>프로필 보기</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      signOut();
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'response-option' && message.data ? (
                <div className="w-full max-w-lg">
                  <ResponseCard
                    response={message.data}
                    onSelect={handleResponseSelection}
                    onCopy={handleCopy}
                  />
                </div>
              ) : (
                // 일반 메시지
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'backdrop-blur-md bg-white/40 text-gray-800 border border-white/50'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="backdrop-blur-md bg-white/40 border border-white/50 px-4 py-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-purple-600 font-medium">Love Q가 답변을 생각하고 있어요</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="backdrop-blur-lg bg-white/20 border-t border-white/30 p-4">
        <div className="max-w-2xl mx-auto flex space-x-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="어떤 상황인지 말해주세요..."
            className="flex-1 px-4 py-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800 placeholder-gray-600"
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isTyping}
            className="px-6 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );

  // 화면 렌더링
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex">
      {/* 사이드바 */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:relative lg:translate-x-0 lg:block`}>
        <ChatRoomManager 
          onSelectRoom={handleSelectRoom}
          onNewChat={handleNewChat}
          currentRoomId={currentRoomId}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          refreshTrigger={refreshTrigger}
        />
      </div>
      
      {/* 오버레이 (모바일) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col">
        {currentScreen === 'welcome' && renderWelcome()}
        {currentScreen === 'speech-learning' && renderSpeechLearning()}
        {currentScreen === 'partner-info' && renderPartnerInfo()}
        {currentScreen === 'chatbot' && renderChatbot()}
      </div>
      
      {showProfile && (
        <UserProfile
          onClose={() => setShowProfile(false)}
          onUpdateProfile={(newData) => {
            setSpeechProfile(prev => ({ ...prev, ...newData }));
          }}
          speechProfile={speechProfile}
        />
      )}
    </div>
  );

  // 웰컴 화면
  function renderWelcome() {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between w-full max-w-4xl mb-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-purple-600 hover:text-purple-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-4 ml-auto">
            {/* 사용자 메뉴 */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-200 border border-white/30"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {(user?.signInDetails?.loginId || '사용자')[0].toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-purple-800 hidden sm:block">
                  {user?.signInDetails?.loginId || '사용자'}
                </span>
                <svg 
                  className={`w-4 h-4 text-purple-600 transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* 드롭다운 메뉴 */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200/50">
                    <p className="text-sm font-medium text-gray-800">
                      {user?.signInDetails?.loginId || '사용자'}
                    </p>
                    <p className="text-xs text-gray-600">Love Q 사용자</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowProfile(true);
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>프로필 보기</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      signOut();
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                    </svg>
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 메인 컨텐츠 */}
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">💕</span>
          </div>
          <h1 className="text-3xl font-bold text-purple-800 mb-4">Love Q</h1>
          <p className="text-purple-600 mb-8">
            사이드바에서 대화방을 선택하거나<br/>
            새로운 대화를 시작해보세요!
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleNewChat}
              className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
            >
              ✨ 새 대화 시작하기
            </button>
            
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-full py-3 bg-white/60 text-purple-700 rounded-xl hover:bg-white/80 transition-colors font-medium border border-purple-200 lg:hidden"
            >
              💬 대화방 보기
            </button>
            
            <p className="text-xs text-purple-600 text-center">
              말투 분석은 프로필에서 설정할 수 있어요 😊
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default function Home() {
  return (
    <AuthProvider>
      <AuthWrapper>
        <HomeContent />
      </AuthWrapper>
    </AuthProvider>
  );
}
