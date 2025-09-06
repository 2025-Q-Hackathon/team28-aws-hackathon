import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xptl7wpush.execute-api.us-east-1.amazonaws.com/dev';

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
  personality_traits: string[];
  response_examples: string[];
}

export interface ChatAnalysisRequest {
  context: string;
  situation: string;
  user_style: SpeechAnalysisResponse;
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

export interface FileProcessRequest {
  file_content: string;
  file_type: string;
}

export interface FileProcessResponse {
  messages_count: number;
  analysis: SpeechAnalysisResponse;
  sample_messages: string[];
}

export const apiService = {
  // 말투 분석
  analyzeSpeech: async (data: SpeechAnalysisRequest): Promise<SpeechAnalysisResponse> => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      // 모킹 데이터 반환
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5초 지연
      return {
        formal_ratio: 0.3,
        emoji_ratio: 0.4,
        avg_length: 25,
        total_messages: data.messages.length,
        tone: '친근함',
        speech_style: '캐주얼',
        personality_traits: ['활발함', '친근함', '솔직함'],
        response_examples: [
          '오 좋아! 언제 할까?',
          'ㅋㅋㅋ 그러게~ 나도 그렇게 생각해',
          '아 진짜? 대박이네 ㅎㅎ',
          '음... 그건 좀 어려울 것 같은데?',
          '고마워! 너 정말 최고야 😊'
        ]
      };
    }
    const response = await api.post('/analyze-speech', data);
    return response.data;
  },

  // 답변 생성
  generateResponses: async (data: ChatAnalysisRequest): Promise<ChatAnalysisResponse> => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 지연
      return {
        responses: [
          {
            type: "안전형",
            message: "그렇구나! 재밌겠다 😊",
            explanation: "무난하고 안전한 반응으로 부담을 주지 않습니다.",
            risk_level: 1,
            confidence: 0.9
          },
          {
            type: "균형형",
            message: "오 좋은데? 나도 관심있어!",
            explanation: "적당한 관심을 표현하며 대화를 이어갑니다.",
            risk_level: 2,
            confidence: 0.8
          },
          {
            type: "적극형",
            message: "완전 좋아! 같이 해볼까? 😍",
            explanation: "적극적인 호감을 드러내며 함께하고 싶다는 의사를 표현합니다.",
            risk_level: 4,
            confidence: 0.7
          }
        ]
      };
    }
    const response = await api.post('/analyze', data);
    return response.data;
  },

  // 파일 처리
  processFile: async (data: FileProcessRequest): Promise<FileProcessResponse> => {
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        messages_count: 50,
        analysis: {
          formal_ratio: 0.2,
          emoji_ratio: 0.6,
          avg_length: 30,
          total_messages: 50,
          tone: '활발함',
          speech_style: '친근한 말투'
        },
        sample_messages: ['안녕!', '오늘 뭐해?', '나도 심심해 ㅠㅠ']
      };
    }
    const response = await api.post('/process-file', data);
    return response.data;
  },

  // 파일 업로드 (기존)
  uploadFile: async (fileContent: string, fileName: string) => {
    try {
      const response = await api.post('/upload', {
        file_content: btoa(fileContent),
        file_name: fileName
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
