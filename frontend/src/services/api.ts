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
    const response = await api.post('/analyze-speech', data);
    return response.data;
  },

  // 답변 생성
  generateResponses: async (data: ChatAnalysisRequest): Promise<ChatAnalysisResponse> => {
    const response = await api.post('/analyze', data);
    return response.data;
  },

  // 파일 업로드
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
