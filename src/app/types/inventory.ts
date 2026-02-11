export type ColumnType = 'text' | 'number' | 'calculated';

export interface InventoryColumn {
  id: string;
  header: string;
  type: ColumnType;
  isCustom?: boolean;
}

export interface InventoryItem {
  id: string;
  [key: string]: string | number;
}

export const DEFAULT_COLUMNS: InventoryColumn[] = [
  { id: 'item', header: 'Nome do Item', type: 'text' },
  { id: 'category', header: 'Categoria', type: 'text' },
  { id: 'initial', header: 'Estoque Inicial', type: 'number' },
  { id: 'received', header: 'Recebido', type: 'number' },
  { id: 'outgoing', header: 'Saída', type: 'number' },
  { id: 'balance', header: 'Saldo Atual', type: 'calculated' },
];
