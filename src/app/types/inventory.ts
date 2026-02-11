
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
  sortOrder?: number;
  isCustom?: boolean;
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

/**
 * Lista exaustiva de publicações oficiais com mapeamento de imagem.
 * Seguindo exatamente a ordem do formulário S-28-T 8/24.
 */
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
  { code: '5427', item: 'Historias da Bíblia', abbr: 'lfb', category: 'Livros', imageKey: 'lfb' },
  { code: '5445', item: 'Seja Feliz para Sempre! (livro)*', abbr: 'lff', category: 'Livros', imageKey: 'lff' },
  { code: '5415', item: 'Instrutor', abbr: 'lr', category: 'Livros', imageKey: 'lr' },
  { code: '5343', item: 'Continue', abbr: 'lvs', category: 'Livros', imageKey: 'lvs' },
  { code: '5332', item: 'Organizados', abbr: 'od', category: 'Livros', imageKey: 'od' },
  { code: '5435', item: 'Adoração Pura', abbr: 'rr', category: 'Livros', imageKey: 'rr' },
  { code: '5440', item: 'Princípios Bíblicos para a Vida Cristã', abbr: 'scl', category: 'Livros', imageKey: 'scl' },
  { code: '5341', item: 'Cante de Coração', abbr: 'sjj', category: 'Livros', imageKey: 'sjj' },
  { code: '5441', item: 'Cante de Coração o (tamanho grande)', abbr: 'sjjls', category: 'Livros', imageKey: 'sjj' },
  { code: '5442', item: 'Cante de Coração — Apenas Letras', abbr: 'sjjyls', category: 'Livros', imageKey: 'sjj' },
  { code: '5339', item: 'Jovens Perguntam, Volume 1', abbr: 'yp1', category: 'Livros', imageKey: 'yp1' },
  { code: '5336', item: 'Jovens Perguntam, Volume 2', abbr: 'yp2', category: 'Livros', imageKey: 'yp2' },
  
  { code: '', item: 'Brochuras e livretos', category: 'Brochuras', isCategory: true },
  { code: '6618', item: 'Leitura e Escrita', abbr: 'ay', category: 'Brochuras', imageKey: 'ay' },
  { code: '6628', item: 'Educação', abbr: 'ed', category: 'Brochuras', imageKey: 'ed' },
  { code: '6659', item: 'Boas Notícias', abbr: 'fg', category: 'Brochuras', imageKey: 'fg' },
  { code: '6665', item: 'Família', abbr: 'hf', category: 'Brochuras', imageKey: 'hf' },
  { code: '6662', item: 'Vida Feliz', abbr: 'hl', category: 'Brochuras', imageKey: 'hl' },
  { code: '6647', item: 'Vida Satisfatória', abbr: 'la', category: 'Brochuras', imageKey: 'la' },
  { code: '6654', item: 'A Vida — Teve um Criador?*', abbr: 'lc', category: 'Brochuras', imageKey: 'lc' },
  { code: '6658', item: 'Escute a Deus', abbr: 'ld', category: 'Brochuras', imageKey: 'ld' },
  { code: '6655', item: 'Origem da Vida*', abbr: 'lf', category: 'Brochuras', imageKey: 'lf' },
  { code: '65445', item: 'Seja Feliz para Sempre! (brochura)*', abbr: 'lffi', category: 'Brochuras', imageKey: 'lff' },
  { code: '6657', item: 'Escute e Viva*', abbr: 'll', category: 'Brochuras' },
  { code: '6669', item: 'Ame as Pessoas', abbr: 'lmd', category: 'Brochuras', imageKey: 'lmd' },
  { code: '6663', item: 'Minhas Lições da Bíblia', abbr: 'mb', category: 'Brochuras', imageKey: 'mb' },
  { code: '6648', item: 'Caminho para a Vida', abbr: 'ol', category: 'Brochuras', imageKey: 'ol' },
  { code: '6639', item: 'Verdadeira Paz e Felicidade', abbr: 'pc', category: 'Brochuras', imageKey: 'pc' },
  { code: '6653', item: 'Caminho', abbr: 'ph', category: 'Brochuras', imageKey: 'ph' },
  { code: '6671', item: 'Volte para Jeová', abbr: 'rj', category: 'Brochuras', imageKey: 'rj' },
  { code: '6656', item: 'Verdadeira Fé', abbr: 'rk', category: 'Brochuras', imageKey: 'rk' },
  { code: '6630', item: 'Espíritos dos Mortos', abbr: 'sp', category: 'Brochuras', imageKey: 'sp' },
  { code: '6667', item: 'Melhore', abbr: 'th', category: 'Brochuras', imageKey: 'th' },
  { code: '6670', item: 'Aprenda com a Sabedoria de Jesus', abbr: 'wfg', category: 'Brochuras', imageKey: 'wfg' },
  { code: '6684', item: '10 Perguntas', abbr: 'ypq', category: 'Brochuras', imageKey: 'ypq' },
  
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
  { code: '8410', item: 'Cartão de visita (imagem da Bíblia aberta)*', abbr: 'jwcd1', category: 'Cartões', imageKey: 'jwcd1' },
  { code: '8521', item: 'Cartão de visita (apenas o logo do jw.org)*', abbr: 'jwcd4', category: 'Cartões', imageKey: 'jwcd4' },
  { code: '8569', item: 'Cartão de visita (curso bíblico presencial)*', abbr: 'jwcd9', category: 'Cartões', imageKey: 'jwcd9' },
  { code: '8570', item: 'Cartão de visita (curso bíblico pela internet)*', abbr: 'jwcd10', category: 'Cartões', imageKey: 'jwcd10' },
  { code: '', item: 'Outros cartões de visita', category: 'Cartões' },
  
  { code: '', item: 'A Sentinela', category: 'Revistas', isCategory: true },
  { code: '', item: 'A Sentinela', abbr: 'wp18.1', category: 'Revistas', imageKey: 'wp18.1' },
  { code: '', item: 'A Sentinela', abbr: 'wp18.2', category: 'Revistas', imageKey: 'wp18.2' },
  { code: '', item: 'A Sentinela', abbr: 'wp18.3', category: 'Revistas', imageKey: 'wp18.3' },
  { code: '', item: 'A Sentinela', abbr: 'wp19.1', category: 'Revistas', imageKey: 'wp19.1' },
  { code: '', item: 'A Sentinela', abbr: 'wp19.2', category: 'Revistas', imageKey: 'wp19.2' },
  { code: '', item: 'A Sentinela', abbr: 'wp19.3', category: 'Revistas', imageKey: 'wp19.3' },
  { code: '', item: 'A Sentinela', abbr: 'wp20.1', category: 'Revistas', imageKey: 'wp20.1' },
  { code: '', item: 'A Sentinela', abbr: 'wp20.2', category: 'Revistas', imageKey: 'wp20.2' },
  { code: '', item: 'A Sentinela', abbr: 'wp20.3', category: 'Revistas', imageKey: 'wp20.3' },
  { code: '', item: 'A Sentinela', abbr: 'wp21.1', category: 'Revistas', imageKey: 'wp21.1' },
  { code: '', item: 'A Sentinela', abbr: 'wp21.2', category: 'Revistas', imageKey: 'wp21.2' },
  { code: '', item: 'A Sentinela', abbr: 'wp21.3', category: 'Revistas', imageKey: 'wp21.3' },
  { code: '', item: 'A Sentinela', abbr: 'wp22.1', category: 'Revistas', imageKey: 'wp22.1' },
  { code: '', item: 'A Sentinela', abbr: 'wp23.1', category: 'Revistas', imageKey: 'wp23.1' },
  { code: '', item: 'A Sentinela', abbr: 'wp24.1', category: 'Revistas', imageKey: 'wp24.1' },
  
  { code: '', item: 'Despertai!', category: 'Revistas', isCategory: true },
  { code: '', item: 'Despertai!', abbr: 'g18.1', category: 'Revistas', imageKey: 'g18.1' },
  { code: '', item: 'Despertai!', abbr: 'g18.2', category: 'Revistas', imageKey: 'g18.2' },
  { code: '', item: 'Despertai!', abbr: 'g18.3', category: 'Revistas', imageKey: 'g18.3' },
  { code: '', item: 'Despertai!', abbr: 'g19.1', category: 'Revistas', imageKey: 'g19.1' },
  { code: '', item: 'Despertai!', abbr: 'g19.2', category: 'Revistas', imageKey: 'g19.2' },
  { code: '', item: 'Despertai!', abbr: 'g19.3', category: 'Revistas', imageKey: 'g19.3' },
  { code: '', item: 'Despertai!', abbr: 'g20.1', category: 'Revistas', imageKey: 'g20.1' },
  { code: '', item: 'Despertai!', abbr: 'g20.2', category: 'Revistas', imageKey: 'g20.2' },
  { code: '', item: 'Despertai!', abbr: 'g20.3', category: 'Revistas', imageKey: 'g20.3' },
  { code: '', item: 'Despertai!', abbr: 'g21.1', category: 'Revistas', imageKey: 'g21.1' },
  { code: '', item: 'Despertai!', abbr: 'g21.2', category: 'Revistas', imageKey: 'g21.2' },
  { code: '', item: 'Despertai!', abbr: 'g21.3', category: 'Revistas', imageKey: 'g21.3' },
  { code: '', item: 'Despertai!', abbr: 'g22.1', category: 'Revistas', imageKey: 'g22.1' },
  { code: '', item: 'Despertai!', abbr: 'g23.1', category: 'Revistas', imageKey: 'g23.1' },
  { code: '', item: 'Despertai!', abbr: 'g24.1', category: 'Revistas', imageKey: 'g24.1' },
  
  { code: '', item: 'Todas as outras revistas para o público', category: 'Revistas' },
];
