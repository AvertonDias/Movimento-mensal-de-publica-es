"use client"

import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Trash2, 
  Download, 
  Search,
  FileSpreadsheet,
  Calculator
} from "lucide-react";
import { 
  InventoryItem, 
  InventoryColumn, 
  DEFAULT_COLUMNS 
} from "@/app/types/inventory";
import { cn } from "@/lib/utils";
import { ColumnManager } from "./ColumnManager";
import { AIInsights } from "./AIInsights";

export function InventoryTable() {
  const [columns, setColumns] = useState<InventoryColumn[]>(DEFAULT_COLUMNS);
  const [items, setItems] = useState<InventoryItem[]>([
    { id: '1', code: '3140', item: 'Tradução do Novo Mundo (nwt)', category: 'Bíblias', previous: 212, received: 0, current: 181 },
    { id: '2', code: '3142', item: 'Tradução do Novo Mundo - Bolso (nwtpkt)', category: 'Bíblias', previous: 45, received: 10, current: 32 },
    { id: '3', code: '5414', item: 'Beneficie-se (be)', category: 'Livros', previous: 15, received: 0, current: 12 },
    { id: '4', code: '5340', item: 'Entenda a Bíblia (bhs)', category: 'Livros', previous: 30, received: 50, current: 65 },
    { id: '5', code: '5445', item: 'Seja Feliz para Sempre! - livro (lff)', category: 'Livros', previous: 120, received: 100, current: 150 },
    { id: '6', code: '6618', item: 'Leitura e Escrita (ay)', category: 'Brochuras e livretos', previous: 10, received: 0, current: 8 },
    { id: '7', code: '6545', item: 'Seja Feliz para Sempre! - brochura (lffi)', category: 'Brochuras e livretos', previous: 80, received: 40, current: 95 },
    { id: '8', code: '6659', item: 'Boas Notícias (fg)', category: 'Brochuras e livretos', previous: 50, received: 0, current: 42 },
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const calculateTotal = (item: InventoryItem) => {
    return (Number(item.previous) || 0) + (Number(item.received) || 0);
  };

  const calculateOutgoing = (item: InventoryItem) => {
    const total = calculateTotal(item);
    const current = Number(item.current) || 0;
    return total - current;
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [items, searchTerm]);

  const handleAddItem = () => {
    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      code: '',
      item: '',
      category: '',
      previous: 0,
      received: 0,
      current: 0,
    };
    columns.forEach(col => {
      if (col.isCustom) newItem[col.id] = col.type === 'number' ? 0 : '';
    });
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: string, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleExportCSV = () => {
    const headers = columns.map(c => c.header).join(',');
    const rows = filteredItems.map(item => {
      return columns.map(col => {
        if (col.id === 'total') return calculateTotal(item);
        if (col.id === 'outgoing') return calculateOutgoing(item);
        return item[col.id];
      }).join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "movimento_mensal_publicacoes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar publicação ou código..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <ColumnManager columns={columns} setColumns={setColumns} />
          <Button onClick={handleExportCSV} variant="outline" className="gap-2 h-11">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button onClick={handleAddItem} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11">
            <Plus className="h-4 w-4" /> Nova Linha
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.id} className="font-bold text-foreground py-4 px-3 text-xs uppercase tracking-wider">
                    {col.header}
                  </TableHead>
                ))}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-accent/5 transition-colors border-b last:border-0">
                  {columns.map((col) => (
                    <TableCell key={col.id} className="p-1 px-3">
                      {col.id === 'total' ? (
                        <div className="bg-muted/50 font-bold text-center py-2 rounded text-sm text-muted-foreground">
                          {calculateTotal(item)}
                        </div>
                      ) : col.id === 'outgoing' ? (
                        <div className={cn(
                          "py-2 font-bold rounded text-sm text-center",
                          calculateOutgoing(item) < 0 ? "text-destructive bg-destructive/10" : "text-accent-foreground bg-accent/20"
                        )}>
                          {calculateOutgoing(item)}
                        </div>
                      ) : (
                        <Input
                          type={col.type === 'number' ? 'number' : 'text'}
                          value={item[col.id]}
                          onChange={(e) => handleUpdateItem(item.id, col.id, col.type === 'number' ? Number(e.target.value) : e.target.value)}
                          className="border-transparent hover:border-input focus:bg-white focus:ring-1 focus:ring-primary h-9 text-sm text-foreground"
                        />
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="h-32 text-center text-muted-foreground">
                    Nenhum item encontrado no formulário.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AIInsights inventoryData={JSON.stringify(items)} />
        </div>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border space-y-6">
            <h3 className="font-bold flex items-center gap-2 text-lg text-primary">
              <Calculator className="h-5 w-5" />
              Resumo Consolidado
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-dashed">
                <span className="text-muted-foreground text-sm">Total Anterior:</span>
                <span className="font-bold">{items.reduce((acc, curr) => acc + (Number(curr.previous) || 0), 0)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-dashed">
                <span className="text-muted-foreground text-sm">Total Recebido:</span>
                <span className="font-bold text-primary">{items.reduce((acc, curr) => acc + (Number(curr.received) || 0), 0)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-dashed">
                <span className="text-muted-foreground text-sm">Estoque Atual:</span>
                <span className="font-bold">{items.reduce((acc, curr) => acc + (Number(curr.current) || 0), 0)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-foreground">Total de Saídas:</span>
                <div className="bg-accent px-3 py-1 rounded-full text-accent-foreground font-black text-lg">
                  {items.reduce((acc, curr) => acc + calculateOutgoing(curr), 0)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
            <p className="text-xs text-primary-foreground/80 italic leading-relaxed">
              * A "Saída" é calculada automaticamente: (Anterior + Recebido) - Estoque Atual. 
              Certifique-se de preencher o "Estoque Atual" após a conferência física.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
