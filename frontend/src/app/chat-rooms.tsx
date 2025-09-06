'use client';

import ChatRoomManager from '../components/ChatRoomManager';

interface ChatRoomsProps {
  handleSelectRoom: (roomId: string, partnerInfo: any) => void;
  handleNewChat: () => void;
  currentRoomId?: string;
  setShowProfile: (show: boolean) => void;
}

// 채팅방 관리 화면
export default function ChatRooms({ handleSelectRoom, handleNewChat, currentRoomId, setShowProfile }: ChatRoomsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex">
      <ChatRoomManager 
        onSelectRoom={handleSelectRoom}
        onNewChat={handleNewChat}
        currentRoomId={currentRoomId}
      />
      
      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-3xl">💕</span>
          </div>
          <h1 className="text-3xl font-bold text-purple-800 mb-4">Love Q</h1>
          <p className="text-purple-600 mb-8">
            왼쪽에서 대화방을 선택하거나<br/>
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
              onClick={() => setShowProfile(true)}
              className="w-full py-3 bg-white/60 text-purple-700 rounded-xl hover:bg-white/80 transition-colors font-medium border border-purple-200"
            >
              👤 내 프로필 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}