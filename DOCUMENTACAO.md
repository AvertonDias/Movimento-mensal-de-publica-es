# Documentação Técnica Completa - Movimento Mensal (S-28-T)


## 1. Visão Geral

## 2. Funcionalidades de Inventário

### 2.1 Gestão de Dados Mensais
- **Colunas Oficiais**: Suporte total para "Estoque Anterior", "Recebido", "Estoque Atual" e a calculada "Saída".
- **Cálculo Automático de Saída**: A coluna "Saída" é processada em tempo real pela fórmula: `(Anterior + Recebido) - Estoque Atual`.
- **Inteligência de Preenchimento (Zero Automático)**: Ao preencher o **Estoque Atual**, se houver um valor em **Estoque Anterior** e o campo **Recebido** estiver vazio, o sistema assume automaticamente o valor **0** para agilizar o processo.
- **Navegação Temporal**: Seletor de mês/ano com popover intuitivo, permitindo navegar por registros passados ou preparar meses futuros.
- **Herança de Estoque**: O sistema busca automaticamente o "Estoque Atual" do mês anterior para preencher o "Estoque Anterior" do mês corrente.

### 2.2 Interface e Usabilidade
- **Seleção Rápida**: Ao clicar em qualquer campo numérico, o texto é selecionado automaticamente (auto-select), permitindo a substituição instantânea do valor sem necessidade de apagar.
- **Identificação Visual**: Ao clicar no nome de uma publicação, um popover exibe a **capa oficial** da revista ou livro (links integrados com o servidor de imagens do jw.org).
- **Busca e Filtros**: Filtro global que pesquisa simultaneamente por nome, código (N.º) ou sigla da publicação.
- **Modo de Edição Flexível**: Suporte para itens oficiais e itens personalizados adicionados pela congregação local.

### 2.3 Gestão de Itens Personalizados
- **Adição Dinâmica**: Possibilidade de adicionar publicações que não constam na lista oficial padrão.
- **Edição e Exclusão**: Interface para alterar nome, código ou sigla de itens criados pelo usuário, com diálogos de confirmação de segurança.

## 3. Colaboração (Sistema de Ajudantes)

### 3.1 Convites e Vínculos
- **Gerador de Links**: O administrador pode gerar links únicos de convite.
- **Fluxo de Aceite**: Quando um ajudante clica no link, ele é guiado para uma tela de cadastro/login onde confirma que deseja vincular seu acesso ao inventário do administrador.
- **Substituição de Dados**: Regra clara de que ao aceitar ser um ajudante, o usuário passa a gerenciar o estoque do "Anfitrião", garantindo unidade nos dados.

### 3.2 Sincronização
- **Firestore Real-time**: As atualizações feitas por um ajudante aparecem instantaneamente para o administrador e vice-versa.
- **Identificação**: O sistema registra quem é o ajudante ativo para facilitar a gestão de acessos.

## 4. Relatórios e Análises

### 4.1 Histórico S-28-T (Oficial)
- **Visão Semestral**: Tabela consolidada dos últimos 6 meses de movimentação.
- **Layout Fiel**: Design idêntico ao formulário impresso, com fontes condensadas e bordas pretas sólidas.
- **Impressão Profissional**: Botão otimizado que remove elementos da web (menus, botões) e formata a tabela perfeitamente para papel A4.

### 4.2 Estatísticas e IA
- **Dashboard Visual**: Gráficos de barras para tendências de saída e gráficos de pizza para distribuição de estoque por categorias (Bíblias, Livros, Revistas, etc.).
- **Insights com Genkit (IA)**:
    - **Análise de Tendências**: IA que identifica itens parados (potencial S-60) ou com alta rotatividade.
    - **Dicas de Gestão**: Sugestões baseadas nas melhores práticas para evitar acúmulo desnecessário de estoque.

## 5. Autenticação e Segurança

- **Provedores**: Suporte para Google Login e Email/Senha.
- **Perfil do Usuário**: Inclusão de campo "Nome Completo" no cadastro para identificação em convites.
- **Privacidade de Senha**: Toggle de visibilidade (ícone de olho) nas telas de Login e Cadastro.
- **Recuperação de Acesso**: Fluxo completo de "Esqueci minha senha" com envio de e-mail de redefinição via Firebase Auth.
- **Regras do Firestore**: Proteção rigorosa que permite escrita apenas pelo proprietário ou ajudantes explicitamente autorizados via token.

## 6. PWA (Progressive Web App)

- **Instalação**: O app é instalável em dispositivos Android, iOS e Desktop.
- **Identidade**: Utiliza o ícone de livro (`BookOpen`) como ícone do aplicativo na tela inicial.
- **Offline-First**: Cache de assets e interface via Service Worker, permitindo abrir o app e visualizar dados mesmo sem conexão.

## 7. Tecnologias Utilizadas

- **Core**: Next.js 15 (App Router), React 19, TypeScript.
- **Estilização**: Tailwind CSS + Shadcn UI (Tema customizado em HSL).
- **Backend**: Firebase (Auth e Firestore).
- **Gráficos**: Recharts.
- **IA**: Genkit com modelos Google Gemini 2.0.
- **Utilidades**: date-fns (datas), lucide-react (ícones).

---
*Este sistema é uma ferramenta de apoio voluntário, focada em precisão, simplicidade e organização.*