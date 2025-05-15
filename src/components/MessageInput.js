
"use client";
import { useState } from 'react';

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 flex">
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 border rounded px-3 py-2 mr-2"
        disabled={disabled}
      />
      <button type="submit" disabled={disabled} className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50">
        Send
      </button>
    </form>
  );
}