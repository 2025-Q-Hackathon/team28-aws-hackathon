import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xptl7wpush.execute-api.us-east-1.amazonaws.com/dev';

// JWT 토큰을 포함한 API 클라이언트 생성
const createAuthenticatedClient = async () => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
  } catch (error) {
    console.warn('No auth session found, using unauthenticated client');
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

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
    age?: string;
    relationship: string;
    personality?: string;
    description: string;
    interests?: string;
    communication_style?: string;
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
    const client = await createAuthenticatedClient();
    const response = await client.post('/analyze-speech', data);
    return response.data;
  },

  // 답변 생성
  generateResponses: async (data: ChatAnalysisRequest): Promise<ChatAnalysisResponse> => {
    const client = await createAuthenticatedClient();
    const response = await client.post('/analyze', data);
    return response.data;
  },

  // 파일 처리
  processFile: async (data: FileProcessRequest): Promise<FileProcessResponse> => {
    const client = await createAuthenticatedClient();
    const response = await client.post('/process-file', data);
    return response.data;
  },

  // v2.0 새로운 API 메서드들
  getUserProfile: async (userId: string) => {
    const client = await createAuthenticatedClient();
    const response = await client.get(`/user-profile?user_id=${userId}`);
    return response.data;
  },

  saveConversation: async (data: {
    user_id: string;
    user_message: string;
    ai_responses: ResponseOption[];
    selected_response_type?: string;
    selected_response?: string;
    partner_name?: string;
    partner_relationship?: string;
  }) => {
    const client = await createAuthenticatedClient();
    const response = await client.post('/conversation-history', data);
    return response.data;
  },

  getConversationHistory: async (userId: string, limit = 20, offset = 0) => {
    const client = await createAuthenticatedClient();
    const response = await client.get(`/conversation-history?user_id=${userId}&limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // 상대방 프로필 관리
  createPartnerProfile: async (data: {
    user_id: string;
    name: string;
    relationship: string;
    description: string;
    interests?: string;
    communication_style?: string;
  }) => {
    const client = await createAuthenticatedClient();
    const response = await client.post('/partner-profile', data);
    return response.data;
  },

  getPartnerProfiles: async (userId: string) => {
    const client = await createAuthenticatedClient();
    const response = await client.get(`/partner-profile?user_id=${userId}`);
    return response.data;
  },

  updatePartnerProfile: async (data: {
    profile_id: string;
    name?: string;
    relationship?: string;
    description?: string;
    interests?: string;
    communication_style?: string;
  }) => {
    const client = await createAuthenticatedClient();
    const response = await client.put('/partner-profile', data);
    return response.data;
  },

  deletePartnerProfile: async (profileId: string) => {
    const client = await createAuthenticatedClient();
    const response = await client.delete('/partner-profile', {
      data: { profile_id: profileId }
    });
    return response.data;
  },

  // 대화방 관리
  getChatRooms: async (userId: string) => {
    const client = await createAuthenticatedClient();
    const response = await client.get(`/chat-rooms?user_id=${userId}`);
    return response.data;
  },

  createChatRoom: async (data: {
    user_id: string;
    partner_name: string;
    partner_relationship: string;
  }) => {
    const client = await createAuthenticatedClient();
    const response = await client.post('/chat-rooms', data);
    return response.data;
  },

  updateChatRoom: async (data: {
    room_id: string;
    last_message?: string;
    message_count?: number;
  }) => {
    const client = await createAuthenticatedClient();
    const response = await client.put('/chat-rooms', data);
    return response.data;
  },

  deleteChatRoom: async (roomId: string) => {
    const client = await createAuthenticatedClient();
    const response = await client.delete('/chat-rooms', {
      data: { room_id: roomId }
    });
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
