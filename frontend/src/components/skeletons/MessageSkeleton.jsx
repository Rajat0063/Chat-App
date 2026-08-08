export default function MessageSkeleton() {
  const items = Array(6).fill(0);
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {items.map((_, i) => (
        <div key={i} className={`chat ${i % 2 === 0 ? "chat-start" : "chat-end"}`}>
          <div className="chat-image avatar"><div className="size-10 rounded-full"><div className="skeleton w-full h-full rounded-full" /></div></div>
          <div className="chat-header mb-1"><div className="skeleton h-4 w-16" /></div>
          <div className="chat-bubble bg-transparent p-0"><div className="skeleton h-16 w-[200px]" /></div>
        </div>
      ))}
    </div>
  );
}