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
  [key: string]: string | number;
}

export const DEFAULT_COLUMNS: InventoryColumn[] = [
  { id: 'code', header: 'N.º do Item', type: 'text' },
  { id: 'item', header: 'Publicação', type: 'text' },
  { id: 'category', header: 'Categoria', type: 'text' },
  { id: 'previous', header: 'Estoque Anterior', type: 'number' },
  { id: 'received', header: 'Recebido', type: 'number' },
  { id: 'current', header: 'Estoque Atual', type: 'number' },
  { id: 'outgoing', header: 'Saída (Calculada)', type: 'calculated' },
];
