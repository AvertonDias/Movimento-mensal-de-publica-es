# Documentação Técnica - Movimento Mensal (S-28-T)

Este documento detalha as funcionalidades, regras de negócio e a estrutura do sistema inteligente para gestão de inventário de publicações.

## 1. Visão Geral
O aplicativo é uma versão digital e inteligente do formulário oficial **S-28-T**, utilizado para o controle mensal de estoque de publicações. Ele permite que congregações coordenadoras de idioma gerenciem seus materiais com precisão, oferecendo suporte offline, colaboração e análise via IA.

## 2. Funcionalidades Principais

### 2.1 Gestão de Inventário (Tabela Principal)
- **Preenchimento Mensal**: Entrada de dados para "Estoque Anterior", "Recebido" e "Estoque Atual".
- **Cálculo de Saída Automático**: A coluna "Saída" é calculada pela fórmula: `(Anterior + Recebido) - Atual`.
- **Inteligência de Preenchimento**:
    - Se o **Estoque Atual** for preenchido e já houver um **Estoque Anterior**, o campo **Recebido** é zerado automaticamente se estiver em branco.
    - **Seleção Automática**: Ao clicar em qualquer campo numérico, o texto é selecionado automaticamente para facilitar a substituição rápida.
- **Busca Rápida**: Filtro em tempo real por nome da publicação, código ou sigla.
- **Navegação Temporal**: Troca fácil entre meses para preenchimento de registros passados ou futuros.

### 2.2 Colaboração (Sistema de Ajudantes)
- **Convites por Link**: O administrador pode gerar links únicos para convidar ajudantes.
- **Gestão de Acesso**: Ajudantes vinculados visualizam e editam o inventário do administrador, permitindo o trabalho em equipe na contagem real.
- **Segurança**: Regras do Firestore garantem que apenas ajudantes autorizados acessem os dados do proprietário.

### 2.3 Histórico Oficial (S-28-T)
- **Visualização de 6 Meses**: Tabela consolidada seguindo fielmente o layout do formulário impresso.
- **Impressão Otimizada**: Botão de impressão que gera o documento S-28-T formatado para papel A4, com fontes e linhas padronizadas.
- **Suporte a Revistas**: Identificação estável para revistas e itens sem código oficial, garantindo que apareçam corretamente no histórico.

### 2.4 Estatísticas e Insights (IA)
- **Dashboard Visual**: Gráficos de tendências de saída dos últimos 6 meses.
- **Distribuição de Estoque**: Visualização por categorias (Bíblias, Livros, Brochuras, etc.).
- **GenAI (Genkit)**:
    - **Análise de Tendências**: IA analisa quais itens estão estagnados ou com alta demanda.
    - **Dicas de Gestão**: Sugestões personalizadas baseadas nas melhores práticas do JW Hub.

### 2.5 PWA (Progressive Web App)
- **Instalável**: O app pode ser instalado no celular ou computador com o ícone de livro.
- **Offline First**: Permite visualização e preenchimento básico mesmo sem conexão com a internet através do Service Worker.
- **Manifesto**: Configurado com cores e identidade visual da organização.

## 3. Regras de Negócio Importantes
- **Data de Estoque**: Os valores iniciais de estoque são sempre herdados do "Estoque Atual" do mês anterior.
- **S-60 (Descarte)**: O sistema recomenda a revisão periódica da lista S-60 para manter o estoque apenas com itens úteis.
- **Itens Customizados**: Permite adicionar publicações que não constam na lista oficial, mas que são necessárias para a congregação local.

## 4. Tecnologias Utilizadas
- **Frontend**: Next.js 15, React, Tailwind CSS, Shadcn UI.
- **Backend**: Firebase (Auth e Firestore).
- **IA**: Genkit com modelos Google Gemini.
- **Gráficos**: Recharts.
- **Data/Hora**: date-fns.

---
*Este sistema foi desenvolvido para simplificar o trabalho voluntário, garantindo organização e precisão nos relatórios.*