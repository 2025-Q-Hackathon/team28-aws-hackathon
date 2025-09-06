'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiService, ResponseOption } from '../services/api';

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
}

interface PartnerInfo {
  name: string;
  age: string;
  relationship: string;
  personality: string;
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState('speech-learning');
  const [speechData, setSpeechData] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [speechProfile, setSpeechProfile] = useState<SpeechProfile | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo>({
    name: '',
    age: '',
    relationship: '',
    personality: ''
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // 파일 업로드 처리
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setIsAnalyzing(true);
    try {
      const fileContent = await file.text();
      const result = await apiService.processFile({
        file_content: fileContent,
        file_type: file.name.endsWith('.txt') ? 'txt' : 'kakao'
      });
      
      setSpeechProfile(result.analysis);
      setCurrentScreen('partner-info');
    } catch (error) {
      console.error('File processing failed:', error);
      alert('파일 처리 중 오류가 발생했습니다.');
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

  // 답변 생성 함수
  const generateResponses = async (userMessage: string) => {
    if (!speechProfile) return;

    setIsTyping(true);
    try {
      const result = await apiService.generateResponses({
        context: messages.map(m => m.text).join('\n'),
        situation: userMessage,
        user_style: {
          formal_ratio: speechProfile.formal_ratio,
          emoji_ratio: speechProfile.emoji_ratio,
          avg_length: speechProfile.avg_length
        },
        partner_info: partnerInfo
      });

      // 답변 옵션들을 메시지로 추가
      result.responses.forEach((response, index) => {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + index,
            text: '',
            sender: 'bot',
            timestamp: new Date(),
            type: 'response-option',
            data: response
          }]);
        }, index * 1000);
      });
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

  // 말투 학습 화면
  const renderSpeechLearning = () => (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4 flex flex-col">
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
              <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-purple-300 border-dashed rounded-2xl cursor-pointer bg-white/20 hover:bg-white/30 transition-colors">
                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                  <svg className="w-6 h-6 mb-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xs text-purple-600">
                    <span className="font-semibold">카카오톡 대화내역 업로드</span>
                  </p>
                  <p className="text-xs text-purple-500">TXT 파일 지원</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedFile(file);
                      handleFileUpload(file);
                    }
                  }}
                />
              </label>
            </div>
            {uploadedFile && (
              <p className="text-xs text-purple-600 mt-2 text-center">
                📁 {uploadedFile.name} 업로드됨
              </p>
            )}
          </div>

          <button
            onClick={analyzeSpeech}
            disabled={!speechData.trim() || isAnalyzing}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 shadow-lg"
          >
            {isAnalyzing ? '분석 중...' : '말투 분석하고 다음으로 →'}
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

        {speechProfile && (
          <div className="backdrop-blur-lg bg-white/20 rounded-2xl p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">📊 분석 결과</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• 존댓말 비율: {Math.round(speechProfile.formal_ratio * 100)}%</p>
              <p>• 이모티콘 사용: {speechProfile.emoji_ratio.toFixed(1)}개/메시지</p>
              <p>• 평균 메시지 길이: {Math.round(speechProfile.avg_length)}자</p>
              <p>• 말투 스타일: {speechProfile.speech_style}</p>
            </div>
          </div>
        )}

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
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setCurrentScreen('speech-learning')}
              className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
            >
              ← 이전
            </button>
            <button
              onClick={() => {
                setCurrentScreen('chatbot');
                setMessages([{
                  id: 1,
                  text: `안녕! 나는 Love Q야 💕\n\n${partnerInfo.name ? `${partnerInfo.name}님과의 ` : ''}대화에서 어떤 상황인지 말해줘!\n\n예: "영화 보자고 했는데 뭐라고 답할까?"\n"갑자기 연락이 없어서 걱정돼"`,
                  sender: 'bot',
                  timestamp: new Date()
                }]);
              }}
              disabled={!partnerInfo.relationship}
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col">
      {/* 헤더 */}
      <div className="backdrop-blur-lg bg-white/20 border-b border-white/30 p-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-xl">💕</span>
            </div>
            <div>
              <h1 className="font-bold text-purple-800">Love Q</h1>
              <p className="text-xs text-purple-600">연애 답변 도우미</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentScreen('partner-info')}
            className="text-purple-600 hover:text-purple-800 text-sm"
          >
            설정 변경
          </button>
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
                // 응답 옵션 카드 형태로 표시
                <div className="w-full max-w-lg">
                  <div className="backdrop-blur-md bg-white/40 border border-white/50 rounded-2xl p-4 mb-2">
                    {/* 타입 헤더 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{message.data.emoji || getTypeEmoji(message.data.type)}</span>
                        <span className="font-bold text-gray-800">{message.data.type}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${getRiskColor(message.data.risk_level)}`}>
                          위험도 {message.data.risk_level}/5
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          신뢰도 {Math.round(message.data.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* 답변 내용 */}
                    <div className="bg-white/60 rounded-xl p-3 mb-3">
                      <p className="text-gray-800 font-medium">"{message.data.message}"</p>
                    </div>
                    
                    {/* 설명 */}
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">💡 선택 이유:</span>
                      <p className="mt-1">{message.data.explanation}</p>
                    </div>
                    
                    {/* 복사 버튼 */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(message.data.message);
                        alert('답변이 복사되었습니다!');
                      }}
                      className="mt-3 w-full py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      📋 답변 복사하기
                    </button>
                  </div>
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
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
  switch (currentScreen) {
    case 'speech-learning':
      return renderSpeechLearning();
    case 'partner-info':
      return renderPartnerInfo();
    case 'chatbot':
      return renderChatbot();
    default:
      return renderSpeechLearning();
  }
}
