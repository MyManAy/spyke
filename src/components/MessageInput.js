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
    // inside your ChatRoom container, replace the <form> with:

    <form
    onSubmit={handleSubmit}
    className="
        border-t           /* thin line above the form */
        bg-white           /* opaque background */
        p-2 sm:p-4         /* smaller padding on mobile */
        flex items-center
        flex-shrink-0      /* don't let it grow/shrink weirdly */
        z-10               /* sit above the scrolling messages */
    "
    >
    {/* hidden file input + styled label */}
    <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
    />
    <label
        htmlFor="file-upload"
        className="
        flex items-center justify-center
        px-2 py-1 sm:px-4 sm:py-2
        bg-gray-200 rounded mr-2
        hover:bg-gray-300
        "
    >
        📎
        <span className="hidden sm:inline ml-1">Attach</span>
    </label>

    {/* text input */}
    <input
        type="text"
        placeholder="Type a message…"
        value={text}
        onChange={e => setText(e.target.value)}
        className="
        flex-1 
        border rounded
        px-2 py-1 sm:px-3 sm:py-2
        mr-2 text-sm sm:text-base
        "
    />

    {/* send button */}
    <button
        type="submit"
        disabled={uploading && !text && !file}
        className="
        px-3 py-1 sm:px-4 sm:py-2
        bg-blue-500 text-white rounded
        text-sm sm:text-base
        disabled:opacity-50
        "
    >
        {uploading ? "Sending…" : "Send"}
    </button>
    </form>




  );
}
