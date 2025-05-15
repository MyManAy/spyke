// File: src/app/chat/[id]/page.js
"use client";
import { useRouter, useParams } from 'next/navigation';
import ChatRoom from '../../../components/ChatRoom';

export default function ChatRoomPage() {
  const { id: roomId } = useParams();
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-gray-100 border-b flex items-center">
        <button onClick={() => router.back()} className="text-blue-500 mr-4">
          Back
        </button>
        <h2 className="text-xl">Chat</h2>
      </header>
      <div className="flex-1">
        <ChatRoom roomId={roomId} />
      </div>
    </div>
  );
}
