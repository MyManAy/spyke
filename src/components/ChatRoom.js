// File: src/components/ChatRoom.js
"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import MessageInput from './MessageInput';

export default function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [dontGoDown, setDontGoDown] = useState(false);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  // Ask for notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  const showNotification = ({ sender_name, content, image_url }) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    const MAX_LEN = 60;
    let text = '';
    const truncated = (t) => (t.length > MAX_LEN ? t.slice(0, MAX_LEN) + '…' : t);
    if (image_url && (!content || content === '📸 Image')) {
      text = 'Image.';
    } else if (image_url) {
      text = truncated(content);
    } else {
      text = truncated(content);
    }
    new Notification(`New message from ${sender_name}`, { body: text });
  };

  // Get current user ID once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
    if (!dontGoDown) {
      scrollToBottom();
    }
  }, []);

  useEffect(() => {
    // on mobile browsers, visualViewport.height shrinks when the keyboard opens
    const onResize = () => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
      return () => {
        window.visualViewport.removeEventListener('resize', onResize);
      };
    }
  }, []);


  useEffect(() => {
    if (!roomId) return;

    // Helper to process and scroll
    const processMessages = (data) => {
        setMessages(data);
        if (!dontGoDown) {
          scrollToBottom();
        }
    };

    // Fetch existing messages with sender profile
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(
          `id, content, image_url, sender_id, sent_at, sender:profiles(display_name)`
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
        if (newMessage.sender_id !== currentUserId) {
          showNotification(msgWithName);
        }

      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [roomId, currentUserId]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    // distance from bottom:
    const distanceFromBottom = scrollHeight - clientHeight - scrollTop;
    // if user has scrolled up by more than 1/4 of the visible height:
    if (distanceFromBottom > clientHeight * 0.25) {
      setDontGoDown(true);
    } else {
      setDontGoDown(false);
    }
  };

  const handleSend = async ({ content, image_url }) => {
    if (!currentUserId) return;
    setDontGoDown(false);
    await supabase.from('messages').insert({ room_id: roomId, sender_id: currentUserId, content, image_url });
  };


  return (
    <div className="flex flex-col h-full">
        <main
          className="flex-1 overflow-y-auto p-4"
          ref={containerRef}
          onScroll={handleScroll} >
            {messages.map(msg => {
            const isOwn = msg.sender_id === currentUserId;
            return (
                <div key={msg.id} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                        {msg.sender_name && msg.sender_name !== messages[messages.indexOf(msg) - 1]?.sender_name && <span className="text-sm text-gray-500">{msg.sender_name}</span>}
                        
                        <div className={`${isOwn ? 'bg-blue-100' : 'bg-gray-100 '} p-2 rounded-lg max-w-xs`}>  
                            {msg.image_url && (
                                <img
                                    src={msg.image_url}
                                    alt="attachment"
                                    className="mb-2 rounded max-h-60 object-contain"
                                />
                                )}
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

        
      {dontGoDown && (
        <button
          onClick={() => {
            scrollToBottom();
            setDontGoDown(false);
          }}
          className="fixed bottom-24 right-6 bg-blue-500 text-white px-4 py-2 rounded shadow"
        >
          Jump to newest
        </button>
      )}
    </div>
  );
}
