# Documentação Técnica Completa - Movimento Mensal (S-28-T)


## 1. Visão Geral
O S-28 Digital é uma ferramenta avançada para gestão de inventário de publicações, substituindo o formulário físico S-28-T por uma interface digital inteligente, colaborativa e integrada com IA.

## 2. Funcionalidades de Inventário

### 2.1 Gestão de Dados Mensais
- **Colunas Oficiais**: Suporte total para "Estoque Anterior", "Recebido", "Estoque Atual" e a calculada "Saída".
- **Cálculo Automático de Saída**: A coluna "Saída" é processada em tempo real pela fórmula: `(Anterior + Recebido) - Estoque Atual`.
- **Inteligência de Preenchimento (Zero Automático)**: Por padrão, a coluna **Estoque Atual** é preenchida com **0** para agilizar o processo. Além disso, ao preencher o estoque, se houver um valor anterior e o campo "Recebido" estiver vazio, o sistema assume automaticamente o valor 0 no recebimento.
- **Navegação Temporal**: Seletor de mês/ano com popover intuitivo, permitindo navegar por registros passados ou preparar meses futuros.
- **Herança de Estoque**: O sistema busca automaticamente o "Estoque Atual" do mês anterior para preencher o "Estoque Anterior" do mês corrente.

### 2.2 Interface e Usabilidade
- **Seleção Rápida (Auto-select)**: Ao clicar em qualquer campo numérico, o texto é selecionado automaticamente, permitindo a substituição instantânea do valor sem necessidade de apagar.
- **Identificação Visual**: Ao clicar no nome de uma publicação, um popover exibe a **capa oficial** da revista ou livro (links integrados com o servidor de imagens do jw.org). Esta funcionalidade está presente na tabela principal, nos relatórios e nas estatísticas.
- **Categorização Elegante**: Títulos de categorias com informações adicionais (como medidas de maços) são formatados automaticamente para separar o título da instrução técnica.
- **Busca e Filtros**: Filtro global que pesquisa simultaneamente por nome, código (N.º) ou sigla da publicação.

### 2.3 Relatórios de Inventário
- **Visão de Saldo Físico**: Página dedicada que oculta automaticamente itens sem movimentação (estoque anterior e atual zerados), focando no que realmente existe no balcão.
- **Impressão Otimizada**: Botão de impressão que gera uma folha de conferência limpa e profissional.

## 3. Colaboração (Sistema de Ajudantes)

### 3.1 Convites e Vínculos
- **Gerador de Links**: O administrador pode gerar links únicos de convite.
- **Fluxo de Aceite**: Quando um ajudante aceita o convite, seu acesso é vinculado ao inventário do anfitrião, substituindo seus dados pessoais pelos dados compartilhados.

### 3.2 Sincronização
- **Firestore Real-time**: Atualizações instantâneas entre administrador e ajudantes.

## 4. Relatórios e Análises

### 4.1 Histórico S-28-T (Oficial)
- **Visão Semestral**: Tabela consolidada dos últimos 6 meses de movimentação em layout fiel ao formulário impresso.
- **Impressão Profissional**: Formatação perfeita para papel A4.

### 4.2 Estatísticas e IA
- **Dashboard de Tendências**: Gráficos de barras que analisam a saída dos últimos 6 meses (baseado em meses já fechados).
- **Distribuição por Categoria**: Gráfico de pizza que mostra a composição do estoque atual.
- **Top 10 Mais Distribuídos**: Lista dos itens com maior rotatividade, incluindo visualização de capas.
- **Insights com Genkit (IA)**: Análise de tendências e dicas de gestão baseadas nos dados reais.

## 5. Tecnologias Utilizadas
- **Core**: Next.js 15, React 19, TypeScript.
- **Backend**: Firebase (Auth e Firestore).
- **IA**: Genkit com Gemini 2.5 Flash.
- **Estilização**: Tailwind CSS + Shadcn UI.

---
*Este sistema é uma ferramenta de apoio voluntário, focada em precisão, simplicidade e organização.*