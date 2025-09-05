'use client';

import { useState, useEffect, useRef } from 'react';

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
  formality_ratio: number;
  emoji_ratio: number;
  avg_message_length: number;
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
  const [currentScreen, setCurrentScreen] = useState('speech-learning'); // speech-learning, partner-info, chatbot
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              또는 파일 업로드
            </label>
            <div className="border-2 border-dashed border-purple-300 rounded-2xl p-4 text-center hover:border-purple-400 transition-colors cursor-pointer">
              <input type="file" accept=".txt" className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-2xl mb-2 block">📄</span>
                <span className="text-sm text-gray-600">txt 파일을 선택하세요</span>
              </label>
            </div>
          </div>

          <button
            onClick={() => {
              if (!speechData.trim()) {
                alert('대화 내용을 입력해주세요!');
                return;
              }
              // 말투 분석 시뮬레이션
              const mockProfile: SpeechProfile = {
                total_messages: 15,
                formality_ratio: 0.3,
                emoji_ratio: 0.4,
                avg_message_length: 25.5,
                tone: 'positive',
                speech_style: 'casual_friendly'
              };
              setSpeechProfile(mockProfile);
              setCurrentScreen('partner-info');
            }}
            disabled={!speechData.trim()}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 shadow-lg"
          >
            말투 분석하고 다음으로 →
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
                나이대
              </label>
              <select
                value={partnerInfo.age}
                onChange={(e) => setPartnerInfo({...partnerInfo, age: e.target.value})}
                className="w-full p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800"
              >
                <option value="">선택해주세요</option>
                <option value="10대">10대</option>
                <option value="20대 초반">20대 초반</option>
                <option value="20대 후반">20대 후반</option>
                <option value="30대">30대</option>
                <option value="40대 이상">40대 이상</option>
              </select>
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
                <option value="직장동료">직장동료</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성격 (선택사항)
              </label>
              <input
                type="text"
                value={partnerInfo.personality}
                onChange={(e) => setPartnerInfo({...partnerInfo, personality: e.target.value})}
                placeholder="예: 활발함, 내향적, 유머러스..."
                className="w-full p-3 backdrop-blur-md bg-white/30 border border-white/40 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800 placeholder-gray-600"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => setCurrentScreen('speech-learning')}
              className="flex-1 px-4 py-3 backdrop-blur-md bg-white/30 text-gray-700 rounded-xl hover:bg-white/40 font-medium transition-all duration-300 border border-white/40"
            >
              ← 이전
            </button>
            <button
              onClick={() => {
                if (!partnerInfo.name || !partnerInfo.age || !partnerInfo.relationship) {
                  alert('필수 정보를 모두 입력해주세요!');
                  return;
                }
                setCurrentScreen('chatbot');
                // 챗봇 초기 메시지
                setTimeout(() => {
                  addBotMessage(`안녕! 나는 Love Q야\n${partnerInfo.name}님과의 대화를 도와줄게!`);
                }, 500);
                setTimeout(() => {
                  addBotMessage(`${partnerInfo.name}님이 뭐라고 했어? 대화 내용을 알려줘!`);
                }, 1500);
              }}
              disabled={!partnerInfo.name || !partnerInfo.age || !partnerInfo.relationship}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 shadow-lg"
            >
              시작하기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 챗봇 화면
  const addBotMessage = (text: string, type?: string, data?: any) => {
    setIsTyping(true);
    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now(),
        text,
        sender: 'bot',
        timestamp: new Date(),
        type: type as any,
        data
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    addUserMessage(inputText);
    
    addBotMessage(`${partnerInfo.name}님과의 대화를 분석해볼게!`);
    
    setTimeout(() => {
      addBotMessage("어떤 상황에서 답변이 필요해?", 'situation-select');
    }, 2000);
    
    setInputText('');
  };

  const handleSituationSelect = (situation: string, customText?: string) => {
    const situationNames: { [key: string]: string } = {
      'general': '일반 대화',
      'greeting': '안부 인사',
      'date_proposal': '데이트 제안',
      'rejection': '거절 표현',
      'concern': '서운함 표현'
    };
    
    const selectedSituation = situation === 'custom' ? customText! : situationNames[situation];
    
    addUserMessage(selectedSituation);
    addBotMessage(`${selectedSituation} 상황이구나! ${partnerInfo.name}님에게 딱 맞는 답변을 만들어줄게`);
    
    setTimeout(() => {
      const responses = [
        {
          type: 'safe',
          text: '네, 알겠습니다! 좋은 하루 보내세요 😊',
          score: 7,
          explanation: '정중하고 안전한 답변으로 부담을 주지 않아요'
        },
        {
          type: 'standard',
          text: '아 그래요? 재밌겠네요! 저도 관심 있어요 ㅎㅎ',
          score: 8,
          explanation: '적당한 관심과 긍정적인 반응을 보여주는 답변이에요'
        },
        {
          type: 'bold',
          text: '우와 대박! 저도 꼭 같이 해보고 싶어요!! 언제 시간 되세요? 😍',
          score: 6,
          explanation: '적극적이고 대담한 답변으로 강한 관심을 표현해요'
        }
      ];
      
      addBotMessage(`${partnerInfo.name}님을 위한 3가지 답변!`, 'response-options', responses);
    }, 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addBotMessage("복사 완료! 이제 자신있게 보내봐");
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-300';
      case 'standard': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'bold': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'safe': return '안전형';
      case 'standard': return '표준형';
      case 'bold': return '대담형';
      default: return type;
    }
  };

  const renderChatbot = () => (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="backdrop-blur-lg bg-white/80 border-b border-white/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mr-3 flex items-center justify-center">
              <span className="text-white text-sm">💕</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-purple-800">Love Q</h1>
              <p className="text-xs text-purple-600">온라인</p>
            </div>
          </div>
          <button
            onClick={() => {
              setCurrentScreen('partner-info');
              setMessages([]);
            }}
            className="text-xs text-purple-600 hover:text-purple-800"
          >
            설정 변경
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
              message.sender === 'user' 
                ? 'bg-purple-500 text-white' 
                : 'backdrop-blur-md bg-white/70 text-gray-800 border border-white/40'
            }`}>
              <p className="whitespace-pre-line text-sm">{message.text}</p>
              
              {/* 상황 선택 버튼들 */}
              {message.type === 'situation-select' && (
                <div className="space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'general', label: '일반 대화', emoji: '💬' },
                      { value: 'greeting', label: '안부 인사', emoji: '👋' },
                      { value: 'date_proposal', label: '데이트 제안', emoji: '💕' },
                      { value: 'rejection', label: '거절 표현', emoji: '🙏' },
                      { value: 'concern', label: '서운함 표현', emoji: '😔' }
                    ].map((situation) => (
                      <button
                        key={situation.value}
                        onClick={() => handleSituationSelect(situation.value)}
                        className="p-2 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl transition-colors border border-purple-200"
                      >
                        {situation.emoji} {situation.label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/30 pt-3">
                    <p className="text-xs text-gray-600 mb-2">또는 직접 상황을 설명해주세요:</p>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="예: 갑자기 연락이 안 되는 상황..."
                        className="flex-1 px-3 py-2 bg-white/50 border border-white/60 rounded-lg text-xs focus:ring-1 focus:ring-purple-400 text-gray-800 placeholder-gray-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              handleSituationSelect('custom', input.value.trim());
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input.value.trim()) {
                            handleSituationSelect('custom', input.value.trim());
                            input.value = '';
                          }
                        }}
                        className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-xs transition-colors"
                      >
                        선택
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 답변 옵션들 */}
              {message.type === 'response-options' && message.data && (
                <div className="space-y-3 mt-3">
                  {message.data.map((response: any, index: number) => (
                    <div key={index} className="bg-white/50 rounded-xl p-3 border border-white/60">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(response.type)}`}>
                          {getTypeName(response.type)}
                        </span>
                        <span className="text-xs text-purple-600 font-medium">{response.score}/10</span>
                      </div>
                      <p className="text-sm text-gray-800 mb-2">{response.text}</p>
                      <p className="text-xs text-gray-600 mb-2">💡 {response.explanation}</p>
                      <button 
                        onClick={() => copyToClipboard(response.text)}
                        className="w-full px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-xs transition-colors"
                      >
                        복사하기
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {/* 타이핑 인디케이터 */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="backdrop-blur-md bg-white/70 text-gray-800 border border-white/40 px-4 py-2 rounded-2xl">
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

      {/* Input */}
      <div className="backdrop-blur-lg bg-white/80 border-t border-white/30 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`${partnerInfo.name}님이 뭐라고 했나요?`}
            className="flex-1 px-4 py-2 backdrop-blur-md bg-white/50 border border-white/40 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-400 text-gray-800 placeholder-gray-600"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="px-6 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );

  // 화면 렌더링
  if (currentScreen === 'speech-learning') {
    return renderSpeechLearning();
  } else if (currentScreen === 'partner-info') {
    return renderPartnerInfo();
  } else {
    return renderChatbot();
  }
}
