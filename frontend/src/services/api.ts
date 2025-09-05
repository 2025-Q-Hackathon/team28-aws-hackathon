import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api-gateway-url.amazonaws.com/dev';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SpeechAnalysisRequest {
  messages: string[];
}

export interface SpeechAnalysisResponse {
  formal_ratio: number;
  emoji_ratio: number;
  avg_length: number;
  total_messages: number;
  tone: string;
  speech_style: string;
}

export interface ChatAnalysisRequest {
  context: string;
  situation: string;
  user_style: {
    formal_ratio: number;
    emoji_ratio: number;
    avg_length: number;
  };
  partner_info?: {
    name: string;
    age: string;
    relationship: string;
    personality: string;
  };
}

export interface ResponseOption {
  type: string;
  message: string;
  explanation: string;
  risk_level: number;
  confidence: number;
}

export interface ChatAnalysisResponse {
  responses: ResponseOption[];
}

export const apiService = {
  // 말투 분석
  analyzeSpeech: async (data: SpeechAnalysisRequest): Promise<SpeechAnalysisResponse> => {
    try {
      const response = await api.post('/analyze-speech', data);
      return response.data;
    } catch (error) {
      console.error('Speech analysis error:', error);
      // 임시 목업 데이터 반환
      return {
        formal_ratio: 0.3,
        emoji_ratio: 0.4,
        avg_length: 25.5,
        total_messages: data.messages.length,
        tone: 'positive',
        speech_style: 'casual_friendly'
      };
    }
  },

  // 답변 생성
  generateResponses: async (data: ChatAnalysisRequest): Promise<ChatAnalysisResponse> => {
    try {
      const response = await api.post('/analyze', data);
      return response.data;
    } catch (error) {
      console.error('Response generation error:', error);
      // 임시 목업 데이터 반환
      return {
        responses: [
          {
            type: '안전형',
            message: '그렇구나! 재밌겠다 😊',
            explanation: '무난하고 안전한 반응으로 부담을 주지 않습니다.',
            risk_level: 1,
            confidence: 0.9
          },
          {
            type: '표준형',
            message: '오 좋은데? 나도 관심있어!',
            explanation: '적당한 관심을 표현하며 대화를 이어갑니다.',
            risk_level: 2,
            confidence: 0.8
          },
          {
            type: '대담형',
            message: '완전 좋아! 같이 해볼까? 😍',
            explanation: '적극적인 호감을 드러내며 함께하고 싶다는 의사를 표현합니다.',
            risk_level: 4,
            confidence: 0.7
          }
        ]
      };
    }
  },

  // 파일 업로드
  uploadFile: async (fileContent: string, fileName: string) => {
    try {
      const response = await api.post('/upload', {
        file_content: btoa(fileContent), // base64 인코딩
        file_name: fileName
      });
      return response.data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
};
