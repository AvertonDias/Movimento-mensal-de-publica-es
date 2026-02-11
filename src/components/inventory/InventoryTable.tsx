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
  Download, 
  Search
} from "lucide-react";
import { 
  InventoryItem, 
  InventoryColumn, 
  DEFAULT_COLUMNS,
  OFFICIAL_PUBLICATIONS
} from "@/app/types/inventory";
import { cn } from "@/lib/utils";

export function InventoryTable() {
  const [columns] = useState<InventoryColumn[]>(DEFAULT_COLUMNS);
  const [items, setItems] = useState<InventoryItem[]>(
    OFFICIAL_PUBLICATIONS.map((pub, idx) => ({
      ...pub,
      id: `official_${idx}`,
      previous: 0,
      received: 0,
      current: 0,
    }))
  );
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
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.abbr?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const handleUpdateItem = (id: string, field: string, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleExportCSV = () => {
    const headers = columns.map(c => c.header).join(',');
    const rows = filteredItems.filter(i => !i.isCategory).map(item => {
      return columns.map(col => {
        if (col.id === 'outgoing') return calculateOutgoing(item);
        return item[col.id];
      }).join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventario_mensal.csv");
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
            placeholder="Pesquisar por nome, código ou sigla..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button onClick={handleExportCSV} variant="outline" className="gap-2 h-11">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.id} className="font-bold text-foreground py-4 px-3 text-xs uppercase tracking-wider text-center">
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                if (item.isCategory) {
                  return (
                    <TableRow key={item.id} className="bg-neutral-100 hover:bg-neutral-100 border-b-2 border-neutral-200">
                      <TableCell colSpan={columns.length} className="py-2 px-4 font-black text-xs uppercase text-neutral-600 tracking-widest">
                        {item.item}
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={item.id} className="hover:bg-accent/5 transition-colors border-b last:border-0">
                    {columns.map((col) => (
                      <TableCell key={col.id} className="p-1 px-3">
                        {col.id === 'outgoing' ? (
                          <div className={cn(
                            "py-2 font-bold rounded text-sm text-center",
                            calculateOutgoing(item) < 0 ? "text-destructive bg-destructive/10" : "text-accent-foreground bg-accent/20"
                          )}>
                            {calculateOutgoing(item)}
                          </div>
                        ) : col.id === 'code' ? (
                          <div className="text-center text-xs font-bold text-muted-foreground">{item.code}</div>
                        ) : col.id === 'item' ? (
                          <div className="flex justify-between items-center gap-2 min-w-[200px]">
                            <span className="text-sm font-medium">{item.item}</span>
                            {item.abbr && <span className="text-[10px] font-black bg-neutral-200 px-1.5 py-0.5 rounded">{item.abbr}</span>}
                          </div>
                        ) : (
                          <Input
                            type="number"
                            value={item[col.id] as number}
                            onChange={(e) => handleUpdateItem(item.id, col.id, Number(e.target.value))}
                            className="border-transparent hover:border-input focus:bg-white focus:ring-1 focus:ring-primary h-9 text-sm text-center font-bold"
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    Nenhuma publicação encontrada com este termo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
