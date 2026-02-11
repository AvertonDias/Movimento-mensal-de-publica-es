
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
  imageKey?: string;
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
  { code: '3140', item: 'Tradução do Novo Mundo', abbr: 'nwt', category: 'Bíblias', imageKey: 'nwt' },
  { code: '3142', item: 'Tradução do Novo Mundo (pequena)', abbr: 'nwtpkt', category: 'Bíblias', imageKey: 'nwt' },
  { code: '', item: 'Outras Bíblias', category: 'Bíblias' },
  { code: '', item: 'Livros', category: 'Livros', isCategory: true },
  { code: '5414', item: 'Beneficie-se', abbr: 'be', category: 'Livros', imageKey: 'be' },
  { code: '5340', item: 'Entenda a Bíblia', abbr: 'bhs', category: 'Livros', imageKey: 'bhs' },
  { code: '5416', item: 'Testemunho Cabal', abbr: 'bt', category: 'Livros', imageKey: 'bt' },
  { code: '5231', item: "'Meu Seguidor'", abbr: 'cf', category: 'Livros', imageKey: 'cf' },
  { code: '5331', item: 'Achegue-se', abbr: 'cl', category: 'Livros', imageKey: 'cl' },
  { code: '5419', item: 'Imite a Sua Fé', abbr: 'ia', category: 'Livros', imageKey: 'ia' },
  { code: '5425', item: 'Jesus — O Caminho', abbr: 'jy', category: 'Livros', imageKey: 'jy' },
  { code: '5422', item: 'O Reino de Deus já Governa!', abbr: 'kr', category: 'Livros', imageKey: 'kr' },
  { code: '5427', item: 'Histórias da Bíblia', abbr: 'lfb', category: 'Livros', imageKey: 'lfb' },
  { code: '5445', item: 'Seja Feliz para Sempre! (livro)*', abbr: 'lff', category: 'Livros', imageKey: 'lff' },
  { code: '5415', item: 'Instrutor', abbr: 'lr', category: 'Livros' },
  { code: '5343', item: 'Continue', abbr: 'lvs', category: 'Livros', imageKey: 'lvs' },
  { code: '5332', item: 'Organizados', abbr: 'od', category: 'Livros', imageKey: 'od' },
  { code: '5435', item: 'Adoração Pura', abbr: 'rr', category: 'Livros', imageKey: 'rr' },
  { code: '5440', item: 'Princípios Bíblicos para a Vida Cristã', abbr: 'scl', category: 'Livros' },
  { code: '5341', item: 'Cante de Coração', abbr: 'sjj', category: 'Livros' },
  { code: '5441', item: 'Cante de Coração (tamanho grande)', abbr: 'sjjls', category: 'Livros' },
  { code: '5442', item: 'Cante de Coração — Apenas Letras', abbr: 'sjjyls', category: 'Livros' },
  { code: '5339', item: 'Jovens Perguntam, Volume 1', abbr: 'yp1', category: 'Livros', imageKey: 'yp1' },
  { code: '5336', item: 'Jovens Perguntam, Volume 2', abbr: 'yp2', category: 'Livros', imageKey: 'yp2' },
  { code: '5001', item: 'Estudo Perspicaz, Vol. 1', abbr: 'it-1', category: 'Livros', imageKey: 'it1' },
  { code: '5002', item: 'Estudo Perspicaz, Vol. 2', abbr: 'it-2', category: 'Livros', imageKey: 'it2' },
  { code: '', item: 'Outros livros', category: 'Livros' },
  { code: '', item: 'Brochuras e livretos', category: 'Brochuras', isCategory: true },
  { code: '6618', item: 'Leitura e Escrita', abbr: 'ay', category: 'Brochuras' },
  { code: '6628', item: 'Educação', abbr: 'ed', category: 'Brochuras' },
  { code: '6659', item: 'Boas Notícias', abbr: 'fg', category: 'Brochuras', imageKey: 'fg' },
  { code: '6665', item: 'Família', abbr: 'hf', category: 'Brochuras' },
  { code: '6662', item: 'Vida Feliz', abbr: 'hl', category: 'Brochuras' },
  { code: '6647', item: 'Vida Satisfatória', abbr: 'la', category: 'Brochuras' },
  { code: '6634', item: 'A Vida — Teve um Criador?*', abbr: 'lc', category: 'Brochuras' },
  { code: '6658', item: 'Escute a Deus', abbr: 'ld', category: 'Brochuras' },
  { code: '6655', item: 'Origem da Vida*', abbr: 'lf', category: 'Brochuras' },
  { code: '6545', item: 'Seja Feliz para Sempre! (brochura)*', abbr: 'lffi', category: 'Brochuras', imageKey: 'lff' },
  { code: '6669', item: 'Ame as Pessoas', abbr: 'lmd', category: 'Brochuras', imageKey: 'lmd' },
  { code: '6663', item: 'Minhas Lições da Bíblia', abbr: 'mb', category: 'Brochuras', imageKey: 'mb' },
  { code: '6648', item: 'Caminho para a Vida', abbr: 'ol', category: 'Brochuras' },
  { code: '6639', item: 'Verdadeira Paz e Felicidade', abbr: 'pc', category: 'Brochuras' },
  { code: '6653', item: 'Caminho', abbr: 'ph', category: 'Brochuras' },
  { code: '6671', item: 'Volte para Jeová', abbr: 'rj', category: 'Brochuras' },
  { code: '6656', item: 'Verdadeira Fé', abbr: 'rk', category: 'Brochuras' },
  { code: '6630', item: 'Espíritos dos Mortos', abbr: 'sp', category: 'Brochuras' },
  { code: '6667', item: 'Melhore', abbr: 'th', category: 'Brochuras', imageKey: 'th' },
  { code: '6670', item: 'Aprenda com a Sabedoria de Jesus', abbr: 'wfg', category: 'Brochuras' },
  { code: '6684', item: '10 Perguntas', abbr: 'ypq', category: 'Brochuras' },
  { code: '6620', item: 'Um Livro para Todas as Pessoas', abbr: 'ba', category: 'Brochuras', imageKey: 'ba' },
  { code: '6625', item: 'Testemunhas de Jeová — Quem São?', abbr: 'jt', category: 'Brochuras', imageKey: 'jt' },
  { code: '', item: 'Outras brochuras e livretos', category: 'Brochuras' },
  { code: '', item: 'Folhetos e convites (1 maço de 2,5 cm = 300)', category: 'Folhetos', isCategory: true },
  { code: '7305', item: 'Convite para reuniões cristãs*', abbr: 'inv', category: 'Folhetos', imageKey: 'inv' },
  { code: '7130', item: 'O Que Você Acha da Bíblia?*', abbr: 'T-30', category: 'Folhetos', imageKey: 'T-30' },
  { code: '7131', item: 'O Que Você Espera do Futuro?*', abbr: 'T-31', category: 'Folhetos', imageKey: 'T-31' },
  { code: '7132', item: 'Segredo para Família Feliz*', abbr: 'T-32', category: 'Folhetos', imageKey: 'T-32' },
  { code: '7133', item: 'Quem Controla o Mundo?*', abbr: 'T-33', category: 'Folhetos', imageKey: 'T-33' },
  { code: '7134', item: 'O Sofrimento Vai Acabar?*', abbr: 'T-34', category: 'Folhetos', imageKey: 'T-34' },
  { code: '7135', item: 'Voltar a Viver*', abbr: 'T-35', category: 'Folhetos', imageKey: 'T-35' },
  { code: '7136', item: 'Reino*', abbr: 'T-36', category: 'Folhetos', imageKey: 'T-36' },
  { code: '7137', item: 'Respostas Importantes*', abbr: 'T-37', category: 'Folhetos', imageKey: 'T-37' },
  { code: '7138', item: 'O Reino de Deus — O que é para você?*', abbr: 'T-38', category: 'Folhetos', imageKey: 'T-38' },
  { code: '7139', item: 'Onde encontrar as respostas?*', abbr: 'T-39', category: 'Folhetos', imageKey: 'T-39' },
  { code: '', item: 'Outros folhetos e convites', category: 'Folhetos' },
  { code: '', item: 'Cartões de visita', category: 'Cartões', isCategory: true },
  { code: '8410', item: 'Cartão de visita (imagem da Bíblia aberta)*', abbr: 'jwcd1', category: 'Cartões' },
  { code: '8521', item: 'Cartão de visita (apenas o logo do jw.org)*', abbr: 'jwcd4', category: 'Cartões' },
  { code: '8569', item: 'Cartão de visita (curso bíblico presencial)*', abbr: 'jwcd9', category: 'Cartões' },
  { code: '8570', item: 'Cartão de visita (curso bíblico pela internet)*', abbr: 'jwcd10', category: 'Cartões' },
  { code: '', item: 'Outros cartões de visita', category: 'Cartões' },
  { code: '', item: 'Revistas para o público', category: 'Revistas', isCategory: true },
  { code: '', item: 'Despertai! N.º 1 2024*', abbr: 'g24.1', category: 'Revistas', imageKey: 'g24' },
  { code: '', item: 'Sentinela N.º 1 2024*', abbr: 'wp24.1', category: 'Revistas', imageKey: 'wp24' },
  { code: '', item: 'Despertai! N.º 1 2023*', abbr: 'g23.1', category: 'Revistas' },
  { code: '', item: 'Sentinela N.º 1 2023*', abbr: 'wp23.1', category: 'Revistas' },
  { code: '', item: 'Todas as outras revistas para o público', category: 'Revistas' },
];
