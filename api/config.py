"""
Configuração centralizada e segura da aplicação.
"""
import os
from dotenv import load_dotenv
from functools import lru_cache

load_dotenv()


class Settings:
    """Configurações da aplicação"""
    
    # API Configuration
    API_TITLE: str = "QueryBot API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "API para consultas em dados"
    
    # Server Configuration
    HOST: str = os.getenv("API_HOST", "127.0.0.1")  # Apenas localhost por padrão
    PORT: int = int(os.getenv("API_PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Authentication
    API_KEY: str = os.getenv("API_KEY", "")
    API_KEY_HEADER: str = "X-API-Key"
    
    # CORS Configuration
    CORS_ORIGINS: list = [
        origin.strip() 
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    ]
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "True").lower() == "true"
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "10"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
    
    # LLM Configuration
    MODEL_NAME: str = os.getenv("LLM_MODEL", "qwen3.5:4b")
    LOCAL_URL: str = os.getenv("LLM_URL", "http://localhost:11434/v1")
    LLM_TIMEOUT: int = int(os.getenv("LLM_TIMEOUT", "120"))
    
    # Security
    ALLOW_DANGEROUS_CODE: bool = os.getenv("ALLOW_DANGEROUS_CODE", "False").lower() == "true"
    MAX_QUERY_LENGTH: int = int(os.getenv("MAX_QUERY_LENGTH", "1000"))
    
    # Data Files
    DATA_FILE: str = os.getenv("DATA_FILE", "dados.xlsx")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "logs/api.log")
    
    @property
    def is_production(self) -> bool:
        """Verifica se está em produção"""
        return not self.DEBUG
    
    def validate(self) -> None:
        """Valida as configurações críticas"""
        errors = []
        
        if self.is_production and not self.API_KEY:
            errors.append("API_KEY é obrigatória em produção")
        
        if self.is_production and self.HOST == "0.0.0.0":
            errors.append("HOST não pode ser 0.0.0.0 em produção")
        
        if not os.path.exists(self.DATA_FILE):
            errors.append(f"Arquivo de dados não encontrado: {self.DATA_FILE}")
        
        if errors:
            raise ValueError("Erros na configuração:\n" + "\n".join(errors))


@lru_cache()
def get_settings() -> Settings:
    """Obtém a instância de configurações (single instance)"""
    return Settings()
