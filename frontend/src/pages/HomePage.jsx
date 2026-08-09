import Sidebar from "../components/Sidebar.jsx";
import NoChatSelected from "../components/NoChatSelected.jsx";
import ChatContainer from "../components/ChatContainer.jsx";
import { useChatStore } from "../store/useChatStore.js";

export default function HomePage() {
  const { selectedUser, selectedGroup } = useChatStore();
  return (
    <div className="h-[calc(100vh-4rem)] bg-base-200 overflow-hidden">
      <div className="flex items-center justify-center pt-4 px-4 h-full">
        <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-6xl h-full min-h-0">
          <div className="flex h-full rounded-lg overflow-hidden min-h-0">
            <Sidebar />
            {!selectedUser && !selectedGroup ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
}
