/**
 * Chat Service - Handles API communication with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_API_KEY || '';

let _sessionId = null;

export const chatService = {
  async sendQuery(query) {
    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    if (!API_KEY) {
      throw new Error('API Key not configured. Set VITE_API_KEY in .env');
    }

    const body = {
      query: query.trim(),
      session_id: _sessionId,
    };

    const response = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let detail;
      try {
        const errorData = await response.json();
        detail = errorData.detail || `API Error: ${response.status}`;
      } catch {
        detail = `API Error: ${response.status} ${response.statusText}`;
      }
      throw new Error(detail);
    }

    const data = await response.json();

    if (!data.output || data.output.trim().length === 0) {
      throw new Error('A resposta do agente veio vazia. Tente reformular a pergunta.');
    }

    _sessionId = data.session_id;

    return {
      success: true,
      message: data.output,
      timestamp: data.timestamp,
      originalQuery: data.query,
      sessionId: data.session_id,
    };
  },

  async resetSession() {
    if (_sessionId) {
      try {
        await fetch(`${API_BASE_URL}/session/${_sessionId}`, {
          method: 'DELETE',
          headers: {
            'X-API-Key': API_KEY,
          },
        });
      } catch {
        // Silently fail — session cleanup is best-effort
      }
    }
    _sessionId = null;
  },

  getSessionId() {
    return _sessionId;
  },

  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },
};
