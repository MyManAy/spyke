// File: src/app/page.js
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import ChatList from '../components/ChatList';
import { Analytics } from "@vercel/analytics/next"

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  
  useEffect(() => {
    // simple mobile check
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isMobile && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(console.error);
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);

      if (session) {
        fetchChatRooms(session.user.id);
      }
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        fetchChatRooms(session.user.id);
      } else {
        setChatRooms([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchChatRooms = async (userId) => {
    const { data, error } = await supabase
      .from('chat_members')
      .select('room_id, chat_rooms(id, title, is_group)')
      .eq('member_id', userId);

    if (error) {
      console.error('Error fetching chat rooms:', error);
    } else {
      setChatRooms(
        data.map(item => ({
          id: item.chat_rooms.id,
          title: item.chat_rooms.title || 'Chat',
          isGroup: item.chat_rooms.is_group,
        }))
      );
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Analytics />
        <h1 className="text-2xl">Welcome to Spyke Chat</h1>
        <div className="space-x-4">
          <Link href="/login">
            <button className="px-4 py-2 bg-blue-500 text-white rounded">Login</button>
          </Link>
          <Link href="/signup">
            <button className="px-4 py-2 bg-green-500 text-white rounded">Sign Up</button>
          </Link>
        </div>
      </div>
    );
  }

  if (session && chatRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h1 className="text-xl">You have no chats yet</h1>
        <Link href="/new">
          <button className="px-4 py-2 bg-blue-500 text-white rounded">Start a New Chat</button>
        </Link>
        <button onClick={handleLogout} className="mt-4 text-sm text-gray-500">Logout</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-gray-100 flex justify-between items-center">
        <h1 className="text-2xl">Your Chats</h1>
        <div className="space-x-4">
          <Link href="/new">
            <button className="px-3 py-1 bg-blue-500 text-white rounded">New Chat</button>
          </Link>
          <button onClick={handleLogout} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
        </div>
      </header>
      <main className="p-4 overflow-y-auto">
        <ChatList rooms={chatRooms} />
      </main>
    </div>
  );
}
