// File: src/components/ChatRoom.js
"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import MessageInput from './MessageInput';

export default function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const bottomRef = useRef(null);

  // Get current user ID once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (!roomId) return;

    // Helper to process and scroll
    const processMessages = (data) => {
      setMessages(data);
      scrollToBottom();
    };

    // Fetch existing messages with sender profile
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(
          `id, content, sender_id, sent_at, sender:profiles(display_name)`
        )
        .eq('room_id', roomId)
        .order('sent_at', { ascending: true });
      if (!error) processMessages(data.map(m => ({
        ...m,
        sender_name: m.sender.display_name
      })));
    };
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}`
      }, async ({ new: newMessage }) => {
        // fetch sender name
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', newMessage.sender_id)
          .single();
        const msgWithName = {
          ...newMessage,
          sender_name: profileData?.display_name || 'Unknown'
        };
        setMessages(prev => [...prev, msgWithName]);
        scrollToBottom();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [roomId, refresh]);

  const scrollToBottom = () => {
    // bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (content) => {
    if (!currentUserId) return;
    await supabase.from('messages').insert({ room_id: roomId, sender_id: currentUserId, content });
    setRefresh(prev => prev + 1);
  };

    // constantly add 1 to refresh every second
    useEffect(() => {
        const interval = setInterval(() => {
        setRefresh(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto p-4">
        {messages.map(msg => {
          const isOwn = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* if previous message has matching sender, don't show sender name */}
                    {msg.sender_name && msg.sender_name !== messages[messages.indexOf(msg) - 1]?.sender_name && <span className="text-sm text-gray-500">{msg.sender_name}</span>}
                    
                    <div className={`${isOwn ? 'bg-blue-100' : 'bg-gray-100 '} p-2 rounded-lg max-w-xs`}>  
                        <p className="text-sm break-words">{msg.content}</p>
                        <span className="text-xs block mt-1 text-right text-gray-500">{new Date(msg.sent_at).toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>
      <MessageInput onSend={handleSend} />
    </div>
  );
}
