'use client';

import { useState } from 'react';

interface ResponseCardProps {
  response: {
    type: string;
    message: string;
    explanation: string;
    risk_level: number;
    confidence: number;
    emoji?: string;
    advice?: string;
  };
  onSelect: (response: any) => void;
  onCopy: (text: string) => void;
}

export default function ResponseCard({ response, onSelect, onCopy }: ResponseCardProps) {
  const [isSelected, setIsSelected] = useState(false);

  const getRiskColor = (riskLevel: number) => {
    if (riskLevel <= 2) return 'text-green-600 bg-green-50';
    if (riskLevel <= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleSelect = () => {
    setIsSelected(true);
    onSelect(response);
  };

  if (isSelected) {
    return (
      <div className="backdrop-blur-md bg-green-50/80 border border-green-200 rounded-xl p-3 mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-green-600">✅</span>
          <span className="text-sm font-medium text-green-800">선택된 답변</span>
        </div>
        <p className="text-sm text-green-700 mt-1">"{response.message}"</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/60 border border-white/50 rounded-xl p-3 mb-2 hover:bg-white/70 transition-all">
      {/* 헤더 */}
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{response.emoji || '💬'}</span>
        <span className="font-medium text-gray-800 text-sm">{response.type}</span>
      </div>
      
      {/* 복사할 메시지 */}
      <div className="bg-white/80 rounded-lg p-2 mb-2">
        <p className="text-gray-800 text-sm font-medium">"{response.message}"</p>
      </div>
      
      {/* 사용 조언 */}
      <p className="text-xs text-gray-600 mb-3">{response.advice || response.explanation}</p>
      
      {/* 액션 버튼 */}
      <div className="flex space-x-2">
        <button
          onClick={() => onCopy(response.message)}
          className="flex-1 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-medium transition-colors"
        >
          📋 복사
        </button>
        <button
          onClick={handleSelect}
          className="flex-1 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
        >
          ✅ 선택
        </button>
      </div>
    </div>
  );
}