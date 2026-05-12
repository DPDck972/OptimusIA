import { useState } from 'react';
import './home.css';

function ChatSidebar({ setIsSideBarOpen, onNewConversation, onOpenUploadModal, onOpenDatasetManager }) {
  const [isHoveringData, setIsHoveringData] = useState(false);

  return (
    <div className="chat-sidebar-container">
      <button
        className="close-sidebar-btn"
        onClick={() => setIsSideBarOpen(false)}
      >
        ◀
      </button>
      <div className="chat-title">
        <h1>● Optimus IA ●</h1>
        <p>Sistema Orçamentário</p>
        <hr />
        <button className="btn-bi">📊 Abrir BI</button>
        <button className="btn-new" onClick={onNewConversation}>＋ Nova Conversa</button>
        <hr />
        
        {/* Dataset Management Section */}
        <div className="dataset-section">
          <div className="dataset-section-title">Dados</div>
          <button 
            className="btn-data-action"
            onClick={onOpenUploadModal}
            onMouseEnter={() => setIsHoveringData(true)}
            onMouseLeave={() => setIsHoveringData(false)}
            title="Adicionar novo dataset"
          >
            📤 Upload de Dados
          </button>
          <button 
            className="btn-data-action"
            onClick={onOpenDatasetManager}
            title="Gerenciar datasets disponíveis"
          >
            💾 Gerenciar Dados
          </button>
        </div>
        <hr />
        
        <div className="recent-chats">
          <button className="btn-chat-item">💬 Nova conversa</button>
        </div>
      </div>
      <footer className="chatbar-footer">
        &copy; {new Date().getFullYear()} OptimusIA{" "}
      </footer>
    </div>
  );
}

export default ChatSidebar;
