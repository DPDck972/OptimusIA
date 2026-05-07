import { useContext, useState, useCallback } from "react";
import { UserContext } from "../context/UserContext";
import { chatService } from "../services/chatService";
import {
  HomeHeader,
  AcessibilityContainer,
  ChatSidebar,
  MainChatScreen,
} from "../components/Home";
import "../components/Home/home.css";

function HomePage() {
  const { isHighContrast } = useContext(UserContext);
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const [chatKey, setChatKey] = useState(0);

  const handleNewConversation = useCallback(async () => {
    await chatService.resetSession();
    setChatKey((prev) => prev + 1);
  }, []);

  return (
    <div
      className={`screen-container ${isHighContrast ? "high-contrast" : ""} ${!isSideBarOpen ? "sidebar-closed" : ""}`}
    >
      <AcessibilityContainer />
      {isSideBarOpen && (
        <ChatSidebar
          setIsSideBarOpen={setIsSideBarOpen}
          onNewConversation={handleNewConversation}
        />
      )}
      <HomeHeader />
      <MainChatScreen key={chatKey} />
      {!isSideBarOpen && (
        <button
          className="btn-open-sidebar"
          onClick={() => setIsSideBarOpen(true)}
        >
          ▶
        </button>
      )}
    </div>
  );
}

export default HomePage;
