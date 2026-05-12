import { useContext, useState, useCallback } from "react";
import { UserContext } from "../context/UserContext";
import { chatService } from "../services/chatService";
import {
  HomeHeader,
  AcessibilityContainer,
  ChatSidebar,
  MainChatScreen,
  DatasetUploadModal,
  DatasetManager,
} from "../components/Home";
import "../components/Home/home.css";

function HomePage() {
  const { isHighContrast } = useContext(UserContext);
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const [chatKey, setChatKey] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDatasetManagerOpen, setIsDatasetManagerOpen] = useState(false);

  const handleNewConversation = useCallback(async () => {
    await chatService.resetSession();
    setChatKey((prev) => prev + 1);
  }, []);

  const handleUploadSuccess = useCallback((datasetId) => {
    // Opcional: recarregar dados da aplicação
    console.log("Dataset uploaded:", datasetId);
  }, []);

  const handleDatasetChange = useCallback((datasetId) => {
    // Opcional: recarregar dados da aplicação
    console.log("Dataset changed:", datasetId);
    setChatKey((prev) => prev + 1); // Reset chat quando mudar dataset
  }, []);

  return (
    <div
      className={`screen-container ${isHighContrast ? "high-contrast" : ""} ${
        !isSideBarOpen ? "sidebar-closed" : ""
      }`}
    >
      <AcessibilityContainer />
      {isSideBarOpen && (
        <ChatSidebar
          setIsSideBarOpen={setIsSideBarOpen}
          onNewConversation={handleNewConversation}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onOpenDatasetManager={() => setIsDatasetManagerOpen(true)}
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

      {/* Modals */}
      <DatasetUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
      <DatasetManager
        isOpen={isDatasetManagerOpen}
        onClose={() => setIsDatasetManagerOpen(false)}
        onDatasetChange={handleDatasetChange}
      />
    </div>
  );
}

export default HomePage;
