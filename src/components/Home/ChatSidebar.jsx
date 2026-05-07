import "./home.css";

function ChatSidebar({ setIsSideBarOpen, onNewConversation }) {
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
