"use client";
import Link from 'next/link';

export default function ChatList({ rooms }) {
  if (!rooms.length) {
    return <p className="text-center text-gray-500">No chats yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {rooms.map(room => (
        <li key={room.id}>
          <Link href={`/chat/${room.id}`}> 
            <p className="block p-4 bg-white rounded shadow hover:bg-gray-50">
              {room.title || 'Chat'}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}