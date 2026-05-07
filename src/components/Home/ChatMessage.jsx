import "./ChatMessage.css";

/**
 * ChatMessage Component - Displays individual messages in the chat
 */
function ChatMessage({ message }) {
  const { role, content, timestamp } = message;

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`chat-message ${role}`}>
      <div className="message-content">
        <p>{content}</p>
        {timestamp && (
          <span className="message-time">{formatTime(timestamp)}</span>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
