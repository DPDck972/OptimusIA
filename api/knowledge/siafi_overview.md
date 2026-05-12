# SIAFI — Visão Geral

## O que é

SIAFI (Sistema Integrado de Administração Financeira do Governo Federal) é o principal sistema utilizado pela administração pública federal brasileira para controle orçamentário, financeiro, patrimonial e contábil.

## Migração para o SIAFI Web

Desde 2021, operações de empenho passaram do antigo SIAFI Operacional ("tela preta") para o SIAFI Web. Transações principais:
- `INCNE` — inclusão de nota de empenho
- `CONNE` — consulta de nota de empenho

## Processo de Criação de Empenho

### Acesso ao Sistema
Usuário deve informar CPF, senha SIAFI, validar captcha e acessar o sistema.

### Inclusão de Nota de Empenho (INCNE)
Duas formas:
1. Navegação pelo menu: Orçamento → Nota de Empenho → Incluir Nota de Empenho
2. Digitando diretamente: `INCNE`

### Campos Obrigatórios do Empenho

**Dados Orçamentários:** Esfera, PTRES, Fonte de Recurso, Natureza da Despesa, UGR, Plano Interno.

**Dados Financeiros:** Data de emissão, Tipo do empenho (ordinário, estimativo, global), Valor, Favorecido (CNPJ ou UG/Gestão).

**Dados Administrativos:** Processo, Amparo legal, Modalidade de licitação, Descrição da finalidade, Informações complementares.

### Itens do Empenho
Após preencher dados principais: incluir subitem da despesa com descrição, quantidade, valor unitário e valor total. Depois confirmar, registrar e gerar número da Nota de Empenho.

### Consulta e Impressão
Pesquisar empenhos pelo número, visualizar dados, alterar, imprimir.

## Estrutura Geral do SIAFI

### Principais Módulos
- **Entrada no Sistema:** autenticação, troca de senha, seleção de unidade gestora, personalização de menus
- **Administração do Sistema:** mensagens da aplicação, auditoria, histórico, manutenção de sistemas, logs
- **Comunicação Interna:** envio e recebimento de mensagens, notificações internas
- **Pesquisas e Lupas:** empenhos, favorecidos, unidades gestoras, fontes de recurso, natureza da despesa, programas, municípios, eventos contábeis, subitens, receitas, órgãos, classificações

### Regras e Parametrizações
O SIAFI trabalha baseado em regras de acionamento, formatação, tipos de evento, tipos de situação, documentos hábeis e validações automáticas para garantir integridade contábil, padronizar lançamentos e evitar inconsistências.

## Execução Orçamentária

Uma despesa pública passa pelas seguintes etapas no SIAFI:
1. **Planejamento Orçamentário**
2. **Reserva de Dotação**
3. **Empenho** — reserva orçamentária, compromisso formalizado
4. **Liquidação** — verificação do direito do credor
5. **Pagamento** — efetiva saída financeira
6. **Registro Contábil**

## Documento Hábil

Módulo importante do SIAFI que permite registrar documentos financeiros, contabilizar despesas, gerar obrigações, controlar pagamentos, relacionar empenhos, registrar deduções, encargos e controlar centros de custo. Possui abas de Dados Básicos, Principal com/sem orçamento, Encargos, Deduções, Pagamentos, Resumo, Compensação, Crédito e Centro de custo.

## Gestão Financeira

O sistema permite gerenciar compromissos, realizar pagamentos, agendar pagamentos, efetuar estornos, realizar baixas, transferir compromissos e acompanhar execução financeira.
