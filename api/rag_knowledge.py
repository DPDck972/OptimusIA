import os
import logging
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import pandas as pd

logger = logging.getLogger("api")

KNOWLEDGE_DIR = os.path.join(os.path.dirname(__file__), "knowledge")
COLLECTION_NAME = "optimus_knowledge"
CHROMA_DIR = os.path.join(os.path.dirname(__file__), ".chroma_db")
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def build_dataframe_context(df: pd.DataFrame) -> str:
    lines = [
        "## Dicionario de Dados (gerado automaticamente do DataFrame)",
        f"Total de registros: {len(df)}",
        f"Total de colunas: {len(df.columns)}",
        "",
    ]
    for col in df.columns:
        dtype = df[col].dtype
        non_null = int(df[col].notna().sum())
        n_unique = int(df[col].nunique())
        sample = df[col].dropna().iloc[0] if non_null > 0 else None
        if isinstance(sample, str) and len(sample) > 60:
            sample = sample[:60] + "..."
        lines.append(
            f"- **{col}** ({dtype}): {non_null}/{len(df)} nao-nulos, "
            f"{n_unique} unicos, ex: {sample!r}"
        )

    code_cols = [
        c for c in df.columns
        if df[c].dtype in ("int64", "float64") and df[c].nunique() < 50
    ]
    for col in code_cols:
        top = df[col].value_counts().head(10)
        lines.append(f"\n  Valores frequentes em {col}:")
        for val, cnt in top.items():
            lines.append(f"    - {val}: {cnt} ocorrencias")

    return "\n".join(lines)


class KnowledgeBase:
    def __init__(self, settings):
        self.settings = settings
        self.embeddings = OllamaEmbeddings(
            model=settings.EMBEDDING_MODEL,
            base_url=settings.EMBEDDING_URL,
        )
        os.makedirs(CHROMA_DIR, exist_ok=True)
        self.vectorstore = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=self.embeddings,
            persist_directory=CHROMA_DIR,
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            separators=["\n## ", "\n---\n", "\n### ", "\n\n", "\n", ". ", " "],
        )

    def count(self) -> int:
        return self.vectorstore._collection.count()

    def is_populated(self) -> bool:
        return self.count() > 0

    def add_documents(self, docs: list[Document]) -> int:
        if docs:
            chunks = self.text_splitter.split_documents(docs)
            self.vectorstore.add_documents(chunks)
            return len(chunks)
        return 0

    def add_markdown_file(self, filepath: str, source_label: str = None) -> int:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        label = source_label or os.path.basename(filepath)
        doc = Document(page_content=content, metadata={"source": label})
        return self.add_documents([doc])

    def add_dataframe_context(self, df: pd.DataFrame) -> int:
        content = build_dataframe_context(df)
        doc = Document(page_content=content, metadata={"source": "dataframe_context"})
        return self.add_documents([doc])

    def add_qa_examples(self, examples: list[tuple[str, str]]) -> int:
        docs = []
        for i, (q, a) in enumerate(examples):
            content = f"Pergunta: {q}\nResposta: {a}"
            docs.append(
                Document(page_content=content, metadata={"source": "qa_example", "index": i})
            )
        return self.add_documents(docs)

    def query(self, text: str, k: int = 3) -> list[Document]:
        return self.vectorstore.similarity_search(text, k=k)
