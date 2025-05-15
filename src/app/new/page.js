// File: src/app/new/page.js
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function NewChatPage() {
  const [email, setEmail] = useState('');
  const [desiredTitle, setDesiredTitle] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1) Get current authenticated user
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser) {
      setError('Sign in first');
      router.push('/login');
      return;
    }

    // 2) Lookup target user by email
    const { data: profile, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (lookupError || !profile) {
      setError('User not found');
      return;
    }

    if (profile.id === currentUser.id) {
      setError('Cannot chat with yourself');
      return;
    }

    // 3) Create a new chat room and get its id
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({ is_group: false, title: desiredTitle })
      .select('id')
      .single();

    if (roomError || !room) {
      setError(roomError?.message || 'Error creating room');
      return;
    }

    // 4) Add members to the room
    const { error: membersError } = await supabase
      .from('chat_members')
      .insert([
        { room_id: room.id, member_id: currentUser.id },
        { room_id: room.id, member_id: profile.id }
      ]);

    if (membersError) {
      setError(membersError.message);
      return;
    }

    // 5) Navigate to the new chat room
    router.push(`/chat/${room.id}`);
  };

  const handleTitleChange = (e) => {
    setDesiredTitle(e.target.value);
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl mb-4">Start New Chat</h1>
        <p className="mb-2 text-gray-600">Enter the email of the user you want to chat with:</p>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input
          type="email"
          placeholder="Enter user email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Name the gc"
          value={desiredTitle}
          onChange={handleTitleChange}
          className="w-full mb-4 p-2 border rounded"
        />
        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
          Create Chat
        </button>
      </form>
    </div>
  );
}
