"""
Seed the knowledge base with domain docs, dataframe context, and Q&A examples.
Run once: python seed_knowledge.py
"""
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

os.chdir(os.path.dirname(os.path.abspath(__file__)))

from config import get_settings
from rag_knowledge import KnowledgeBase, KNOWLEDGE_DIR
import pandas as pd

settings = get_settings()
settings.validate()

logger.info(f"Carregando dados de: {settings.DATA_FILE}")
df = pd.read_excel(settings.DATA_FILE)
logger.info(f"Dados carregados: {len(df)} linhas, {len(df.columns)} colunas")

kb = KnowledgeBase(settings)

if kb.is_populated():
    logger.warning(f"Knowledge base ja populada ({kb.count()} chunks). Pulando.")
    print(f"Knowledge base ja possui {kb.count()} chunks. Nada a fazer.")
    print("Para recriar: delete a pasta .chroma_db/ e rode novamente.")
else:
    total = 0

    if os.path.isdir(KNOWLEDGE_DIR):
        for fname in sorted(os.listdir(KNOWLEDGE_DIR)):
            if fname.endswith(".md"):
                fpath = os.path.join(KNOWLEDGE_DIR, fname)
                n = kb.add_markdown_file(fpath)
                total += n
                logger.info(f"  {fname}: {n} chunks")
    else:
        logger.warning(f"Pasta {KNOWLEDGE_DIR} nao encontrada")

    n = kb.add_dataframe_context(df)
    total += n
    logger.info(f"  dataframe_context: {n} chunks")

    qa = [
        (
            "Qual a diferenca entre despesa empenhada e despesa liquidada?",
            "Despesa empenhada e o compromisso formalizado (reserva orcamentaria). "
            "Despesa liquidada e a despesa ja executada e verificada quanto ao direito do credor, "
            "apos o recebimento do bem ou servico. A liquidacao ocorre depois do empenho e antes do pagamento.",
        ),
        (
            "O que significa PTRES?",
            "PTRES significa Programa de Trabalho Resumido. E um codigo que identifica a acao "
            "orcamentaria no SIAFI, vinculando a despesa a um programa de governo especifico.",
        ),
        (
            "O que e UG Executora e UG Responsavel?",
            "UG Executora (Unidade Gestora Executora) e a unidade que efetivamente executa a despesa. "
            "UG Responsavel (Unidade Gestora Responsavel) e a unidade responsavel pelo orcamento. "
            "Podem ser a mesma ou diferentes.",
        ),
    ]
    n = kb.add_qa_examples(qa)
    total += n
    logger.info(f"  qa_examples: {n} chunks")

    logger.info(f"Seed concluido: {total} chunks adicionados")
    print(f"\nKnowledge base pronta: {kb.count()} chunks no total.")
