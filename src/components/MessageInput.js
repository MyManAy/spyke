// File: src/components/MessageInput.js
"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    if (!selected) {
      console.log("No file selected");
      setFile(null);
      return;
    }
    console.log("Selected file:", selected.name, selected);
    // simple validation
    if (!selected.type.startsWith('image/')) {
      alert("Only images allowed");
      e.target.value = "";    // clear the file input
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const uploadImage = async (file) => {
    const ext = file.name.split('.').pop();
    const safeName = `${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('chat-images')
      .upload(safeName, file);
    if (uploadError) throw uploadError;

    const { data: urlData, error: urlError } = supabase
      .storage
      .from('chat-images')
      .getPublicUrl(uploadData.path);
    if (urlError) throw urlError;

    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text && !file) {
      return; // nothing to send
    }

    setUploading(true);

    let imageUrl = null;
    if (file) {
      try {
        console.log("Uploading file:", file.name);
        imageUrl = await uploadImage(file);
        console.log("Uploaded at:", imageUrl);
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    // now dispatch both text + image_url
    if (!text && file) {
        e.target.querySelector('input[type="text"]').value = "📸 Image";
        setText("📸 Image");
    }
    let newC = text.trim() || "📸 Image";
    alert("Sending message: " + newC);
    await onSend({ content: newC, image_url: imageUrl });

    // only now clear!
    setText('');
    setFile(null);
    // also clear the <input type="file">
    e.target.querySelector('input[type="file"]').value = '';
    setUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 flex items-center">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mr-2"
      />
      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={e => setText(e.target.value)}
        className="flex-1 border rounded px-3 py-2 mr-2"
      />
      <button
        type="submit"
        disabled={uploading && !text && !file}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {uploading ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
