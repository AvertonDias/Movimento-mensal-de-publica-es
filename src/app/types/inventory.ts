export type ColumnType = 'text' | 'number' | 'calculated';

export interface InventoryColumn {
  id: string;
  header: string;
  type: ColumnType;
  isCustom?: boolean;
}

export interface InventoryItem {
  id: string;
  code: string;
  item: string;
  category: string;
  previous: number;
  received: number;
  current: number;
  abbr?: string;
  isCategory?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export const DEFAULT_COLUMNS: InventoryColumn[] = [
  { id: 'code', header: 'N.º', type: 'text' },
  { id: 'item', header: 'Publicação', type: 'text' },
  { id: 'previous', header: 'Estoque Anterior', type: 'number' },
  { id: 'received', header: 'Recebido', type: 'number' },
  { id: 'current', header: 'Estoque Atual', type: 'number' },
  { id: 'outgoing', header: 'Saída', type: 'calculated' },
];

export const OFFICIAL_PUBLICATIONS: Omit<InventoryItem, 'id' | 'previous' | 'received' | 'current'>[] = [
  { code: '', item: 'Bíblias', category: 'Bíblias', isCategory: true },
  { code: '3140', item: 'Tradução do Novo Mundo', abbr: 'nwt', category: 'Bíblias' },
  { code: '3142', item: 'Tradução do Novo Mundo (pequena)', abbr: 'nwtpkt', category: 'Bíblias' },
  { code: '', item: 'Outras Bíblias', category: 'Bíblias' },
  { code: '', item: 'Livros', category: 'Livros', isCategory: true },
  { code: '5414', item: 'Beneficie-se', abbr: 'be', category: 'Livros' },
  { code: '5340', item: 'Entenda a Bíblia', abbr: 'bhs', category: 'Livros' },
  { code: '5416', item: 'Testemunho Cabal', abbr: 'bt', category: 'Livros' },
  { code: '5231', item: "'Meu Seguidor'", abbr: 'cf', category: 'Livros' },
  { code: '5331', item: 'Achegue-se', abbr: 'cl', category: 'Livros' },
  { code: '5419', item: 'Imite', abbr: 'ia', category: 'Livros' },
  { code: '5425', item: 'Jesus — O Caminho', abbr: 'jy', category: 'Livros' },
  { code: '5422', item: 'O Reino de Deus já Governa!', abbr: 'kr', category: 'Livros' },
  { code: '5427', item: 'Histórias da Bíblia', abbr: 'lfb', category: 'Livros' },
  { code: '5445', item: 'Seja Feliz para Sempre! (livro)*', abbr: 'lff', category: 'Livros' },
  { code: '5415', item: 'Instrutor', abbr: 'lr', category: 'Livros' },
  { code: '5343', item: 'Continue', abbr: 'lvs', category: 'Livros' },
  { code: '5332', item: 'Organizados', abbr: 'od', category: 'Livros' },
  { code: '5435', item: 'Adoração Pura', abbr: 'rr', category: 'Livros' },
  { code: '5440', item: 'Princípios Bíblicos para a Vida Cristã', abbr: 'scl', category: 'Livros' },
  { code: '5341', item: 'Cante de Coração', abbr: 'sjj', category: 'Livros' },
  { code: '5441', item: 'Cante de Coração (tamanho grande)', abbr: 'sjjls', category: 'Livros' },
  { code: '5442', item: 'Cante de Coração — Apenas Letras', abbr: 'sjjyls', category: 'Livros' },
  { code: '5339', item: 'Jovens Perguntam, Volume 1', abbr: 'yp1', category: 'Livros' },
  { code: '5336', item: 'Jovens Perguntam, Volume 2', abbr: 'yp2', category: 'Livros' },
  { code: '', item: 'Outros livros', category: 'Livros' },
  { code: '', item: 'Brochuras e livretos', category: 'Brochuras', isCategory: true },
  { code: '6618', item: 'Leitura e Escrita', abbr: 'ay', category: 'Brochuras' },
  { code: '6628', item: 'Educação', abbr: 'ed', category: 'Brochuras' },
  { code: '6659', item: 'Boas Notícias', abbr: 'fg', category: 'Brochuras' },
  { code: '6665', item: 'Família', abbr: 'hf', category: 'Brochuras' },
  { code: '6662', item: 'Vida Feliz', abbr: 'hl', category: 'Brochuras' },
  { code: '6647', item: 'Vida Satisfatória', abbr: 'la', category: 'Brochuras' },
  { code: '6634', item: 'A Vida — Teve um Criador?*', abbr: 'lc', category: 'Brochuras' },
  { code: '6658', item: 'Escute a Deus', abbr: 'ld', category: 'Brochuras' },
  { code: '6655', item: 'Origem da Vida*', abbr: 'lf', category: 'Brochuras' },
  { code: '6545', item: 'Seja Feliz para Sempre! (brochura)*', abbr: 'lffi', category: 'Brochuras' },
  { code: '6657', item: 'Escute e Viva*', abbr: 'll', category: 'Brochuras' },
  { code: '6669', item: 'Ame as Pessoas', abbr: 'lmd', category: 'Brochuras' },
  { code: '6663', item: 'Minhas Lições da Bíblia', abbr: 'mb', category: 'Brochuras' },
  { code: '6648', item: 'Caminho para a Vida', abbr: 'ol', category: 'Brochuras' },
  { code: '6639', item: 'Verdadeira Paz e Felicidade', abbr: 'pc', category: 'Brochuras' },
  { code: '6653', item: 'Caminho', abbr: 'ph', category: 'Brochuras' },
  { code: '6671', item: 'Volte para Jeová', abbr: 'rj', category: 'Brochuras' },
  { code: '6656', item: 'Verdadeira Fé', abbr: 'rk', category: 'Brochuras' },
  { code: '6630', item: 'Espíritos dos Mortos', abbr: 'sp', category: 'Brochuras' },
  { code: '6667', item: 'Melhore', abbr: 'th', category: 'Brochuras' },
  { code: '6670', item: 'Sabedoria de Jesus', abbr: 'wfg', category: 'Brochuras' },
  { code: '6684', item: '10 Perguntas', abbr: 'ypq', category: 'Brochuras' },
  { code: '', item: 'Outras brochuras e livretos', category: 'Brochuras' },
  { code: '', item: 'Folhetos e convites', category: 'Folhetos', isCategory: true },
  { code: '7305', item: 'Convite para reuniões*', abbr: 'inv', category: 'Folhetos' },
  { code: '7130', item: 'O Que Você Acha da Bíblia?*', abbr: 'T-30', category: 'Folhetos' },
  { code: '7131', item: 'O Que Você Espera do Futuro?*', abbr: 'T-31', category: 'Folhetos' },
  { code: '7132', item: 'Segredo para Família Feliz*', abbr: 'T-32', category: 'Folhetos' },
  { code: '7133', item: 'Quem Controla o Mundo?*', abbr: 'T-33', category: 'Folhetos' },
  { code: '7134', item: 'O Sofrimento Vai Acabar?*', abbr: 'T-34', category: 'Folhetos' },
  { code: '7135', item: 'Voltar a Viver*', abbr: 'T-35', category: 'Folhetos' },
  { code: '7136', item: 'Reino*', abbr: 'T-36', category: 'Folhetos' },
  { code: '7137', item: 'Respostas Importantes*', abbr: 'T-37', category: 'Folhetos' },
  { code: '', item: 'Outros folhetos e convites', category: 'Folhetos' },
  { code: '', item: 'Cartões de visita', category: 'Cartões', isCategory: true },
  { code: '8410', item: 'Imagem Bíblia aberta*', abbr: 'jwcd1', category: 'Cartões' },
  { code: '8521', item: 'Apenas o logo*', abbr: 'jwcd4', category: 'Cartões' },
  { code: '8569', item: 'Curso presencial*', abbr: 'jwcd9', category: 'Cartões' },
  { code: '8570', item: 'Curso internet*', abbr: 'jwcd10', category: 'Cartões' },
  { code: '', item: 'Revistas para o público', category: 'Revistas', isCategory: true },
  { code: '', item: 'Todas as revistas para o público', category: 'Revistas' },
];
