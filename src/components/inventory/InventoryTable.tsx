
"use client"

import React, { useState, useMemo, useEffect } from 'react';
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
  Search,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { 
  InventoryItem, 
  InventoryColumn, 
  OFFICIAL_PUBLICATIONS
} from "@/app/types/inventory";
import { cn } from "@/lib/utils";
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking 
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase/provider';
import { format, subMonths, addMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function InventoryTable() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  
  // Define o mês inicial como o mês anterior ao atual
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => startOfMonth(subMonths(new Date(), 1)));
  const [searchTerm, setSearchTerm] = useState('');
  const [localData, setLocalData] = useState<Record<string, Partial<InventoryItem>>>({});
  
  const monthKey = format(selectedMonth, 'yyyy-MM');
  const monthName = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });

  // Sign in anonymously if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  // Query to fetch items for the selected month
  const monthItemsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'monthly_records', monthKey, 'items');
  }, [db, user, monthKey]);

  const { data: remoteItems, isLoading: isFetchingMonth } = useCollection(monthItemsQuery);

  // Columns definition (without the calculated "Total")
  const columns: InventoryColumn[] = [
    { id: 'code', header: 'N.º', type: 'text' },
    { id: 'item', header: 'Publicação', type: 'text' },
    { id: 'previous', header: 'Estoque Anterior', type: 'number' },
    { id: 'received', header: 'Recebido', type: 'number' },
    { id: 'current', header: 'Estoque Atual', type: 'number' },
    { id: 'outgoing', header: 'Saída', type: 'calculated' },
  ];

  // Merge official list with remote data
  const items = useMemo(() => {
    return OFFICIAL_PUBLICATIONS.map((pub, idx) => {
      const id = pub.code || `cat_${idx}`;
      const remote = remoteItems?.find(i => i.id === id);
      const local = localData[id] || {};
      
      return {
        ...pub,
        id,
        previous: local.previous ?? remote?.previous ?? 0,
        received: local.received ?? remote?.received ?? 0,
        current: local.current ?? remote?.current ?? 0,
      } as InventoryItem;
    });
  }, [remoteItems, localData]);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.abbr && item.abbr.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm]);

  const calculateOutgoing = (item: InventoryItem) => {
    const total = (Number(item.previous) || 0) + (Number(item.received) || 0);
    const current = Number(item.current) || 0;
    return total - current;
  };

  const handleUpdateItem = (id: string, field: string, value: number) => {
    if (!user || !db) return;

    // Update local state for immediate feedback
    setLocalData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));

    // Persist to Firestore
    const docRef = doc(db, 'users', user.uid, 'monthly_records', monthKey, 'items', id);
    const itemData = items.find(i => i.id === id);
    if (itemData) {
      setDocumentNonBlocking(docRef, {
        ...itemData,
        [field]: value,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  };

  const handlePrevMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

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
    link.setAttribute("download", `inventario_${monthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-3 bg-neutral-100 p-1 rounded-lg border">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-4 font-bold text-sm uppercase tracking-wider min-w-[180px] justify-center">
            <CalendarIcon className="h-4 w-4 text-primary" />
            {monthName}
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="gap-2 h-11 font-bold uppercase text-xs">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* Loading Overlay */}
      <div className="relative bg-white rounded-xl shadow-md border border-border overflow-hidden">
        {isFetchingMonth && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-bold uppercase text-muted-foreground">Carregando dados...</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.id} className="font-bold text-foreground py-4 px-3 text-[10px] uppercase tracking-wider text-center border-r last:border-0">
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                if (item.isCategory) {
                  return (
                    <TableRow key={item.id} className="bg-neutral-100/80 hover:bg-neutral-100/80 border-b-2 border-neutral-200">
                      <TableCell colSpan={columns.length} className="py-2 px-4 font-black text-[11px] uppercase text-neutral-600 tracking-widest">
                        {item.item}
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={item.id} className="hover:bg-accent/5 transition-colors border-b last:border-0 group">
                    {columns.map((col) => (
                      <TableCell key={col.id} className="p-1 px-3 border-r last:border-0">
                        {col.id === 'outgoing' ? (
                          <div className={cn(
                            "py-2 font-black rounded text-sm text-center",
                            calculateOutgoing(item) < 0 ? "text-destructive bg-destructive/10" : "text-accent-foreground bg-accent/10"
                          )}>
                            {calculateOutgoing(item)}
                          </div>
                        ) : col.id === 'code' ? (
                          <div className="text-center text-[11px] font-bold text-neutral-400">{item.code}</div>
                        ) : col.id === 'item' ? (
                          <div className="flex justify-between items-center gap-2 min-w-[240px]">
                            <span className="text-sm font-medium text-foreground">{item.item}</span>
                            {item.abbr && <span className="text-[9px] font-black bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded uppercase">{item.abbr}</span>}
                          </div>
                        ) : (
                          <Input
                            type="number"
                            value={item[col.id] as number}
                            onChange={(e) => handleUpdateItem(item.id, col.id, Number(e.target.value))}
                            className="border-transparent hover:border-input focus:bg-white focus:ring-1 focus:ring-primary h-9 text-sm text-center font-bold transition-all bg-transparent group-hover:bg-white/50"
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
          Os dados são salvos automaticamente para o mês de {monthName}
        </p>
      </div>
    </div>
  );
}
