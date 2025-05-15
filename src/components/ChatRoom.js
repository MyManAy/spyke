// File: src/components/ChatRoom.js
"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import MessageInput from './MessageInput';

export default function ChatRoom({ roomId }) {
    const [messages, setMessages] = useState([]);
    const [c, setC] = useState(0);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!roomId) return;

        // Fetch existing messages
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('id, content, sender_id, sent_at')
                .eq('room_id', roomId)
                .order('sent_at', { ascending: true });
            if (!error) {
                setMessages(data);
                scrollToBottom();
            }
        };

        fetchMessages();

        // Subscribe to new inserts via Postgres changes
        const channel = supabase
        .channel(`room-${roomId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${roomId}`
        }, ({ new: newMessage }) => {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
        })
        .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, c]);


    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (content) => {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) return;

        await supabase
        .from('messages')
        .insert({ room_id: roomId, sender_id: user.id, content });

        setC(c + 1); // Trigger re-render
    };

    return (
        <div className="flex flex-col h-full">
        <main className="flex-1 overflow-y-auto p-4">
            {messages.map(msg => (
            <div key={msg.id} className="mb-2">
                <div className="inline-block bg-blue-100 p-2 rounded">
                <p className="text-sm">{msg.content}</p>
                <span className="text-xs text-gray-500 block">{new Date(msg.sent_at).toLocaleTimeString()}</span>
                </div>
            </div>
            ))}
            <div ref={bottomRef} />
        </main>
        <MessageInput onSend={handleSend} />
        </div>
    );
}
