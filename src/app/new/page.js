// File: src/app/new/page.js
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function NewChatPage() {
  const [emailsInput, setEmailsInput] = useState('');
  const [desiredTitle, setDesiredTitle] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Get current authenticated user
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser) {
      setError('Please sign in first');
      router.push('/login');
      return;
    }

    // Parse comma-separated emails
    const emails = emailsInput
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter((e, i, arr) => e && arr.indexOf(e) === i);

    if (!emails.length) {
      setError('Enter at least one email');
      return;
    }

    // Prevent chatting with self only list
    const filteredEmails = emails.filter(e => e !== currentUser.email.toLowerCase());
    if (!filteredEmails.length) {
      setError('Cannot create chat with only yourself');
      return;
    }

    // Lookup target users
    const { data: profiles, error: lookupError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('email', filteredEmails);

    if (lookupError) {
      setError('Error fetching user profiles');
      return;
    }
    if (profiles.length !== filteredEmails.length) {
      const foundEmails = profiles.map(p => p.email.toLowerCase());
      const missing = filteredEmails.filter(e => !foundEmails.includes(e));
      setError(`Users not found: ${missing.join(', ')}`);
      return;
    }

    // Determine group flag and title
    const isGroup = profiles.length > 1;
    const title = desiredTitle || (isGroup ? 'Group Chat' : `Chat with ${profiles[0].email.split('@')[0]}`);

    // Create chat room
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({ is_group: isGroup, title })
      .select('id')
      .single();
    if (roomError || !room) {
      setError(roomError?.message || 'Error creating room');
      return;
    }

    // Add members: current user + targets
    const members = [
      { room_id: room.id, member_id: currentUser.id },
      ...profiles.map(p => ({ room_id: room.id, member_id: p.id }))
    ];
    const { error: membersError } = await supabase
      .from('chat_members')
      .insert(members);
    if (membersError) {
      setError(membersError.message);
      return;
    }

    // Navigate to new chat
    router.push(`/chat/${room.id}`);
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl mb-4">Start New Chat</h1>
        <p className="mb-2 text-gray-600">
          Enter comma-separated user emails to chat with:
        </p>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input
          type="text"
          placeholder="e.g. alice@example.com, bob@example.com"
          value={emailsInput}
          onChange={(e) => setEmailsInput(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Optional: Name your group"
          value={desiredTitle}
          onChange={(e) => setDesiredTitle(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />
        <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
          Create Chat
        </button>
      </form>
    </div>
  );
}
