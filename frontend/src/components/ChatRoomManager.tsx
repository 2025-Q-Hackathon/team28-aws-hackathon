'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiService } from '../services/api';

interface ChatRoom {
  id: string;
  name: string;
  partner_name: string;
  partner_relationship: string;
  last_message: string;
  updated_at: string;
  message_count: number;
}

interface ChatRoomManagerProps {
  onSelectRoom: (roomId: string, partnerInfo: any) => void;
  onNewChat: () => void;
  currentRoomId?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  refreshTrigger?: number;
}

export default function ChatRoomManager({ onSelectRoom, onNewChat, currentRoomId, collapsed = false, onToggleCollapse, refreshTrigger }: ChatRoomManagerProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadChatRooms();
    } else {
      setRooms([]);
      setIsLoading(false);
    }
  }, [user, refreshTrigger]);

  const loadChatRooms = async () => {
    try {
      if (user) {
        console.log('Loading chat rooms for user:', user.userId);
        const response = await apiService.getChatRooms(user.userId);
        console.log('Chat rooms response:', response);
        
        // 새로 생성된 채팅방이 있는지 확인
        const existingRooms = response.rooms || [];
        setRooms(existingRooms);
      }
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
      // API 오류 시 빈 배열로 설정
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '오늘';
    if (diffDays === 2) return '어제';
    if (diffDays <= 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getRelationshipEmoji = (relationship: string) => {
    switch (relationship) {
      case '썸': return '💕';
      case '연인': return '❤️';
      case '소개팅': return '✨';
      case '친구': return '👫';
      default: return '💬';
    }
  };

  if (isLoading) {
    return (
      <div className="w-80 bg-white/20 backdrop-blur-lg border-r border-white/30 p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/30 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${collapsed ? 'w-16' : 'w-80'} bg-white/20 backdrop-blur-lg border-r border-white/30 flex flex-col transition-all duration-300`}>
      {/* 헤더 */}
      <div className="p-4 border-b border-white/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {!collapsed && (
              <button
                onClick={onNewChat}
                className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors"
                title="새 대화 시작"
              >
                +
              </button>
            )}
            {!collapsed && <h2 className="font-bold text-purple-800">대화방</h2>}
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              title={collapsed ? '사이드바 확장' : '사이드바 축소'}
            >
              <svg className={`w-4 h-4 text-gray-600 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 채팅방 목록 */}
      <div className="flex-1 overflow-y-auto p-2">
        {collapsed ? (
          // 축소된 상태: 아이콘만 표시
          <div className="space-y-2">
            <button
              onClick={onNewChat}
              className="w-full h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-700 transition-colors"
              title="새 대화 시작"
            >
              +
            </button>
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id, {
                  name: room.partner_name,
                  relationship: room.partner_relationship
                })}
                className={`w-full h-12 rounded-xl cursor-pointer transition-all flex items-center justify-center ${
                  currentRoomId === room.id
                    ? 'bg-purple-100 border border-purple-300'
                    : 'bg-white/40 hover:bg-white/60 border border-white/50'
                }`}
                title={room.name}
              >
                <span className="text-lg">{getRelationshipEmoji(room.partner_relationship)}</span>
              </div>
            ))}
          </div>
        ) : (
          // 확장된 상태: 전체 정보 표시
          rooms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-sm mb-3">아직 대화방이 없어요</p>
              <button
                onClick={onNewChat}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-colors"
              >
                첫 대화 시작하기
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room.id, {
                    name: room.partner_name,
                    relationship: room.partner_relationship
                  })}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    currentRoomId === room.id
                      ? 'bg-purple-100 border border-purple-300'
                      : 'bg-white/40 hover:bg-white/60 border border-white/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getRelationshipEmoji(room.partner_relationship)}</span>
                      <span className="font-medium text-gray-800 text-sm">{room.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(room.updated_at)}</span>
                  </div>
                  
                  <p className="text-xs text-gray-600 truncate mb-1">{room.last_message}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600">{room.partner_relationship}</span>
                    <span className="text-xs text-gray-500">{room.message_count}개 메시지</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}