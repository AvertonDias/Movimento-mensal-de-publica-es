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
  { id: 'previous', header: 'Anterior', type: 'number' },
  { id: 'received', header: 'Recebido', type: 'number' },
  { id: 'total', header: 'Total (Ant + Rec)', type: 'calculated' },
  { id: 'current', header: 'Estoque Atual', type: 'number' },
  { id: 'outgoing', header: 'Saída', type: 'calculated' },
];
