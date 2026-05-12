import { formatMessage } from "../../services/formatMessage.js";
import "./ChatMessage.css";

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

  const blocks = formatMessage(content);

  return (
    <div className={`chat-message ${role}`}>
      <div className="message-content">
        {blocks.map((html, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
        ))}
        {timestamp && (
          <span className="message-time">{formatTime(timestamp)}</span>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
