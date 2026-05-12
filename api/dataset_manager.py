"""
Dataset Manager - Gerencia carregamento, upload e alternância de datasets.
"""
import json
import os
import shutil
import logging
from datetime import datetime
from pathlib import Path
import pandas as pd
import unicodedata

logger = logging.getLogger("api")


class DatasetManager:
    """Gerencia múltiplos datasets da aplicação."""
    
    def __init__(self, settings):
        self.settings = settings
        self.datasets_dir = Path(settings.DATASETS_DIR)
        self.index_file = self.datasets_dir / settings.DATASETS_INDEX
        self.current_dataset = None
        self.current_df = None
        
        # Cria diretório se não existir
        self.datasets_dir.mkdir(parents=True, exist_ok=True)
        
        # Carrega ou inicializa índice
        self._load_or_init_index()
    
    def _load_or_init_index(self):
        """Carrega índice de datasets ou cria um novo."""
        if self.index_file.exists():
            try:
                with open(self.index_file, 'r', encoding='utf-8') as f:
                    self.index = json.load(f)
            except Exception as e:
                logger.warning(f"Erro ao carregar índice: {e}. Reinicializando...")
                self.index = self._create_default_index()
        else:
            self.index = self._create_default_index()
            self._save_index()
    
    def _create_default_index(self):
        """Cria índice padrão com dataset padrão."""
        return {
            "active_dataset": "default",
            "datasets": {
                "default": {
                    "name": "Dataset Padrão",
                    "file": self.settings.DATA_FILE,
                    "created_at": datetime.utcnow().isoformat(),
                    "rows": 0,
                    "columns": 0,
                    "permanent": True
                }
            }
        }
    
    def _save_index(self):
        """Salva índice em arquivo JSON."""
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump(self.index, f, indent=2, ensure_ascii=False)
        logger.info(f"Índice de datasets salvo: {self.index_file}")
    
    def load_dataset(self, dataset_id: str = None) -> pd.DataFrame:
        """Carrega um dataset pelo ID. Se não especificado, usa o ativo."""
        if dataset_id is None:
            dataset_id = self.index.get("active_dataset", "default")
        
        if dataset_id not in self.index["datasets"]:
            raise ValueError(f"Dataset não encontrado: {dataset_id}")
        
        dataset_info = self.index["datasets"][dataset_id]
        file_path = Path(dataset_info["file"])
        
        if not file_path.exists():
            raise FileNotFoundError(f"Arquivo do dataset não encontrado: {file_path}")
        
        try:
            df = pd.read_excel(file_path)
            df = self._normalize_columns(df)
            df = self._normalize_numeric_columns(df)
            df = self._normalize_date_columns(df)
            
            self.current_dataset = dataset_id
            self.current_df = df
            
            logger.info(
                f"Dataset carregado: {dataset_id} ({len(df)} linhas, {len(df.columns)} colunas)"
            )
            
            return df
        except Exception as e:
            logger.error(f"Erro ao carregar dataset {dataset_id}: {e}")
            raise
    
    @staticmethod
    def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
        """Normaliza nomes de colunas (remove acentos, espaços, maiúsculas)."""
        def clean_col_name(name: str) -> str:
            normalized = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii')
            cleaned = normalized.strip().upper().replace(' ', '_')
            cleaned = ''.join(c for c in cleaned if c.isalnum() or c == '_')
            return cleaned
        
        df.columns = [clean_col_name(c) for c in df.columns]
        return df
    
    @staticmethod
    def _normalize_numeric_columns(df: pd.DataFrame) -> pd.DataFrame:
        """Converte colunas numéricas esperadas para tipo correto."""
        numeric_cols = ['DESP_EMPENHADA', 'DESP_A_LIQUIDAR', 'DESP_LIQUIDADA',
                        'DESP_LIQUIDADA_A_PAGAR', 'DESP__PAGA']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        return df
    
    @staticmethod
    def _normalize_date_columns(df: pd.DataFrame) -> pd.DataFrame:
        """Converte colunas de data para string legível."""
        date_cols = df.select_dtypes(include=['datetime']).columns
        for col in date_cols:
            df[col] = df[col].dt.strftime('%Y-%m-%d')
        return df
    
    def upload_dataset(self, filename: str, file_content: bytes, dataset_name: str = None) -> str:
        """
        Realiza upload de um novo dataset.
        
        Retorna: dataset_id
        """
        # Valida tamanho do arquivo
        if len(file_content) > self.settings.MAX_UPLOAD_SIZE:
            raise ValueError(
                f"Arquivo muito grande. Máximo: {self.settings.MAX_UPLOAD_SIZE / 1024 / 1024:.1f}MB"
            )
        
        # Valida extensão
        if not filename.lower().endswith('.xlsx'):
            raise ValueError("Apenas arquivos .xlsx são aceitos")
        
        # Gera ID único para dataset
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        dataset_id = f"dataset_{timestamp}"
        safe_filename = f"{dataset_id}.xlsx"
        
        # Salva arquivo
        file_path = self.datasets_dir / safe_filename
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        logger.info(f"Arquivo salvo: {file_path}")
        
        # Valida e carrega dataset
        try:
            temp_df = pd.read_excel(file_path)
            
            # Normaliza
            temp_df = self._normalize_columns(temp_df)
            temp_df = self._normalize_numeric_columns(temp_df)
            temp_df = self._normalize_date_columns(temp_df)
            
            # Atualiza índice
            self.index["datasets"][dataset_id] = {
                "name": dataset_name or f"Dataset ({timestamp})",
                "file": str(file_path),
                "created_at": datetime.utcnow().isoformat(),
                "rows": len(temp_df),
                "columns": len(temp_df.columns),
                "permanent": True
            }
            self._save_index()
            
            logger.info(f"Dataset registrado: {dataset_id}")
            
            return dataset_id
        except Exception as e:
            # Remove arquivo em caso de erro
            file_path.unlink()
            logger.error(f"Erro ao validar dataset: {e}")
            raise
    
    def set_active_dataset(self, dataset_id: str) -> dict:
        """Ativa um dataset."""
        if dataset_id not in self.index["datasets"]:
            raise ValueError(f"Dataset não encontrado: {dataset_id}")
        
        self.index["active_dataset"] = dataset_id
        self._save_index()
        
        logger.info(f"Dataset ativo: {dataset_id}")
        
        return self.index["datasets"][dataset_id]
    
    def list_datasets(self) -> dict:
        """Lista todos os datasets disponíveis."""
        return {
            "active_dataset": self.index.get("active_dataset", "default"),
            "datasets": self.index.get("datasets", {})
        }
    
    def delete_dataset(self, dataset_id: str) -> bool:
        """Deleta um dataset (apenas os não-padrão)."""
        if dataset_id not in self.index["datasets"]:
            raise ValueError(f"Dataset não encontrado: {dataset_id}")
        
        dataset_info = self.index["datasets"][dataset_id]
        
        # Não permite deletar dataset padrão ou não-permanente
        if not dataset_info.get("permanent", False):
            raise ValueError("Apenas datasets permanentes podem ser deletados")
        
        if dataset_id == "default":
            raise ValueError("Dataset padrão não pode ser deletado")
        
        # Remove arquivo
        file_path = Path(dataset_info["file"])
        if file_path.exists():
            file_path.unlink()
            logger.info(f"Arquivo deletado: {file_path}")
        
        # Remove do índice
        del self.index["datasets"][dataset_id]
        
        # Se era o dataset ativo, volta para default
        if self.index.get("active_dataset") == dataset_id:
            self.index["active_dataset"] = "default"
        
        self._save_index()
        logger.info(f"Dataset deletado: {dataset_id}")
        
        return True
    
    def get_current_info(self) -> dict:
        """Retorna informações do dataset atualmente carregado."""
        active_id = self.index.get("active_dataset", "default")
        if active_id not in self.index["datasets"]:
            return {}
        
        info = self.index["datasets"][active_id].copy()
        info["id"] = active_id
        info["loaded"] = self.current_dataset == active_id
        
        return info
