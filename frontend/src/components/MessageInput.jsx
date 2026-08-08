import { useRef, useState } from "react";
import { Image, Send, X } from "lucide-react";
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
    if (!text.trim() && !imagePreview) return;

    setIsSending(true);
    isSendingRef.current = true;

    try {
      await sendMessage({ text: text.trim(), image: imagePreview });
      setText("");
      removeImage();
    } finally {
      setIsSending(false);
      isSendingRef.current = false;
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-zinc-700" />
            <button onClick={removeImage} type="button"
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-base-300 flex items-center justify-center">
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input type="text" placeholder="Type a message..."
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            value={text} onChange={(e) => setText(e.target.value)} />
          <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleImageChange} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className={`hidden sm:flex btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}>
            <Image size={20} />
          </button>
        </div>
        <button type="submit" className="btn btn-sm btn-circle btn-primary" disabled={isSending || (!text.trim() && !imagePreview)}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
