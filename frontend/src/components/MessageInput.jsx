import React, { useRef, useState } from "react";
import { Image, Send, X, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import { useChatStore } from "../store/useChatStore.js";

export default function MessageInput() {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const fileRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image");
    if (file.size > 4 * 1024 * 1024) return toast.error("Image must be under 4MB");
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (isSendingRef.current) return;
    const trimmedText = text.trim();
    if (!trimmedText && !imagePreview) return;

    setIsSending(true);
    isSendingRef.current = true;

    const payloadText = trimmedText;
    const payloadImage = imagePreview;

    // Instant reset to prevent double send and provide instant feedback
    setText("");
    removeImage();

    try {
      await sendMessage({ text: payloadText, image: payloadImage });
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setIsSending(false);
      isSendingRef.current = false;
    }
  };

  return (
    <div className="p-3 sm:p-4 w-full bg-base-100/70 backdrop-blur-md border-t border-base-300/80">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative group">
            <img
              src={imagePreview}
              alt="Preview"
              className="size-20 object-cover rounded-xl border border-base-300 shadow-md"
            />
            <button
              onClick={removeImage}
              type="button"
              className="absolute -top-2 -right-2 size-6 rounded-full bg-base-300 text-base-content hover:bg-error hover:text-white flex items-center justify-center shadow-md transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-base-200/60 focus-within:bg-base-100 focus-within:border-primary/50 border border-base-300/80 rounded-2xl px-3 py-1.5 transition-all shadow-xs">
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            className="hidden"
            onChange={handleImageChange}
          />
          
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`p-2 rounded-xl transition-colors hover:bg-base-300/60 ${
              imagePreview ? "text-emerald-500 bg-emerald-500/10" : "text-base-content/50 hover:text-base-content"
            }`}
            title="Attach image"
          >
            <Paperclip className="size-5" />
          </button>

          <input
            type="text"
            placeholder="Type a message..."
            className="w-full bg-transparent border-none outline-none text-sm text-base-content placeholder:text-base-content/40 py-1.5"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isSending || (!text.trim() && !imagePreview)}
          className="btn btn-primary rounded-2xl px-4 shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          <Send className="size-4" />
          <span className="hidden sm:inline font-semibold text-xs">Send</span>
        </button>
      </form>
    </div>
  );
}

