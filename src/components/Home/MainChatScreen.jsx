import { useState, useRef, useEffect, useContext } from "react";
import "./home.css";
import { UserContext } from "../../context/UserContext";
import ChatMessage from "./ChatMessage";
import { chatService } from "../../services/chatService";

function MainChatScreen() {
  const { userName } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await chatService.checkHealth();
      if (!isHealthy) {
        setApiError("API não está disponível. Verifique a conexão.");
      }
    };
    checkHealth();
  }, []);

  const handleSendMessage = async (text) => {
    const messageText = text || inputValue;

    if (!messageText.trim()) return;

    setApiError(null);

    const userMessage = {
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await chatService.sendQuery(messageText);

      const assistantMessage = {
        role: "assistant",
        content: response.message,
        timestamp: response.timestamp,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: "error",
        content: `Erro ao processar: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  if (messages.length === 0) {
    return (
      <div className="main-chat-container">
        <section className="welcome-section">
          <h2 className="welcome-title">
            Bem-vindo(a), <span className="capitalize">{userName}</span>, ao
            Assistente Orçamentário Inteligente
          </h2>
          <p className="welcome-subtitle">
            Faça uma pergunta sobre dotações, despesas, relatórios ou
            planejamento orçamentário
          </p>
        </section>

        {apiError && (
          <div className="error-banner">
            <span>⚠️ {apiError}</span>
          </div>
        )}

        <section className="suggestions-grid">
          <div
            className="suggestion-card"
            onClick={() =>
              handleSuggestionClick(
                "Como consultar a disponibilidade de uma dotação orçamentária?"
              )
            }
          >
            <div className="card-header">
              <span className="card-icon gold">$</span>
              <h3>Dotação Orçamentária</h3>
            </div>
            <p>Como consultar a disponibilidade de uma dotação orçamentária?</p>
          </div>

          <div
            className="suggestion-card"
            onClick={() =>
              handleSuggestionClick(
                "Como analisar as despesas empenhadas por categoria?"
              )
            }
          >
            <div className="card-header">
              <span className="card-icon yellow">📈</span>
              <h3>Análise de Despesas</h3>
            </div>
            <p>Como analisar as despesas empenhadas por categoria?</p>
          </div>

          <div
            className="suggestion-card"
            onClick={() =>
              handleSuggestionClick(
                "Preciso gerar um relatório de execução orçamentária mensal"
              )
            }
          >
            <div className="card-header">
              <span className="card-icon gold">📄</span>
              <h3>Relatórios</h3>
            </div>
            <p>Preciso gerar um relatório de execução orçamentária mensal</p>
          </div>

          <div
            className="suggestion-card"
            onClick={() =>
              handleSuggestionClick(
                "Como fazer o planejamento orçamentário para o próximo exercício?"
              )
            }
          >
            <div className="card-header">
              <span className="card-icon yellow">📅</span>
              <h3>Planejamento</h3>
            </div>
            <p>
              Como fazer o planejamento orçamentário para o próximo exercício?
            </p>
          </div>
        </section>

        <footer className="chat-input-section">
          <form className="chat-form" onSubmit={handleFormSubmit}>
            <div className="input-box-container">
              <input
                type="text"
                placeholder="Digite sua dúvida aqui..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="send-button"
                disabled={loading || !inputValue.trim()}
              >
                <span className="send-icon">{loading ? "⏳" : "🚀"}</span>
              </button>
            </div>
          </form>
        </footer>
      </div>
    );
  }

  return (
    <div className="main-chat-container chat-active">
      <div className="messages-container">
        {apiError && (
          <div className="error-banner">
            <span>⚠️ {apiError}</span>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}

        {loading && (
          <div className="chat-message assistant loading">
            <div className="message-content">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <footer className="chat-input-section">
        <form className="chat-form" onSubmit={handleFormSubmit}>
          <div className="input-box-container">
            <input
              type="text"
              placeholder="Digite sua dúvida aqui..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="send-button"
              disabled={loading || !inputValue.trim()}
            >
              <span className="send-icon">{loading ? "⏳" : "🚀"}</span>
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}

export default MainChatScreen;
