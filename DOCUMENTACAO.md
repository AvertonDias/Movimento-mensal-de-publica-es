# Documentação Técnica Completa - S-28 Digital


## 1. Visão Geral
O S-28 Digital é uma ferramenta avançada para gestão de inventário de publicações, substituindo o formulário físico S-28-T por uma interface digital inteligente, colaborativa e integrada com IA.

## 2. Funcionalidades de Inventário

### 2.1 Gestão de Dados Mensais
- **Colunas Oficiais**: Suporte total para "Estoque Anterior", "Recebido", "Estoque Atual" e a calculada "Saída".
- **Cálculo Automático de Saída**: A coluna "Saída" é processada em tempo real pela fórmula: `(Anterior + Recebido) - Estoque Atual`.
- **Inteligência de Preenchimento (Zero Automático)**: Por padrão, a coluna **Estoque Atual** é preenchida com **0** para agilizar o processo. Além disso, ao clicar no campo, o valor é selecionado automaticamente para substituição rápida.
- **Navegação Temporal**: Seletor de mês/ano intuitivo, permitindo preparar meses futuros ou consultar o histórico.
- **Herança de Estoque**: O sistema busca automaticamente o "Estoque Atual" do mês anterior para preencher o "Estoque Anterior" do mês corrente.

### 2.2 Interface e Usabilidade
- **Identificação Visual**: Popover com a **capa oficial** ao clicar no nome de uma publicação (integrado com jw.org).
- **Categorização Inteligente**: Títulos de categorias com informações técnicas (como medidas de maços) são formatados automaticamente para melhor leitura.
- **Busca Global**: Filtro por nome, código (N.º) ou sigla da publicação.

### 2.3 Relatórios e Estatísticas
- **Relatório de Saldo Físico**: Página que oculta itens sem movimentação, focando no estoque real do balcão.
- **Dashboard de Estatísticas**: Análise dos últimos 6 meses (baseado em meses fechados), distribuição por categoria e Top 10 itens mais distribuídos.

## 3. Fluxo de Publicação (Deploy na Vercel)

Para que as melhorias feitas aqui apareçam no seu link oficial, execute estes comandos no terminal:

1. **Preparar mudanças**: `git add .`
2. **Gravar alterações**: `git commit -m "Descreva suas melhorias aqui"`
3. **Enviar para o site**: `git push origin main --force`

*Nota: Após o push, a Vercel leva cerca de 1 minuto para atualizar o site.*

## 4. Tecnologias Utilizadas
- **Core**: Next.js 15, React 19, TypeScript.
- **Backend**: Firebase (Auth e Firestore).
- **IA**: Genkit com Gemini 2.5 Flash.
- **Estilização**: Tailwind CSS + Shadcn UI.

---
*Este sistema é uma ferramenta de apoio voluntário, focada em precisão, simplicidade e organização.*