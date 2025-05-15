// File: src/app/chat/[id]/page.js
"use client";
import { useRouter, useParams } from 'next/navigation';
import ChatRoom from '../../../components/ChatRoom';
import { useCallback } from 'react';
import { useEffect } from 'react';

export default function ChatRoomPage() {
    const { id: roomId } = useParams();
    const router = useRouter();

    if (!roomId) {
        router.push('/');
        return null;
    }

    useEffect(() => {
        // simple mobile check
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
        if (isMobile && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(console.error);
        }
      }, []);

    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        } else {
        document.exitFullscreen();
        }
    }, []);

    return (
        <div className="flex flex-col h-screen">
        <header className="p-4 bg-gray-100 border-b flex items-center">
            <button onClick={() => router.push('/')} className="text-blue-500 mr-4">
            ←
            </button>
            <h2 className="text-xl">Chat</h2>

            <div className="align-items-center ml-auto">
                <button
                    onClick={toggleFullScreen}
                    className="px-2 py-1 text-sm rounded hover:bg-gray-200"
                    aria-label="Toggle Full Screen"
                >
                    ⛶
                </button>
            </div>
        </header>
        <div className="flex-1">
            <ChatRoom roomId={roomId} />
        </div>
        </div>
    );
}
