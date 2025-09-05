'use client';

import { useState, useEffect, useRef } from 'react';
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
            text: `**${response.type}** (위험도: ${response.risk_level}/5, 신뢰도: ${Math.round(response.confidence * 100)}%)\n\n"${response.message}"\n\n💡 ${response.explanation}`,
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
              className="w-full h-40 p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-2xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 placeholder-gray-600 text-gray-800 text-sm"
            />
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
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'backdrop-blur-md bg-white/40 text-gray-800 border border-white/50'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
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
