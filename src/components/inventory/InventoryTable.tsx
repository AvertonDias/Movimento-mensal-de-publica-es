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
  Settings2,
  ChevronLeft,
  ChevronRight
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
    { id: '1', item: 'Folhetos', category: 'Publicações', initial: 100, received: 50, outgoing: 20 },
    { id: '2', item: 'Revistas', category: 'Publicações', initial: 200, received: 0, outgoing: 150 },
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const calculateBalance = (item: InventoryItem) => {
    const initial = Number(item.initial) || 0;
    const received = Number(item.received) || 0;
    const outgoing = Number(item.outgoing) || 0;
    return initial + received - outgoing;
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
      item: '',
      category: '',
      initial: 0,
      received: 0,
      outgoing: 0,
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
        if (col.id === 'balance') return calculateBalance(item);
        return item[col.id];
      }).join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventario_facil.csv");
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
            placeholder="Pesquisar itens..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <ColumnManager columns={columns} setColumns={setColumns} />
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
          <Button onClick={handleAddItem} className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
            <Plus className="h-4 w-4" /> Novo Item
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.id} className="font-bold text-foreground">
                    {col.header}
                  </TableHead>
                ))}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-accent/10 transition-colors">
                  {columns.map((col) => (
                    <TableCell key={col.id} className="p-2">
                      {col.id === 'balance' ? (
                        <div className={cn(
                          "px-3 py-2 font-bold rounded-md text-sm",
                          calculateBalance(item) < 10 ? "text-destructive bg-destructive/10" : "text-accent-foreground bg-accent/20"
                        )}>
                          {calculateBalance(item)}
                        </div>
                      ) : (
                        <Input
                          type={col.type === 'number' ? 'number' : 'text'}
                          value={item[col.id]}
                          onChange={(e) => handleUpdateItem(item.id, col.id, col.type === 'number' ? Number(e.target.value) : e.target.value)}
                          className="border-transparent hover:border-input focus:border-primary focus:ring-1 focus:ring-primary h-9"
                        />
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="h-32 text-center text-muted-foreground">
                    Nenhum item encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AIInsights inventoryData={JSON.stringify(items)} />
    </div>
  );
}
