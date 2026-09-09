import React from "react";
import Sidebar from "../components/Sidebar.jsx";
import NoChatSelected from "../components/NoChatSelected.jsx";
import ChatContainer from "../components/ChatContainer.jsx";
import { useChatStore } from "../store/useChatStore.js";

export default function HomePage() {
  const { selectedUser, selectedGroup } = useChatStore();

  return (
    <div className="h-[calc(100vh-4rem)] bg-base-200/60 p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="mx-auto h-full max-w-7xl">
        <div className="bg-base-100/90 backdrop-blur-xl border border-base-300/80 rounded-2xl sm:rounded-3xl shadow-2xl h-full overflow-hidden flex flex-col">
          <div className="flex h-full min-h-0 divide-x divide-base-300/60 overflow-hidden">
            <div className={`${selectedUser || selectedGroup ? "hidden md:flex" : "flex"} h-full min-h-0`}>
              <Sidebar />
            </div>
            <div className="flex min-w-0 flex-1 h-full min-h-0">
              {!selectedUser && !selectedGroup ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

